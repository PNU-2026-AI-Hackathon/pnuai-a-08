# 서로서가

서로서가는 책 대여, 탐색, 커뮤니티 기능을 중심으로 구성한 Expo React Native 앱입니다.
현재 프로젝트의 주 작업 대상은 루트의 Expo 앱이며, Android 네이티브 폴더는 Expo/Android 빌드용 설정과 산출물을 담습니다.

## 기술 스택

- React Native
- Expo
- Expo Router
- TypeScript
- Firebase Authentication
- npm

## 실행 방법

```bash
npm install
```

Expo Go로 실행:

```bash
npm start
```

Android 개발 빌드 실행:

```bash
npm run android
```

Dev Client Metro 실행(google oauth 이슈로 인해 해당 방식의 실행을 권고함.):

```bash
npm run start:dev-client
```

타입 검사:

```bash
npm run typecheck
```

## 프로젝트 구조

```text
app/
  _layout.tsx          앱 최상위 레이아웃. AuthProvider와 Stack 연결
  index.tsx            로그인 상태에 따라 login 또는 tabs/home으로 redirect
  login.tsx            이메일/비밀번호 로그인 화면
  (tabs)/
    _layout.tsx        하단 탭 레이아웃. 비로그인 사용자의 탭 직접 접근 차단
    home.tsx           홈 화면
    explore.tsx        탐색 화면
    rental.tsx         대여 화면
    community.tsx      커뮤니티 화면
    mypage.tsx         마이페이지 및 로그아웃

auth/
  AuthProvider.tsx     Firebase Auth 상태를 앱 전체에 공급하는 Context Provider

lib/
  firebase.ts          Firebase 앱/Auth 초기화

components/
  BookShelf.tsx        홈 화면 책장 UI
  ExploreBookCard.tsx  탐색 화면 책 카드 UI
  ChatRoomRow.tsx      커뮤니티 채팅방 행 UI
  PlaceholderScreen.tsx 공통 placeholder 화면

constants/
  theme.ts             색상, 간격, radius, typography 상수

data/
  books.ts             홈/대여 관련 목데이터
  exploreBooks.ts      탐색 화면 목데이터
  chatRooms.ts         커뮤니티 목데이터

hooks/
  useHomeBooks.ts      홈 화면 데이터 로딩 훅
  useExploreBooks.ts   탐색 화면 데이터 로딩 훅
  useChatRooms.ts      커뮤니티 데이터 로딩 훅

models/
  Book.ts              책 데이터 타입
  ChatRoom.ts          채팅방 데이터 타입

services/
  bookRepository.ts    책 데이터 접근 계층
  chatRepository.ts    채팅방 데이터 접근 계층

types/
  firebase-auth-rn.d.ts Firebase Auth React Native 타입 보정

assets/, pictures/     이미지 리소스
docs/                  기획/발표 자료
android/               Android 네이티브 빌드 설정
```

`seoroseoga_3_activities/`가 있는 경우, 이 폴더는 업그레이드 이전 Android/Kotlin 버전의 레퍼런스입니다. 현재 Expo 앱 구현 대상에는 포함하지 않습니다.

## 인증 흐름

현재 인증은 Firebase Authentication 기반 Google 로그인으로 구성되어 있습니다.

- `app/_layout.tsx`에서 `AuthProvider`가 앱 전체를 감쌉니다.
- `AuthProvider`는 Firebase Auth의 `onAuthStateChanged`를 구독해서 `user`, `loading`, Google 로그인/로그아웃 함수를 제공합니다.
- Google 로그인은 `@react-native-google-signin/google-signin` native Google Sign-In으로 `idToken`을 받은 뒤, Firebase `GoogleAuthProvider.credential()`로 변환하고 `signInWithCredential()`로 Firebase Auth에 로그인합니다.
- 처음 사용하는 Google 계정이면 Firebase Auth 사용자가 자동 생성되고, 이미 등록된 Google 계정이면 기존 사용자로 로그인됩니다.
- 클라이언트에서는 Google 로그인 직후 이메일이 `.ac.kr`로 끝나는지 확인하고, 학교 이메일이 아니면 즉시 로그아웃시켜 앱 진입을 막습니다.
- 각 화면에서는 `useAuth()`로 인증 상태와 함수를 가져옵니다.
- `app/index.tsx`는 앱 진입 시 로그인 상태를 확인해서 `/login` 또는 `/(tabs)/home`으로 보냅니다.
- `app/(tabs)/_layout.tsx`는 로그인하지 않은 사용자가 탭 화면에 직접 접근하면 `/login`으로 보냅니다.
- `app/(tabs)/mypage.tsx`에서 로그아웃을 실행합니다.

