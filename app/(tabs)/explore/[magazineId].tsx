import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Image, Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

function MagazineStory({ magazine, showBooks = true, showHook = true }: { magazine: Magazine; showBooks?: boolean; showHook?: boolean }) {
  return (
    <>
      {showHook ? (
        <View style={styles.hookBox}>
          <Text style={styles.hookLabel}>3초 만에 읽고 싶어지는 이유</Text>
          <Text style={styles.hookText}>{magazine.hook}</Text>
        </View>
      ) : null}

      {magazine.sections.map((section, index) => (
        <View key={`${section.kicker}-${index}`} style={styles.storySection}>
          <Text style={styles.sectionKicker}>{section.kicker}</Text>
          <Text style={styles.storyTitle}>{section.title}</Text>
          <Text style={styles.paragraph}>{section.body}</Text>
        </View>
      ))}

      {magazine.longRead ? (
        <View style={styles.longRead}>
          <View style={styles.longReadRule} />
          <Text style={styles.longReadEyebrow}>{magazine.longRead.eyebrow}</Text>
          <Text style={styles.longReadTitle}>{magazine.longRead.title}</Text>
          <Text style={styles.longReadIntro}>{magazine.longRead.intro}</Text>
          <View style={styles.longReadMeta}>
            <Ionicons name="book-outline" size={14} color="#756B61" />
            <Text style={styles.longReadMetaText}>스포일러 없이 읽는 프리뷰</Text>
          </View>
          {magazine.longRead.paragraphs.map((paragraph, index) => (
            <View key={`${magazine.id}-long-${index}`}>
              <Text style={[styles.longReadParagraph, index === 0 && styles.longReadFirstParagraph]}>{paragraph}</Text>
              {index === Math.floor(magazine.longRead!.paragraphs.length / 2) - 1 ? (
                <View style={styles.interludeBox}>
                  <Text style={styles.interludeMark}>“</Text>
                  <Text style={styles.interludeText}>{magazine.longRead!.interlude}</Text>
                </View>
              ) : null}
            </View>
          ))}
          <View style={styles.closingQuestionBox}>
            <Text style={styles.closingQuestionLabel}>책을 펴기 전에, 나에게 묻기</Text>
            <Text style={styles.closingQuestion}>{magazine.longRead.closingQuestion}</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.debateBox}>
        <View style={styles.debateTop}>
          <Ionicons name="chatbubbles-outline" size={17} color="#D8FF45" />
          <Text style={styles.debateLabel}>친구랑 이 얘기 해볼래?</Text>
        </View>
        <Text style={styles.debateQuestion}>{magazine.debate.question}</Text>
        <Text style={styles.debateContext}>{magazine.debate.context}</Text>
        <View style={styles.choiceRow}>
          {magazine.debate.choices.map((choice, index) => (
            <View key={choice} style={styles.choicePill}>
              <Text style={styles.choiceNumber}>{index + 1}</Text>
              <Text style={styles.choiceText}>{choice}</Text>
            </View>
          ))}
        </View>
      </View>

      {magazine.facts.length ? (
        <View style={styles.factBox}>
          <Text style={styles.factHeading}>알고 읽으면 완전히 달라지는 사실</Text>
          {magazine.facts.map((fact) => (
            <View key={fact.label} style={styles.factRow}>
              <Text style={styles.factLabel}>{fact.label}</Text>
              <Text style={styles.factText}>{fact.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {magazine.playlist.length ? (
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionKicker}>BOOK PLAYLIST</Text>
          <Text style={styles.sectionTitle}>이 책과 함께 들을 음악</Text>
          <View style={styles.playlist}>
            {magazine.playlist.map((track, index) => (
              <View key={`${track.title}-${track.artist}`} style={styles.trackRow}>
                <View style={styles.trackNumber}><Text style={styles.trackNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
                <View style={styles.trackCopy}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackArtist}>{track.artist}</Text>
                  <Text style={styles.trackReason}>{track.reason}</Text>
                </View>
                <Ionicons name="musical-notes-outline" size={20} color="#776E64" />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {showBooks ? (
        <>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionKicker}>READ NEXT</Text>
            <Text style={styles.sectionTitle}>관심이 생겼다면, 이 책부터</Text>
          </View>
          <BookList magazine={magazine} />
        </>
      ) : null}

      <View style={styles.editorNote}>
        <Text style={styles.editorNoteLabel}>EDITOR’S NOTE</Text>
        <Text style={styles.editorNoteText}>{magazine.editorNote}</Text>
      </View>

      <View style={styles.sources}>
        <Text style={styles.sourcesTitle}>FACT CHECK · 참고 자료</Text>
        {magazine.sources.map((item) => (
          <Pressable
            key={item.url}
            accessibilityRole="link"
            onPress={() => void Linking.openURL(item.url)}
            style={({ pressed }) => [styles.sourceRow, pressed && { opacity: 0.6 }]}
          >
            <View style={styles.sourceCopy}>
              <Text style={styles.sourceLabel}>{item.label}</Text>
              <Text style={styles.sourcePublisher}>{item.publisher}</Text>
            </View>
            <Ionicons name="open-outline" size={16} color="#756B61" />
          </Pressable>
        ))}
      </View>
    </>
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
        <Text style={styles.meta}>{magazine.byline}  ·  {magazine.date}</Text>
        <Text style={styles.lead}>{magazine.description}</Text>

        <View style={styles.tags}>
          {magazine.tags.map((tag) => <Text key={tag} style={styles.tag}>{tag}</Text>)}
        </View>

        <MagazineStory magazine={magazine} />
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
          <Text style={styles.whyTitle}>왜 이 책들인가요?</Text>
          <Text style={styles.whyText}>{magazine.hook}</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionKicker}>READING ORDER</Text>
          <Text style={styles.sectionTitle}>이번 달의 읽기 순서</Text>
        </View>
        <BookList magazine={magazine} numbered />

        <MagazineStory magazine={magazine} showBooks={false} showHook={false} />

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
  hookBox: { marginTop: 28, paddingVertical: 21, paddingHorizontal: 18, borderLeftWidth: 4, borderLeftColor: '#D8FF45', backgroundColor: '#34271F' },
  hookLabel: { color: '#D8FF45', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  hookText: { color: '#FFFFFF', fontSize: 18, lineHeight: 27, fontWeight: '800', letterSpacing: -0.35, marginTop: 9 },
  storySection: { marginTop: 36 },
  storyTitle: { color: '#34271F', fontSize: 22, lineHeight: 29, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  longRead: { marginTop: 48 },
  longReadRule: { width: 44, height: 4, backgroundColor: '#34271F', marginBottom: 16 },
  longReadEyebrow: { color: '#8A7E72', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  longReadTitle: { color: '#34271F', fontSize: 29, lineHeight: 38, fontWeight: '900', letterSpacing: -1, marginTop: 10 },
  longReadIntro: { color: '#4C433B', fontSize: 16, lineHeight: 27, fontWeight: '700', marginTop: 19 },
  longReadMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 15, marginBottom: 11 },
  longReadMetaText: { color: '#756B61', fontSize: 10, fontWeight: '700' },
  longReadParagraph: { color: '#4D453D', fontSize: 15, lineHeight: 28, letterSpacing: -0.15, marginTop: 20 },
  longReadFirstParagraph: { fontSize: 16, lineHeight: 29, color: '#34271F' },
  interludeBox: { marginVertical: 32, paddingVertical: 22, paddingHorizontal: 18, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#B8AFA2' },
  interludeMark: { color: '#9BAF35', fontSize: 42, lineHeight: 35, fontWeight: '900' },
  interludeText: { color: '#34271F', fontSize: 20, lineHeight: 30, fontWeight: '900', letterSpacing: -0.6, marginTop: 3 },
  closingQuestionBox: { marginTop: 33, padding: 20, backgroundColor: '#E8E3D8' },
  closingQuestionLabel: { color: '#81766A', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  closingQuestion: { color: '#34271F', fontSize: 18, lineHeight: 27, fontWeight: '900', marginTop: 9 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 24 },
  tag: { color: '#594F46', fontSize: 11, fontWeight: '700', paddingHorizontal: 11, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ECE9D9' },
  sectionHeading: { marginTop: 38, marginBottom: 14 },
  sectionKicker: { color: '#7C7268', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { color: '#34271F', fontSize: 23, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  debateBox: { marginTop: 39, padding: 20, backgroundColor: '#34271F' },
  debateTop: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  debateLabel: { color: '#D8FF45', fontSize: 11, fontWeight: '900' },
  debateQuestion: { color: '#FFFFFF', fontSize: 21, lineHeight: 29, fontWeight: '900', letterSpacing: -0.5, marginTop: 14 },
  debateContext: { color: '#D8D2CA', fontSize: 12, lineHeight: 20, marginTop: 10 },
  choiceRow: { gap: 8, marginTop: 17 },
  choicePill: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: '#766E65' },
  choiceNumber: { width: 21, height: 21, borderRadius: 11, textAlign: 'center', textAlignVertical: 'center', color: '#34271F', backgroundColor: '#D8FF45', fontSize: 11, fontWeight: '900' },
  choiceText: { flex: 1, color: '#FFFFFF', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  factBox: { marginTop: 28, padding: 18, borderWidth: 1, borderColor: '#B9B2A6', backgroundColor: '#EEEBDD' },
  factHeading: { color: '#34271F', fontSize: 16, fontWeight: '900', marginBottom: 13 },
  factRow: { gap: 7 },
  factLabel: { alignSelf: 'flex-start', color: '#34271F', backgroundColor: '#D8FF45', paddingHorizontal: 8, paddingVertical: 4, fontSize: 10, fontWeight: '900' },
  factText: { color: '#554C44', fontSize: 13, lineHeight: 21 },
  playlist: { marginTop: 14, borderTopWidth: 1, borderTopColor: '#D9D4C7' },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#D9D4C7' },
  trackNumber: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 17, backgroundColor: '#D8FF45' },
  trackNumberText: { color: '#34271F', fontSize: 10, fontWeight: '900' },
  trackCopy: { flex: 1 },
  trackTitle: { color: '#34271F', fontSize: 14, fontWeight: '900' },
  trackArtist: { color: '#786F66', fontSize: 11, marginTop: 2 },
  trackReason: { color: '#5B524A', fontSize: 11, lineHeight: 17, marginTop: 6 },
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
  sources: { marginTop: 28, marginBottom: 12 },
  sourcesTitle: { color: '#81786E', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginBottom: 8 },
  sourceRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#D9D4C7', paddingVertical: 9 },
  sourceCopy: { flex: 1 },
  sourceLabel: { color: '#4B433B', fontSize: 12, fontWeight: '800' },
  sourcePublisher: { color: '#8A8178', fontSize: 10, marginTop: 3 },
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
