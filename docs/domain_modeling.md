# 도메인 모델링 기준

## 1. 목적

이 문서는 서로서가 앱에서 비슷해 보이지만 역할이 다른 도메인 객체를 구분하기 위한 기준이다.

특히 `Book`과 `RentalBook`은 같은 책 정보를 다루지만 의미가 다르므로 혼용하지 않는다.

## 2. Book

`Book`은 플랫폼에 존재하는 책 자체를 의미한다.

### 사용 위치

- AI 추천 도서
- 책 검색 결과
- 사용자가 대여용 책을 등록할 때 선택하는 원본 책 정보
- AI 독서 가이드의 입력 데이터

### 포함 정보

- `id`
- `title`
- `author`
- `imageRes`
- `description`

### 포함하지 않는 정보

- 대여료
- 보유자
- 책 상태
- 만날 장소
- 대여 가능 여부
- 대여 요청 또는 채팅 상태

## 3. RentalBook

`RentalBook`은 사용자가 실제 대여용으로 등록한 책을 의미한다.

하나의 `Book`은 여러 사용자가 서로 다른 상태, 가격, 장소로 등록할 수 있으므로 `RentalBook`은 `Book`과 분리한다.

### 사용 위치

- 홈 화면의 대여 가능 책 목록
- 대여 상세 페이지
- 대여 요청
- 채팅방 생성
- 마이페이지의 등록한 책 또는 대여한 책 목록

### 포함 정보

- `rentalId`
- `book`
- `rank`
- `rentalStatus`
- `rentalFee`
- `condition`
- `owner`
- `location`
- `rating`
- `reviewCount`

## 4. MyBook

`MyBook`은 사용자가 마이페이지에서 직접 추가한 책을 의미한다.

`Book`은 플랫폼 책 데이터이고, `RentalBook`은 대여용 등록 책이며, `MyBook`은 사용자의 개인 책 목록에 저장되는 책이다.

### 사용 위치

- 마이페이지의 직접 추가한 책 목록
- 책 추가 페이지 저장 결과
- 이후 독서 기록 페이지 입력 데이터

### 포함 정보

- `myBookId`
- `title`
- `author`
- `publisher`
- `coverImageUri`
- `addedAtMillis`

## 5. ReadingLog

`ReadingLog`는 대여한 책 또는 직접 추가한 책에 연결되는 독서 기록을 의미한다.

`BorrowedBook`과 `MyBook`은 서로 다른 도메인 객체지만, 독서 기록 화면에서는 `ReadingBookSource`와 `bookId` 조합으로 같은 `ReadingLogScreen`을 재사용한다.

### 사용 위치

- 독서 기록 페이지
- 마이페이지에서 책 카드 클릭 후 이동하는 기록 화면

### 포함 정보

- `readingLogId`
- `source`
- `bookId`
- `title`
- `author`
- `coverImageUri`
- `coverImageRes`
- `currentPage`
- `totalPage`
- `quote`
- `review`
- `updatedAtMillis`

## 6. 화면 이동 기준

AI 추천 도서와 대여 가능 책은 서로 다른 ID를 기준으로 이동한다.

```text
AI 추천 도서 카드 클릭
→ Book.id
→ AIGuideScreen

대여 가능 책 카드 클릭
→ RentalBook.rentalId
→ RentalDetailScreen
→ RentalRepository.getRentalBookById(rentalId)
```

마이페이지의 독서 기록 이동은 출처와 책 ID를 함께 사용한다.

```text
대여한 책 카드 클릭
→ ReadingBookSource.BORROWED + borrowedId
→ ReadingLogScreen

직접 추가한 책 카드 클릭
→ ReadingBookSource.MY_BOOK + myBookId
→ ReadingLogScreen
```

## 7. UI 컴포넌트 전달 기준

공통 UI 컴포넌트가 `Book`과 `RentalBook`을 모두 직접 알게 만들지 않는다.

책 카드처럼 여러 도메인에서 재사용되는 컴포넌트는 화면에서 `ui/model`의 `BookCardUiModel` 같은 UI 전용 모델로 변환해 전달한다.

```text
Book
→ BookCardUiModel
→ BookCard

RentalBook
→ BookCardUiModel
→ BookCard
```

이 기준을 지키면 공통 컴포넌트는 화면 표시와 클릭 콜백만 담당하고, 도메인 판단은 화면 또는 상위 계층에서 처리한다.
