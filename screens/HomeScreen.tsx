import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { BookShelf } from '@/components/BookShelf';
import { useHomeBooks } from '@/hooks/useHomeBooks';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Book } from '@/models/Book';

function SectionHeader({ title, count, onPress }: { title: string; count: number; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.count}>{count}권</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title} 전체보기`}
        disabled={!onPress}
        onPress={onPress}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Text style={styles.seeAllText}>전체보기 &gt;</Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const profile = useUserProfile(user?.uid ?? '');
  const { borrowed, owned, isLoading, error, reload } = useHomeBooks(user?.uid ?? '');
  const pageWidth = Math.min(width, 620);
  const nickname = profile?.nickname || user?.displayName?.trim() || user?.email?.split('@')[0] || '게스트';

  const openBook = (book: Book) => {
    router.push({ pathname: '/home/[bookId]', params: { bookId: book.id } });
  };

  const openAddBook = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/add-book');
  };

  const openBorrowBooks = () => {
    router.push('/(tabs)/rental/borrow');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Image
            source={require('../assets/login/seoroseoga-wordmark.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="서로서가"
          />

          <View style={styles.libraryTitle}>
            <Text numberOfLines={1} style={styles.nickname}>{nickname}</Text>
            <Text style={styles.librarySuffix}>님의 서재</Text>
          </View>

          {isLoading ? (
            <View style={styles.status}>
              <ActivityIndicator color="#A0B243" size="large" />
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
              <View style={styles.section}>
                <SectionHeader title="빌린 책" count={borrowed.length} onPress={() => router.push('/home/borrowed')} />
                <View style={styles.shelfShift}>
                  <BookShelf
                    books={borrowed}
                    variant="borrowed"
                    onPressBook={openBook}
                    onPressAdd={openBorrowBooks}
                  />
                </View>
              </View>

              <View style={styles.secondSection}>
                <SectionHeader title="나의 책" count={owned.length} onPress={() => router.push('/home/records')} />
                <View style={styles.shelfShift}>
                  <BookShelf
                    books={owned}
                    variant="owned"
                    onPressBook={openBook}
                    onPressAdd={openAddBook}
                  />
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1, alignSelf: 'center', backgroundColor: '#FFFFFF' },
  content: { paddingBottom: 106 },
  wordmark: { width: 117, height: 25, alignSelf: 'center', marginTop: 25 },
  libraryTitle: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 38,
    marginTop: 39,
  },
  nickname: {
    maxWidth: '65%',
    color: '#A0B243',
    fontSize: 22,
    lineHeight: 27,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  librarySuffix: {
    color: '#5D442D',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  section: { marginTop: 8 },
  secondSection: { marginTop: 23 },
  sectionHeader: {
    height: 28,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 38,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 5 },
  sectionTitle: { color: '#151310', fontSize: 14, lineHeight: 22, fontWeight: '800' },
  count: { color: '#A0B243', fontSize: 14, lineHeight: 22, fontWeight: '700' },
  seeAllText: { color: '#5D442D', fontSize: 14, lineHeight: 26, fontWeight: '700' },
  shelfShift: { marginTop: -24 },
  pressed: { opacity: 0.55 },
  status: { minHeight: 520, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: '#746E69', fontSize: 14 },
  retryButton: { borderRadius: 999, backgroundColor: '#D8FF45', paddingHorizontal: 20, paddingVertical: 9 },
  retryText: { color: '#34271F', fontWeight: '800' },
});
