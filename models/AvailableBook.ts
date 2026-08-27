export type LocalBookCover = 'current' | 'neruda' | 'contradiction' | 'almond' | 'pagoa';

export type LendingPlace = {
  id: string;
  name: string;
  address: string;
};

/**
 * books 문서 중 status가 AVAILABLE인 책을 대여 화면에 표시하기 위한 모델입니다.
 * Firestore Timestamp/GeoPoint 등 SDK 전용 타입은 repository에서 변환합니다.
 */
export type AvailableBook = {
  id: string;
  title: string;
  author: string;
  ownerId: string;
  ownerDisplayName: string;
  status: 'AVAILABLE' | 'RESERVED' | 'BORROWED';
  isLendable: true;
  lendingPlace: LendingPlace;
  publisher?: string;
  publishedYear?: number;
  ownerDepartment?: string;
  coverUrl?: string;
  localCover?: LocalBookCover;
};
