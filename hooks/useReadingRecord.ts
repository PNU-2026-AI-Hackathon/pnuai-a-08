import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { ReadingRecord } from '@/models/ReadingRecord';
import { readingRecordRepository } from '@/services/readingRecordRepository';

export function useReadingRecord(bookId: string, userId: string) {
  const [record, setRecord] = useState<ReadingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const load = async () => {
      if (!bookId || !userId) {
        if (active) { setRecord(null); setError(null); setIsLoading(false); }
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const next = await readingRecordRepository.get(bookId, userId);
        if (active) setRecord(next);
      } catch {
        if (active) setError('독서 기록을 불러오지 못했어요.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [bookId, userId]));

  return { record, isLoading, error };
}
