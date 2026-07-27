import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { Book } from '@/data/books';
import { colors, radius, spacing } from '@/constants/theme';

type BookShelfProps = {
  books: Book[];
  variant: 'borrowed' | 'owned';
};

const chunk = <T,>(items: T[], size: number) => {
  const pages: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size));
  }
  return pages;
};

function CoverMotif({ motif }: Pick<Book, 'motif'>) {
  if (motif === 'circle') {
    return <View style={styles.circle} />;
  }

  if (motif === 'lines') {
    return (
      <View style={styles.lines}>
        <View style={styles.line} />
        <View style={styles.line} />
        <View style={styles.line} />
      </View>
    );
  }

  if (motif === 'night') {
    return (
      <View style={styles.night}>
        <View style={styles.moon} />
        <View style={[styles.star, { left: 10, top: 22 }]} />
        <View style={[styles.star, { right: 7, top: 43 }]} />
        <View style={[styles.star, { left: 27, top: 56 }]} />
      </View>
    );
  }

  return (
    <View style={styles.clouds}>
      <View style={[styles.cloud, { width: 74, height: 74, right: -18, top: 14 }]} />
      <View style={[styles.cloud, { width: 54, height: 54, left: -16, top: 58 }]} />
      {motif === 'wave' && <View style={styles.wave} />}
    </View>
  );
}

function BookCover({
  book,
  width,
  height,
}: {
  book: Book;
  width: number;
  height: number;
}) {
  const lightText = book.motif === 'night' || book.motif === 'wave';

  return (
    <LinearGradient
      colors={[...book.colors]}
      style={[styles.book, { width, height }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <CoverMotif motif={book.motif} />
      <View style={styles.bookText}>
        <Text
          numberOfLines={3}
          style={[styles.bookTitle, lightText && styles.lightText, width < 100 && styles.bookTitleSmall]}
        >
          {book.title}
        </Text>
        <Text style={[styles.author, lightText && styles.lightText]}>{book.author}</Text>
      </View>
      {book.dueDate ? (
        <View style={[styles.dueBadge, { backgroundColor: book.accent }]}>
          <Text style={styles.dueText}>{book.dueDate}</Text>
        </View>
      ) : null}
    </LinearGradient>
  );
}

export function BookShelf({ books, variant }: BookShelfProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [activePage, setActivePage] = useState(0);
  const horizontalPadding = spacing.lg;
  const pageWidth = screenWidth;
  const visibleBooks = screenWidth < 350 ? 2 : 3;
  const gap = screenWidth < 380 ? 10 : 14;
  const bookWidth = Math.min(
    148,
    (screenWidth - horizontalPadding * 2 - gap * (visibleBooks - 1)) / visibleBooks,
  );
  const bookHeight = variant === 'borrowed' ? Math.min(250, bookWidth * 2.1) : Math.min(230, bookWidth * 1.92);
  const pages = useMemo(() => chunk(books, visibleBooks), [books, visibleBooks]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setActivePage(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
  };

  return (
    <View>
      <FlatList
        data={pages}
        key={`${visibleBooks}-${variant}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={handleScrollEnd}
        keyExtractor={(_, index) => `${variant}-page-${index}`}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pageWidth, gap, paddingHorizontal: horizontalPadding }]}>
            {item.map((book) => (
              <BookCover key={book.id} book={book} width={bookWidth} height={bookHeight} />
            ))}
          </View>
        )}
      />
      <View style={styles.shelfWrap}>
        <LinearGradient
          colors={[colors.shelfLight, colors.shelf, colors.shelfDark]}
          style={styles.shelf}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.woodGrainTop} />
          <View style={styles.indicators}>
            {pages.map((_, index) => (
              <View
                key={`${variant}-dot-${index}`}
                style={[styles.indicator, index === activePage && styles.indicatorActive]}
              />
            ))}
          </View>
          <View style={styles.woodGrainBottom} />
        </LinearGradient>
        <View style={styles.shelfShadow} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  book: {
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    shadowColor: '#442A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  bookText: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.md,
    minHeight: 92,
    zIndex: 2,
  },
  bookTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 26,
  },
  bookTitleSmall: {
    fontSize: 16,
    lineHeight: 21,
  },
  author: {
    color: colors.text,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  lightText: {
    color: colors.white,
  },
  dueBadge: {
    height: 42,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  dueText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 12,
  },
  circle: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#DAA06E',
    top: 54,
    alignSelf: 'center',
    opacity: 0.88,
  },
  lines: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    gap: 22,
    transform: [{ rotate: '-17deg' }],
  },
  line: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  clouds: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  cloud: {
    position: 'absolute',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  wave: {
    position: 'absolute',
    width: 150,
    height: 85,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.28)',
    top: 65,
    left: -14,
    transform: [{ rotate: '-12deg' }],
  },
  night: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  moon: {
    position: 'absolute',
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.35)',
    top: 46,
    alignSelf: 'center',
  },
  star: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  shelfWrap: {
    marginTop: -2,
  },
  shelf: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: '#DDB17B',
  },
  shelfShadow: {
    height: 13,
    backgroundColor: 'rgba(66,38,20,0.13)',
    shadowColor: '#321C0E',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  woodGrainTop: {
    position: 'absolute',
    height: 1,
    left: 0,
    right: 0,
    top: 9,
    backgroundColor: 'rgba(91,53,25,0.18)',
  },
  woodGrainBottom: {
    position: 'absolute',
    height: 1,
    left: 35,
    right: 12,
    bottom: 7,
    backgroundColor: 'rgba(255,232,192,0.18)',
  },
  indicators: {
    flexDirection: 'row',
    gap: 7,
    zIndex: 2,
  },
  indicator: {
    width: 21,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  indicatorActive: {
    backgroundColor: colors.accent,
  },
});
