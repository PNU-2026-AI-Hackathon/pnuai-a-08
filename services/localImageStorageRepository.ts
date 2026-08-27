import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';

export type UploadLocalImageInput = {
  localUri: string;
  storagePath: string | ((contentType: string) => string);
  contentType?: string | null;
  maxBytes?: number;
  customMetadata?: Record<string, string>;
  logLabel?: string;
};

export type UploadedLocalImage = {
  url: string;
  storagePath: string;
  contentType: string;
  byteSize: number;
};

export function imageExtension(fileName: string | null | undefined, mimeType: string) {
  const fileExtension = fileName?.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (fileExtension && fileExtension.length <= 5) return fileExtension === 'jpeg' ? 'jpg' : fileExtension;
  const mimeExtension = mimeType.split('/')[1]?.toLowerCase().replace(/[^a-z0-9]/g, '');
  return mimeExtension === 'jpeg' ? 'jpg' : mimeExtension || 'jpg';
}

export async function uploadLocalImage(input: UploadLocalImageInput): Promise<UploadedLocalImage> {
  const response = await fetch(input.localUri);
  if (!response.ok) throw new Error('IMAGE_FILE_READ_FAILED');
  const blob = await response.blob();
  const contentType = input.contentType?.trim() || blob.type || 'image/jpeg';
  const storagePath = typeof input.storagePath === 'function'
    ? input.storagePath(contentType)
    : input.storagePath;

  try {
    if (!contentType.startsWith('image/')) throw new Error('IMAGE_TYPE_INVALID');
    if (typeof input.maxBytes === 'number' && blob.size > input.maxBytes) {
      throw new Error('IMAGE_TOO_LARGE');
    }

    const reference = ref(storage, storagePath);
    console.log(`${input.logLabel ?? 'Image'} upload start:`, {
      localUri: input.localUri,
      storagePath,
      contentType,
      size: blob.size,
    });
    await uploadBytes(reference, blob, {
      contentType,
      customMetadata: input.customMetadata,
    });
    return {
      url: await getDownloadURL(reference),
      storagePath,
      contentType,
      byteSize: blob.size,
    };
  } catch (error) {
    const firebaseError = error as {
      code?: string;
      message?: string;
      customData?: { serverResponse?: string };
      serverResponse?: string;
    };
    console.error(`${input.logLabel ?? 'Image'} upload failed:`, {
      code: firebaseError.code,
      message: firebaseError.message,
      serverResponse: firebaseError.customData?.serverResponse ?? firebaseError.serverResponse,
      localUri: input.localUri,
      storagePath,
      contentType,
      size: blob.size,
    });
    throw error;
  } finally {
    (blob as Blob & { close?: () => void }).close?.();
  }
}
