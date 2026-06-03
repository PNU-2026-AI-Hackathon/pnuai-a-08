# 구현 판단 참고 예시

이 문서의 예시는 규칙을 이해하기 위한 참고 자료다. 실제 프로젝트 파일과 구조를 확인하지 않은 상태에서 예시를 그대로 복사하여 구현하지 않는다.

## 1. 새 화면으로 이동해야 하는 사례

- 홈 화면 책 등록 버튼 클릭 → `BookRegisterActivity` 이동
- 대여 상세 화면 대여 요청 버튼 클릭 → `ChatActivity` 이동
- AI 가이드 화면 AI 질문 버튼 클릭 → `AIQuestionActivity` 이동

## 2. 현재 화면 내부 상태로 처리해야 하는 사례

- AI 가이드에서 핵심 키워드 버튼 클릭 → 같은 화면에 키워드 표시
- 독서 기록 페이지에서 `+` 버튼 클릭 → 현재 페이지 숫자 증가
- 대여 상세 페이지에서 책 상태 더보기 클릭 → 설명 영역 펼침

## 3. 페이지 상호작용 기록 예시

```md
[HomeScreen]

- AI 추천 도서 카드 클릭
  → AIGuideScreen
  → 선택한 책의 AI 독서 가이드 화면으로 이동
  → Screen Navigation
  → selectedBookId

[AIGuideScreen]

- 핵심 키워드 버튼 클릭
  → 현재 화면 내부 상태 변경
  → 핵심 키워드 영역 표시
  → In-Screen State Change
  → keyword mock data

[RentalDetailScreen]

- 대여 요청 버튼 클릭
  → ChatScreen
  → 사용자 간 대여 채팅 시작
  → Screen Navigation + DB Interaction
  → rentalId, chatRoomId
```

## 4. 홈 화면에서 AI 추천 도서 클릭 흐름 예시

```text
사용자
→ HomeScreen의 BookCard 클릭
→ ActivityNavigator 호출
→ AIGuideScreen 이동
→ selectedBookId 전달
→ BookRepository에서 책 데이터 조회
→ 화면에 데이터 표시
```

```text
ui/screen/home/HomeScreen.kt
    ↓ trigger

navigation/ActivityNavigator.kt
    ↓ navigation

ui/screen/aiguide/AIGuideScreen.kt
    ↓ data request

data/repository/BookRepository.kt
    ↓

data/local/BookLocalDataSource.kt
    ↓

Book 데이터 반환
    ↓

AIGuideScreen UI 렌더링
```
