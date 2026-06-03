# 대여 요청 및 채팅 흐름 계획

## 1. 목적

이 문서는 대여 상세 페이지 이후의 대여 요청, 채팅, 합의 완료, 내 대여 책 목록 반영 흐름을 구현하기 위한 계획이다.

현재 구현 범위는 `HomeScreen → RentalDetailScreen → ChatScreen` 이동과 채팅 입력, 합의 완료 시뮬레이션, 대여 완료 목록 저장까지다.

## 2. 예정 화면 흐름

```text
RentalDetailScreen
→ 대여 요청하기 버튼 클릭
→ ChatScreen
→ 채팅 메시지 입력
→ 입력한 메시지를 말풍선으로 표시
→ 합의 완료 버튼 클릭
→ Toast: 상대의 합의 완료 신호를 기다리는 중입니다
→ Toast: 상대의 합의 여부 확인 완료: 대여 성공!
→ BorrowedBookRepository에 대여 완료 책 추가
→ 이후 MyPageScreen의 대여한 책 목록에서 조회 가능
```

## 3. 예정 데이터 모델

```text
ChatRoom
- chatRoomId
- rentalId
- status

ChatMessage
- messageId
- chatRoomId
- senderType
- text
- createdAtMillis

BorrowedBook
- borrowedId
- rentalBook
- borrowedAtMillis
```

## 4. 예정 Repository

```text
ChatRepository
- getOrCreateChatRoom(rentalId)
- getMessages(chatRoomId)
- sendMessage(chatRoomId, text)
- completeAgreement(chatRoomId)

BorrowedBookRepository
- addBorrowedBook(rentalBook)
- getBorrowedBooks()
```

## 5. 구현 기준

- 실제 사용자 간 통신은 구현하지 않는다.
- 채팅 입력은 현재 화면 상태와 local JSON DB에 반영한다.
- `ChatScreen`은 메시지 저장을 직접 하지 않고 `ChatRepository`를 통해 처리한다.
- 합의 완료 버튼의 상대 반응은 Toast와 local 상태 변경으로 시뮬레이션한다.
- 대여 완료 결과는 `BorrowedBookRepository`를 통해 local JSON DB에 저장하고, 이후 마이페이지에서 조회한다.
- 현재 단계에서는 마이페이지 화면 연결은 구현하지 않는다.