## 변경 현황

### 2026-08-05

- 이메일/비밀번호 로그인 화면을 Google 로그인 버튼 기반 화면으로 교체했습니다.
- `AuthProvider`에 `signInWithGoogle()`을 추가했습니다.
- Google OAuth 결과로 받은 `id_token`을 Firebase credential로 변환해 Firebase Auth 로그인에 연결했습니다.
- `.ac.kr` 학교 이메일이 아닌 Google 계정은 로그인 직후 로그아웃 처리하고 로그인 화면에 안내 메시지를 표시합니다.
- Expo OAuth 흐름을 위해 `expo-auth-session`, `expo-crypto`, `expo-web-browser`를 추가했습니다.
- Expo Go 테스트용 Google redirect URI를 환경변수 `EXPO_PUBLIC_EXPO_GOOGLE_REDIRECT_URI`로 분리했습니다.

### 2026-08-11

Google 로그인 로컬 테스트를 Expo Go/AuthSession 기준에서 EAS development build와 native Google Sign-In 기준으로 전환했습니다.

문제와 판단은 다음과 같습니다.

- Web 로컬 실행에서는 Google OAuth 로그인 후 redirect가 로컬 개발 서버로 돌아오기 때문에 `id_token`을 받아 Firebase 로그인까지 진행할 수 있었습니다.
- 하지만 Android 앱에서 테스트할 때는 당시 실행 환경이 Expo Go였고, 우리 앱의 Android package, app scheme, keystore 서명을 가진 실제 앱이 아니었습니다.
- 기존 구현은 Expo Go 테스트를 위해 `https://auth.expo.io/@seoroseoga_project/seoroseoga` redirect proxy를 사용했습니다. Google에서 받은 OAuth 응답을 Expo proxy가 받은 후 우리 폰의 Expo Go 세션으로 돌려주는 방식이었습니다.
- Expo 문서상 Expo Go 기반 OAuth proxy 흐름은 더 이상 권장/지원되지 않는 방향이었고, 실제 앱 테스트에서도 redirect 응답을 안정적으로 받아오지 못했습니다.
- 그래서 Expo Go를 버리고, 직접 EAS development build APK를 만들어 `com.seoroseoga.app` 패키지와 `seoroseoga` app scheme을 가진 실제 개발용 앱에서 테스트하기로 했습니다.
- 이 과정에서 EAS project를 연결하고, `eas.json` development APK profile을 만들고, EAS managed Android keystore를 생성했습니다. 
- EAS project 연결은 `app.json`의 `owner`, `slug`, `extra.eas.projectId`로 이 로컬 프로젝트가 Expo 서버의 어떤 프로젝트인지 식별하게 해주는 작업입니다. EAS project id는 Expo/EAS 서버에서 빌드와 credentials를 연결하는 식별자입니다.
- app.json 속 Android package name은 앱 내부의 Android 식별자입니다.
- 정리하면: 
-   EAS 빌드 서버가 “어느 Expo 프로젝트냐?” 판단 → owner / slug / extra.eas.projectId
-   Google/Firebase가 “어느 Android 앱이냐?” 판단 → android.package + keystore SHA fingerprint
- Android APK는 설치/업데이트를 위해 반드시 인증서로 서명되어야 합니다. EAS managed keystore는 그 서명에 필요한 private key와 certificate를 EAS 서버에 저장하고, 이후 같은 프로젝트의 빌드에서 재사용합니다. 
- EAS Build는 JS bundle과 native 설정, `google-services.json`, Android 리소스/매니페스트를 모아 APK를 만들고, 이 keystore로 APK에 서명한 뒤 설치 가능한 빌드 산출물을 생성합니다. Firebase/Google에는 이 keystore certificate의 SHA-1/SHA-256 fingerprint를 등록해서 “이 요청이 `com.seoroseoga.app`으로 서명된 앱에서 온 요청”임을 맞춥니다.
- Firebase에는 기존 `com.example.seoroseoga` 앱과 별도로 `com.seoroseoga.app` Android 앱을 추가하고, EAS keystore의 인증서의 해시값인 SHA-1/SHA-256 fingerprint를 등록했습니다.
- google oauth 를 요청할때 인증서의 해시값을 확인하여 사전에 google에 등록된 oauth 요청을 하용하는 앱이 맞는지 확인 후 , apk 에 대한 개인키 서명값을 검증함으로써 해당 앱이 올바른 개발자의 작업중인 앱이 맞는지 확인 후 맞으면 google oauth 는 인증과정을 진행한 후 access token 과 refresh token 을 내어줍니다.
- 그 다음 `expo-auth-session`을 유지한 채 redirect URI만 `seoroseoga://` custom scheme으로 바꿔 테스트했습니다.
- 하지만 Google Web OAuth 자체가 `seoroseoga://` 같은 custom scheme redirect URI를 허용하지 않아 `400 invalid_request`로 거부했습니다.
- 따라서 Android Google 로그인은 Expo Go/AuthSession redirect 방식이 아니라, Android native 인증 흐름(인증 완료 결과 토큰을 url 을 통해서 전달하는 것이 아닌 휴대폰의 하부 리소스 딴으로 전달)을 사용하는 `@react-native-google-signin/google-signin` 방식으로 전환했습니다.
- 처음 development build를 만든 직접적인 이유는 우리 앱의 custom scheme redirect URI를 사용하기 위해서였습니다. 하지만 최종적으로 custom scheme redirect는 사용하지 않게 되었고, 대신 native Google Sign-In으로 로그인 흐름을 바꿨습니다. 
- 그래도 development build는 여전히 필요합니다. `@react-native-google-signin/google-signin`은 Expo Go에 포함되지 않은 native module이므로 Expo Go에서는 실행할 수 없고, 이 native module이 포함된 development APK를 다시 빌드해야 테스트할 수 있습니다.

