export type BorrowedRentalStatus = 'SCHEDULED' | 'BORROWED' | 'RETURNED';

export type BorrowedRental = {
  id: string;
  chatRoomId?: string;
  status: BorrowedRentalStatus;
  startedAt: string;
  dueAt?: string;
  returnedAt?: string;
  book: {
    id: string;
    title: string;
    author: string;
    publisher?: string;
    publishedYear?: number;
    coverUrl?: string;
  };
  owner: {
    id: string;
    displayName: string;
    department?: string;
    studentNumber?: string;
  };
};
