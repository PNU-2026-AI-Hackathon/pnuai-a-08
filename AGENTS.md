# Codex 작업 메모

## 먼저 볼 것: Android 개발 빌드 순서

팀원이 pull 받은 뒤 Android development build가 필요하면 아래 순서대로 진행합니다.

1. 패키지를 설치합니다.

```bash
npm install
```

2. Expo에 로그인합니다.

```bash
npx.cmd eas-cli login
```

팀원은 새 Expo 계정을 만들지 말고, 승한님이 보내신 Expo 로그인용 아이디와 패스워드를 사용해야 합니다. 새 계정으로 로그인하면 이 프로젝트의 EAS project, managed keystore, build credentials에 접근할 수 없습니다.
반드시 "승한님이 보내신 Expo 로그인용 아이디와 패스워드를 사용하세요" 라고 고지할 것

3. Android development APK를 빌드합니다.

```bash
npx.cmd --yes eas-cli build --platform android --profile development
```

4. 빌드가 끝나면 터미널에 아래와 비슷한 EAS 설치 링크가 출력됩니다.

```text
Open this link on your Android devices (or scan the QR code) to install the app:
https://expo.dev/accounts/.../projects/.../builds/...
```

해당 링크를 클릭합니다. 페이지에서 Orbit 설치 버튼을 선택해 APK를 폰에 설치합니다. PC에 Orbit이 설치되어 있지 않다면 먼저 Orbit을 설치합니다. 그 다음 폰과 컴퓨터를 USB-C to USB-C 케이블로 연결하고, Orbit을 통해 APK를 폰에 바로 설치합니다.

5. 설치된 앱을 대상으로 Metro를 실행합니다.

```bash
npm run start:dev-client
```

6. 폰에서는 Expo Go가 아니라 설치된 `seoroseoga` 앱을 엽니다.

팀원이 native 설정 변경 여부를 구분하기 어려워하면 그냥 위 순서대로 새 APK를 빌드하고 설치하게 안내합니다.
Codex 에이전트는 변경 내용을 보고 새 EAS build가 필요한지, 아니면 `npm run start:dev-client`만 다시 실행하면 되는지 판단해서 개발자에게 명확히 안내해야 합니다.

## 언제 다시 빌드해야 하나

아래 항목이 바뀌면 새 development APK를 빌드해야 합니다.

- native dependency 추가/삭제
- Expo config plugin 추가/삭제
- `app.json`
- `eas.json`
- `google-services.json`
- Android package name
- app scheme
- Expo SDK 또는 native dependency

JS/TS 화면 코드만 바뀐 경우에는 보통 새 APK 빌드가 필요 없고, 아래 명령으로 Metro만 다시 켜면 됩니다.

```bash
npm run start:dev-client
```

Codex 에이전트는 사용자가 변경한 파일과 설치한 패키지를 확인한 뒤, 새 APK 빌드가 필요한지 또는 dev-client Metro 재실행만 필요한지 먼저 판단해서 말해야 합니다.

## 현재 앱 실행 방식

- 이 프로젝트는 Expo SDK 54와 Expo Router를 사용하는 Expo React Native 앱입니다.
- Google 로그인 테스트는 더 이상 Expo Go 기준으로 진행하지 않습니다.
- Android 테스트는 EAS development build APK와 `expo-dev-client` 기준으로 진행합니다.
- development build APK는 네이티브 앱 껍데기이고, JS 코드는 Metro에서 받아 실행합니다.

## EAS 프로젝트 정보

- EAS project owner: `seoroseoga_project`
- Android package: `com.seoroseoga.app`
- EAS project id는 `app.json`의 `expo.extra.eas.projectId`에 저장되어 있습니다.
- Android development APK 빌드 프로필은 `eas.json`에 정의되어 있습니다.
- EAS managed keystore를 사용합니다. keystore를 로컬에서 새로 만들거나 교체하지 마세요.

## Google 로그인 구조

- Google 로그인은 `@react-native-google-signin/google-signin` 기반 native Google Sign-In을 사용합니다.
- Android Google 로그인에 Expo Go/AuthSession redirect 방식을 다시 도입하지 마세요.
- `expo-auth-session`으로 `seoroseoga://` 같은 custom scheme redirect를 시도했지만 Google Web OAuth에서 `400 invalid_request`로 거부되었습니다.
- 현재 로그인 흐름은 아래와 같습니다.

```text
GoogleSignin.signIn()
→ idToken 획득
→ GoogleAuthProvider.credential(idToken)
→ signInWithCredential(auth, credential)
→ .ac.kr 이메일 검사
```

- `google-services.json`은 프로젝트 루트에 있어야 하며, `app.json`에서 아래처럼 참조합니다.

```json
"android": {
  "googleServicesFile": "./google-services.json"
}
```

- Firebase Android 앱의 package name은 반드시 `com.seoroseoga.app`이어야 합니다.
- EAS managed Android keystore의 SHA-1, SHA-256 fingerprint가 Firebase Android 앱에 등록되어 있어야 합니다.
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`는 `GoogleSignin.configure`에서 계속 사용합니다.
- `EXPO_PUBLIC_EXPO_GOOGLE_REDIRECT_URI`는 더 이상 사용하지 않습니다.

## 의존성 주의

- `@firebase/auth`를 루트 dependency로 직접 추가하지 마세요.
- Firebase Auth import는 `firebase/auth`에서 가져옵니다.
- 과거 EAS 빌드가 `npm ci --include=dev` 단계에서 실패한 적이 있습니다.
- 원인은 직접 추가된 `@firebase/auth`와 `@react-native-async-storage/async-storage@2.2.0` 사이의 peer dependency 충돌이었습니다.
- 의존성이 바뀐 뒤 EAS 빌드 전에 가능하면 아래 명령으로 확인합니다.

```bash
npm install
npm run typecheck
```
