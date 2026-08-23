# 서로서가 프론트엔드 ↔ Firebase 백엔드 인계 문서

최종 갱신: 2026-08-23

이 문서는 프론트엔드 개발 과정에서 확인된 Firebase/Firestore 연동 계약과 백엔드 추가 작업을 기록합니다. 비밀키나 사용자 개인정보는 기록하지 않습니다.

## 연결 대상

- Firebase project ID: `seoroseoga`
- Firestore database: `(default)`
- Firestore location: `nam5`
- 클라이언트 설정: 루트 `.env`의 `EXPO_PUBLIC_FIREBASE_*`
- Firebase 앱/Auth/Firestore 초기화: `lib/firebase.ts`
- Firebase Storage 접근: `lib/firebase.ts`의 `storage`
- 데이터 접근 경계: `services/*Repository.ts`

2026-08-23 확인 당시 `users`, `books`, `records`, `loanRequests`, `chatRooms` 컬렉션의 문서 수는 모두 0개였습니다.

## 프론트엔드에서 사용하는 컬렉션

### `users/{uid}`

Google 로그인 상태가 복원되면 `.ac.kr` 사용자의 프로필을 `merge` 방식으로 동기화합니다.

필드: `uid`, `email`, `displayName`, `nickname`, `photoURL`, `createdAt`, `updatedAt`

홈 화면의 `{닉네임}님의 서재`는 `nickname`을 우선 사용하고, 기존 사용자에 `nickname`이 없으면 `displayName`으로 fallback합니다. 신규 사용자 문서는 최초 동기화 시 Google `displayName`을 기본 `nickname`으로 저장합니다.

마이페이지 개인정보 수정은 이메일을 읽기 전용으로 표시하고 `nickname`만 `users/{uid}`에 merge 저장합니다. 현재 인증 방식은 Google Sign-In이므로 앱은 비밀번호를 보유하거나 변경하지 않습니다.

### `books/{bookId}`

홈, 탐색, 대여 가능 목록과 책 상세에서 사용합니다. 프론트 repository는 책 생성/수정/삭제 API도 제공합니다.

필수 필드: `bookId`, `title`, `author`, `ownerId`, `borrowerId`, `isLendable`, `status`, `createdAt`, `updatedAt`

`status`: `PRIVATE | AVAILABLE | RESERVED | BORROWED`

- `RESERVED`: 대여 약속은 수락됐지만 실제 책 전달 확인 전인 상태
- `BORROWED`: 실제 책 전달까지 확인된 대여 중 상태

`/rental/lend`의 빌려주기 등록은 다음 값으로 `books` 문서를 생성합니다.

- `ownerId`: 현재 Firebase Auth UID
- `isLendable: true`, `status: AVAILABLE`, `borrowerId: null`
- `lendingPlace.placeId: pnu-jangjeon`
- `lendingPlace.name: 부산대학교 장전캠퍼스`
- `title`, `author`, `publisher`, `publishedDate`

대여 목록은 목데이터 없이 `books.ownerId == uid` 및 `loanRequests.ownerId == uid`를 조합해 표시합니다. 등록 직후는 `대여 가능`, `REQUESTED`가 있으면 `요청 대기`, 책이 `BORROWED`이거나 신청이 `ACCEPTED/BORROWED`면 `대여 중`으로 표시합니다.

`빌릴래요` 둘러보기는 `books.isLendable == true`를 조회하고 `status == AVAILABLE`인 문서를 모든 사용자에게 표시합니다. 등록자 본인 화면에도 확인용으로 노출하되 대여 신청 버튼은 비활성화하며, repository transaction에서도 자기 책 신청을 거부합니다. 화면에 다시 진입할 때마다 Firestore를 재조회합니다.

나의 책 직접 추가 화면에서 다음 필드를 추가로 저장합니다.

- `publisher`: 출판사
- `publishedDate`: Firestore Timestamp로 저장하는 출간일

2026-08-23부터 Storage가 활성화되기 전에도 나의 책을 사용할 수 있도록, 앱의 `bookCreationService`가 책 메타데이터를 `bookRepository`를 통해 Firestore에 직접 생성합니다. 표지 없이 생성된 문서는 기존 기본 표지 UI로 표시됩니다. 기기 로컬 이미지 URI는 다른 기기에서 접근할 수 없으므로 Firestore에 저장하지 않습니다.

