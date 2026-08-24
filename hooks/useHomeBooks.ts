import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { bookRepository, HomeBooks } from '@/services/bookRepository';
import { rentalRepository } from '@/services/rentalRepository';

const emptyBooks: HomeBooks = {
  borrowed: [],
  owned: [],
};

export function useHomeBooks(userId: string) {
  const [books, setBooks] = useState<HomeBooks>(emptyBooks);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await rentalRepository.syncDueLoans(userId);
      setBooks(await bookRepository.getHomeBooks(userId));
    } catch {
      setError('책 정보를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    ...books,
    isLoading,
    error,
    reload: load,
  };
}
