import { ImageSourcePropType } from 'react-native';

import { Magazine, MagazineBook, MagazineCategory, MagazineSource } from '@/models/Magazine';

const covers = {
  gatsby: require('../assets/magazines/figma-raw/main-01.jpg'), demian: require('../assets/magazines/figma-raw/main-02.jpg'),
  stranger: require('../assets/magazines/figma-raw/main-03.jpg'), remains: require('../assets/magazines/figma-raw/main-05.jpg'),
  kafka: require('../assets/magazines/figma-raw/main-06.jpg'), vegetarian: require('../assets/magazines/figma-raw/main-08.jpg'),
  humanActs: require('../assets/magazines/figma-raw/main-09.jpg'), norwegian: require('../assets/magazines/figma-raw/main-10.jpg'),
  klara: require('../assets/magazines/figma-raw/main-11.jpg'), pachinko: require('../assets/magazines/figma-raw/main-12.jpg'),
  razor: require('../assets/magazines/figma-raw/detail2-02.jpg'),
  contradiction: require('../pictures/모순.png'),
  odyssey: require('../assets/magazines/odyssey-voyage.jpg'),
  claudeCode: require('../assets/magazines/claude-code-start.jpg'),
};

const book = (title: string, author: string, note: string, cover: ImageSourcePropType): MagazineBook => ({ title, author, note, cover });
const source = (label: string, publisher: string, url: string): MagazineSource => ({ label, publisher, url });
const books = {
  gatsby: book('위대한 개츠비', 'F. 스콧 피츠제럴드', '사랑 이야기처럼 시작해 계급과 돈의 잔혹함으로 끝나는 재즈 시대의 초상.', covers.gatsby),
  demian: book('데미안', '헤르만 헤세', '착한 세계와 금지된 세계 사이에서 진짜 자기 자신을 찾아가는 성장소설.', covers.demian),
  stranger: book('이방인', '알베르 카뮈', '무감한 남자의 범죄보다 그를 재판하는 사회의 기준이 더 섬뜩한 소설.', covers.stranger),
  remains: book('남아 있는 나날', '가즈오 이시구로', '품위라는 이름으로 감정을 미뤄온 한 사람이 너무 늦게 삶을 돌아본다.', covers.remains),
  kafka: book('변신', '프란츠 카프카', '벌레가 된 아들보다 돈을 벌지 못하는 아들을 대하는 가족이 더 무섭다.', covers.kafka),
  vegetarian: book('채식주의자', '한강', '한 사람의 조용한 거부를 가족과 사회가 어떻게 폭력으로 되돌리는지 묻는다.', covers.vegetarian),
  humanActs: book('소년이 온다', '한강', '광주에서 살아남은 목소리와 죽은 이의 존엄을 정면으로 바라보는 소설.', covers.humanActs),
  norwegian: book('노르웨이의 숲', '무라카미 하루키', '청춘의 사랑보다 살아남은 사람의 죄책감과 상실에 더 가까운 이야기.', covers.norwegian),
  klara: book('클라라와 태양', '가즈오 이시구로', '인간보다 헌신적인 인공지능의 눈으로 사랑과 대체 가능성을 시험한다.', covers.klara),
  pachinko: book('파친코', '이민진', '역사책이 지워버린 재일조선인 가족의 생존을 네 세대의 선택으로 복원한다.', covers.pachinko),
  razor: book('면도날', '서머싯 몸', '성공이 보장된 삶을 버리고 삶의 의미를 찾아 떠나는 위험한 선택.', covers.razor),
  contradiction: book('모순', '양귀자', '행복과 불행, 안정과 사랑 사이에서 무엇을 선택해도 모순에 닿는 스물다섯 안진진의 생.', covers.contradiction),
  odyssey: book('오뒷세이아', '호메로스', '괴물을 물리치는 모험보다 전쟁이 끝난 뒤 다시 집과 자신의 이름을 찾아가는 귀향의 서사.', covers.odyssey),
  iliad: book('일리아스', '호메로스', '오디세우스가 귀향길에 오르기 전, 트로이아 전쟁의 분노와 죽음을 노래한 또 하나의 서사시.', covers.odyssey),
  penelopiad: book('페넬로피아드', '마거릿 애트우드', '영웅의 귀환 뒤편에 남겨졌던 페넬로페와 하녀들의 목소리로 원전을 다시 묻는다.', covers.odyssey),
  claudeCode: book('클로드 코드 제대로 시작하기', '주홍철·황진성', '바이브 코딩에서 멈추지 않고 스펙, 검증, 훅, 스킬과 에이전트 운영까지 다루는 실전 안내서.', covers.claudeCode),
};

const nobelHan = source('한강 작가·작품 해설', '노벨상', 'https://www.nobelprize.org/prizes/literature/2024/bio-bibliography/');
const nobelHesse = source('헤르만 헤세 작가 정보', '노벨상', 'https://www.nobelprize.org/prizes/literature/1946/hesse/facts/');
const nobelCamus = source('알베르 카뮈 작가 정보', '노벨상', 'https://www.nobelprize.org/prizes/literature/1957/camus/facts/');
const nobelIshiguro = source('가즈오 이시구로 노벨 강연', '노벨상', 'https://www.nobelprize.org/uploads/2018/06/ishiguro-lecture_en.pdf');
const murakamiMusic = source('무라카미 작품과 음악', 'Haruki Murakami 공식 사이트', 'https://harukimurakami.com/resources');
const locGatsby = source('재즈 시대와 『위대한 개츠비』', '미국 의회도서관', 'https://www.loc.gov/exhibits/america-reads/1900-to-1949.html');
const common = { date: '2026.08.25', textColor: '#34271F', detailStyle: 'editorial' as const };

