# 서로서가

서로서가는 대학생이 책을 등록하고, 빌려주고, 빌리고, 독서 기록과 AI 대화를 남길 수 있는 Expo React Native 앱입니다.

현재 Android 테스트 기준은 **Expo Go가 아니라 EAS development build APK + Expo Dev Client Metro**입니다. Google Sign-In, OCR, native module 테스트는 Expo Go 기준으로 진행하지 않습니다.

## 1. 프로젝트 개요

### 핵심 기능

- Google 계정 기반 로그인 및 `.ac.kr` 이메일 제한
- 홈 화면의 `빌린 책`, `나의 책` 책장
- 나의 책 등록, 독서 기록 작성
- 책 표지 OCR 및 Google Books API 기반 자동 책 정보 입력
- 책 빌려주기, 책 빌리기, 대여 신청
- 대여 성사 후 채팅방과 약속 잡기
- 채팅 알림 수 관리
- Gemini 기반 책/매거진 AI 대화
- 마이페이지의 대여 내역, AI 대화 기록 조회

### 현재 실행 기준

- Android: EAS development build APK 설치 후 `npm run start:dev-client`
- iOS: 아직 실제 테스트 기준 문서화 미완료
- Expo Go: 현재 Google Sign-In/native OCR 기준으로 사용하지 않음

## 2. 기술 스택

- Expo SDK 54
- React Native 0.81
- Expo Router
- TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- `@react-native-google-signin/google-signin`
- `rn-mlkit-ocr`
- Google Books API
- Gemini API
- Kakao Place API

## 3. 실행 방법

### 3.1 최초 설치

```bash
npm install
```

### 3.2 Expo 로그인

```bash
npx.cmd eas-cli login
```

팀원은 새 Expo 계정을 만들지 말고, 승한님이 보내신 Expo 로그인용 아이디와 패스워드를 사용해야 합니다. 새 계정으로 로그인하면 이 프로젝트의 EAS project, managed keystore, build credentials에 접근할 수 없습니다.

### 3.3 Android Development APK 빌드

```bash
npx.cmd --yes eas-cli build --platform android --profile development
```

빌드가 끝나면 EAS 설치 링크가 출력됩니다. 해당 링크를 열어 Orbit 또는 QR 링크로 APK를 Android 기기에 설치합니다.

### 3.4 Metro 실행

```bash
npm run start:dev-client
```

폰에서는 Expo Go가 아니라 설치된 `seoroseoga` 앱을 열어야 합니다.

### 3.5 자주 쓰는 npm scripts

```bash
npm run start:dev-client
npm run typecheck
npm run lint
npm run android
npm run ios
npm run web
```

`npm start`는 Expo Go Metro 실행용입니다. 현재 Android Google Sign-In/OCR 테스트는 Expo Go 기준으로 하지 않습니다.

## 4. 빌드가 다시 필요한 경우

다음 항목이 바뀌면 새 Android development APK를 빌드해야 합니다.

- native dependency 추가/삭제
- Expo config plugin 추가/삭제
- `app.json`
- `eas.json`
- `google-services.json`
- Android package name
- app scheme
- Expo SDK 또는 native dependency 변경

JS/TS 화면 코드, Firestore repository, 문구, 정렬 로직만 바뀐 경우에는 보통 새 APK 빌드가 필요 없고 Metro 재시작만 하면 됩니다.

```bash
npm run start:dev-client
```

이번 작업 중 `rn-mlkit-ocr`, `expo-build-properties`, OCR config plugin 추가는 native 변경이므로 새 EAS development build가 필요합니다. 이후 AI 기록, 마크다운 렌더링, 정렬, 문구 수정 등은 Metro 재시작으로 반영됩니다.

## 5. 환경 변수와 외부 서비스

`.env` 또는 `.env.local`에는 키 값 자체를 문서에 적지 않고 변수명만 관리합니다.

### Firebase

- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

Firebase 초기화는 `lib/firebase.ts`에서 관리합니다. Auth, Firestore, Storage를 사용합니다.

### Google Sign-In

- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- Android package: `com.seoroseoga.app`
- `google-services.json`은 프로젝트 루트에 있어야 하며 `app.json`에서 참조합니다.
- EAS managed keystore의 SHA-1, SHA-256 fingerprint가 Firebase Android 앱에 등록되어 있어야 합니다.

### Google Books API

- `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY`
- 없으면 `EXPO_PUBLIC_FIREBASE_API_KEY`를 fallback으로 사용합니다.
- Google Cloud Console에서 해당 API key에 Books API 권한이 없으면 `GOOGLE_BOOKS_403`이 발생합니다.
- 짧은 시간에 너무 많은 후보를 검색하면 `GOOGLE_BOOKS_429`가 발생할 수 있어, OCR 후보 선택과 Books API 검색을 분리했습니다.

### Gemini API

- `EXPO_PUBLIC_GEMINI_API_KEY`
- `EXPO_PUBLIC_GEMINI_MODEL`

Gemini system instruction에는 현재 책/매거진 정보와 답변 스타일, 500자 이하 제한을 함께 전달합니다.

### Kakao Place API

- Kakao 장소 검색은 대여 위치 선택에 사용합니다.
- 환경 변수 이름은 구현 파일의 `kakaoPlaceRepository` 기준으로 확인합니다.

## 6. 주요 기능

### 6.1 Google 로그인

현재 로그인은 `@react-native-google-signin/google-signin` 기반 native Google Sign-In입니다.

```text
GoogleSignin.signIn()
-> idToken 획득
-> GoogleAuthProvider.credential(idToken)
-> signInWithCredential(auth, credential)
-> .ac.kr 이메일 검사
```

Expo Go/AuthSession redirect 방식은 더 이상 사용하지 않습니다. `seoroseoga://` 같은 custom scheme redirect는 Google Web OAuth에서 `400 invalid_request`로 거부되었고, Expo Go proxy 방식도 현재 테스트 기준에서 제외했습니다.

### 6.2 홈 화면과 책장

- 홈의 `빌린 책`은 실제 대여 성사/시작일 기준 최신순으로 정렬합니다.
- 홈의 `나의 책`은 책 등록일 `createdAt` 기준 최신순으로 정렬합니다.
- 홈 데이터는 30초 메모리 캐시를 사용합니다. 기존 데이터를 먼저 보여주고 백그라운드로 새로고침합니다.
- 하단 홈 탭을 누르면 nested 화면에 남지 않도록 `/(tabs)/home`으로 replace합니다.

### 6.3 책 등록 / OCR / Google Books 자동 입력

책 등록 화면은 두 흐름에서 사용됩니다.

- 홈 화면 `나의 책` 추가
- `빌려줄래요` 책 등록

현재 흐름:

1. 사용자가 사진을 선택합니다.
2. `rn-mlkit-ocr`로 한국어/라틴 OCR을 수행합니다.
3. OCR 결과에서 제목 후보를 추립니다.
4. 사용자가 OCR 후보를 누르면 제목 입력칸만 채워집니다.
5. 사용자가 `제목으로 정보 불러오기` 버튼을 누르면 Google Books API를 1회 호출합니다.
6. Google Books 후보 여러 개를 카드로 보여줍니다.
7. 사용자가 후보를 선택하면 책 정보 필드가 채워집니다.
8. 저장 시 Google Books 표지 또는 내 사진 중 저장할 표지를 선택합니다.

중요한 점:

- OCR 결과는 검색어 후보일 뿐이고, 자동으로 Google Books 요청을 보내지 않습니다.
- Google Books 표지 URL은 다른 사용자도 볼 수 있는 외부 URL입니다.
- 로컬 이미지 URI는 다른 사용자 기기에서 보이지 않으므로 공유 표지로 바로 저장하면 안 됩니다.
- 내 사진을 저장하려면 Firebase Storage에 바이너리 업로드 후 download URL을 Firestore에 저장해야 합니다.

### 6.4 빌려줄래요

- 책 정보와 선호 대여 위치를 입력합니다.
- 선호 대여 위치 UI는 출간일 아래에 있습니다.
- 등록 시 `books` 문서에 `isLendable: true`, `status: AVAILABLE`, `lendingPlace` 등을 저장합니다.
- `빌려준 책들` 탭에서 내가 빌려준 책 상태를 확인합니다.
- 대여 중인 책은 `{이름}님이 현재 빌렸어요!` 문구로 표시합니다.

