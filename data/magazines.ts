import { Magazine } from '@/models/Magazine';

const covers = {
  gatsby: require('../assets/magazines/figma-raw/main-01.jpg'),
  demian: require('../assets/magazines/figma-raw/main-02.jpg'),
  stranger: require('../assets/magazines/figma-raw/main-03.jpg'),
  remains: require('../assets/magazines/figma-raw/main-05.jpg'),
  kafka: require('../assets/magazines/figma-raw/main-06.jpg'),
  vegetarian: require('../assets/magazines/figma-raw/main-08.jpg'),
  humanActs: require('../assets/magazines/figma-raw/main-09.jpg'),
  norwegian: require('../assets/magazines/figma-raw/main-10.jpg'),
  klara: require('../assets/magazines/figma-raw/main-11.jpg'),
  pachinko: require('../assets/magazines/figma-raw/main-12.jpg'),
  razor: require('../assets/magazines/figma-raw/detail2-02.jpg'),
};

const classicBooks = [
  {
    title: '위대한 개츠비',
    author: 'F. 스콧 피츠제럴드',
    note: '화려한 재즈 시대 뒤에 숨은 욕망과 허무를 만나는 입문작.',
    cover: covers.gatsby,
  },
  {
    title: '이방인',
    author: '알베르 카뮈',
    note: '짧지만 오래 남는 문장으로 부조리를 경험하는 책.',
    cover: covers.stranger,
  },
];

const summerBooks = [
  { title: '데미안', author: '헤르만 헤세', note: '내면의 어둠을 통과하며 자기 자신에게 다가가는 소설.', cover: covers.demian },
  { title: '이방인', author: '알베르 카뮈', note: '뜨거운 태양 아래서 부조리한 세계를 직면한다.', cover: covers.stranger },
  { title: '면도날', author: '서머싯 모엄', note: '안정된 삶을 떠나 자유와 진실을 찾는 여정.', cover: covers.razor },
  { title: '채식주의자', author: '한강', note: '조용한 거부가 가족과 사회의 균열로 번져간다.', cover: covers.vegetarian },
];

const seeds = [
  ['world-classics', '독서법', '세계문학전집,\n어디서부터 읽어야 할까', '첫 세계문학을 고르는 사람을 위한 작은 지도', covers.gatsby, '#1C1917'],
  ['kafka-question', '작가', '카프카는\n왜 불안할까', '현대인의 마음을 먼저 써 낸 작가', covers.kafka, '#D8FF45'],
  ['demian-summer', '도서', '데미안을\n다시 읽는 밤', '새로 태어나기 전에 통과하는 어둠', covers.demian, '#E7E0D4'],
  ['august-devil', '북채널', '8월은\n악마의 달일까', '뜨거운 여름에 읽는 어두운 고전 6권', covers.stranger, '#D8FF45'],
  ['vegetarian-body', '도서', '몸은 누구의\n것인가', '「채식주의자」가 던지는 조용하고 날카로운 질문', covers.vegetarian, '#F3EEE5'],
  ['shore-music', '도서', '해변의 카프카와\n함께 듣는 음악', '소설의 문을 여는 클래식과 팝 플레이리스트', covers.kafka, '#DCE9ED'],
  ['remains-memory', '명사', '남겨진 날들,\n기억의 품격', '우리는 지난 삶을 어떻게 이야기하는가', covers.remains, '#C7C7C5'],
  ['one-sentence', '북채널', '오늘의\n한 문장', '길게 머물렀던 책에서 건져 올린 문장', covers.gatsby, '#D8FF45'],
  ['butler-life', '명사', '한 사람의 일을\n삶이라 부를 때', '충성과 후회 사이, 스티븐스의 하루', covers.remains, '#E6DDD0'],
  ['stranger-sun', '도서', '태양은\n왜 유죄일까', '「이방인」의 빛과 온도를 따라가기', covers.stranger, '#ECE4D8'],
  ['klara-eyes', '도서', '클라라가 바라본\n사람의 마음', '사랑을 배우는 AI에게 우리가 묻는 것', covers.klara, '#EE765E'],
  ['human-acts-voice', '작가', '소년이 온다,\n남은 목소리', '기억과 애도의 문장을 읽는 법', covers.humanActs, '#F2EDE4'],
  ['reread-note', '북채널', '다시 읽기는\n새로 읽기', '같은 책이 전혀 다른 이야기가 되는 순간', covers.demian, '#D8FF45'],
  ['norwegian-listen', '도서', '노르웨이의 숲을\n듣는 방법', '상실과 청춘을 감싸는 소리들', covers.norwegian, '#DCE8DD'],
  ['camus-first', '작가', '카뮈를 처음\n만나는 순서', '소설에서 에세이로 건너가는 세 개의 다리', covers.stranger, '#E6DFD3'],
  ['pachinko-family', '도서', '파칭코,\n가족이 이어지는 방법', '네 세대의 선택으로 읽는 거대한 사랑', covers.pachinko, '#9D915E'],
] as const;

export const magazines: Magazine[] = seeds.map((seed, offset) => ({
  id: seed[0],
  index: offset + 1,
  category: seed[1],
  eyebrow: offset === 3 ? '이달의 큐레이션' : '서로서가 매거진',
  title: seed[2],
  cardTitle: seed[2],
  description: seed[3],
  date: '2026.08.14',
  readTime: offset === 3 ? '5분 읽기' : '3분 읽기',
  cover: seed[4],
  accent: seed[5],
  textColor: seed[5] === '#1C1917' || seed[5] === '#9D915E' ? '#FFFFFF' : '#34271F',
  detailStyle: offset === 3 ? 'reading-order' : 'editorial',
  tags: offset === 3 ? ['#8월의책', '#여름고전', '#함께읽기'] : ['#세계문학', '#고전입문', '#서로서가'],
  books: offset === 3 ? summerBooks : classicBooks,
}));

export const magazineCategories = ['전체', '명사', '도서', '작가', '북채널'] as const;

export function getMagazine(id: string) {
  return magazines.find((magazine) => magazine.id === id);
}
