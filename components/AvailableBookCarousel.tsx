import {
  Animated,
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRef } from 'react';

import { colors, radius, spacing } from '@/constants/theme';
import { AvailableBook, LocalBookCover } from '@/models/AvailableBook';

const coverAssets: Record<LocalBookCover, ImageSourcePropType> = {
  current: require('../pictures/급류.png'),
  neruda: require('../pictures/네루다의 우편배달부.png'),
  contradiction: require('../pictures/모순.png'),
  almond: require('../pictures/아몬드.png'),
  pagoa: require('../pictures/파과.png'),
};

type AvailableBookCarouselProps = {
  books: AvailableBook[];
  width: number;
  cardWidth: number;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onPressBook: (book: AvailableBook) => void;
};

type CarouselCardProps = {
  book: AvailableBook;
  index: number;
  cardWidth: number;
  interval: number;
  scrollX: Animated.Value;
  onPress: () => void;
};

function CarouselCard({ book, index, cardWidth, interval, scrollX, onPress }: CarouselCardProps) {
  const inputRange = [(index - 1) * interval, index * interval, (index + 1) * interval];
  const scale = scrollX.interpolate({
    inputRange,
    outputRange: [0.88, 1, 0.88],
    extrapolate: 'clamp',
  });
  const opacity = scrollX.interpolate({
    inputRange,
    outputRange: [0.65, 1, 0.65],
    extrapolate: 'clamp',
  });
  const source = book.localCover
    ? coverAssets[book.localCover]
    : book.coverUrl
      ? { uri: book.coverUrl }
      : coverAssets.current;

  return (
    <Animated.View style={[styles.cardWrap, { width: cardWidth, opacity, transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${book.title}, ${book.author}`}
        accessibilityHint="책 상세 정보 화면으로 이동합니다"
        onPress={onPress}
        style={({ pressed }) => [styles.cardPressable, pressed && styles.pressed]}
      >
        <Image source={source} style={styles.cover} resizeMode="cover" />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>{book.title}</Text>
      <Text numberOfLines={1} style={styles.author}>{book.author}</Text>
    </Animated.View>
  );
}

export function AvailableBookCarousel({
  books,
  width,
  cardWidth,
  selectedIndex,
  onSelectIndex,
  onPressBook,
}: AvailableBookCarouselProps) {
  const gap = spacing.md;
  const interval = cardWidth + gap;
  const scrollX = useRef(new Animated.Value(0)).current;
  const sidePadding = (width - cardWidth) / 2;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / interval);
    onSelectIndex(Math.max(0, Math.min(nextIndex, books.length - 1)));
  };

  return (
    <View style={styles.carousel}>
      <Animated.FlatList
        data={books}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        snapToInterval={interval}
        decelerationRate="fast"
        disableIntervalMomentum
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{ paddingHorizontal: sidePadding, gap }}
        getItemLayout={(_, index) => ({ length: interval, offset: interval * index, index })}
        renderItem={({ item, index }) => (
          <CarouselCard
            book={item}
            index={index}
            cardWidth={cardWidth}
            interval={interval}
            scrollX={scrollX}
            onPress={() => onPressBook(item)}
          />
        )}
      />
      <View style={styles.indicators}>
        {books.map((book, index) => (
          <View
            key={book.id}
            style={[styles.indicator, index === selectedIndex && styles.indicatorActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carousel: { width: '100%' },
  cardWrap: { alignItems: 'center' },
  cardPressable: {
    width: '100%',
    aspectRatio: 0.71,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    shadowColor: '#3B281B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 11,
    elevation: 7,
  },
  pressed: { opacity: 0.72 },
  cover: { width: '100%', height: '100%', borderRadius: radius.sm },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  author: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  indicatorActive: { width: 20, backgroundColor: colors.accent },
});
