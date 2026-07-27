# 평가 기준 충족 코드 정리

이 문서는 프로젝트가 평가 기준의 각 항목을 어떤 코드에서 어떻게 충족하는지 정리한 자료입니다.

## Activity 3개 이상 및 Activity 간 Intent 데이터 전달

`seoroseoga_3_activities` 복사본은 기존 단일 Activity + Compose 내부 라우팅 구조를 최대한 유지하면서, 평가 기준 충족을 위해 주요 흐름 일부를 실제 Activity로 분리했다.

### Activity 3개 이상

Manifest에 4개의 Activity가 등록되어 있어 3개 이상 조건을 충족한다.

- `app/src/main/AndroidManifest.xml:19`
  - `ChatActivity`
- `app/src/main/AndroidManifest.xml:22`
  - `ParticipateActivity`
- `app/src/main/AndroidManifest.xml:25`
  - `MeetRegActivity`
- `app/src/main/AndroidManifest.xml:28`
  - `MainActivityBySh`

각 Activity 클래스 위치:

- `app/src/main/java/com/example/seoroseoga/sh/MainActivityBySh.kt:41`
  - 홈, 마이페이지, AI 가이드, 내 서재 등 기존 Compose 라우팅 중심 Activity
- `app/src/main/java/com/example/seoroseoga/sh/MeetRegActivity.kt:14`
  - 모임 만들기 화면 Activity
- `app/src/main/java/com/example/seoroseoga/sh/ParticipateActivity.kt:19`
  - 모임 참가 신청/상세 Activity
- `app/src/main/java/com/example/seoroseoga/sh/ChatActivity.kt:10`
  - 모임 채팅방 Activity

### 최소 2개 Activity 간 Intent 데이터 전달

1. `MainActivityBySh -> ParticipateActivity`
   - `app/src/main/java/com/example/seoroseoga/sh/MainActivityBySh.kt:176`-`178`
   - 홈의 모임 카드 클릭 시 `Intent(context, ParticipateActivity::class.java)`로 이동한다.
   - `putExtra(ParticipateActivity.EXTRA_MEETING_ID, it.meetingId)`로 `meetingId`를 전달한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ParticipateActivity.kt:23`
   - `intent.getStringExtra(EXTRA_MEETING_ID)`로 전달받은 `meetingId`를 읽어 Firestore에서 모임 상세를 조회한다.

2. `ParticipateActivity -> ChatActivity`
   - `app/src/main/java/com/example/seoroseoga/sh/ParticipateActivity.kt:53`-`54`
   - 참가 신청 성공 후 `Intent(this@ParticipateActivity, ChatActivity::class.java)`로 채팅방 Activity를 실행한다.
   - `putExtra(ChatActivity.EXTRA_CHAT_ROOM_ID, chatRoomId)`로 `chatRoomId`를 전달한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ChatActivity.kt:14`
   - `intent.getStringExtra(EXTRA_CHAT_ROOM_ID)`로 전달받은 `chatRoomId`를 읽어 해당 채팅방 메시지를 표시한다.

3. `MainActivityBySh -> ChatActivity`
   - `app/src/main/java/com/example/seoroseoga/sh/MainActivityBySh.kt:268`-`270`
   - 마이페이지의 참여 모임 상세에서 채팅방 입장 시 `ChatActivity`로 이동한다.
   - `putExtra(ChatActivity.EXTRA_CHAT_ROOM_ID, chatRoomId)`로 `chatRoomId`를 전달한다.

## Coroutine

Coroutine은 네트워크, OCR, DB 작업을 UI 스레드 밖에서 처리하기 위해 사용한다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:196`, `Screens.kt:273`, `Screens.kt:320`
  - `scope.launch { ... }`로 OCR, Google Books 검색, 카카오 장소 검색을 비동기로 실행한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:33`, `BookRecognitionModule.kt:60`
  - `withContext(Dispatchers.IO)`로 OCR 처리와 Google Books API 호출을 IO 스레드에서 실행한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/KakaoLocalModule.kt:15`
  - 카카오 Local API 호출을 `withContext(Dispatchers.IO)`에서 처리한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/GeminiChatModule.kt:16`
  - Gemini API 호출을 `withContext(Dispatchers.IO)`에서 처리한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:55`, `MeetingRepository.kt:108`, `MeetingRepository.kt:145`, `MeetingRepository.kt:185`
  - Firebase Task를 `await()`로 코루틴 기반 처리한다.

## 다운로드 매니저

Android `DownloadManager`를 사용해 책 표지를 사용자 기기에 다운로드한다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1288`
  - `downloadBookCoverOnce()`에서 책 표지를 다운로드하고, 이미 저장된 파일이 있으면 재다운로드하지 않는다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1294`
  - `context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager`로 시스템 다운로드 매니저를 가져온다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1315`
  - `DownloadManager.Request(Uri.parse(imageUrl))`로 표지 다운로드 요청을 만든다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1341`
  - `DownloadManager.Query()`로 다운로드 상태를 조회한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:100`
  - 모임 생성 시 책 후보 선택 후 표지 이미지를 `DownloadManager.Request`로 다운로드하는 기존 흐름도 존재한다.

