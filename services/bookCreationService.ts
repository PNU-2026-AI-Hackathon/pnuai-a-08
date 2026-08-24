import { Book } from '@/models/Book';
import { ReadingStatus } from '@/models/ReadingRecord';
import { bookRepository } from '@/services/bookRepository';
import { readingRecordRepository } from '@/services/readingRecordRepository';

export type CreateOwnedBookInput = {
  ownerId: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  coverLocalUri?: string;
  readingStatus: ReadingStatus;
  totalPages: number;
  currentPage: number;
  readingStartedAt: string;
  readingFinishedAt?: string;
  rating?: number;
  oneLineReview?: string;
};

export async function createOwnedBook(input: CreateOwnedBookInput): Promise<Book> {
  // Firestore is the source of truth for owned books. A device-local image URI
  // cannot be opened by another device, so it must not be persisted as coverUrl.
  // When Firebase Storage is activated, cover upload can be reintroduced here
  // without changing the screen or book repository contract.
  const book = await bookRepository.createBook(input.ownerId, {
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    totalPages: input.totalPages,
    isLendable: false,
  });
  try {
    await readingRecordRepository.save({
      bookId: book.id,
      userId: input.ownerId,
      status: input.readingStatus,
      currentPage: input.currentPage,
      startedAt: input.readingStartedAt,
      finishedAt: input.readingFinishedAt,
      rating: input.rating,
      oneLineReview: input.oneLineReview,
    });
  } catch (error) {
    await bookRepository.deleteBook(book.id, input.ownerId).catch((cleanupError) => {
      console.error('독서 기록 저장 실패 후 책 문서 정리 실패:', cleanupError);
    });
    throw error;
  }
  return book;
}

export async function updateOwnedBook(input: CreateOwnedBookInput & { bookId: string }): Promise<void> {
  await bookRepository.updateBook(input.bookId, input.ownerId, {
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    totalPages: input.totalPages,
  });
  await readingRecordRepository.save({
    bookId: input.bookId,
    userId: input.ownerId,
    status: input.readingStatus,
    currentPage: input.currentPage,
    startedAt: input.readingStartedAt,
    finishedAt: input.readingFinishedAt,
    rating: input.rating,
    oneLineReview: input.oneLineReview,
  });
}
