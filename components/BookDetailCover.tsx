import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import { Book } from '@/models/Book';

const localCovers: Record<string, ImageSourcePropType> = {
  'borrowed-1': require('../pictures/급류.png'),
  'borrowed-2': require('../pictures/아몬드.png'),
  'mine-1': require('../pictures/모순.png'),
  'mine-2': require('../pictures/파과.png'),
};

export function BookDetailCover({ book, width }: { book: Book; width: number }) {
  const localCover = localCovers[book.id];

  if (localCover) {
    return <Image source={localCover} resizeMode="cover" style={[styles.cover, { width }]} />;
  }

  const lightText = book.motif === 'night' || book.motif === 'wave';

  return (
    <LinearGradient
      colors={[...book.colors]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.cover, styles.fallback, { width }]}
    >
      <View style={styles.glowLarge} />
      <View style={styles.glowSmall} />
      <Text style={[styles.fallbackTitle, lightText && styles.lightText]}>{book.title}</Text>
      <Text style={[styles.fallbackAuthor, lightText && styles.lightText]}>{book.author}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    aspectRatio: 0.71,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    shadowColor: '#39271B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 13,
    elevation: 8,
  },
  fallback: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  fallbackTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 31,
    zIndex: 2,
  },
  fallbackAuthor: {
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    zIndex: 2,
  },
  lightText: { color: colors.white },
  glowLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 30,
    right: -50,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  glowSmall: {
    position: 'absolute',
    width: 95,
    height: 95,
    borderRadius: 48,
    top: 135,
    left: -25,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});