## Jetpack

Jetpack Compose 및 Jetpack 계열 라이브러리를 사용한다. 평가 기준의 "3개 이상 활용" 조건도 충족한다.

1. **Jetpack Compose UI**
   - `app/build.gradle.kts:84`-`91`
     - Compose BOM, Compose UI, Foundation, Material3, Material Icons를 의존성으로 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:116`, `Screens.kt:455`, `Screens.kt:992`
     - `Scaffold`로 홈, 채팅, AI 챗봇 화면의 구조를 구성한다.

2. **Compose Lazy UI**
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:117`, `Screens.kt:247`, `Screens.kt:459`, `Screens.kt:997`
     - `LazyColumn`으로 홈 목록, 모임 등록 폼, 채팅 메시지, AI 메시지 목록을 구성한다.

3. **Material3 컴포넌트**
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:209`, `Screens.kt:225`
     - `DatePickerDialog`, `DatePicker`를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:243`
     - `TimePicker`를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:834`
     - `LinearProgressIndicator`로 독서 진행률을 표시한다.

4. **Activity Result API**
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:191`, `Screens.kt:537`
     - `rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument())`로 갤러리/문서 이미지 선택을 구현한다.

5. **Activity Compose**
   - `app/build.gradle.kts:85`
     - `androidx.activity:activity-compose`를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/MainActivityBySh.kt:5`
     - `setContent`로 Compose UI를 Activity에 연결한다.

## 외부 APP 연동

외부 앱과의 상호작용을 구현한다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:191`
  - 모임 생성 화면에서 `ActivityResultContracts.OpenDocument()`로 외부 갤러리/파일 선택 앱을 연동한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:537`
  - 내 책 등록 화면에서도 `ActivityResultContracts.OpenDocument()`로 외부 이미지 선택 앱을 연동한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1142`
  - `Intent(Intent.ACTION_VIEW, Uri.parse(mapUrl))`로 카카오맵 링크를 외부 지도 앱 또는 브라우저에서 연다.

## DB

Firebase Firestore를 내부/외부 Database로 사용한다.

- `app/build.gradle.kts:93`, `app/build.gradle.kts:94`
  - Firebase BOM과 Firestore 의존성을 사용한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:14`
  - `FirebaseFirestore.getInstance()`로 Firestore 인스턴스를 생성한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:20`
  - `meetings` 컬렉션을 실시간 리스너로 구독한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:37`
  - 사용자가 참가한 모임을 `whereArrayContains("participantIds", ...)`로 조회한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:60`
  - `createMeeting()`에서 `meetings`, `chatRooms` 문서를 Batch로 생성한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:113`
  - `joinMeeting()`에서 Firestore transaction으로 참가자 수와 상태를 갱신한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:150`, `MeetingRepository.kt:164`
  - 채팅 메시지를 Firestore subcollection으로 실시간 조회 및 저장한다.

## API

외부 API는 3개 이상 사용한다. 평가 기준의 "개수에 따른 점수"에서 3개 이상 조건을 충족한다.

1. **Kakao Local API**
   - `app/src/main/java/com/example/seoroseoga/sh/data/KakaoLocalModule.kt:15`
     - `searchPlaces()`에서 장소 검색 API를 호출한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/KakaoLocalModule.kt:22`
     - `https://dapi.kakao.com/v2/local/search/keyword.json` 엔드포인트를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/KakaoLocalModule.kt:29`
     - `Authorization: KakaoAK ...` 헤더를 설정한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:321`
     - 모임 생성 화면에서 카카오 장소 검색을 호출한다.

2. **Google Books API**
   - `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:60`
     - `searchBooksByTitle()`에서 책 검색 API를 호출한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:66`
     - `https://www.googleapis.com/books/v1/volumes` 엔드포인트를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:85`
     - API 응답에서 제목, 저자, 출판사, 페이지 수, 표지 이미지, 설명, ISBN을 파싱한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:274`, `Screens.kt:580`
     - 모임 생성과 내 책 등록 화면에서 Google Books 검색을 재사용한다.

