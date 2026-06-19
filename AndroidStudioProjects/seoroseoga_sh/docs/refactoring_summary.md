# 구현 지시용 요약본

기존 코드를 최대한 재사용하되, 기존 책 대여 중심 앱을 **독서모임 중심 앱**으로 리팩터링한다.

이 문서를 우선 기준으로 구현한다.

불명확한 부분이 있거나 기존 코드 구조와 충돌하는 부분이 있으면 임의로 크게 바꾸지 말고 사용자에게 질문하거나 전체 기획서을 참고한다.

세부 화면 흐름, DB 구조, Mermaid 흐름도는 전체 기획서를 참고한다.

---

# 1. 핵심 변경 목표

기존 기능:

- 대여 가능한 책 목록
- 내 책 등록
- 대여한 책 목록
- 독서 기록 페이지

변경 후 핵심 기능:

- 금주의 독서모임 목록 표시
- 모임 만들기
- 책 사진 OCR + Google Books API 기반 책 정보 자동 입력
- 모임 참가 신청
- 모임별 단체 채팅방
- 내가 만든 모임 / 내가 참가한 모임을 마이페이지에서 확인

---

# 2. 사용자 식별 방식

현재 로그인 기능이 없으므로 Firebase Auth UID를 사용하지 않는다.

앱 최초 실행 시 SharedPreferences에 기기별 UUID를 생성하여 저장한다.

```kotlin
val prefs = context.getSharedPreferences("app", Context.MODE_PRIVATE)

var userId = prefs.getString("userId", null)

if (userId == null) {
    userId = UUID.randomUUID().toString()
    prefs.edit().putString("userId", userId).apply()
}
```

이후 앱 전체에서 현재 사용자 ID는 다음 값으로 사용한다.

```
currentUserId = SharedPreferences.userId
```

참가자 이름 또는 개설자 이름은 다음 값으로 사용한다.

```
displayName = SharedPreferences.displayName
```

모임 개설 시 입력한 `hostName`을 `SharedPreferences.displayName`에도 저장한다.

참가 신청 시 입력한 참가자 이름도 `SharedPreferences.displayName`에 저장한다.

---

# 3. 주요 UI 목록

## 3-1. HomeScreen

기존 HomeScreen을 수정한다.

변경 사항:

- “대여 가능한 책” 영역을 “금주의 독서모임”으로 변경
- “내 책 등록” 버튼을 “모임 만들기” 버튼으로 변경
- Mock book data 대신 Firestore `meetings` 컬렉션 데이터를 조회하여 표시
- 모임 카드를 클릭하면 `ParticipateScreen(meetingId)`로 이동
- “모임 만들기” 버튼을 클릭하면 `MeetRegScreen`으로 이동
- “더보기” 버튼을 클릭하면 참가 가능한 모임 전체 목록 화면으로 이동

홈 화면의 모임 목록은 `createdAt` 내림차순으로 조회한다.

따라서 새로 만든 모임이 가장 앞에 표시된다.

---

## 3-2. MeetRegScreen

새로운 모임을 만드는 화면이다. meetings 에 해당하는 db 구조에 넣기 위한 정보들을 입력하는 단계이다. 해당 단계는 사용자가 직접 입력해야 하는 값들 , 사용자가 선택한 책 사진을 ocr 과 google books api 에 적용해 자동으로 채워지고 사용자가 수정할 수도 있는 책 관련 정보들을 해당 페이지에서 입력받는다.

사용자 입력값:

- 모임 제목 `title`
- 모임 설명 `description`
- 개설자 이름 `hostName`
- 장소 `place`
- 날짜 `meetingDate`
- 시간 `meetingTime`
- 참가비 `fee`
- 최대 인원 `maxParticipants`

책 정보 입력 흐름:

1. 사용자가 책 사진을 선택한다.
2. OCR을 수행하여 책 제목만 추출한다.
3. 추출된 제목을 책 제목 입력칸에 자동 입력한다.
4. 사용자는 책 제목을 직접 수정할 수 있다.
5. 사용자가 “정보 불러오기” 버튼을 누른다.
6. 현재 책 제목 입력값으로 Google Books API를 호출한다.
7. API 응답으로 책 후보 목록을 표시한다.
8. 사용자가 정확한 책을 선택한다.
9. 선택한 책 정보로 다음 값을 자동 입력한다.

