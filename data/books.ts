import { Book } from '@/models/Book';

const dueDateAfter = (days: number) => {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + days);
  return dueDate.toISOString();
};

export const borrowedBooks: Book[] = [
  {
    id: 'borrowed-1',
    title: '급류',
    author: '정대건',
    colors: ['#718899', '#9AA8B0'],
    accent: '#E3F16B',
    dueDate: dueDateAfter(5),
    motif: 'lines',
  },
  {
    id: 'borrowed-2',
    title: '아몬드',
    author: '손원평',
    colors: ['#FFF0E7', '#F5DCCB'],
    accent: '#E3F16B',
    dueDate: dueDateAfter(12),
    motif: 'circle',
  },
  {
    id: 'borrowed-3',
    title: '먼 곳에서',
    author: '권여선',
    colors: ['#E7E3DE', '#CFCAC5'],
    accent: '#E3F16B',
    dueDate: dueDateAfter(2),
    motif: 'cloud',
  },
  {
    id: 'borrowed-4',
    title: '작별하지 않는다',
    author: '한강',
    colors: ['#B9C9D6', '#E9E3DE'],
    accent: '#E3F16B',
    dueDate: dueDateAfter(18),
    motif: 'wave',
  },
];

export const myBooks: Book[] = [
  {
    id: 'mine-1',
    title: '모순',
    author: '양귀자',
    colors: ['#E6E0DA', '#CFC7BF'],
    accent: '#C7EA35',
    motif: 'cloud',
  },
  {
    id: 'mine-2',
    title: '파과',
    author: '구병모',
    colors: ['#171717', '#393939'],
    accent: '#C7EA35',
    motif: 'night',
  },
  {
    id: 'mine-3',
    title: '천 개의\n파랑',
    author: '천선란',
    colors: ['#85BDEA', '#3979C1'],
    accent: '#C7EA35',
    motif: 'wave',
  },
  {
    id: 'mine-4',
    title: '종의 기원',
    author: '정유정',
    colors: ['#D9DDF4', '#AAAED7'],
    accent: '#C7EA35',
    motif: 'cloud',
  },
  {
    id: 'mine-5',
    title: '밝은 밤',
    author: '최은영',
    colors: ['#F1C6B8', '#C98378'],
    accent: '#C7EA35',
    motif: 'circle',
  },
  {
    id: 'mine-6',
    title: '아주 희미한 빛으로도',
    author: '최은영',
    colors: ['#AFC1AF', '#657D67'],
    accent: '#C7EA35',
    motif: 'lines',
  },
];
