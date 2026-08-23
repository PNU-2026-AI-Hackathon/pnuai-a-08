import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MeetingPlace, MeetingProposal } from '@/models/ChatMessage';
import { kakaoPlaceRepository } from '@/services/kakaoPlaceRepository';

type Props = {
  visible: boolean;
  initialPlace?: MeetingPlace;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (meeting: MeetingProposal) => void;
};

function nextDate(days: number, hour: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long', day: 'numeric', weekday: 'short', hour: 'numeric', minute: '2-digit',
  }).format(date);
}

function DateTimeField({ label, value, onChange }: { label: string; value: Date; onChange: (date: Date) => void }) {
  const change = (days: number, hours: number) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    next.setHours(next.getHours() + hours);
    onChange(next);
  };
  return (
    <View style={styles.dateBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.dateValue}>{formatDateTime(value)}</Text>
      <View style={styles.stepRow}>
        <Pressable onPress={() => change(-1, 0)} style={styles.step}><Text style={styles.stepText}>이전 날</Text></Pressable>
        <Pressable onPress={() => change(0, -1)} style={styles.step}><Text style={styles.stepText}>- 1시간</Text></Pressable>
        <Pressable onPress={() => change(0, 1)} style={styles.step}><Text style={styles.stepText}>+ 1시간</Text></Pressable>
        <Pressable onPress={() => change(1, 0)} style={styles.step}><Text style={styles.stepText}>다음 날</Text></Pressable>
      </View>
    </View>
  );
}

