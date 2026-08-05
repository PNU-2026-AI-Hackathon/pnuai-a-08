import { useEffect, useState } from 'react';

import { AvailableBook } from '@/models/AvailableBook';
import { rentalRepository } from '@/services/rentalRepository';

export function useAvailableBooks(currentUserId: string) {
  const [books, setBooks] = useState<AvailableBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextBooks = await rentalRepository.getAvailableBooks(currentUserId);
        if (isActive) setBooks(nextBooks);
      } catch {
        if (isActive) setError('대여 가능한 책을 불러오지 못했어요.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [currentUserId]);

  return { books, isLoading, error };
}

