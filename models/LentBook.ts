export type LentBookStatus = 'AVAILABLE' | 'REQUESTED' | 'SCHEDULED' | 'BORROWED';

export type LentBook = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  status: LentBookStatus;
  borrowerName?: string;
  requestedAt?: string;
  dueAt?: string;
};