function PlacePicker({
  visible,
  fallback,
  onClose,
  onSelect,
}: {
  visible: boolean;
  fallback?: MeetingPlace;
  onClose: () => void;
  onSelect: (place: MeetingPlace) => void;
}) {
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState<MeetingPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');
    try {
      setPlaces(await kakaoPlaceRepository.search(keyword));
    } catch (searchError) {
      setError(searchError instanceof Error && searchError.message === 'KAKAO_API_KEY_REQUIRED'
        ? '카카오 장소 검색을 사용하려면 REST API 키가 필요해요.'
        : '장소를 검색하지 못했어요.');
    } finally {
      setLoading(false);
    }
  };

  const openKakaoMap = async (place: MeetingPlace) => {
    const target = `https://map.kakao.com/link/search/${encodeURIComponent(`${place.name} ${place.address}`)}`;
    await Linking.openURL(target);
  };

  const candidates = useMemo(
    () => fallback && !places.some((place) => place.name === fallback.name) ? [fallback, ...places] : places,
    [fallback, places],
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <View style={styles.headerSpace} />
          <Text style={styles.modalTitle}>장소 선택</Text>
          <Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={25} color="#111" /></Pressable>
        </View>
        <View style={styles.searchBar}>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => void search()}
            placeholder="장소명으로 검색"
            placeholderTextColor="#A6C321"
            style={styles.searchInput}
          />
          <Pressable onPress={() => void search()}><Ionicons name="search" size={24} color="#A6C321" /></Pressable>
        </View>
        <View style={styles.mapPanel}>
          <View style={styles.mapLineOne} />
          <View style={styles.mapLineTwo} />
          <Ionicons name="location" size={46} color="#D64B3D" />
          <Text style={styles.mapHint}>카카오 장소 검색 결과에서 위치를 선택해 주세요.</Text>
        </View>
        {loading ? <ActivityIndicator color="#A6C321" style={styles.loader} /> : null}
        {error ? <Text style={styles.placeError}>{error}</Text> : null}
        <ScrollView contentContainerStyle={styles.placeList} keyboardShouldPersistTaps="handled">
          {candidates.map((place, index) => (
            <View key={`${place.name}-${place.address}-${index}`} style={styles.placeCard}>
              <Pressable style={styles.placeCopy} onPress={() => { onSelect(place); onClose(); }}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text numberOfLines={2} style={styles.placeAddress}>{place.address}</Text>
              </Pressable>
              <Pressable accessibilityLabel="카카오맵에서 보기" onPress={() => void openKakaoMap(place)} style={styles.mapLink}>
                <Ionicons name="map-outline" size={21} color="#5D442D" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function MeetingComposerModal({ visible, initialPlace, isSaving, onClose, onSubmit }: Props) {
  const defaultPlace = initialPlace ?? { name: '부산대학교 장전캠퍼스', address: '부산광역시 금정구 부산대학로63번길 2' };
  const [loanAt, setLoanAt] = useState(() => nextDate(1, 15));
  const [returnAt, setReturnAt] = useState(() => nextDate(8, 15));
  const [loanPlace, setLoanPlace] = useState<MeetingPlace>(defaultPlace);
  const [returnPlace, setReturnPlace] = useState<MeetingPlace>(defaultPlace);
  const [picking, setPicking] = useState<'loan' | 'return' | null>(null);

  const submit = () => {
    if (returnAt.getTime() <= loanAt.getTime()) {
      Alert.alert('날짜를 확인해주세요', '반납 약속은 대여 약속 이후여야 합니다.');
      return;
    }
    onSubmit({
      loanAt: loanAt.toISOString(), loanPlace,
      returnAt: returnAt.toISOString(), returnPlace,
      status: 'PROPOSED',
    });
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <View style={styles.headerSpace} />
          <Text style={styles.modalTitle}>약속 잡기</Text>
          <Pressable onPress={onClose} style={styles.close}><Ionicons name="close" size={25} color="#111" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.sectionTitle}>대여</Text>
          <DateTimeField label="날짜 및 시간" value={loanAt} onChange={setLoanAt} />
          <Pressable onPress={() => setPicking('loan')} style={styles.placeField}>
            <Text style={styles.placeFieldLabel}>장소</Text><Text numberOfLines={1} style={styles.placeFieldValue}>{loanPlace.name}</Text>
            <Ionicons name="chevron-down" size={20} color="#A6C321" />
          </Pressable>
          <View style={styles.placePreview}><Ionicons name="map" size={34} color="#A6C321" /><Text style={styles.previewText}>{loanPlace.address}</Text></View>

          <Text style={[styles.sectionTitle, styles.returnTitle]}>반납</Text>
          <DateTimeField label="날짜 및 시간" value={returnAt} onChange={setReturnAt} />
          <Pressable onPress={() => setPicking('return')} style={styles.placeField}>
            <Text style={styles.placeFieldLabel}>장소</Text><Text numberOfLines={1} style={styles.placeFieldValue}>{returnPlace.name}</Text>
            <Ionicons name="chevron-down" size={20} color="#A6C321" />
          </Pressable>
          <View style={styles.placePreview}><Ionicons name="map" size={34} color="#A6C321" /><Text style={styles.previewText}>{returnPlace.address}</Text></View>

          <Pressable disabled={isSaving} onPress={submit} style={[styles.submit, isSaving && styles.disabled]}>
            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitText}>약속 잡기</Text>}
          </Pressable>
        </ScrollView>
        <PlacePicker
          visible={picking !== null}
          fallback={defaultPlace}
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
  headerSpace: { width: 40 }, close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#111' },
  form: { paddingHorizontal: 34, paddingBottom: 34 }, sectionTitle: { marginTop: 22, marginBottom: 12, color: '#111', fontSize: 18, fontWeight: '900' },
  returnTitle: { marginTop: 30 }, dateBlock: { borderWidth: 1.5, borderColor: '#C0DA3B', borderRadius: 11, padding: 12 },
  fieldLabel: { color: '#A6C321', fontSize: 14, fontWeight: '800' }, dateValue: { marginTop: 7, color: '#4F5630', fontSize: 15, fontWeight: '700' },
  stepRow: { flexDirection: 'row', gap: 5, marginTop: 11 }, step: { flex: 1, height: 30, borderRadius: 8, backgroundColor: '#F1F5DC', alignItems: 'center', justifyContent: 'center' },
  stepText: { color: '#6E7A30', fontSize: 10, fontWeight: '700' },
  placeField: { height: 46, marginTop: 10, borderWidth: 1.5, borderColor: '#C0DA3B', borderRadius: 11, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  placeFieldLabel: { color: '#A6C321', fontSize: 15, fontWeight: '800' }, placeFieldValue: { flex: 1, marginHorizontal: 12, color: '#A6C321', textAlign: 'right', fontSize: 13 },
  placePreview: { height: 110, marginTop: 9, borderRadius: 14, backgroundColor: '#EEF0E8', alignItems: 'center', justifyContent: 'center', padding: 14 },
  previewText: { marginTop: 7, color: '#5D5D55', fontSize: 11, textAlign: 'center' },
  submit: { height: 48, marginTop: 32, borderRadius: 13, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.55 }, submitText: { color: '#FFF', fontSize: 15, fontWeight: '900' },
  searchBar: { height: 50, marginHorizontal: 12, borderWidth: 1.5, borderColor: '#C0DA3B', borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchInput: { flex: 1, color: '#333', fontSize: 16, fontWeight: '700' },
  mapPanel: { height: 230, marginTop: 20, overflow: 'hidden', backgroundColor: '#30312F', alignItems: 'center', justifyContent: 'center' },
  mapLineOne: { position: 'absolute', width: 500, height: 10, backgroundColor: '#797B78', transform: [{ rotate: '24deg' }] },
  mapLineTwo: { position: 'absolute', width: 500, height: 10, backgroundColor: '#797B78', transform: [{ rotate: '-58deg' }] },
  mapHint: { marginTop: 8, color: '#FFF', fontSize: 11 }, loader: { marginTop: 18 }, placeError: { color: '#B64E43', textAlign: 'center', margin: 16, fontSize: 12 },
  placeList: { padding: 16, gap: 10 }, placeCard: { minHeight: 72, flexDirection: 'row', borderRadius: 14, backgroundColor: '#F5F5F1', alignItems: 'center', padding: 12 },
  placeCopy: { flex: 1 }, placeName: { color: '#222', fontSize: 15, fontWeight: '900' }, placeAddress: { marginTop: 5, color: '#777', fontSize: 11, lineHeight: 16 }, mapLink: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
});
