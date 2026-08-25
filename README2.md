# 서로서가 프론트엔드 ↔ Firebase 백엔드 인계 문서

최종 갱신: 2026-08-24

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
- `lendingPlace.placeId`: 카카오 장소 ID. 기존 기본값은 `pnu-jangjeon`
- `lendingPlace.name`, `lendingPlace.address`: 카카오 장소 검색 결과
- `lendingPlace.latitude`, `lendingPlace.longitude`: 카카오가 반환한 WGS84 좌표
- `title`, `author`, `publisher`, `publishedDate`

대여 목록은 목데이터 없이 `books.ownerId == uid` 및 `loanRequests.ownerId == uid`를 조합해 표시합니다. 등록 직후는 `대여 가능`, `REQUESTED`가 있으면 `요청 대기`, 책이 `BORROWED`이거나 신청이 `ACCEPTED/BORROWED`면 `대여 중`으로 표시합니다.

`빌릴래요` 둘러보기는 `books.isLendable == true`를 조회하고 캐러셀에는 `status == AVAILABLE`인 실제 문서만 표시합니다. 검색은 책 제목을 기준으로 클라이언트 필터링하며, `전체`에서는 `AVAILABLE | RESERVED | BORROWED`, `대여 가능`에서는 `AVAILABLE`만 표시합니다. 등록자 본인 화면에도 확인용으로 노출하되 대여 신청 버튼은 비활성화하며, repository transaction에서도 자기 책 신청을 거부합니다. 화면에 다시 진입할 때마다 Firestore를 재조회합니다.

`빌릴래요 > 대여 목록`은 목데이터 없이 `loanRequests.borrowerId == uid`를 조회합니다. `SCHEDULED`는 대여 예정일, `BORROWED`는 `대여중 · 반납 D-N`, `RETURNED | COMPLETED`는 `반납 완료 · YYYY.MM.DD 반납`으로 표시하고 `loanAt` 기준 날짜별로 묶습니다. 책과 대여자 정보는 `books`, `users`를 조합하며, 삭제된 책은 `chatRooms.bookSnapshot`을 fallback으로 사용합니다.

검색 결과의 대여 가능한 책을 선택하면 정규화한 동일 제목의 `AVAILABLE` 문서를 소유자별로 하나씩 묶어 대여 가능 사용자 목록을 만듭니다. 사용자는 최대 3명을 선택할 수 있고, `createLoanRequests(bookIds, borrowerId)`가 선택된 모든 책과 중복 잠금 문서를 하나의 Firestore transaction에서 검증한 후 요청별 `loanRequests`와 `chatRooms`를 각각 생성합니다. 따라서 3명을 선택하면 독립된 신청 3건과 1:1 채팅방 3개가 만들어집니다.

활성 요청 제한용 문서:

- `activeLoanRequestLocks/{borrowerId}_{bookId}`: 같은 사용자가 같은 실물 책에 중복 신청하는 것을 방지
- `activeLoanRequestGroups/{borrowerId}_{normalizedTitleHash}`: 같은 제목에 대한 `activeBookIds`, `activeRequestIds`를 관리하여 여러 번 나누어 호출해도 활성 요청이 3건을 넘지 않도록 방지

신청이 `REJECTED | CANCELLED | RETURNED | COMPLETED`로 끝나면 신뢰 가능한 백엔드가 해당 lock을 비활성화하고 group 배열에서 요청/책 ID를 제거해야 합니다. 한 요청이 수락되면 같은 그룹의 나머지 `REQUESTED` 요청을 거절하고 잠금도 함께 해제해야 합니다.

나의 책 직접 추가 화면에서 다음 필드를 추가로 저장합니다.

- `publisher`: 출판사
- `publishedDate`: Firestore Timestamp로 저장하는 출간일
- `totalPages`: 책 자체의 총 페이지 수인 양의 정수

책 상세의 `기록하기` 또는 `기록보기`는 같은 책 추가/기록 폼을 `bookId`와 함께 엽니다. 소유한 책은 책 메타데이터를 `books/{bookId}`, 개인 독서 상태를 `records/{userId}_{bookId}`에 갱신합니다. 빌린 책은 원 소유자의 `books` 문서를 수정하지 않고 현재 대여자의 `records/{userId}_{bookId}`만 저장합니다. 홈의 빌린 책과 `빌린 책 > 전체보기` 모두 책 상세로 이동하므로 동일한 기록 화면을 사용합니다. `AI와 대화하기`는 기존 Gemini 책 챗봇에 해당 `bookId`를 전달합니다.

