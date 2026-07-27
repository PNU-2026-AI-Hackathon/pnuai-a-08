import { chatRooms } from '@/data/chatRooms';
import { ChatRoom } from '@/models/ChatRoom';

export interface ChatRepository {
  getRooms(userId: string): Promise<ChatRoom[]>;
}

/**
 * Firebase 연결 전 사용하는 구현입니다.
 * 추후 onSnapshot 기반 Firestore 구현으로 교체할 경계입니다.
 */
class MockChatRepository implements ChatRepository {
  async getRooms(userId: string): Promise<ChatRoom[]> {
    return chatRooms
      .filter((room) => room.participantIds.includes(userId))
      .sort(
        (first, second) =>
          new Date(second.lastMessageAt).getTime() - new Date(first.lastMessageAt).getTime(),
      );
  }
}

export const chatRepository: ChatRepository = new MockChatRepository();

