import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { ReadingLibraryItem, useMyReadingLibrary } from '@/hooks/useMyReadingLibrary';

const localCovers: Record<string, ImageSourcePropType> = {
  급류: require('../../../pictures/급류.png'),
  '네루다의 우편배달부': require('../../../pictures/네루다의 우편배달부.png'),
  모순: require('../../../pictures/모순.png'),
  아몬드: require('../../../pictures/아몬드.png'),
  파과: require('../../../pictures/파과.png'),
};

function monthKey(value?: string) {
  if (!value) return 'undated';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'undated';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  if (key === 'undated') return '날짜 미정';
  const [year, month] = key.split('-');
  return `${year}년 ${Number(month)}월`;
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function readingProgress(item: ReadingLibraryItem) {
  if (item.record?.status === 'COMPLETED') return 100;
  const totalPages = item.book.totalPages ?? 0;
  if (totalPages <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round(((item.record?.currentPage ?? 0) / totalPages) * 100)));
}

function RecordBook({ item, width }: { item: ReadingLibraryItem; width: number }) {
  const height = Math.round(width * 1.45);
  const complete = item.record?.status === 'COMPLETED';
  const localCover = localCovers[item.book.title];
  const source = item.book.coverUrl ? { uri: item.book.coverUrl } : localCover;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.book.title}, ${complete ? '완독' : `읽는 중 ${readingProgress(item)}퍼센트`}`}
      onPress={() => router.push({ pathname: '/home/[bookId]', params: { bookId: item.book.id } })}
      style={({ pressed }) => [styles.book, { width, height }, pressed && styles.pressed]}
    >
      {source ? (
        <Image source={source} resizeMode="cover" style={styles.cover} />
      ) : (
        <LinearGradient colors={[...item.book.colors]} style={styles.fallbackCover}>
          <Text numberOfLines={3} style={styles.fallbackTitle}>{item.book.title}</Text>
          <Text numberOfLines={1} style={styles.fallbackAuthor}>{item.book.author}</Text>
        </LinearGradient>
      )}
      <View style={[styles.readingBadge, complete && styles.completedBadge]}>
        {complete ? <Ionicons name="checkmark" size={11} color="#1A1A1A" /> : <View style={styles.progressDot} />}
        <Text numberOfLines={1} style={[styles.readingBadgeText, complete && styles.completedBadgeText]}>
          {complete ? '완독' : `읽는 중 · ${readingProgress(item)}%`}
        </Text>
      </View>
    </Pressable>
  );
}

function ShelfRow({ items, pageWidth }: { items: ReadingLibraryItem[]; pageWidth: number }) {
  const bookWidth = Math.min(96, Math.max(76, (pageWidth - 92) / 3));
  const gap = Math.max(12, (pageWidth - 64 - bookWidth * 3) / 2);
  const coverHeight = Math.round(bookWidth * 1.45);
  const shelfWidth = Math.max(480, pageWidth * 1.25);
  const shelfHeight = shelfWidth / 1.5;
  const shelfTop = coverHeight + 5 - shelfHeight * 0.56;

  return (
    <View style={[styles.shelfRow, { height: coverHeight + 46 }]}>
      <View style={[styles.shelfGlow, { height: coverHeight + 17 }]} />
      <View style={[styles.bookRow, { gap }]}>
        {items.map((item) => <RecordBook key={item.book.id} item={item} width={bookWidth} />)}
      </View>
      <View pointerEvents="none" style={[styles.shelfImage, { width: shelfWidth, height: shelfHeight, left: (pageWidth - shelfWidth) / 2, top: shelfTop }]}>
        <Image source={require('../../../assets/home/bookshelf.png')} resizeMode="contain" style={styles.shelfAsset} />
      </View>
    </View>
  );
}

export default function ReadingRecordsScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { items, isLoading, error, reload } = useMyReadingLibrary(user?.uid ?? '');
  const pageWidth = Math.min(width, 620);
  const groups = useMemo(() => {
    const grouped = new Map<string, ReadingLibraryItem[]>();
    items.forEach((item) => {
      const key = monthKey(item.record?.startedAt ?? item.book.createdAt);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    });
    return [...grouped.entries()].sort(([first], [second]) => {
      if (first === 'undated') return 1;
      if (second === 'undated') return -1;
      return second.localeCompare(first);
    });
  }, [items]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={23} color="#1A1A1A" />
          </Pressable>
          <Text style={styles.title}>나의 기록</Text>
          <View style={styles.backButton} />
        </View>

        {isLoading ? (
          <View style={styles.state}><ActivityIndicator color="#A0B243" size="large" /></View>
        ) : error ? (
          <View style={styles.state}>
            <Text style={styles.stateText}>{error}</Text>
            <Pressable onPress={() => void reload()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.state}>
            <Ionicons name="library-outline" size={40} color="#B1B1B1" />
            <Text style={styles.emptyTitle}>아직 등록한 책이 없어요.</Text>
            <Pressable onPress={() => router.push('/add-book')} style={styles.addButton}><Text style={styles.addButtonText}>책 추가하기</Text></Pressable>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {groups.map(([key, groupItems]) => (
              <View key={key} style={styles.monthGroup}>
                <Text style={styles.monthTitle}>{monthLabel(key)}</Text>
                {chunkItems(groupItems, 3).map((row, index) => <ShelfRow key={`${key}-${index}`} items={row} pageWidth={pageWidth} />)}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' }, page: { flex: 1, alignSelf: 'center', backgroundColor: '#FFFFFF' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8B8986', paddingHorizontal: 12 }, backButton: { width: 36, height: 42, alignItems: 'center', justifyContent: 'center' }, title: { color: '#111111', fontSize: 18, lineHeight: 24, fontWeight: '900' },
  content: { paddingTop: 25, paddingBottom: 112 }, monthGroup: { marginBottom: 4 }, monthTitle: { color: '#111111', fontSize: 16, lineHeight: 22, fontWeight: '900', marginLeft: 35, marginBottom: 7 },
  shelfRow: { position: 'relative', overflow: 'hidden' }, shelfGlow: { position: 'absolute', left: 4, right: -20, top: 8, backgroundColor: 'rgba(233,250,144,0.2)' }, bookRow: { position: 'absolute', zIndex: 2, left: 32, right: 32, top: 0, flexDirection: 'row', alignItems: 'flex-end' }, shelfImage: { position: 'absolute', zIndex: 3 }, shelfAsset: { width: '100%', height: '100%' },
  book: { borderRadius: 4, backgroundColor: '#F4F0E8', shadowColor: '#000000', shadowOffset: { width: 8, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 7 }, cover: { width: '100%', height: '100%', borderRadius: 4 }, fallbackCover: { width: '100%', height: '100%', borderRadius: 4, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 8, paddingBottom: 28 }, fallbackTitle: { color: '#2B2019', fontSize: 13, lineHeight: 17, fontWeight: '900', textAlign: 'center' }, fallbackAuthor: { color: '#5D442D', fontSize: 8, marginTop: 6 },
  readingBadge: { position: 'absolute', zIndex: 4, left: 12, right: 12, bottom: 5, height: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: 'rgba(26,26,26,0.78)' }, completedBadge: { left: 22, right: 8, backgroundColor: '#D6FF42' }, progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D6FF42' }, readingBadgeText: { color: 'rgba(255,255,255,0.92)', fontSize: 8.5, lineHeight: 12, fontWeight: '900' }, completedBadgeText: { color: '#1A1A1A' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 30 }, stateText: { color: '#746E69', fontSize: 13, textAlign: 'center' }, emptyTitle: { color: '#362E29', fontSize: 16, fontWeight: '800' }, retry: { paddingHorizontal: 17, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EDCC' }, retryText: { color: '#7A8B26', fontSize: 12, fontWeight: '800' }, addButton: { height: 40, paddingHorizontal: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A0B243' }, addButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' }, pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
});
