import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookDetailCover } from '@/components/BookDetailCover';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useBookDetail } from '@/hooks/useBookDetail';

function getDueLabel(dueDate: string) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const remainingDays = Math.max(
    0,
    Math.ceil((new Date(dueDate).getTime() - Date.now()) / millisecondsPerDay),
  );

  return remainingDays === 0 ? '오늘 반납' : `반납까지 ${remainingDays}일 남음`;
}

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { width } = useWindowDimensions();
  const { book, isLoading, error } = useBookDetail(bookId ?? '');
  const pageWidth = Math.min(width, 620);
  const coverWidth = Math.min(pageWidth * 0.56, 224);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={25} color={colors.text} />
          </Pressable>

          <Image
            source={require('../../../pictures/Logo_full.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="서로서가"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="홈으로 이동"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)/home')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="home-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error || !book ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{error ?? '책 정보를 찾을 수 없어요.'}</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <BookDetailCover book={book} width={coverWidth} />

            <View style={styles.bookInfo}>
              <Text style={styles.title}>{book.title.replace('\n', ' ')}</Text>
              <Text style={styles.author}>{book.author}</Text>
              {book.dueDate ? (
                <View style={styles.dueBadge}>
                  <Text style={styles.dueText}>{getDueLabel(book.dueDate)}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${book.title} 기록하기`}
                onPress={() => Alert.alert('기록하기', '독서 기록 화면은 다음 단계에서 연결할게요.')}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>기록하기</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${book.title}에 대해 AI와 대화하기`}
                onPress={() =>
                  router.push({ pathname: '/home/ai', params: { bookId: book.id } })
                }
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Image
                  source={require('../../../assets/images/rental-symbol.png')}
                  style={styles.buttonSymbol}
                  resizeMode="contain"
                />
                <Text style={styles.secondaryButtonText}>AI와 대화하기</Text>
              </Pressable>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignSelf: 'center' },
  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { width: 116, height: 42 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  bookInfo: { alignItems: 'center', marginTop: spacing.xl },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  author: { color: colors.textMuted, fontSize: typography.body, marginTop: spacing.sm },
  dueBadge: {
    minHeight: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    backgroundColor: colors.accentSoft,
  },
  dueText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  actions: { width: '100%', gap: spacing.sm, marginTop: 'auto', paddingTop: spacing.xl },
  primaryButton: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  secondaryButton: {
    height: 52,
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  buttonSymbol: { width: 23, height: 23, marginRight: spacing.sm },
  secondaryButtonText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  buttonPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  pressed: { opacity: 0.55 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  statusText: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
});
