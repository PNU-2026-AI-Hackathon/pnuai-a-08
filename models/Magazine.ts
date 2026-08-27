import { ImageSourcePropType } from 'react-native';

export type MagazineCategory = '전체' | '독서법' | '명사' | '도서' | '작가' | '북채널' | '테크';

export type MagazineBook = {
  title: string;
  author: string;
  note: string;
  cover: ImageSourcePropType;
};

export type MagazineSection = {
  kicker: string;
  title: string;
  body: string;
};

export type MagazineDebate = {
  question: string;
  context: string;
  choices: [string, string];
};

export type MagazineTrack = {
  title: string;
  artist: string;
  reason: string;
};

export type MagazineFact = {
  label: string;
  text: string;
};

export type MagazineSource = {
  label: string;
  publisher: string;
  url: string;
};

export type MagazineLongRead = {
  eyebrow: string;
  title: string;
  intro: string;
  paragraphs: string[];
  interlude: string;
  closingQuestion: string;
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
  byline: string;
  cover: ImageSourcePropType;
  accent: string;
  textColor?: string;
  detailStyle: 'editorial' | 'reading-order';
  tags: string[];
  books: MagazineBook[];
  hook: string;
  sections: MagazineSection[];
  debate: MagazineDebate;
  playlist: MagazineTrack[];
  facts: MagazineFact[];
  editorNote: string;
  sources: MagazineSource[];
  longRead?: MagazineLongRead;
};