자동 입력값:

- `bookTitle`
- `bookAuthor`
- `bookImageUrl`
- `bookDescription`
- `bookIsbn`

중요:

- Google Books API에서 받은 책 표지 이미지는 반드시 Android `DownloadManager`로 다운로드한다.
- 다운로드된 로컬 URI를 `bookImageLocalUri`로 저장한다.
- 화면 렌더링 시 `bookImageLocalUri`가 있으면 우선 사용하고, 없으면 `bookImageUrl`을 fallback으로 사용한다.

모임 생성 버튼 클릭 시:

1. `meetings` 문서 생성
2. `chatRooms` 문서 생성
3. 생성된 `chatRoomId`를 `meetings.chatRoomId`에 저장
4. `chatRooms.memberIds`에 개설자의 `SharedPreferences.userId` 추가
5. `SharedPreferences.displayName = hostName` 저장
6. HomeScreen으로 이동
7. HomeScreen에서 `meetings`를 다시 조회하여 새 모임 표시

---

## 3-3. ParticipateScreen

홈 화면 또는 더보기 화면에서 모임을 선택하면 들어오는 모임 참가 신청 화면이다.

DB 조회:

```
meetings/{meetingId}
```

표시할 정보:

- 모임 제목
- 모임 설명
- 책 제목
- 책 저자
- 책 이미지
- 책 설명
- 개설자 이름
- 장소
- 날짜
- 시간
- 참가비
- 현재 인원 / 최대 인원

참가 신청 흐름:

1. 사용자가 “참가신청하기” 버튼 클릭
2. 현재 `SharedPreferences.userId`가 `participantIds`에 이미 있는지 확인
3. 이미 참가자라면 바로 채팅방으로 이동
4. 처음 참가하는 경우 참가자 이름 입력
5. 입력한 이름을 `SharedPreferences.displayName`에 저장
6. `meetings.participantIds`에 현재 UUID 추가
7. `chatRooms.memberIds`에 현재 UUID 추가
8. `currentParticipantsCount` 증가
9. 인원이 꽉 차면 `status = "full"`로 변경
10. 해당 모임의 `ChatScreen(chatRoomId)`로 이동

---

## 3-4. ChatScreen

모임별 단체 채팅방 화면이다.

DB 조회:

```
chatRooms/{chatRoomId}/messages
```

조회 조건:

```
createdAt 오름차순
실시간 리스너 사용
```

메시지 문서 구조:

```
chatRooms/{chatRoomId}/messages/{messageId}
- messageId
- senderId
- senderName
- text
- createdAt
```

메시지 전송 시 저장값:

```
senderId = SharedPreferences.userId
senderName = SharedPreferences.displayName
text = 사용자가 입력한 메시지
createdAt = serverTimestamp()
```

메시지 렌더링 규칙:

```
message.senderId == SharedPreferences.userId
→ 내 메시지
→ 오른쪽 정렬

message.senderId != SharedPreferences.userId
→ 상대 메시지
→ 왼쪽 정렬 + senderName 표시
```

메시지를 보낼 때마다 `chatRooms/{chatRoomId}`의 다음 값도 갱신한다.

```
lastMessage = text
lastMessageAt = serverTimestamp()
```

---

## 3-5. MyPageScreen

마이페이지에서는 내가 만든 모임과 내가 참가 신청한 모임을 보여준다.

조회 기준:

```
meetings
where participantIds array-contains SharedPreferences.userId
```

즉, 모임 개설자도 `participantIds`에 포함되므로 내가 만든 모임도 같이 표시된다.

표시할 정보:

- 모임 제목
- 책 제목
- 책 이미지
- 장소
- 날짜
- 시간
- 현재 인원 / 최대 인원

모임 클릭 시:

```
JoinedMeetingDetailScreen(meetingId)
```

로 이동한다.

기존 “직접 추가한 책” 페이지는 유지한다.

---

## 3-6. JoinedMeetingDetailScreen

마이페이지에서 내가 참여한 모임을 클릭했을 때 나오는 모임 상세 정보 화면이다.

DB 조회:

