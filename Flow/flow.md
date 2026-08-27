앱 실행
│
▼
initializeApp()
(FirebaseApp 생성)
│
▼
initializeAuth()
(Auth 생성)
│
▼
AsyncStorage 확인
│
┌──토큰 없음? ─────────────┐
│                         │
▼                         ▼
로그인 화면             토큰 존재
│                         │
▼                         ▼
로그인                 자동 로그인 복원(auth 객체 속 값 바뀜 -> user 세팅 완료)
│
▼
Firebase 서버
│
├── ID Token
└── Refresh Token
│
▼
AsyncStorage 저장
│
▼
앱 종료
(RAM 비움)
│
▼
앱 재실행
│
▼
initializeApp()
initializeAuth()
│
▼
AsyncStorage에서 토큰 읽음 (auth 객체 속 값 바뀜 -> user 세팅 완료)
│
▼
자동 로그인 완료