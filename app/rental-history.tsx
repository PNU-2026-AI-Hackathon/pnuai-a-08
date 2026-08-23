import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useRentalHistory } from '@/hooks/useRentalHistory';
import { RentalHistoryItem } from '@/models/RentalHistory';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
}

function HistoryCard({ item }: { item: RentalHistoryItem }) {
  const borrower = item.role === 'BORROWER';
  return (
    <View style={styles.item}>
      <View style={[styles.statusBar, borrower ? styles.borrowedBorder : styles.lentBorder]}>
        <Text style={[styles.statusText, borrower ? styles.borrowedText : styles.lentText]}>반납완료</Text>
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
    </View>
  );
}

export default function RentalHistoryScreen() {
  const { user } = useAuth();
  const { items, isLoading, error } = useRentalHistory(user?.uid ?? '');
  let previousDate = '';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color="#111" /></Pressable><Text style={styles.title}>대여 내역</Text><View style={styles.back} /></View>
      {isLoading ? <View style={styles.state}><ActivityIndicator size="large" color="#A0B243" /></View> : error ? (
        <View style={styles.state}><Text style={styles.stateText}>{error}</Text></View>
      ) : items.length === 0 ? (
        <View style={styles.state}><Ionicons name="time-outline" size={44} color="#B1B1B1" /><Text style={styles.emptyTitle}>완료된 대여 내역이 없어요.</Text><Text style={styles.stateText}>반납이 완료된 기록이 이곳에 표시됩니다.</Text></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.filter}><Text style={styles.filterText}>전체</Text></View>
          {items.map((item) => {
            const date = formatDate(item.completedAt);
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
  content: { paddingHorizontal: 28, paddingTop: 26, paddingBottom: 32 }, filter: { alignSelf: 'flex-end', minWidth: 68, height: 27, borderRadius: 99, backgroundColor: '#F7F8EE', alignItems: 'center', justifyContent: 'center' }, filterText: { color: '#6E7A30', fontSize: 11, fontWeight: '800' },
  date: { marginTop: 16, marginBottom: 7, color: '#111', fontSize: 16, fontWeight: '900' }, item: { marginBottom: 20 }, statusBar: { height: 39, borderWidth: 2, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15 }, borrowedBorder: { borderColor: '#D0D9A0' }, lentBorder: { borderColor: '#5D442D' }, statusText: { fontSize: 14, fontWeight: '900' }, roleText: { fontSize: 14, fontWeight: '900' }, borrowedText: { color: '#A9BC42' }, lentText: { color: '#5D442D' },
  bookRow: { minHeight: 105, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, paddingTop: 10 }, cover: { width: 60, height: 88, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, bookCopy: { flex: 1, marginLeft: 19 }, bookTitle: { color: '#111', fontSize: 14, fontWeight: '800' }, bookMeta: { marginTop: 5, color: '#111', fontSize: 12, fontWeight: '700' }, otherUser: { marginTop: 6, color: '#333', fontSize: 10, fontWeight: '700' },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 30, paddingBottom: 70 }, emptyTitle: { color: '#4F4943', fontSize: 15, fontWeight: '900', marginTop: 5 }, stateText: { color: '#85818A', fontSize: 12, textAlign: 'center' },
});
