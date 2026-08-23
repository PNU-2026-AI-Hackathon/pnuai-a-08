import { Book } from '@/models/Book';
import { bookRepository } from '@/services/bookRepository';

export type CreateOwnedBookInput = {
  ownerId: string;
  title: string;
  author: string;
  publisher: string;
  publishedDate: string;
  coverLocalUri?: string;
};

export async function createOwnedBook(input: CreateOwnedBookInput): Promise<Book> {
  // Firestore is the source of truth for owned books. A device-local image URI
  // cannot be opened by another device, so it must not be persisted as coverUrl.
  // When Firebase Storage is activated, cover upload can be reintroduced here
  // without changing the screen or book repository contract.
  return bookRepository.createBook(input.ownerId, {
    title: input.title,
    author: input.author,
    publisher: input.publisher,
    publishedDate: input.publishedDate,
    isLendable: false,
  });
}
