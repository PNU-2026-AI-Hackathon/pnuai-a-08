import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AvailableBookCarousel } from '@/components/AvailableBookCarousel';
import { useAvailableBooks } from '@/hooks/useAvailableBooks';
import { useBorrowedRentals } from '@/hooks/useBorrowedRentals';
import { AvailableBook, LocalBookCover } from '@/models/AvailableBook';
import { BorrowedRental } from '@/models/BorrowedRental';
import { rentalRepository } from '@/services/rentalRepository';
import { formatReturnDday } from '@/utils/rentalDate';

type SearchFilter = 'ALL' | 'AVAILABLE';
type BorrowMode = 'BROWSE' | 'LIST';

const coverAssets: Record<LocalBookCover, ImageSourcePropType> = {
  current: require('../../../pictures/급류.png'),
  neruda: require('../../../pictures/네루다의 우편배달부.png'),
  contradiction: require('../../../pictures/모순.png'),
  almond: require('../../../pictures/아몬드.png'),
  pagoa: require('../../../pictures/파과.png'),
};

function normalizeTitle(value: string) {
  return value.trim().toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ');
}

function objectParticle(value: string) {
  const last = value.trim().charCodeAt(value.trim().length - 1);
  const hasBatchim = last >= 0xAC00 && last <= 0xD7A3 && (last - 0xAC00) % 28 !== 0;
  return hasBatchim ? '을' : '를';
}

function statusLabel(status: AvailableBook['status']) {
  return status === 'AVAILABLE' ? '대여 가능' : '대여 중';
}

function BookThumbnail({ book, style }: { book: AvailableBook; style: object }) {
  const source = book.localCover ? coverAssets[book.localCover] : book.coverUrl ? { uri: book.coverUrl } : null;
  if (source) return <Image source={source} resizeMode="cover" style={style} />;
  return (
    <LinearGradient colors={['#E8EDCC', '#FFF8EB']} style={[style, styles.fallbackCover]}>
      <Text numberOfLines={3} style={styles.fallbackCoverTitle}>{book.title}</Text>
    </LinearGradient>
  );
}

function BookListCard({ book, onPress }: { book: AvailableBook; onPress: () => void }) {
  const available = book.status === 'AVAILABLE';
  return (
    <Pressable disabled={!available} onPress={onPress} style={({ pressed }) => [styles.bookListCard, pressed && styles.pressed]}>
      <BookThumbnail book={book} style={styles.listCover} />
      <View style={styles.listBookInfo}>
        <Text numberOfLines={1} style={styles.listTitle}>{book.title}</Text>
        <Text numberOfLines={1} style={styles.listAuthor}>{book.author}{book.publisher ? ` · ${book.publisher}` : ''}</Text>
        <Text style={styles.listMeta}>{book.publishedYear ? `도서 · ${book.publishedYear}` : '등록 도서'}</Text>
        <View style={[styles.statusBadge, !available && styles.statusBadgeBusy]}>
          <Text style={[styles.statusBadgeText, !available && styles.statusBadgeBusyText]}>{statusLabel(book.status)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function CandidateCard({ book, index, selected, onPress }: { book: AvailableBook; index: number; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.candidate, selected && styles.candidateSelected, pressed && styles.pressed]}>
      <View style={[styles.candidateNumber, selected && styles.candidateNumberSelected]}><Text style={[styles.candidateNumberText, selected && styles.candidateNumberTextSelected]}>{index + 1}</Text></View>
      <View style={styles.candidateInfo}>
        <Text numberOfLines={1} style={styles.candidateName}>{book.ownerDisplayName}</Text>
        <Text numberOfLines={1} style={styles.candidateDepartment}>{book.ownerDepartment ?? '부산대학교 학생'}</Text>
        <Text numberOfLines={1} style={styles.candidateMeta}>{book.lendingPlace.name}</Text>
      </View>
      <View style={[styles.selectionMark, selected && styles.selectionMarkSelected]}>{selected ? <Ionicons name="checkmark" size={17} color="#FFF" /> : null}</View>
    </Pressable>
  );
}

function friendlyRequestError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message === 'LOAN_REQUEST_ALREADY_EXISTS') return '이미 이 책에 대여를 신청했어요.';
  if (message === 'BOOK_NOT_AVAILABLE') return '선택한 책 중 대여할 수 없게 된 책이 있어요.';
  if (message === 'TOO_MANY_LOAN_REQUESTS') return '한 번에 최대 3명에게 신청할 수 있어요.';
  if (message === 'TOO_MANY_ACTIVE_LOAN_REQUESTS') return '이 책에는 동시에 최대 3명에게만 신청할 수 있어요.';
  return '책 상태를 다시 확인한 뒤 시도해주세요.';
}