Storage 활성화 후 표지 업로드를 다시 연결하면 다음 필드를 추가로 저장합니다.

- `coverUrl`: Firebase Storage download URL
- `coverStoragePath`: 표지 수정/삭제 시 사용할 Storage 객체 경로

### Firebase Storage `book-covers`

Storage 활성화 후 표지 이미지는 `book-covers/{uid}/{fileName}`에 저장합니다. 현재 화면은 네이티브 ImagePicker를 호출하지 않으며 책 등록 자체는 Storage에 의존하지 않습니다. 기존 development APK에 `ExponentImagePicker`가 포함되지 않은 상태에서도 화면 진입과 Firestore 등록이 동작하도록 표지 선택은 준비 중 안내만 표시합니다.

### `loanRequests/{requestId}` 및 `chatRooms/{requestId}`

대여 신청 시 신청 문서와 동일 ID의 채팅방을 transaction으로 만듭니다. 현재 프론트는 신청 생성까지만 수행하며, 수락/거절/반납 상태 변경은 백엔드 작업으로 남깁니다.

마이페이지 대여 내역은 `loanRequests.borrowerId == uid`와 `loanRequests.ownerId == uid`를 각각 조회하고 `status`가 `RETURNED | COMPLETED`인 실제 문서만 표시합니다. 책과 상대 사용자 정보는 `books`, `users`에서 조합하며 책 문서가 없으면 `chatRooms.bookSnapshot`을 fallback으로 사용합니다. 목데이터는 사용하지 않습니다.

### `chatRooms/{chatRoomId}/messages/{messageId}`

메시지 작성과 상위 채팅방의 `lastMessage*` 갱신을 하나의 Firestore transaction으로 수행합니다.

- `TEXT`: `senderId`, `text`, `createdAt`
- `MEETING`: `senderId`, `text: 약속을 만들었어요`, `createdAt`, `meeting`
- `meeting.loanAt`, `meeting.returnAt`: Firestore Timestamp
- `meeting.loanPlace`, `meeting.returnPlace`: `{ name, address, latitude?, longitude? }`
- `meeting.status`: `PROPOSED | ACCEPTED`

약속 상대방이 `약속 보기 → 약속 수락`을 누르면 클라이언트 transaction이 다음 문서를 함께 갱신합니다.

- 메시지: `meeting.status = ACCEPTED`, `acceptedBy`, `acceptedAt`
- `loanRequests`: `status = SCHEDULED`, `meetingMessageId`, `loanAt`, `dueAt`, `lendingPlace`, `returnPlace`
- `books`: `status = RESERVED`, `borrowerId`, `reservedRequestId`, `loanAt`, `dueAt`
- `chatRooms`: `status = SCHEDULED`, `lastMessage = 대여 약속이 성사됐어요`

`books.borrowerId`가 설정되므로 수락 직후 대여자는 홈의 빌린 책에서 실제 문서를 조회할 수 있습니다. `RESERVED` 상태에서는 `N일 후 대여 예정`, 당일은 `오늘 대여 예정`, 약속일이 지난 뒤 실제 전달 확인 전에는 `대여 확인 대기`로 표시합니다. 실제 전달 확인 및 `BORROWED` 전이는 다음 단계입니다.

채팅방 화면은 메시지 subcollection을 `createdAt ASC`로 실시간 구독합니다. 약속 작성 시 메시지 생성과 `chatRooms.lastMessage*` 갱신을 단일 transaction으로 수행합니다. 약속 수락·거절·수정과 대여 상태 변경은 다음 단계입니다.

장소 선택은 `EXPO_PUBLIC_KAKAO_REST_API_KEY`가 있으면 카카오 로컬 REST API의 키워드 검색 결과를 사용합니다. 키가 없을 때도 실제 `loanRequests.lendingPlace`에 저장된 대여 장소는 선택할 수 있으며, 카카오맵 웹 링크로 위치를 확인할 수 있습니다.

## 백엔드 개발자가 추가하거나 확정해야 할 사항

### P0 — Firebase Storage 최초 활성화

