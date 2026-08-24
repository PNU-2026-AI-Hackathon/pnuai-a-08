import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useRentalHistory } from '@/hooks/useRentalHistory';
import { RentalHistoryItem } from '@/models/RentalHistory';
import { formatReturnDday } from '@/utils/rentalDate';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

function HistoryCard({ item }: { item: RentalHistoryItem }) {
  const borrower = item.role === 'BORROWER';
  const scheduled = item.status === 'SCHEDULED';
  const borrowed = item.status === 'BORROWED';
  return (
    <Pressable
      disabled={!item.chatRoomId}
      onPress={() => item.chatRoomId && router.push({ pathname: '/chat/[roomId]', params: { roomId: item.chatRoomId } })}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}
    >
      <View style={[styles.statusBar, borrower ? styles.borrowedBorder : styles.lentBorder]}>
        <Text style={[styles.statusText, borrower ? styles.borrowedText : styles.lentText]}>{scheduled ? '대여 예정' : borrowed ? `대여중 · ${formatReturnDday(item.dueAt)}` : '반납 완료'}</Text>
        <Text style={[styles.roleText, borrower ? styles.borrowedText : styles.lentText]}>{borrower ? '빌릴래요' : '빌려줄래요'}</Text>
      </View>
      <View style={styles.bookRow}>
        {item.book.coverUrl ? <Image source={{ uri: item.book.coverUrl }} style={styles.cover} /> : (
          <LinearGradient colors={borrower ? ['#EEF2D8', '#C7D58A'] : ['#EEE4DA', '#BE9A6D']} style={styles.cover}>
            <Ionicons name="book-outline" size={24} color={borrower ? '#7A8B26' : '#5D442D'} />
          </LinearGradient>
        )}
        <View style={styles.bookCopy}>
          <Text numberOfLines={1} style={styles.bookTitle}>{item.book.title}</Text>
          <Text numberOfLines={1} style={styles.bookMeta}>
            {[item.book.publisher, item.book.author, item.book.publishedYear].filter(Boolean).join(' ') || item.book.author}
          </Text>
          <Text numberOfLines={1} style={styles.otherUser}>{item.otherUserName}님과의 대여</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function RentalHistoryScreen() {
  const { user } = useAuth();
  const { items, isLoading, error } = useRentalHistory(user?.uid ?? '');
  const [role, setRole] = useState<RentalHistoryItem['role']>('OWNER');
  const visibleItems = useMemo(() => items.filter((item) => item.role === role), [items, role]);
  let previousDate = '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color="#111" /></Pressable><Text style={styles.title}>대여 내역</Text><View style={styles.back} /></View>
      <View style={styles.modeRow}>
        {([['OWNER', '빌려준 책'], ['BORROWER', '빌린 책']] as const).map(([value, label]) => (
          <Pressable key={value} onPress={() => setRole(value)} style={[styles.modeButton, role === value && styles.modeButtonActive]}>
            <Text style={[styles.modeText, role === value && styles.modeTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      {isLoading ? <View style={styles.state}><ActivityIndicator size="large" color="#A0B243" /></View> : error ? (
        <View style={styles.state}><Text style={styles.stateText}>{error}</Text></View>
      ) : visibleItems.length === 0 ? (
        <View style={styles.state}><Ionicons name="time-outline" size={44} color="#B1B1B1" /><Text style={styles.emptyTitle}>{role === 'OWNER' ? '빌려준 책 내역이 없어요.' : '빌린 책 내역이 없어요.'}</Text><Text style={styles.stateText}>예정·진행 중인 대여와 반납 완료 기록이 이곳에 표시됩니다.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {visibleItems.map((item) => {
            const date = formatDate(item.eventAt);
            const showDate = date !== previousDate;
            previousDate = date;
            return <View key={item.id}>{showDate ? <Text style={styles.date}>{date}</Text> : null}<HistoryCard item={item} /></View>;
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, header: { height: 77, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#878787', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13 }, back: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }, title: { color: '#111', fontSize: 18, fontWeight: '900' },
  modeRow: { flexDirection: 'row', alignSelf: 'center', gap: 4, marginTop: 10, marginBottom: 2 }, modeButton: { width: 82, height: 28, borderWidth: 1, borderColor: '#5D442D', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, modeButtonActive: { borderColor: '#A2B155', backgroundColor: '#A2B155' }, modeText: { color: '#5D442D', fontSize: 12, fontWeight: '800' }, modeTextActive: { color: '#FFFFFF' },
  content: { paddingHorizontal: 28, paddingTop: 15, paddingBottom: 32 },
  date: { marginTop: 16, marginBottom: 7, color: '#111', fontSize: 16, fontWeight: '900' }, item: { marginBottom: 20 }, statusBar: { height: 39, borderWidth: 2, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 }, borrowedBorder: { borderColor: '#D0D9A0' }, lentBorder: { borderColor: '#5D442D' }, statusText: { fontSize: 14, fontWeight: '900' }, roleText: { fontSize: 14, fontWeight: '900' }, borrowedText: { color: '#A9BC42' }, lentText: { color: '#5D442D' },
  bookRow: { minHeight: 105, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 10 }, cover: { width: 60, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, bookCopy: { flex: 1, marginLeft: 19 }, bookTitle: { color: '#111', fontSize: 14, fontWeight: '800' }, bookMeta: { marginTop: 5, color: '#111', fontSize: 12, fontWeight: '700' }, otherUser: { marginTop: 6, color: '#333', fontSize: 10, fontWeight: '700' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 30, paddingBottom: 70 }, emptyTitle: { color: '#4F4943', fontSize: 15, fontWeight: '900', marginTop: 5 }, stateText: { color: '#85818A', fontSize: 12, textAlign: 'center' }, pressed: { opacity: 0.62 },
});
