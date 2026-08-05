DB 스키마

앱 전체의 DB 스키마는

- `users` (사용자 정보)
- `books` (앱 전체에 등록된 '실제 책 한 권 한 권'의 정보)
- `records` (독서 기록 / 메모)
- `loanRequests` (대여 신청 및 승인 상태)
- `chatRooms` (대여 신청으로 생성된 채팅방)
- `chatRooms/{chatRoomId}/messages` (채팅 메시지 subcollection)

이렇게 5개 top-level 컬렉션과 메시지 subcollection으로 구성합니다.

### ① `books` 컬렉션 (책 정보)

> **핵심 아이디어:** "내가 등록한 책", "남한테 빌려준 책", "내가 빌린 책"을 **별도의 테이블로 나누지 않고, `books` 하나에서 상태값과 소유자/대여자 ID로 관리**합니다.
> 

책을 등록할 때(직접 입력하든, 네이버/카카오 도서 API나 OCR로 불러오든) 들어오는 정보들을 아래처럼 포함시키면 됩니다.

JSON

```json
// collections / books / {book_id}
{
  "bookId": "book_abc123",              // Firestore 자동 생성 문서 ID

  // 책 기본 정보 (사용자가 추가하거나 도서 검색으로 들어온 정보)
  "title": "모모",                       // 책 제목
  "author": "미하엘 엔데",                // 작가 / 저자
  "publisher": "비룡소",                  // 출판사
  "isbn": "9788949110036",               // ISBN
  "coverUrl": "https://storage...",      // 표지 이미지 경로
  "description": "시간 도둑과 빼앗긴 시간을...", // 책 한줄 설명 또는 메모

  // 대여 장소 (책 소유자가 대여 가능 등록 시 선택)
  "lendingPlace": {
    "placeId": "place_pnu_jangjeon",     // 앱에서 관리하는 장소 고유값
    "name": "부산대학교 장전캠퍼스",       // 화면 표시명
    "address": "부산광역시 금정구 부산대학로63번길 2",
    "latitude": 35.2339,
    "longitude": 129.0798
  },

  // 소유 및 대여 관리 필드
  "ownerId": "user_my_uid_123",          // 책을 등록한 사용자 UID
  "isLendable": false,                   // true: 대여 가능으로 등록 / false: 혼자 보는 개인 소장용
  "borrowerId": null,                    // 빌려간 사람 UID (빌려준 적 없으면 null)
  "status": "PRIVATE",                   // "PRIVATE"(개인소장), "AVAILABLE"(대여가능), "BORROWED"(대여중)

  "createdAt": "2026-02-18T12:00:00Z"    // 등록일자
}
```

- `lendingPlace`는 `isLendable == true`인 책에 필수입니다.
- Firestore에는 날짜를 문자열 대신 `serverTimestamp()` / `Timestamp`로 저장합니다.
- 대여 장소를 변경하면 기존 신청자에게 영향을 줄 수 있으므로 대여 신청 이후에는 해당 신청 문서에도 장소 정보를 snapshot으로 복사합니다.

책의 정보들은 : google books api 에서 받아오거나 직접 입력

### 핵심 동작 방식

1. **그냥 내 책으로 등록할 때 (`나의 책` + 버튼)**
    - 입력 폼에서 제목, 작가, 출판사, 표지 사진을 채워서 넘깁니다.
    - `isLendable: false`, `status: "PRIVATE"` 로 저장됩니다.
    - 결과: 내 서재(`나의 책`) 목록에만 뜨고, 남들이 보는 대여 마켓에는 노출되지 않습니다.
