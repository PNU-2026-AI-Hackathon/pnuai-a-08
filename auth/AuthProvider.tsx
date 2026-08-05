import * as Google from "expo-auth-session/providers/google";
import { ResponseType } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Platform } from "react-native";

// 로그인 용으로 우리가 쓸려고 만든 auth 라는 이름의 객체 불러오기(firebase sdk 의 Auth 라는 타입의 객체의 인스턴스)
// 이 auth 객체가 로그인한 사용자의 상태 (currentUser , IdToken) 토큰 등을 가지고 있다
// 즉 한 사용자의 기기에서 한 앱 객체 - 한 인증 정보 객체가 딱 하나씩 존재한다고 생각하면 됨
import { auth } from "../lib/firebase";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const EXPO_GOOGLE_REDIRECT_URI =
  process.env.EXPO_PUBLIC_EXPO_GOOGLE_REDIRECT_URI;
const WEB_GOOGLE_REDIRECT_URI =
  Platform.OS === "web" ? window.location.origin : EXPO_GOOGLE_REDIRECT_URI;
const UNIVERSITY_EMAIL_SUFFIX = ".ac.kr";
export const UNIVERSITY_EMAIL_REQUIRED_ERROR =
  "UNIVERSITY_EMAIL_REQUIRED";

type AuthContextValue = { // 이게 프로젝트 전역에서 매 클럭마다 참고하는 전역 컨텍스트
  user: User | null;
  loading: boolean;

  signInWithEmail: (email: string, password: string) => Promise<void>;

  signUpWithEmail: (email: string, password: string) => Promise<void>;

  signInWithGoogle: () => Promise<void>;

  signOutUser: () => Promise<void>;

  getIdToken: () => Promise<string | null>;
};

// AuthContext 는 createContext 가 동작하면서
// ├── Provider
// ├── Consumer
// └── 내부 저장공간
// 형태의 메모리를 리턴 받는다
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

// export 가 있어야 다른 파일에서 import 가 가능
export function AuthProvider({ children }: AuthProviderProps) {
  // react 의 useState 는 어떤 상태와 그 상태를 변화시키는 함수의 쌍을 반환하는 함수
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [, , promptGoogleSignIn] = Google.useAuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri: WEB_GOOGLE_REDIRECT_URI,
    responseType: ResponseType.IdToken,
    scopes: ["openid", "profile", "email"],
    selectAccount: true,
  });

  // auth 객체를 감시하다가 state 가 바뀌면 바뀐 currentUser 값을 넣은 setUser 을 실행해서 , 전역 user 값을 바꾼다
  //"AuthProvider가 처음 생성되면(앱을 킬때마다 AuthProvider 렌더링 됨 -> 내가 app 폴더 속 파일들을 그렇게 만들거라서) AuthProvider가 사라질 때는 감시를 해제한다."
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      currentUser => {
        setUser(currentUser);
        setLoading(false);
      },
      error => {
        console.error("인증 상태 확인 실패:", error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // 인자를 2개 받아서 signInWithEmailAndPassword 이 동작을 하는 한 결과를 반환하는 비동기 함수 선언
  // const 를 그냥 쓰면 상수 저장 , const 이름 = {}면 객체/ = () => {} 또는 = function() {} 면 함수를 정의 in typescript
  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(
      auth, // 어떤 firebase app 으로 보낼건지 적어주고
      email.trim(),
      password
    );
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  };

  // 기존 email/password 로그인은 앱이 Firebase Auth API에 email/password를 바로 전송하는 방식이었다.
  // Google 로그인은 expo-auth-session이 Google 로그인 창을 열고, redirect로 받은 id token을 런타임에 돌려준다.
  // Expo Go에서는 Expo Go 런타임이 이 redirect를 받아 현재 개발 중인 앱 세션으로 전달한다.
  // dev-client/standalone에서는 설치된 우리 앱의 scheme/deep link가 redirect를 직접 받아 앱 코드로 전달한다.
  // 앱은 id token을 Firebase Google credential로 바꾼 뒤 signInWithCredential()로 Firebase Auth에 로그인한다.
  // Firebase Google 로그인의 경우 처음 쓰는 Google 계정이면 자동으로 회원가입되고, 기존 계정이면 로그인된다.
  // 클라이언트 검사는 보안 장벽은 아니지만, 지금은 .ac.kr 학교 이메일이 아니면 즉시 로그아웃시켜 앱 진입을 막는다.
  // 이 방식은 Firebase Auth 계정 생성 자체를 막지는 못하므로, Firestore를 붙이면 Security Rules에서도 .ac.kr 검사를 한 번 더 해야 한다.
  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      throw new Error("Missing EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.");
    }

    if (!WEB_GOOGLE_REDIRECT_URI) {
      throw new Error("Missing Google redirect URI.");
    }

    const result = await promptGoogleSignIn();

    if (result.type !== "success") {
      throw new Error("Google sign-in was cancelled.");
    }

    const idToken = result.params.id_token;

    if (!idToken) {
      throw new Error("Google did not return an id token.");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    const email = userCredential.user.email?.toLowerCase();

    if (!email?.endsWith(UNIVERSITY_EMAIL_SUFFIX)) {
      await signOut(auth);
      throw new Error(UNIVERSITY_EMAIL_REQUIRED_ERROR);
    }
  };

  const signOutUser = async () => {
    await signOut(auth);
  };

  const getIdToken = async () => {
    if (!auth.currentUser) {
      return null;
    }

    return auth.currentUser.getIdToken();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      signOutUser,
      getIdToken,
    }),
    [user, loading, promptGoogleSignIn]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
  // ui 별 파일을 보면 AuthProvider 로 감싸는 형태인 이유가 ,
  // 함수 컴포넌트 AuthProvider 이 AuthContext 라는 맥락 주입 호스를 통해서 모든 그 자신이 감싸고 있는
  // 특정 ui컴포넌트(ui 별 파일!)에 전역 맥락을 공급하기 위한 것!
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth는 AuthProvider 내부에서 사용해야 합니다."
    );
  }

  return context;
}
