import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const ITEM_HEIGHT = 28;
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1899 }, (_, index) => 1900 + index);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

export function formatPublishedDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function WheelColumn({ values, selectedIndex, width, onSelect }: {
  values: string[];
  selectedIndex: number;
  width: number;
  onSelect: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }, 0);
    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={ref}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={styles.columnContent}
      onMomentumScrollEnd={(event) => {
        const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
        onSelect(index);
      }}
      style={{ width }}
    >
      {values.map((value, index) => (
        <Pressable key={`${value}-${index}`} onPress={() => onSelect(index)} style={styles.item}>
          <Text style={[styles.itemText, index === selectedIndex ? styles.selectedText : styles.mutedText]}>{value}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function PublishedDatePicker({ selected, onSelect }: { selected: Date | null; onSelect: (date: Date) => void }) {
  const today = new Date();
  const value = selected ?? new Date(CURRENT_YEAR, today.getMonth(), today.getDate(), 12);
  const year = value.getFullYear();
  const month = value.getMonth() + 1;
  const day = value.getDate();
  const days = useMemo(
    () => Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1),
    [month, year],
  );

  const update = (nextYear: number, nextMonth: number, nextDay: number) => {
    const safeDay = Math.min(nextDay, daysInMonth(nextYear, nextMonth));
    onSelect(new Date(nextYear, nextMonth - 1, safeDay, 12));
  };

  return (
    <View style={styles.wheel}>
      <View pointerEvents="none" style={styles.selection} />
      <WheelColumn values={YEARS.map((item) => `${item}년`)} selectedIndex={Math.max(0, YEARS.indexOf(year))} width={112} onSelect={(index) => update(YEARS[index], month, day)} />
      <WheelColumn values={MONTHS.map((item) => `${item}월`)} selectedIndex={month - 1} width={72} onSelect={(index) => update(year, MONTHS[index], day)} />
      <WheelColumn values={days.map((item) => `${item}일`)} selectedIndex={Math.min(day, days.length) - 1} width={72} onSelect={(index) => update(year, month, days[index])} />
      <View pointerEvents="none" style={styles.topFade} />
      <View pointerEvents="none" style={styles.bottomFade} />
    </View>
  );
}

const styles = StyleSheet.create({
  wheel: { width: 306, height: 122, marginTop: 13, alignSelf: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FFFFFF' },
  selection: { position: 'absolute', left: 0, right: 0, top: 47, height: ITEM_HEIGHT, borderRadius: 8, backgroundColor: '#E5E5EA' },
  columnContent: { paddingVertical: 47 }, item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }, itemText: { fontSize: 20, lineHeight: 26, textAlign: 'center' }, selectedText: { color: '#1C1C1E', fontSize: 22 }, mutedText: { color: '#D8D8DC' },
  topFade: { position: 'absolute', zIndex: 5, left: 0, right: 0, top: 0, height: 34, backgroundColor: 'rgba(255,255,255,0.72)' }, bottomFade: { position: 'absolute', zIndex: 5, left: 0, right: 0, bottom: 0, height: 34, backgroundColor: 'rgba(255,255,255,0.72)' },
});
