import { availableBooks } from '@/data/availableBooks';
import { AvailableBook } from '@/models/AvailableBook';

export interface RentalRepository {
  getAvailableBooks(currentUserId: string): Promise<AvailableBook[]>;
}

/**
 * Firebase 연결 전 목 구현입니다. Firestore에서는 isLendable/status로 조회한 뒤
 * 현재 사용자가 소유한 책을 제외하도록 동일한 계약을 유지합니다.
 */
class MockRentalRepository implements RentalRepository {
  async getAvailableBooks(currentUserId: string): Promise<AvailableBook[]> {
    return availableBooks.filter(
      (book) =>
        book.isLendable && book.status === 'AVAILABLE' && book.ownerId !== currentUserId,
    );
  }
}

export const rentalRepository: RentalRepository = new MockRentalRepository();

