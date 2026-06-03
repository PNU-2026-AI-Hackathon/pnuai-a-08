# 프로젝트 파일 배치 및 역할 분리 규칙

## 1. 기본 원칙

프로젝트는 화면(UI), 데이터, 이동 로직의 역할을 분리한다. 각 파일은 자신의 책임만 가진다.

## 2. 기준 디렉터리 구조

```text
app/src/main/java/com/example/seoroseoga/

├── ui/
│   ├── screen/
│   │   ├── home/
│   │   │   └── HomeScreen.kt
│   │   ├── aiguide/
│   │   │   └── AIGuideScreen.kt
│   │   ├── rentaldetail/
│   │   │   └── RentalDetailScreen.kt
│   │   ├── chat/
│   │   │   └── ChatScreen.kt
│   │   ├── mypage/
│   │   │   └── MyPageScreen.kt
│   │   ├── bookadd/
│   │   │   └── AddBookScreen.kt
│   │   ├── readinglog/
│   │   │   └── ReadingLogScreen.kt
│   │   └── bookregister/
│   │       └── BookRegisterScreen.kt
│   ├── component/
│   │   ├── BookCard.kt
│   │   ├── SectionHeader.kt
│   │   ├── TopHeader.kt
│   │   └── BottomNavigationBar.kt
│   └── model/
│       └── BookCardUiModel.kt
├── data/
│   ├── model/
│   │   └── Book.kt
│   ├── repository/
│   │   └── BookRepository.kt
│   ├── local/
│   │   ├── BookLocalDataSource.kt
│   │   └── db/
│   │       └── JsonFileStore.kt
│   └── remote/
│       └── AIService.kt
├── navigation/
│   └── ActivityNavigator.kt
└── docs/
    └── page_interactions.md
```

## 3. 각 계층의 역할

| 경로 | 역할 |
| --- | --- |
| `MainActivity.kt` | 앱 진입점, `setContent`, 앱 루트 Composable 호출 |
| 앱 루트 Composable | Theme, Navigation Host, 전역 Scaffold 같은 최상위 조립 |
| `ui/screen` | 화면 전체 UI 및 화면 단위 상태 처리 |
| `ui/component` | 여러 화면에서 재사용 가능한 UI 컴포넌트 |
| `ui/model` | 화면 표시를 위한 UI 전용 모델 |
| `data/model` | `Book`, `ChatMessage` 같은 데이터 모델 정의 |
| `data/repository` | 화면이 사용할 데이터 제공 및 DB/API/local 데이터 접근 통합 |
| `data/local` | local 목(mock) 데이터, JSON, Room DB 접근 처리 |
| `data/local/db` | 앱 내부 JSON 파일 저장 유틸 |
| `data/remote` | API 통신 처리 |
| `navigation` | 화면 이동 처리 |
| `docs/page_interactions.md` | 프로젝트 화면 이동 흐름 기록 |

### `MainActivity`와 앱 루트 책임

- `MainActivity`는 앱 진입점으로 유지한다.
- `MainActivity`는 `setContent`, 앱 루트 Composable 호출, 아주 얕은 의존성 생성 또는 전달만 담당한다.
- 화면 UI, 재사용 컴포넌트, 데이터 모델, 목(mock) 데이터 목록, 화면 이동 세부 로직은 `MainActivity`에 두지 않는다.
- 앱 루트 Composable은 Theme, Navigation Host, 전역 Scaffold처럼 앱 전체를 조립하는 역할만 담당한다.
- 개별 화면 UI는 `ui/screen/...` 아래의 `Screen` 파일에서 구현한다.

### 목(mock) 데이터 위치

- 화면에 표시할 목(mock) 데이터도 `Screen` 또는 `Composable` 내부에 직접 하드코딩하지 않는다.
- 로컬 샘플 데이터는 `data/local`에 두고, 화면은 `data/repository`를 통해 전달받는다.
- 데이터 형태는 `data/model`에 정의한다.
- Compose Preview만을 위한 샘플 데이터는 Preview 전용 함수나 파일로 분리할 수 있다.

### 컴포넌트 분리 기준

- 두 개 이상의 화면에서 재사용될 가능성이 있는 UI는 `ui/component`로 분리한다.
- 한 화면에서만 쓰이더라도 화면 파일을 과도하게 길게 만들거나 책임을 흐리게 하는 UI 블록은 분리한다.
- 특정 화면에 강하게 종속된 작은 UI 조각은 해당 화면 패키지 내부에 둘 수 있다.
- 공통 컴포넌트는 화면 이동이나 데이터 로딩을 직접 수행하지 않고, 클릭 콜백과 표시할 데이터만 전달받는다.

### Repository 생성과 상태 관리 기준

- 단순 목 데이터 단계에서는 `MainActivity` 또는 앱 루트에서 Repository를 생성해 화면에 값을 전달할 수 있다.
- 화면 상태가 여러 UI와 연결되거나 저장·로드·비동기 처리가 필요하면 `ViewModel` 도입을 검토한다.
- 여러 화면에서 같은 Repository나 상태를 공유해야 하면 DI 또는 앱 단위 의존성 제공 구조를 검토한다.
- `Composable` 내부에서 DB/API/local data source를 직접 호출하지 않는다.

## 4. 예시 동작 파이프라인: 홈 화면에서 AI 추천 도서 클릭

### 사용자 관점 흐름

```text
사용자
→ HomeScreen의 BookCard 클릭
→ ActivityNavigator 호출
→ AIGuideScreen 이동
→ selectedBookId 전달
→ BookRepository에서 책 데이터 조회
→ 화면에 데이터 표시
```

### 파일 관점 흐름

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

## 5. 기존 구조 확인 우선 규칙

위 구조는 기준 구조다. 에이전트는 구현 전에 실제 프로젝트의 파일과 내비게이션 구조를 확인한다.

- 기존 파일이 이미 동일 책임을 담당하면 새 파일을 중복 생성하지 않는다.
- 기존 프로젝트가 `ActivityNavigator` 외의 화면 이동 구조를 이미 사용하고 있다면, 그 구조를 우선 유지한다.
- 구조 변경이 반드시 필요하다고 판단되면 임의로 변경하지 않고 작업 계획에 이유와 영향 범위를 먼저 적는다.
