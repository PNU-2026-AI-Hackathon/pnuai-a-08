import { useEffect, useState } from 'react';

import { Book } from '@/models/Book';
import { bookRepository } from '@/services/bookRepository';

export function useExploreBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const nextBooks = await bookRepository.getExploreBooks();
        if (isActive) {
          setBooks(nextBooks);
        }
      } catch {
        if (isActive) {
          setError('탐색 목록을 불러오지 못했어요.');
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isActive = false;
    };
  }, []);

  return { books, isLoading, error };
}

