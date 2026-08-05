import { AvailableBook } from '@/models/AvailableBook';

const jangjeonCampus = {
  id: 'place-pnu-jangjeon',
  name: '부산대학교 장전캠퍼스',
  address: '부산광역시 금정구 부산대학로63번길 2',
} as const;

export const availableBooks: AvailableBook[] = [
  {
    id: 'book-current-jangjeon',
    title: '급류',
    author: '정대건',
    ownerId: 'user-owner-current',
    ownerDisplayName: '물결책방',
    status: 'AVAILABLE',
    isLendable: true,
    lendingPlace: jangjeonCampus,
    localCover: 'current',
  },
  {
    id: 'book-neruda-jangjeon',
    title: '네루다의 우편배달부',
    author: '안토니오 스카르메타',
    ownerId: 'user-owner-neruda',
    ownerDisplayName: '책산책',
    status: 'AVAILABLE',
    isLendable: true,
    lendingPlace: jangjeonCampus,
    localCover: 'neruda',
  },
  {
    id: 'book-contradiction-jangjeon',
    title: '모순',
    author: '양귀자',
    ownerId: 'user-owner-contradiction',
    ownerDisplayName: '서재지기',
    status: 'AVAILABLE',
    isLendable: true,
    lendingPlace: jangjeonCampus,
    localCover: 'contradiction',
  },
  {
    id: 'book-almond-jangjeon',
    title: '아몬드',
    author: '손원평',
    ownerId: 'user-owner-almond',
    ownerDisplayName: '초록독자',
    status: 'AVAILABLE',
    isLendable: true,
    lendingPlace: jangjeonCampus,
    localCover: 'almond',
  },
  {
    id: 'book-pagoa-jangjeon',
    title: '파과',
    author: '구병모',
    ownerId: 'user-owner-pagoa',
    ownerDisplayName: '느린페이지',
    status: 'AVAILABLE',
    isLendable: true,
    lendingPlace: jangjeonCampus,
    localCover: 'pagoa',
  },
];

