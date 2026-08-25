import { Book } from '@/models/Book';
import { ReadingStatus } from '@/models/ReadingRecord';
import { bookCoverRepository } from '@/services/bookCoverRepository';
import { bookRepository } from '@/services/bookRepository';
import { readingRecordRepository } from '@/services/readingRecordRepository';

export type CreateOwnedBookInput = {
  ownerId: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  coverLocalUri?: string;
  coverUrl?: string;
  isbn?: string;
  description?: string;
  readingStatus: ReadingStatus;
  totalPages: number;
  currentPage: number;
  readingStartedAt: string;
  readingFinishedAt?: string;
  rating?: number;
  oneLineReview?: string;
};

export async function createOwnedBook(input: CreateOwnedBookInput): Promise<Book> {
  const cover = !input.coverUrl && input.coverLocalUri
    ? await bookCoverRepository.upload(input.ownerId, input.coverLocalUri)
    : undefined;
  const book = await bookRepository.createBook(input.ownerId, {
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    totalPages: input.totalPages,
    coverUrl: input.coverUrl ?? cover?.url,
    coverStoragePath: cover?.storagePath,
    isbn: input.isbn,
    description: input.description,
    isLendable: false,
  });
  try {
    await readingRecordRepository.save({
      bookId: book.id,
      userId: input.ownerId,
      status: input.readingStatus,
      totalPages: input.totalPages,
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
  const cover = !input.coverUrl && input.coverLocalUri
    ? await bookCoverRepository.upload(input.ownerId, input.coverLocalUri)
    : undefined;
  await bookRepository.updateBook(input.bookId, input.ownerId, {
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    totalPages: input.totalPages,
    ...(input.coverUrl ? { coverUrl: input.coverUrl, coverStoragePath: '' } : {}),
    ...(!input.coverUrl && cover ? { coverUrl: cover.url, coverStoragePath: cover.storagePath } : {}),
    isbn: input.isbn,
    description: input.description,
  });
  await readingRecordRepository.save({
    bookId: input.bookId,
    userId: input.ownerId,
    status: input.readingStatus,
    totalPages: input.totalPages,
    currentPage: input.currentPage,
    startedAt: input.readingStartedAt,
    finishedAt: input.readingFinishedAt,
    rating: input.rating,
    oneLineReview: input.oneLineReview,
  });
}

export async function saveBookReadingRecord(input: {
  bookId: string;
  userId: string;
  readingStatus: ReadingStatus;
  totalPages: number;
  currentPage: number;
  readingStartedAt: string;
  readingFinishedAt?: string;
  rating?: number;
  oneLineReview?: string;
}): Promise<void> {
  await readingRecordRepository.save({
    bookId: input.bookId,
    userId: input.userId,
    status: input.readingStatus,
    totalPages: input.totalPages,
    currentPage: input.currentPage,
    startedAt: input.readingStartedAt,
    finishedAt: input.readingFinishedAt,
    rating: input.rating,
    oneLineReview: input.oneLineReview,
  });
}