### 6.5 빌릴래요

- `둘러보기`와 `내가 대여한 책들` 탭으로 구성합니다.
- 빌릴 수 있는 책은 `books.isLendable == true`와 `status == AVAILABLE` 기준으로 조회합니다.
- 같은 제목의 책을 소유자별로 묶어 최대 3명에게 대여 신청할 수 있습니다.
- 신청 후 `loanRequests`와 `chatRooms`가 transaction으로 생성됩니다.
- 대여한 책 상태 문구는 `빌렸어요!` 기준으로 정리했습니다.

### 6.6 채팅 / 약속 잡기 / 알림 수

- 대여 신청이 생성되면 신청 문서와 같은 ID로 채팅방을 생성합니다.
- 채팅방 메시지는 `chatRooms/{roomId}/messages` 하위 컬렉션에 저장합니다.
- 메시지 전송 시 상대방의 unread count를 올립니다.
- 사용자가 채팅방에 들어가면 해당 방의 내 unread count를 0으로 맞춥니다.
- 약속 잡기 메시지는 채팅 메시지 타입 중 `MEETING`으로 저장하고, 수락 시 대여 상태와 일정 정보를 갱신합니다.

### 6.7 독서 기록

- 독서 기록은 `records/{userId}_{bookId}`에 저장합니다.
- 책 메타데이터는 `books/{bookId}`, 개인별 독서 상태는 `records`에 저장합니다.
- 현재 `기록하기` 화면은 `/add-book?bookId=...`로 라우팅되어 책 메타데이터와 독서 기록을 함께 수정할 수 있는 구조입니다.
- 이 구조는 사용자가 책 제목/저자 같은 공용 메타데이터를 잘못 수정할 수 있어 개선 필요 항목으로 남겨둡니다.

### 6.8 서로 AI 대화

- 책 상세 또는 매거진 상세에서 AI 대화 화면으로 진입합니다.
- 책에서 시작하면 `bookId`, 매거진에서 시작하면 `magazineId`를 source id로 사용합니다.
- Gemini 요청의 `systemInstruction`에 현재 책/매거진 제목, 저자/편집부, 설명을 포함합니다.
- AI 답변은 `react-native-markdown-display`로 렌더링합니다.
- 답변에 남는 `**` 마커는 화면 표시 직전에 제거합니다.
- AI 답변은 500자 이하로 요청합니다.
- 대화 기록은 Firestore `aiConversations`와 하위 `messages`에 저장합니다.
- 마이페이지 `서로 AI 대화 기록`에서 기존 대화를 조회하고 이어서 질문할 수 있습니다.

### 6.9 마이페이지

- 개인정보 수정
- 로그아웃
- 회원 탈퇴
- 대여 내역
- 서로 AI 대화 기록

## 7. AI 활용 내역

### 7.1 Figma AI

- 초기 화면 구성과 디자인 방향을 잡는 데 활용했습니다.
- 모바일 화면 단위의 UI 배치, 카드/버튼/탭 구성, 시각적 스타일 실험에 사용했습니다.
- 이후 실제 구현에서는 Expo React Native 컴포넌트와 프로젝트의 기존 스타일 시스템에 맞게 재구성했습니다.

### 7.2 Codex

Codex는 구현 보조와 코드베이스 분석에 사용했습니다.

- 변경 파일을 분석해 새 EAS build가 필요한지, Metro 재시작만 필요한지 판단
- EAS managed keystore, Android package, Firebase SHA fingerprint, Google OAuth 구조 정리
- OCR 라이브러리 조사 및 `rn-mlkit-ocr` 전환
- Google Books API 호출 흐름 설계
- Firebase Storage와 로컬 URI 차이 분석
- 채팅 알림 수 로직 확인 및 수정
- 홈/대여/기록 목록 정렬 로직 확인 및 수정
- AI 대화 기록 Firestore 구조 설계 및 구현
- README 정리

### 7.3 Gemini API

