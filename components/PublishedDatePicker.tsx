import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

export function formatPublishedDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function PublishedDatePicker({ selected, onSelect }: { selected: Date | null; onSelect: (date: Date) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = useMemo(
    () => [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: lastDate }, (_, index) => index + 1)],
    [firstDay, lastDate],
  );

  return (
    <View style={styles.calendar}>
      <View style={styles.header}>
        <Text style={styles.title}>{year}년 {month + 1}월</Text>
        <View style={styles.arrows}>
          <Pressable hitSlop={10} onPress={() => setVisibleMonth(new Date(year, month - 1, 1))}>
            <Ionicons name="chevron-back" size={25} color="#6E7A30" />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => setVisibleMonth(new Date(year, month + 1, 1))}>
            <Ionicons name="chevron-forward" size={25} color="#6E7A30" />
          </Pressable>
        </View>
      </View>
      <View style={styles.row}>
        {weekDays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          const isSelected = Boolean(day && selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day);
          return (
            <Pressable
              key={`${day ?? 'blank'}-${index}`}
              disabled={!day}
              onPress={() => day && onSelect(new Date(year, month, day, 12))}
              style={[styles.cell, isSelected && styles.selectedCell]}
            >
              <Text style={[styles.date, isSelected && styles.selectedDate]}>{day ?? ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calendar: { marginTop: 14, padding: 16, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { color: '#6E7A30', fontSize: 20, fontWeight: '800' },
  arrows: { flexDirection: 'row', gap: 16 },
  row: { flexDirection: 'row' },
  weekDay: { width: `${100 / 7}%`, color: '#B7B7B7', fontSize: 12, textAlign: 'center', paddingVertical: 7 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  selectedCell: { backgroundColor: '#6E7A30' },
  date: { color: '#6E7A30', fontSize: 18 },
  selectedDate: { color: '#FFFFFF', fontWeight: '800' },
});
