export type ReadingStatus = 'READING' | 'COMPLETED';

export type ReadingRecord = {
  id: string;
  bookId: string;
  userId: string;
  status: ReadingStatus;
  currentPage: number;
  startedAt: string;
  finishedAt?: string;
  rating?: number;
  oneLineReview?: string;
  createdAt?: string;
  updatedAt?: string;
};
