import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { Book } from '@/models/Book';
import { mapBook } from '@/services/firestoreMappers';

export type HomeBooks = { borrowed: Book[]; owned: Book[] };

function dateValue(value?: string) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

export type CreateBookInput = {
  title: string;
  author: string;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  coverUrl?: string;
  coverStoragePath?: string;
  description?: string;
  totalPages?: number;
  isLendable?: boolean;
  lendingPlace?: {
    placeId: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };
};

export type UpdateBookInput = Partial<CreateBookInput>;

export interface BookRepository {
  getHomeBooks(userId: string): Promise<HomeBooks>;
  getExploreBooks(): Promise<Book[]>;
  getBookById(bookId: string): Promise<Book | null>;
  createBook(ownerId: string, input: CreateBookInput): Promise<Book>;
  updateBook(bookId: string, ownerId: string, input: UpdateBookInput): Promise<void>;
  deleteBook(bookId: string, ownerId: string): Promise<void>;
}

class FirestoreBookRepository implements BookRepository {
  async getHomeBooks(userId: string): Promise<HomeBooks> {
    if (!userId) return { borrowed: [], owned: [] };
    const books = collection(db, 'books');
    const [ownedSnapshot, borrowedSnapshot] = await Promise.all([
      getDocs(query(books, where('ownerId', '==', userId))),
      getDocs(query(books, where('borrowerId', '==', userId))),
    ]);
    return {
      owned: ownedSnapshot.docs
        .map((snapshot) => mapBook(snapshot))
        .sort((first, second) => dateValue(second.createdAt) - dateValue(first.createdAt)),
      borrowed: borrowedSnapshot.docs
        .map((snapshot) => mapBook(snapshot))
        .sort((first, second) => dateValue(second.rentalStartsAt ?? second.updatedAt) - dateValue(first.rentalStartsAt ?? first.updatedAt)),
    };
  }

  async getExploreBooks(): Promise<Book[]> {
    const snapshot = await getDocs(query(collection(db, 'books'), where('isLendable', '==', true)));
    return snapshot.docs
      .filter((book) => book.data().status === 'AVAILABLE')
      .map((book) => mapBook(book));
  }

  async getBookById(bookId: string): Promise<Book | null> {
    if (!bookId) return null;
    const snapshot = await getDoc(doc(db, 'books', bookId));
    return snapshot.exists() ? mapBook(snapshot) : null;
  }

  async createBook(ownerId: string, input: CreateBookInput): Promise<Book> {
    if (!ownerId) throw new Error('AUTH_REQUIRED');
    if (!input.title.trim() || !input.author.trim()) throw new Error('BOOK_FIELDS_REQUIRED');
    if (input.isLendable && !input.lendingPlace) throw new Error('LENDING_PLACE_REQUIRED');

    const reference = doc(collection(db, 'books'));
    await setDoc(reference, {
      bookId: reference.id,
      title: input.title.trim(),
      author: input.author.trim(),
      publisher: input.publisher?.trim() ?? '',
      publishedDate: input.publishedDate ? new Date(input.publishedDate) : null,
      isbn: input.isbn?.trim() ?? '',
      coverUrl: input.coverUrl?.trim() ?? '',
      coverStoragePath: input.coverStoragePath?.trim() ?? '',
      description: input.description?.trim() ?? '',
      totalPages: input.totalPages ?? null,
      ownerId,
      borrowerId: null,
      isLendable: input.isLendable ?? false,
      status: input.isLendable ? 'AVAILABLE' : 'PRIVATE',
      lendingPlace: input.isLendable ? input.lendingPlace : null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return mapBook(await getDoc(reference));
  }

  async updateBook(bookId: string, ownerId: string, input: UpdateBookInput): Promise<void> {
    const reference = doc(db, 'books', bookId);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) throw new Error('BOOK_NOT_FOUND');
    if (snapshot.data().ownerId !== ownerId) throw new Error('BOOK_OWNER_REQUIRED');
    if (['RESERVED', 'BORROWED'].includes(snapshot.data().status) && input.isLendable === false) {
      throw new Error('BORROWED_BOOK_CANNOT_BE_PRIVATE');
    }

    const nextData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) nextData[key] = value;
    }
    if (input.publishedDate !== undefined) {
      nextData.publishedDate = input.publishedDate ? new Date(input.publishedDate) : null;
    }
    if (typeof input.isLendable === 'boolean' && !['RESERVED', 'BORROWED'].includes(snapshot.data().status)) {
      nextData.status = input.isLendable ? 'AVAILABLE' : 'PRIVATE';
    }
    await updateDoc(reference, nextData);
  }

  async deleteBook(bookId: string, ownerId: string): Promise<void> {
    const reference = doc(db, 'books', bookId);
    const snapshot = await getDoc(reference);
    if (!snapshot.exists()) return;
    if (snapshot.data().ownerId !== ownerId) throw new Error('BOOK_OWNER_REQUIRED');
    if (['RESERVED', 'BORROWED'].includes(snapshot.data().status)) throw new Error('BORROWED_BOOK_CANNOT_BE_DELETED');
    await deleteDoc(reference);
  }
}

export const bookRepository: BookRepository = new FirestoreBookRepository();