2. **빌려줄 책으로 등록할 때 (또는 내 책 중 빌려주기로 상태 변경할 때)**
    - 동일하게 기본 정보를 입력하되,
        - “빌려줄래요” 버튼에서 트리거 된 책 등록 페이지인지를 확인하는 로직을 삽입하거나 또는
        - 별도의 대여용 책 등록 페이지를 만들거나 아니면
        - 그냥 책 등록 페이지에 대여 설정 토글/스위치를 만들어 놔서 사용자가 킬 수 있게..? 모르겠음
        
        이렇게 하고 저장을 하면
        
    - `isLendable: true`, `status: "AVAILABLE"` 로 저장됩니다.
    - 결과: 내 서재에도 뜨고, **"빌릴래요/빌려줄래요" (👥 버튼) 화면에도 노출되어 다른 학생들이 신청**할 수 있게 됩니다.

즉, **책 데이터의 기본 메타데이터(제목, 작가, 출판사 등)는 동일한 구조**로 저장되고, 대여 여부 플래그(`isLendable`) 하나로 내 개인용인지 공유용인지가 구분되는 구조

#### 각 경우별 조회를 위한 쿼리식의 형태를 보면,

#### 1. 메인 화면의 `나의 책` (내가 소장/등록한 모든 책)

> 대여 가능 여부(`isLendable`)와 관계없이 **내가 내 서재에 추가한 모든 책**을 보여줍니다.
> 

JavaScript

```json
// ownerId가 내 UID인 모든 책
const q = query(
  collection(db, "books"),
  where("ownerId", "==", myUid)
);
```

#### 2. 메인 화면의 `빌린 책` (내가 남에게 빌려서 읽는 중인 책)

> 책 원래 주인이 누구든 상관없이, **현재 대여자(`borrowerId`)가 나로 지정된 책**만 보여줍니다.
> 

JavaScript

```json
// borrowerId가 내 UID인 책
const q = query(
  collection(db, "books"),
  where("borrowerId", "==", myUid)
);
```

#### 3. 내가 남한테 빌려준 책 목록 (내 마이페이지나 대여 관리 화면용)

> 내가 주인이면서(`ownerId == myUid`), **현재 누군가가 빌려간 상태(`status == "BORROWED"`)인 책**만 정확히 골라냅니다.
> 

JavaScript

```json
// 내가 주인 + 현재 대여중 복합 쿼리
const q = query(
  collection(db, "books"),
  where("ownerId", "==", myUid),
  where("status", "==", "BORROWED")
);
```

#### 4.  `"빌릴래요" 누르고 들어 갔을` 화면 (남들이 등록한 대여 가능 책 목록을 띄울때 쓰면 됨)

> 내가 아닌 남이 등록했으면서(`ownerId != myUid`), **대여 가능으로 설정해둔(`isLendable == true`) 책**만 보여줍니다.
> 

#### Firestore 쿼리 + 클라이언트 필터링으로 구현 할 것

DB에서는 `isLendable == true` 이면서 `status == "AVAILABLE"` (대여 가능 상태)인 책을 전부 가져온 뒤, **React Native 코드 단에서 내 책만 제외**하는 방식입니다.

JavaScript

```jsx
// 1. Firestore에서 "대여 가능한 모든 책"을 가져옴
const q = query(
  collection(db, "books"),
  where("isLendable", "==", true),
  where("status", "==", "AVAILABLE")
);

const querySnapshot = await getDocs(q);

// 2. 클라이언트 코드에서 "내 책(ownerId == myUid)"만 필터링해서 제거
const availableBooksForMe = querySnapshot.docs
  .map(doc => ({ id: doc.id, ...doc.data() }))
  .filter(book => book.ownerId !== myUid); // 👈 여기서 내 책 제외!
```

- 그냥 조건 3개를 걸어서 Firestore 로 요청하면 복합 인덱스 설정 때문에 오류 뜰 수 있음 따라서 2개 조건만 걸어서 요청 하고 , 클라이언트에서 한번 더 걷어낼 것.

### ② `records` 컬렉션 (독서 기록 / 감상문)

> **핵심 아이디어:** 화면 4(기록 페이지)에서 작성하는 메모입니다. 어떤 책에 대한 기록인지 `bookId`를 연결하고, 작성자가 누구인지 `userId`를 적어둡니다.
> 
- **문서 ID (Document ID):** 자동 생성 고유값 (예: `record_xyz789`)

