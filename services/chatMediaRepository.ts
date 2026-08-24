import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';
import { chatRepository } from '@/services/chatRepository';

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

function imageExtension(fileName: string | null | undefined, mimeType: string) {
  const fileExtension = fileName?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fileExtension && fileExtension.length <= 5) return fileExtension === 'jpeg' ? 'jpg' : fileExtension;
  const mimeExtension = mimeType.split('/')[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return mimeExtension === 'jpeg' ? 'jpg' : mimeExtension || 'jpg';
}

export interface ChatMediaRepository {
  sendImage(input: SendChatImageInput): Promise<string>;
}

class FirebaseChatMediaRepository implements ChatMediaRepository {
  async sendImage(input: SendChatImageInput): Promise<string> {
    if (!input.roomId || !input.senderId) throw new Error('CHAT_PARTICIPANT_REQUIRED');
    if (!input.localUri) throw new Error('CHAT_IMAGE_REQUIRED');
    if (typeof input.fileSize === 'number' && input.fileSize > MAX_CHAT_IMAGE_BYTES) {
      throw new Error('CHAT_IMAGE_TOO_LARGE');
    }

    const response = await fetch(input.localUri);
    if (!response.ok) throw new Error('CHAT_IMAGE_READ_FAILED');
    const blob = await response.blob();
    const contentType = input.mimeType?.trim() || blob.type || 'image/jpeg';
    if (!contentType.startsWith('image/')) throw new Error('CHAT_IMAGE_TYPE_INVALID');
    if (blob.size > MAX_CHAT_IMAGE_BYTES) throw new Error('CHAT_IMAGE_TOO_LARGE');

    const extension = imageExtension(input.fileName, contentType);
    const storagePath = `chat-media/${input.roomId}/${input.senderId}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const storageReference = ref(storage, storagePath);
    let uploaded = false;

    try {
      await uploadBytes(storageReference, blob, {
        contentType,
        customMetadata: { roomId: input.roomId, senderId: input.senderId },
      });
      uploaded = true;
      const downloadUrl = await getDownloadURL(storageReference);
      return await chatRepository.sendImageMessage(input.roomId, input.senderId, {
        downloadUrl,
        storagePath,
        mimeType: contentType,
        ...(typeof input.width === 'number' ? { width: input.width } : {}),
        ...(typeof input.height === 'number' ? { height: input.height } : {}),
        byteSize: blob.size,
      });
    } catch (error) {
      if (uploaded) {
        await deleteObject(storageReference).catch((cleanupError) => {
          console.error('전송 실패 이미지 정리 실패:', cleanupError);
        });
      }
      throw error;
    } finally {
      (blob as Blob & { close?: () => void }).close?.();
    }
  }
}

export const chatMediaRepository: ChatMediaRepository = new FirebaseChatMediaRepository();
