import { deleteObject, ref } from 'firebase/storage';

import { storage } from '@/lib/firebase';
import { imageExtension, uploadLocalImage } from '@/services/localImageStorageRepository';

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

    const uploaded = await uploadLocalImage({
      localUri,
      storagePath: (contentType) => {
        const extension = imageExtension(null, contentType);
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
        return `book-covers/${ownerId}/${fileName}`;
      },
      customMetadata: { ownerId },
      logLabel: 'Book cover',
    });
    return { storagePath: uploaded.storagePath, url: uploaded.url };
  }

  async delete(storagePath: string): Promise<void> {
    if (!storagePath) return;
    await deleteObject(ref(storage, storagePath));
  }
}

export const bookCoverRepository: BookCoverRepository = new FirebaseBookCoverRepository();
