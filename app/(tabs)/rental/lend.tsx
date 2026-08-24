import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { KakaoPlacePickerModal } from '@/components/KakaoPlacePickerModal';
import { formatPublishedDate, PublishedDatePicker } from '@/components/PublishedDatePicker';
import { useLentBooks } from '@/hooks/useLentBooks';
import { MeetingPlace } from '@/models/ChatMessage';
import { LentBook, LentBookStatus } from '@/models/LentBook';
import { bookRepository } from '@/services/bookRepository';

type Mode = 'register' | 'list';

const campus = {
  placeId: 'pnu-jangjeon',
  name: '부산대학교 장전캠퍼스',
  address: '부산광역시 금정구 부산대학로63번길 2',
};

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <View style={styles.modeRow}>
      {([
        ['register', '빌려주기'],
        ['list', '대여 목록'],
      ] as const).map(([value, label]) => (
        <Pressable
          key={value}
          accessibilityRole="button"
          onPress={() => onChange(value)}
          style={[styles.modeButton, mode === value && styles.modeButtonActive]}
        >
          <Text style={[styles.modeText, mode === value && styles.modeTextActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, value, placeholder, onChangeText }: { label: string; value: string; placeholder: string; onChangeText: (value: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#85818A"
        maxLength={120}
        style={styles.input}
      />
    </View>
  );
}

function timeAgo(value?: string) {
  if (!value) return '방금 전';
  const minutes = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function dueDescription(value?: string) {
  if (!value) return '대여 기간 확인 중';
  const date = new Date(value);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
  return `${date.getMonth() + 1}월 ${date.getDate()}일까지 · ${days}일 남음`;
}

const statusConfig: Record<LentBookStatus, { label: string; color: string; background: string }> = {
  AVAILABLE: { label: '대여 가능', color: '#7A8B26', background: '#F7FAE8' },
  REQUESTED: { label: '요청 대기', color: '#D99116', background: '#FFFCF5' },
  SCHEDULED: { label: '대여 예정', color: '#7A8B26', background: '#EEF4D0' },
  BORROWED: { label: '대여 중', color: '#7A8B26', background: '#E8EDCC' },
};

function LendingCard({ book }: { book: LentBook }) {
  const status = statusConfig[book.status];
  const detail = book.status === 'REQUESTED'
    ? `요청 도착 · ${timeAgo(book.requestedAt)}`
    : book.status === 'SCHEDULED'
      ? '약속이 성사됐어요'
    : book.status === 'BORROWED'
      ? dueDescription(book.dueAt)
      : '대여 신청을 기다리고 있어요';

  return (
    <View style={[styles.lendingCard, { borderColor: status.color }]}>
      {book.coverUrl ? (
        <Image source={{ uri: book.coverUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={styles.coverFallback}>
          <Ionicons name="book-outline" size={25} color="#7A8B26" />
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text numberOfLines={1} style={styles.bookTitle}>{book.title}</Text>
        <Text numberOfLines={1} style={styles.borrower}>{book.borrowerName ? `${book.borrowerName} 님` : book.author}</Text>
        <Text numberOfLines={1} style={styles.bookDetail}>{detail}</Text>
      </View>
      <View style={[styles.statusChip, { borderColor: status.color, backgroundColor: status.background }]}>
        <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
      </View>
    </View>
  );
}

export default function LendBookScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('register');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lendingPlace, setLendingPlace] = useState<MeetingPlace>(campus);
  const [placePickerOpen, setPlacePickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { books, isLoading, error, reload } = useLentBooks(user?.uid ?? '');
  const pageWidth = Math.min(width, 620);
  const contentWidth = Math.min(338, width - 48);
  const counts = useMemo(() => ({
    requested: books.filter((book) => book.status === 'REQUESTED').length,
    borrowed: books.filter((book) => book.status === 'BORROWED' || book.status === 'SCHEDULED').length,
  }), [books]);

  const registerBook = async () => {
    if (!user) {
      Alert.alert('로그인이 필요해요', '책을 빌려주려면 부산대학교 계정으로 로그인해주세요.');
      return;
    }
    if (!title.trim() || !author.trim() || !publisher.trim() || !publishedDate) {
      Alert.alert('입력을 확인해주세요', '책 제목, 작가, 출판사, 출간일을 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await bookRepository.createBook(user.uid, {
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        publishedDate: publishedDate.toISOString(),
        isLendable: true,
        lendingPlace: {
          placeId: lendingPlace.placeId ?? 'custom-lending-place',
          name: lendingPlace.name,
          address: lendingPlace.address,
          ...(typeof lendingPlace.latitude === 'number'
            ? { latitude: lendingPlace.latitude }
            : {}),
          ...(typeof lendingPlace.longitude === 'number'
            ? { longitude: lendingPlace.longitude }
            : {}),
        },
      });
      setTitle('');
      setAuthor('');
      setPublisher('');
      setPublishedDate(null);
      await reload();
      setMode('list');
    } catch (registerError) {
      console.error('빌려줄 책 등록 실패:', registerError);
      Alert.alert('등록하지 못했어요', 'Firestore 연결을 확인한 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={[styles.page, { width: pageWidth }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()} style={styles.topIcon}>
            <Ionicons name="arrow-back" size={23} color="#1C1B1F" />
          </Pressable>
          <Text style={styles.screenTitle}>빌려줄래요</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="홈으로 이동" hitSlop={12} onPress={() => router.replace('/(tabs)/home')} style={styles.topIcon}>
            <Ionicons name="home-outline" size={24} color="#1C1B1F" />
          </Pressable>
        </View>

        <ModeSwitch mode={mode} onChange={setMode} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`대여 장소 선택, 현재 ${lendingPlace.name}`}
          onPress={() => setPlacePickerOpen(true)}
          style={({ pressed }) => [styles.campusRow, pressed && styles.pressed]}
        >
          <Ionicons name="location-outline" size={21} color="#A0B243" />
          <View style={styles.campusCopy}>
            <Text numberOfLines={1} style={styles.campusText}>{lendingPlace.name}</Text>
            <Text numberOfLines={1} style={styles.campusAddress}>{lendingPlace.address}</Text>
          </View>
          <Text style={styles.placeChange}>장소 선택</Text>
          <Ionicons name="chevron-forward" size={17} color="#A0B243" />
        </Pressable>

        {mode === 'register' ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            <View style={{ width: contentWidth }}>
              <Text style={styles.formTitle}>책 정보를 입력해 주세요</Text>
              <Field label="책 제목" value={title} onChangeText={setTitle} placeholder="제목을 입력하세요." />
              <Field label="작가" value={author} onChangeText={setAuthor} placeholder="작가를 입력하세요." />
              <Field label="출판사" value={publisher} onChangeText={setPublisher} placeholder="출판사를 입력하세요." />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>출간일</Text>
                <Pressable onPress={() => setCalendarOpen((current) => !current)} style={styles.dateInput}>
                  <Text style={[styles.dateText, !publishedDate && styles.placeholder]}>
                    {publishedDate ? formatPublishedDate(publishedDate) : '출간일을 선택하세요.'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color="#7A8B26" />
                </Pressable>
              </View>
              {calendarOpen ? (
                <PublishedDatePicker selected={publishedDate} onSelect={(date) => { setPublishedDate(date); setCalendarOpen(false); }} />
              ) : null}
              <View style={styles.notice}>
                <Text style={styles.noticeText}>등록 후 대여 가능 사용자가 검색할 수 있어요.</Text>
              </View>
              <Pressable disabled={saving} onPress={() => void registerBook()} style={({ pressed }) => [styles.submitButton, (pressed || saving) && styles.pressed]}>
                {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>등록하기</Text>}
              </Pressable>
            </View>
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listScroll}>
            <View style={[styles.listHeading, { width: contentWidth }]}>
              <Text style={styles.listTitle}>빌려준 책</Text>
              <Text style={styles.listSummary}>전체 {books.length} · 요청 대기 {counts.requested} · 대여 중 {counts.borrowed}</Text>
            </View>
            {isLoading ? (
              <View style={styles.state}><ActivityIndicator color="#A0B243" /></View>
            ) : error ? (
              <View style={styles.state}>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable onPress={() => void reload()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable>
              </View>
            ) : books.length === 0 ? (
              <View style={styles.state}>
                <Ionicons name="book-outline" size={38} color="#B1B1B1" />
                <Text style={styles.emptyTitle}>아직 빌려준 책이 없어요.</Text>
                <Text style={styles.stateText}>빌려주기에서 책을 등록해보세요.</Text>
              </View>
            ) : (
              <View style={[styles.cards, { width: contentWidth }]}>
                {books.map((book) => <LendingCard key={book.id} book={book} />)}
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
      <KakaoPlacePickerModal
        visible={placePickerOpen}
        title="대여 장소 선택"
        initialPlace={lendingPlace}
        onClose={() => setPlacePickerOpen(false)}
        onSelect={setLendingPlace}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1, alignSelf: 'center', backgroundColor: '#FFFFFF' },
  topBar: { height: 57, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  topIcon: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { color: '#151310', fontSize: 18, fontWeight: '800' },
  modeRow: { flexDirection: 'row', alignSelf: 'center', gap: 4, marginTop: 5 },
  modeButton: { width: 72, height: 28, borderWidth: 1, borderColor: '#5D442D', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { borderColor: '#A2B155', backgroundColor: '#A2B155' },
  modeText: { color: '#5D442D', fontSize: 12, fontWeight: '800' },
  modeTextActive: { color: '#FFFFFF' },
  campusRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, marginHorizontal: 24, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E3E8C9', borderRadius: 12, backgroundColor: '#FAFCEB' },
  campusCopy: { flex: 1, minWidth: 0 },
  campusText: { color: '#171513', fontSize: 13, fontWeight: '800' },
  campusAddress: { marginTop: 3, color: '#7A746E', fontSize: 10 },
  placeChange: { color: '#7A8B26', fontSize: 11, fontWeight: '800' },
  formScroll: { alignItems: 'center', paddingTop: 25, paddingBottom: 32 },
  formTitle: { color: '#362E29', fontSize: 20, lineHeight: 28, fontWeight: '800', marginBottom: 12 },
  field: { marginTop: 11 },
  fieldLabel: { color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800', marginBottom: 6, marginLeft: 6 },
  input: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 0, color: '#312A25', fontSize: 14 },
  dateInput: { width: '100%', height: 42, borderWidth: 1, borderColor: '#7F7F7F', borderRadius: 7, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateText: { color: '#312A25', fontSize: 14 },
  placeholder: { color: '#85818A' },
  notice: { height: 42, justifyContent: 'center', marginTop: 16, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F7F5EB' },
  noticeText: { color: '#706659', fontSize: 13 },
  submitButton: { height: 44, marginTop: 10, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A0B243' },
  submitText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  listScroll: { alignItems: 'center', paddingTop: 25, paddingBottom: 32 },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  listTitle: { color: '#1C1B1F', fontSize: 16, lineHeight: 24, fontWeight: '800' },
  listSummary: { color: '#7A8B26', fontSize: 12, fontWeight: '700' },
  cards: { gap: 16 },
  lendingCard: { height: 116, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, borderWidth: 1, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  cover: { width: 56, height: 82, borderRadius: 8, backgroundColor: '#F7F5EB' },
  coverFallback: { width: 56, height: 82, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F5EB' },
  bookInfo: { flex: 1, gap: 4, marginLeft: 12, marginRight: 7 },
  bookTitle: { color: '#1C1B1F', fontSize: 14, lineHeight: 20, fontWeight: '800' },
  borrower: { color: '#5F5D58', fontSize: 13, lineHeight: 18 },
  bookDetail: { color: '#B1B1B1', fontSize: 11, lineHeight: 16 },
  statusChip: { minWidth: 72, height: 28, paddingHorizontal: 10, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontSize: 10, fontWeight: '800' },
  state: { minHeight: 300, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { color: '#4F4943', fontSize: 15, fontWeight: '800', marginTop: 5 },
  stateText: { color: '#8A827A', fontSize: 13, textAlign: 'center' },
  retry: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, backgroundColor: '#E8EDCC' },
  retryText: { color: '#6E7A30', fontSize: 12, fontWeight: '800' },
  pressed: { opacity: 0.62 },
});
