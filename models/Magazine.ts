import { ImageSourcePropType } from 'react-native';

export type MagazineCategory = '전체' | '독서법' | '명사' | '도서' | '작가' | '북채널';

export type MagazineBook = {
  title: string;
  author: string;
  note: string;
  cover: ImageSourcePropType;
};

export type Magazine = {
  id: string;
  index: number;
  category: Exclude<MagazineCategory, '전체'>;
  eyebrow: string;
  title: string;
  cardTitle: string;
  description: string;
  date: string;
  readTime: string;
  cover: ImageSourcePropType;
  accent: string;
  textColor?: string;
  detailStyle: 'editorial' | 'reading-order';
  tags: string[];
  books: MagazineBook[];
};
