import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Magazine } from '@/models/Magazine';

export function MagazineGridCard({
  magazine,
  height,
  onPress,
}: {
  magazine: Magazine;
  height: number;
  onPress: () => void;
}) {
  const isTextCard = magazine.index === 4 || magazine.index === 8 || magazine.index === 13;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${magazine.index}. ${magazine.title.replaceAll('\n', ' ')}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { height, backgroundColor: magazine.accent }, pressed && styles.pressed]}
    >
      {isTextCard ? (
        <View style={styles.textCardBody}>
          <Text style={[styles.textCardEyebrow, { color: magazine.textColor }]}>{magazine.eyebrow}</Text>
          <Text style={[styles.textCardTitle, { color: magazine.textColor }]}>{magazine.cardTitle}</Text>
          <View style={styles.miniBooks}>
            {magazine.books.slice(0, 3).map((book, index) => (
              <Image
                key={`${book.title}-${index}`}
                source={book.cover}
                style={[styles.miniBook, { transform: [{ rotate: `${(index - 1) * 7}deg` }] }]}
                resizeMode="cover"
              />
            ))}
          </View>
        </View>
      ) : (
        <>
          <Image source={magazine.cover} style={styles.image} resizeMode="cover" />
          <View style={styles.scrim} />
          <View style={styles.caption}>
            <Text style={styles.category}>{magazine.category}</Text>
            <Text style={styles.title}>{magazine.cardTitle}</Text>
          </View>
        </>
      )}
      <View style={styles.indexBadge}>
        <Text style={styles.indexText}>{String(magazine.index).padStart(2, '0')}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderRadius: 2 },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  image: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(24,17,12,0.25)' },
  caption: { position: 'absolute', left: 12, right: 10, bottom: 13 },
  category: { color: '#F7F4ED', fontSize: 10, fontWeight: '800', marginBottom: 5 },
  title: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '900', letterSpacing: -0.6 },
  indexBadge: {
    position: 'absolute', top: 9, left: 9, minWidth: 28, height: 20,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#D8FF45', paddingHorizontal: 5,
  },
  indexText: { color: '#33291F', fontSize: 10, fontWeight: '900' },
  textCardBody: { flex: 1, padding: 14, paddingTop: 39 },
  textCardEyebrow: { fontSize: 9, fontWeight: '800', opacity: 0.7 },
  textCardTitle: { fontSize: 19, lineHeight: 23, fontWeight: '900', letterSpacing: -0.7, marginTop: 7 },
  miniBooks: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginTop: 8 },
  miniBook: { width: 39, height: 58, marginHorizontal: -4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' },
});
