import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MagazineAiButton } from '@/components/MagazineAiButton';
import { MagazineGridCard } from '@/components/MagazineGridCard';
import { magazineCategories, magazines } from '@/data/magazines';
import { MagazineCategory } from '@/models/Magazine';

const cardHeights = [292, 280, 250, 286, 174, 202, 250, 220, 244, 186, 206, 250, 218, 278, 230, 205, 245, 208, 258];

export default function ExploreMagazineScreen() {
  const { width } = useWindowDimensions();
  const pageWidth = Math.min(width, 620);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<MagazineCategory>('전체');

  const filtered = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase('ko');
    return magazines.filter((magazine) => {
      const categoryMatches = category === '전체' || magazine.category === category;
      const searchable = [
        magazine.title,
        magazine.description,
        magazine.hook,
        magazine.category,
        ...magazine.tags,
        ...magazine.books.flatMap((book) => [book.title, book.author]),
        ...magazine.sections.flatMap((section) => [section.title, section.body]),
        magazine.longRead?.title ?? '',
        ...(magazine.longRead?.paragraphs ?? []),
        magazine.debate.question,
        ...magazine.playlist.flatMap((track) => [track.title, track.artist]),
      ].join(' ');
      const keywordMatches = !keyword || searchable
        .toLocaleLowerCase('ko').includes(keyword);
      return categoryMatches && keywordMatches;
    });
  }, [category, query]);

  const left = filtered.filter((_, index) => index % 2 === 0);
  const right = filtered.filter((_, index) => index % 2 === 1);

  const openMagazine = (magazineId: string) => {
    router.push({ pathname: '/(tabs)/explore/[magazineId]', params: { magazineId } });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Image
            source={require('../../../assets/magazines/figma-raw/main-07.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityLabel="서로서가"
          />

          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={19} color="#756B61" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="읽고 싶은 이야기를 검색해보세요"
              placeholderTextColor="#8B8278"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <View style={styles.indexHeader}>
            <Text style={styles.indexLabel}>INDEX</Text>
            <Text style={styles.issue}>VOL. 08</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {magazineCategories.map((item) => (
              <Text
                key={item}
                accessibilityRole="button"
                onPress={() => setCategory(item)}
                style={[styles.category, category === item && styles.categoryActive]}
              >
                {item}
              </Text>
            ))}
          </ScrollView>

          {filtered.length ? (
            <View style={styles.columns}>
              <View style={styles.column}>
                {left.map((magazine) => (
                  <MagazineGridCard
                    key={magazine.id}
                    magazine={magazine}
                    height={cardHeights[magazine.index - 1]}
                    onPress={() => openMagazine(magazine.id)}
                  />
                ))}
              </View>
              <View style={styles.column}>
                {right.map((magazine) => (
                  <MagazineGridCard
                    key={magazine.id}
                    magazine={magazine}
                    height={cardHeights[magazine.index - 1]}
                    onPress={() => openMagazine(magazine.id)}
                  />
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="newspaper-outline" size={34} color="#9A9187" />
              <Text style={styles.emptyText}>해당하는 매거진이 없어요.</Text>
            </View>
          )}
        </ScrollView>
        <MagazineAiButton magazineId="explore-home" title="서로서가 매거진" description="책과 독서에 대한 매거진을 탐색하고 있어요." />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F6E9' },
  page: { flex: 1, alignSelf: 'center' },
  content: { paddingHorizontal: 16, paddingBottom: 86 },
  wordmark: { width: 138, height: 35, alignSelf: 'center', marginTop: 10, marginBottom: 15 },
  searchBox: {
    height: 43, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14,
    borderWidth: 1, borderColor: '#CFC9BC', borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.45)',
  },
  searchInput: { flex: 1, height: '100%', paddingVertical: 0, color: '#34271F', fontSize: 13 },
  indexHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 25 },
  indexLabel: { color: '#34271F', fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  issue: { color: '#756B61', fontSize: 10, fontWeight: '700', marginBottom: 4 },
  categories: { gap: 22, paddingTop: 13, paddingBottom: 17 },
  category: { color: '#918A81', fontSize: 12, fontWeight: '700', paddingBottom: 5 },
  categoryActive: { color: '#34271F', borderBottomWidth: 2, borderBottomColor: '#34271F' },
  columns: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  column: { flex: 1, gap: 8 },
  empty: { height: 280, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: '#81796F', fontSize: 13 },
});
