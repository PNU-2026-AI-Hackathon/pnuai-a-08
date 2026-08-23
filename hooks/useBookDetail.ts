import { useEffect, useState } from 'react';

import { Book } from '@/models/Book';
import { bookRepository } from '@/services/bookRepository';

export function useBookDetail(bookId: string) {
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!bookId) {
        if (isActive) {
          setBook(null);
          setError(null);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const nextBook = await bookRepository.getBookById(bookId);
        if (!nextBook) throw new Error('BOOK_NOT_FOUND');
        if (isActive) setBook(nextBook);
      } catch {
        if (isActive) setError('책 정보를 불러오지 못했어요.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [bookId]);

  return { book, isLoading, error };
}
