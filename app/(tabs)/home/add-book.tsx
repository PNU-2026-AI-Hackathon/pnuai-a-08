import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useBookDetail } from '@/hooks/useBookDetail';
import { useReadingRecord } from '@/hooks/useReadingRecord';
import { ReadingStatus } from '@/models/ReadingRecord';
import { bookOcrService } from '@/services/bookOcrService';
import { createOwnedBook, updateOwnedBook } from '@/services/bookCreationService';
import { GoogleBookCandidate, googleBooksRepository } from '@/services/googleBooksRepository';

type CalendarTarget = 'published' | 'started' | 'finished';
type CoverSource = 'google' | 'local';
const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function parseGooglePublishedDate(value?: string) {
  if (!value) return null;
  const [year, month = '1', day = '1'] = value.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  return Number.isNaN(date.getTime()) ? null : date;
}

function CalendarPicker({ selected, onSelect }: { selected: Date | null; onSelect: (date: Date) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = useMemo(() => [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => index + 1),
  ], [firstDay, lastDate]);

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>{year}년 {month + 1}월</Text>
        <View style={styles.calendarArrows}>
          <Pressable accessibilityLabel="이전 달" hitSlop={10} onPress={() => setVisibleMonth(new Date(year, month - 1, 1))}><Ionicons name="chevron-back" size={25} color="#6E7A30" /></Pressable>
          <Pressable accessibilityLabel="다음 달" hitSlop={10} onPress={() => setVisibleMonth(new Date(year, month + 1, 1))}><Ionicons name="chevron-forward" size={25} color="#6E7A30" /></Pressable>
        </View>
      </View>
      <View style={styles.weekRow}>{weekDays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}</View>
      <View style={styles.dateGrid}>
        {cells.map((day, index) => {
          const active = Boolean(day && selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day);
          return (
            <Pressable key={`${day ?? 'blank'}-${index}`} disabled={!day} onPress={() => day && onSelect(new Date(year, month, day, 12))} style={[styles.dateCell, active && styles.dateCellSelected]}>
              <Text style={[styles.dateText, active && styles.dateTextSelected]}>{day ?? ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TextField({ label, value, placeholder, onChangeText, numeric = false, maxLength = 120 }: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  numeric?: boolean;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#85818A"
        keyboardType={numeric ? 'number-pad' : 'default'}
        style={styles.input}
        maxLength={maxLength}
      />
    </View>
  );
}

function DateField({ label, value, onPress }: { label: string; value: Date | null; onPress: () => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.dateInput}>
        <Text style={[styles.dateInputText, !value && styles.placeholder]}>{value ? formatDate(value) : '날짜를 선택해주세요'}</Text>
        <Ionicons name="calendar-outline" size={19} color="#6E7A30" />
      </Pressable>
    </View>
  );
}

export default function AddBookScreen() {
  const { bookId } = useLocalSearchParams<{ bookId?: string }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const detail = useBookDetail(bookId ?? '');
  const readingDetail = useReadingRecord(bookId ?? '', user?.uid ?? '');
  const hydratedBookId = useRef<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState<Date | null>(null);
  const [readingStatus, setReadingStatus] = useState<ReadingStatus>('READING');
  const [statusOpen, setStatusOpen] = useState(false);
  const [totalPages, setTotalPages] = useState('');
  const [currentPage, setCurrentPage] = useState('');
  const [startedAt, setStartedAt] = useState<Date | null>(new Date());
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const [rating, setRating] = useState(0);
  const [oneLineReview, setOneLineReview] = useState('');
  const [coverLocalUri, setCoverLocalUri] = useState<string>();
  const [ocrCandidates, setOcrCandidates] = useState<string[]>([]);
  const [bookCandidates, setBookCandidates] = useState<GoogleBookCandidate[]>([]);
  const [selectedBookInfo, setSelectedBookInfo] = useState<GoogleBookCandidate>();
  const [coverSource, setCoverSource] = useState<CoverSource>('local');
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [bookSearchAttempted, setBookSearchAttempted] = useState(false);
  const [calendarTarget, setCalendarTarget] = useState<CalendarTarget | null>(null);
  const [saving, setSaving] = useState(false);
  const formWidth = Math.min(329, width - 48);
  const isEditing = Boolean(bookId);

  useEffect(() => {
    const book = detail.book;
    if (!book || readingDetail.isLoading || hydratedBookId.current === book.id) return;
    const record = readingDetail.record;
    hydratedBookId.current = book.id;
    setTitle(book.title);
    setAuthor(book.author);
    setPublisher(book.publisher ?? '');
    setPublishedDate(parseDate(book.publishedDate));
    setReadingStatus(record?.status ?? 'READING');
    setTotalPages(book.totalPages ? String(book.totalPages) : '');
    setCurrentPage(record ? String(record.currentPage) : '');
    setStartedAt(parseDate(record?.startedAt) ?? new Date());
    setFinishedAt(parseDate(record?.finishedAt));
    setRating(record?.rating ?? 0);
    setOneLineReview(record?.oneLineReview ?? '');
  }, [detail.book, readingDetail.isLoading, readingDetail.record]);

  const selectedCalendarDate = calendarTarget === 'published' ? publishedDate : calendarTarget === 'started' ? startedAt : finishedAt;
  const chooseDate = (date: Date) => {
    if (calendarTarget === 'published') setPublishedDate(date);
    if (calendarTarget === 'started') setStartedAt(date);
    if (calendarTarget === 'finished') setFinishedAt(date);
    setCalendarTarget(null);
  };
  const calendarFor = (target: CalendarTarget) => calendarTarget === target
    ? <CalendarPicker selected={selectedCalendarDate} onSelect={chooseDate} />
    : null;

  const applyBookCandidate = (candidate: GoogleBookCandidate) => {
    setSelectedBookInfo(candidate);
    if (candidate.coverUrl) setCoverSource('google');
    setTitle(candidate.title);
    setAuthor(candidate.author);
    setPublisher(candidate.publisher ?? '');
    const nextPublishedDate = parseGooglePublishedDate(candidate.publishedDate);
    if (nextPublishedDate) setPublishedDate(nextPublishedDate);
    if (candidate.totalPages) {
      setTotalPages(String(candidate.totalPages));
      setCurrentPage((current) => current || '0');
    }
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
    } catch (error) {
      console.error('Google Books 검색 실패:', error);
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
    } catch (error) {
      console.error('OCR 실패:', error);
      setImportError('이미지에서 책 정보를 읽지 못했어요.');
    } finally {
      setImportLoading(false);
    }
  };

  const saveBook = async () => {
    if (!user) {
      Alert.alert('로그인이 필요해요', '나의 책을 저장하려면 부산대학교 계정으로 로그인해주세요.');
      return;
    }
    if (!title.trim() || !author.trim() || !publisher.trim() || !publishedDate) {
      Alert.alert('입력을 확인해주세요', '책 제목, 작가, 출판사, 출간일을 모두 입력해주세요.');
      return;
    }
    const total = Number(totalPages);
    const progress = readingStatus === 'COMPLETED' ? total : Number(currentPage);
    if (!Number.isInteger(total) || total <= 0) {
      Alert.alert('총 페이지 수를 확인해주세요', '1 이상의 숫자로 입력해주세요.');
      return;
    }
    if (!Number.isInteger(progress) || progress < 0 || progress > total) {
      Alert.alert('독서량을 확인해주세요', `0부터 ${total} 사이의 페이지 수를 입력해주세요.`);
      return;
    }
    if (!startedAt || (readingStatus === 'COMPLETED' && !finishedAt)) {
      Alert.alert('독서 기간을 확인해주세요', '시작일과 종료일을 선택해주세요.');
      return;
    }
    if (finishedAt && finishedAt.getTime() < startedAt.getTime()) {
      Alert.alert('독서 기간을 확인해주세요', '종료일은 시작일보다 빠를 수 없어요.');
      return;
    }
    if (readingStatus === 'COMPLETED' && rating === 0) {
      Alert.alert('평점을 선택해주세요', '책에 대한 평점을 1점부터 5점까지 선택해주세요.');
      return;
    }

    const input = {
      ownerId: user.uid,
      title: title.trim(),
      author: author.trim(),
      publisher: publisher.trim(),
      publishedDate: publishedDate.toISOString(),
      readingStatus,
      totalPages: total,
      currentPage: progress,
      readingStartedAt: startedAt.toISOString(),
      coverLocalUri: coverSource === 'local' ? coverLocalUri : undefined,
      coverUrl: coverSource === 'google' ? selectedBookInfo?.coverUrl : undefined,
      isbn: selectedBookInfo?.isbn,
      description: selectedBookInfo?.description,
      ...(readingStatus === 'COMPLETED' && finishedAt ? { readingFinishedAt: finishedAt.toISOString(), rating, oneLineReview: oneLineReview.trim() } : {}),
    };

    setSaving(true);
    try {
      if (bookId) await updateOwnedBook({ ...input, bookId });
      else await createOwnedBook(input);
      router.back();
    } catch (error) {
      console.error('책 기록 저장 실패:', error);
      Alert.alert('책 기록을 저장하지 못했어요', 'Firestore 연결과 로그인 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  if (isEditing && (detail.isLoading || readingDetail.isLoading)) {
    return <SafeAreaView style={styles.safeArea}><View style={styles.loading}><ActivityIndicator color="#A0B243" size="large" /></View></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={23} color="#1A1714" /></Pressable>
          <Text style={styles.screenTitle}>책 추가하기</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <Image source={require('../../../assets/images/rental-symbol.png')} style={styles.symbol} resizeMode="contain" />

          {!isEditing ? (
            <Pressable disabled={importLoading} onPress={() => void pickImageAndImport()} style={({ pressed }) => [styles.coverPicker, { width: formWidth }, (pressed || importLoading) && styles.pressed]}>
              {coverLocalUri ? (
                <Image source={{ uri: coverLocalUri }} style={styles.coverPreview} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="images-outline" size={34} color="#5D442D" />
                  <Text style={styles.coverPickerText}>사진 선택</Text>
                  <Text style={styles.coverPickerPending}>OCR 후보를 뽑고 표지로도 사용할게요</Text>
                </>
              )}
              </Pressable>
          ) : null}

          <View style={{ width: formWidth }}>
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
            <TextField label="책 제목" value={title} onChangeText={setTitle} placeholder="제목을 입력하세요." />
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
            <TextField label="작가" value={author} onChangeText={setAuthor} placeholder="작가를 입력하세요." />
            <TextField label="출판사" value={publisher} onChangeText={setPublisher} placeholder="출판사를 입력하세요." />
            <DateField label="출간일" value={publishedDate} onPress={() => setCalendarTarget('published')} />
            {calendarFor('published')}

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>독서 상태</Text>
              <Pressable onPress={() => setStatusOpen((current) => !current)} style={[styles.selectInput, readingStatus === 'COMPLETED' && styles.selectInputCompleted]}>
                <Text style={[styles.selectText, readingStatus === 'COMPLETED' && styles.selectTextCompleted]}>{readingStatus === 'READING' ? '읽는 중' : '완독'}</Text>
                <Ionicons name="chevron-down" size={19} color={readingStatus === 'READING' ? '#6E7A30' : '#C0DA3B'} />
              </Pressable>
              {statusOpen ? (
                <View style={styles.statusMenu}>
                  {(['READING', 'COMPLETED'] as ReadingStatus[]).map((status) => (
                    <Pressable key={status} onPress={() => { setReadingStatus(status); setStatusOpen(false); }} style={styles.statusOption}>
                      <Text style={styles.statusOptionText}>{status === 'READING' ? '읽는 중' : '완독'}</Text>
                      {readingStatus === status ? <Ionicons name="checkmark" size={18} color="#A0B243" /> : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <TextField label="총 페이지 수" value={totalPages} onChangeText={setTotalPages} placeholder="총 페이지 수를 입력해주세요" numeric maxLength={6} />
            {readingStatus === 'READING' ? <TextField label="독서량" value={currentPage} onChangeText={setCurrentPage} placeholder="읽은 페이지 수를 입력해주세요" numeric maxLength={6} /> : null}

            <Text style={styles.periodTitle}>독서 기간</Text>
            <DateField label="시작일" value={startedAt} onPress={() => setCalendarTarget('started')} />
            {calendarFor('started')}
            {readingStatus === 'COMPLETED' ? (
              <>
                <DateField label="종료일" value={finishedAt} onPress={() => setCalendarTarget('finished')} />
                {calendarFor('finished')}
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>평점</Text>
                  <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((score) => (
                      <Pressable key={score} accessibilityLabel={`${score}점`} onPress={() => setRating(score)} hitSlop={7}>
                        <Ionicons name={score <= rating ? 'star' : 'star-outline'} size={27} color={score <= rating ? '#A0B243' : '#D9D9D9'} />
                      </Pressable>
                    ))}
                  </View>
                </View>
                <TextField label="한줄평" value={oneLineReview} onChangeText={setOneLineReview} placeholder="짧은 감상평을 남겨보세요." maxLength={100} />
              </>
            ) : null}

            <Pressable disabled={saving} onPress={() => void saveBook()} style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>{isEditing ? '기록 저장하기' : '등록하기'}</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, page: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { height: 57, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8B8986' },
  backButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' }, screenTitle: { color: '#151310', fontSize: 18, fontWeight: '800' },
  content: { alignItems: 'center', paddingTop: 37, paddingBottom: 122 }, symbol: { width: 44, height: 42 },
  ocrButton: { height: 38, marginTop: 18, borderWidth: 2, borderColor: '#C0DA3B', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  ocrText: { color: '#B8CF46', fontSize: 14, fontWeight: '800' },
  coverPicker: { height: 171, marginTop: 28, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A2B155', borderRadius: 16, backgroundColor: '#FFFCF5', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 },
  coverPickerText: { color: '#5D442D', fontSize: 14, fontWeight: '800' }, coverPickerPending: { color: '#85818A', fontSize: 11 },
  coverPreview: { width: 92, height: 132, alignSelf: 'center', marginTop: 12, borderRadius: 8, backgroundColor: '#F4F0E8' },
  loadInfoButton: { minHeight: 40, marginTop: 12, borderWidth: 1.5, borderColor: '#A2B155', borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#FFFFFF' },
  coverMiniButton: { minHeight: 38, marginTop: 8, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: '#F7F5EB' },
  loadInfoText: { color: '#6E7A30', fontSize: 13, fontWeight: '800' },
  importStatus: { marginTop: 12 },
  importError: { marginTop: 10, color: '#B64E43', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  candidateSection: { marginTop: 14, gap: 8 },
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
  field: { marginTop: 18 }, fieldLabel: { color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800', marginBottom: 7 },
  input: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 0, color: '#312A25', fontSize: 14 },
  dateInput: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInputText: { color: '#312A25', fontSize: 14 }, placeholder: { color: '#85818A' },
  selectInput: { height: 42, borderWidth: 1, borderColor: '#6E7A30', borderRadius: 7, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectInputCompleted: { borderColor: '#C0DA3B' }, selectText: { color: '#6E7A30', fontSize: 14, fontWeight: '600' }, selectTextCompleted: { color: '#C0DA3B' },
  statusMenu: { marginTop: 5, borderWidth: 1, borderColor: '#DAD6CB', borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFF', elevation: 4 },
  statusOption: { height: 43, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E8E5DF' }, statusOptionText: { color: '#3B342E', fontSize: 14 },
  periodTitle: { color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800', marginTop: 25 },
  ratingRow: { height: 38, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 2 },
  calendar: { marginTop: 16, paddingHorizontal: 12, paddingTop: 17, paddingBottom: 18, borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 5 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 14 }, calendarTitle: { color: '#6E7A30', fontSize: 20, fontWeight: '800' }, calendarArrows: { flexDirection: 'row', gap: 16 },
  weekRow: { flexDirection: 'row' }, weekDay: { width: `${100 / 7}%`, color: '#B7B7B7', fontSize: 12, textAlign: 'center', paddingVertical: 7 }, dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 }, dateCellSelected: { backgroundColor: '#6E7A30' }, dateText: { color: '#6E7A30', fontSize: 18 }, dateTextSelected: { color: '#FFF', fontWeight: '800' },
  saveButton: { height: 47, marginTop: 24, borderRadius: 12, backgroundColor: '#A2B155', alignItems: 'center', justifyContent: 'center' }, saveText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.65 },
});
