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
import { createOwnedBook } from '@/services/bookCreationService';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

function formatPublishedDate(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function CalendarPicker({ selected, onSelect }: { selected: Date | null; onSelect: (date: Date) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => selected ?? new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = useMemo(
    () => [...Array.from({ length: firstDay }, () => null), ...Array.from({ length: lastDate }, (_, index) => index + 1)],
    [firstDay, lastDate],
  );

  const moveMonth = (offset: number) => {
    setVisibleMonth(new Date(year, month + offset, 1));
  };

  return (
    <View style={styles.calendar}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>{year}년 {month + 1}월</Text>
        <View style={styles.calendarArrows}>
          <Pressable accessibilityRole="button" accessibilityLabel="이전 달" hitSlop={10} onPress={() => moveMonth(-1)}>
            <Ionicons name="chevron-back" size={25} color="#6E7A30" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="다음 달" hitSlop={10} onPress={() => moveMonth(1)}>
            <Ionicons name="chevron-forward" size={25} color="#6E7A30" />
          </Pressable>
        </View>
      </View>
      <View style={styles.weekRow}>
        {weekDays.map((day) => <Text key={day} style={styles.weekDay}>{day}</Text>)}
      </View>
      <View style={styles.dateGrid}>
        {cells.map((day, index) => {
          const isSelected = Boolean(day && selected && selected.getFullYear() === year && selected.getMonth() === month && selected.getDate() === day);
          return (
            <Pressable
              key={`${day ?? 'blank'}-${index}`}
              disabled={!day}
              onPress={() => day && onSelect(new Date(year, month, day, 12))}
              style={[styles.dateCell, isSelected && styles.dateCellSelected]}
            >
              <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>{day ?? ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChangeText,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#85818A"
        style={styles.input}
        maxLength={120}
      />
    </View>
  );
}

export default function AddBookScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publishedDate, setPublishedDate] = useState<Date | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const formWidth = Math.min(329, width - 48);

  const saveBook = async () => {
    if (!user) {
      Alert.alert('로그인이 필요해요', '나의 책을 저장하려면 부산대학교 계정으로 로그인해주세요.');
      return;
    }
    if (!title.trim() || !author.trim() || !publisher.trim() || !publishedDate) {
      Alert.alert('입력을 확인해주세요', '책 제목, 작가, 출판사, 출간일을 모두 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      await createOwnedBook({
        ownerId: user.uid,
        title: title.trim(),
        author: author.trim(),
        publisher: publisher.trim(),
        publishedDate: publishedDate.toISOString(),
      });
      router.back();
    } catch (error) {
      console.error('책 추가 실패:', error);
      Alert.alert('책을 추가하지 못했어요', 'Firestore 연결과 로그인 상태를 확인한 뒤 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="뒤로 가기" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={23} color="#1A1714" />
          </Pressable>
          <Text style={styles.screenTitle}>책 추가하기</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Image source={require('../../../assets/images/rental-symbol.png')} style={styles.symbol} resizeMode="contain" />

          <Pressable
            accessibilityRole="button"
            onPress={() => Alert.alert('준비 중이에요', 'ML Kit 한국어 OCR로 서지정보를 읽어오는 기능은 다음 단계에서 연결할게요.')}
            style={({ pressed }) => [styles.ocrButton, { width: Math.min(274, formWidth) }, pressed && styles.pressed]}
          >
            <Ionicons name="images-outline" size={22} color="#C0DA3B" />
            <Text style={styles.ocrText}>이미지로 한 번에 불러오기</Text>
          </Pressable>
          <Text style={[styles.coverNotice, { width: formWidth }]}>현재는 표지 없이 책 정보만 Firestore에 저장됩니다.</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="표지 사진 선택"
            onPress={() => Alert.alert('표지 등록 준비 중', 'Firebase Storage를 활성화한 뒤 사진 선택 기능을 다시 연결할 예정입니다.')}
            style={({ pressed }) => [styles.coverPicker, { width: formWidth }, pressed && styles.pressed]}
          >
            <Ionicons name="camera-outline" size={34} color="#5D442D" />
            <Text style={styles.coverPickerText}>표지 사진 선택</Text>
            <Text style={styles.coverPickerPending}>Storage 연결 후 사용할 수 있어요</Text>
          </Pressable>

          <View style={{ width: formWidth }}>
            <Field label="책 제목" value={title} onChangeText={setTitle} placeholder="제목을 입력하세요." />
            <Field label="작가" value={author} onChangeText={setAuthor} placeholder="작가를 입력하세요." />
            <Field label="출판사" value={publisher} onChangeText={setPublisher} placeholder="출판사를 입력하세요." />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>출간일</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setCalendarOpen((current) => !current)}
                style={styles.dateInput}
              >
                <Text style={[styles.dateInputText, !publishedDate && styles.placeholder]}>
                  {publishedDate ? formatPublishedDate(publishedDate) : '출간일을 선택하세요.'}
                </Text>
                <Ionicons name="calendar-outline" size={19} color="#6E7A30" />
              </Pressable>
            </View>

            {calendarOpen ? (
              <CalendarPicker
                selected={publishedDate}
                onSelect={(date) => {
                  setPublishedDate(date);
                  setCalendarOpen(false);
                }}
              />
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="나의 책으로 추가"
              disabled={saving}
              onPress={() => void saveBook()}
              style={({ pressed }) => [styles.saveButton, (pressed || saving) && styles.pressed]}
            >
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveText}>나의 책으로 추가</Text>}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  page: { flex: 1 },
  topBar: { height: 57, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#8B8986' },
  backButton: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { color: '#151310', fontSize: 18, fontWeight: '800' },
  content: { alignItems: 'center', paddingTop: 37, paddingBottom: 36 },
  symbol: { width: 44, height: 42 },
  ocrButton: { height: 38, marginTop: 18, borderWidth: 2, borderColor: '#C0DA3B', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  ocrText: { color: '#B8CF46', fontSize: 14, fontWeight: '800' },
  coverPicker: { height: 171, marginTop: 35, borderWidth: 1, borderStyle: 'dashed', borderColor: '#A2B155', borderRadius: 16, backgroundColor: '#FFFCF5', alignItems: 'center', justifyContent: 'center', gap: 8, overflow: 'hidden', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 2 },
  coverPickerText: { color: '#5D442D', fontSize: 14, fontWeight: '800' },
  coverPickerPending: { color: '#85818A', fontSize: 11 },
  coverNotice: { marginTop: 8, color: '#85818A', fontSize: 11, lineHeight: 16, textAlign: 'center' },
  field: { marginTop: 18 },
  fieldLabel: { color: '#151310', fontSize: 15, lineHeight: 26, fontWeight: '800', marginBottom: 7 },
  input: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 0, color: '#312A25', fontSize: 14 },
  dateInput: { width: '100%', height: 42, borderWidth: 1, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 7, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dateInputText: { color: '#312A25', fontSize: 14 },
  placeholder: { color: '#85818A' },
  calendar: { marginTop: 16, paddingHorizontal: 12, paddingTop: 17, paddingBottom: 18, borderRadius: 16, backgroundColor: '#FFFFFF', shadowColor: '#5D442D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 15, elevation: 5 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 14 },
  calendarTitle: { color: '#6E7A30', fontSize: 20, fontWeight: '800' },
  calendarArrows: { flexDirection: 'row', gap: 16 },
  weekRow: { flexDirection: 'row' },
  weekDay: { width: `${100 / 7}%`, color: '#B7B7B7', fontSize: 12, textAlign: 'center', paddingVertical: 7 },
  dateGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 99 },
  dateCellSelected: { backgroundColor: '#6E7A30' },
  dateText: { color: '#6E7A30', fontSize: 18 },
  dateTextSelected: { color: '#FFFFFF', fontWeight: '800' },
  saveButton: { height: 48, marginTop: 24, borderRadius: 12, backgroundColor: '#A0B243', alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  pressed: { opacity: 0.65 },
});
