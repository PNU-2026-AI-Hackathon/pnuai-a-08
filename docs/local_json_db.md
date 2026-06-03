# 로컬 JSON DB 기준

## 1. 목적

현재 프로젝트는 Firebase나 서버 DB를 붙이기 전까지 앱 내부 저장소에 JSON 파일을 저장해 local DB처럼 사용한다.

이 방식은 실제 원격 DB가 아니며, Android 앱 실행 중 프로젝트 소스 디렉터리에 파일을 쓰는 방식도 아니다.

## 2. 저장 위치

앱 실행 시 다음 앱 내부 저장소 경로에 JSON 파일이 생성된다.

```text
filesDir/seoroseoga_db/
```

현재 사용 파일:

```text
seoroseoga_db/chat_db.json
seoroseoga_db/borrowed_books_db.json
seoroseoga_db/my_books_db.json
seoroseoga_db/reading_logs_db.json
```

앱 내부 저장소이므로 일반 프로젝트 파일 탐색기에는 바로 보이지 않는다. 에뮬레이터 또는 기기 내부 앱 데이터 영역에 저장된다.

## 3. 현재 저장 대상

### `chat_db.json`

- `ChatRoom`
- `ChatMessage`

### `borrowed_books_db.json`

- `BorrowedBook`
- 대여 완료 시점의 `RentalBook` 스냅샷

### `my_books_db.json`

- `MyBook`
- 사용자가 직접 추가한 책 정보
- 갤러리에서 선택한 표지 이미지 URI

### `reading_logs_db.json`

- `ReadingLog`
- 현재 페이지와 전체 페이지
- 기억에 남는 문장
- 나의 감상

## 4. 구현 기준

- `Screen` 또는 `Composable`은 JSON 파일을 직접 읽거나 쓰지 않는다.
- 화면은 Repository만 호출한다.
- Repository는 local data source를 통해 JSON 파일에 접근한다.
- 나중에 Firebase, Room, 서버 API로 전환할 때는 Repository 아래 data source 구현을 교체한다.

현재 흐름:

```text
ChatScreen
→ ChatRepository
→ ChatLocalDataSource
→ JsonFileStore
→ filesDir/seoroseoga_db/chat_db.json

ChatScreen 합의 완료
→ BorrowedBookRepository
→ BorrowedBookLocalDataSource
→ JsonFileStore
→ filesDir/seoroseoga_db/borrowed_books_db.json

AddBookScreen 저장
→ MyBookRepository
→ MyBookLocalDataSource
→ JsonFileStore
→ filesDir/seoroseoga_db/my_books_db.json

ReadingLogScreen 저장
→ ReadingLogRepository
→ ReadingLogLocalDataSource
→ JsonFileStore
→ filesDir/seoroseoga_db/reading_logs_db.json
```

## 5. 주의 사항

- 앱 삭제 또는 앱 데이터 삭제 시 JSON DB도 삭제된다.
- 갤러리 표지 이미지는 URI 문자열로 저장한다.
- 현재 구조는 개발 단계의 local DB이며, 동시성이나 대용량 데이터 처리를 목표로 하지 않는다.
- 여러 화면이 동시에 같은 파일을 빈번하게 수정해야 하는 단계가 되면 Room 또는 Firebase 전환을 검토한다.