- 앱 내부의 `서로 AI` 기능에 사용합니다.
- 사용자가 책 또는 매거진에 대해 질문하면, 현재 source 정보를 system instruction으로 전달하고 답변을 받아옵니다.
- 답변은 친근한 한국어, 불확실한 내용은 지어내지 않기, 500자 이하 규칙을 system instruction으로 제어합니다.

### 7.4 OCR / ML Kit

- 책 표지 사진에서 텍스트를 추출하기 위해 사용합니다.
- OCR 결과를 그대로 책 정보로 저장하지 않고, 제목 후보로만 사용합니다.
- 사용자가 후보를 선택하거나 직접 제목을 입력한 뒤 Google Books API로 검증된 책 후보를 가져옵니다.

### 7.5 Google Books API

- OCR 또는 직접 입력으로 확정한 제목을 기반으로 책 후보를 검색합니다.
- 사용자가 후보를 선택하면 제목, 저자, 출판사, 출간일, ISBN, 설명, 표지 URL을 자동 입력합니다.
- 표지 URL은 다른 사용자도 접근 가능한 URL이므로 공유 책 표지로 사용할 수 있습니다.

## 8. Firebase / Firestore 데이터 구조

### 8.1 `users/{uid}`

사용자 프로필 문서입니다.

주요 필드:

- `uid`
- `email`
- `displayName`
- `nickname`
- `photoURL`
- `createdAt`
- `updatedAt`

홈 화면의 닉네임, 마이페이지 프로필 표시, 채팅 상대방 표시 등에 사용합니다.

### 8.2 `books/{bookId}`

책 메타데이터와 대여 가능 상태를 저장합니다.

주요 필드:

- `bookId`
- `title`
- `author`
- `ownerId`
- `borrowerId`
- `publisher`
- `publishedDate`
- `totalPages`
- `isbn`
- `description`
- `coverUrl`
- `coverStoragePath`
- `isLendable`
- `status`
- `lendingPlace`
- `createdAt`
- `updatedAt`

`status` 값:

- `PRIVATE`
- `AVAILABLE`
- `RESERVED`
- `BORROWED`

`coverUrl`은 Google Books 외부 URL 또는 Firebase Storage download URL입니다. 로컬 파일 URI를 공유 표지로 저장하면 다른 사용자에게 보이지 않습니다.

### 8.3 `records/{userId}_{bookId}`

개인별 독서 기록입니다.

주요 필드:

- `recordId`
- `bookId`
- `userId`
- `status`: `READING | COMPLETED`
- `currentPage`
- `startedAt`
- `finishedAt`
- `rating`
- `oneLineReview`
- `createdAt`
- `updatedAt`

같은 책이라도 사용자별 기록이 달라야 하므로 `books`가 아니라 `records`에 저장합니다.

### 8.4 `loanRequests/{requestId}`

대여 신청 및 대여 상태 문서입니다.

주요 필드:

- `requestId`
- `bookId`
- `ownerId`
- `borrowerId`
- `status`
- `loanAt`
- `returnAt`
- `returnedAt`
- `chatRoomId`
- `createdAt`
- `updatedAt`

대여 신청, 약속 성사, 대여 중, 반납 완료 상태를 관리합니다.

### 8.5 `chatRooms/{chatRoomId}`

대여 신청과 연결된 1:1 채팅방입니다.

주요 필드:

- `roomId`
- `requestId`
- `bookId`
- `participantIds`
- `bookSnapshot`
- `lastMessage`
- `lastMessageAt`
- `unreadCountByUser`
- `status`
- `createdAt`
- `updatedAt`

알림 수는 `unreadCountByUser.{uid}` 형태로 사용자별 관리합니다.

### 8.6 `chatRooms/{chatRoomId}/messages/{messageId}`

채팅 메시지 하위 컬렉션입니다.

메시지 타입:

- `TEXT`
- `MEETING`
- `IMAGE`

주요 필드:

- `messageId`
- `senderId`
- `text`
- `type`
- `meeting`
- `image`
- `createdAt`

### 8.7 `aiConversations/{conversationId}`

서로 AI 대화방 문서입니다.

주요 필드:

