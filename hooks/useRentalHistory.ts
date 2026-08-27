import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { RentalHistoryItem } from '@/models/RentalHistory';
import { rentalHistoryRepository } from '@/services/rentalHistoryRepository';
import { rentalRepository } from '@/services/rentalRepository';

export function useRentalHistory(userId: string) {
  const [items, setItems] = useState<RentalHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    setIsLoading(true);
    setError(null);
    void rentalRepository.syncDueLoans(userId)
      .then(() => rentalHistoryRepository.getHistory(userId))
      .then((nextItems) => { if (active) setItems(nextItems); })
      .catch(() => { if (active) setError('대여 내역을 불러오지 못했어요.'); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [userId]);

  useFocusEffect(load);
  return { items, isLoading, error };
}
