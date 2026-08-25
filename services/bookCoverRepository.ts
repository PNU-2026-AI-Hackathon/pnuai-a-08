import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';

export type UploadedBookCover = {
  url: string;
  storagePath: string;
};

export interface BookCoverRepository {
  upload(ownerId: string, localUri: string): Promise<UploadedBookCover>;
  delete(storagePath: string): Promise<void>;
}

class FirebaseBookCoverRepository implements BookCoverRepository {
  async upload(ownerId: string, localUri: string): Promise<UploadedBookCover> {
    if (!ownerId) throw new Error('AUTH_REQUIRED');

    const response = await fetch(localUri);
    if (!response.ok) throw new Error('COVER_FILE_READ_FAILED');
    const blob = await response.blob();
    const contentType = blob.type || 'image/jpeg';
    const extension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
    const storagePath = `book-covers/${ownerId}/${fileName}`;
    const reference = ref(storage, storagePath);

    try {
      console.log('Book cover upload start:', {
        localUri,
        storagePath,
        contentType,
        size: blob.size,
      });
      await uploadBytes(reference, blob, {
        contentType,
        customMetadata: { ownerId },
      });
      return { storagePath, url: await getDownloadURL(reference) };
    } catch (error) {
      const firebaseError = error as {
        code?: string;
        message?: string;
        customData?: { serverResponse?: string };
        serverResponse?: string;
      };
      console.error('Book cover upload failed:', {
        code: firebaseError.code,
        message: firebaseError.message,
        serverResponse: firebaseError.customData?.serverResponse ?? firebaseError.serverResponse,
        localUri,
        storagePath,
        contentType,
        size: blob.size,
      });
      throw error;
    } finally {
      (blob as Blob & { close?: () => void }).close?.();
    }
  }

  async delete(storagePath: string): Promise<void> {
    if (!storagePath) return;
    await deleteObject(ref(storage, storagePath));
  }
}

export const bookCoverRepository: BookCoverRepository = new FirebaseBookCoverRepository();
