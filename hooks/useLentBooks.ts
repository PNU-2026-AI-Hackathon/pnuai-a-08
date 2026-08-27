import { useCallback, useEffect, useState } from 'react';

import { LentBook } from '@/models/LentBook';
import { rentalRepository } from '@/services/rentalRepository';

export function useLentBooks(ownerId: string) {
  const [books, setBooks] = useState<LentBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setBooks(await rentalRepository.getLentBooks(ownerId));
    } catch {
      setError('대여 목록을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { books, isLoading, error, reload };
}
