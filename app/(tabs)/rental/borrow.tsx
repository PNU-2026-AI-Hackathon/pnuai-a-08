import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AvailableBookCarousel } from '@/components/AvailableBookCarousel';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useAvailableBooks } from '@/hooks/useAvailableBooks';
import { AvailableBook } from '@/models/AvailableBook';
import { rentalRepository } from '@/services/rentalRepository';

export default function BorrowBrowseScreen() {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const { books, isLoading, error } = useAvailableBooks(user?.uid ?? 'guest');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isRequesting, setIsRequesting] = useState(false);
  const pageWidth = Math.min(width, 620);
  const cardWidth = Math.min(pageWidth * 0.6, Math.max(184, (height - 390) * 0.68), 250);
  const selectedBook = books[selectedIndex];
  const isOwnBook = Boolean(user && selectedBook?.ownerId === user.uid);
  const place = useMemo(
    () => selectedBook?.lendingPlace ?? books[0]?.lendingPlace,
    [books, selectedBook],
  );

  const handleBookPress = (book: AvailableBook) => {
    // 상세 화면 구현 시 router.push(`/books/${book.id}`)로 교체합니다.
    Alert.alert(book.title, '책 상세 정보 화면은 다음 단계에서 연결할게요.');
  };

  const handleRentalRequest = async () => {
    if (!selectedBook || isRequesting) return;
    if (!user) {
      Alert.alert('로그인이 필요해요', '책을 빌리려면 부산대학교 계정으로 로그인해주세요.');
      return;
    }
    if (selectedBook.ownerId === user.uid) {
      Alert.alert('내가 등록한 책이에요', '다른 사용자는 이 책을 확인하고 대여를 신청할 수 있어요.');
      return;
    }
    setIsRequesting(true);
    try {
      await rentalRepository.createLoanRequest({ bookId: selectedBook.id, borrowerId: user.uid });
      Alert.alert('대여 신청 완료', `${selectedBook.ownerDisplayName}님에게 신청을 보냈어요.`);
      router.replace('/(tabs)/community');
    } catch (requestError) {
      console.error('대여 신청 실패:', requestError);
      Alert.alert('대여 신청 실패', '책 상태를 다시 확인한 뒤 시도해 주세요.');
    } finally {
      setIsRequesting(false);
    }
  };

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

        <View style={styles.segmentedControl}>
          <View style={[styles.segment, styles.segmentActive]}>
            <Text style={[styles.segmentText, styles.segmentTextActive]}>둘러보기</Text>
          </View>
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel="대여 목록"
            onPress={() => Alert.alert('대여 목록', '대여 목록 화면은 준비 중이에요.')}
            style={({ pressed }) => [styles.segment, pressed && styles.pressed]}
          >
            <Text style={styles.segmentText}>대여 목록</Text>
          </Pressable>
        </View>

        <View style={styles.placeRow}>
          <Ionicons name="location-outline" size={23} color={colors.accent} />
          <Text numberOfLines={1} style={styles.placeName}>
            {place?.name ?? '대여 장소를 확인하고 있어요'}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : books.length === 0 ? (
          <View style={styles.status}>
            <Ionicons name="book-outline" size={38} color={colors.inactive} />
            <Text style={styles.statusText}>현재 이 장소에서 빌릴 수 있는 책이 없어요.</Text>
          </View>
        ) : (
          <View style={styles.browseContent}>
            <AvailableBookCarousel
              books={books}
              width={pageWidth}
              cardWidth={cardWidth}
              selectedIndex={selectedIndex}
              onSelectIndex={setSelectedIndex}
              onPressBook={handleBookPress}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${selectedBook?.title ?? '선택한 책'} 대여 신청하기`}
              onPress={handleRentalRequest}
              disabled={isRequesting || isOwnBook}
              style={({ pressed }) => [
                styles.requestButton,
                isOwnBook && styles.requestButtonDisabled,
                pressed && styles.requestButtonPressed,
              ]}
            >
              {isRequesting ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <Text style={styles.requestButtonText}>{isOwnBook ? '내가 등록한 책이에요' : '대여 신청하기'}</Text>
              )}
            </Pressable>
          </View>
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
  segmentedControl: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  segment: {
    minWidth: 84,
    height: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.secondaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  segmentActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  segmentText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  segmentTextActive: { color: colors.white },
  placeRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  placeName: { color: colors.text, fontSize: typography.body, fontWeight: '800' },
  browseContent: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingBottom: spacing.lg,
  },
  requestButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    shadowColor: '#5B7030',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  requestButtonPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  requestButtonDisabled: { backgroundColor: '#D9D9D1', shadowOpacity: 0, elevation: 0 },
  requestButtonText: { color: colors.text, fontSize: typography.body, fontWeight: '900' },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  statusText: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
  pressed: { opacity: 0.55 },
});