2026-08-23부터 Storage가 활성화되기 전에도 나의 책을 사용할 수 있도록, 앱의 `bookCreationService`가 책 메타데이터를 `bookRepository`를 통해 Firestore에 직접 생성합니다. 표지 없이 생성된 문서는 기존 기본 표지 UI로 표시됩니다. 기기 로컬 이미지 URI는 다른 기기에서 접근할 수 없으므로 Firestore에 저장하지 않습니다.

Storage 활성화 후 표지 업로드를 다시 연결하면 다음 필드를 추가로 저장합니다.

- `coverUrl`: Firebase Storage download URL
- `coverStoragePath`: 표지 수정/삭제 시 사용할 Storage 객체 경로

### Firebase Storage `book-covers`

Storage 활성화 후 표지 이미지는 `book-covers/{uid}/{fileName}`에 저장합니다. 현재 화면은 네이티브 ImagePicker를 호출하지 않으며 책 등록 자체는 Storage에 의존하지 않습니다. 기존 development APK에 `ExponentImagePicker`가 포함되지 않은 상태에서도 화면 진입과 Firestore 등록이 동작하도록 표지 선택은 준비 중 안내만 표시합니다.

### `records/{userId}_{bookId}`

독서 상태와 진행률은 같은 책을 소유자와 대여자가 각각 기록할 수 있도록 `books`가 아닌 사용자별 `records` 문서에 저장합니다. 사용자와 책 조합당 문서 하나를 사용하여 저장 시 같은 문서를 갱신합니다.

- `recordId`, `bookId`, `userId`
- `status`: `READING | COMPLETED`
- `currentPage`: 읽는 중인 마지막 페이지. `0 <= currentPage <= books.totalPages`
- `totalPages`: 개인 기록에서 사용하는 총 페이지 수. 빌린 책의 메타데이터에 총 페이지 수가 없을 때도 진행률을 계산할 수 있도록 기록 문서에 함께 저장
- `startedAt`: Firestore Timestamp로 저장하는 독서 시작일
- `finishedAt`: 완독일 때만 사용하는 Firestore Timestamp
- `rating`: 완독일 때 사용하는 `1..5` 정수
- `oneLineReview`: 독서 상태와 관계없이 저장 가능한 최대 500자의 독서 기록. 기존 필드명 호환을 위해 Firestore 키는 유지
- `createdAt`, `updatedAt`

`COMPLETED`로 저장할 때 프론트는 `currentPage = totalPages`로 맞춥니다. 다시 `READING`으로 변경하면 `finishedAt`, `rating`은 초기화하지만 독서 기록은 유지합니다. 기록 문서가 없는 기존 책은 화면에서 `READING`, 진행률 0%로 호환 처리합니다. 책 상세 진행률은 `round(records.currentPage / (records.totalPages ?? books.totalPages) * 100)`으로 계산하고 0~100 범위로 제한합니다.

홈의 `나의 책 > 전체보기`는 `books.ownerId == uid`와 `records.userId == uid`를 조합해 나의 기록을 구성합니다. `records.startedAt` 기준 월별로 묶고, 기록이 없는 기존 책은 `books.createdAt`을 기준으로 표시합니다. 읽는 중 진행률은 `round(records.currentPage / books.totalPages * 100)`으로 계산하고 완독은 `records.status == COMPLETED`를 사용합니다. 목데이터는 사용하지 않습니다.

홈의 `빌린 책 > 전체보기`는 `loanRequests.borrowerId == uid` 중 `SCHEDULED | ACCEPTED | BORROWED`인 활성 대여를 `loanAt` 기준 월별 책장으로 표시합니다. 약속 수락 후 시작 시각 전인 `SCHEDULED`는 `대여 예정`, 시작 시각이 지난 `BORROWED`는 `대여중 · 반납 D-N`으로 표시합니다. 책을 누르면 해당 요청의 `chatRoomId`로 이동해 기존 대여 목록과 동일한 채팅 및 약속 정보를 확인합니다. 반납 완료 내역은 홈 책장에서 제외하고 `빌릴래요 > 대여 목록` 및 마이페이지 `대여 내역`에서 조회합니다.

Security Rules에서는 `records.userId == request.auth.uid`인 문서만 생성·조회·수정하도록 제한해야 하며, `bookId`가 실제 `books` 문서를 가리키는지 검증해야 합니다.

### `loanRequests/{requestId}` 및 `chatRooms/{requestId}`

