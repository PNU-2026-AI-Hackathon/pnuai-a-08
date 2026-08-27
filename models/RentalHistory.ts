export type RentalHistoryItem = {
  id: string;
  chatRoomId?: string;
  role: 'BORROWER' | 'OWNER';
  status: 'SCHEDULED' | 'BORROWED' | 'RETURNED' | 'COMPLETED';
  eventAt: string;
  dueAt?: string;
  book: {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    publishedYear?: number;
    coverUrl?: string;
  };
  otherUserName: string;
};