구체적으로 수행한 작업은 다음과 같습니다.

- `eas.json`: Android development build APK 프로필을 추가했습니다.
- `app.json`: EAS project id와 owner를 연결하고, Android `googleServicesFile`을 `./google-services.json`으로 지정했습니다.
- `google-services.json`: Firebase Android 앱 `com.seoroseoga.app`의 설정 파일을 프로젝트 루트에 추가했습니다.
- `package.json`, `package-lock.json`: `@react-native-google-signin/google-signin`을 추가했습니다.
- `auth/AuthProvider.tsx`: `expo-auth-session` 기반 redirect 로그인 코드를 제거하고 `GoogleSignin.signIn()`으로 `idToken`을 받아 Firebase Auth에 로그인하도록 바꿨습니다.
- `.env`: 더 이상 사용하지 않는 `EXPO_PUBLIC_EXPO_GOOGLE_REDIRECT_URI`를 제거했습니다.
- `package.json`, `package-lock.json`: EAS `npm ci --include=dev` 단계에서 peer dependency 충돌을 일으키던 루트 직접 의존성 `@firebase/auth`를 제거했습니다. Firebase Auth import는 `firebase/auth`를 사용합니다.
- `AGENTS.md`: 팀원이나 Codex 에이전트가 EAS development build, Expo 로그인, APK 설치, Google Sign-In 구조를 따라갈 수 있도록 작업 지침을 추가했습니다.

파일별 주요 변경은 다음과 같습니다.