대여 신청 시 신청 문서와 동일 ID의 채팅방을 transaction으로 만들고, 약속 수락 및 시작일 도래에 따른 상태 전이도 연관 문서를 함께 갱신하는 transaction으로 처리합니다. 거절·취소·반납 완료는 운영용 백엔드 작업으로 남깁니다.

마이페이지 대여 내역은 `빌려준 책 / 빌린 책` 상단 옵션으로 역할을 전환합니다. `loanRequests.ownerId == uid`는 빌려준 책, `loanRequests.borrowerId == uid`는 빌린 책으로 분리하고 `status`가 `SCHEDULED | BORROWED | RETURNED | COMPLETED`인 실제 문서를 표시합니다. `SCHEDULED`는 `loanAt` 기준 `대여 예정`, `BORROWED`는 `대여중 · 반납 D-N`, 완료 상태는 `returnedAt` 기준 `반납 완료`로 정렬하며 항목을 누르면 해당 채팅방으로 이동합니다. 책과 상대 사용자 정보는 `books`, `users`에서 조합하며 책 문서가 없으면 `chatRooms.bookSnapshot`을 fallback으로 사용합니다. 목데이터는 사용하지 않습니다.

### `chatRooms/{chatRoomId}/messages/{messageId}`

메시지 작성과 상위 채팅방의 `lastMessage*` 갱신을 하나의 Firestore transaction으로 수행합니다.

- `TEXT`: `senderId`, `text`, `createdAt`
- `MEETING`: `senderId`, `text: 대여 약속을 신청했어요`, `createdAt`, `meeting`
- `IMAGE`: `senderId`, `text: 사진을 보냈어요`, `createdAt`, `image`
- `image`: `downloadUrl`, `storagePath`, `mimeType`, `width?`, `height?`, `byteSize?`
- `meeting.loanAt`, `meeting.returnAt`: Firestore Timestamp
- `meeting.loanPlace`, `meeting.returnPlace`: `{ name, address, latitude?, longitude? }`
- `meeting.status`: `PROPOSED | ACCEPTED`

약속 상대방이 `약속 보기 → 약속 수락`을 누르면 클라이언트 transaction이 다음 문서를 함께 갱신합니다.

- 메시지: `meeting.status = ACCEPTED`, `acceptedBy`, `acceptedAt`
- `loanRequests`: `status = SCHEDULED`, `meetingMessageId`, `loanAt`, `dueAt`, `lendingPlace`, `returnPlace`
- `books`: `status = RESERVED`, `borrowerId`, `reservedRequestId`, `loanAt`, `dueAt`
- `chatRooms`: `status = SCHEDULED`, `lastMessage = 대여 약속이 성사됐어요`
- `chatRooms/{roomId}/messages/{meetingMessageId}_accepted`: `type = MEETING_ACCEPTED`, `text = 약속이 수락됐습니다.`, 수락된 `loanAt`, `returnAt`, `loanPlace`, `returnPlace` snapshot

`books.borrowerId`가 설정되므로 수락 직후 대여자는 홈의 빌린 책에서 실제 문서를 조회할 수 있습니다. 시작 시각 전에는 `대여 예정`으로 표시하고, 시작 시각이 지나면 관련 화면 진입 시 `loanRequests`, `books`, `chatRooms`를 한 transaction에서 `BORROWED`로 동기화합니다. 대여 중 화면은 약속의 `dueAt`을 기준으로 `반납 D-N`, 당일 `반납 D-Day`, 기한 경과 시 `반납 D+N`을 표시합니다.

현재 전환은 로그인한 사용자가 홈, 빌릴래요/빌려줄래요 목록, 마이페이지 대여 내역 또는 채팅방에 진입할 때 실행되는 클라이언트 보정 로직입니다. 앱이 닫힌 상태에서도 약속 시각에 정확히 전환되어야 하는 운영 환경에서는 아래의 예약 Cloud Function을 함께 배포해야 합니다.

약속 수락 transaction은 원본 약속 메시지 ID에 `_accepted`를 붙인 고정 문서 ID로 수락 안내 메시지를 함께 생성합니다. transaction 재시도나 중복 수락에도 같은 문서만 갱신되므로 채팅방에는 한 번만 표시되며, 양쪽 사용자가 대여·반납 날짜와 장소를 동일한 snapshot으로 확인합니다.