2026-08-23 `firebase deploy --only storage` 확인 시 프로젝트에 Firebase Storage가 아직 설정되지 않아 배포가 거부됐습니다.

1. Firebase Console → Storage → `Get Started`에서 기본 버킷 생성
2. 루트의 `storage.rules`를 `firebase deploy --only storage`로 배포
3. 인증된 사용자가 자신의 `book-covers/{uid}`에만 10MB 미만 이미지를 쓰거나 삭제할 수 있는지 확인

`storage.rules`는 위 권한, MIME type `image/*`, 10MB 제한으로 작성해 두었습니다.

### P0 — Firestore Security Rules

현재 Firebase Console에서 내려받은 규칙은 `allow read, write: if true`입니다. 운영/공동 테스트 데이터를 넣기 전에 반드시 교체해야 합니다.

- 모든 접근은 `request.auth != null` 필수
- `request.auth.token.email`이 `.ac.kr`로 끝나는지 검증
- `users/{uid}`는 본인 문서만 생성/수정
- `books` 생성 시 `ownerId == request.auth.uid`; 수정/삭제는 소유자만 허용
- `borrowerId`, `status` 변경은 일반 클라이언트에서 금지하고 신뢰 가능한 백엔드만 허용
- `loanRequests` 생성 시 `borrowerId == request.auth.uid`, 자기 책 신청 금지
- `chatRooms`와 `messages`는 `participantIds`에 포함된 사용자만 읽기/쓰기
- 메시지의 `senderId == request.auth.uid`

### P0 — 대여 상태 전이용 Callable Cloud Function

현재 프론트의 대여 신청 transaction은 UX 연결용입니다. 중복 신청 방지와 경쟁 상태를 완전히 해결하려면 다음 Callable Function이 필요합니다.

- `createLoanRequest(bookId)`
- `acceptLoanRequest(requestId, dueAt)`
- `rejectLoanRequest(requestId)`
- `cancelLoanRequest(requestId)`
- `completeReturn(requestId)`
- `acceptMeetingProposal(roomId, messageId)`
- `confirmLoanHandover(requestId)`

기존 `acceptLoanRequest`는 약속 없이 즉시 `BORROWED`로 전이하지 않도록 역할을 재정의하거나 제거해야 합니다. 대여 확정은 약속 수락과 실제 전달 확인의 두 단계로 분리합니다.

현재 프론트 transaction의 `acceptMeetingProposal`은 `REQUESTED/AVAILABLE`을 검증한 뒤 `SCHEDULED/RESERVED`로 예약합니다. 운영용 Function에서는 동일 책의 나머지 `REQUESTED` 신청도 함께 거절해야 합니다. `confirmLoanHandover`가 실제 전달을 양측 또는 소유자 확인 후 `loanRequests.status = BORROWED`, `books.status = BORROWED`로 전이해야 합니다.

### P0 — 회원 탈퇴 Callable Function

클라이언트에서 Firebase Auth 사용자만 삭제하면 `users`, 책, 대여, 채팅 데이터가 고아 데이터로 남고 최근 로그인 재인증도 필요합니다. 현재 회원 탈퇴 화면은 확인 UI까지만 제공하며 실제 삭제는 다음 Callable Function 연결 후 활성화합니다.

- `deleteMyAccount()`
- 활성 `REQUESTED | SCHEDULED | BORROWED` 대여가 있으면 탈퇴 거부
- 사용자 소유 책, 신청, 채팅/메시지에 대한 보존·익명화 정책 적용
- Firestore 정리와 Firebase Auth 삭제를 신뢰 가능한 서버에서 수행
- 감사 로그에는 최소 정보와 처리 결과만 보존

### P1 — 복합 인덱스

`docs/DB_scheme.md` 기준:

- `books`: `isLendable ASC`, `status ASC`
- `books`: `ownerId ASC`, `status ASC`
- `loanRequests`: `ownerId ASC`, `status ASC`, `updatedAt DESC`
- `loanRequests`: `borrowerId ASC`, `status ASC`, `updatedAt DESC`
- `chatRooms`: `participantIds ARRAY_CONTAINS`, `lastMessageAt DESC`

