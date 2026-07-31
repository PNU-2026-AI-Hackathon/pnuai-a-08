import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { Book } from '@/models/Book';

type ExploreBookCardProps = {
  book: Book;
  width: number;
  onPress: (book: Book) => void;
};

function CardArtwork({ motif }: Pick<Book, 'motif'>) {
  if (motif === 'lines') {
    return (
      <View style={styles.lineArtwork}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={[styles.artLine, { top: index * 21 }]} />
        ))}
      </View>
    );
  }

  if (motif === 'circle') {
    return (
      <View style={styles.circleArtwork}>
        <View style={styles.largeCircle} />
        <View style={styles.smallCircle} />
      </View>
    );
  }

  if (motif === 'night') {
    return (
      <View style={styles.iconArtwork}>
        <Ionicons name="settings-outline" size={58} color="rgba(255,255,255,0.52)" />
      </View>
    );
  }

  return (
    <View style={styles.waveArtwork}>
      <View style={styles.waveOne} />
      <View style={styles.waveTwo} />
    </View>
  );
}

export function ExploreBookCard({ book, width, onPress }: ExploreBookCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${book.title}, ${book.author}`}
      accessibilityHint="도서 상세 정보 화면으로 이동합니다"
      onPress={() => onPress(book)}
      style={({ pressed }) => [styles.pressable, { width }, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[...book.colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, { height: width * 1.3 }]}
      >
        <CardArtwork motif={book.motif} />
        <LinearGradient
          colors={['transparent', 'rgba(35,25,18,0.78)']}
          style={styles.scrim}
        />
        <View style={styles.copy}>
          <Text numberOfLines={3} style={[styles.title, width < 105 && styles.titleSmall]}>
            {book.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            {book.author}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: radius.md,
    shadowColor: '#4A3425',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  card: {
    overflow: 'hidden',
    borderRadius: radius.md,
    justifyContent: 'flex-end',
  },
  scrim: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    height: '65%',
  },
  copy: {
    padding: spacing.sm + 2,
    zIndex: 2,
  },
  title: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
    letterSpacing: -0.4,
  },
  titleSmall: {
    fontSize: 13,
    lineHeight: 17,
  },
  author: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  lineArtwork: {
    position: 'absolute',
    top: 18,
    left: -20,
    right: -20,
    height: 120,
    transform: [{ rotate: '-18deg' }],
  },
  artLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 7,
    borderRadius: 5,
    backgroundColor: 'rgba(255,223,133,0.5)',
  },
  circleArtwork: {
    position: 'absolute',
    top: 18,
    right: 8,
    left: 8,
    height: 100,
  },
  largeCircle: {
    position: 'absolute',
    width: 76,
    height: 76,
    right: -16,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  smallCircle: {
    position: 'absolute',
    width: 42,
    height: 42,
    left: 4,
    top: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,235,185,0.34)',
  },
  iconArtwork: {
    position: 'absolute',
    top: 22,
    right: 0,
    left: 0,
    alignItems: 'center',
  },
  waveArtwork: {
    position: 'absolute',
    top: 10,
    right: 0,
    left: 0,
    height: 105,
    overflow: 'hidden',
  },
  waveOne: {
    position: 'absolute',
    width: 150,
    height: 68,
    left: -24,
    top: 8,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.24)',
    transform: [{ rotate: '-12deg' }],
  },
  waveTwo: {
    position: 'absolute',
    width: 130,
    height: 56,
    right: -24,
    top: 51,
    borderRadius: 50,
    backgroundColor: 'rgba(39,94,145,0.28)',
    transform: [{ rotate: '13deg' }],
  },
});
