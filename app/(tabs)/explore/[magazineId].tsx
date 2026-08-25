import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MagazineAiButton } from '@/components/MagazineAiButton';
import { getMagazine } from '@/data/magazines';
import { Magazine } from '@/models/Magazine';

function TopBar({ magazine, light = false }: { magazine: Magazine; light?: boolean }) {
  const color = light ? '#FFFFFF' : '#34271F';
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={23} color={color} />
      </Pressable>
      <Text style={[styles.topIndex, { color }]}>INDEX {String(magazine.index).padStart(2, '0')}</Text>
      <View style={[styles.categoryPill, light && styles.categoryPillLight]}>
        <Text style={[styles.categoryPillText, light && { color: '#FFFFFF' }]}>{magazine.category}</Text>
      </View>
    </View>
  );
}

function BookList({ magazine, numbered = false }: { magazine: Magazine; numbered?: boolean }) {
  return (
    <View style={styles.bookList}>
      {magazine.books.map((book, index) => (
        <View key={book.title} style={styles.bookRow}>
          {numbered ? <Text style={styles.bookNumber}>{String(index + 1).padStart(2, '0')}</Text> : null}
          <Image source={book.cover} style={styles.bookCover} resizeMode="cover" />
          <View style={styles.bookCopy}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            <Text style={styles.bookAuthor}>{book.author}</Text>
            <Text style={styles.bookNote}>{book.note}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color="#8D857C" />
        </View>
      ))}
    </View>
  );
}

