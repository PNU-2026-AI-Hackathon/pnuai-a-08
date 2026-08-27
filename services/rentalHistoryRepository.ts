import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { RentalHistoryItem } from '@/models/RentalHistory';
import { toIsoString } from '@/services/firestoreMappers';

export interface RentalHistoryRepository {
  getHistory(userId: string): Promise<RentalHistoryItem[]>;
}

class FirestoreRentalHistoryRepository implements RentalHistoryRepository {
  async getHistory(userId: string): Promise<RentalHistoryItem[]> {
    if (!userId) return [];
    const requests = collection(db, 'loanRequests');
    const [borrowedSnapshot, lentSnapshot] = await Promise.all([
      getDocs(query(requests, where('borrowerId', '==', userId))),
      getDocs(query(requests, where('ownerId', '==', userId))),
    ]);
    const unique = new Map([...borrowedSnapshot.docs, ...lentSnapshot.docs].map((item) => [item.id, item]));
    const visibleRequests = [...unique.values()].filter((item) =>
      ['SCHEDULED', 'ACCEPTED', 'BORROWED', 'RETURNED', 'COMPLETED'].includes(item.data().status),
    );

    const items = await Promise.all(visibleRequests.map(async (request): Promise<RentalHistoryItem> => {
      const data = request.data();
      const chatRoomId = typeof data.chatRoomId === 'string' && data.chatRoomId ? data.chatRoomId : request.id;
      const role: RentalHistoryItem['role'] = data.borrowerId === userId ? 'BORROWER' : 'OWNER';
      const otherUserId = role === 'BORROWER' ? data.ownerId : data.borrowerId;
      const [bookSnapshot, otherUserSnapshot, chatSnapshot] = await Promise.all([
        data.bookId ? getDoc(doc(db, 'books', data.bookId)) : Promise.resolve(null),
        otherUserId ? getDoc(doc(db, 'users', otherUserId)) : Promise.resolve(null),
        getDoc(doc(db, 'chatRooms', chatRoomId)),
      ]);
      const bookData = bookSnapshot?.exists() ? bookSnapshot.data() : undefined;
      const chatBook = chatSnapshot.exists() && chatSnapshot.data().bookSnapshot && typeof chatSnapshot.data().bookSnapshot === 'object'
        ? chatSnapshot.data().bookSnapshot as Record<string, unknown>
        : {};
      const otherData = otherUserSnapshot?.exists() ? otherUserSnapshot.data() : undefined;
      const publishedDate = toIsoString(bookData?.publishedDate);
      return {
        id: request.id,
        chatRoomId,
        role,
        status: data.status === 'SCHEDULED'
          ? 'SCHEDULED'
          : ['ACCEPTED', 'BORROWED'].includes(data.status)
            ? 'BORROWED'
            : data.status === 'RETURNED' ? 'RETURNED' : 'COMPLETED',
        eventAt: toIsoString(['SCHEDULED', 'ACCEPTED', 'BORROWED'].includes(data.status) ? data.loanAt ?? data.respondedAt ?? data.updatedAt : data.returnedAt ?? data.updatedAt)
          ?? new Date(0).toISOString(),
        dueAt: toIsoString(data.dueAt),
        book: {
          id: typeof data.bookId === 'string' ? data.bookId : '',
          title: typeof bookData?.title === 'string' ? bookData.title : typeof chatBook.title === 'string' ? chatBook.title : '책 정보 없음',
          author: typeof bookData?.author === 'string' ? bookData.author : typeof chatBook.author === 'string' ? chatBook.author : '저자 미상',
          publisher: typeof bookData?.publisher === 'string' ? bookData.publisher : undefined,
          publishedYear: publishedDate ? new Date(publishedDate).getFullYear() : undefined,
          coverUrl: typeof bookData?.coverUrl === 'string' && bookData.coverUrl ? bookData.coverUrl : typeof chatBook.coverUrl === 'string' && chatBook.coverUrl ? chatBook.coverUrl : undefined,
        },
        otherUserName: otherData?.nickname ?? otherData?.displayName ?? '서로서가 사용자',
      };
    }));

    return items.sort((first, second) => new Date(second.eventAt).getTime() - new Date(first.eventAt).getTime());
  }
}

export const rentalHistoryRepository: RentalHistoryRepository = new FirestoreRentalHistoryRepository();
