import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { AvailableBook } from '@/models/AvailableBook';
import { LentBook } from '@/models/LentBook';
import { mapAvailableBook, toIsoString } from '@/services/firestoreMappers';

export type CreateLoanRequestInput = { bookId: string; borrowerId: string };

export interface RentalRepository {
  getAvailableBooks(currentUserId: string): Promise<AvailableBook[]>;
  createLoanRequest(input: CreateLoanRequestInput): Promise<string>;
  getLentBooks(ownerId: string): Promise<LentBook[]>;
}

class FirestoreRentalRepository implements RentalRepository {
  async getAvailableBooks(_currentUserId: string): Promise<AvailableBook[]> {
    const snapshot = await getDocs(query(collection(db, 'books'), where('isLendable', '==', true)));
    // 등록자 본인을 포함한 모든 사용자가 대여 가능 책을 둘러볼 수 있습니다.
    // 자기 책 대여 신청 차단은 createLoanRequest와 화면 버튼에서 별도로 처리합니다.
    const available = snapshot.docs.filter((book) => book.data().status === 'AVAILABLE');
    const ownerIds = [...new Set(available.map((book) => book.data().ownerId).filter(Boolean))];
    const ownerNames = new Map<string, string>();

    await Promise.all(
      ownerIds.map(async (ownerId) => {
        const owner = await getDoc(doc(db, 'users', ownerId));
        ownerNames.set(
          ownerId,
          owner.exists() ? owner.data().displayName ?? '서로서가 사용자' : '서로서가 사용자',
        );
      }),
    );

    return available.map((book) =>
      mapAvailableBook(book, ownerNames.get(book.data().ownerId) ?? '서로서가 사용자'),
    );
  }

  async createLoanRequest({ bookId, borrowerId }: CreateLoanRequestInput): Promise<string> {
    if (!borrowerId) throw new Error('AUTH_REQUIRED');
    const bookReference = doc(db, 'books', bookId);
    const requestReference = doc(collection(db, 'loanRequests'));
    const chatReference = doc(db, 'chatRooms', requestReference.id);

    await runTransaction(db, async (transaction) => {
      const book = await transaction.get(bookReference);
      if (!book.exists()) throw new Error('BOOK_NOT_FOUND');
      const bookData = book.data();
      if (bookData.ownerId === borrowerId) throw new Error('CANNOT_BORROW_OWN_BOOK');
      if (!bookData.isLendable || bookData.status !== 'AVAILABLE') {
        throw new Error('BOOK_NOT_AVAILABLE');
      }

      transaction.set(requestReference, {
        requestId: requestReference.id,
        bookId,
        ownerId: bookData.ownerId,
        borrowerId,
        chatRoomId: chatReference.id,
        status: 'REQUESTED',
        lendingPlace: bookData.lendingPlace ?? null,
        requestedAt: serverTimestamp(),
        respondedAt: null,
        dueAt: null,
        returnedAt: null,
        updatedAt: serverTimestamp(),
      });
      transaction.set(chatReference, {
        chatRoomId: chatReference.id,
        requestId: requestReference.id,
        bookId,
        ownerId: bookData.ownerId,
        borrowerId,
        participantIds: [bookData.ownerId, borrowerId],
        bookSnapshot: {
          title: bookData.title ?? '',
          author: bookData.author ?? '',
          coverUrl: bookData.coverUrl ?? '',
        },
        lastMessage: '대여 신청이 도착했어요.',
        lastMessageSenderId: borrowerId,
        lastMessageAt: serverTimestamp(),
        lastReadAtByUser: {},
        unreadCountByUser: { [bookData.ownerId]: 1, [borrowerId]: 0 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return requestReference.id;
  }

  async getLentBooks(ownerId: string): Promise<LentBook[]> {
    if (!ownerId) return [];
    const [bookSnapshot, requestSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'books'), where('ownerId', '==', ownerId))),
      getDocs(query(collection(db, 'loanRequests'), where('ownerId', '==', ownerId))),
    ]);
    const lendableBooks = bookSnapshot.docs.filter((book) => book.data().isLendable === true);
    const activeRequests = requestSnapshot.docs.filter((request) =>
      ['REQUESTED', 'SCHEDULED', 'ACCEPTED', 'BORROWED'].includes(request.data().status),
    );
    const borrowerIds = [...new Set(activeRequests.map((request) => request.data().borrowerId).filter(Boolean))];
    const borrowerNames = new Map<string, string>();

    await Promise.all(borrowerIds.map(async (borrowerId) => {
      const user = await getDoc(doc(db, 'users', borrowerId));
      const userData = user.exists() ? user.data() : undefined;
      borrowerNames.set(
        borrowerId,
        userData?.nickname ?? userData?.displayName ?? '서로서가 사용자',
      );
    }));

    const priority = { REQUESTED: 4, SCHEDULED: 3, ACCEPTED: 2, BORROWED: 2 } as const;
    return lendableBooks.map((book): LentBook => {
      const bookData = book.data();
      const requests = activeRequests
        .filter((request) => request.data().bookId === book.id)
        .sort((first, second) => {
          const firstStatus = first.data().status as keyof typeof priority;
          const secondStatus = second.data().status as keyof typeof priority;
          return priority[secondStatus] - priority[firstStatus];
        });
      const activeRequest = requests[0]?.data();
      const status: LentBook['status'] = activeRequest?.status === 'REQUESTED'
        ? 'REQUESTED'
        : bookData.status === 'RESERVED' || activeRequest?.status === 'SCHEDULED'
          ? 'SCHEDULED'
        : bookData.status === 'BORROWED' || ['ACCEPTED', 'BORROWED'].includes(activeRequest?.status)
          ? 'BORROWED'
          : 'AVAILABLE';

      return {
        id: book.id,
        title: typeof bookData.title === 'string' ? bookData.title : '제목 없음',
        author: typeof bookData.author === 'string' ? bookData.author : '저자 미상',
        coverUrl: typeof bookData.coverUrl === 'string' && bookData.coverUrl ? bookData.coverUrl : undefined,
        status,
        borrowerName: activeRequest?.borrowerId ? borrowerNames.get(activeRequest.borrowerId) : undefined,
        requestedAt: toIsoString(activeRequest?.requestedAt),
        dueAt: toIsoString(activeRequest?.dueAt),
      };
    });
  }
}

export const rentalRepository: RentalRepository = new FirestoreRentalRepository();