- `conversationId`
- `userId`
- `sourceType`: `book | magazine`
- `sourceId`: `bookId` 또는 `magazineId`
- `sourceTitle`
- `sourceDescription`
- `lastMessage`
- `createdAt`
- `updatedAt`

마이페이지 AI 대화 기록 목록은 `userId` 기준으로 조회하고 앱에서 최신순 정렬합니다.

### 8.8 `aiConversations/{conversationId}/messages/{messageId}`

서로 AI 대화 메시지 하위 컬렉션입니다.

주요 필드:

- `messageId`
- `role`: `user | assistant`
- `text`
- `createdAt`

기존 대화에 다시 들어가면 이 메시지 목록을 불러와 같은 conversation에 이어서 저장합니다.

### 8.9 Firebase Storage

현재 사용하는 Storage 경로:

- `book-covers/{uid}/{fileName}`
- 채팅 이미지 저장 경로는 `chatRepository` / 이미지 업로드 구현 기준으로 확인

책 표지를 직접 업로드하는 경우 Storage download URL을 Firestore `books.coverUrl`에 저장합니다.

## 9. 중요한 설계 결정과 배운 점

### 9.1 Expo Go에서 dev-client로 전환한 이유

처음에는 Expo Go/AuthSession redirect 기반 Google 로그인을 검토했습니다. 하지만 현재 앱은 native Google Sign-In과 OCR native module을 사용하므로 Expo Go에서 실제 Android 앱과 동일하게 테스트하기 어렵습니다.

현재 기준:

- Google 로그인은 native Google Sign-In
- Android package는 `com.seoroseoga.app`
- 앱 서명은 EAS managed keystore
- Firebase Android 앱에는 EAS keystore SHA-1/SHA-256 fingerprint 등록
- 테스트는 EAS development build APK + dev-client Metro

### 9.2 Google OAuth와 Android 서명 구조

Google/Firebase는 Android 요청이 등록된 앱에서 온 요청인지 확인할 때 package name과 signing certificate fingerprint를 사용합니다.

정리:

- 앱 package: `com.seoroseoga.app`
- EAS managed keystore로 APK 서명
- Firebase Android 앱에 해당 keystore certificate의 SHA-1/SHA-256 등록
- `google-services.json`을 앱 루트에서 참조

이 구조 때문에 새 Expo 계정으로 EAS 로그인하거나 keystore를 새로 만들면 Google 로그인 검증이 깨질 수 있습니다.

### 9.3 로컬 이미지 URI와 Firebase Storage

폰에서 고른 사진의 `file://...` URI는 해당 기기 안에서만 유효합니다. Firestore에 로컬 URI 문자열만 저장하면 다른 사용자 기기에서는 이미지를 볼 수 없습니다.

따라서 공유되어야 하는 책 표지는 다음 중 하나여야 합니다.

- Google Books API에서 받은 외부 표지 URL
- Firebase Storage에 업로드한 뒤 받은 download URL

### 9.4 OCR 자동 입력 흐름

OCR 결과는 정확하지 않을 수 있으므로 곧바로 책 정보로 저장하지 않습니다.

현재 설계:

- OCR은 제목 후보만 생성
- 사용자가 후보를 선택하거나 직접 제목을 입력
- 사용자가 버튼을 눌렀을 때 Google Books API 검색
- Google Books 후보 중 사용자가 직접 선택
- 선택한 후보로 폼 자동 입력

이렇게 해야 OCR 오인식과 API 429 문제를 줄일 수 있습니다.

### 9.5 알림 수 로직

알림 수는 메시지 단위로 읽음 상태를 복잡하게 계산하지 않고, 방 단위 count로 관리합니다.

- 메시지 전송 시 상대방 unread count 증가
- 채팅방 입장 시 현재 사용자 unread count를 0으로 설정

단순하지만 현재 앱의 채팅 목록 뱃지 요구사항에는 충분합니다.

### 9.6 AI 대화 기록 설계

AI 대화는 책 또는 매거진에서 시작됩니다.

- 책: `bookId`가 stable source id
- 매거진: `magazineId`를 라우팅에 추가해 stable source id로 사용

대화방과 메시지를 분리했습니다.