현재 프론트 쿼리는 인덱스가 비어 있어도 동작하도록 단일 조건 조회 후 클라이언트 정렬/필터링을 사용합니다. 데이터 규모가 커지면 위 인덱스를 배포하고 서버 쿼리 조건을 강화해야 합니다.

### P1 — 스키마 계약 확정

- 대여 장소 식별자 이름을 `lendingPlace.placeId`로 통일
- 채팅방 상태는 `loanRequests.status`를 원본으로 사용할지 `chatRooms.status`를 복제할지 결정
- 홈의 빌린 책 반납일은 `loanRequests.dueAt`과 `books`를 조인해야 하므로 조회 API 또는 denormalized 필드 결정
- 사용자별 안 읽은 수를 `unreadCountByUser.{uid}`로 관리할지 Cloud Function 집계를 사용할지 결정
- 중복 활성 신청(`REQUESTED`, `ACCEPTED`) 방지 방식 결정
- 완료 대여 내역 보존을 위해 `loanRequests.bookSnapshot`과 양측 사용자 표시명 snapshot을 반납 완료 시 저장할지 결정

### P1 — Gemini 독서 챗봇 서버 프록시

현재 프론트는 개발 테스트를 위해 `EXPO_PUBLIC_GEMINI_API_KEY`로 Gemini `generateContent` API를 직접 호출합니다. `EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 운영 배포 전에 비밀키를 Firebase Functions/Secret Manager로 이관해야 합니다.

- Callable Function 예시: `askBookAssistant(bookContext, message, history)`
- 호출자 인증, 사용자별 rate limit, 입력 길이 제한 필수
- Gemini API 키는 Firebase Secret Manager에만 저장하고 클라이언트에 반환하지 않음
- 응답: `{ text: string }`; 실패 코드는 `unauthenticated`, `resource-exhausted`, `invalid-argument`, `internal` 등으로 구분

### P1 — Kakao 장소 검색 서버 프록시

현재 개발 환경은 `EXPO_PUBLIC_KAKAO_REST_API_KEY`로 카카오 로컬 키워드 검색 API를 직접 호출합니다. `EXPO_PUBLIC_*` 값은 앱 번들에 포함되므로 운영 배포 전 Firebase Callable Function 또는 HTTPS Function으로 이관해야 합니다.

- 입력: `{ keyword: string }`
- 서버에서 Kakao `Authorization: KakaoAK ...` 헤더 설정
- 인증 사용자만 호출, 검색어 길이 제한 및 사용자별 rate limit 적용
- 응답 필드는 `name`, `address`, `latitude`, `longitude`로 제한
- 실제 REST API 키는 Firebase Secret Manager에 저장

## 프론트 구현 위치

- `lib/firebase.ts`: `firebaseApp`, `auth`, `db`
- `services/bookRepository.ts`: 책 조회 및 CRUD
- `services/rentalRepository.ts`: 대여 가능 책 조회 및 대여 신청
- `services/chatRepository.ts`: 채팅방 실시간 구독 및 메시지 쓰기
- `services/kakaoPlaceRepository.ts`: 카카오 로컬 REST API 장소 검색
- `hooks/useChatThread.ts`: 개별 채팅방 정보 및 메시지 실시간 구독
- `components/MeetingComposerModal.tsx`: 대여·반납 일시와 장소를 고르는 약속 작성 화면
- `services/userRepository.ts`: 인증 사용자 프로필 동기화
- `services/rentalHistoryRepository.ts`: 완료된 실제 대여 내역 조회와 책·사용자 조합
- `hooks/useRentalHistory.ts`: 대여 내역 화면 포커스 기반 재조회
- `services/firestoreMappers.ts`: Firestore 문서를 화면 모델로 변환
- `services/bookCoverRepository.ts`: Firebase Storage 표지 업로드/삭제
- `services/bookCreationService.ts`: Storage와 독립적으로 `books` 문서를 생성하는 나의 책 등록 서비스

새 화면에서 Firestore를 사용할 때 컴포넌트에서 `firebase/firestore`를 직접 호출하지 말고 repository에 메서드를 추가합니다. 백엔드 변경이나 새 필드·인덱스·Function이 필요하면 이 문서에 우선순위, 입력, 출력, 권한 조건을 함께 기록합니다.
