# 페이지 상호작용 목록

[HomeScreen]

- 대여 가능 책 카드 클릭
  → RentalDetailScreen
  → 선택한 렌탈 등록 책의 대여 상세 페이지로 이동
  → Screen Navigation + DB Interaction
  → rentalId

- 하단 마이페이지 클릭
  → MyPageScreen
  → 마이페이지로 이동
  → Screen Navigation + DB Interaction
  → borrowedBooks, myBooks

[RentalDetailScreen]

- 뒤로가기 버튼 클릭
  → HomeScreen
  → 이전 화면으로 돌아감
  → Screen Navigation
  → 없음

- 대여 요청하기 버튼 클릭
  → ChatScreen
  → 해당 렌탈 책의 대여 요청 채팅방으로 이동
  → Screen Navigation + DB Interaction
  → rentalId, chatRoomId

[ChatScreen]

- 채팅 전송 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 입력한 메시지를 말풍선으로 표시
  → In-Screen State Change + DB Interaction
  → chatRoomId, message

- 합의 완료 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 대여 완료 Toast 표시 후 내 대여 책 목록에 추가
  → In-Screen State Change + DB Interaction
  → chatRoomId, rentalId

[MyPageScreen]

- 대여한 책 탭 클릭
  → 현재 화면 내부 상태 변경
  → 대여 완료 책 목록 표시
  → In-Screen State Change + DB Interaction
  → borrowedBooks

- 직접 추가한 책 탭 클릭
  → 현재 화면 내부 상태 변경
  → 직접 추가한 책 목록 표시
  → In-Screen State Change + DB Interaction
  → myBooks

- 책 추가하기 버튼 클릭
  → AddBookScreen
  → 직접 추가할 책 입력 화면으로 이동
  → Screen Navigation
  → 없음

- 대여한 책 카드 클릭
  → ReadingLogScreen
  → 선택한 대여 책의 독서 기록 페이지로 이동
  → Screen Navigation + DB Interaction
  → borrowedId

- 직접 추가한 책 카드 클릭
  → ReadingLogScreen
  → 선택한 직접 추가 책의 독서 기록 페이지로 이동
  → Screen Navigation + DB Interaction
  → myBookId

[AddBookScreen]

- 표지 사진 선택 영역 클릭
  → 갤러리
  → 표지 이미지 선택 후 미리보기 표시
  → External Activity + In-Screen State Change
  → coverImageUri

- 저장하기 버튼 클릭
  → MyPageScreen
  → 입력한 책 정보를 직접 추가한 책 목록에 저장하고 마이페이지로 복귀
  → Screen Navigation + DB Interaction
  → myBookId

[ReadingLogScreen]

- 현재 페이지 - 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 현재 페이지 감소 후 저장 시 진행률 갱신
  → In-Screen State Change + DB Interaction
  → currentPage

- 현재 페이지 + 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 현재 페이지 증가 후 저장 시 진행률 갱신
  → In-Screen State Change + DB Interaction
  → currentPage

- 현재 페이지 직접 입력 후 저장
  → 현재 화면 내부 상태 변경
  → 입력한 페이지 저장 후 진행률 갱신
  → In-Screen State Change + DB Interaction
  → currentPage, totalPage

- 기억에 남는 문장 저장 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 문장 기록 저장
  → In-Screen State Change + DB Interaction
  → quote

- 나의 감상 저장 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 감상 기록 저장
  → In-Screen State Change + DB Interaction
  → review
[구현 메모]

- HomeScreen의 `책 등록` 버튼은 `AddBookScreen`이 아니라 대여용 등록 화면인 `AddRentalBookScreen`으로 연결될 예정
- MyPageScreen의 `책 추가` 버튼은 `AddBookScreen`으로 연결되며, 직접 추가한 책/읽는 책 등록 흐름에만 해당
- `AddBookScreen`과 `AddRentalBookScreen`은 목적이 다르므로 같은 화면으로 취급하지 않음
