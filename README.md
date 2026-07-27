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
npm start
```

터미널에서 `a`를 누르거나 설치된 서로서가 개발 빌드에서 표시된 개발 서버에 연결합니다.

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
├─ pictures/
│  └─ UI_home.png          # 디자인 기준 이미지
├─ app.json
├─ package.json
└─ tsconfig.json
```

기존 자료 폴더는 앱과 무관한 원본 자료이므로 그대로 유지합니다.

## 주요 npm script

- `npm start`: Development Build용 Metro 서버 실행
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
- 홈 이외 탭의 제목 placeholder 화면

## 향후 iOS 대응 시 확인할 항목

- macOS/Xcode 환경에서 `npm run ios` 빌드 확인
- Apple Developer Team, Bundle Identifier, 서명 및 프로비저닝 설정
- iPhone 모델별 Safe Area와 하단 홈 인디케이터 여백 확인
- iOS 기본 글꼴의 한글 줄바꿈 및 자간 차이 확인
- 스크롤 탄성, 그림자, 탭 바 높이 등 플랫폼별 시각 차이 점검
- 알림 기능 연결 시 APNs 권한 문구와 실제 기기 테스트