```
meetings/{meetingId}
```

표시할 정보:

- 모임 제목
- 모임 설명
- 책 제목
- 책 저자
- 책 이미지
- 책 설명
- 개설자 이름
- 장소
- 날짜
- 시간
- 참가비
- 현재 인원 / 최대 인원

버튼:

```
채팅방 입장하기
```

버튼 클릭 시:

1. `meeting.chatRoomId` 확인
2. `chatRooms/{chatRoomId}` 조회
3. `ChatScreen(chatRoomId)`로 이동

---

# 4. Firestore DB 구조

## 4-1. meetings

```
meetings/{meetingId}
- meetingId
- title
- description

- bookTitle
- bookAuthor
- bookImageUrl
- bookImageLocalUri
- bookDescription
- bookIsbn

- hostId
- hostName
- place
- meetingDate
- meetingTime
- fee
- maxParticipants
- participantIds
- currentParticipantsCount

- chatRoomId
- status
- createdAt
- updatedAt
```

필드 설명:

```
hostId
- SharedPreferences.userId

hostName
- 모임 만들기 화면에서 사용자가 입력한 개설자 이름

participantIds
- 참가자 UUID 목록
- 모임 개설 시 [hostId]로 시작

currentParticipantsCount
- 모임 생성 시 1

status
- open / full / closed
- MVP에서는 open / full 위주로 사용
```

---

## 4-2. chatRooms

```
chatRooms/{chatRoomId}
- chatRoomId
- meetingId
- memberIds
- lastMessage
- lastMessageAt
- createdAt
```

필드 설명:

```
memberIds
- 채팅방에 참여한 사용자 UUID 목록
- 모임 생성 시 [hostId]로 시작
```

---

## 4-3. messages

```
chatRooms/{chatRoomId}/messages/{messageId}
- messageId
- senderId
- senderName
- text
- createdAt
```

---

# 5. Repository / API 함수 명세

## 5-1. getOrCreateUserId()

| 항목 | 내용 |
| --- | --- |
| 사용 위치 | 앱 최초 실행 |
| 작업 | SharedPreferences에서 userId 조회 |
| 없을 경우 | UUID 생성 후 저장 |
| 반환 | userId |

---

## 5-2. getWeeklyMeetings()

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | HomeScreen |
| DB | meetings |
| 조건 | status == open |
| 정렬 | createdAt 내림차순 |
| 결과 | 금주의 독서모임 카드 목록 |

---

## 5-3. extractBookTitleFromImage(imageUri)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | MeetRegScreen |
| 구현 파일 | BookRecognitionModule.kt |
| 입력 | imageUri |
| 작업 | OCR 수행 |
| 반환 | 책 제목 후보 문자열 |

---

## 5-4. searchBooksByTitle(title)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | MeetRegScreen |
| 구현 파일 | BookRecognitionModule.kt |
| 입력 | title |
| 외부 API | Google Books API |
| 요청 | `GET https://www.googleapis.com/books/v1/volumes?q={title}` |
| 반환 | List |

BookInfo 구조:

```kotlin
data class BookInfo(
    val bookTitle: String,
    val bookAuthor: String,
    val bookImageUrl: String?,
    val bookDescription: String?,
    val bookIsbn: String?
)
```

---

## 5-5. downloadBookImage(bookImageUrl)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | MeetRegScreen |
| 구현 파일 | BookRecognitionModule.kt |
| 입력 | bookImageUrl |
| 작업 | Android DownloadManager로 이미지 다운로드 |
| 반환 | bookImageLocalUri |

중요:

```
책 표지 이미지 다운로드는 반드시 DownloadManager를 사용한다.
```

---

## 5-6. createMeeting()

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | MeetRegScreen |
| 입력 | 사용자 입력값 + 책 자동 입력값 |
| DB 작업 1 | meetings 문서 생성 |
| DB 작업 2 | chatRooms 문서 생성 |
| DB 작업 3 | meetings.chatRoomId 업데이트 |
| 로컬 작업 | SharedPreferences.displayName = hostName 저장 |
| 완료 후 | HomeScreen 이동 |

---

