export type RentalHistoryItem = {
  id: string;
  role: 'BORROWER' | 'OWNER';
  status: 'RETURNED' | 'COMPLETED';
  completedAt: string;
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