채팅방 화면은 메시지 subcollection을 `createdAt ASC`로 실시간 구독합니다. 약속 작성 시 메시지 생성과 `chatRooms.lastMessage*` 갱신을 단일 transaction으로 수행합니다. 약속 거절·수정과 반납 완료 처리는 다음 단계입니다.

채팅 사진은 `expo-image-picker`로 사진첩 또는 시스템 카메라에서 한 장을 선택한 뒤 `chat-media/{roomId}/{senderUid}/{fileName}`에 업로드합니다. 업로드 완료 후에만 `IMAGE` 메시지와 `chatRooms.lastMessage*`를 transaction으로 저장합니다. 메시지 transaction이 참가자·차단 검증 등으로 실패하면 이미 업로드한 Storage 객체를 즉시 삭제합니다. 이미지 크기는 10MB 미만, MIME type은 `image/*`만 허용합니다.

### 채팅방 사용자 설정, 차단 및 신고

채팅방 우측 상단 메뉴의 사용자별 상태는 상대방의 채팅 기록을 삭제하지 않도록 다음 문서로 분리합니다.

- `chatRooms/{chatRoomId}/memberSettings/{uid}`
  - `userId`, `active`, `notificationsMuted`, `leftAt?`, `blockedUserId?`, `blockedAt?`, `createdAt?`, `updatedAt`
  - 나가기는 `active = false`로 저장하며 해당 사용자 목록에서만 방을 숨깁니다.
  - 알림 해제는 `notificationsMuted = true`로 저장하며 상대방 설정에는 영향을 주지 않습니다.
- `users/{blockerUid}/blockedUsers/{blockedUid}`
  - `blockerId`, `blockedUserId`, `sourceRoomId`, `createdAt`, `updatedAt`
  - 차단은 특정 방이 아니라 사용자 관계 전체에 적용합니다. 메시지·약속 작성 transaction은 양방향 차단 문서를 확인하고 차단 관계가 있으면 쓰기를 거부합니다.
- `chatReports/{reportId}`
  - `reportId`, `roomId`, `requestId`, `bookId`, `reporterId`, `reportedUserId`, `reason`, `status = PENDING`, `createdAt`, `updatedAt`
  - `reason`: `ABUSE | FRAUD | SPAM | OTHER`
  - 신고는 채팅 삭제나 자동 차단을 수행하지 않고 운영 검토 대상으로 누적합니다.

신규 대여 신청으로 채팅방을 만들 때 양측 `memberSettings`도 함께 생성합니다. 기존 채팅방은 설정 문서가 없으면 `active = true`, `notificationsMuted = false`로 호환 처리합니다. 설정 변경 시 상위 채팅방의 `memberSettingsUpdatedAt`도 갱신하여 이미 열려 있는 채팅 목록 구독이 즉시 다시 필터링되도록 합니다.

장소 선택은 `EXPO_PUBLIC_KAKAO_REST_API_KEY`로 카카오 로컬 REST API의 키워드 검색 결과를 사용합니다. 약속 잡기의 대여·반납 장소와 `빌려줄래요`의 책 대여 장소가 같은 선택 컴포넌트를 사용하며, 검색 결과의 좌표로 카카오 정적 지도 API 이미지를 표시합니다. 카카오가 제공한 `place_url` 또는 검색 링크로 외부 카카오맵도 열 수 있습니다. 선택 결과는 Firestore의 `lendingPlace`, `meeting.loanPlace`, `meeting.returnPlace`에 저장합니다.

## 백엔드 개발자가 추가하거나 확정해야 할 사항

### P0 — Firebase Storage 최초 활성화

2026-08-24 Firebase Storage REST 엔드포인트 확인 결과 설정된 기본 버킷이 여전히 404를 반환하여 최초 활성화가 되지 않은 상태입니다. 이 상태에서는 책 표지와 채팅 사진 업로드가 모두 실패합니다.

1. Firebase Console → Storage → `Get Started`에서 기본 버킷 생성
2. 루트의 `storage.rules`를 `firebase deploy --only storage`로 배포
3. 인증된 사용자가 자신의 `book-covers/{uid}`에만 10MB 미만 이미지를 쓰거나 삭제할 수 있는지 확인
4. `chat-media/{roomId}/{uid}`는 해당 채팅 참가자만 읽고 업로더 본인만 10MB 미만 이미지를 생성·삭제할 수 있는지 확인

`storage.rules`는 위 권한, MIME type `image/*`, 10MB 제한으로 작성해 두었습니다. 채팅 참가자 판정에는 Storage Rules의 `firestore.get()`을 사용하므로 최초 배포 시 Firebase가 요청하는 Firestore 연동 IAM 권한도 승인해야 합니다.

