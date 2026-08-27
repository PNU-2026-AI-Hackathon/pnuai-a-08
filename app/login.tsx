import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import {
  UNIVERSITY_EMAIL_REQUIRED_ERROR,
  useAuth,
} from "@/auth/AuthProvider";

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { continueAsGuest, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<"google" | "guest" | null>(null);
  const actionWidth = Math.min(332, width - 48);

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting("google");

    try {
      await signInWithGoogle();
      router.replace("/(tabs)/home");
    } catch (loginError) {
      console.error("Google sign-in failed:", loginError);
      if (
        loginError instanceof Error &&
        loginError.message === UNIVERSITY_EMAIL_REQUIRED_ERROR
      ) {
        setError("부산대학교 메일 계정으로만 이용할 수 있어요.");
        return;
      }
      setError("Google 로그인에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(null);
    }
  };

  const handleGuestLogin = async () => {
    setError("");
    setSubmitting("guest");

    try {
      await continueAsGuest();
      router.replace("/(tabs)/home");
    } catch (guestError) {
      console.error("Guest session failed:", guestError);
      setError("로그인 없이 시작하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(175,208,0,0.52)",
          "rgba(227,255,83,0.38)",
          "rgba(247,255,203,0.16)",
          "rgba(255,255,255,0)",
        ]}
        locations={[0, 0.35, 0.7, 1]}
        style={[styles.topGlow, { height: Math.max(390, height * 0.48) }]}
      />

      <View style={[styles.brand, { top: height * 0.39 }]}>
        <Image
          source={require("../assets/login/seoroseoga-wordmark.png")}
          style={styles.wordmark}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="서로서가"
        />
        <Text style={styles.tagline}>책으로 이어지는 우리</Text>
      </View>

      <View
        style={[
          styles.actions,
          {
            width: actionWidth,
            bottom: Math.max(28, insets.bottom + 12),
          },
        ]}
      >
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="부산대학교 메일로 로그인"
          disabled={submitting !== null}
          onPress={handleGoogleLogin}
          style={({ pressed }) => [
            styles.loginButton,
            (pressed || submitting !== null) && styles.pressed,
          ]}
        >
          <LinearGradient
            pointerEvents="none"
            colors={["#D0D9A0", "#C0DA3B"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Image
            source={require("../assets/login/pnu-seal-small.png")}
            style={styles.universitySeal}
            resizeMode="contain"
          />
          {submitting === "google" ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginButtonText}>부산대학교 메일로 로그인</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="로그인 없이 사용"
          disabled={submitting !== null}
          onPress={handleGuestLogin}
          hitSlop={8}
          style={({ pressed }) => [styles.guestButton, pressed && styles.pressed]}
        >
          {submitting === "guest" ? (
            <ActivityIndicator size="small" color="#5D442D" />
          ) : (
            <Text style={styles.guestButtonText}>로그인 없이 사용</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  topGlow: {
    position: "absolute",
    top: -20,
    left: -30,
    right: -30,
  },
  brand: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  wordmark: {
    width: 182.49,
    height: 38.71,
  },
  tagline: {
    marginTop: 17,
    color: "#5D442D",
    fontSize: 15,
    lineHeight: 26,
    fontWeight: "500",
    textAlign: "center",
  },
  actions: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
  },
  error: {
    marginBottom: 10,
    paddingHorizontal: 8,
    color: "#A63F36",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  loginButton: {
    width: "100%",
    height: 47,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13.3,
  },
  universitySeal: {
    position: "absolute",
    left: 9,
    top: 2,
    width: 42,
    height: 42,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  guestButton: {
    minHeight: 36,
    minWidth: 150,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  guestButtonText: {
    color: "#5D442D",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  pressed: {
    opacity: 0.62,
  },
});