```json
// collections / records / {record_id}
{
  "recordId": "record_xyz789",
  "bookId": "book_abc123",       // 어떤 책에 대한 기록인지 (books 컬렉션의 ID)
  "userId": "user_my_uid_123",    // 작성자 UID
  "content": "오늘 30페이지까지 읽었는데 너무 재밌다...", // 메모 내용
  "isPublic": false,              // 공개 여부 (나만보기/친구공개 등)
  "createdAt": "2026-02-18T11:00:00Z"
}
```

**도서 상세 화면에서 '이 책의 독서 기록' 가져오기(한 사용자가 한 책에 대해 남긴 기록):**

```tsx
where("bookId", "==", 현재책ID) AND where("userId", "==", 내UID)
```

### ③ `users` 컬렉션 (사용자 정보)

> 로그인할 때 Firebase가 주는 정보와 사용자 기본 프로필을 저장
> 
- **문서 ID (Document ID):** `auth.currentUser.uid` (FIREBASE AUTH SDK 사용시 OAUTH2 방식으로 구글과의 와리가리로 사용자를 인증한 FIREBASE가 각 사용자에게 발급 해주는 UID , REFRESH TOKEN(이거 로컬 ASYNC STORAGE에 저장 될 거임), SESSION 토큰 그리고 인증과정에서 구글에서 발급 해주는 사용자의 정보를 FIREBASE 가 발급 받아서 넘겨준 사용자의 개인정보를 DB 에 저장할거임 , 이 사용자 정보 테이블은 사용자 UID를 그대로 문서 ID 즉 기본키로 사용!)

JSON

```json
// collections / users / {user_uid}
{
  "uid": "user_my_uid_123",
  "email": "student@pnu.ac.kr",
  "displayName": "서로서가",
  "schoolName": "부산대학교",
  "createdAt": "2026-02-18T09:00:00Z"
}
```

### ④ `loanRequests` 컬렉션 (대여 신청)

> **핵심 아이디어:** 사용자가 `대여 신청하기`를 누르면 신청 문서를 만들고, 같은 트랜잭션 또는 Cloud Function에서 1:1 채팅방을 생성합니다. 신청만으로 책을 즉시 `BORROWED`로 바꾸지 않고, 소유자가 수락할 때 변경합니다.

```json
// collections / loanRequests / {request_id}
{
  "requestId": "request_xyz123",
  "bookId": "book_abc123",
  "ownerId": "user_owner_uid",
  "borrowerId": "user_borrower_uid",
  "chatRoomId": "chat_xyz123",

  "status": "REQUESTED",
  // "REQUESTED" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "RETURNED"

  // 신청 당시 장소 snapshot (책의 장소가 나중에 바뀌어도 신청 기록 유지)
  "lendingPlace": {
    "placeId": "place_pnu_jangjeon",
    "name": "부산대학교 장전캠퍼스",
    "address": "부산광역시 금정구 부산대학로63번길 2",
    "latitude": 35.2339,
    "longitude": 129.0798
  },

  "requestedAt": "Firestore Timestamp",
  "respondedAt": null,
  "dueAt": null,
  "returnedAt": null,
  "updatedAt": "Firestore Timestamp"
}
```

#### 대여 신청 시 검증

- 로그인 사용자만 신청할 수 있습니다.
- `borrowerId`는 `request.auth.uid`와 같아야 합니다.
- 자기 책(`ownerId == borrowerId`)은 신청할 수 없습니다.
- 대상 책은 `isLendable == true && status == "AVAILABLE"`이어야 합니다.
- 동일 사용자와 동일 책의 활성 신청(`REQUESTED`, `ACCEPTED`)은 하나만 허용합니다.

#### 소유자가 신청을 수락할 때

Firestore transaction 또는 Callable Cloud Function으로 아래 변경을 원자적으로 처리합니다.

