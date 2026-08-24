import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { BorrowedRental } from '@/models/BorrowedRental';
import { rentalRepository } from '@/services/rentalRepository';

export function useBorrowedRentals(borrowerId: string) {
  const [rentals, setRentals] = useState<BorrowedRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let isActive = true;

    const fetchRentals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const nextRentals = await rentalRepository.getBorrowedRentals(borrowerId);
        if (isActive) setRentals(nextRentals);
      } catch (loadError) {
        console.error('빌린 책 대여 목록 조회 실패:', loadError);
        if (isActive) setError('대여 목록을 불러오지 못했어요.');
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void fetchRentals();
    return () => {
      isActive = false;
    };
  }, [borrowerId]);

  useFocusEffect(load);

  return { rentals, isLoading, error, reload: load };
}