```text
aiConversations/{conversationId}
aiConversations/{conversationId}/messages/{messageId}
```

이 구조는 마이페이지 목록 조회와 기존 대화 이어쓰기를 모두 지원합니다.

### 9.7 기록하기 화면의 남은 구조 문제

현재 책 상세의 `기록하기`는 `/add-book?bookId=...`로 이동합니다. 이 화면은 책 메타데이터와 개인 독서 기록을 함께 저장합니다.

문제:

- 사용자가 제목, 저자, 출판사 같은 책 메타데이터를 수정할 수 있음
- 개인 기록만 수정해야 하는 상황에서도 `books` 문서가 덮일 수 있음

개선 방향:

- 책 메타데이터 수정 화면과 개인 독서 기록 화면 분리
- 기록하기에서는 `records/{userId}_{bookId}`만 수정
- 책 메타데이터 수정은 별도 소유자 전용 편집 화면에서 처리

## 10. 작업 기록

### 2026-08-05

- 이메일/비밀번호 로그인 화면을 Google 로그인 버튼 기반 화면으로 교체했습니다.
- `AuthProvider`에 Google 로그인 함수를 추가했습니다.
- Google OAuth 결과로 받은 `id_token`을 Firebase credential로 변환해 Firebase Auth에 연결했습니다.
- `.ac.kr` 이메일이 아닌 Google 계정은 로그인 직후 로그아웃 처리하고 안내 메시지를 표시했습니다.
- Expo OAuth 흐름 검토를 위해 `expo-auth-session`, `expo-crypto`, `expo-web-browser`를 추가했습니다.

### 2026-08-11

- Google 로그인 테스트 기준을 Expo Go/AuthSession에서 EAS development build + native Google Sign-In으로 전환했습니다.
- EAS project owner, project id, Android package, managed keystore 구조를 정리했습니다.
- Firebase Android 앱 package name을 `com.seoroseoga.app`으로 맞추고 EAS keystore SHA-1/SHA-256 fingerprint를 등록했습니다.
- `google-services.json`을 프로젝트 루트에 두고 `app.json`에서 참조하도록 구성했습니다.
- `@react-native-google-signin/google-signin` 기반 로그인으로 전환했습니다.
- Expo Go/AuthSession redirect 방식과 `seoroseoga://` custom scheme redirect는 현재 Google 로그인 방식에서 제외했습니다.
- EAS `npm ci --include=dev` 단계에서 충돌을 유발하던 루트 직접 의존성 `@firebase/auth`를 제거했습니다.

### 2026-08-25

- 채팅방 입장 시 unread count를 0으로 맞추고, 메시지 전송 시 상대방 unread count를 증가시키는 알림 수 로직을 정리했습니다.
- 홈 화면 `빌린 책`, `나의 책` 정렬을 최신순 기준으로 정리하고 30초 메모리 캐시를 추가했습니다.
- `빌려줄래요`, `빌릴래요`, 마이페이지 대여 내역의 문구를 실제 상태에 맞게 수정했습니다.
- `rn-mlkit-ocr`와 Google Books API를 사용한 책 정보 자동 입력 흐름을 추가했습니다.
- Google Books API key 권한, 429/403 오류 원인, Firebase Storage 표지 업로드 흐름을 정리했습니다.
- 책 표지 저장 시 Google Books URL과 내 사진 중 선택할 수 있게 했습니다.
- AI 답변을 마크다운 렌더러로 표시하고, 답변 길이를 500자 이하로 요청했습니다.
- AI 대화 기록을 `aiConversations`와 하위 `messages`에 저장하고 마이페이지에서 조회할 수 있게 했습니다.
- Android에서 키보드가 입력칸을 가리는 화면에 `KeyboardAvoidingView` Android `height` 동작을 적용했습니다.

## 11. 남은 작업 / 주의사항

- Firestore Security Rules 정리
- Firebase Storage Rules 정리
- 기록하기 화면을 책 메타데이터 수정과 개인 독서 기록 수정으로 분리
- AI 대화 기록 삭제 기능
- 대여 신청 취소/거절/반납 완료 후 active lock/group 정리 확인
- README와 문서 인코딩 정리
- 실제 Android 기기 QA

