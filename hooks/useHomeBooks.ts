import { useCallback, useEffect, useState } from 'react';

import { bookRepository, HomeBooks } from '@/services/bookRepository';

const emptyBooks: HomeBooks = {
  borrowed: [],
  owned: [],
};

export function useHomeBooks() {
  const [books, setBooks] = useState<HomeBooks>(emptyBooks);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setBooks(await bookRepository.getHomeBooks());
    } catch {
      setError('책 정보를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    ...books,
    isLoading,
    error,
    reload: load,
  };
}