function formatDate(value?: string, separator = '.') {
  if (!value) return '날짜 확인 중';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '날짜 확인 중';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${separator}${month}${separator}${day}`;
}

function dateHeading(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '날짜 미정';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function maskStudentNumber(value?: string) {
  if (!value) return '';
  const normalized = value.trim();
  if (normalized.length <= 2) return '**';
  return `${normalized.slice(0, -2)}**`;
}

function RentalListCard({ rental }: { rental: BorrowedRental }) {
  const returned = rental.status === 'RETURNED';
  const scheduled = rental.status === 'SCHEDULED';
  const statusDate = returned ? rental.returnedAt ?? rental.dueAt : rental.dueAt;
  const details = [rental.book.publisher, rental.book.author, rental.book.publishedYear].filter(Boolean).join('•');
  const maskedStudentNumber = maskStudentNumber(rental.owner.studentNumber);
  const ownerAffiliation = rental.owner.department
    ? `부산대학교 ${rental.owner.department}${maskedStudentNumber ? `(${maskedStudentNumber})` : ''}`
    : rental.owner.displayName;

  return (
    <Pressable
      accessibilityLabel={`${rental.book.title} ${returned ? '반납 완료' : scheduled ? '대여 예정' : '대여 중'}`}
      onPress={() => rental.chatRoomId && router.push({ pathname: '/chat/[roomId]', params: { roomId: rental.chatRoomId } })}
      style={({ pressed }) => [styles.rentalCard, pressed && styles.pressed]}
    >
      <View style={[styles.rentalStatus, returned && styles.rentalStatusReturned]}>
        <Text numberOfLines={1} style={[styles.rentalStatusText, returned && styles.rentalStatusTextReturned]}>
          {returned
            ? `반납 완료 · ${formatDate(statusDate)} 반납`
            : scheduled
              ? `대여 예정 · ${formatDate(rental.startedAt)} 대여`
              : `대여중 · ${formatReturnDday(rental.dueAt)}`}
        </Text>
        <Text style={[styles.rentalModeText, returned && styles.rentalModeTextReturned]}>빌릴래요</Text>
      </View>
      <View style={styles.rentalBookRow}>
        {rental.book.coverUrl ? (
          <Image source={{ uri: rental.book.coverUrl }} resizeMode="cover" style={styles.rentalCover} />
        ) : (
          <LinearGradient colors={['#E8EDCC', '#FFF8EB']} style={[styles.rentalCover, styles.rentalFallback]}>
            <Text numberOfLines={4} style={styles.rentalFallbackText}>{rental.book.title}</Text>
          </LinearGradient>
        )}
        <View style={styles.rentalBookCopy}>
          <Text numberOfLines={1} style={styles.rentalBookTitle}>{rental.book.title}</Text>
          <Text numberOfLines={1} style={styles.rentalBookMeta}>{details || rental.book.author}</Text>
          <Text numberOfLines={1} style={styles.rentalOwner}>{ownerAffiliation}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function BorrowBrowseScreen() {
  const { width, height } = useWindowDimensions();
  const { user } = useAuth();
  const { books, isLoading, error, reload } = useAvailableBooks(user?.uid ?? 'guest');
  const { rentals, isLoading: rentalsLoading, error: rentalsError, reload: reloadRentals } = useBorrowedRentals(user?.uid ?? '');
  const [mode, setMode] = useState<BorrowMode>('BROWSE');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [queryText, setQueryText] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('ALL');
  const [candidateTitle, setCandidateTitle] = useState<string>();
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const pageWidth = Math.min(width, 620);
  const cardWidth = Math.min(pageWidth * 0.66, Math.max(184, (height - 425) * 0.7), 258);
  const availableBooks = useMemo(() => books.filter((book) => book.status === 'AVAILABLE'), [books]);
  const selectedBook = availableBooks[selectedIndex];
  const rentalGroups = useMemo(() => {
    const groups = new Map<string, BorrowedRental[]>();
    rentals.forEach((rental) => {
      const key = dateHeading(rental.startedAt);
      groups.set(key, [...(groups.get(key) ?? []), rental]);
    });
    return [...groups.entries()];
  }, [rentals]);

  useEffect(() => {
    if (selectedIndex >= availableBooks.length) setSelectedIndex(Math.max(0, availableBooks.length - 1));
  }, [availableBooks.length, selectedIndex]);

  const searchResults = useMemo(() => {
    const query = normalizeTitle(submittedQuery);
    if (!query) return [];
    return books.filter((book) => normalizeTitle(book.title).includes(query) && (filter === 'ALL' || book.status === 'AVAILABLE'));
  }, [books, filter, submittedQuery]);

  const candidates = useMemo(() => {
    if (!candidateTitle) return [];
    const target = normalizeTitle(candidateTitle);
    const byOwner = new Map<string, AvailableBook>();
    books.forEach((book) => {
      if (book.status === 'AVAILABLE' && normalizeTitle(book.title) === target && book.ownerId !== user?.uid && !byOwner.has(book.ownerId)) byOwner.set(book.ownerId, book);
    });
    return [...byOwner.values()];
  }, [books, candidateTitle, user?.uid]);

  const openCandidates = (book: AvailableBook) => {
    if (book.status !== 'AVAILABLE') return;
    setCandidateTitle(book.title);
    setSelectedCandidateIds([]);
  };

  const selectAvailableFilter = () => {
    setFilter('AVAILABLE');
    const exactMatch = books.find((book) => book.status === 'AVAILABLE' && normalizeTitle(book.title) === normalizeTitle(submittedQuery));
    if (exactMatch) openCandidates(exactMatch);
  };

  const toggleCandidate = (bookId: string) => {
    setSelectedCandidateIds((current) => {
      if (current.includes(bookId)) return current.filter((id) => id !== bookId);
      if (current.length >= 3) {
        Alert.alert('최대 3명까지 선택할 수 있어요');
        return current;
      }
      return [...current, bookId];
    });
  };

  const requestBooks = async (bookIds: string[]) => {
    if (isRequesting || bookIds.length === 0) return;
    if (!user) {
      Alert.alert('로그인이 필요해요', '책을 빌리려면 부산대학교 계정으로 로그인해주세요.');
      return;
    }
    setIsRequesting(true);
    try {
      await rentalRepository.createLoanRequests({ bookIds, borrowerId: user.uid });
      Alert.alert('대여 신청 완료', `${bookIds.length}명에게 신청을 보냈고 채팅방이 만들어졌어요.`, [
        { text: '채팅 보기', onPress: () => router.replace('/(tabs)/community') },
      ]);
    } catch (requestError) {
      console.error('대여 신청 실패:', requestError);
      Alert.alert('대여 신청 실패', friendlyRequestError(requestError));
    } finally {
      setIsRequesting(false);
    }
  };

  if (candidateTitle) {
    const representative = candidates[0] ?? books.find((book) => normalizeTitle(book.title) === normalizeTitle(candidateTitle));
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[styles.page, { width: pageWidth }]}>
          <View style={styles.candidateHeader}>
            <Pressable accessibilityLabel="검색 결과로 돌아가기" onPress={() => setCandidateTitle(undefined)} style={styles.iconButton}><Ionicons name="chevron-back" size={23} color="#1A1714" /></Pressable>
            <Text style={styles.headerTitle}>대여 가능 사용자</Text><View style={styles.iconButton} />
          </View>
          <ScrollView contentContainerStyle={styles.candidateContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.candidateHeading}>{candidateTitle}{objectParticle(candidateTitle)} 빌릴 이웃</Text>
            {representative ? <BookListCard book={representative} onPress={() => undefined} /> : null}
            <Text style={styles.candidateGuide}>최대 3명에게 동시에 요청할 수 있어요.</Text>
            <Pressable disabled={selectedCandidateIds.length === 0 || isRequesting} onPress={() => void requestBooks(selectedCandidateIds)} style={[styles.candidateRequest, selectedCandidateIds.length === 0 && styles.candidateRequestDisabled]}>
              {isRequesting ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.candidateRequestText, selectedCandidateIds.length === 0 && styles.candidateRequestDisabledText]}>대여 신청하기</Text>}
            </Pressable>
            <View style={styles.candidateList}>
              {candidates.map((book, index) => <CandidateCard key={book.id} book={book} index={index} selected={selectedCandidateIds.includes(book.id)} onPress={() => toggleCandidate(book.id)} />)}
            </View>
            {candidates.length === 0 ? <Text style={styles.emptyText}>현재 신청할 수 있는 이웃이 없어요.</Text> : null}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  const searching = Boolean(submittedQuery);
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: pageWidth }]}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="뒤로 가기" onPress={() => searching ? (setSubmittedQuery(''), setQueryText('')) : router.back()} style={styles.iconButton}><Ionicons name="arrow-back" size={25} color="#1A1714" /></Pressable>
          <Text style={styles.headerTitle}>빌릴래요</Text>
          <Pressable accessibilityLabel="홈으로 이동" onPress={() => router.replace('/(tabs)/home')} style={styles.iconButton}><Ionicons name="home-outline" size={24} color="#1A1714" /></Pressable>
        </View>

        {!searching ? (
          <>
            <View style={styles.segmentedControl}>
              <Pressable onPress={() => setMode('BROWSE')} style={[styles.segment, mode === 'BROWSE' && styles.segmentActive]}><Text style={[styles.segmentText, mode === 'BROWSE' && styles.segmentTextActive]}>둘러보기</Text></Pressable>
              <Pressable onPress={() => setMode('LIST')} style={[styles.segment, mode === 'LIST' && styles.segmentActive]}><Text style={[styles.segmentText, mode === 'LIST' && styles.segmentTextActive]}>대여 목록</Text></Pressable>
            </View>
            {mode === 'BROWSE' ? <View style={styles.placeRow}><Ionicons name="location-outline" size={22} color="#A0B243" /><Text numberOfLines={1} style={styles.placeName}>{selectedBook?.lendingPlace.name ?? '부산대학교 장전캠퍼스'}</Text></View> : null}
          </>
        ) : null}

        {mode === 'BROWSE' ? <View style={[styles.searchBar, searching && styles.searchBarSearching]}>
          <Ionicons name="search" size={19} color="#A0B243" />
          <TextInput value={queryText} onChangeText={setQueryText} onSubmitEditing={() => setSubmittedQuery(queryText.trim())} placeholder="책 제목을 검색해보세요" placeholderTextColor="#B1B1B1" returnKeyType="search" style={styles.searchInput} />
          {queryText ? <Pressable accessibilityLabel="검색어 지우기" onPress={() => { setQueryText(''); setSubmittedQuery(''); }}><Ionicons name="close" size={21} color="#888" /></Pressable> : null}
          <Pressable onPress={() => setSubmittedQuery(queryText.trim())} style={styles.searchButton}><Text style={styles.searchButtonText}>검색</Text></Pressable>
        </View> : null}

        {mode === 'LIST' ? (
          rentalsLoading ? <View style={styles.status}><ActivityIndicator color="#A0B243" size="large" /></View> : rentalsError ? (
            <View style={styles.status}><Text style={styles.emptyText}>{rentalsError}</Text><Pressable onPress={() => reloadRentals()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
          ) : rentals.length === 0 ? (
            <View style={styles.status}><Ionicons name="library-outline" size={38} color="#B1B1B1" /><Text style={styles.emptyText}>대여 중이거나 반납 완료한 책이 없어요.</Text></View>
          ) : (
            <ScrollView contentContainerStyle={styles.rentalListContent} showsVerticalScrollIndicator={false}>
              {rentalGroups.map(([heading, items]) => (
                <View key={heading} style={styles.rentalGroup}>
                  <Text style={styles.rentalDate}>{heading}</Text>
                  <View style={styles.rentalCards}>{items.map((rental) => <RentalListCard key={rental.id} rental={rental} />)}</View>
                </View>
              ))}
            </ScrollView>
          )
        ) : isLoading ? <View style={styles.status}><ActivityIndicator color="#A0B243" size="large" /></View> : error ? (
          <View style={styles.status}><Text style={styles.emptyText}>{error}</Text><Pressable onPress={() => reload()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable></View>
        ) : searching ? (
          <ScrollView contentContainerStyle={styles.searchContent} showsVerticalScrollIndicator={false}>
            <View style={styles.resultSummary}><Text style={styles.resultText}>&quot;{submittedQuery}&quot; 검색 결과</Text><Text style={styles.resultCount}>{searchResults.length}건</Text></View>
            <View style={styles.filters}>
              <Pressable onPress={() => setFilter('ALL')} style={[styles.filterChip, filter === 'ALL' && styles.filterChipActive]}><Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>전체</Text></Pressable>
              <Pressable onPress={selectAvailableFilter} style={[styles.filterChip, filter === 'AVAILABLE' && styles.filterChipActive]}><Text style={[styles.filterText, filter === 'AVAILABLE' && styles.filterTextActive]}>대여 가능</Text></Pressable>
            </View>
            <View style={styles.resultList}>{searchResults.map((book) => <BookListCard key={book.id} book={book} onPress={() => openCandidates(book)} />)}</View>
            {searchResults.length === 0 ? <Text style={styles.emptyText}>검색 결과가 없어요.</Text> : null}
          </ScrollView>
        ) : availableBooks.length === 0 ? <View style={styles.status}><Ionicons name="book-outline" size={38} color="#B1B1B1" /><Text style={styles.emptyText}>현재 빌릴 수 있는 책이 없어요.</Text></View> : (
          <View style={styles.browseContent}>
            <AvailableBookCarousel books={availableBooks} width={pageWidth} cardWidth={cardWidth} selectedIndex={selectedIndex} onSelectIndex={setSelectedIndex} onPressBook={openCandidates} />
            <Pressable disabled={!selectedBook || selectedBook.ownerId === user?.uid || isRequesting} onPress={() => selectedBook && void requestBooks([selectedBook.id])} style={[styles.requestButton, selectedBook?.ownerId === user?.uid && styles.requestButtonDisabled]}>
              {isRequesting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.requestButtonText}>{selectedBook?.ownerId === user?.uid ? '내가 등록한 책이에요' : '대여 신청하기'}</Text>}
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' }, page: { flex: 1, alignSelf: 'center', backgroundColor: '#FFF' },
  topBar: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }, iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: '#111', fontSize: 18, fontWeight: '900' },
  segmentedControl: { flexDirection: 'row', alignSelf: 'center', gap: 4, marginTop: 5 }, segment: { width: 72, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#5D442D', alignItems: 'center', justifyContent: 'center' }, segmentActive: { borderColor: '#A2B155', backgroundColor: '#A2B155' }, segmentText: { color: '#5D442D', fontSize: 12, fontWeight: '800' }, segmentTextActive: { color: '#FFF' },
  placeRow: { height: 45, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, placeName: { maxWidth: '78%', color: '#222', fontSize: 14, fontWeight: '800' },
  searchBar: { height: 40, marginHorizontal: 16, borderWidth: 1, borderColor: '#D8E19D', borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9, paddingLeft: 10, paddingRight: 5 }, searchBarSearching: { marginTop: 8 }, searchInput: { flex: 1, height: '100%', paddingVertical: 0, color: '#222', fontSize: 13 }, searchButton: { width: 55, height: 30, borderRadius: 10, backgroundColor: '#A2B155', alignItems: 'center', justifyContent: 'center' }, searchButtonText: { color: '#FFF', fontSize: 12, fontWeight: '900' },
  browseContent: { flex: 1, justifyContent: 'space-evenly', paddingTop: 15, paddingBottom: 96 }, requestButton: { height: 47, marginHorizontal: 34, borderRadius: 12, backgroundColor: '#A2B155', alignItems: 'center', justifyContent: 'center' }, requestButtonDisabled: { backgroundColor: '#D9D9D1' }, requestButtonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 13, paddingHorizontal: 32 }, emptyText: { color: '#7A756E', fontSize: 13, textAlign: 'center' }, retry: { paddingHorizontal: 17, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E8EDCC' }, retryText: { color: '#7A8B26', fontSize: 12, fontWeight: '800' },
  searchContent: { paddingHorizontal: 32, paddingTop: 20, paddingBottom: 112 }, resultSummary: { flexDirection: 'row', alignItems: 'center', gap: 5 }, resultText: { color: '#888', fontSize: 12 }, resultCount: { color: '#A2B155', fontSize: 12, fontWeight: '900' }, filters: { flexDirection: 'row', gap: 7, marginTop: 13 }, filterChip: { minWidth: 48, height: 27, paddingHorizontal: 11, borderRadius: 14, backgroundColor: '#F5F5EF', alignItems: 'center', justifyContent: 'center' }, filterChipActive: { backgroundColor: '#A2B155' }, filterText: { color: '#888', fontSize: 12, fontWeight: '800' }, filterTextActive: { color: '#FFF' }, resultList: { gap: 14, marginTop: 22 },
  bookListCard: { height: 132, flexDirection: 'row', gap: 12, alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#FFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }, listCover: { width: 72, height: 108, borderRadius: 8, backgroundColor: '#E8EDCC' }, fallbackCover: { alignItems: 'center', justifyContent: 'center', padding: 7 }, fallbackCoverTitle: { color: '#5D442D', fontSize: 11, lineHeight: 15, fontWeight: '900', textAlign: 'center' }, listBookInfo: { flex: 1, alignSelf: 'stretch', paddingTop: 2 }, listTitle: { color: '#1C1B1F', fontSize: 16, lineHeight: 22, fontWeight: '800' }, listAuthor: { color: '#5F5D58', fontSize: 13, marginTop: 2 }, listMeta: { color: '#B1B1B1', fontSize: 11, marginTop: 5 }, statusBadge: { width: 112, height: 28, marginTop: 'auto', borderRadius: 14, backgroundColor: '#E8EDCC', alignItems: 'center', justifyContent: 'center' }, statusBadgeBusy: { borderWidth: 1, borderColor: '#D9D9D9', backgroundColor: '#FFFCF5' }, statusBadgeText: { color: '#7A8B26', fontSize: 12, fontWeight: '800' }, statusBadgeBusyText: { color: '#5F5D58' },
  candidateHeader: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8B8986' }, candidateContent: { paddingHorizontal: 26, paddingTop: 14, paddingBottom: 112 }, candidateHeading: { color: '#362E29', fontSize: 20, lineHeight: 28, fontWeight: '800', marginHorizontal: 6, marginBottom: 16 }, candidateGuide: { color: '#7A756E', fontSize: 13, marginHorizontal: 6, marginTop: 15 }, candidateRequest: { width: 180, height: 44, alignSelf: 'center', marginTop: 20, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#A0B243' }, candidateRequestDisabled: { backgroundColor: '#E8EDCC' }, candidateRequestText: { color: '#FFF', fontSize: 14, fontWeight: '800' }, candidateRequestDisabledText: { color: '#B1B1B1' }, candidateList: { gap: 16, marginTop: 16 },
  candidate: { height: 96, flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 16, borderWidth: 1, borderColor: '#D9D9D9', borderRadius: 16, backgroundColor: '#FFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 }, candidateSelected: { borderColor: '#A2B155', backgroundColor: '#E8EDCC' }, candidateNumber: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFCF5' }, candidateNumberSelected: { backgroundColor: '#A0B243' }, candidateNumberText: { color: '#7A8B26', fontSize: 16, fontWeight: '800' }, candidateNumberTextSelected: { color: '#FFF' }, candidateInfo: { flex: 1 }, candidateName: { color: '#1C1B1F', fontSize: 14, lineHeight: 20, fontWeight: '900' }, candidateDepartment: { color: '#5F5D58', fontSize: 13, lineHeight: 18 }, candidateMeta: { color: '#B1B1B1', fontSize: 11, lineHeight: 16 }, selectionMark: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#D9D9D9', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' }, selectionMarkSelected: { borderColor: '#A2B155', backgroundColor: '#A0B243' }, pressed: { opacity: 0.62 },
  rentalListContent: { paddingHorizontal: 28, paddingTop: 29, paddingBottom: 112 }, rentalGroup: { marginBottom: 8 }, rentalDate: { color: '#111', fontSize: 16, lineHeight: 22, fontWeight: '900', marginBottom: 6 }, rentalCards: { gap: 9 },
  rentalCard: { marginBottom: 2 }, rentalStatus: { height: 39, borderWidth: 2, borderColor: '#D0D9A0', borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, rentalStatusReturned: { borderColor: '#D9D9D9', backgroundColor: '#FAFAF8' }, rentalStatusText: { flex: 1, color: '#CFD999', fontSize: 14, fontWeight: '900' }, rentalStatusTextReturned: { color: '#9B9B96' }, rentalModeText: { marginLeft: 8, color: '#C0DA3C', fontSize: 14, fontWeight: '900' }, rentalModeTextReturned: { color: '#9B9B96' },
  rentalBookRow: { minHeight: 108, flexDirection: 'row', alignItems: 'center', paddingLeft: 4, paddingRight: 8, paddingVertical: 10 }, rentalCover: { width: 60, height: 88, borderRadius: 14, backgroundColor: '#E8EDCC' }, rentalFallback: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }, rentalFallbackText: { color: '#5D442D', fontSize: 10, lineHeight: 14, fontWeight: '900', textAlign: 'center' }, rentalBookCopy: { flex: 1, minWidth: 0, marginLeft: 19 }, rentalBookTitle: { color: '#111', fontSize: 14, lineHeight: 20, fontWeight: '800' }, rentalBookMeta: { marginTop: 1, color: '#111', fontSize: 12, lineHeight: 18, fontWeight: '700' }, rentalOwner: { marginTop: 1, color: '#111', fontSize: 10, lineHeight: 16, fontWeight: '700' },
});