3. **Gemini API**
   - `app/src/main/java/com/example/seoroseoga/sh/data/GeminiChatModule.kt:16`
     - `sendMessage()`에서 AI 챗봇 응답을 요청한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/GeminiChatModule.kt:52`
     - `https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent` 엔드포인트를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1028`
     - AI 채팅 화면에서 Gemini API 호출을 실행한다.

4. **Firebase Firestore API**
   - DB 항목으로도 평가 가능하지만, 외부 Google 서비스 API 연동 관점에서도 Firestore SDK를 사용한다.
   - `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:20`, `MeetingRepository.kt:60`, `MeetingRepository.kt:150`
     - 모임 목록, 모임 생성, 채팅 메시지 실시간 동기화에 사용한다.

## 머신러닝

ML Kit 한국어 OCR 모델을 활용해 책 사진에서 제목 후보를 추출한다.

- `app/build.gradle.kts:96`
  - `com.google.mlkit:text-recognition-korean` 의존성을 사용한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:23`, `BookRecognitionModule.kt:35`
  - `TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())`로 한국어 OCR 인식기를 생성한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:24`, `BookRecognitionModule.kt:36`
  - `recognizer.process(image).await()`로 이미지 OCR을 실행한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/BookRecognitionModule.kt:33`
  - `extractBookTitleCandidatesFromImage()`에서 OCR 결과를 후보 제목 리스트로 정리한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:197`, `Screens.kt:549`
  - 모임 생성과 내 책 등록 화면에서 OCR 기능을 사용한다.

## 심미성

Compose 기반의 통일된 색상, 카드, 탭, 하단바, 진행률 UI를 사용한다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:98`-`101`
  - `Olive`, `Pale`, `Ink` 색상 토큰을 정의해 화면 전반에서 재사용한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:715`
  - 마이페이지 탭을 선택 상태에 따라 색상으로 구분한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:744`, `Screens.kt:762`
  - 내 서재 책 목록을 카드 형태로 표시한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:823`
  - 독서 진행률 섹션을 카드와 `LinearProgressIndicator`로 구성한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1124`
  - 지도 프리뷰를 앱 내부 스타일에 맞는 카드형 UI로 제공한다.

## 안정성

비정상 종료와 무한 반복 가능성을 줄이기 위한 방어 코드가 있다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1124`
  - 지도 프리뷰에서 WebView를 제거하고 외부 지도 Intent로 열어 무한 로드/앱 멈춤 가능성을 줄였다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1141`
  - 지도 앱 열기는 `runCatching`으로 감싸 외부 앱 호출 실패 시 크래시를 방지한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1288`
  - 책 표지는 URL 해시 기반 파일명으로 1회 다운로드 후 재사용한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:1301`, `Screens.kt:1306`, `Screens.kt:1328`, `Screens.kt:1331`
  - `DownloadManager` 상태가 성공/실패인지 확인하고 실패 시 재시도 가능하도록 저장된 ID를 제거한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/KakaoLocalModule.kt:16`, `BookRecognitionModule.kt:61`, `GeminiChatModule.kt:20`
  - 빈 검색어/질문은 API 호출 전에 차단한다.
- `app/src/main/java/com/example/seoroseoga/sh/data/MeetingRepository.kt:113`
  - 참가 신청은 Firestore transaction으로 처리해 동시 참가 시 참가자 수와 상태가 꼬일 가능성을 줄인다.

## 완성도

앱의 주요 사용자 흐름이 연결되어 있다.

- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:116`
  - 홈 화면에서 모임 목록과 AI 독서 가이드 진입을 제공한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:150`
  - 모임 생성 화면에서 OCR, Google Books API, 카카오 장소 검색, 날짜/시간 선택, Firestore 저장 입력을 제공한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:405`
  - 모임 참가 신청 화면을 제공한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:436`
  - 모임 채팅 화면을 제공한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:476`
  - 마이페이지에서 참가신청한 모임과 내 서재 탭을 제공한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:508`
  - 내 책 등록 화면에서 OCR 및 Google Books API를 재사용한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:639`
  - 독서기록 화면에서 페이지, 진행률, 문장, 감상을 기록한다.
- `app/src/main/java/com/example/seoroseoga/sh/ui/Screens.kt:948`, `Screens.kt:992`
  - AI 독서 가이드와 AI 챗봇 화면을 제공한다.
