# 페이지 상호작용 목록 기록 규칙

## 1. 기록 대상

다음 중 하나에 해당하면 `docs/page_interactions.md` 파일에도 함께 기록한다.

- 새로운 `Activity`/`Screen`을 생성한 경우
- 기존 화면 이동 흐름을 수정한 경우

`docs/page_interactions.md`가 아직 없다면 임의로 생성하지 않고, 작업 계획에서 생성 필요 여부를 먼저 확인한다.

## 2. 기록 원칙

- 기존 문서 구조를 유지한다.
- 기존 내용을 삭제하거나 재작성하지 않는다.
- 해당 `Screen` 섹션에 append 방식으로 추가한다.

## 3. 기록 형식

```md
[출발 화면]

- Trigger 요소
  → 도착 화면
  → 동작 설명
  → 동작 유형
  → 관련 데이터
```

## 4. 동작 유형

기본적으로 사용할 수 있는 동작 유형은 다음과 같다.

- `Screen Navigation`
- `In-Screen State Change`
- `DB Interaction`
- `API Interaction`

기능은 여러 동작 유형의 조합으로 구현될 수 있다.

예:

- `Screen Navigation + DB Interaction`
- `API Interaction + In-Screen State Change`

위 유형은 예시이며, 고정된 enum처럼 제한하지 않는다. 이 외의 동작 유형이 필요하면 작업자에게 보고하고, 사람이 검토한 뒤 이 문서의 동작 유형 목록 또는 별도 규칙 문서에 추가할 수 있도록 한다.

## 5. 기록 판단 기준

작업자는 현재 기능이 다음 중 무엇을 중심으로 이루어지는지, 실제 구현 흐름에 따라 기술한다.

- 화면 이동 중심인지
- 현재 화면 상태 변경 중심인지
- DB/API 처리 중심인지
- 여러 흐름이 결합된 기능인지

## 6. 기록 예시

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
