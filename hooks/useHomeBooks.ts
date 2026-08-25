import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { Book } from '@/models/Book';
import { BorrowedRental } from '@/models/BorrowedRental';
import { bookRepository, HomeBooks } from '@/services/bookRepository';
import { rentalRepository } from '@/services/rentalRepository';

const emptyBooks: HomeBooks = {
  borrowed: [],
  owned: [],
};

const HOME_BOOKS_CACHE_TTL_MS = 30_000;
const homeBooksCache = new Map<string, { books: HomeBooks; updatedAt: number }>();

function borrowedRentalToBook(rental: BorrowedRental, fallback?: Book): Book {
  return {
    id: rental.book.id || rental.id,
    title: rental.book.title,
    author: rental.book.author,
    colors: fallback?.colors ?? ['#E8EDCC', '#FFF8EB'],
    accent: fallback?.accent ?? '#C7EA35',
    motif: fallback?.motif ?? 'lines',
    ownerId: rental.owner.id,
    borrowerId: undefined,
    publisher: rental.book.publisher,
    publishedDate: fallback?.publishedDate,
    coverUrl: rental.book.coverUrl ?? fallback?.coverUrl,
    dueDate: rental.dueAt,
    rentalStartsAt: rental.startedAt,
    status: rental.status === 'SCHEDULED' ? 'RESERVED' : rental.status === 'BORROWED' ? 'BORROWED' : fallback?.status,
    createdAt: fallback?.createdAt,
    updatedAt: fallback?.updatedAt,
  };
}

export function useHomeBooks(userId: string) {
  const cached = userId ? homeBooksCache.get(userId) : undefined;
  const [books, setBooks] = useState<HomeBooks>(cached?.books ?? emptyBooks);
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!userId) {
      setBooks(emptyBooks);
      setIsLoading(false);
      return;
    }

    const cachedBooks = homeBooksCache.get(userId);
    const cacheFresh = cachedBooks && Date.now() - cachedBooks.updatedAt < HOME_BOOKS_CACHE_TTL_MS;
    if (cachedBooks) {
      setBooks(cachedBooks.books);
      if (!force) setIsLoading(false);
    }
    if (!force && cacheFresh) return;

    setIsLoading(!cachedBooks);
    setError(null);

    try {
      const [homeBooks, borrowedRentals] = await Promise.all([
        bookRepository.getHomeBooks(userId),
        rentalRepository.getBorrowedRentals(userId),
      ]);
      const fallbackById = new Map(homeBooks.borrowed.map((book) => [book.id, book]));
      const nextBooks = {
        owned: homeBooks.owned,
        borrowed: borrowedRentals
          .filter((rental) => rental.status !== 'RETURNED')
          .map((rental) => borrowedRentalToBook(rental, fallbackById.get(rental.book.id))),
      };
      homeBooksCache.set(userId, { books: nextBooks, updatedAt: Date.now() });
      setBooks(nextBooks);
    } catch {
      setError('책 정보를 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return {
    ...books,
    isLoading,
    error,
    reload: () => load(true),
  };
}
