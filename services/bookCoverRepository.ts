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

    await uploadBytes(reference, blob, { contentType });
    return { storagePath, url: await getDownloadURL(reference) };
  }

  async delete(storagePath: string): Promise<void> {
    if (!storagePath) return;
    await deleteObject(ref(storage, storagePath));
  }
}

export const bookCoverRepository: BookCoverRepository = new FirebaseBookCoverRepository();
