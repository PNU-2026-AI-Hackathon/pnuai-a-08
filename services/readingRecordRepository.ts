import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { ReadingRecord, ReadingStatus } from '@/models/ReadingRecord';
import { mapReadingRecord } from '@/services/firestoreMappers';

export type SaveReadingRecordInput = {
  bookId: string;
  userId: string;
  status: ReadingStatus;
  totalPages?: number;
  currentPage: number;
  startedAt: string;
  finishedAt?: string;
  rating?: number;
  oneLineReview?: string;
};

function recordId(userId: string, bookId: string) {
  return `${userId}_${bookId}`;
}

export const readingRecordRepository = {
  async get(bookId: string, userId: string): Promise<ReadingRecord | null> {
    if (!bookId || !userId) return null;
    const snapshot = await getDoc(doc(db, 'records', recordId(userId, bookId)));
    return snapshot.exists() ? mapReadingRecord(snapshot) : null;
  },

  async listByUser(userId: string): Promise<ReadingRecord[]> {
    if (!userId) return [];
    const snapshot = await getDocs(
      query(collection(db, 'records'), where('userId', '==', userId)),
    );
    return snapshot.docs.map((record) => mapReadingRecord(record));
  },

  async save(input: SaveReadingRecordInput): Promise<void> {
    if (!input.bookId || !input.userId) throw new Error('READING_RECORD_OWNER_REQUIRED');
    const reference = doc(db, 'records', recordId(input.userId, input.bookId));
    await runTransaction(db, async (transaction) => {
      const previous = await transaction.get(reference);
      const previousCreatedAt = previous.exists() ? previous.data().createdAt : null;
      transaction.set(reference, {
        recordId: reference.id,
        bookId: input.bookId,
        userId: input.userId,
        status: input.status,
        totalPages: input.totalPages ?? null,
        currentPage: input.currentPage,
        startedAt: new Date(input.startedAt),
        finishedAt: input.status === 'COMPLETED' && input.finishedAt ? new Date(input.finishedAt) : null,
        rating: input.status === 'COMPLETED' ? input.rating ?? null : null,
        oneLineReview: input.oneLineReview?.trim().slice(0, 500) ?? '',
        createdAt: previousCreatedAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
  },
};
