export type ChatRoomStatus = 'requested' | 'accepted' | 'onLoan' | 'completed';

/**
 * Firestore의 채팅방 문서를 화면에서 사용하기 위한 앱 모델입니다.
 * Timestamp는 repository에서 ISO 문자열로 변환합니다.
 */
export type ChatRoom = {
  id: string;
  listingId: string;
  participantIds: string[];
  otherUser: {
    id: string;
    displayName: string;
  };
  book: {
    id: string;
    title: string;
    author: string;
    colors: readonly [string, string];
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: ChatRoomStatus;
};

