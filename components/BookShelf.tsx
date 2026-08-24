import { LinearGradient } from 'expo-linear-gradient';
import { FlatList, Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { Book } from '@/models/Book';
import { formatReturnDday } from '@/utils/rentalDate';

type BookShelfProps = {
  books: readonly Book[];
  variant: 'borrowed' | 'owned';
  onPressBook?: (book: Book) => void;
  onPressAdd?: () => void;
};

type ShelfItem =
  | { type: 'book'; book: Book }
  | { type: 'add'; id: 'add-book' };

function formatRentalStart(value: string) {
  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = new Date(value).getTime() - Date.now();
  if (difference < -millisecondsPerDay) return '대여 확인 대기';
  const days = Math.max(0, Math.ceil(difference / millisecondsPerDay));
  return days === 0 ? '오늘 대여 예정' : `${days}일 후 대여 예정`;
}

function BookCard({ book, width, onPress }: { book: Book; width: number; onPress?: () => void }) {
  const dueLabel = book.status === 'RESERVED' && book.rentalStartsAt
    ? formatRentalStart(book.rentalStartsAt)
    : book.dueDate
      ? `대여중 · ${formatReturnDday(book.dueDate)}`
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.author}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.bookCard, { width }, pressed && styles.pressed]}
    >
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <LinearGradient colors={[...book.colors]} style={styles.fallbackCover}>
          <Text numberOfLines={3} style={styles.fallbackTitle}>{book.title}</Text>
          <Text numberOfLines={1} style={styles.fallbackAuthor}>{book.author}</Text>
        </LinearGradient>
      )}
      {dueLabel ? (
        <View style={styles.dueBadge}>
          <Text style={styles.dueText}>{dueLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function AddBookCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="나의 책 추가하기"
      onPress={onPress}
      style={({ pressed }) => [styles.addCard, pressed && styles.pressed]}
    >
      <Text style={styles.addIcon}>＋</Text>
    </Pressable>
  );
}

export function BookShelf({ books, variant, onPressBook, onPressAdd }: BookShelfProps) {
  const { width: screenWidth } = useWindowDimensions();
  const bookWidth = screenWidth < 380 ? 110 : 120;
  const shelfWidth = Math.max(541, screenWidth * 1.34);
  const items: ShelfItem[] = [
    ...books.map((book) => ({ type: 'book' as const, book })),
    ...(variant === 'owned' && onPressAdd ? [{ type: 'add' as const, id: 'add-book' as const }] : []),
  ];

  return (
    <View style={styles.container}>
      <View style={styles.backdrop} />
      <FlatList
        horizontal
        data={items}
        keyExtractor={(item) => item.type === 'book' ? item.book.id : item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        style={styles.listPosition}
        renderItem={({ item }) => item.type === 'book' ? (
          <BookCard
            book={item.book}
            width={bookWidth}
            onPress={onPressBook ? () => onPressBook(item.book) : undefined}
          />
        ) : (
          <AddBookCard onPress={onPressAdd ?? (() => undefined)} />
        )}
      />
      <View
        pointerEvents="none"
        style={[styles.shelfImage, { width: shelfWidth, height: shelfWidth / 1.5 }]}
      >
        <Image
          source={require('../assets/home/bookshelf.png')}
          style={styles.shelfAsset}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 270, overflow: 'hidden' },
  backdrop: {
    position: 'absolute',
    left: 24,
    right: -32,
    top: 42,
    height: 195,
    backgroundColor: 'rgba(233,250,144,0.2)',
  },
  listPosition: { position: 'absolute', left: 0, right: 0, top: 34, zIndex: 2, overflow: 'visible' },
  list: { alignItems: 'flex-start', gap: 23, paddingLeft: 38, paddingRight: 48 },
  bookCard: {
    height: 174,
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 8, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
  cover: { width: '100%', height: '100%', borderRadius: 4, backgroundColor: '#F4F0E8' },
  fallbackCover: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 22,
  },
  fallbackTitle: { color: '#2B2019', fontSize: 16, lineHeight: 21, fontWeight: '900', textAlign: 'center' },
  fallbackAuthor: { color: '#5D442D', fontSize: 10, marginTop: 8 },
  dueBadge: {
    position: 'absolute',
    zIndex: 5,
    left: 12,
    right: 12,
    bottom: 7,
    height: 21,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(233,250,144,0.88)',
  },
  dueText: { color: '#5D442D', fontSize: 9, fontWeight: '700' },
  addCard: {
    width: 105,
    height: 174,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#A0B243',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  addIcon: { color: '#91A52F', fontSize: 31, fontWeight: '300' },
  shelfImage: { position: 'absolute', zIndex: 3, left: -21, top: 0 },
  shelfAsset: { width: '100%', height: '100%' },
  pressed: { opacity: 0.68, transform: [{ scale: 0.985 }] },
});