const magazineSeeds: Magazine[] = [
  {
    ...common, id: 'world-classics', index: 1, category: '독서법', eyebrow: '실패 없는 고전 입문', title: '고전이 지루한 게 아니라\n첫 책을 잘못 골랐다', cardTitle: '고전이 지루한 게 아니라\n첫 책을 잘못 골랐다',
    description: '완독률을 망치는 벽돌책 말고, 오늘 밤 끝낼 수 있는 위험한 고전부터.', byline: '세계문학 고전 큐레이션', cover: covers.gatsby, accent: '#1C1917', textColor: '#FFFFFF', tags: ['#고전입문', '#실패없는독서', '#3권코스'], books: [books.stranger, books.kafka, books.gatsby],
    hook: '고전은 인내심 테스트가 아니다. 살인, 변신, 계급 욕망처럼 첫 장부터 사건이 터지는 책도 충분히 많다.',
    sections: [
      { kicker: 'START SHORT', title: '얇은 책이 얕은 책은 아니다', body: '『이방인』과 『변신』은 짧지만 마지막 장을 덮은 뒤 질문이 시작된다. 줄거리를 전부 이해하려 애쓰기보다 가장 불편했던 장면 하나만 붙잡아도 충분하다.' },
      { kicker: 'THEN GO BIG', title: '두 번째 책부터 시대를 읽자', body: '사건의 재미를 경험한 다음 『위대한 개츠비』로 가면 파티와 로맨스 뒤에 숨은 계급의 벽이 보인다. 고전을 숙제에서 현재의 이야기로 바꾸는 순서다.' },
    ], debate: { question: '고전은 시대의 편견까지 보존해야 할까?', context: '불편한 표현을 삭제하면 읽기 쉬워지지만, 당시 사회를 비판적으로 볼 단서도 함께 사라질 수 있다.', choices: ['원문과 해설을 함께 읽자', '현대 독자에 맞게 손봐도 된다'] },
    playlist: [{ title: 'Take Five', artist: 'The Dave Brubeck Quartet', reason: '익숙한 듯 어긋나는 리듬이 고전 첫 장의 긴장을 풀어준다.' }], facts: [{ label: '100년의 반전', text: '『위대한 개츠비』는 작가 생전에는 기대만큼 팔리지 않았지만 제2차 세계대전 무렵 다시 널리 읽히며 미국 문학의 상징이 됐다.' }], editorNote: '첫 고전은 “유명한 책”보다 “지금 내가 답하고 싶은 질문이 있는 책”으로 고르세요.', sources: [locGatsby, nobelCamus],
  },
  {
    ...common, id: 'kafka-question', index: 2, category: '작가', eyebrow: '월요일 아침의 원조', title: '카프카는 100년 전에\n회사원의 공포를 알았다', cardTitle: '카프카는 100년 전에\n회사원의 공포를 알았다',
    description: '벌레가 된 것보다 무서운 건 출근을 걱정하는 그레고르였다.', byline: '프란츠 카프카 작가에 대해', cover: covers.kafka, accent: '#D8FF45', tags: ['#카프카', '#변신', '#번아웃'], books: [books.kafka, books.stranger],
    hook: '눈을 떴더니 벌레가 됐다. 그런데 그의 첫 걱정은 몸이 아니라 지각과 직장이다. 이보다 현대적인 공포가 있을까.',
    sections: [{ kicker: 'THE REAL MONSTER', title: '괴물은 벌레인가, 생산성을 잃은 가족인가', body: '그레고르가 돈을 벌 때 가족은 그에게 기대지만, 노동 능력을 잃자 존재 자체를 짐으로 취급한다. 판타지의 외피를 벗기면 조건부 사랑의 이야기다.' }, { kicker: 'READ YOURSELF', title: '불안은 설명되지 않을 때 더 정확하다', body: '왜 변했는지는 끝내 설명되지 않는다. 카프카는 이유도 모른 채 평가받고 죄책감을 느끼는 상태를 독자에게 체험시킨다.' }],
    debate: { question: '경제적 역할을 잃어도 가족의 사랑은 같아야 할까?', context: '그레고르 가족의 냉혹함은 비난하기 쉽지만, 생계와 돌봄의 부담을 누가 감당할지는 여전히 현실적인 문제다.', choices: ['사랑은 조건이 없어야 한다', '돌봄에도 감당 가능한 한계가 있다'] }, playlist: [{ title: 'The Sound of Silence', artist: 'Simon & Garfunkel', reason: '말이 닿지 않는 가족의 침묵과 고립을 따라간다.' }], facts: [{ label: '읽기 포인트', text: '작품은 변신의 원인을 설명하지 않는다. 미스터리의 정답보다 주변 사람들이 달라지는 과정을 보는 편이 핵심에 가깝다.' }], editorNote: '출근하기 싫은 날 읽으면 웃기다가, 내가 성과로만 사람을 판단했는지 돌아보게 됩니다.', sources: [source('『변신』 작품 정보', '브리태니커', 'https://www.britannica.com/topic/The-Metamorphosis')],
  },
  {
    ...common, id: 'demian-summer', index: 3, category: '도서', eyebrow: '다시 읽으면 다른 책', title: '『데미안』은 성장소설이 아니라\n착한 아이의 탈출기다', cardTitle: '착한 아이였던 당신이\n『데미안』을 다시 읽어야 하는 이유',
    description: '남들이 정한 정답에서 빠져나오는 데는 생각보다 큰 용기가 필요하다.', byline: '데미안 - 헤르만 헤세', cover: covers.demian, accent: '#E7E0D4', tags: ['#데미안', '#자기발견', '#재독'], books: [books.demian, books.razor],
    hook: '“바르게 살라”는 말이 나를 망칠 수도 있다. 싱클레어의 문제는 타락이 아니라 남의 기준으로만 선해지려 했다는 것이다.', sections: [{ kicker: 'TWO WORLDS', title: '밝은 세계만 믿을수록 어둠은 커진다', body: '싱클레어는 안전한 가정과 금지된 바깥을 나눈다. 그러나 성장은 둘 중 하나를 제거하는 일이 아니라 자신의 양면을 인정하는 데서 시작한다.' }, { kicker: 'AUTHOR FILE', title: '헤세의 위기도 소설 안에 들어왔다', body: '헤세는 개인적 위기 속에서 정신분석을 경험했고, 이후 『데미안』에는 꿈·상징·내면의 분열이 강하게 나타났다.' }],
    debate: { question: '“진짜 나답게 살라”는 말은 언제 이기적이 되는가?', context: '자기실현은 해방의 언어지만, 타인에 대한 책임을 회피하는 핑계가 될 수도 있다.', choices: ['자기 선택이 먼저다', '관계에 대한 책임이 먼저다'] }, playlist: [{ title: 'Creep', artist: 'Radiohead', reason: '어디에도 속하지 못한다는 싱클레어의 감각을 정면으로 건드린다.' }], facts: [{ label: '작가의 위기', text: '노벨상 자료는 헤세가 1916년 정신분석 치료를 받았고, 그 다음 해 『데미안』을 썼다고 설명한다.' }], editorNote: '학창 시절 읽었다면 이번에는 데미안보다 싱클레어가 숨기는 수치심에 표시하며 읽어보세요.', sources: [nobelHesse],
  },
  {
    ...common, id: 'august-devil', index: 4, category: '북채널', eyebrow: '이달의 위험한 큐레이션', title: '휴가보다 오래 남는\n한여름의 불온한 책 4권', cardTitle: '8월의 불온한 책\n4권',
    description: '더위를 잊게 하는 대신 당신의 안전한 생각을 흔드는 여름 독서.', byline: '한여름의 불온한 고전 큐레이션', cover: covers.stranger, accent: '#D8FF45', detailStyle: 'reading-order', tags: ['#8월의책', '#여름고전', '#함께읽기'], books: [books.stranger, books.demian, books.razor, books.vegetarian],
    hook: '시원한 책은 없다. 대신 태양, 욕망, 거부, 탈출이 당신의 여름을 완전히 다른 기억으로 만든다.', sections: [{ kicker: 'CURATION RULE', title: '도망치거나, 거부하거나, 맞서거나', body: '네 권의 주인공은 사회가 준비한 삶에서 이탈한다. 누가 자유로워졌고 누가 더 깊이 고립됐는지 비교하면 네 권이 하나의 긴 토론처럼 이어진다.' }], debate: { question: '안정된 삶을 버리는 선택은 용기일까 특권일까?', context: '떠남은 낭만적으로 보이지만, 실패를 감당할 자원은 누구에게나 같지 않다.', choices: ['자유를 위한 용기다', '감당할 수 있는 사람의 특권이다'] }, playlist: [{ title: 'Summertime Sadness', artist: 'Lana Del Rey', reason: '화려한 여름과 설명하기 힘든 불안을 동시에 품는다.' }, { title: 'Paint It, Black', artist: 'The Rolling Stones', reason: '밝은 계절과 반대되는 내면의 어둠을 밀어 올린다.' }], facts: [{ label: '읽는 순서', text: '가장 짧은 『이방인』으로 시작해 내면의 『데미안』, 탈주의 『면도날』, 몸의 거부를 다룬 『채식주의자』로 넘어간다.' }], editorNote: '네 권을 다 읽지 않아도 좋습니다. 가장 반박하고 싶은 문장이 있는 책부터 시작하세요.', sources: [nobelCamus, nobelHesse, nobelHan],
  },
  {
    ...common, id: 'vegetarian-body', index: 5, category: '도서', eyebrow: '노벨문학상 이후 다시 읽기', title: '고기를 끊었을 뿐인데\n왜 모두가 그녀를 벌주는가', cardTitle: '고기를 끊었을 뿐인데\n왜 모두가 그녀를 벌주는가',
    description: '『채식주의자』는 식단이 아니라 타인의 몸을 통제할 권리에 대한 소설이다.', byline: '채식주의자 - 한강', cover: covers.vegetarian, accent: '#F3EEE5', tags: ['#채식주의자', '#몸의주권', '#한강'], books: [books.vegetarian, books.humanActs],
    hook: '한 여성이 “먹지 않겠다”고 말한다. 가족은 이유를 묻기보다 정상으로 되돌리려 한다. 폭력은 바로 그 순간 시작된다.', sections: [{ kicker: 'WHO SPEAKS?', title: '정작 영혜의 목소리는 왜 적을까', body: '이야기의 상당 부분은 남편, 형부, 언니의 시선으로 전달된다. 독자는 영혜를 이해한다고 믿는 순간에도 타인의 욕망을 통해 그녀를 보고 있을 수 있다.' }, { kicker: 'THE REFUSAL', title: '식물이 되고 싶다는 소망', body: '노벨상 작품 해설은 폭력을 거부하려는 영혜의 급진적인 선택과 그 비극적 결과에 주목한다. 인간의 폭력성을 벗어날 수 있는지라는 질문이 남는다.' }], debate: { question: '자기 몸을 해치는 선택도 개인의 자유로 존중해야 할까?', context: '몸의 주권과 생명을 보호해야 한다는 책임이 충돌한다. 가족의 개입은 어디까지 정당할까.', choices: ['최종 결정은 본인에게 있다', '위험할 때는 개입해야 한다'] }, playlist: [{ title: 'Running Up That Hill', artist: 'Kate Bush', reason: '서로의 자리를 바꿔 이해하고 싶다는 갈망이 인물들의 실패와 대비된다.' }], facts: [{ label: '세계가 읽은 질문', text: '노벨상은 『채식주의자』를 음식 섭취 규범을 거부한 선택이 폭력적인 결과로 이어지는 작품으로 소개한다.' }], editorNote: '영혜를 진단하려 하지 말고, 주변 인물들이 영혜에게 무엇을 원했는지 표시하며 읽어보세요.', sources: [nobelHan, source('한강 노벨문학상 강연', '노벨상', 'https://www.nobelprize.org/uploads/2024/12/han-lecture-english.pdf')],
  },
  {
    ...common, id: 'shore-music', index: 6, category: '도서', eyebrow: '소설을 재생하는 플레이리스트', title: '『해변의 카프카』는\n귀로 읽어야 완성된다', cardTitle: '『해변의 카프카』를\n귀로 읽는 법',
    description: '팝, 재즈, 클래식이 장면의 비밀 통로가 되는 무라카미식 독서.', byline: '해변의 카프카 - 무라카미 하루키', cover: covers.kafka, accent: '#DCE9ED', tags: ['#해변의카프카', '#북플레이리스트', '#무라카미'], books: [books.norwegian, books.kafka],
    hook: '무라카미의 음악은 배경음이 아니다. 곡을 틀면 인물의 고독과 시간의 속도가 갑자기 들리기 시작한다.', sections: [{ kicker: 'PRESS PLAY', title: '장면이 막히면 음악을 먼저 들어라', body: '작품 속 음악은 현실과 꿈, 현재와 기억 사이를 잇는다. 곡을 정답처럼 해석하기보다 장면 전후의 감정이 어떻게 변하는지 듣는 것이 좋다.' }, { kicker: 'MURAKAMI METHOD', title: '문장에도 리듬이 있다', body: '무라카미 공식 사이트도 음악에 대한 작가의 열정이 모든 작품에서 드러난다고 설명한다. 반복되는 일상 묘사와 돌연한 비현실은 재즈의 변주처럼 읽힌다.' }], debate: { question: '작품 속 음악을 모르고 읽어도 같은 소설일까?', context: '음악은 몰입을 넓히지만, 작가가 정해둔 감정에 독자가 끌려갈 위험도 있다.', choices: ['음악까지 들어야 완성된다', '텍스트만으로 충분하다'] }, playlist: [{ title: 'Archduke Trio', artist: 'Ludwig van Beethoven', reason: '단단한 형식 안에서 감정이 움직이는 클래식의 긴장을 느껴본다.' }, { title: 'Kafka on the Shore', artist: '작품 속 가상곡을 떠올리며', reason: '실재하지 않는 노래를 각자의 기억으로 완성하는 독서 실험.' }], facts: [{ label: '작가의 또 다른 언어', text: '무라카미의 공식 자료실은 음악에 대한 애정이 그의 모든 책에서 분명하게 드러난다고 소개한다.' }], editorNote: '한 챕터를 읽고 한 곡을 들으세요. 음악이 끝난 뒤 떠오르는 장면이 당신의 진짜 독후감입니다.', sources: [murakamiMusic],
  },
  {
    ...common, id: 'remains-memory', index: 7, category: '명사', eyebrow: '노벨상 작가의 기억법', title: '평생 성실했는데\n내 삶이 틀렸다면', cardTitle: '평생 성실했는데\n내 삶이 틀렸다면',
    description: '『남아 있는 나날』이 성공한 어른에게 더 잔인한 이유.', byline: '가즈오 이시구로 작가에 대해', cover: covers.remains, accent: '#C7C7C5', tags: ['#가즈오이시구로', '#후회', '#일과삶'], books: [books.remains, books.klara],
    hook: '스티븐스는 게으르지 않았다. 오히려 완벽하게 성실했다. 그래서 잘못된 사람에게 바친 인생이 더 돌이키기 어렵다.', sections: [{ kicker: 'UNRELIABLE MEMORY', title: '기억은 거짓말보다 영리하다', body: '스티븐스는 불편한 기억의 의미를 바꾼다. 이시구로의 인물들은 기억을 통해 죄책감과 후회를 견딜 수 있는 이야기로 편집한다.' }, { kicker: 'WORK & SELF', title: '직업적 품위가 감정을 지울 때', body: '좋은 직원이 되는 일과 좋은 인간이 되는 일이 충돌한다. 명령을 잘 수행했다는 사실은 그 결과에 대한 책임을 없애는가.' }], debate: { question: '상사의 잘못된 결정을 충실히 따른 사람도 책임이 있을까?', context: '조직의 위계, 생계, 전문성이라는 이유와 개인의 도덕적 판단이 부딪힌다.', choices: ['명령을 따랐어도 책임이 있다', '결정권자에게 책임이 있다'] }, playlist: [{ title: 'The Last Goodbye', artist: 'The Kills', reason: '말하지 못한 감정과 너무 늦게 도착한 작별의 온도를 닮았다.' }], facts: [{ label: '작가의 설계', text: '이시구로는 노벨 강연에서 이 작품을 특정 영국만의 이야기가 아니라 국제적으로 읽힐 소설로 구상했다고 밝혔다.' }], editorNote: '스티븐스가 “품위”를 말할 때마다 그가 실제로 피하고 있는 감정을 적어보세요.', sources: [nobelIshiguro, source('가즈오 이시구로 작품 세계', '노벨상', 'https://www.nobelprize.org/prizes/literature/2017/ceremony-speech/')],
  },
  {
    ...common, id: 'one-sentence', index: 8, category: '북채널', eyebrow: '문장보다 질문을 수집합니다', title: '밑줄만 긋고 잊는 사람을 위한\n30초 독서 기록법', cardTitle: '밑줄만 긋고 잊는 사람을 위한\n30초 기록법',
    description: '좋은 문장을 저장하는 데서 멈추지 않고 내 삶의 문장으로 바꾸는 법.', byline: '서로서가 독서 기록 가이드', cover: covers.gatsby, accent: '#D8FF45', tags: ['#독서기록', '#밑줄', '#오늘의질문'], books: [books.gatsby, books.demian, books.remains],
    hook: '밑줄 100개보다 “왜 지금 이 문장이 아팠지?”라는 메모 한 줄이 오래 남는다.', sections: [{ kicker: '30 SECOND NOTE', title: '문장·감정·반박, 세 칸이면 된다', body: '인용을 길게 옮기지 말고 페이지와 핵심어만 적는다. 바로 떠오른 감정 하나, 동의하지 않는 이유 하나를 붙이면 기록이 요약이 아니라 대화가 된다.' }, { kicker: 'ONE WEEK LATER', title: '일주일 뒤 기억나는 것만 남겨라', body: '책을 덮은 직후보다 시간이 지나도 남은 장면이 나에게 중요한 핵심일 수 있다. 기록을 다시 열어 한 문장으로 줄여본다.' }], debate: { question: '책을 많이 읽고 잊는 것과 적게 읽고 기록하는 것, 어느 쪽이 나을까?', context: '폭넓은 노출과 깊은 기억은 모두 가치가 있지만 한정된 독서 시간 안에서는 선택이 필요하다.', choices: ['많이 만나야 취향이 생긴다', '적게 읽어도 내 것으로 남겨야 한다'] }, playlist: [{ title: 'Intro', artist: 'The xx', reason: '가사가 적어 문장에 집중하면서 기록하기 좋다.' }], facts: [{ label: '오늘의 실험', text: '저장한 밑줄을 보지 않고 책에서 기억나는 장면 세 개를 먼저 적어보자. 그 차이가 나의 독서 취향이다.' }], editorNote: '매거진의 AI 버튼에 밑줄과 내 감정을 보내면 반대 관점의 질문을 받아볼 수 있어요.', sources: [source('능동적 회상과 학습', '미국 국립의학도서관', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4492928/')],
  },
  {
    ...common, id: 'butler-life', index: 9, category: '명사', eyebrow: '일잘러의 가장 위험한 착각', title: '프로답게 살았더니\n내 인생이 사라졌다', cardTitle: '프로답게 살았더니\n내 인생이 사라졌다',
    description: '충성과 책임감이 자기기만으로 변하는 정확한 순간.', byline: '남아 있는 나날 - 가즈오 이시구로', cover: covers.remains, accent: '#E6DDD0', tags: ['#일잘러', '#번아웃', '#남아있는나날'], books: [books.remains, books.razor],
    hook: '일을 잘한 대가가 “내가 무엇을 원했는지 모르게 되는 것”이라면, 그 성공은 누구의 것일까.', sections: [{ kicker: 'PROFESSIONALISM', title: '감정을 통제하는 능력은 언제 결핍이 되는가', body: '스티븐스는 흔들리지 않는 태도를 직업적 품위로 믿는다. 하지만 중요한 관계에서도 같은 태도를 유지하면서 감정은 표현될 기회를 잃는다.' }, { kicker: 'CAREER AUDIT', title: '성과 말고 남는 것을 계산해보자', body: '내가 잘 수행한 일, 그 일로 지킨 가치, 그 과정에서 미룬 관계를 나눠 적으면 충성과 회피를 구분하기 쉬워진다.' }], debate: { question: '좋아하지 않는 일도 잘한다면 계속해야 할까?', context: '능력과 적성이 반드시 같은 방향을 가리키지는 않는다. 떠날 비용과 남을 비용도 다르다.', choices: ['잘하는 일이 결국 내 일이다', '잘해도 원하지 않으면 떠나야 한다'] }, playlist: [{ title: 'No Surprises', artist: 'Radiohead', reason: '평온해 보이는 일상 아래 쌓이는 체념을 조용히 들려준다.' }], facts: [{ label: '같은 책, 다른 독자', text: '이 소설은 로맨스와 직업윤리, 정치적 책임을 동시에 품어 어느 인물의 선택에 주목하느냐에 따라 전혀 다른 책이 된다.' }], editorNote: '스티븐스를 답답해한 장면은 어쩌면 내가 가장 자주 감정을 숨기는 장면일 수 있습니다.', sources: [nobelIshiguro],
  },
  {
    ...common, id: 'stranger-sun', index: 10, category: '도서', eyebrow: '살인보다 태도가 더 문제였던 재판', title: '뫼르소는 사람을 죽여서\n사형당한 게 맞을까', cardTitle: '뫼르소는 정말\n살인 때문에 유죄였을까',
    description: '『이방인』의 법정은 범죄보다 “슬퍼하는 방식”을 심판한다.', byline: '이방인 - 알베르 카뮈', cover: covers.stranger, accent: '#ECE4D8', tags: ['#이방인', '#부조리', '#감정규범'], books: [books.stranger, books.gatsby],
    hook: '검사는 총격만큼이나 장례식에서 울지 않은 일을 공격한다. 사회는 범죄를 심판한 걸까, 정상처럼 보이지 않은 인간을 제거한 걸까.', sections: [{ kicker: 'THE TRIAL', title: '사실보다 그럴듯한 인간상이 이긴다', body: '법정은 흩어진 행동을 모아 “어머니를 사랑하지 않은 냉혹한 인간”이라는 서사를 만든다. 독자는 뫼르소의 무감각을 불편해하면서도 재판의 논리가 공정한지 의심한다.' }, { kicker: 'ABSURD', title: '세계가 설명되지 않는다는 정직함', body: '카뮈에게 부조리는 의미를 원하는 인간과 아무 답도 주지 않는 세계의 충돌이다. 뫼르소는 위로가 되는 거짓말을 거부하고 그 대가를 치른다.' }], debate: { question: '진심으로 반성하지 않는 피고인에게 더 무거운 형벌을 줘도 될까?', context: '형벌은 행위의 결과에 비례해야 하는지, 태도와 재범 가능성까지 고려해야 하는지 논쟁이 생긴다.', choices: ['행위만 심판해야 한다', '태도도 책임의 일부다'] }, playlist: [{ title: 'House of the Rising Sun', artist: 'The Animals', reason: '피할 수 없는 파국과 뜨거운 빛의 이미지를 겹쳐 듣게 한다.' }], facts: [{ label: '카뮈의 위치', text: '노벨상 자료는 카뮈가 부조리를 탐구했지만 자신을 특정 이념이나 실존주의라는 이름에 가두는 것을 거부했다고 설명한다.' }], editorNote: '뫼르소를 좋아할 필요는 없습니다. 그를 싫어하는 감정이 공정한 판결의 근거가 될 수 있는지만 물어보세요.', sources: [nobelCamus],
  },
  {
    ...common, id: 'klara-eyes', index: 11, category: '도서', eyebrow: 'AI가 인간보다 사랑을 잘한다면', title: '당신과 똑같은 AI가 생기면\n가족은 알아볼까', cardTitle: '당신과 똑같은 AI가 생기면\n가족은 알아볼까',
    description: '『클라라와 태양』이 기술보다 사랑의 대체 가능성을 묻는 방식.', byline: '클라라와 태양 - 가즈오 이시구로', cover: covers.klara, accent: '#EE765E', tags: ['#클라라와태양', '#AI윤리', '#사랑'], books: [books.klara, books.remains],
    hook: 'AI가 당신의 말투, 습관, 기억을 완벽히 학습했다. 당신이 사라진 뒤 그 AI를 “당신”이라고 부를 수 있을까.', sections: [{ kicker: 'OBSERVATION', title: '클라라는 인간보다 더 오래 바라본다', body: '클라라의 제한된 시야는 약점처럼 보이지만, 인간이 당연하게 넘기는 표정과 관계의 균열을 집요하게 관찰한다. 순진함은 때때로 가장 날카로운 비평이 된다.' }, { kicker: 'REPLACE ME', title: '사랑은 정보의 합계인가', body: '한 사람을 충분히 관찰하고 복제하면 대체할 수 있다는 생각은 사랑에 고유한 “무언가”가 있는지 시험한다. 소설은 기술적 정답보다 남은 사람의 욕망을 묻는다.' }], debate: { question: '죽은 사람을 완벽히 흉내 내는 AI를 가족으로 받아들일 수 있을까?', context: '애도의 고통을 줄일 수 있지만, 떠난 사람을 놓아주지 못하게 만들 수도 있다.', choices: ['관계가 이어진다면 가족이다', '복제는 그 사람이 아니다'] }, playlist: [{ title: 'Everything in Its Right Place', artist: 'Radiohead', reason: '질서정연한 전자음 안의 불안이 클라라의 세계와 닮았다.' }], facts: [{ label: '작가의 오래된 질문', text: '이시구로는 기억, 자기기만, 인간다운 관계를 반복해서 다뤄왔다. AI는 그 질문을 미래로 옮기는 새로운 거울이다.' }], editorNote: '클라라가 인간보다 인간적으로 보였던 장면을 AI 챗봇과 토론해보세요.', sources: [nobelIshiguro],
  },
  {
    ...common, id: 'human-acts-voice', index: 12, category: '작가', eyebrow: '기억하는 일이 행동이 될 때', title: '우리는 왜 타인의 고통을\n끝까지 읽어야 하는가', cardTitle: '우리는 왜 타인의 고통을\n끝까지 읽어야 하는가',
    description: '『소년이 온다』는 비극을 소비하지 않고 기억하는 독서가 가능한지 묻는다.', byline: '한강 작가에 대해', cover: covers.humanActs, accent: '#F2EDE4', tags: ['#소년이온다', '#광주', '#기억과애도'], books: [books.humanActs, books.vegetarian],
    hook: '책을 덮으면 나는 일상으로 돌아간다. 작품 속 사람들은 돌아갈 수 없다. 그 거리 앞에서 독자는 무엇을 해야 할까.', sections: [{ kicker: 'MANY VOICES', title: '한 명의 영웅 대신 여러 사람의 목소리', body: '소설은 광주의 폭력을 하나의 관점으로 정리하지 않는다. 살아남은 사람, 죽은 사람, 가족의 목소리가 이어지며 국가폭력이 긴 후유증임을 보여준다.' }, { kicker: 'READ WITH CARE', title: '충격적인 장면을 빨리 소비하지 않기', body: '고통의 묘사에서 멈춰 감정을 과장하기보다, 각 인물의 이름과 관계, 이후의 삶을 기억하는 것이 중요하다. 애도는 강한 감정보다 오래 보는 태도에 가깝다.' }], debate: { question: '역사적 비극을 소설로 만드는 것은 기억일까 소비일까?', context: '문학은 통계 밖의 개인을 살려내지만, 타인의 고통을 감동적인 이야기로 소비할 위험도 있다.', choices: ['문학이 기억을 살아 있게 한다', '재현에는 넘지 말아야 할 선이 있다'] }, playlist: [{ title: '임을 위한 행진곡', artist: '민중가요', reason: '작품의 역사적 배경과 오늘의 기억이 어떻게 이어지는지 생각하게 한다.' }], facts: [{ label: '작품의 역사', text: '노벨상은 이 작품이 1980년 광주에서 벌어진 학생과 시민에 대한 폭력, 그리고 희생자와 생존자의 목소리를 다룬다고 소개한다.' }], editorNote: '빠르게 완독하기보다 한 목소리씩 쉬어가며 읽기를 권합니다.', sources: [nobelHan],
  },
  {
    ...common, id: 'reread-note', index: 13, category: '북채널', eyebrow: '책은 그대로인데 독자가 바뀌었다', title: '예전에 좋아한 책이\n지금은 별로라면 좋은 일이다', cardTitle: '예전에 좋아한 책이\n지금은 별로라면',
    description: '재독은 책의 진짜 뜻보다 달라진 나를 발견하는 가장 빠른 방법.', byline: '서로서가 다시 읽기 가이드', cover: covers.demian, accent: '#D8FF45', tags: ['#다시읽기', '#독서기록', '#취향발견'], books: [books.demian, books.gatsby, books.remains],
    hook: '명작에 실망한 게 아니라 당신의 기준이 자란 것일 수 있다. 별점이 떨어진 이유가 가장 좋은 독서 기록이다.', sections: [{ kicker: 'BEFORE & AFTER', title: '과거의 나와 같은 문장에 답해보기', body: '예전 밑줄 세 개를 골라 지금도 동의하는지 적는다. 당시에는 멋있어 보였지만 지금은 무책임하게 느껴지는 문장이 있다면 가치관이 변한 흔적이다.' }, { kicker: 'SWITCH SIDES', title: '주인공 말고 주변 인물을 따라가라', body: '첫 독서에서 놓친 인물을 중심에 놓으면 서사가 달라진다. 『개츠비』를 데이지의 계급적 선택으로 읽는 식이다.' }], debate: { question: '시대가 바뀌어 불편해진 명작의 평가는 낮아져야 할까?', context: '문학적 성취와 작품이 재생산하는 편견을 분리해서 평가할 수 있는지가 쟁점이다.', choices: ['현재의 기준으로 다시 평가해야 한다', '시대적 맥락과 성취를 우선해야 한다'] }, playlist: [{ title: 'Both Sides Now', artist: 'Joni Mitchell', reason: '같은 대상을 다른 나이와 시선으로 다시 보는 노래.' }], facts: [{ label: '재독 미션', text: '예전 별점은 보지 말고 새 별점을 먼저 매긴 뒤 차이를 설명해보자. 변화량이 곧 나의 독서 연대기다.' }], editorNote: '좋아했던 책을 끝까지 좋아할 의무는 없습니다. 달라진 이유를 알아내는 것이 재독의 보상입니다.', sources: [source('미국의 고전 다시 읽기', '미국 의회도서관', 'https://www.loc.gov/exhibits/america-reads/')],
  },
  {
    ...common, id: 'norwegian-listen', index: 14, category: '도서', eyebrow: '제목부터 음악인 소설', title: '『노르웨이의 숲』은\n연애소설로 읽으면 놓치는 것', cardTitle: '『노르웨이의 숲』을\n연애소설로만 읽었다면',
    description: '누구와 사랑했는가보다 누가 살아남았는가를 묻는 청춘의 기록.', byline: '노르웨이의 숲 - 무라카미 하루키', cover: covers.norwegian, accent: '#DCE8DD', tags: ['#노르웨이의숲', '#상실', '#북플레이리스트'], books: [books.norwegian, books.klara],
    hook: '첫사랑의 추억처럼 시작하지만, 실제로는 죽은 사람을 기억하며 살아남는 법을 배우는 소설이다.', sections: [{ kicker: 'MEMORY TRIGGER', title: '노래 한 곡이 과거 전체를 불러낸다', body: '현재의 와타나베는 비틀스의 곡을 듣고 오래전 기억으로 이동한다. 음악은 분위기 장식이 아니라 억눌렀던 기억을 여는 스위치다.' }, { kicker: 'WHO SURVIVES?', title: '사랑이 누군가를 구할 수 있다는 착각', body: '인물들은 서로를 사랑하지만 상대의 고통을 대신 살아낼 수 없다. 돌봄의 진심과 구원할 수 있다는 오만 사이의 경계를 생각하게 한다.' }], debate: { question: '사랑하는 사람의 고통을 끝까지 책임져야 할까?', context: '곁을 지키는 책임과 자신의 삶을 보호할 권리가 충돌한다.', choices: ['사랑에는 끝까지 책임이 따른다', '누구도 타인의 삶을 대신 구할 수 없다'] }, playlist: [{ title: 'Norwegian Wood', artist: 'The Beatles', reason: '현재를 과거로 단숨에 옮기는 소설의 기억 장치.' }, { title: 'Reiko', artist: '기타 연주곡으로 골라 듣기', reason: '말보다 연주가 더 솔직해지는 마지막 밤을 떠올리게 한다.' }], facts: [{ label: '제목의 열쇠', text: '원제는 비틀스의 동명 곡에서 왔다. 한 곡이 개인의 기억과 소설 전체의 정서를 여는 장치가 된다.' }], editorNote: '등장인물을 커플로 나누지 말고, 각자가 상실을 견디는 방식으로 나눠보세요.', sources: [murakamiMusic, source('Norwegian Wood', 'The Beatles 공식 사이트', 'https://www.thebeatles.com/norwegian-wood-bird-has-flown')],
  },
  {
    ...common, id: 'camus-first', index: 15, category: '작가', eyebrow: '카뮈를 철학책 없이 시작하는 법', title: '“인생은 무의미하다”가\n카뮈의 결론은 아니다', cardTitle: '카뮈는 정말\n허무주의자였을까',
    description: '부조리를 인정한 뒤에도 살아가는 사람을 위한 세 단계 읽기.', byline: '알베르 카뮈 작가에 대해', cover: covers.stranger, accent: '#E6DFD3', tags: ['#카뮈', '#부조리', '#읽는순서'], books: [books.stranger, books.razor, books.gatsby],
    hook: '세상에 의미가 없으니 포기하자는 철학이 아니다. 답이 없어도 오늘을 어떻게 살 것인지가 카뮈의 진짜 질문이다.', sections: [{ kicker: 'STEP 1', title: '『이방인』으로 부조리를 체험한다', body: '개념부터 외우지 말고 뫼르소와 사회의 충돌을 따라간다. 세계가 요구하는 감정과 개인의 솔직함이 어긋나는 감각이 먼저다.' }, { kicker: 'STEP 2', title: '『시지프 신화』로 질문의 이름을 안다', body: '의미를 찾는 인간과 침묵하는 세계의 충돌을 카뮈는 부조리라 불렀다. 중요한 것은 발견 이후의 태도, 즉 도피하지 않고 살아가는 반항이다.' }], debate: { question: '삶에 객관적인 의미가 없어도 윤리적으로 살아야 할 이유가 있을까?', context: '초월적 정답이 없을 때 책임의 근거를 어디에서 찾을지가 남는다.', choices: ['함께 사는 인간에게서 찾는다', '보편적 근거 없이는 취향일 뿐이다'] }, playlist: [{ title: 'My Way', artist: 'Frank Sinatra', reason: '정답 없는 세계에서 선택의 결과를 감당하는 태도를 떠올리게 한다.' }], facts: [{ label: '오해 바로잡기', text: '카뮈는 부조리를 썼지만 허무에 머물지 않았고, 특정 이념이나 실존주의라는 분류에 자신을 가두는 데도 거리를 뒀다.' }], editorNote: '카뮈를 이해하려 애쓰기보다, 내가 의미 없다고 느끼면서도 계속하는 일을 하나 떠올려보세요.', sources: [nobelCamus],
  },
  {
    ...common, id: 'pachinko-family', index: 16, category: '도서', eyebrow: '역사책이 놓친 사람들의 역사', title: '나라가 지워도\n가족은 기억한다', cardTitle: '나라가 지워도\n가족은 기억한다',
    description: '『파친코』가 네 세대의 밥벌이와 수치심으로 역사를 증언하는 법.', byline: '파친코 - 이민진', cover: covers.pachinko, accent: '#9D915E', textColor: '#FFFFFF', tags: ['#파친코', '#재일조선인', '#가족서사'], books: [books.pachinko, books.humanActs],
    hook: '거대한 역사는 조약과 전쟁을 기록한다. 『파친코』는 그 사이에서 누가 이름을 바꾸고, 무엇을 먹고, 어떻게 살아남았는지를 기록한다.', sections: [{ kicker: 'HISTORY FROM BELOW', title: '생존은 영웅적이지 않아도 존엄하다', body: '인물들은 완벽한 선택을 하지 않는다. 차별과 가난 속에서 타협하고 숨기고 버티며 다음 세대의 가능성을 만든다. 소설은 생존의 도덕을 쉽게 판결하지 않는다.' }, { kicker: 'THE GAME', title: '파친코라는 공간의 양면', body: '파친코 산업은 배제된 이들에게 생계와 성공의 통로가 되면서도 사회적 낙인을 강화한다. 살아남게 한 일이 동시에 숨기고 싶은 일이 되는 모순이다.' }], debate: { question: '차별받는 사회에 동화되는 것은 배신일까 생존일까?', context: '이름과 언어, 정체성을 지키는 일과 가족의 안전을 확보하는 일이 충돌할 수 있다.', choices: ['정체성을 지키는 것도 책임이다', '살아남는 선택을 비난할 수 없다'] }, playlist: [{ title: 'Arirang', artist: '여러 지역의 아리랑 비교 듣기', reason: '떠남과 그리움이 세대마다 어떻게 다른 목소리로 이어지는지 듣는다.' }], facts: [{ label: '세계적 반향', text: '『파친코』는 전미도서상 최종 후보에 올랐고, 여러 매체의 2017년 주요 도서로 선정되며 재일조선인의 역사를 널리 알렸다.' }], editorNote: '인물의 선택을 현재의 안전한 자리에서 판결하기 전에, 그가 실제로 가질 수 있었던 선택지가 몇 개였는지 세어보세요.', sources: [source('이민진 작가·작품 정보', 'Penguin Random House', 'https://www.penguinrandomhouse.com/authors/2238584/min-jin-lee/'), source('『파친코』 작품 정보', 'National Book Foundation', 'https://www.nationalbook.org/books/pachinko/')],
  },
  {
    ...common, id: 'contradiction-life', index: 17, category: '도서', eyebrow: '세대를 건너 역주행한 인생책', title: '행복한 삶을 골랐는데\n왜 마음은 불행할까', cardTitle: '행복한 삶을 골랐는데\n왜 마음은 불행할까',
    description: '양귀자의 『모순』을 읽기 전, 내 인생의 대차대조표부터 펼쳐보는 시간.', byline: '모순 - 양귀자', cover: covers.contradiction, accent: '#4B382D', textColor: '#FFFFFF', tags: ['#양귀자', '#모순', '#인생책', '#선택'], books: [books.contradiction, books.remains, books.razor],
    hook: '불행을 피하려고 가장 안전한 답을 골랐는데, 그 선택이 나를 가장 오래 불행하게 만든다면 우리는 어디서부터 틀린 걸까.',
    sections: [
      { kicker: 'BEFORE READING', title: '두 가족, 두 남자, 어느 쪽도 정답이 아니다', body: '안진진의 엄마와 이모는 쌍둥이지만 정반대의 삶을 산다. 진진 앞의 두 남자 역시 예측 가능한 안정과 가난하지만 생생한 감정이라는 반대편에 서 있다. 소설은 어느 한쪽을 모범답안으로 내놓지 않는다.' },
      { kicker: 'READING KEY', title: '“누가 더 행복한가”보다 “나는 무엇을 견딜 수 있는가”', body: '모든 선택에는 얻는 것뿐 아니라 감당해야 할 결핍이 있다. 인물의 조건을 채점하는 대신, 그 삶의 어떤 무료함과 불안을 내가 견딜 수 있는지 물으면 이야기가 갑자기 자신의 문제가 된다.' },
    ],
    longRead: {
      eyebrow: 'LONG READ · 책을 펴기 전 3분',
      title: '삶은 답을 찾은 뒤 시작되는 것이 아니다',
      intro: '우리는 중요한 선택 앞에서 자주 완벽한 확신이 올 때까지 기다린다. 그러나 『모순』은 확신이 부족해서 삶을 시작하지 못하는 사람에게, 살아보는 일 자체가 탐구라고 조용히 등을 떠민다.',
      paragraphs: [
        '스물다섯의 안진진은 자신의 삶이 지나치게 밋밋하다고 느낀다. 겉으로는 선택지가 많아 보이지만, 정작 어느 방향으로 가야 하는지는 알 수 없다. 가족의 삶은 이미 두 개의 극단을 보여준다. 고단하고 소란스럽지만 뜨거운 삶, 부족함 없이 평온하지만 어딘가 식어 있는 삶. 가까이에서 두 인생을 모두 본 진진에게 행복은 더 이상 간단한 단어가 아니다.',
        '사람들은 흔히 불행의 반대편에 행복이 있다고 믿는다. 돈이 부족하면 돈이 있는 삶을, 관계가 시끄러우면 고요한 삶을 택하면 된다고 생각한다. 하지만 소설 속 두 가족을 오래 바라보면 반대말처럼 보였던 것들이 서로의 내부에 들어 있음을 알게 된다. 안정에는 무료함이, 열정에는 상처가, 사랑에는 외로움이, 자유에는 책임이 따라붙는다. 하나를 없애려고 선택한 것이 다른 얼굴로 돌아오는 순간, 삶은 모순이라는 제목을 얻는다.',
        '그래서 진진의 망설임은 우유부단함만으로 설명되지 않는다. 그는 어느 쪽을 택하든 포기해야 하는 세계가 있다는 사실을 어렴풋이 안다. 우리는 선택을 할 때 얻게 될 것만 계산하지만, 진짜 결정은 내가 어떤 결핍을 감당할 수 있는지 정하는 일에 가깝다. 완벽한 사람을 찾는 문제가 아니라, 그 사람과 함께할 때 생기는 불완전함까지 선택할 수 있는가의 문제다.',
        '이 지점에서 『모순』은 연애소설의 경계를 벗어난다. 진진이 바라보는 엄마와 이모의 삶, 두 남자 사이에서 흔들리는 마음은 모두 같은 질문으로 이어진다. 나는 내 인생을 직접 관찰하고 있는가. 아니면 타인이 행복이라고 부르는 조건을 모아놓고 그것이 나를 행복하게 해주기를 기다리고 있는가.',
        '삶을 관찰한다는 것은 매 순간 현명한 답을 찾는 일이 아니다. 오히려 내가 반복해서 후회하는 선택, 이상하게 끌리는 사람, 충분히 가졌는데도 사라지지 않는 허기를 모른 척하지 않는 일이다. 시행착오를 없애려는 대신 그 안에서 나에 대한 자료를 수집하는 태도다. 방향키를 돌릴 순간은 미래의 완벽한 내가 알려주지 않는다. 지금의 불편을 오래 바라본 사람이 먼저 알아차린다.',
        '책을 읽기 전에 자신의 대차대조표를 짧게 써보자. 남들이 부러워하지만 내게는 무거운 것, 불안정하지만 포기하고 싶지 않은 것, 안전을 위해 미루고 있는 것을 한 줄씩 적는다. 그리고 진진의 선택을 판결하기 전에 묻는다. 나라면 무엇을 얻기 위해서가 아니라, 어떤 모순과 함께 살기 위해 선택할 것인가. 그 질문을 품고 첫 장을 열면 『모순』은 다른 사람의 연애 이야기가 아니라 내 삶을 비추는 조사표가 된다.',
      ],
      interlude: '정답을 고르는 능력보다, 내가 고른 답의 모순까지 살아내는 힘이 인생을 만든다.',
      closingQuestion: '지금 당신은 원하는 삶을 살고 있나요, 아니면 불행하지 않을 것 같은 삶을 고르고 있나요?',
    },
    debate: { question: '결혼은 더 사랑하는 사람과 해야 할까, 더 안정적인 사람과 해야 할까?', context: '감정은 변하고 조건도 변한다. 사랑과 안정 중 하나를 우선하면 다른 하나의 결핍을 정말 감당할 수 있을까.', choices: ['사랑 없는 안정은 오래갈 수 없다', '생활의 안정이 사랑도 지켜준다'] },
    playlist: [{ title: '삶은 여행', artist: '이상은', reason: '목적지보다 살아가며 발견하는 자신에게 시선을 돌리게 한다.' }, { title: '어른', artist: 'Sondia', reason: '괜찮은 척 선택을 감당하는 어른의 쓸쓸함과 닿아 있다.' }, { title: 'Both Sides Now', artist: 'Joni Mitchell', reason: '사랑과 삶을 양쪽에서 본 뒤에도 남는 모순을 들려준다.' }],
    facts: [{ label: '세대를 건넌 역주행', text: '『모순』은 1998년 처음 출간됐고 2013년 개정판 이후에도 판매가 꾸준히 늘며 젊은 독자에게 다시 발견된 장기 베스트셀러다.' }, { label: '제목의 구조', text: '정반대 삶을 사는 쌍둥이 자매와 성격이 다른 두 남자는 행복과 불행이 깔끔하게 나뉘지 않는다는 사실을 서로 비추는 거울처럼 보여준다.' }],
    editorNote: '결말을 맞히려고 읽기보다, 진진의 선택 중 유독 화가 나는 순간을 표시해보세요. 그 분노가 내가 삶에서 가장 두려워하는 결핍을 알려줄 수 있습니다.',
    sources: [source('『모순』 출판사 리뷰·도서 정보', '알라딘', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=25843736'), source('『모순』 서지·줄거리 정보', 'KAIST 도서관', 'https://library.kaist.ac.kr/search/ctlgSearch/posesn/view.do?bibctrlno=351730&se=b0&ty=B'), source('장기 베스트셀러가 된 『모순』', '한국경제', 'https://www.hankyung.com/article/202402205669i')],
  },
  {
    ...common, id: 'odyssey-before-cinema', index: 18, category: '도서', eyebrow: '영화 『오디세이』 보기 전', title: '영화 『오디세이』 보기 전\n원작에서 알아야 할 것', cardTitle: '영화 『오디세이』 보기 전\n원작에서 알아야 할 것',
    description: '크리스토퍼 놀란의 영화 『오디세이』를 보기 전, 3천 년 된 귀향 이야기가 지금 다시 뜨거운 이유.', byline: '영화 오디세이 · 원작 오뒷세이아 - 호메로스', cover: covers.odyssey, accent: '#2B251F', textColor: '#FFFFFF', tags: ['#오디세이', '#오뒷세이아', '#크리스토퍼놀란', '#영화원작'], books: [books.odyssey, books.iliad, books.penelopiad],
    hook: '키클롭스와 세이렌은 예고편에 어울린다. 하지만 이 이야기를 3천 년 동안 살아남게 한 건, 영웅이 집에 돌아가서도 자신이 누구인지 증명해야 한다는 잔인한 질문이다.',
    sections: [
      { kicker: 'BEFORE THE SCREEN', title: '24권을 다 읽지 않아도 영화는 더 깊어진다', body: '트로이아 전쟁이 끝난 뒤 오디세우스는 이타카로 돌아가지 못한 채 오랜 세월 바다를 떠돈다. 이 한 줄만 기억해도 충분하다. 중요한 것은 괴물을 만나는 순서가 아니라, 매번 다른 얼굴로 살아남은 사람이 끝내 같은 사람으로 귀환할 수 있는가다.' },
      { kicker: 'THE FIRST CLUE', title: '첫 문장은 그를 “여러 방식의 인간”이라 부른다', body: '알라딘 기획전이 보여주는 원문의 첫 단어는 오디세우스를 단순히 강한 전사가 아니라 수많은 길과 꾀를 가진 사람으로 소개한다. 그는 힘보다 말, 위장, 인내로 살아남는다. 그래서 영웅인 동시에 믿기 어려운 이야기꾼이다.' },
    ],
    longRead: {
      eyebrow: 'LONG READ · 영화 보기 전 4분',
      title: '전쟁 영웅은 왜 집 앞에서 가장 작아지는가',
      intro: '『오뒷세이아』를 괴물 도감처럼 알고 있다면 절반만 알고 있는 셈이다. 이 서사시의 진짜 긴장은 바다 끝이 아니라, 모든 모험이 끝난 뒤 다시 누군가의 남편과 아버지, 왕이 되어야 하는 문턱에서 시작된다.',
      paragraphs: [
        '전쟁은 사람에게 단순한 이름을 준다. 승자와 패자, 지휘관과 병사, 영웅과 겁쟁이. 오디세우스 역시 트로이아에서 지략으로 이름을 얻었다. 그러나 전쟁이 끝나자 그 이름은 집으로 데려다주는 배가 아니라 계속해서 그를 붙잡는 무게가 된다. 바다 위에서는 어제의 명성이 식량을 구해주지 않고, 신들의 분노 앞에서 계급은 아무 힘도 없다. 영웅은 매번 낯선 해안에서 자신을 새로 설명해야 한다.',
        '그래서 『오뒷세이아』의 주인공은 검보다 이야기를 자주 사용한다. 이름을 숨기고, 과거를 고쳐 말하고, 상대가 듣고 싶어 하는 인물로 자신을 바꾼다. 이 능력을 영리함이라 부를 수도 있고 거짓말이라 부를 수도 있다. 영화에서 오디세우스가 어떤 표정으로 자신의 이야기를 전하는지 지켜보면 좋다. 화면에 펼쳐지는 모험은 정말 있었던 일인가, 살아남은 사람이 자기 삶에 부여한 가장 그럴듯한 편집본인가.',
        '그의 항해를 유명하게 만든 존재들은 대부분 욕망의 모양을 하고 있다. 모든 것을 잊게 하는 안식, 끝없이 알고 싶은 충동, 누구도 거부하기 어려운 노래, 영원히 머물러도 된다는 유혹. 괴물은 단순히 죽이러 오는 적이 아니다. 돌아가려는 이유를 잊게 만드는 순간이 더 위험하다. 집에 가고 싶다고 말하면서도 잠시 다른 삶을 꿈꾸는 오디세우스의 흔들림은 그래서 현대인의 마음과 멀지 않다.',
        '하지만 귀향은 오디세우스 혼자 만든 사건이 아니다. 이타카에서는 페넬로페가 시간을 벌고, 텔레마코스가 부재한 아버지의 자리를 둘러싼 세계에서 성장한다. 한 사람에게는 모험이었던 세월이 남겨진 사람에게는 기다림과 생존의 노동이었다. 영웅이 돌아온다는 문장 하나 뒤에는 그의 귀환을 가능하게 하려고 삶을 멈추지 않았던 사람들의 시간이 겹쳐 있다.',
        '여기서 고대 그리스의 환대가 중요해진다. 낯선 이를 먹이고 재운 뒤 누구인지 묻는 규칙은 작품 전체의 인물을 시험한다. 손님은 보호받아야 하지만 손님 역시 집의 질서를 짓밟아서는 안 된다. 누가 좋은 주인이고 누가 위험한 손님인지 살피다 보면 식탁, 문턱, 잠자리가 전투 장면만큼 긴장된 공간으로 바뀐다. 거대한 스크린에서 성과 바다만 보지 말고, 누가 누구에게 자리를 내어주는지도 보자.',
        '그리고 가장 불편한 질문이 남는다. 수많은 도시를 파괴하고 사람을 속여 살아남은 남자가 고향에 도착하는 순간, 과거의 영웅이라는 이유만으로 원래 자리를 돌려받아야 하는가. 귀환은 빼앗긴 것을 회복하는 정의일 수 있지만, 오랫동안 부재했던 사람이 자신의 권리를 폭력적으로 재확인하는 일이 될 수도 있다. 원전은 영웅을 칭송하면서도 그의 분노와 자만이 만든 대가를 숨기지 않는다.',
        '그래서 영화를 보기 전 원전을 읽는다는 것은 결말을 미리 아는 일이 아니다. 같은 장면 안에서 모험과 침략, 지혜와 기만, 충성의 기다림과 강요된 침묵을 동시에 볼 눈을 준비하는 일이다. 오디세우스를 응원하면서도 그가 말하지 않는 사람을 찾을 수 있다면, 스크린의 파도는 볼거리를 넘어 3천 년 동안 고쳐 말해온 하나의 질문이 된다. 집으로 돌아온 나는 떠나기 전의 나와 같은 사람인가.',
      ],
      interlude: '모험은 바다에서 끝난다. 귀향은 내가 떠난 동안 변한 사람들 앞에서 비로소 시작된다.',
      closingQuestion: '당신이라면 모든 것을 잊게 해주는 안전한 섬과, 나를 기다렸을지 확신할 수 없는 집 중 어디로 향할 건가요?',
    },
    debate: { question: '오디세우스는 지혜로운 영웅일까, 이야기를 독점한 침략자일까?', context: '그의 지략은 동료를 살리기도 하지만 자만과 폭력을 낳기도 한다. 승자의 모험담에서 목소리를 얻지 못한 사람까지 보면 영웅의 얼굴이 달라진다.', choices: ['불완전해도 귀환을 이룬 영웅이다', '자기 이야기를 영웅담으로 만든 승자다'] },
    playlist: [{ title: 'Song to the Siren', artist: 'Tim Buckley', reason: '돌아가고 싶은 마음과 위험한 부름에 끌리는 마음을 동시에 품는다.' }, { title: 'The Ecstasy of Gold', artist: 'Ennio Morricone', reason: '목적지를 눈앞에 둔 인간의 집착과 장대한 움직임을 끌어올린다.' }, { title: 'On the Nature of Daylight', artist: 'Max Richter', reason: '모험 뒤에 남은 기다림과 잃어버린 시간을 생각하게 한다.' }],
    facts: [{ label: '책이 되기 전의 노래', text: '『일리아스』와 『오뒷세이아』는 처음부터 고정된 한 권의 책이라기보다, 수백 년 동안 공연 속에서 구성되고 다시 불린 구전 서사시 전통에서 형성된 것으로 연구된다.' }, { label: '영화의 스케일', text: '유니버설 픽처스는 크리스토퍼 놀란의 영화 『오디세이』가 전편 IMAX 필름 카메라로 촬영됐다고 공식 소개한다.' }, { label: '세이렌의 원래 모습', text: '호메로스는 세이렌의 외형을 구체적으로 묘사하지 않았다. 고대 그리스 미술에서는 오늘날 익숙한 인어보다 인간 머리와 새의 몸을 가진 존재로 표현됐다.' }],
    editorNote: '완역본이 부담스럽다면 알라딘 기획전의 “쉽게 읽기” 판본으로 줄거리를 먼저 만나도 됩니다. 중요한 건 어느 번역으로 시작했는지가 아니라, 영화가 선택한 시선과 원전이 남긴 빈자리를 비교하는 일입니다.',
    sources: [source('오뒷세이아 판본·입문서 기획전', '알라딘', 'https://www.aladin.co.kr/events/wevent.aspx?EventId=312819&start=we'), source('영화 『The Odyssey』 공식 정보', 'Universal Pictures', 'https://www.universalpictures.com/movies/the-odyssey'), source('호메로스 서사시와 구전 전통', 'Cambridge University Press', 'https://www.cambridge.org/core/books/cambridge-guide-to-homer/introduction/A758931C64C54C11EE43039C00C011D5'), source('오디세우스와 세이렌의 고대 미술', 'The Metropolitan Museum of Art', 'https://www.metmuseum.org/exhibitions/listings/2018/dangerous-beauty/exhibition-gallery')],
  },
  {
    ...common, id: 'agentic-coding-shift', index: 19, category: '테크', eyebrow: 'AI가 코드를 쓰기 시작한 뒤', title: '개발자의 일이 사라진 게 아니라\n앞뒤로 이동했다', cardTitle: 'AI가 코드를 짜면\n개발자는 뭘 해야 할까',
    description: '클로드 코드 열풍 뒤에 숨은 진짜 변화는 타이핑 속도가 아니라 문제를 정의하고 결과를 검증하는 능력이다.', byline: '클로드 코드 제대로 시작하기 - 주홍철·황진성', cover: covers.claudeCode, accent: '#F36F55', tags: ['#클로드코드', '#에이전틱코딩', '#바이브코딩', '#AI개발'], books: [books.claudeCode],
    hook: 'AI에게 “앱 하나 만들어줘”라고 말할 수 있는 시대다. 그런데 결과가 틀렸을 때 무엇이 틀렸는지 설명할 수 없다면, 코드를 얻은 것이 아니라 검증되지 않은 빚을 얻은 셈이다.',
    sections: [
      { kicker: 'NOT JUST AUTOCOMPLETE', title: 'AI는 다음 줄이 아니라 다음 행동을 제안한다', body: '에이전틱 코딩 도구는 저장소를 읽고, 여러 파일을 수정하고, 명령어와 테스트를 실행하며 결과를 다시 관찰한다. 사람은 매 줄을 입력하는 대신 목표와 경계를 정하고 중간 결과를 승인하는 위치로 이동한다.' },
      { kicker: 'THE REAL UPGRADE', title: '프롬프트보다 중요한 것은 작업 환경이다', body: '책이 MCP, PRD, Design.md, SDD, 훅과 스킬을 함께 다루는 이유도 여기에 있다. 한 번 멋진 지시를 만드는 것보다 프로젝트 규칙, 테스트 명령, 금지된 행동과 완료 조건을 반복해서 읽을 수 있는 형태로 남기는 편이 안정적이다.' },
    ],
    longRead: {
      eyebrow: 'LONG READ · 에이전트 시대의 개발자',
      title: '코드를 쓰지 않는 순간에도 개발은 계속된다',
      intro: '“AI가 개발자를 대체할까?”라는 질문은 너무 크고, 그래서 쉽게 공포나 낙관으로 흐른다. 지금 더 유용한 질문은 이것이다. 코드 작성의 비용이 급격히 낮아질 때, 소프트웨어를 잘 만든다는 말의 중심은 어디로 이동하는가.',
      paragraphs: [
        '오랫동안 프로그래밍 실력은 빈 화면에 정확한 코드를 빠르게 적는 장면으로 상징됐다. 그러나 실제 프로젝트에서 시간을 잡아먹는 일은 그 앞뒤에 더 많았다. 무엇을 만들어야 하는지 합의하고, 낡은 코드가 왜 그렇게 생겼는지 파악하고, 변경이 다른 기능을 깨뜨리지 않았는지 확인하며, 문제가 생겼을 때 어디까지 되돌릴지 판단하는 일이다. 코딩 에이전트는 타이핑을 줄여주지만 이 질문들을 없애주지는 않는다.',
        '도구가 한 단계 더 자율적으로 움직이면 사람의 지시는 자연어 요청에서 작업 계약으로 바뀐다. “로그인을 고쳐줘”는 시작일 뿐이다. 어떤 사용자의 어떤 실패를 고쳐야 하는지, 기존 데이터와 화면은 무엇을 유지해야 하는지, 성공을 어떤 테스트로 증명할지까지 적어야 한다. 모호한 요구를 받은 에이전트는 멈추기보다 그럴듯한 가정을 만들 가능성이 있다. 속도가 빠를수록 잘못된 가정도 더 멀리 간다.',
        '그래서 바이브 코딩 다음에 필요한 것이 스펙과 하네스다. 스펙은 결과가 무엇이어야 하는지 말하고, 하네스는 에이전트가 그 결과에 도달했는지 확인할 환경을 만든다. 테스트, 타입 검사, 린트, 빌드, 코드 리뷰 체크리스트는 귀찮은 마무리가 아니라 AI의 행동 반경을 결정하는 난간이 된다. 좋은 자동화는 사람의 판단을 없애는 대신 판단해야 할 순간을 더 선명하게 드러낸다.',
        '프로젝트 지침 파일도 같은 역할을 한다. 팀의 실행 명령, 코드 스타일, 건드리면 안 되는 경계, 배포 전에 반드시 확인할 항목을 저장소 안에 남겨두면 매번 긴 프롬프트를 다시 쓰지 않아도 된다. 이는 AI만을 위한 문서가 아니다. 새로 합류한 사람에게도 프로젝트가 실제로 어떻게 움직이는지 보여주는 운영 설명서가 된다. 에이전트를 잘 쓰려다 팀의 암묵지가 문서화되는 역설적인 이득이다.',
        'MCP, 스킬, 훅, 서브에이전트와 멀티 에이전트는 여기서 작업 범위를 넓힌다. 도구가 디자인, 문서, 이슈, 브라우저, 데이터베이스와 연결되면 하나의 요청이 실제 업무 흐름을 가로지를 수 있다. 하지만 연결이 많아진다는 것은 더 똑똑해진다는 뜻만이 아니다. 읽을 수 있는 비밀, 수정할 수 있는 파일, 실행 가능한 명령이 늘어난다는 뜻이기도 하다. 편리함과 공격 표면은 함께 커진다.',
        '따라서 권한 확인을 모두 없애는 것이 성숙한 자동화는 아니다. 반대로 모든 사소한 행동을 계속 승인하게 하면 사용자는 경고를 읽지 않는 승인 피로에 빠진다. 중요한 것은 에이전트가 자유롭게 움직여도 되는 좁고 명확한 공간을 만드는 일이다. 별도 브랜치, 제한된 자격 증명, 파일시스템과 네트워크 경계, 되돌릴 수 있는 커밋이 그 공간을 구성한다.',
        '이 변화는 비개발자에게도 문을 연다. Anthropic이 실제 사용 세션을 분석한 연구에서는 사람이 주로 무엇을 만들지 결정하고, 에이전트가 어떻게 실행할지를 더 많이 결정하는 분업이 관찰됐다. 특히 코딩 경력만큼이나 문제 영역에 대한 지식이 성공을 높였다. 병원 업무를 아는 사람, 물류의 예외를 아는 사람, 동네 서점의 불편을 아는 사람이 구현 장벽을 낮출 수 있다는 뜻이다.',
        '그렇다고 전문성이 사라지는 것은 아니다. 코드가 빨리 만들어질수록 무엇을 만들지 잘못 정했을 때 낭비되는 코드도 빨리 늘어난다. 보안 취약점과 데이터 손실은 문장이 자연스럽고 화면이 예쁘다는 이유로 사라지지 않는다. 에이전트 시대의 개발자는 모든 코드를 직접 쓰는 사람보다, 문제를 작은 계약으로 나누고 위험을 제한하며 결과의 증거를 요구할 수 있는 사람에 가까워진다.',
      ],
      interlude: 'AI에게 일을 넘기는 능력보다, 어떤 증거가 나오기 전까지 일을 끝났다고 부르지 않는 능력이 더 중요하다.',
      closingQuestion: '내가 AI에게 맡긴 결과가 틀렸을 때, 틀렸다는 사실을 발견할 장치를 먼저 만들어두었나요?',
    },
    debate: { question: 'AI가 작성한 코드에서 사고가 나면 최종 책임은 누구에게 있을까?', context: '사용자는 내부 구현을 모두 읽지 않았고, 개발자는 AI가 만든 변경을 승인했으며, 도구 회사는 결과 검증을 사용자에게 요구한다. 책임을 한곳에만 두기 어려운 구조다.', choices: ['배포를 승인한 사람과 조직의 책임이다', '도구 제공자도 결과에 책임져야 한다'] },
    playlist: [{ title: 'Harder, Better, Faster, Stronger', artist: 'Daft Punk', reason: '자동화가 약속하는 생산성과 그 안에서 기계처럼 반복되는 인간의 경계를 함께 떠올리게 한다.' }, { title: 'Technologic', artist: 'Daft Punk', reason: '명령어가 쌓여 하나의 워크플로가 되는 에이전틱 코딩의 리듬을 닮았다.' }, { title: 'Everything in Its Right Place', artist: 'Radiohead', reason: '코드가 빠르게 정리될수록 무엇이 올바른 자리인지 결정하는 사람의 책임을 묻는다.' }],
    facts: [{ label: '40만 개 세션에서 본 변화', text: 'Anthropic은 2025년 10월부터 2026년 4월까지 약 40만 개의 Claude Code 세션을 분석했다. 전형적인 세션에서 사람은 무엇을 할지, Claude는 어떻게 실행할지를 더 많이 결정했으며 도메인 전문성이 성공과 연결됐다.' }, { label: '자율성과 안전의 역설', text: 'Anthropic은 파일시스템과 네트워크 경계를 둔 샌드박싱이 내부 사용에서 권한 확인 요청을 84% 줄였다고 보고했다. 더 많은 권한보다 명확한 경계가 자율성을 높인 사례다.' }, { label: '책의 범위', text: '2026년 8월 출간된 이 책은 바이브 코딩뿐 아니라 MCP, PRD, 스펙 주도 개발, 훅, 스킬, 서브에이전트와 멀티 에이전트까지 다룬다.' }],
    editorNote: '책을 처음부터 끝까지 외우려 하지 말고, 실제 프로젝트 하나를 정해 “규칙 문서 작성 → 작은 작업 위임 → 테스트로 검증 → 변경 검토”를 반복하며 읽는 편이 좋습니다. 도구의 메뉴보다 실패를 줄이는 루프가 오래 남습니다.',
    sources: [source('『클로드 코드 제대로 시작하기』 도서 정보', '알라딘', 'https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=399290397'), source('실제 Claude Code 사용 40만 세션 분석', 'Anthropic Research', 'https://www.anthropic.com/research/claude-code-expertise'), source('Claude Code 에이전틱 코딩 모범 사례', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/claude-code-best-practices'), source('에이전트 권한과 샌드박싱', 'Anthropic Engineering', 'https://www.anthropic.com/engineering/claude-code-sandboxing')],
  },
];

const featuredMagazineIds = ['agentic-coding-shift', 'odyssey-before-cinema', 'contradiction-life'];

export const magazines: Magazine[] = [...magazineSeeds]
  .sort((a, b) => {
    const aFeaturedIndex = featuredMagazineIds.indexOf(a.id);
    const bFeaturedIndex = featuredMagazineIds.indexOf(b.id);
    if (aFeaturedIndex >= 0 && bFeaturedIndex >= 0) return aFeaturedIndex - bFeaturedIndex;
    if (aFeaturedIndex >= 0) return -1;
    if (bFeaturedIndex >= 0) return 1;
    return a.index - b.index;
  })
  .map((magazine, index) => ({ ...magazine, index: index + 1 }));

export const magazineCategories: MagazineCategory[] = ['전체', '도서', '작가', '명사', '독서법', '북채널', '테크'];

export function getMagazine(id?: string) {
  return magazines.find((magazine) => magazine.id === id);
}
