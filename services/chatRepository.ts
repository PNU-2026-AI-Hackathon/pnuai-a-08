import {
  DocumentData,
  DocumentReference,
  Transaction,
  Unsubscribe,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { ChatReportReason } from '@/models/ChatModeration';
import {
  ChatImageAttachment,
  ChatMessage,
  MeetingPlace,
  MeetingProposal,
} from '@/models/ChatMessage';
import { ChatRoom } from '@/models/ChatRoom';
import { mapChatRoom, toIsoString } from '@/services/firestoreMappers';

function normalizeMeetingPlace(place: MeetingPlace): MeetingPlace {
  const name = place.name.trim();
  const address = place.address.trim();
  if (!name) throw new Error('MEETING_PLACE_REQUIRED');

  return {
    ...(place.placeId?.trim() ? { placeId: place.placeId.trim() } : {}),
    name,
    address,
    ...(typeof place.latitude === 'number' && Number.isFinite(place.latitude)
      ? { latitude: place.latitude }
      : {}),
    ...(typeof place.longitude === 'number' && Number.isFinite(place.longitude)
      ? { longitude: place.longitude }
      : {}),
    ...(place.placeUrl?.trim() ? { placeUrl: place.placeUrl.trim() } : {}),
  };
}

export interface ChatRepository {
  getRooms(userId: string): Promise<ChatRoom[]>;
  getRoom(roomId: string, userId: string): Promise<ChatRoom | null>;
  subscribeRooms(
    userId: string,
    onRooms: (rooms: ChatRoom[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  sendMessage(roomId: string, senderId: string, text: string): Promise<string>;
  sendImageMessage(
    roomId: string,
    senderId: string,
    image: ChatImageAttachment,
  ): Promise<string>;
  subscribeMessages(
    roomId: string,
    userId: string,
    onMessages: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  createMeetingProposal(roomId: string, senderId: string, meeting: MeetingProposal): Promise<string>;
  acceptMeetingProposal(roomId: string, messageId: string, userId: string): Promise<void>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  blockUser(roomId: string, userId: string): Promise<void>;
  reportUser(roomId: string, userId: string, reason: ChatReportReason): Promise<string>;
  setNotificationsMuted(roomId: string, userId: string, muted: boolean): Promise<void>;
}

class FirestoreChatRepository implements ChatRepository {
  private memberSettingsReference(roomId: string, userId: string) {
    return doc(db, 'chatRooms', roomId, 'memberSettings', userId);
  }

  private blockReference(blockerId: string, blockedUserId: string) {
    return doc(db, 'users', blockerId, 'blockedUsers', blockedUserId);
  }

  private otherParticipantId(participantIds: string[] | undefined, userId: string) {
    if (!participantIds?.includes(userId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
    const otherUserId = participantIds.find((id) => id !== userId);
    if (!otherUserId) throw new Error('CHAT_OTHER_USER_NOT_FOUND');
    return otherUserId;
  }

  private async assertCanCommunicate(
    transaction: Transaction,
    roomReference: DocumentReference<DocumentData>,
    participantIds: string[] | undefined,
    userId: string,
  ) {
    const otherUserId = this.otherParticipantId(participantIds, userId);
    const [memberSettings, ownBlock, reverseBlock] = await Promise.all([
      transaction.get(this.memberSettingsReference(roomReference.id, userId)),
      transaction.get(this.blockReference(userId, otherUserId)),
      transaction.get(this.blockReference(otherUserId, userId)),
    ]);
    if (memberSettings.exists() && memberSettings.data().active === false) {
      throw new Error('CHAT_ROOM_LEFT');
    }
    if (ownBlock.exists() || reverseBlock.exists()) throw new Error('CHAT_USER_BLOCKED');
    return otherUserId;
  }

  private async mapRoom(snapshot: Parameters<typeof mapChatRoom>[0], userId: string) {
    const data = snapshot.data() ?? {};
    const otherUserId = (data.participantIds as string[] | undefined)?.find((id) => id !== userId);
    const [otherUser, loanRequest, memberSettings, block] = await Promise.all([
      otherUserId ? getDoc(doc(db, 'users', otherUserId)) : Promise.resolve(null),
      data.requestId ? getDoc(doc(db, 'loanRequests', data.requestId)) : Promise.resolve(null),
      getDoc(this.memberSettingsReference(snapshot.id, userId)),
      otherUserId ? getDoc(this.blockReference(userId, otherUserId)) : Promise.resolve(null),
    ]);
    const otherUserData = otherUser?.exists() ? otherUser.data() : undefined;
    const displayName = otherUserData
      ? otherUserData.nickname ?? otherUserData.displayName ?? '서로서가 사용자'
      : '서로서가 사용자';
    const requestStatus = loanRequest?.exists() ? loanRequest.data().status : undefined;
    const memberData = memberSettings.exists() ? memberSettings.data() : undefined;
    const room = mapChatRoom(snapshot, userId, displayName, otherUserData?.photoURL, requestStatus, {
      isActive: memberData?.active !== false,
      notificationsMuted: memberData?.notificationsMuted === true,
      hasBlockedOtherUser: block?.exists() === true,
    });
    const place = loanRequest?.exists() ? loanRequest.data().lendingPlace : undefined;
    if (place && typeof place === 'object') {
      room.lendingPlace = {
        name: typeof place.name === 'string' ? place.name : '부산대학교 장전캠퍼스',
        address: typeof place.address === 'string' ? place.address : '',
        ...(typeof place.latitude === 'number' && Number.isFinite(place.latitude)
          ? { latitude: place.latitude }
          : {}),
        ...(typeof place.longitude === 'number' && Number.isFinite(place.longitude)
          ? { longitude: place.longitude }
          : {}),
      };
    }
    return room;
  }

  private sortRooms(rooms: ChatRoom[]) {
    return rooms.sort(
      (first, second) =>
        new Date(second.lastMessageAt).getTime() - new Date(first.lastMessageAt).getTime(),
    );
  }

  async getRooms(userId: string): Promise<ChatRoom[]> {
    if (!userId) return [];
    const snapshot = await getDocs(
      query(collection(db, 'chatRooms'), where('participantIds', 'array-contains', userId)),
    );
    const rooms = await Promise.all(snapshot.docs.map((room) => this.mapRoom(room, userId)));
    return this.sortRooms(
      rooms.filter((room) => room.memberSettings.isActive && !room.memberSettings.hasBlockedOtherUser),
    );
  }

  async getRoom(roomId: string, userId: string): Promise<ChatRoom | null> {
    if (!roomId || !userId) return null;
    const snapshot = await getDoc(doc(db, 'chatRooms', roomId));
    if (!snapshot.exists()) return null;
    const participantIds = snapshot.data().participantIds as string[] | undefined;
    if (!participantIds?.includes(userId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
    const room = await this.mapRoom(snapshot, userId);
    return room.memberSettings.isActive && !room.memberSettings.hasBlockedOtherUser ? room : null;
  }

  subscribeRooms(
    userId: string,
    onRooms: (rooms: ChatRoom[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    if (!userId) {
      onRooms([]);
      return () => undefined;
    }
    return onSnapshot(
      query(collection(db, 'chatRooms'), where('participantIds', 'array-contains', userId)),
      (snapshot) => {
        void Promise.all(snapshot.docs.map((room) => this.mapRoom(room, userId)))
          .then((rooms) => onRooms(this.sortRooms(
            rooms.filter((room) => room.memberSettings.isActive && !room.memberSettings.hasBlockedOtherUser),
          )))
          .catch((error: unknown) => onError(error instanceof Error ? error : new Error(String(error))));
      },
      (error) => onError(error),
    );
  }

  async sendMessage(roomId: string, senderId: string, text: string): Promise<string> {
    const message = text.trim();
    if (!message) throw new Error('MESSAGE_REQUIRED');
    const roomReference = doc(db, 'chatRooms', roomId);
    const messageReference = doc(collection(roomReference, 'messages'));

    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const participantIds = room.data().participantIds as string[] | undefined;
      await this.assertCanCommunicate(transaction, roomReference, participantIds, senderId);
      transaction.set(messageReference, {
        messageId: messageReference.id,
        senderId,
        type: 'TEXT',
        text: message,
        createdAt: serverTimestamp(),
      });
      transaction.update(roomReference, {
        lastMessage: message,
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return messageReference.id;
  }

  async sendImageMessage(
    roomId: string,
    senderId: string,
    image: ChatImageAttachment,
  ): Promise<string> {
    if (!image.downloadUrl || !image.storagePath || !image.mimeType.startsWith('image/')) {
      throw new Error('CHAT_IMAGE_INVALID');
    }
    const roomReference = doc(db, 'chatRooms', roomId);
    const messageReference = doc(collection(roomReference, 'messages'));

    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const participantIds = room.data().participantIds as string[] | undefined;
      await this.assertCanCommunicate(transaction, roomReference, participantIds, senderId);
      transaction.set(messageReference, {
        messageId: messageReference.id,
        senderId,
        type: 'IMAGE',
        text: '사진을 보냈어요',
        image: {
          downloadUrl: image.downloadUrl,
          storagePath: image.storagePath,
          mimeType: image.mimeType,
          ...(typeof image.width === 'number' && Number.isFinite(image.width)
            ? { width: image.width }
            : {}),
          ...(typeof image.height === 'number' && Number.isFinite(image.height)
            ? { height: image.height }
            : {}),
          ...(typeof image.byteSize === 'number' && Number.isFinite(image.byteSize)
            ? { byteSize: image.byteSize }
            : {}),
        },
        createdAt: serverTimestamp(),
      });
      transaction.update(roomReference, {
        lastMessage: '사진을 보냈어요',
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return messageReference.id;
  }

  subscribeMessages(
    roomId: string,
    userId: string,
    onMessages: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe {
    if (!roomId || !userId) {
      onMessages([]);
      return () => undefined;
    }
    return onSnapshot(
      query(collection(db, 'chatRooms', roomId, 'messages'), orderBy('createdAt', 'asc')),
      (snapshot) => {
        const messages = snapshot.docs.map((message): ChatMessage => {
          const data = message.data();
          const meetingData = data.meeting && typeof data.meeting === 'object' ? data.meeting : undefined;
          const imageData = data.image && typeof data.image === 'object'
            ? data.image as Record<string, unknown>
            : undefined;
          const toPlace = (value: unknown) => {
            const place = value && typeof value === 'object' ? value as Record<string, unknown> : {};
            return {
              ...(typeof place.placeId === 'string' && place.placeId ? { placeId: place.placeId } : {}),
              name: typeof place.name === 'string' ? place.name : '장소 미정',
              address: typeof place.address === 'string' ? place.address : '',
              ...(typeof place.latitude === 'number' && Number.isFinite(place.latitude)
                ? { latitude: place.latitude }
                : {}),
              ...(typeof place.longitude === 'number' && Number.isFinite(place.longitude)
                ? { longitude: place.longitude }
                : {}),
              ...(typeof place.placeUrl === 'string' && place.placeUrl ? { placeUrl: place.placeUrl } : {}),
            };
          };
          return {
            id: message.id,
            senderId: typeof data.senderId === 'string' ? data.senderId : '',
            type: data.type === 'MEETING' ? 'MEETING' : data.type === 'IMAGE' ? 'IMAGE' : 'TEXT',
            text: typeof data.text === 'string' ? data.text : '',
            createdAt: toIsoString(data.createdAt) ?? new Date().toISOString(),
            meeting: meetingData ? {
              loanAt: toIsoString(meetingData.loanAt) ?? '',
              loanPlace: toPlace(meetingData.loanPlace),
              returnAt: toIsoString(meetingData.returnAt) ?? '',
              returnPlace: toPlace(meetingData.returnPlace),
              status: meetingData.status === 'ACCEPTED' ? 'ACCEPTED' : 'PROPOSED',
              acceptedBy: typeof meetingData.acceptedBy === 'string' ? meetingData.acceptedBy : undefined,
              acceptedAt: toIsoString(meetingData.acceptedAt),
            } : undefined,
            image: imageData
              && typeof imageData.downloadUrl === 'string'
              && typeof imageData.storagePath === 'string'
              && typeof imageData.mimeType === 'string'
              ? {
                  downloadUrl: imageData.downloadUrl,
                  storagePath: imageData.storagePath,
                  mimeType: imageData.mimeType,
                  ...(typeof imageData.width === 'number' ? { width: imageData.width } : {}),
                  ...(typeof imageData.height === 'number' ? { height: imageData.height } : {}),
                  ...(typeof imageData.byteSize === 'number' ? { byteSize: imageData.byteSize } : {}),
                }
              : undefined,
          };
        });
        onMessages(messages);
      },
      onError,
    );
  }

  async createMeetingProposal(roomId: string, senderId: string, meeting: MeetingProposal): Promise<string> {
    const loanAt = new Date(meeting.loanAt);
    const returnAt = new Date(meeting.returnAt);
    if (Number.isNaN(loanAt.getTime()) || Number.isNaN(returnAt.getTime())) {
      throw new Error('MEETING_DATE_INVALID');
    }
    if (returnAt.getTime() <= loanAt.getTime()) {
      throw new Error('RETURN_MUST_BE_AFTER_LOAN');
    }
    const loanPlace = normalizeMeetingPlace(meeting.loanPlace);
    const returnPlace = normalizeMeetingPlace(meeting.returnPlace);
    const roomReference = doc(db, 'chatRooms', roomId);
    const messageReference = doc(collection(roomReference, 'messages'));
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const participantIds = room.data().participantIds as string[] | undefined;
      await this.assertCanCommunicate(transaction, roomReference, participantIds, senderId);
      transaction.set(messageReference, {
        messageId: messageReference.id,
        senderId,
        type: 'MEETING',
        text: '약속을 만들었어요',
        meeting: {
          loanAt,
          loanPlace,
          returnAt,
          returnPlace,
          status: 'PROPOSED',
        },
        createdAt: serverTimestamp(),
      });
      transaction.update(roomReference, {
        lastMessage: '약속을 만들었어요',
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return messageReference.id;
  }

  async acceptMeetingProposal(roomId: string, messageId: string, userId: string): Promise<void> {
    const roomReference = doc(db, 'chatRooms', roomId);
    const messageReference = doc(roomReference, 'messages', messageId);

    await runTransaction(db, async (transaction) => {
      const [room, message] = await Promise.all([
        transaction.get(roomReference),
        transaction.get(messageReference),
      ]);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      if (!message.exists()) throw new Error('MEETING_NOT_FOUND');
      const roomData = room.data();
      const messageData = message.data();
      const participantIds = roomData.participantIds as string[] | undefined;
      await this.assertCanCommunicate(transaction, roomReference, participantIds, userId);
      if (messageData.senderId === userId) throw new Error('MEETING_SENDER_CANNOT_ACCEPT');
      if (messageData.type !== 'MEETING' || !messageData.meeting) throw new Error('MEETING_NOT_FOUND');
      if (messageData.meeting.status === 'ACCEPTED') return;

      const requestReference = doc(db, 'loanRequests', roomData.requestId);
      const bookReference = doc(db, 'books', roomData.bookId);
      const [request, book] = await Promise.all([
        transaction.get(requestReference),
        transaction.get(bookReference),
      ]);
      if (!request.exists()) throw new Error('LOAN_REQUEST_NOT_FOUND');
      if (!book.exists()) throw new Error('BOOK_NOT_FOUND');
      if (book.data().status !== 'AVAILABLE') throw new Error('BOOK_NOT_AVAILABLE');
      if (request.data().status !== 'REQUESTED') throw new Error('LOAN_REQUEST_NOT_REQUESTED');
      if (request.data().borrowerId !== roomData.borrowerId || request.data().ownerId !== roomData.ownerId) {
        throw new Error('LOAN_REQUEST_MISMATCH');
      }

      const meeting = messageData.meeting;
      transaction.update(messageReference, {
        'meeting.status': 'ACCEPTED',
        'meeting.acceptedBy': userId,
        'meeting.acceptedAt': serverTimestamp(),
      });
      transaction.update(requestReference, {
        status: 'SCHEDULED',
        meetingMessageId: messageId,
        loanAt: meeting.loanAt,
        dueAt: meeting.returnAt,
        lendingPlace: meeting.loanPlace,
        returnPlace: meeting.returnPlace,
        respondedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      transaction.update(bookReference, {
        status: 'RESERVED',
        borrowerId: roomData.borrowerId,
        reservedRequestId: roomData.requestId,
        loanAt: meeting.loanAt,
        dueAt: meeting.returnAt,
        lendingPlace: meeting.loanPlace,
        returnPlace: meeting.returnPlace,
        updatedAt: serverTimestamp(),
      });
      transaction.update(roomReference, {
        status: 'SCHEDULED',
        lastMessage: '대여 약속이 성사됐어요',
        lastMessageSenderId: userId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async leaveRoom(roomId: string, userId: string): Promise<void> {
    const roomReference = doc(db, 'chatRooms', roomId);
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      this.otherParticipantId(room.data().participantIds as string[] | undefined, userId);
      transaction.set(this.memberSettingsReference(roomId, userId), {
        userId,
        active: false,
        leftAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.update(roomReference, { memberSettingsUpdatedAt: serverTimestamp() });
    });
  }

  async blockUser(roomId: string, userId: string): Promise<void> {
    const roomReference = doc(db, 'chatRooms', roomId);
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const otherUserId = this.otherParticipantId(
        room.data().participantIds as string[] | undefined,
        userId,
      );
      const blockReference = this.blockReference(userId, otherUserId);
      const existingBlock = await transaction.get(blockReference);
      transaction.set(blockReference, {
        blockerId: userId,
        blockedUserId: otherUserId,
        sourceRoomId: roomId,
        ...(existingBlock.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.set(this.memberSettingsReference(roomId, userId), {
        userId,
        active: false,
        notificationsMuted: true,
        blockedUserId: otherUserId,
        blockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.update(roomReference, { memberSettingsUpdatedAt: serverTimestamp() });
    });
  }

  async reportUser(roomId: string, userId: string, reason: ChatReportReason): Promise<string> {
    const roomReference = doc(db, 'chatRooms', roomId);
    const reportReference = doc(collection(db, 'chatReports'));
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const roomData = room.data();
      const reportedUserId = this.otherParticipantId(
        roomData.participantIds as string[] | undefined,
        userId,
      );
      transaction.set(reportReference, {
        reportId: reportReference.id,
        roomId,
        requestId: roomData.requestId ?? null,
        bookId: roomData.bookId ?? null,
        reporterId: userId,
        reportedUserId,
        reason,
        status: 'PENDING',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return reportReference.id;
  }

  async setNotificationsMuted(roomId: string, userId: string, muted: boolean): Promise<void> {
    const roomReference = doc(db, 'chatRooms', roomId);
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      this.otherParticipantId(room.data().participantIds as string[] | undefined, userId);
      transaction.set(this.memberSettingsReference(roomId, userId), {
        userId,
        active: true,
        notificationsMuted: muted,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      transaction.update(roomReference, { memberSettingsUpdatedAt: serverTimestamp() });
    });
  }
}

export const chatRepository: ChatRepository = new FirestoreChatRepository();