현재 IMAGE 메시지는 React Native `<Image>` 표시를 위해 Firebase download token URL을 저장합니다. 운영에서 비공개 채팅 이미지 접근을 더 엄격하게 통제하려면 장기 download token을 저장하지 말고, 인증·참가자 검증을 수행하는 Function에서 단기 signed URL을 발급하는 방식으로 교체해야 합니다.

### P0 — Firestore Security Rules

현재 Firebase Console에서 내려받은 규칙은 `allow read, write: if true`입니다. 운영/공동 테스트 데이터를 넣기 전에 반드시 교체해야 합니다.

- 모든 접근은 `request.auth != null` 필수
- `request.auth.token.email`이 `.ac.kr`로 끝나는지 검증
- `users/{uid}`는 본인 문서만 생성/수정
- `books` 생성 시 `ownerId == request.auth.uid`; 수정/삭제는 소유자만 허용
- `activeLoanRequestLocks`는 `borrowerId == request.auth.uid`인 본인 문서만 transaction에서 읽고 생성 가능하며 클라이언트 수정/삭제 금지
- `activeLoanRequestGroups`는 `borrowerId == request.auth.uid`인 본인 그룹만 transaction에서 읽고 생성 가능하며, 운영에서는 Callable Function만 갱신하도록 전환
- `borrowerId`, `status` 변경은 일반 클라이언트에서 금지하고 신뢰 가능한 백엔드만 허용
- `loanRequests` 생성 시 `borrowerId == request.auth.uid`, 자기 책 신청 금지
- `chatRooms`와 `messages`는 `participantIds`에 포함된 사용자만 읽기/쓰기
- 메시지의 `senderId == request.auth.uid`
- `IMAGE` 메시지는 `image.storagePath`가 `chat-media/{roomId}/{request.auth.uid}/`로 시작하고 `image.mimeType`이 `image/*`인지 검증
- `memberSettings/{uid}`는 채팅 참가자 중 `request.auth.uid == uid`인 본인 문서만 읽기/쓰기
- `users/{uid}/blockedUsers`는 `request.auth.uid == uid`인 차단 주체만 생성·목록 조회·삭제
- 메시지와 약속 생성은 Rules의 `exists()`로 양방향 차단 문서가 모두 없는 경우에만 허용
- `chatReports`는 인증된 채팅 참가자만 생성할 수 있고 `reporterId == request.auth.uid`; 클라이언트 수정·삭제 및 일반 목록 조회 금지

### P0 — 대여 상태 전이용 Cloud Functions

현재 프론트의 대여 신청 transaction은 UX 연결용입니다. 중복 신청 방지와 경쟁 상태를 완전히 해결하려면 다음 Callable Function이 필요합니다.

- `createLoanRequest(bookId)`
- `acceptLoanRequest(requestId, dueAt)`
- `rejectLoanRequest(requestId)`
- `cancelLoanRequest(requestId)`
- `completeReturn(requestId)`
- `acceptMeetingProposal(roomId, messageId)`
- `activateDueLoans()` (Scheduled Function, 분 단위 실행)

기존 `acceptLoanRequest`는 약속 없이 즉시 `BORROWED`로 전이하지 않도록 역할을 재정의하거나 제거해야 합니다. 약속 수락 시 `SCHEDULED`로 예약하고 시작 시각 도래 시 `BORROWED`로 전이합니다.

현재 프론트 transaction의 `acceptMeetingProposal`은 `REQUESTED/AVAILABLE`을 검증한 뒤 `SCHEDULED/RESERVED`로 예약합니다. 운영용 Function에서는 동일 책의 나머지 `REQUESTED` 신청도 함께 거절해야 합니다. `activateDueLoans`는 `status == SCHEDULED && loanAt <= now`인 요청을 조회해 `loanRequests.status`, `books.status`, `chatRooms.status`를 원자적으로 `BORROWED`로 바꿔야 합니다. 앱의 `syncDueLoans`는 Scheduled Function이 지연되거나 아직 배포되지 않은 개발 환경을 위한 보정 로직입니다.

`createLoanRequest(s)`도 운영 전 Callable Function으로 이전하여 제목별 활성 요청 3건 제한, `activeLoanRequestLocks`, `activeLoanRequestGroups`, 요청 및 채팅 생성을 서버 transaction으로 처리해야 합니다. 요청 종료 및 한 요청 수락 시 그룹/잠금 정리도 같은 Function에서 원자적으로 수행합니다.

