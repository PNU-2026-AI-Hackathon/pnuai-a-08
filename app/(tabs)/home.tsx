import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookShelf } from '@/components/BookShelf';
import { colors, spacing, typography } from '@/constants/theme';
import { useHomeBooks } from '@/hooks/useHomeBooks';

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{count}권</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title} 전체보기`}
        hitSlop={10}
        style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}
      >
        <Text style={styles.seeAllText}>전체보기</Text>
        <Ionicons name="chevron-forward" size={19} color={colors.text} />
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const { borrowed, owned, isLoading, error, reload } = useHomeBooks();
  const compact = height < 700;
  const sidePadding = Math.max(spacing.lg, (width - 540) / 2);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingHorizontal: sidePadding, paddingTop: compact ? spacing.md : spacing.lg }]}>
          <View>
            <Text style={[styles.greeting, width < 360 && styles.greetingSmall]}>안녕하세요! 👋</Text>
            <Text style={styles.subtitle}>오늘도 좋은 책을 만나보세요.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="알림"
            hitSlop={12}
            style={({ pressed }) => [styles.notification, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={29} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable accessibilityRole="button" onPress={reload} style={styles.retryButton}>
              <Text style={styles.retryText}>다시 시도</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={[styles.section, compact && styles.sectionCompact]}>
              <View style={{ paddingHorizontal: sidePadding }}>
                <SectionHeader title="빌린 책" count={borrowed.length} />
              </View>
              <BookShelf books={borrowed} variant="borrowed" />
            </View>

            <View style={[styles.section, styles.myBooksSection, compact && styles.sectionCompact]}>
              <View style={{ paddingHorizontal: sidePadding }}>
                <SectionHeader title="나의 책" count={owned.length} />
              </View>
              <BookShelf books={owned} variant="owned" />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    color: colors.text,
    fontSize: typography.greeting,
    lineHeight: 46,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  greetingSmall: {
    fontSize: 31,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: typography.subtitle,
    marginTop: spacing.sm,
    letterSpacing: -0.3,
  },
  notification: {
    marginTop: 6,
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    right: 7,
    top: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  section: {
    marginTop: spacing.xxl,
  },
  sectionCompact: {
    marginTop: spacing.xl,
  },
  myBooksSection: {
    marginTop: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  count: {
    color: colors.textMuted,
    fontSize: typography.subtitle,
    fontWeight: '600',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  seeAllText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.55,
  },
  status: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },
  retryButton: {
    borderRadius: 999,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  retryText: {
    color: colors.text,
    fontWeight: '800',
  },
});