import { useEffect, useState } from 'react';

import { ChatRoom } from '@/models/ChatRoom';
import { chatRepository } from '@/services/chatRepository';

export function useChatRooms(userId: string) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    return chatRepository.subscribeRooms(
      userId,
      (nextRooms) => {
        setRooms(nextRooms);
        setIsLoading(false);
      },
      () => {
        setError('채팅방을 불러오지 못했어요.');
        setIsLoading(false);
      },
    );
  }, [userId]);

  return { rooms, isLoading, error };
}