- `auth/AuthProvider.tsx`: native Google Sign-In 요청, Firebase credential 변환, `signInWithCredential()` 로그인, `.ac.kr` 이메일 검사 로직을 담당합니다.
- `app/login.tsx`: 이메일/비밀번호 입력 UI를 제거하고 Google 로그인 버튼과 학교 이메일 제한 에러 메시지를 표시합니다.
- `lib/firebase.ts`: 직접 변경하지 않았으며, 기존 Firebase Auth/AsyncStorage persistence 구조를 그대로 사용합니다.
- `.env`: Google Sign-In 설정에 사용하는 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`와 Firebase JS SDK 설정값을 관리합니다.
- `package.json`, `package-lock.json`: native Google Sign-In 패키지를 추가하고 불필요한 루트 `@firebase/auth` 의존성을 제거했습니다.
- `app.json`: EAS project 정보, Google Sign-In config plugin, Android `googleServicesFile` 설정을 포함합니다.

## Google OAuth 설정 현황

- Firebase Console에서 Google sign-in provider가 활성화되어 있습니다.
- Firebase Android 앱의 package name은 `com.seoroseoga.app`으로 설정되어 있습니다.
- Firebase Android 앱에는 EAS managed keystore의 SHA-1, SHA-256 fingerprint가 등록되어 있습니다.
- `google-services.json`은 프로젝트 루트에 있으며 `app.json`의 `android.googleServicesFile`에서 참조합니다.
- Google OAuth Web client ID는 `.env`의 `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`에 설정되어 있으며(한 firebase 프로젝트 속 여러 앱들에 대해 각 앱 마다 하나씩 부여), `GoogleSignin.configure()`에서 사용합니다.
- Expo Go 테스트용 redirect URI인 `EXPO_PUBLIC_EXPO_GOOGLE_REDIRECT_URI`는 더 이상 사용하지 않습니다.
- native module과 Android 설정이 들어갔기 때문에 Google 로그인 테스트는 Expo Go가 아니라 EAS development build APK에서 진행합니다.
- 현재 `.ac.kr` 제한은 클라이언트 레벨 제한입니다. Firestore를 붙이면 Security Rules에서도 `request.auth.token.email` 기반으로 `.ac.kr` 검사를 추가해야 합니다.

## Firebase Auth 주의사항

React Native에서 Firebase Auth 로그인 유지에는 AsyncStorage 기반 persistence가 필요합니다.

이 프로젝트는 `lib/firebase.ts`에서 다음 흐름으로 Auth를 초기화합니다.

- Firebase App 초기화
- `initializeAuth`로 React Native persistence 연결
- 이미 초기화된 경우 `getAuth`로 기존 Auth 인스턴스 재사용

Firebase Auth의 React Native persistence 관련 export는 번들/타입 해석 차이 때문에 TypeScript에서 바로 잡히지 않을 수 있습니다. 그래서 `types/firebase-auth-rn.d.ts`에서 `getReactNativePersistence` 타입을 보정합니다.

문제의 핵심은 다음과 같습니다.

- Metro 런타임 번들러는 React Native 조건의 Firebase Auth 번들을 선택할 수 있습니다.
- TypeScript는 일반 public 타입 파일을 먼저 선택해 `getReactNativePersistence`를 못 찾을 수 있습니다.
- 따라서 런타임은 동작하지만 타입체크만 실패하는 상황이 생길 수 있습니다.

이 타입 보정 파일은 그 차이를 메우기 위한 용도입니다.

## 현재 구현 범위

- Expo Router 기반 앱 라우팅
- 하단 탭 5개 구성: 탐색, 대여, 홈, 커뮤니티, 마이페이지
- 홈 화면 책장 UI
- 홈 책장에서 이동하는 책 상세·조건부 반납 기한·기록/AI 진입 UI
- Gemini Interactions API 기반 책별 AI 대화 화면
- 탐색 화면 책 카드 UI
- 커뮤니티 채팅방 목록 UI
- 장소별 대여 가능 도서를 넘겨보는 `빌릴래요` 둘러보기 캐러셀
- Firebase Google 로그인
- Google 학교 이메일 `.ac.kr` 클라이언트 제한
- 앱 전체 AuthProvider 연결
- 비로그인 사용자의 탭 화면 직접 접근 차단
- 마이페이지 로그아웃
- 목데이터 기반 화면 구성

## 앞으로 작업할 수 있는 항목

- Firestore 연동
- 목데이터를 실제 서버/Firebase 데이터로 교체
- 회원가입시 설정된 기본 정보 외의 추가정보 설정/프로필 화면
- 로그인 에러 메시지 세분화
- Firestore Security Rules 작성

## 주요 npm script

- `npm start`: Expo Go용 Metro 서버 실행
- `npm run start:dev-client`: Expo Dev Client용 Metro 서버 실행
- `npm run android`: Android 개발 빌드 생성 및 실행
- `npm run ios`: iOS 개발 빌드 생성 및 실행
- `npm run web`: Web 개발 서버 실행
- `npm run typecheck`: TypeScript 타입 검사
- `npm run lint`: Expo ESLint 검사
