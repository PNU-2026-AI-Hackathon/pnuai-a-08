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
import { BorrowedRental } from '@/models/BorrowedRental';
import { LentBook } from '@/models/LentBook';
import { mapAvailableBook, toIsoString } from '@/services/firestoreMappers';

export type CreateLoanRequestInput = { bookId: string; borrowerId: string };

function normalizeBookTitle(value: unknown) {
  return String(value ?? '').trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

function stableTitleKey(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export interface RentalRepository {
  getAvailableBooks(currentUserId: string): Promise<AvailableBook[]>;
  createLoanRequest(input: CreateLoanRequestInput): Promise<string>;
  createLoanRequests(input: { bookIds: string[]; borrowerId: string }): Promise<string[]>;
  syncDueLoans(userId: string): Promise<void>;
  getBorrowedRentals(borrowerId: string): Promise<BorrowedRental[]>;
  getLentBooks(ownerId: string): Promise<LentBook[]>;
}

class FirestoreRentalRepository implements RentalRepository {
  async getAvailableBooks(_currentUserId: string): Promise<AvailableBook[]> {
    const snapshot = await getDocs(query(collection(db, 'books'), where('isLendable', '==', true)));
    // 등록자 본인을 포함한 모든 사용자가 대여 가능 책을 둘러볼 수 있습니다.
    // 자기 책 대여 신청 차단은 createLoanRequest와 화면 버튼에서 별도로 처리합니다.
    const lendable = snapshot.docs.filter((book) => ['AVAILABLE', 'RESERVED', 'BORROWED'].includes(book.data().status));
    const ownerIds = [...new Set(lendable.map((book) => book.data().ownerId).filter(Boolean))];
    const ownerNames = new Map<string, string>();
    const ownerDepartments = new Map<string, string>();

    await Promise.all(
      ownerIds.map(async (ownerId) => {
        const owner = await getDoc(doc(db, 'users', ownerId));
        const ownerData = owner.exists() ? owner.data() : undefined;
        ownerNames.set(
          ownerId,
          ownerData?.nickname ?? ownerData?.displayName ?? '서로서가 사용자',
        );
        if (typeof ownerData?.department === 'string' && ownerData.department.trim()) {
          ownerDepartments.set(ownerId, ownerData.department.trim());
        }
      }),
    );

    return lendable.map((book) =>
      mapAvailableBook(
        book,
        ownerNames.get(book.data().ownerId) ?? '서로서가 사용자',
        ownerDepartments.get(book.data().ownerId),
      ),
    );
  }

  async createLoanRequest({ bookId, borrowerId }: CreateLoanRequestInput): Promise<string> {
    const requestIds = await this.createLoanRequests({ bookIds: [bookId], borrowerId });
    return requestIds[0];
  }

  async createLoanRequests({ bookIds, borrowerId }: { bookIds: string[]; borrowerId: string }): Promise<string[]> {
    if (!borrowerId) throw new Error('AUTH_REQUIRED');
    const uniqueBookIds = [...new Set(bookIds)].filter(Boolean);
    if (uniqueBookIds.length === 0) throw new Error('BOOK_REQUIRED');
    if (uniqueBookIds.length > 3) throw new Error('TOO_MANY_LOAN_REQUESTS');
    const representative = await getDoc(doc(db, 'books', uniqueBookIds[0]));
    if (!representative.exists()) throw new Error('BOOK_NOT_FOUND');
    const existingRequests = await getDocs(query(collection(db, 'loanRequests'), where('borrowerId', '==', borrowerId)));
    const hasLegacyDuplicate = existingRequests.docs.some((request) =>
      uniqueBookIds.includes(request.data().bookId)
      && ['REQUESTED', 'SCHEDULED', 'ACCEPTED', 'BORROWED'].includes(request.data().status),
    );
    if (hasLegacyDuplicate) throw new Error('LOAN_REQUEST_ALREADY_EXISTS');
    const normalizedTitle = normalizeBookTitle(representative.data().title);
    const groupReference = doc(db, 'activeLoanRequestGroups', `${borrowerId}_${stableTitleKey(normalizedTitle)}`);
    const requests = uniqueBookIds.map((bookId) => {
      const requestReference = doc(collection(db, 'loanRequests'));
      return {
        bookId,
        bookReference: doc(db, 'books', bookId),
        requestReference,
        chatReference: doc(db, 'chatRooms', requestReference.id),
        lockReference: doc(db, 'activeLoanRequestLocks', `${borrowerId}_${bookId}`),
      };
    });

    await runTransaction(db, async (transaction) => {
      const [bookSnapshots, lockSnapshots, groupSnapshot] = await Promise.all([
        Promise.all(requests.map((item) => transaction.get(item.bookReference))),
        Promise.all(requests.map((item) => transaction.get(item.lockReference))),
        transaction.get(groupReference),
      ]);
      const normalizedTitles = new Set<string>();

      requests.forEach((item, index) => {
        const book = bookSnapshots[index];
        const lock = lockSnapshots[index];
        if (!book.exists()) throw new Error('BOOK_NOT_FOUND');
        if (lock.exists() && lock.data().active === true) throw new Error('LOAN_REQUEST_ALREADY_EXISTS');
        const bookData = book.data();
        if (bookData.ownerId === borrowerId) throw new Error('CANNOT_BORROW_OWN_BOOK');
        if (!bookData.isLendable || bookData.status !== 'AVAILABLE') throw new Error('BOOK_NOT_AVAILABLE');
        normalizedTitles.add(normalizeBookTitle(bookData.title));
      });
      if (normalizedTitles.size > 1 || !normalizedTitles.has(normalizedTitle)) throw new Error('LOAN_REQUEST_TITLES_MUST_MATCH');
      const previousGroupData = groupSnapshot.exists() ? groupSnapshot.data() : undefined;
      const activeBookIds = Array.isArray(previousGroupData?.activeBookIds)
        ? previousGroupData.activeBookIds.filter((value): value is string => typeof value === 'string')
        : [];
      if (activeBookIds.length + requests.length > 3) throw new Error('TOO_MANY_ACTIVE_LOAN_REQUESTS');

      requests.forEach((item, index) => {
        const bookData = bookSnapshots[index].data()!;
        const ownerSettingsReference = doc(db, 'chatRooms', item.chatReference.id, 'memberSettings', bookData.ownerId);
        const borrowerSettingsReference = doc(db, 'chatRooms', item.chatReference.id, 'memberSettings', borrowerId);
        transaction.set(item.requestReference, {
          requestId: item.requestReference.id, bookId: item.bookId, ownerId: bookData.ownerId, borrowerId,
          chatRoomId: item.chatReference.id, status: 'REQUESTED', lendingPlace: bookData.lendingPlace ?? null,
          requestGroupSize: requests.length, requestedAt: serverTimestamp(), respondedAt: null, dueAt: null,
          returnedAt: null, updatedAt: serverTimestamp(),
        });
        transaction.set(item.lockReference, {
          borrowerId, bookId: item.bookId, requestId: item.requestReference.id, active: true,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        transaction.set(item.chatReference, {
          chatRoomId: item.chatReference.id, requestId: item.requestReference.id, bookId: item.bookId,
          ownerId: bookData.ownerId, borrowerId, participantIds: [bookData.ownerId, borrowerId],
          bookSnapshot: { title: bookData.title ?? '', author: bookData.author ?? '', coverUrl: bookData.coverUrl ?? '' },
          lastMessage: '대여 신청이 도착했어요.', lastMessageSenderId: borrowerId, lastMessageAt: serverTimestamp(),
          lastReadAtByUser: {}, unreadCountByUser: { [bookData.ownerId]: 1, [borrowerId]: 0 },
          createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
        });
        transaction.set(ownerSettingsReference, { userId: bookData.ownerId, active: true, notificationsMuted: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        transaction.set(borrowerSettingsReference, { userId: borrowerId, active: true, notificationsMuted: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      });
      transaction.set(groupReference, {
        borrowerId,
        normalizedTitle,
        activeBookIds: [...activeBookIds, ...requests.map((item) => item.bookId)],
        activeRequestIds: [
          ...(Array.isArray(previousGroupData?.activeRequestIds) ? previousGroupData.activeRequestIds.filter((value): value is string => typeof value === 'string') : []),
          ...requests.map((item) => item.requestReference.id),
        ],
        createdAt: previousGroupData?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });
    return requests.map((item) => item.requestReference.id);
  }

  async syncDueLoans(userId: string): Promise<void> {
    if (!userId) return;
    const requests = collection(db, 'loanRequests');
    const [borrowedSnapshot, lentSnapshot] = await Promise.all([
      getDocs(query(requests, where('borrowerId', '==', userId))),
      getDocs(query(requests, where('ownerId', '==', userId))),
    ]);
    const unique = new Map([...borrowedSnapshot.docs, ...lentSnapshot.docs].map((request) => [request.id, request]));
    const dueRequests = [...unique.values()].filter((request) => {
      const data = request.data();
      const loanAt = toIsoString(data.loanAt);
      return data.status === 'SCHEDULED'
        && typeof data.bookId === 'string'
        && Boolean(data.bookId)
        && typeof data.borrowerId === 'string'
        && Boolean(data.borrowerId)
        && Boolean(loanAt)
        && new Date(loanAt!).getTime() <= Date.now();
    });

    await Promise.all(dueRequests.map(async (scheduledRequest) => {
      const scheduledData = scheduledRequest.data();
      const requestReference = doc(db, 'loanRequests', scheduledRequest.id);
      const bookReference = doc(db, 'books', scheduledData.bookId);
      const roomId = typeof scheduledData.chatRoomId === 'string' && scheduledData.chatRoomId
        ? scheduledData.chatRoomId
        : scheduledRequest.id;
      const roomReference = doc(db, 'chatRooms', roomId);
      await runTransaction(db, async (transaction) => {
        const [request, book, room] = await Promise.all([
          transaction.get(requestReference),
          transaction.get(bookReference),
          transaction.get(roomReference),
        ]);
        if (!request.exists() || request.data().status !== 'SCHEDULED') return;
        const loanAt = toIsoString(request.data().loanAt);
        if (!loanAt || new Date(loanAt).getTime() > Date.now()) return;
        transaction.update(requestReference, {
          status: 'BORROWED',
          borrowedAt: request.data().loanAt,
          updatedAt: serverTimestamp(),
        });
        if (book.exists() && ['RESERVED', 'BORROWED'].includes(book.data().status)) {
          transaction.update(bookReference, {
            status: 'BORROWED',
            borrowerId: request.data().borrowerId,
            borrowedAt: request.data().loanAt,
            updatedAt: serverTimestamp(),
          });
        }
        if (room.exists()) {
          transaction.update(roomReference, { status: 'BORROWED', updatedAt: serverTimestamp() });
        }
      });
    }));
  }

  async getBorrowedRentals(borrowerId: string): Promise<BorrowedRental[]> {
    if (!borrowerId) return [];
    await this.syncDueLoans(borrowerId);
    const snapshot = await getDocs(
      query(collection(db, 'loanRequests'), where('borrowerId', '==', borrowerId)),
    );
    const requests = snapshot.docs.filter((request) =>
      ['SCHEDULED', 'ACCEPTED', 'BORROWED', 'RETURNED', 'COMPLETED'].includes(request.data().status),
    );

    const rentals = await Promise.all(requests.map(async (request): Promise<BorrowedRental> => {
      const data = request.data();
      const chatRoomId = typeof data.chatRoomId === 'string' && data.chatRoomId
        ? data.chatRoomId
        : request.id;
      const [bookSnapshot, ownerSnapshot, chatSnapshot] = await Promise.all([
        typeof data.bookId === 'string' && data.bookId
          ? getDoc(doc(db, 'books', data.bookId))
          : Promise.resolve(null),
        typeof data.ownerId === 'string' && data.ownerId
          ? getDoc(doc(db, 'users', data.ownerId))
          : Promise.resolve(null),
        getDoc(doc(db, 'chatRooms', chatRoomId)),
      ]);
      const bookData = bookSnapshot?.exists() ? bookSnapshot.data() : undefined;
      const ownerData = ownerSnapshot?.exists() ? ownerSnapshot.data() : undefined;
      const chatData = chatSnapshot.exists() ? chatSnapshot.data() : undefined;
      const chatBook = chatData?.bookSnapshot && typeof chatData.bookSnapshot === 'object'
        ? chatData.bookSnapshot as Record<string, unknown>
        : {};
      const publishedDate = toIsoString(bookData?.publishedDate);
      const startedAt = toIsoString(data.loanAt ?? data.respondedAt ?? data.requestedAt)
        ?? new Date(0).toISOString();
      const studentNumber = typeof ownerData?.studentNumber === 'string'
        ? ownerData.studentNumber
        : typeof ownerData?.studentId === 'string'
          ? ownerData.studentId
          : undefined;

      return {
        id: request.id,
        chatRoomId,
        status: ['RETURNED', 'COMPLETED'].includes(data.status)
          ? 'RETURNED'
          : data.status === 'SCHEDULED'
            ? 'SCHEDULED'
            : 'BORROWED',
        startedAt,
        dueAt: toIsoString(data.dueAt),
        returnedAt: toIsoString(data.returnedAt ?? (data.status === 'COMPLETED' ? data.updatedAt : undefined)),
        book: {
          id: typeof data.bookId === 'string' ? data.bookId : '',
          title: typeof bookData?.title === 'string'
            ? bookData.title
            : typeof chatBook.title === 'string' ? chatBook.title : '책 정보 없음',
          author: typeof bookData?.author === 'string'
            ? bookData.author
            : typeof chatBook.author === 'string' ? chatBook.author : '저자 미상',
          publisher: typeof bookData?.publisher === 'string' ? bookData.publisher : undefined,
          publishedYear: publishedDate ? new Date(publishedDate).getFullYear() : undefined,
          coverUrl: typeof bookData?.coverUrl === 'string' && bookData.coverUrl
            ? bookData.coverUrl
            : typeof chatBook.coverUrl === 'string' && chatBook.coverUrl ? chatBook.coverUrl : undefined,
        },
        owner: {
          id: typeof data.ownerId === 'string' ? data.ownerId : '',
          displayName: ownerData?.nickname ?? ownerData?.displayName ?? '서로서가 사용자',
          department: typeof ownerData?.department === 'string' && ownerData.department.trim()
            ? ownerData.department.trim()
            : undefined,
          studentNumber,
        },
      };
    }));

    return rentals.sort((first, second) =>
      new Date(second.startedAt).getTime() - new Date(first.startedAt).getTime(),
    );
  }

  async getLentBooks(ownerId: string): Promise<LentBook[]> {
    if (!ownerId) return [];
    await this.syncDueLoans(ownerId);
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
