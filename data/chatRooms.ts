import { ChatRoom } from '@/models/ChatRoom';

const minutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60 * 1000).toISOString();

export const chatRooms: ChatRoom[] = [
  {
    id: 'chat-almond-harin',
    listingId: 'listing-almond-harin',
    participantIds: ['current-user', 'user-harin'],
    otherUser: {
      id: 'user-harin',
      displayName: '하린',
    },
    book: {
      id: 'book-almond',
      title: '아몬드',
      author: '손원평',
      colors: ['#FFF0E7', '#D99C70'],
    },
    lastMessage: '내일 오후 3시에 도서관 앞에서 만나요!',
    lastMessageAt: minutesAgo(12),
    unreadCount: 2,
    status: 'accepted',
  },
  {
    id: 'chat-current-doyoon',
    listingId: 'listing-current-doyoon',
    participantIds: ['current-user', 'user-doyoon'],
    otherUser: {
      id: 'user-doyoon',
      displayName: '도윤',
    },
    book: {
      id: 'book-current',
      title: '급류',
      author: '정대건',
      colors: ['#708899', '#3E596B'],
    },
    lastMessage: '책 상태 확인했어요. 대여 신청 수락할게요.',
    lastMessageAt: minutesAgo(98),
    unreadCount: 0,
    status: 'requested',
  },
  {
    id: 'chat-contradiction-seoyeon',
    listingId: 'listing-contradiction-seoyeon',
    participantIds: ['current-user', 'user-seoyeon'],
    otherUser: {
      id: 'user-seoyeon',
      displayName: '서연',
    },
    book: {
      id: 'book-contradiction',
      title: '모순',
      author: '양귀자',
      colors: ['#D9D4CD', '#9E958B'],
    },
    lastMessage: '즐겁게 읽으셨어요? 반납일에 뵐게요.',
    lastMessageAt: minutesAgo(60 * 25),
    unreadCount: 0,
    status: 'onLoan',
  },
  {
    id: 'chat-thousand-blue-jian',
    listingId: 'listing-thousand-blue-jian',
    participantIds: ['current-user', 'user-jian'],
    otherUser: {
      id: 'user-jian',
      displayName: '지안',
    },
    book: {
      id: 'book-thousand-blue',
      title: '천 개의 파랑',
      author: '천선란',
      colors: ['#8FC3EC', '#315FA8'],
    },
    lastMessage: '감사합니다. 다음에 또 좋은 책 나눠요!',
    lastMessageAt: minutesAgo(60 * 72),
    unreadCount: 0,
    status: 'completed',
  },
];

>>>>>>> 7dbe18122aed1721535cdb17047abbb3f922e80d
