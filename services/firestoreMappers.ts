import { DocumentData, DocumentSnapshot, Timestamp } from 'firebase/firestore';

import { AvailableBook, LendingPlace, LocalBookCover } from '@/models/AvailableBook';
import { Book, BookCoverMotif } from '@/models/Book';
import { ChatRoom, ChatRoomStatus } from '@/models/ChatRoom';
import { ReadingRecord } from '@/models/ReadingRecord';

const bookThemes: Array<{
  colors: readonly [string, string];
  accent: string;
  motif: BookCoverMotif;
}> = [
  { colors: ['#718899', '#9AA8B0'], accent: '#E3F16B', motif: 'lines' },
  { colors: ['#FFF0E7', '#F5DCCB'], accent: '#E3F16B', motif: 'circle' },
  { colors: ['#E7E3DE', '#CFCAC5'], accent: '#C7EA35', motif: 'cloud' },
  { colors: ['#85BDEA', '#3979C1'], accent: '#C7EA35', motif: 'wave' },
  { colors: ['#171717', '#393939'], accent: '#C7EA35', motif: 'night' },
];

function stableIndex(value: string, length: number) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash % length;
}

export function toIsoString(value: unknown): string | undefined {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return undefined;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asFiniteNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toLendingPlace(value: unknown): LendingPlace {
  const place = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    id: asString(place.placeId ?? place.id),
    name: asString(place.name, '대여 장소 미정'),
    address: asString(place.address),
  };
}

function localCoverForTitle(title: string): LocalBookCover | undefined {
  const covers: Record<string, LocalBookCover> = {
    급류: 'current',
    '네루다의 우편배달부': 'neruda',
    모순: 'contradiction',
    아몬드: 'almond',
    파과: 'pagoa',
  };
  return covers[title];
}

export function mapBook(snapshot: DocumentSnapshot<DocumentData>, dueDate?: unknown): Book {
  const data = snapshot.data() ?? {};
  const theme = bookThemes[stableIndex(snapshot.id, bookThemes.length)];
  const status = asString(data.status) as Book['status'];

  return {
    id: snapshot.id,
    title: asString(data.title, '제목 없음'),
    author: asString(data.author, '저자 미상'),
    colors: theme.colors,
    accent: theme.accent,
    motif: theme.motif,
    dueDate: toIsoString(dueDate ?? data.dueAt ?? data.dueDate),
    rentalStartsAt: toIsoString(data.loanAt ?? data.rentalStartsAt),
    ownerId: asString(data.ownerId) || undefined,
    borrowerId: typeof data.borrowerId === 'string' ? data.borrowerId : null,
    publisher: asString(data.publisher) || undefined,
    publishedDate: toIsoString(data.publishedDate),
    isbn: asString(data.isbn) || undefined,
    coverUrl: asString(data.coverUrl) || undefined,
    coverStoragePath: asString(data.coverStoragePath) || undefined,
    description: asString(data.description) || undefined,
    totalPages: asFiniteNumber(data.totalPages),
    isLendable: typeof data.isLendable === 'boolean' ? data.isLendable : undefined,
    status: ['PRIVATE', 'AVAILABLE', 'RESERVED', 'BORROWED'].includes(status ?? '') ? status : undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export function mapReadingRecord(snapshot: DocumentSnapshot<DocumentData>): ReadingRecord {
  const data = snapshot.data() ?? {};
  return {
    id: snapshot.id,
    bookId: asString(data.bookId),
    userId: asString(data.userId),
    status: data.status === 'COMPLETED' ? 'COMPLETED' : 'READING',
    currentPage: asFiniteNumber(data.currentPage) ?? 0,
    startedAt: toIsoString(data.startedAt) ?? new Date(0).toISOString(),
    finishedAt: toIsoString(data.finishedAt),
    rating: asFiniteNumber(data.rating),
    oneLineReview: asString(data.oneLineReview) || undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

export function mapAvailableBook(
  snapshot: DocumentSnapshot<DocumentData>,
  ownerDisplayName: string,
  ownerDepartment?: string,
): AvailableBook {
  const data = snapshot.data() ?? {};
  const title = asString(data.title, '제목 없음');

  return {
    id: snapshot.id,
    title,
    author: asString(data.author, '저자 미상'),
    ownerId: asString(data.ownerId),
    ownerDisplayName,
    status: ['RESERVED', 'BORROWED'].includes(data.status) ? data.status : 'AVAILABLE',
    isLendable: true,
    lendingPlace: toLendingPlace(data.lendingPlace),
    publisher: asString(data.publisher) || undefined,
    publishedYear: toIsoString(data.publishedDate) ? new Date(toIsoString(data.publishedDate)!).getFullYear() : undefined,
    ownerDepartment,
    coverUrl: asString(data.coverUrl) || undefined,
    localCover: localCoverForTitle(title),
  };
}

function toChatStatus(value: unknown): ChatRoomStatus {
  const status = asString(value).toUpperCase();
  if (status === 'ACCEPTED' || status === 'SCHEDULED') return 'accepted';
  if (status === 'BORROWED' || status === 'ON_LOAN') return 'onLoan';
  if (status === 'RETURNED' || status === 'COMPLETED') return 'completed';
  return 'requested';
}

export function mapChatRoom(
  snapshot: DocumentSnapshot<DocumentData>,
  currentUserId: string,
  otherDisplayName: string,
  otherPhotoURL?: string,
  requestStatus?: unknown,
  memberSettings?: {
    isActive: boolean;
    notificationsMuted: boolean;
    hasBlockedOtherUser: boolean;
  },
): ChatRoom {
  const data = snapshot.data() ?? {};
  const bookSnapshot =
    data.bookSnapshot && typeof data.bookSnapshot === 'object'
      ? (data.bookSnapshot as Record<string, unknown>)
      : {};
  const participantIds = asStringArray(data.participantIds);
  const otherUserId = participantIds.find((id) => id !== currentUserId) ?? '';
  const bookId = asString(data.bookId);
  const theme = bookThemes[stableIndex(bookId || snapshot.id, bookThemes.length)];
  const unreadCountByUser =
    data.unreadCountByUser && typeof data.unreadCountByUser === 'object'
      ? (data.unreadCountByUser as Record<string, unknown>)
      : {};

  return {
    id: snapshot.id,
    listingId: asString(data.requestId, snapshot.id),
    participantIds,
    otherUser: { id: otherUserId, displayName: otherDisplayName, photoURL: otherPhotoURL },
    book: {
      id: bookId,
      title: asString(bookSnapshot.title, '책 정보 없음'),
      author: asString(bookSnapshot.author, '저자 미상'),
      colors: theme.colors,
      coverUrl: asString(bookSnapshot.coverUrl) || undefined,
    },
    lastMessage: asString(data.lastMessage, '대화를 시작해 보세요.'),
    lastMessageAt:
      toIsoString(data.lastMessageAt ?? data.updatedAt ?? data.createdAt) ?? new Date(0).toISOString(),
    unreadCount:
      typeof data.unreadCount === 'number'
        ? data.unreadCount
        : typeof unreadCountByUser[currentUserId] === 'number'
          ? unreadCountByUser[currentUserId] as number
          : 0,
    status: toChatStatus(requestStatus ?? data.status),
    memberSettings: memberSettings ?? {
      isActive: true,
      notificationsMuted: false,
      hasBlockedOtherUser: false,
    },
  };
}
