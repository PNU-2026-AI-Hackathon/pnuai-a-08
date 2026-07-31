import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreBookCard } from '@/components/ExploreBookCard';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useExploreBooks } from '@/hooks/useExploreBooks';
import { Book } from '@/models/Book';

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const { books, isLoading, error } = useExploreBooks();
  const [query, setQuery] = useState('');
  const pageWidth = Math.min(width, 620);
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const gap = width < 360 ? spacing.sm : 12;
  const cardWidth = (pageWidth - horizontalPadding * 2 - gap * 2) / 3;

  const filteredBooks = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    if (!keyword) {
      return books;
    }

    return books.filter((book) =>
      `${book.title} ${book.author}`.toLocaleLowerCase('ko').includes(keyword),
    );
  }, [books, query]);

  const handleBookPress = (book: Book) => {
    // 상세 화면 구현 시 이 한 곳을 router.push(`/books/${book.id}`)로 교체합니다.
    Alert.alert(book.title, '도서 상세 화면은 다음 단계에서 연결할게요.');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={[styles.searchWrap, { marginHorizontal: horizontalPadding }]}>
          <Ionicons name="search-outline" size={27} color={colors.accent} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="검색어를 입력하세요"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            accessibilityLabel="도서 검색"
            style={styles.searchInput}
          />
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            key="three-column-explore-grid"
            data={filteredBooks}
            numColumns={3}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.grid,
              {
                paddingHorizontal: horizontalPadding,
                rowGap: gap + spacing.lg,
              },
            ]}
            columnWrapperStyle={{ gap }}
            renderItem={({ item }) => (
              <ExploreBookCard book={item} width={cardWidth} onPress={handleBookPress} />
            )}
            ListEmptyComponent={
              <View style={[styles.empty, { width: pageWidth - horizontalPadding * 2 }]}>
                <Ionicons name="book-outline" size={36} color={colors.inactive} />
                <Text style={styles.statusText}>검색 결과가 없어요.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    alignSelf: 'center',
  },
  searchWrap: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginLeft: spacing.sm,
    paddingVertical: 0,
  },
  grid: {
    paddingBottom: spacing.xxl,
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
  },
  empty: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});

