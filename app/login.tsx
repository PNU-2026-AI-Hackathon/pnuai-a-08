import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  UNIVERSITY_EMAIL_REQUIRED_ERROR,
  useAuth,
} from "@/auth/AuthProvider";
import { colors, radius, spacing, typography } from "@/constants/theme";

export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setSubmitting(true);

    try {
      await signInWithGoogle();
      router.replace("/(tabs)/home");
    } catch (error) {
      console.error("Google sign-in failed:", error);
      if (
        error instanceof Error &&
        error.message === UNIVERSITY_EMAIL_REQUIRED_ERROR
      ) {
        setError("대학교 이메일(.ac.kr) 계정으로만 이용할 수 있습니다.");
        return;
      }

      setError("Google 로그인에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>로그인</Text>
          <Text style={styles.subtitle}>Google 계정으로 서로서가를 시작하세요.</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={handleGoogleLogin}
            style={({ pressed }) => [
              styles.button,
              (pressed || submitting) && styles.buttonPressed,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.buttonText}>Google로 로그인</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    fontSize: typography.greeting,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.body,
    marginTop: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    color: "#B3261E",
    fontSize: typography.caption,
    fontWeight: "600",
  },
  button: {
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    backgroundColor: colors.accent,
    marginTop: spacing.sm,
  },
  buttonPressed: {
    opacity: 0.65,
  },
  buttonText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "800",
  },
});
