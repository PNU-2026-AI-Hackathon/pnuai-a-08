import { useEffect, useState } from 'react';

import { ChatMessage } from '@/models/ChatMessage';
import { ChatRoom } from '@/models/ChatRoom';
import { chatRepository } from '@/services/chatRepository';
import { rentalRepository } from '@/services/rentalRepository';

export function useChatThread(roomId: string, userId: string) {
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setError(null);

    void rentalRepository.syncDueLoans(userId)
      .then(() => chatRepository.getRoom(roomId, userId))
      .then((nextRoom) => {
        if (!nextRoom) throw new Error('CHAT_ROOM_NOT_FOUND');
        if (isActive) setRoom(nextRoom);
      })
      .catch(() => {
        if (isActive) setError('채팅방 정보를 불러오지 못했어요.');
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    const unsubscribe = chatRepository.subscribeMessages(
      roomId,
      userId,
      (nextMessages) => setMessages(nextMessages),
      () => setError('메시지를 불러오지 못했어요.'),
    );
    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [roomId, userId]);

  return { room, messages, isLoading, error };
}