### P0 — 채팅 신고 및 알림 처리

현재 프론트는 실제 Firestore 문서에 나가기·차단·신고·알림 설정을 저장합니다. 운영 환경에서는 다음 서버 처리가 필요합니다.

- `submitChatReport(roomId, reason)`: Auth UID로 신고자를 확정하고 참가자 여부를 검증한 뒤, 신고 시점 메시지 증거를 서버에서 별도 보존
- 동일 사용자의 중복 신고 rate limit 및 운영자 전용 신고 상태 변경 API
- 메시지 Push Notification Function에서 수신자의 `memberSettings.active == true`, `notificationsMuted == false`이고 양방향 차단 관계가 없을 때만 FCM 발송
- 차단 해제 화면/API 추가 시 `users/{uid}/blockedUsers/{targetUid}`만 삭제하며 기존 채팅방을 자동 복원할지는 정책으로 확정

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
- `components/ChatReportModal.tsx`: 신고 사유 선택 및 실제 신고 접수 UI
- `services/chatMediaRepository.ts`: 채팅 이미지 Storage 업로드, IMAGE 메시지 연결 및 실패 객체 정리
- `services/kakaoPlaceRepository.ts`: 카카오 로컬 REST API 장소 검색
- `hooks/useChatThread.ts`: 개별 채팅방 정보 및 메시지 실시간 구독
- `components/MeetingComposerModal.tsx`: 대여·반납 일시와 장소를 고르는 약속 작성 화면
- `components/KakaoPlacePickerModal.tsx`: 카카오 장소 검색, 정적 지도 미리보기, 외부 카카오맵 열기와 장소 선택
- `services/userRepository.ts`: 인증 사용자 프로필 동기화
- `services/rentalHistoryRepository.ts`: 완료된 실제 대여 내역 조회와 책·사용자 조합
- `hooks/useRentalHistory.ts`: 대여 내역 화면 포커스 기반 재조회
- `services/firestoreMappers.ts`: Firestore 문서를 화면 모델로 변환
- `services/bookCoverRepository.ts`: Firebase Storage 표지 업로드/삭제
- `services/bookCreationService.ts`: Storage와 독립적으로 `books` 문서를 생성하는 나의 책 등록 서비스
- `services/readingRecordRepository.ts`: 사용자·책 조합별 `records` 독서 상태/진행률/완독 기록 조회 및 저장
- `hooks/useReadingRecord.ts`: 책 상세와 기록 수정 화면의 포커스 기반 독서 기록 재조회

새 화면에서 Firestore를 사용할 때 컴포넌트에서 `firebase/firestore`를 직접 호출하지 말고 repository에 메서드를 추가합니다. 백엔드 변경이나 새 필드·인덱스·Function이 필요하면 이 문서에 우선순위, 입력, 출력, 권한 조건을 함께 기록합니다.

## 탐색 매거진 콘텐츠 운영 메모

현재 탐색 매거진 19건은 `data/magazines.ts`의 개발자 관리 목데이터입니다. 각 항목은 소개 훅, 본문 섹션, 토론 질문과 양쪽 관점, 북 플레이리스트, 역사·작가·기술 팩트, 편집자 노트, 외부 참고자료 URL을 포함합니다. 『모순』, 『오뒷세이아』, 『클로드 코드 제대로 시작하기』 매거진은 선택적 `longRead`를 사용해 장문 프리뷰, 중간 강조문, 독자 질문을 제공합니다. 탐색에는 `테크` 카테고리가 추가되어 있습니다. 앱은 외부 URL을 참고자료로만 열며 Firestore read/write는 발생하지 않습니다.

운영자가 앱 배포 없이 매거진을 발행해야 하는 단계가 오면 다음 백엔드 구조가 필요합니다.

- `magazines/{magazineId}`: 현재 `models/Magazine.ts`와 동일한 콘텐츠 필드, `status: DRAFT | PUBLISHED`, `publishedAt`, `updatedAt`, `authorUid`
- 일반 사용자는 `PUBLISHED` 문서만 읽고, 쓰기는 관리자 custom claim 사용자만 허용
- 이미지와 음악은 저작권이 확인된 외부 링크 또는 Storage asset reference만 저장
- 외부 참고자료 URL은 서버/관리자 도구에서 `https` scheme과 허용 도메인을 검증
- 발행 목록은 `status ASC, publishedAt DESC` 복합 인덱스로 조회