function EditorialArticle({ magazine }: { magazine: Magazine }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.articleContent}>
      <View style={styles.hero}>
        <Image source={magazine.cover} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}><TopBar magazine={magazine} light /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>{magazine.eyebrow}</Text>
          <Text style={styles.heroTitle}>{magazine.title}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.articleTitle}>{magazine.title.replaceAll('\n', ' ')}</Text>
        <Text style={styles.meta}>{magazine.books.length + 6}장  ·  {magazine.readTime}  ·  {magazine.date}</Text>
        <Text style={styles.lead}>{magazine.description}</Text>
        <Text style={styles.paragraph}>
          세계문학전집 앞에서 망설여진다면 가장 유명한 책보다 지금의 나와 가까운 질문을 고르는 것이 좋습니다. 짧은 소설로 호흡을 익히고, 다음 책으로 자연스럽게 넘어가 보세요.
        </Text>

        <View style={styles.tags}>
          {magazine.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionKicker}>READ NEXT</Text>
          <Text style={styles.sectionTitle}>이 순서로 읽어보세요</Text>
        </View>
        <BookList magazine={magazine} />
        <View style={styles.editorNote}>
          <Text style={styles.editorNoteLabel}>EDITOR’S NOTE</Text>
          <Text style={styles.editorNoteText}>좋은 입문은 모든 것을 이해하는 읽기가 아니라, 다음 페이지가 궁금해지는 읽기예요.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function ReadingOrderArticle({ magazine }: { magazine: Magazine }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.articleContent}>
      <LinearGradient colors={['#F2FF96', '#FFF9C9', '#F7F6E9']} style={styles.readingHero}>
        <TopBar magazine={magazine} />
        <View style={styles.aiStamp}>
          <Ionicons name="sparkles" size={13} color="#34271F" />
          <Text style={styles.aiStampText}>AI BOOK CURATION</Text>
        </View>
        <Text style={styles.readingTitle}>{magazine.title}</Text>
        <Text style={styles.readingIntro}>{magazine.description}. 열기와 고독, 방황을 통과하는 이야기를 한 권씩 연결했어요.</Text>
        <View style={styles.collage}>
          {magazine.books.map((book, index) => (
            <Image
              key={book.title}
              source={book.cover}
              resizeMode="cover"
              style={[styles.collageBook, {
                left: 18 + index * 72,
                top: index % 2 === 0 ? 8 : 38,
                transform: [{ rotate: `${(index - 1.5) * 6}deg` }],
                zIndex: index,
              }]}
            />
          ))}
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.whyBox}>
          <Text style={styles.whyTitle}>왜 이 6권인가요?</Text>
          <Text style={styles.whyText}>여름의 열기를 배경으로 자아, 자유, 부조리를 다른 고전을 골랐어요. 어두운 책이지만 마지막에는 자신의 삶을 다시 보게 합니다.</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionKicker}>READING ORDER</Text>
          <Text style={styles.sectionTitle}>이번 달의 읽기 순서</Text>
        </View>
        <BookList magazine={magazine} numbered />

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/(tabs)/home/ai', params: { magazineId: magazine.id, contextTitle: magazine.title.replaceAll('\n', ' '), contextDescription: magazine.description } })}
          style={({ pressed }) => [styles.readAgain, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.readAgainText}>이 주제로 다시 읽기</Text>
          <Ionicons name="arrow-forward" size={19} color="#34271F" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

export default function MagazineDetailScreen() {
  const { magazineId } = useLocalSearchParams<{ magazineId: string }>();
  const { width } = useWindowDimensions();
  const magazine = getMagazine(magazineId);

  if (!magazine) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Pressable style={styles.missing} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#34271F" />
          <Text style={styles.missingText}>매거진을 찾을 수 없어요.</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: Math.min(width, 620) }]}>
        {magazine.detailStyle === 'reading-order'
          ? <ReadingOrderArticle magazine={magazine} />
          : <EditorialArticle magazine={magazine} />}
        <MagazineAiButton magazineId={magazine.id} title={magazine.title} description={magazine.description} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F6E9' },
  page: { flex: 1, alignSelf: 'center', backgroundColor: '#F7F6E9' },
  articleContent: { paddingBottom: 86 },
  topBar: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 },
  topIndex: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  categoryPill: { minWidth: 54, paddingHorizontal: 10, height: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#6F645B', borderRadius: 20 },
  categoryPillLight: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.12)' },
  categoryPillText: { color: '#34271F', fontSize: 10, fontWeight: '800' },
  hero: { height: 410, backgroundColor: '#312A24' },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  heroCopy: { position: 'absolute', left: 22, right: 22, bottom: 28 },
  heroEyebrow: { color: '#D8FF45', fontSize: 11, fontWeight: '900', marginBottom: 10 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 36, fontWeight: '900', letterSpacing: -1.1 },
  body: { paddingHorizontal: 21, paddingTop: 29 },
  articleTitle: { color: '#34271F', fontSize: 27, lineHeight: 35, fontWeight: '900', letterSpacing: -1 },
  meta: { color: '#877F76', fontSize: 11, fontWeight: '700', marginTop: 11 },
  lead: { color: '#34271F', fontSize: 18, lineHeight: 28, fontWeight: '800', marginTop: 29 },
  paragraph: { color: '#5B524A', fontSize: 14, lineHeight: 25, marginTop: 18 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 24 },
  tag: { color: '#594F46', fontSize: 11, fontWeight: '700', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ECE9D9' },
  sectionHeading: { marginTop: 38, marginBottom: 14 },
  sectionKicker: { color: '#7C7268', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: '#34271F', fontSize: 23, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  bookList: { borderTopWidth: 1, borderTopColor: '#D9D4C7' },
  bookRow: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#D9D4C7' },
  bookNumber: { width: 22, color: '#91A927', fontSize: 13, fontWeight: '900' },
  bookCover: { width: 58, height: 87, backgroundColor: '#DDD5C9' },
  bookCopy: { flex: 1 },
  bookTitle: { color: '#34271F', fontSize: 16, fontWeight: '900' },
  bookAuthor: { color: '#766D64', fontSize: 11, marginTop: 3 },
  bookNote: { color: '#5E554D', fontSize: 11, lineHeight: 17, marginTop: 8 },
  editorNote: { marginTop: 32, padding: 19, backgroundColor: '#34271F' },
  editorNoteLabel: { color: '#D8FF45', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  editorNoteText: { color: '#F7F6E9', fontSize: 13, lineHeight: 21, marginTop: 9 },
  readingHero: { minHeight: 535, overflow: 'hidden' },
  aiStamp: { alignSelf: 'flex-start', flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 14, marginLeft: 21 },
  aiStampText: { color: '#34271F', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  readingTitle: { color: '#34271F', fontSize: 42, lineHeight: 47, fontWeight: '900', letterSpacing: -1.7, marginHorizontal: 21, marginTop: 14 },
  readingIntro: { color: '#594F46', fontSize: 13, lineHeight: 21, marginHorizontal: 23, marginTop: 15, maxWidth: 320 },
  collage: { height: 220, marginTop: 16, position: 'relative' },
  collageBook: { position: 'absolute', width: 102, height: 153, shadowColor: '#34271F', shadowOffset: { width: 2, height: 8 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 5 },
  whyBox: { borderWidth: 1.3, borderColor: '#4C433B', padding: 18 },
  whyTitle: { color: '#34271F', fontSize: 19, fontWeight: '900' },
  whyText: { color: '#5B524A', fontSize: 13, lineHeight: 21, marginTop: 9 },
  readAgain: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 30, backgroundColor: '#D8FF45' },
  readAgainText: { color: '#34271F', fontSize: 15, fontWeight: '900' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  missingText: { color: '#34271F', fontSize: 15, fontWeight: '700' },
});
