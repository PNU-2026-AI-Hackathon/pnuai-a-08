import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing, typography } from '@/constants/theme';

type RentalActionProps = {
  label: string;
  color: string;
  accessibilityHint: string;
  onPress: () => void;
};

function RentalAction({ label, color, accessibilityHint, onPress }: RentalActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
    >
      <View style={styles.arrowSlot}>
        <Ionicons name="arrow-forward" color={color} size={34} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function RentalScreen() {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - spacing.lg * 2, 460);
  const markSize = Math.min(96, Math.max(74, width * 0.23));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.container, { width: contentWidth }]}>
        <View style={styles.content}>
          <Image
            source={require('../../../assets/images/rental-symbol.png')}
            style={{ width: markSize, height: markSize }}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="서로서가 심볼"
          />

          <View style={styles.actions}>
            <RentalAction
              label="빌릴래요"
              color={colors.accent}
              accessibilityHint="대여 가능한 책 둘러보기 화면으로 이동합니다"
              onPress={() => router.push('/rental/borrow')}
            />
            <RentalAction
              label="빌려줄래요"
              color={colors.secondaryAccent}
              accessibilityHint="빌려줄 책 등록 화면으로 이동합니다"
              onPress={() => router.push('/rental/lend')}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, alignSelf: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  actions: { width: '100%', alignItems: 'center', gap: spacing.sm },
  action: {
    width: '100%',
    maxWidth: 300,
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
  },
  actionPressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
  arrowSlot: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  actionLabel: {
    color: colors.text,
    fontSize: typography.title + 3,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
