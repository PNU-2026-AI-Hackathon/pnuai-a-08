import {
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
import { ChatMessage, MeetingProposal } from '@/models/ChatMessage';
import { ChatRoom } from '@/models/ChatRoom';
import { mapChatRoom, toIsoString } from '@/services/firestoreMappers';

export interface ChatRepository {
  getRooms(userId: string): Promise<ChatRoom[]>;
  getRoom(roomId: string, userId: string): Promise<ChatRoom | null>;
  subscribeRooms(
    userId: string,
    onRooms: (rooms: ChatRoom[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  sendMessage(roomId: string, senderId: string, text: string): Promise<string>;
  subscribeMessages(
    roomId: string,
    userId: string,
    onMessages: (messages: ChatMessage[]) => void,
    onError: (error: Error) => void,
  ): Unsubscribe;
  createMeetingProposal(roomId: string, senderId: string, meeting: MeetingProposal): Promise<string>;
  acceptMeetingProposal(roomId: string, messageId: string, userId: string): Promise<void>;
}

class FirestoreChatRepository implements ChatRepository {
  private async mapRoom(snapshot: Parameters<typeof mapChatRoom>[0], userId: string) {
    const data = snapshot.data() ?? {};
    const otherUserId = (data.participantIds as string[] | undefined)?.find((id) => id !== userId);
    const [otherUser, loanRequest] = await Promise.all([
      otherUserId ? getDoc(doc(db, 'users', otherUserId)) : Promise.resolve(null),
      data.requestId ? getDoc(doc(db, 'loanRequests', data.requestId)) : Promise.resolve(null),
    ]);
    const otherUserData = otherUser?.exists() ? otherUser.data() : undefined;
    const displayName = otherUserData
      ? otherUserData.nickname ?? otherUserData.displayName ?? '서로서가 사용자'
      : '서로서가 사용자';
    const requestStatus = loanRequest?.exists() ? loanRequest.data().status : undefined;
    const room = mapChatRoom(snapshot, userId, displayName, otherUserData?.photoURL, requestStatus);
    const place = loanRequest?.exists() ? loanRequest.data().lendingPlace : undefined;
    if (place && typeof place === 'object') {
      room.lendingPlace = {
        name: typeof place.name === 'string' ? place.name : '부산대학교 장전캠퍼스',
        address: typeof place.address === 'string' ? place.address : '',
        latitude: typeof place.latitude === 'number' ? place.latitude : undefined,
        longitude: typeof place.longitude === 'number' ? place.longitude : undefined,
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
    return this.sortRooms(await Promise.all(snapshot.docs.map((room) => this.mapRoom(room, userId))));
  }

  async getRoom(roomId: string, userId: string): Promise<ChatRoom | null> {
    if (!roomId || !userId) return null;
    const snapshot = await getDoc(doc(db, 'chatRooms', roomId));
    if (!snapshot.exists()) return null;
    const participantIds = snapshot.data().participantIds as string[] | undefined;
    if (!participantIds?.includes(userId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
    return this.mapRoom(snapshot, userId);
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
          .then((rooms) => onRooms(this.sortRooms(rooms)))
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
      if (!participantIds?.includes(senderId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
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
          const toPlace = (value: unknown) => {
            const place = value && typeof value === 'object' ? value as Record<string, unknown> : {};
            return {
              name: typeof place.name === 'string' ? place.name : '장소 미정',
              address: typeof place.address === 'string' ? place.address : '',
              latitude: typeof place.latitude === 'number' ? place.latitude : undefined,
              longitude: typeof place.longitude === 'number' ? place.longitude : undefined,
            };
          };
          return {
            id: message.id,
            senderId: typeof data.senderId === 'string' ? data.senderId : '',
            type: data.type === 'MEETING' ? 'MEETING' : 'TEXT',
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
          };
        });
        onMessages(messages);
      },
      onError,
    );
  }

  async createMeetingProposal(roomId: string, senderId: string, meeting: MeetingProposal): Promise<string> {
    if (new Date(meeting.returnAt).getTime() <= new Date(meeting.loanAt).getTime()) {
      throw new Error('RETURN_MUST_BE_AFTER_LOAN');
    }
    const roomReference = doc(db, 'chatRooms', roomId);
    const messageReference = doc(collection(roomReference, 'messages'));
    await runTransaction(db, async (transaction) => {
      const room = await transaction.get(roomReference);
      if (!room.exists()) throw new Error('CHAT_ROOM_NOT_FOUND');
      const participantIds = room.data().participantIds as string[] | undefined;
      if (!participantIds?.includes(senderId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
      transaction.set(messageReference, {
        messageId: messageReference.id,
        senderId,
        type: 'MEETING',
        text: '약속을 만들었어요',
        meeting: {
          loanAt: new Date(meeting.loanAt),
          loanPlace: meeting.loanPlace,
          returnAt: new Date(meeting.returnAt),
          returnPlace: meeting.returnPlace,
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
      if (!participantIds?.includes(userId)) throw new Error('CHAT_PARTICIPANT_REQUIRED');
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
}

export const chatRepository: ChatRepository = new FirestoreChatRepository();
