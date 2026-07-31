// lib/firebase.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from "@firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Expo의 Fast Refresh 때문에 Firebase 앱이 중복 초기화되는 것을 방지한다.
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// React Native에서는 AsyncStorage를 사용하여 로그인 세션을 유지한다.
// AsyncStorage : 앱을 껐다 켜도 데이터를 저장하는 저장소이다, 여기에 저장된 로그인 세션을 통해 자동 로그인을 유지
export const auth = (() => {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh 등으로 Auth가 이미 초기화되어 있으면 기존 인스턴스를 사용한다.
    return getAuth(firebaseApp);
  }
})();

// 위쪽 : Auth 객체가 아직 없을 때 새로 초기화하는 코드다. 이때 AsyncStorage를 로그인 정보 저장소로 연결한다.
// 아래쪽은 Fast Refresh 때문에 Auth 객체가 이미 RAM에 만들어져 있어서 initializeAuth()가 실패했을 때 기존 Auth 객체를 가져오는 코드다.
// auth 객체는 그냥 app 과 기기 속 storage 를 연결해서 만든 객체일 뿐 추가적인 token 처리는 추후 다른 코드로 처리함
// 일단 그 코드를 적용할 대상인 객체부터 만들어 놓은 것

// 앱이 실행되면 .env의 Firebase 설정값으로 RAM에 FirebaseApp 객체를 만들고, 이어서 Auth 객체를 만든다.
// 개발 중 Fast Refresh로 같은 코드가 다시 실행될 수 있으므로, 이미 객체가 있으면 새로 만들지 않고 기존 객체를 가져다 쓴다.
// -> getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
// 사용자가 로그인하면 Firebase가 ID 토큰과 Refresh 토큰을 발급하고, Firebase SDK가 이를 기기의 AsyncStorage(ram 이 아닌 ssd에)에 저장한다.
// 앱을 종료하면 RAM의 FirebaseApp과 Auth 객체는 사라지지만 AsyncStorage의 로그인 정보는 남는다.(디스크니까)
// 다음에 앱을 실행하면 객체들을 다시 만든 뒤 디스크의 저장된 로그인 정보를 읽어 자동으로 로그인 상태를 복원한다.
// ID 토큰이 만료되면 Refresh 토큰으로 새 ID 토큰을 자동 발급받으며(id token 은 약 1시간),
//  로그아웃하거나 앱 데이터 또는 앱 자체를 삭제하면 로그인 정보가 사라진다.(storage 상의 정보들이 영구히 삭제)
