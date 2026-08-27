import { doc, getDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';

import { auth, db, storage } from '@/lib/firebase';
import { chatRepository } from '@/services/chatRepository';
import { imageExtension, uploadLocalImage } from '@/services/localImageStorageRepository';

const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024;

export type SendChatImageInput = {
  roomId: string;
  senderId: string;
  localUri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  width?: number;
  height?: number;
};

export interface ChatMediaRepository {
  sendImage(input: SendChatImageInput): Promise<string>;
}

async function getChatUploadDiagnostics(roomId: string, senderId: string) {
  const currentAuthUid = auth.currentUser?.uid ?? null;
  const roomSnapshot = await getDoc(doc(db, 'chatRooms', roomId));
  const roomData = roomSnapshot.exists() ? roomSnapshot.data() : null;
  const participantIds = Array.isArray(roomData?.participantIds)
    ? roomData.participantIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    roomId,
    senderId,
    currentAuthUid,
    roomExists: roomSnapshot.exists(),
    participantIds,
    senderMatchesAuth: currentAuthUid === senderId,
    senderInParticipants: participantIds.includes(senderId),
    authInParticipants: currentAuthUid ? participantIds.includes(currentAuthUid) : false,
  };
}

class FirebaseChatMediaRepository implements ChatMediaRepository {
  async sendImage(input: SendChatImageInput): Promise<string> {
    if (!input.roomId || !input.senderId) throw new Error('CHAT_PARTICIPANT_REQUIRED');
    if (!input.localUri) throw new Error('CHAT_IMAGE_REQUIRED');
    if (typeof input.fileSize === 'number' && input.fileSize > MAX_CHAT_IMAGE_BYTES) {
      throw new Error('CHAT_IMAGE_TOO_LARGE');
    }

    const contentType = input.mimeType?.trim() || 'image/jpeg';
    const extension = imageExtension(input.fileName, contentType);
    const storagePath = `chat-media/${input.roomId}/${input.senderId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    let uploadedStoragePath: string | null = null;
    let diagnostics: Awaited<ReturnType<typeof getChatUploadDiagnostics>> | null = null;

    try {
      diagnostics = await getChatUploadDiagnostics(input.roomId, input.senderId);
      console.log('Chat image upload diagnostics:', {
        ...diagnostics,
        storagePath,
        contentType,
        fileSize: input.fileSize,
      });
      const uploaded = await uploadLocalImage({
        localUri: input.localUri,
        storagePath,
        contentType,
        maxBytes: MAX_CHAT_IMAGE_BYTES,
        customMetadata: { roomId: input.roomId, senderId: input.senderId },
        logLabel: 'Chat image',
      });
      uploadedStoragePath = uploaded.storagePath;
      return await chatRepository.sendImageMessage(input.roomId, input.senderId, {
        downloadUrl: uploaded.url,
        storagePath: uploaded.storagePath,
        mimeType: uploaded.contentType,
        ...(typeof input.width === 'number' ? { width: input.width } : {}),
        ...(typeof input.height === 'number' ? { height: input.height } : {}),
        byteSize: uploaded.byteSize,
      });
    } catch (error) {
      if (uploadedStoragePath) {
        await deleteObject(ref(storage, uploadedStoragePath)).catch((cleanupError) => {
          console.error('전송 실패 이미지 정리 실패:', cleanupError);
        });
      }
      const errorMessage = error instanceof Error ? error.message : '';
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'storage/unauthorized') {
        console.error('Chat image upload unauthorized diagnostics:', {
          ...diagnostics,
          storagePath,
          contentType,
          firebaseCode: firebaseError.code,
          firebaseMessage: firebaseError.message,
        });
      }
      if (errorMessage === 'IMAGE_FILE_READ_FAILED') throw new Error('CHAT_IMAGE_READ_FAILED');
      if (errorMessage === 'IMAGE_TYPE_INVALID') throw new Error('CHAT_IMAGE_TYPE_INVALID');
      if (errorMessage === 'IMAGE_TOO_LARGE') throw new Error('CHAT_IMAGE_TOO_LARGE');
      throw error;
    }
  }
}

export const chatMediaRepository: ChatMediaRepository = new FirebaseChatMediaRepository();
