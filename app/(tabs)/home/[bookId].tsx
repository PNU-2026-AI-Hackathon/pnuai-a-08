import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BookDetailCover } from '@/components/BookDetailCover';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useBookDetail } from '@/hooks/useBookDetail';
import { useReadingRecord } from '@/hooks/useReadingRecord';

function getDueLabel(dueDate: string) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const remainingDays = Math.max(
    0,
    Math.ceil((new Date(dueDate).getTime() - Date.now()) / millisecondsPerDay),
  );

  return remainingDays === 0 ? '오늘 반납' : `반납까지 ${remainingDays}일 남음`;
}

function getRentalLabel(status: string | undefined, rentalStartsAt: string | undefined, dueDate: string | undefined) {
  if (status === 'RESERVED' && rentalStartsAt) {
    const difference = new Date(rentalStartsAt).getTime() - Date.now();
    if (difference < -86_400_000) return '대여 확인 대기';
    const days = Math.max(0, Math.ceil(difference / 86_400_000));
    return days === 0 ? '오늘 대여 예정' : `${days}일 후 대여 예정`;
  }
  return dueDate ? getDueLabel(dueDate) : null;
}

export default function BookDetailScreen() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const { book, isLoading, error } = useBookDetail(bookId ?? '');
  const readingDetail = useReadingRecord(bookId ?? '', user?.uid ?? '');
  const pageWidth = Math.min(width, 620);
  const coverWidth = Math.min(pageWidth * 0.595, 232);
  const recordedTotalPages = readingDetail.record?.totalPages ?? book?.totalPages;
  const readingProgress = recordedTotalPages
    ? Math.max(0, Math.min(100, Math.round(((readingDetail.record?.currentPage ?? 0) / recordedTotalPages) * 100)))
    : 0;
  const rentalLabel = book ? getRentalLabel(book.status, book.rentalStartsAt, book.dueDate) : null;
  const readingLabel = readingDetail.record?.status === 'COMPLETED'
    ? '완독'
    : book?.totalPages
      ? `읽는 중 · ${readingProgress}%`
      : '읽는 중';

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

        {isLoading || readingDetail.isLoading ? (
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
            <View pointerEvents="none" style={styles.bookGlow} />
            <BookDetailCover book={book} width={coverWidth} />

            <View style={styles.bookInfo}>
              <Text style={styles.title}>{book.title.replace('\n', ' ')}</Text>
              <Text style={styles.author}>{book.author}</Text>
              {rentalLabel ? (
                <View style={styles.dueBadge}>
                  <Text style={styles.dueText}>{rentalLabel}</Text>
                </View>
              ) : (
                <View style={styles.dueBadge}>
                  {readingDetail.record?.status === 'COMPLETED' ? <Ionicons name="checkmark" size={13} color="#5D442D" /> : null}
                  <Text style={styles.dueText}>{readingLabel}</Text>
                </View>
              )}
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${book.title} 기록하기`}
                onPress={() => router.push({ pathname: '/add-book', params: { bookId: book.id } })}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={styles.primaryButtonText}>{readingDetail.record?.status === 'COMPLETED' ? '기록보기' : '기록하기'}</Text>
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
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1, alignSelf: 'center', backgroundColor: '#FFFFFF' },
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
    paddingTop: 40,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  bookGlow: { position: 'absolute', top: 8, width: 293, height: 403, borderRadius: 150, backgroundColor: 'rgba(214,255,0,0.12)' },
  bookInfo: { alignItems: 'center', marginTop: spacing.xl },
  title: {
    color: '#5D442D',
    fontSize: typography.title,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  author: { color: '#5D442D', fontSize: typography.body, marginTop: spacing.sm },
  dueBadge: {
    minHeight: 30,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 3,
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
    backgroundColor: '#A2B155',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: typography.body, fontWeight: '900' },
  secondaryButton: {
    height: 52,
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#A0B243',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  buttonSymbol: { width: 23, height: 23, marginRight: spacing.sm },
  secondaryButtonText: { color: '#A0B243', fontSize: typography.body, fontWeight: '900' },
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
