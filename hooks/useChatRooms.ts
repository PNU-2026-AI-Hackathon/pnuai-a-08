import { useEffect, useState } from 'react';

import { ChatRoom } from '@/models/ChatRoom';
import { chatRepository } from '@/services/chatRepository';

export function useChatRooms(userId: string) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextRooms = await chatRepository.getRooms(userId);
        if (isActive) {
          setRooms(nextRooms);
        }
      } catch {
        if (isActive) {
          setError('채팅방을 불러오지 못했어요.');
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
  }, [userId]);

  return { rooms, isLoading, error };
}

