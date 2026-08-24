import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { KakaoPlacePickerModal } from '@/components/KakaoPlacePickerModal';
import { MeetingPlace, MeetingProposal } from '@/models/ChatMessage';

type Props = { visible: boolean; initialPlace?: MeetingPlace; isSaving: boolean; onClose: () => void; onSubmit: (meeting: MeetingProposal) => void };
type MeetingSection = 'loan' | 'return';

const ITEM_HEIGHT = 28;
const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

function nextDate(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function formatDate(date: Date) {
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS[date.getDay()]}`;
}

function formatDateTime(date: Date) {
  const hour = date.getHours();
  return `${formatDate(date)} ${hour % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')}${hour < 12 ? 'AM' : 'PM'}`;
}

function makeDateOptions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 31 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return date;
  });
}

function WheelColumn({ values, selectedIndex, width, align = 'center', onSelect }: {
  values: string[];
  selectedIndex: number;
  width: number;
  align?: 'left' | 'center' | 'right';
  onSelect: (index: number) => void;
}) {
  const ref = useRef<ScrollView>(null);

  useEffect(() => {
    const timeout = setTimeout(() => ref.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false }), 0);
    return () => clearTimeout(timeout);
  }, [selectedIndex]);

  return (
    <ScrollView
      ref={ref}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      contentContainerStyle={styles.wheelColumnContent}
      onMomentumScrollEnd={(event) => {
        const index = Math.max(0, Math.min(values.length - 1, Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT)));
        onSelect(index);
      }}
      style={{ width }}
    >
      {values.map((value, index) => (
        <Pressable key={`${value}-${index}`} onPress={() => onSelect(index)} style={styles.wheelItem}>
          <Text numberOfLines={1} style={[styles.wheelText, { textAlign: align }, index === selectedIndex ? styles.wheelTextSelected : styles.wheelTextMuted]}>
            {value}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function DateTimeWheel({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const dates = useMemo(makeDateOptions, []);
  const foundDateIndex = dates.findIndex((date) => date.toDateString() === value.toDateString());
  const dateIndex = foundDateIndex < 0 ? 0 : foundDateIndex;
  const hourIndex = (value.getHours() % 12 || 12) - 1;
  const minuteIndex = value.getMinutes();
  const periodIndex = value.getHours() < 12 ? 0 : 1;

  const update = (nextDateIndex: number, nextHourIndex: number, nextMinuteIndex: number, nextPeriodIndex: number) => {
    const next = new Date(dates[nextDateIndex] ?? value);
    const hour12 = nextHourIndex + 1;
    next.setHours((hour12 % 12) + (nextPeriodIndex === 1 ? 12 : 0), nextMinuteIndex, 0, 0);
    onChange(next);
  };

  return (
    <View style={styles.wheel}>
      <View pointerEvents="none" style={styles.wheelSelection} />
      <WheelColumn values={dates.map(formatDate)} selectedIndex={dateIndex} width={164} align="right" onSelect={(index) => update(index, hourIndex, minuteIndex, periodIndex)} />
      <WheelColumn values={Array.from({ length: 12 }, (_, index) => String(index + 1))} selectedIndex={hourIndex} width={34} onSelect={(index) => update(dateIndex, index, minuteIndex, periodIndex)} />
      <WheelColumn values={Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))} selectedIndex={minuteIndex} width={42} onSelect={(index) => update(dateIndex, hourIndex, index, periodIndex)} />
      <WheelColumn values={['AM', 'PM']} selectedIndex={periodIndex} width={40} onSelect={(index) => update(dateIndex, hourIndex, minuteIndex, index)} />
    </View>
  );
}

function DateTimeField({ value, expanded, selected, onToggle, onChange }: {
  value: Date;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onChange: (date: Date) => void;
}) {
  const highlighted = expanded || selected;
  return (
    <>
      <Pressable onPress={onToggle} style={[styles.field, highlighted && styles.fieldComplete]}>
        <Text style={[styles.fieldLabel, highlighted && styles.fieldLabelComplete]}>날짜 및 시간</Text>
        <Text numberOfLines={1} style={[styles.fieldValue, highlighted && styles.fieldValueComplete]}>{highlighted ? formatDateTime(value) : '선택'}</Text>
        <Ionicons name="chevron-down" size={20} color={highlighted ? '#B7D52C' : '#555'} />
      </Pressable>
      {expanded ? <DateTimeWheel value={value} onChange={onChange} /> : null}
    </>
  );
}

function getStaticMapSource(place?: MeetingPlace) {
  const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();
  if (!apiKey || place?.latitude == null || place.longitude == null) return null;
  const center = `${place.longitude},${place.latitude}`;
  const marker = `location:${center}|option:false`;
  return {
    uri: `https://dapi.kakao.com/v2/maps/staticmap?center=${encodeURIComponent(center)}&size=720x320&lv=4&scale=1&markers=${encodeURIComponent(marker)}`,
    headers: { Authorization: `KakaoAK ${apiKey}` },
  };
}

function PlaceField({ place, onPress }: { place?: MeetingPlace; onPress: () => void }) {
  const source = getStaticMapSource(place);
  const openKakaoMap = async () => {
    if (!place) return;
    const fallback = `https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address}`)}`;
    await Linking.openURL(place.placeUrl ?? fallback);
  };

  return (
    <>
      <Pressable onPress={onPress} style={[styles.field, styles.placeField, place && styles.fieldComplete]}>
        <Text style={[styles.fieldLabel, place && styles.fieldLabelComplete]}>장소</Text>
        <Text numberOfLines={1} style={[styles.fieldValue, place && styles.fieldValueComplete]}>{place?.name ?? '선택'}</Text>
        <Ionicons name="chevron-down" size={20} color={place ? '#B7D52C' : '#555'} />
      </Pressable>
      {place ? (
        <Pressable accessibilityRole="link" accessibilityLabel={`${place.name} 카카오맵에서 보기`} onPress={() => void openKakaoMap()} style={styles.mapPreview}>
          {source ? <Image source={source} resizeMode="cover" style={styles.mapImage} /> : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={34} color="#A0B243" />
              <Text numberOfLines={2} style={styles.mapFallbackText}>{place.address}</Text>
            </View>
          )}
        </Pressable>
      ) : null}
    </>
  );
}

export function MeetingComposerModal({ visible, initialPlace, isSaving, onClose, onSubmit }: Props) {
  const [loanAt, setLoanAt] = useState(() => nextDate(1, 15));
  const [returnAt, setReturnAt] = useState(() => nextDate(8, 15));
  const [loanDateSelected, setLoanDateSelected] = useState(false);
  const [returnDateSelected, setReturnDateSelected] = useState(false);
  const [expandedDate, setExpandedDate] = useState<MeetingSection | null>(null);
  const [loanPlace, setLoanPlace] = useState<MeetingPlace>();
  const [returnPlace, setReturnPlace] = useState<MeetingPlace>();
  const [picking, setPicking] = useState<MeetingSection | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoanAt(nextDate(1, 15));
    setReturnAt(nextDate(8, 15));
    setLoanDateSelected(false);
    setReturnDateSelected(false);
    setExpandedDate(null);
    setLoanPlace(undefined);
    setReturnPlace(undefined);
    setPicking(null);
  }, [visible]);

  const toggleDate = (section: MeetingSection) => {
    if (expandedDate === section) {
      if (section === 'loan') setLoanDateSelected(true);
      else setReturnDateSelected(true);
      setExpandedDate(null);
      return;
    }
    if (expandedDate === 'loan') setLoanDateSelected(true);
    if (expandedDate === 'return') setReturnDateSelected(true);
    setExpandedDate(section);
  };

  const openPlacePicker = (section: MeetingSection) => {
    if (expandedDate === 'loan') setLoanDateSelected(true);
    if (expandedDate === 'return') setReturnDateSelected(true);
    setExpandedDate(null);
    setPicking(section);
  };

  const submit = () => {
    if (!loanDateSelected || !returnDateSelected || !loanPlace || !returnPlace) {
      Alert.alert('약속 정보를 확인해주세요', '대여와 반납의 날짜, 시간, 장소를 모두 선택해주세요.');
      return;
    }
    if (returnAt.getTime() <= loanAt.getTime()) {
      Alert.alert('날짜를 확인해주세요', '반납 약속은 대여 약속 이후여야 합니다.');
      return;
    }
    onSubmit({ loanAt: loanAt.toISOString(), loanPlace, returnAt: returnAt.toISOString(), returnPlace, status: 'PROPOSED' });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <View style={styles.headerSpace} />
          <Text style={styles.modalTitle}>약속 잡기</Text>
          <Pressable accessibilityLabel="약속 잡기 닫기" onPress={onClose} style={styles.close}><Ionicons name="close" size={25} color="#111" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.form} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>대여</Text>
          <DateTimeField value={loanAt} expanded={expandedDate === 'loan'} selected={loanDateSelected} onToggle={() => toggleDate('loan')} onChange={setLoanAt} />
          <PlaceField place={loanPlace} onPress={() => openPlacePicker('loan')} />

          <Text style={[styles.sectionTitle, styles.returnTitle]}>반납</Text>
          <DateTimeField value={returnAt} expanded={expandedDate === 'return'} selected={returnDateSelected} onToggle={() => toggleDate('return')} onChange={setReturnAt} />
          <PlaceField place={returnPlace} onPress={() => openPlacePicker('return')} />

          <Pressable disabled={isSaving} onPress={submit} style={[styles.submit, isSaving && styles.disabled]}>
            <LinearGradient colors={['#D2DFA0', '#B8E128']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.submitGradient}>
              {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>약속 잡기</Text>}
            </LinearGradient>
          </Pressable>
        </ScrollView>
        <KakaoPlacePickerModal
          visible={picking !== null}
          title={picking === 'return' ? '반납 장소 선택' : '대여 장소 선택'}
          initialPlace={picking === 'return' ? returnPlace ?? initialPlace : loanPlace ?? initialPlace}
          onClose={() => setPicking(null)}
          onSelect={(place) => picking === 'loan' ? setLoanPlace(place) : setReturnPlace(place)}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18 },
  headerSpace: { width: 40 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  form: { flexGrow: 1, paddingHorizontal: 34, paddingBottom: 22 },
  sectionTitle: { marginTop: 22, marginBottom: 12, color: '#111', fontSize: 18, fontWeight: '900' },
  returnTitle: { marginTop: 30 },
  field: { height: 46, borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.5)', borderRadius: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  fieldComplete: { borderColor: '#B7D52C' },
  fieldLabel: { color: '#555', fontSize: 16, fontWeight: '800' },
  fieldLabelComplete: { color: '#A0B243' },
  fieldValue: { flex: 1, marginLeft: 10, color: '#555', textAlign: 'right', fontSize: 14, fontWeight: '600' },
  fieldValueComplete: { color: '#B7D52C' },
  placeField: { marginTop: 9 },
  wheel: { height: 122, marginTop: 13, alignSelf: 'center', flexDirection: 'row', justifyContent: 'center', overflow: 'hidden' },
  wheelSelection: { position: 'absolute', left: 0, right: 0, top: 47, height: ITEM_HEIGHT, borderRadius: 8, backgroundColor: '#E5E5EA' },
  wheelColumnContent: { paddingVertical: 47 },
  wheelItem: { height: ITEM_HEIGHT, justifyContent: 'center', paddingHorizontal: 3 },
  wheelText: { fontSize: 20, lineHeight: 26 },
  wheelTextSelected: { color: '#1C1C1E', fontSize: 22 },
  wheelTextMuted: { color: '#D8D8DC' },
  mapPreview: { height: 155, marginTop: 9, borderRadius: 14, overflow: 'hidden', backgroundColor: '#EEF0E8' },
  mapImage: { width: '100%', height: '100%' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  mapFallbackText: { marginTop: 7, color: '#5D5D55', fontSize: 11, textAlign: 'center' },
  submit: { height: 48, marginTop: 32, borderRadius: 13, overflow: 'hidden' },
  submitGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.55 },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
});
