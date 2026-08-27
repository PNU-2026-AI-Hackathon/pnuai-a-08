export type BookCoverMotif = 'lines' | 'circle' | 'cloud' | 'night' | 'wave';

/**
 * 화면과 데이터 소스 사이에서 사용하는 앱 내부 책 모델입니다.
 * Firebase Timestamp 같은 SDK 전용 타입은 repository에서 ISO 문자열로 변환합니다.
 */
export type Book = {
  id: string;
  title: string;
  author: string;
  colors: readonly [string, string, ...string[]];
  accent: string;
  dueDate?: string;
  rentalStartsAt?: string;
  motif: BookCoverMotif;
  ownerId?: string;
  borrowerId?: string | null;
  publisher?: string;
  publishedDate?: string;
  isbn?: string;
  coverUrl?: string;
  coverStoragePath?: string;
  description?: string;
  totalPages?: number;
  isLendable?: boolean;
  status?: 'PRIVATE' | 'AVAILABLE' | 'RESERVED' | 'BORROWED';
  createdAt?: string;
  updatedAt?: string;
};
