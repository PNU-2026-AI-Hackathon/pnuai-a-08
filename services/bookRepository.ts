import { borrowedBooks, myBooks } from '@/data/books';
import { exploreBooks } from '@/data/exploreBooks';
import { Book } from '@/models/Book';

export type HomeBooks = {
  borrowed: Book[];
  owned: Book[];
};

export interface BookRepository {
  getHomeBooks(): Promise<HomeBooks>;
  getExploreBooks(): Promise<Book[]>;
}

/**
 * Firebase 연결 전 사용하는 구현입니다.
 * 추후 이 객체만 Firestore 기반 repository로 교체하면 화면 코드는 유지할 수 있습니다.
 */
class MockBookRepository implements BookRepository {
  async getHomeBooks(): Promise<HomeBooks> {
    return {
      borrowed: [...borrowedBooks],
      owned: [...myBooks],
    };
  }

  async getExploreBooks(): Promise<Book[]> {
    return [...exploreBooks];
  }
}

export const bookRepository: BookRepository = new MockBookRepository();
