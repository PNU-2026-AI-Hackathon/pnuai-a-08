import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Book } from '@/models/Book';
import { ReadingRecord } from '@/models/ReadingRecord';
import { bookRepository } from '@/services/bookRepository';
import { readingRecordRepository } from '@/services/readingRecordRepository';

export type ReadingLibraryItem = {
  book: Book;
  record?: ReadingRecord;
};

export function useMyReadingLibrary(userId: string) {
  const [items, setItems] = useState<ReadingLibraryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [books, records] = await Promise.all([
        bookRepository.getHomeBooks(userId),
        readingRecordRepository.listByUser(userId),
      ]);
      const recordByBookId = new Map(records.map((record) => [record.bookId, record]));
      setItems(books.owned.map((book) => ({ book, record: recordByBookId.get(book.id) })));
    } catch (loadError) {
      console.error('나의 기록 조회 실패:', loadError);
      setError('나의 기록을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  return { items, isLoading, error, reload: load };
}