## 5-7. getMeetingDetail(meetingId)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | ParticipateScreen, JoinedMeetingDetailScreen |
| 입력 | meetingId |
| DB | meetings/{meetingId} |
| 반환 | 모임 상세 정보 |

---

## 5-8. joinMeeting(meetingId, displayName)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | ParticipateScreen |
| 입력 | meetingId, displayName |
| 로컬 값 | SharedPreferences.userId |
| 사전 검사 | participantIds에 이미 있는지 확인 |
| DB 작업 1 | meetings.participantIds에 userId 추가 |
| DB 작업 2 | chatRooms.memberIds에 userId 추가 |
| DB 작업 3 | currentParticipantsCount 증가 |
| DB 작업 4 | 인원 초과 시 status = full |
| 로컬 작업 | SharedPreferences.displayName = displayName 저장 |
| 완료 후 | ChatScreen 이동 |

---

## 5-9. getChatRoom(chatRoomId)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | ChatScreen, JoinedMeetingDetailScreen |
| 입력 | chatRoomId |
| DB | chatRooms/{chatRoomId} |
| 반환 | 채팅방 정보 |

---

## 5-10. listenMessages(chatRoomId)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | ChatScreen |
| 입력 | chatRoomId |
| DB | chatRooms/{chatRoomId}/messages |
| 조건 | createdAt 오름차순 |
| 방식 | 실시간 리스너 |
| 반환 | 메시지 목록 |

---

## 5-11. sendMessage(chatRoomId, text)

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | ChatScreen |
| 입력 | chatRoomId, text |
| 로컬 값 | senderId = SharedPreferences.userId |
| 로컬 값 | senderName = SharedPreferences.displayName |
| DB 저장 | messages/{messageId} 생성 |
| DB 업데이트 | chatRooms.lastMessage, lastMessageAt 갱신 |

---

## 5-12. getMyJoinedMeetings()

| 항목 | 내용 |
| --- | --- |
| 사용 화면 | MyPageScreen |
| DB | meetings |
| 조건 | participantIds array-contains SharedPreferences.userId |
| 정렬 | createdAt 내림차순 |
| 반환 | 내가 만든 모임 + 내가 참가한 모임 목록 |

---

# 6. 구현 순서

아래 순서대로 구현한다.

1. SharedPreferences 기반 userId / displayName 관리 코드 작성
2. Firestore data class 작성
    - Meeting
    - ChatRoom
    - ChatMessage
    - BookInfo
3. Repository 함수 작성
    - meeting 관련
    - chatRoom 관련
    - message 관련
4. HomeScreen 수정
    - 금주의 독서모임
    - 모임 만들기 버튼
    - 더보기 버튼
5. MeetRegScreen 구현
    - OCR
    - Google Books API
    - DownloadManager
    - meetings/chatRooms 생성
6. ParticipateScreen 구현
    - 모임 상세 표시
    - 참가 신청
    - 채팅방 이동
7. ChatScreen 구현
    - 메시지 실시간 조회
    - 좌우 정렬
    - 메시지 전송
8. MyPageScreen 수정
    - 내가 참여한 모임 조회
9. JoinedMeetingDetailScreen 구현
    - 모임 상세 표시
    - 채팅방 입장
10. 기존 직접 추가한 책 관련 기능은 최대한 유지

---

# 7. 주의사항

- 기존 코드를 전부 갈아엎지 말고 재사용 가능한 UI, navigation, data class, repository 구조는 최대한 유지한다.
- Firebase Auth는 아직 사용하지 않는다.
- 현재 사용자는 `SharedPreferences.userId`로 식별한다.
- `uid`라는 표현을 쓰지 말고 코드에서는 `userId`, `hostId`, `senderId`, `participantIds`, `memberIds`처럼 명확한 이름을 사용한다.
- 책 표지 이미지는 반드시 Android DownloadManager로 다운로드한다.
- `bookImageLocalUri`가 있으면 화면에서 우선 사용한다.
- 채팅방은 참가 신청 시 생성하지 않는다.
- 채팅방은 모임 생성 시 함께 생성한다.
- 참가 신청은 기존 chatRoom에 사용자를 추가하는 작업이다.
- 불명확한 부분이 있으면 전체 기획서를 참고하고, 그래도 애매하면 사용자에게 질문한다.