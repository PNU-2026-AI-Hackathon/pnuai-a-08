# 서로서가

서로서가는 책 대여 현황과 개인 서재를 한눈에 확인하는 React Native 앱입니다. 현재 버전은 제공된 `pictures/UI_home.png`의 따뜻한 서재 분위기를 바탕으로 홈 화면과 5개 하단 탭을 구현한 UI 프로토타입입니다.

## 기술 스택

- React Native + Expo
- TypeScript
- Expo Router
- Expo Development Build (`expo-dev-client`)
- npm
- Android 우선 개발, iOS 호환 구조

## 설치 방법

Node.js LTS와 npm이 필요합니다.

```bash
cd C:\seoroseoga
npm install
```

## Android 실행 방법

Android Studio와 Android SDK를 설치하고 에뮬레이터를 실행하거나 USB 디버깅이 활성화된 Android 기기를 연결합니다.

최초 실행 또는 네이티브 의존성이 변경된 경우:

```bash
npm run android
```

개발 빌드가 기기에 설치된 이후 JavaScript/TypeScript만 수정할 때:

```bash
npm run start:dev-client
```

터미널에서 `a`를 누르거나 설치된 서로서가 개발 빌드에서 표시된 개발 서버에 연결합니다.

SDK 54용 Expo Go에서 실행할 때:

```bash
npm start
```

표시된 QR 코드를 갤럭시의 Expo Go 앱으로 스캔합니다. 휴대폰과 개발 PC는 같은 네트워크에 연결되어 있어야 합니다.

## Expo Development Build

Expo Development Build는 `expo-dev-client`가 포함된 앱 전용 개발 클라이언트입니다. Expo Go와 달리 프로젝트가 사용하는 네이티브 모듈과 설정을 포함할 수 있습니다. `npm run android`는 Android 네이티브 프로젝트를 생성·빌드해 개발 클라이언트를 설치하고, `npm start`는 해당 클라이언트가 연결할 Metro 개발 서버를 실행합니다.

네이티브 모듈 추가, Expo 설정 플러그인 변경, 앱 식별자 변경 시에는 `npm run android`로 개발 빌드를 다시 만들어야 합니다.

## 디렉터리 구조

```text
seoroseoga/
├─ app/
│  ├─ (tabs)/
│  │  ├─ _layout.tsx       # 하단 탭 내비게이션
│  │  ├─ home.tsx          # 홈 화면
│  │  └─ ...               # 탭 placeholder 화면
│  ├─ _layout.tsx          # 앱 루트 레이아웃
│  └─ index.tsx            # 홈 탭으로 초기 이동
├─ components/
│  ├─ BookShelf.tsx        # 책 카드, 캐러셀, 선반, 인디케이터
│  └─ PlaceholderScreen.tsx
├─ constants/
│  └─ theme.ts             # 색상, 간격, 반경, 타이포그래피
├─ data/
│  └─ books.ts             # 로컬 목데이터
├─ hooks/
│  └─ useHomeBooks.ts       # 비동기 조회 상태와 재시도 처리
├─ models/
│  └─ Book.ts               # Firebase SDK에 독립적인 앱 모델
├─ services/
│  └─ bookRepository.ts     # 목데이터/Firebase 교체 경계
├─ pictures/
│  └─ UI_home.png          # 디자인 기준 이미지
├─ app.json
├─ package.json
└─ tsconfig.json
```

기존 자료 폴더는 앱과 무관한 원본 자료이므로 그대로 유지합니다.

## 주요 npm script

- `npm start`: SDK 54 Expo Go용 Metro 서버 실행
- `npm run start:dev-client`: Development Build용 Metro 서버 실행
- `npm run android`: Android 네이티브 개발 빌드 생성 및 실행
- `npm run ios`: iOS 네이티브 개발 빌드 생성 및 실행(macOS 필요)
- `npm run web`: 웹 개발 서버 실행
- `npm run typecheck`: TypeScript 정적 타입 검사
- `npm run lint`: Expo ESLint 검사

## 현재 구현 범위

- 초기 화면을 홈으로 설정한 5개 탭: 탐색, 대여, 홈, 커뮤니티, 마이페이지
- Safe Area가 적용된 반응형 홈 화면
- 상단 인사말, 부제, 알림 아이콘
- 목데이터 기반 `빌린 책`, `나의 책` 가로 페이지 캐러셀
- 로컬 그라데이션 표지, 나무 선반, 현재 페이지 인디케이터
- 화면 폭에 따라 한 페이지의 책 수와 카드 크기 조정
- 마이페이지 탭의 제목 placeholder 화면
- 검색 가능한 탐색 탭 3열 도서 카드 그리드
- 대여 거래 상태와 안 읽은 메시지를 표시하는 커뮤니티 채팅방 목록

## Firebase 연동 방향

- UI는 Firebase SDK를 직접 호출하지 않고 `services`의 repository를 통해 데이터를 조회합니다.
- Firebase 프로젝트가 준비되면 `BookRepository`의 목 구현을 Firestore 구현으로 교체합니다.
- Firestore `Timestamp` 등 SDK 전용 값은 repository에서 ISO 문자열 같은 앱 모델 값으로 변환합니다.
- 사용자별 데이터는 인증 사용자 UID를 문서 경로 또는 쿼리 기준으로 사용합니다.
- 클라이언트 코드와 별개로 Firestore Security Rules에서 소유권과 읽기·쓰기 권한을 반드시 검증합니다.
- Firebase 설정은 환경별 설정 파일로 관리하고 서비스 계정 비밀키는 앱이나 저장소에 포함하지 않습니다.

## 향후 iOS 대응 시 확인할 항목

- macOS/Xcode 환경에서 `npm run ios` 빌드 확인
- Apple Developer Team, Bundle Identifier, 서명 및 프로비저닝 설정
- iPhone 모델별 Safe Area와 하단 홈 인디케이터 여백 확인
- iOS 기본 글꼴의 한글 줄바꿈 및 자간 차이 확인
- 스크롤 탄성, 그림자, 탭 바 높이 등 플랫폼별 시각 차이 점검
- 알림 기능 연결 시 APNs 권한 문구와 실제 기기 테스트