1. 책이 여전히 `AVAILABLE`인지 다시 확인
2. `loanRequests.status = "ACCEPTED"`
3. `books.status = "BORROWED"`
4. `books.borrowerId = loanRequests.borrowerId`
5. 동일 책의 나머지 `REQUESTED` 신청은 `REJECTED` 처리

### ⑤ `chatRooms` 컬렉션 (대여 채팅방)

> `대여 신청하기`를 누르면 신청자와 책 소유자가 대화할 수 있는 방을 하나 생성합니다. 방 목록은 `participantIds`에 현재 UID가 포함된 문서만 조회합니다.

```json
// collections / chatRooms / {chat_room_id}
{
  "chatRoomId": "chat_xyz123",
  "requestId": "request_xyz123",
  "bookId": "book_abc123",
  "ownerId": "user_owner_uid",
  "borrowerId": "user_borrower_uid",
  "participantIds": ["user_owner_uid", "user_borrower_uid"],

  // 채팅 목록을 위한 denormalized 책 snapshot
  "bookSnapshot": {
    "title": "모모",
    "author": "미하엘 엔데",
    "coverUrl": "https://storage..."
  },

  "lastMessage": "내일 오후 3시에 만나요!",
  "lastMessageSenderId": "user_owner_uid",
  "lastMessageAt": "Firestore Timestamp",

  // 각 사용자가 마지막으로 읽은 시각
  "lastReadAtByUser": {
    "user_owner_uid": "Firestore Timestamp",
    "user_borrower_uid": "Firestore Timestamp"
  },

  "createdAt": "Firestore Timestamp",
  "updatedAt": "Firestore Timestamp"
}
```

- 동일 `requestId`당 채팅방은 하나만 생성합니다.
- 안전한 중복 방지를 위해 `chatRoomId`를 request ID와 동일하게 사용하거나 transaction에서 존재 여부를 확인합니다.
- 채팅방 읽기 권한은 `participantIds`에 포함된 사용자에게만 허용합니다.

### ⑥ `chatRooms/{chatRoomId}/messages` subcollection

```json
// collections / chatRooms / {chat_room_id} / messages / {message_id}
{
  "messageId": "message_abc123",
  "senderId": "user_owner_uid",
  "type": "TEXT",
  // "TEXT" | "SYSTEM"
  "text": "내일 오후 3시에 만나요!",
  "createdAt": "Firestore Timestamp"
}
```

- 메시지 생성자는 `senderId == request.auth.uid`여야 합니다.
- 발신자는 해당 채팅방의 `participantIds`에 포함되어야 합니다.
- 메시지 생성과 함께 상위 `chatRooms`의 `lastMessage`, `lastMessageSenderId`, `lastMessageAt`, `updatedAt`을 갱신합니다.
- 목록의 안 읽은 개수는 `lastReadAtByUser.{uid}` 이후 메시지를 조회해 계산하거나, 규모가 커지면 사용자별 `unreadCount`를 Cloud Function으로 관리합니다.

### 필요한 Firestore 복합 인덱스

```text
books:       isLendable ASC, status ASC
books:       ownerId ASC, status ASC
loanRequests: ownerId ASC, status ASC, updatedAt DESC
loanRequests: borrowerId ASC, status ASC, updatedAt DESC
chatRooms:   participantIds ARRAY_CONTAINS, lastMessageAt DESC
```

### 구현 순서

1. Firebase Auth 로그인 사용자의 UID 확보
2. `books`에서 `isLendable == true && status == "AVAILABLE"` 조회
3. 클라이언트에서 `ownerId != currentUser.uid` 필터
4. 대여 신청 시 서버 transaction/Callable Function으로 `loanRequests`와 `chatRooms` 생성
5. 소유자 수락 시 책 상태와 신청 상태를 transaction으로 변경
6. `chatRooms/{chatRoomId}/messages`를 `onSnapshot`으로 실시간 구독
