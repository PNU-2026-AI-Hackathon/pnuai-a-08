import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { bookCoverRepository } from '@/services/bookCoverRepository';
import { bookOcrService } from '@/services/bookOcrService';
import { bookRepository } from '@/services/bookRepository';
import { GoogleBookCandidate, googleBooksRepository } from '@/services/googleBooksRepository';
import { formatReturnDday } from '@/utils/rentalDate';

type Mode = 'register' | 'list';
type CoverSource = 'google' | 'local';

const campus = {
  placeId: 'pnu-jangjeon',
  name: '부산대학교 장전캠퍼스',
  address: '부산광역시 금정구 부산대학로63번길 2',
};

function parseGooglePublishedDate(value?: string) {
  if (!value) return null;
  const [year, month = '1', day = '1'] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <View style={styles.modeRow}>
      {([
        ['register', '빌려주기'],
        ['list', '빌려준 책들'],
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
      ? `대여중 · ${formatReturnDday(book.dueAt)}`
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
        <Text numberOfLines={1} style={styles.borrower}>{book.borrowerName ? `${book.borrowerName}님이 현재 빌렸어요!` : book.author}</Text>
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
  const [coverLocalUri, setCoverLocalUri] = useState<string>();
  const [ocrCandidates, setOcrCandidates] = useState<string[]>([]);
  const [bookCandidates, setBookCandidates] = useState<GoogleBookCandidate[]>([]);
  const [selectedBookInfo, setSelectedBookInfo] = useState<GoogleBookCandidate>();
  const [coverSource, setCoverSource] = useState<CoverSource>('local');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [bookSearchAttempted, setBookSearchAttempted] = useState(false);
  const { books, isLoading, error, reload } = useLentBooks(user?.uid ?? '');
  const pageWidth = Math.min(width, 620);
  const contentWidth = Math.min(338, width - 48);
  const counts = useMemo(() => ({
    requested: books.filter((book) => book.status === 'REQUESTED').length,
    borrowed: books.filter((book) => book.status === 'BORROWED' || book.status === 'SCHEDULED').length,
  }), [books]);

  const applyBookCandidate = (candidate: GoogleBookCandidate) => {
    setSelectedBookInfo(candidate);
    if (candidate.coverUrl) setCoverSource('google');
    setTitle(candidate.title);
    setAuthor(candidate.author);
    setPublisher(candidate.publisher ?? '');
    const nextPublishedDate = parseGooglePublishedDate(candidate.publishedDate);
    if (nextPublishedDate) setPublishedDate(nextPublishedDate);
    setBookCandidates([]);
    setOcrCandidates([]);
    setBookSearchAttempted(false);
  };

  const searchGoogleBooks = async (keyword = title) => {
    const query = keyword.trim();
    if (!query) {
      Alert.alert('책 제목을 입력해주세요', '검색할 책 제목을 먼저 입력해주세요.');
      return;
    }
    setImportLoading(true);
    setImportError(null);
    setBookSearchAttempted(true);
    try {
      const results = await googleBooksRepository.search(query);
      setBookCandidates(results);
      if (results.length === 0) setImportError('검색된 책이 없어요.');
    } catch (searchError) {
      console.error('Google Books 검색 실패:', searchError);
      setImportError('책 정보를 불러오지 못했어요.');
    } finally {
      setImportLoading(false);
    }
  };

  const useManualEntry = () => {
    setBookCandidates([]);
    setImportError(null);
    setSelectedBookInfo(undefined);
    setCoverSource('local');
    setBookSearchAttempted(false);
  };

  const pickImageAndImport = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setCoverLocalUri(uri);
    if (!selectedBookInfo?.coverUrl) setCoverSource('local');
    setImportLoading(true);
    setImportError(null);
    setBookCandidates([]);
    setBookSearchAttempted(false);
    try {
      const candidates = await bookOcrService.extractTitleCandidates(uri);
      setOcrCandidates(candidates);
      const first = candidates[0];
      if (!first) {
        setImportError('책 제목 후보를 찾지 못했어요.');
        return;
      }
    } catch (ocrError) {
      console.error('OCR 실패:', ocrError);
      setImportError('이미지에서 책 정보를 읽지 못했어요.');
    } finally {
      setImportLoading(false);
    }
  };

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
      const selectedGoogleCoverUrl = coverSource === 'google' ? selectedBookInfo?.coverUrl : undefined;
      const cover = !selectedGoogleCoverUrl && coverLocalUri
        ? await bookCoverRepository.upload(user.uid, coverLocalUri)
        : undefined;
      await bookRepository.createBook(user.uid, {
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        publishedDate: publishedDate.toISOString(),
        isbn: selectedBookInfo?.isbn,
        description: selectedBookInfo?.description,
        totalPages: selectedBookInfo?.totalPages,
        coverUrl: selectedGoogleCoverUrl ?? cover?.url,
        coverStoragePath: cover?.storagePath,
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
      setCoverLocalUri(undefined);
      setSelectedBookInfo(undefined);
      setCoverSource('local');
      setOcrCandidates([]);
      setBookCandidates([]);
      setBookSearchAttempted(false);
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
      <KeyboardAvoidingView style={[styles.page, { width: pageWidth }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
        {mode === 'register' ? (
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            <View style={{ width: contentWidth }}>
              <Pressable disabled={importLoading} onPress={() => void pickImageAndImport()} style={({ pressed }) => [styles.coverPicker, (pressed || importLoading) && styles.pressed]}>
                {coverLocalUri ? (
                  <Image source={{ uri: coverLocalUri }} style={styles.coverPreview} resizeMode="cover" />
                ) : (
                  <>
                    <Ionicons name="images-outline" size={28} color="#5D442D" />
                    <Text style={styles.coverPickerText}>사진 선택</Text>
                    <Text style={styles.coverPickerHint}>OCR 후보를 뽑고 표지로도 사용할게요</Text>
                  </>
                )}
              </Pressable>
              {importLoading ? <ActivityIndicator color="#A0B243" style={styles.importStatus} /> : null}
              {importError ? <Text style={styles.importError}>{importError}</Text> : null}
              {ocrCandidates.length > 0 ? (
                <View style={styles.candidateSection}>
                  <Text style={styles.candidateTitle}>OCR 제목 후보</Text>
                  {ocrCandidates.map((candidate) => (
                    <Pressable key={candidate} onPress={() => setTitle(candidate)} style={styles.ocrCandidate}>
                      <Text style={styles.ocrCandidateText}>{candidate}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
              <Text style={styles.formTitle}>책 정보를 입력해 주세요</Text>
              <Field label="책 제목" value={title} onChangeText={setTitle} placeholder="제목을 입력하세요." />
              <Pressable disabled={importLoading} onPress={() => void searchGoogleBooks()} style={({ pressed }) => [styles.loadInfoButton, (pressed || importLoading) && styles.pressed]}>
                <Text style={styles.loadInfoText}>제목으로 정보 불러오기</Text>
              </Pressable>
              {bookSearchAttempted && !importLoading && bookCandidates.length === 0 ? (
                <Pressable onPress={useManualEntry} style={styles.manualEntryButton}>
                  <Text style={styles.manualEntryText}>응답이 없어요. 그냥 직접 입력할게요</Text>
                </Pressable>
              ) : null}
              {bookCandidates.length > 0 ? (
                <View style={styles.candidateSection}>
                  <Text style={styles.candidateTitle}>책 후보</Text>
                  {bookCandidates.map((candidate) => (
                    <Pressable key={`${candidate.title}-${candidate.isbn ?? candidate.author}`} onPress={() => applyBookCandidate(candidate)} style={styles.bookCandidate}>
                      {candidate.coverUrl ? <Image source={{ uri: candidate.coverUrl }} style={styles.candidateCover} /> : <View style={styles.candidateCoverFallback}><Ionicons name="book-outline" size={18} color="#7A8B26" /></View>}
                      <View style={styles.candidateCopy}>
                        <Text numberOfLines={1} style={styles.candidateBookTitle}>{candidate.title}</Text>
                        <Text numberOfLines={1} style={styles.candidateMeta}>{candidate.author || '저자 미상'} {candidate.publisher ? `· ${candidate.publisher}` : ''}</Text>
                      </View>
                    </Pressable>
                  ))}
                  <Pressable onPress={useManualEntry} style={styles.manualEntryButton}>
                    <Text style={styles.manualEntryText}>원하는 책이 없어요. 직접 입력할게요</Text>
                  </Pressable>
                </View>
              ) : null}
              {selectedBookInfo?.coverUrl && coverLocalUri ? (
                <View style={styles.coverChoice}>
                  <Text style={styles.candidateTitle}>저장할 표지</Text>
                  <View style={styles.coverChoiceRow}>
                    <Pressable onPress={() => setCoverSource('google')} style={[styles.coverChoiceOption, coverSource === 'google' && styles.coverChoiceActive]}>
                      <Image source={{ uri: selectedBookInfo.coverUrl }} style={styles.coverChoiceImage} />
                      <Text style={styles.coverChoiceText}>Google Books</Text>
                    </Pressable>
                    <Pressable onPress={() => setCoverSource('local')} style={[styles.coverChoiceOption, coverSource === 'local' && styles.coverChoiceActive]}>
                      <Image source={{ uri: coverLocalUri }} style={styles.coverChoiceImage} />
                      <Text style={styles.coverChoiceText}>내 사진</Text>
                    </Pressable>
                  </View>
                </View>
              ) : null}
              <Field label="작가" value={author} onChangeText={setAuthor} placeholder="작가를 입력하세요." />
              <Field label="출판사" value={publisher} onChangeText={setPublisher} placeholder="출판사를 입력하세요." />
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>출간일</Text>
                <Pressable
                  onPress={() => {
                    if (!calendarOpen && !publishedDate) setPublishedDate(new Date());
                    setCalendarOpen((current) => !current);
                  }}
                  style={[styles.dateInput, (calendarOpen || publishedDate) && styles.dateInputSelected]}
                >
                  <Text style={[styles.dateLabel, (calendarOpen || publishedDate) && styles.dateLabelSelected]}>출간일</Text>
                  <Text numberOfLines={1} style={[styles.dateText, !publishedDate && styles.placeholder, (calendarOpen || publishedDate) && styles.dateTextSelected]}>
                    {publishedDate ? formatPublishedDate(publishedDate) : '선택'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={calendarOpen || publishedDate ? '#B7D52C' : '#555'} />
                </Pressable>
              </View>
              {calendarOpen ? (
                <PublishedDatePicker selected={publishedDate} onSelect={setPublishedDate} />
              ) : null}
              <Text style={styles.placeFieldLabel}>선호 대여 위치</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`대여 장소 선택, 현재 ${lendingPlace.name}`}
                onPress={() => setPlacePickerOpen(true)}
                style={({ pressed }) => [styles.campusRow, styles.formCampusRow, pressed && styles.pressed]}
              >
                <Ionicons name="location-outline" size={21} color="#A0B243" />
                <View style={styles.campusCopy}>
                  <Text numberOfLines={1} style={styles.campusText}>{lendingPlace.name}</Text>
                  <Text numberOfLines={1} style={styles.campusAddress}>{lendingPlace.address}</Text>
                </View>
                <Text style={styles.placeChange}>장소 선택</Text>
                <Ionicons name="chevron-forward" size={17} color="#A0B243" />
              </Pressable>
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
  formCampusRow: { marginHorizontal: 0, marginTop: 12 },
  campusCopy: { flex: 1, minWidth: 0 },
  campusText: { color: '#171513', fontSize: 13, fontWeight: '800' },
  campusAddress: { marginTop: 3, color: '#7A746E', fontSize: 10 },
  placeChange: { color: '#7A8B26', fontSize: 11, fontWeight: '800' },
  formScroll: { alignItems: 'center', paddingTop: 25, paddingBottom: 32 },
  formTitle: { color: '#362E29', fontSize: 20, lineHeight: 28, fontWeight: '800', marginBottom: 12 },
  importButton: { minHeight: 42, marginBottom: 9, borderWidth: 1.5, borderColor: '#A2B155', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF' },
  importButtonText: { color: '#6E7A30', fontSize: 13, fontWeight: '800' },
  coverPicker: { minHeight: 88, marginBottom: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A2B155', borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFFCF5' },
  coverPickerText: { color: '#5D442D', fontSize: 13, fontWeight: '800' },
  coverPickerHint: { color: '#85818A', fontSize: 11 },
  coverPreview: { width: 58, height: 82, borderRadius: 8, backgroundColor: '#F4F0E8' },
  loadInfoButton: { minHeight: 38, marginTop: 8, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#F7F5EB' },
  loadInfoText: { color: '#6E7A30', fontSize: 13, fontWeight: '800' },
  importStatus: { marginVertical: 8 },
  importError: { marginTop: 8, color: '#B64E43', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  candidateSection: { marginTop: 12, gap: 8 },
  candidateTitle: { color: '#151310', fontSize: 13, fontWeight: '900' },
  ocrCandidate: { minHeight: 34, borderRadius: 10, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#F1F5DC' },
  ocrCandidateText: { color: '#4F5630', fontSize: 13, fontWeight: '800' },
  bookCandidate: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#E5E2DC', borderRadius: 12, padding: 10, backgroundColor: '#FFF' },
  manualEntryButton: { minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#F7F5EB' },
  manualEntryText: { color: '#5D442D', fontSize: 12, fontWeight: '800' },
  coverChoice: { marginTop: 14, gap: 8 },
  coverChoiceRow: { flexDirection: 'row', gap: 10 },
  coverChoiceOption: { flex: 1, minHeight: 104, borderWidth: 1, borderColor: '#E5E2DC', borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#FFF' },
  coverChoiceActive: { borderColor: '#A2B155', backgroundColor: '#F7FAE8' },
  coverChoiceImage: { width: 42, height: 58, borderRadius: 5, backgroundColor: '#F4F0E8' },
  coverChoiceText: { color: '#4F5630', fontSize: 12, fontWeight: '800' },
  candidateCover: { width: 36, height: 52, borderRadius: 5, backgroundColor: '#F4F0E8' },
  candidateCoverFallback: { width: 36, height: 52, borderRadius: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F0E8' },
  candidateCopy: { flex: 1, minWidth: 0 },
  candidateBookTitle: { color: '#222', fontSize: 13, fontWeight: '900' },
  candidateMeta: { marginTop: 4, color: '#777', fontSize: 11 },
  field: { marginTop: 11 },
  fieldLabel: { color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800', marginBottom: 6, marginLeft: 6 },
  placeFieldLabel: { marginTop: 14, marginLeft: 6, marginBottom: 6, color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800' },
  input: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 0, color: '#312A25', fontSize: 14 },
  dateInput: { width: '100%', height: 45, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 10, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  dateInputSelected: { borderColor: '#B7D52C' },
  dateLabel: { color: '#555555', fontSize: 14, fontWeight: '700' },
  dateLabelSelected: { color: '#A0B243' },
  dateText: { flex: 1, marginLeft: 10, color: '#555555', fontSize: 14, fontWeight: '600', textAlign: 'right' },
  dateTextSelected: { color: '#B7D52C' },
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
