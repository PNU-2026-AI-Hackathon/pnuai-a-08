import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

import { MeetingPlace } from '@/models/ChatMessage';
import { kakaoPlaceRepository } from '@/services/kakaoPlaceRepository';

type KakaoPlacePickerModalProps = {
  visible: boolean;
  title?: string;
  initialPlace?: MeetingPlace;
  onClose: () => void;
  onSelect: (place: MeetingPlace) => void;
};

function isSamePlace(first: MeetingPlace, second?: MeetingPlace) {
  if (!second) return false;
  if (first.placeId && second.placeId) return first.placeId === second.placeId;
  return first.name === second.name && first.address === second.address;
}

export function KakaoPlacePickerModal({
  visible,
  title = '장소 선택',
  initialPlace,
  onClose,
  onSelect,
}: KakaoPlacePickerModalProps) {
  const [keyword, setKeyword] = useState('');
  const [places, setPlaces] = useState<MeetingPlace[]>([]);
  const [previewPlace, setPreviewPlace] = useState<MeetingPlace | undefined>(initialPlace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setKeyword(initialPlace?.name ?? '');
    setPreviewPlace(initialPlace);
    setError('');

    if (!initialPlace?.name || (initialPlace.latitude != null && initialPlace.longitude != null)) {
      setPlaces(initialPlace ? [initialPlace] : []);
      return;
    }

    let active = true;
    setLoading(true);
    void kakaoPlaceRepository.search(initialPlace.name)
      .then((results) => {
        if (!active) return;
        setPlaces(results);
        setPreviewPlace(results[0] ?? initialPlace);
      })
      .catch(() => {
        if (active) setPlaces([initialPlace]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [initialPlace, visible]);

  const staticMapSource = useMemo(() => {
    const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();
    if (!apiKey || previewPlace?.latitude == null || previewPlace.longitude == null) return null;
    const center = `${previewPlace.longitude},${previewPlace.latitude}`;
    const marker = `location:${center}|option:false`;
    return {
      uri: `https://dapi.kakao.com/v2/maps/staticmap?center=${encodeURIComponent(center)}&size=720x360&lv=4&scale=1&markers=${encodeURIComponent(marker)}`,
      headers: { Authorization: `KakaoAK ${apiKey}` },
    };
  }, [previewPlace?.latitude, previewPlace?.longitude]);

  const search = async () => {
    const query = keyword.trim();
    if (!query || loading) return;
    setLoading(true);
    setError('');
    try {
      const results = await kakaoPlaceRepository.search(query);
      setPlaces(results);
      setPreviewPlace(results[0]);
      if (results.length === 0) setError('검색 결과가 없어요. 다른 장소명으로 검색해주세요.');
    } catch (searchError) {
      console.error('카카오 장소 검색 실패:', searchError);
      setError(searchError instanceof Error && searchError.message === 'KAKAO_API_KEY_REQUIRED'
        ? '카카오 REST API 키가 설정되지 않았어요.'
        : '카카오 장소 검색에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const openKakaoMap = async () => {
    if (!previewPlace) return;
    const fallbackUrl = `https://map.kakao.com/link/search/${encodeURIComponent(`${previewPlace.name} ${previewPlace.address}`)}`;
    await Linking.openURL(previewPlace.placeUrl ?? fallbackUrl);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <View style={styles.headerSpace} />
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityLabel="장소 선택 닫기" onPress={onClose} style={styles.close}>
            <Ionicons name="close" size={25} color="#111" />
          </Pressable>
        </View>

        <View style={styles.searchBar}>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => void search()}
            placeholder="장소명 또는 주소 검색"
            placeholderTextColor="#929292"
            returnKeyType="search"
            style={styles.searchInput}
          />
          <Pressable accessibilityLabel="카카오 장소 검색" onPress={() => void search()} style={styles.searchButton}>
            {loading ? <ActivityIndicator size="small" color="#A0B243" /> : <Ionicons name="search" size={23} color="#A0B243" />}
          </Pressable>
        </View>

        <View style={styles.mapPanel}>
          {staticMapSource ? (
            <Image source={staticMapSource} resizeMode="cover" style={styles.mapImage} />
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={42} color="#A0B243" />
              <Text style={styles.mapFallbackText}>장소를 검색하면 카카오맵이 표시돼요.</Text>
            </View>
          )}
          {previewPlace ? (
            <View style={styles.mapCaption}>
              <View style={styles.mapCaptionCopy}>
                <Text numberOfLines={1} style={styles.previewName}>{previewPlace.name}</Text>
                <Text numberOfLines={1} style={styles.previewAddress}>{previewPlace.address}</Text>
              </View>
              <Pressable accessibilityLabel="카카오맵에서 크게 보기" onPress={() => void openKakaoMap()} style={styles.openMap}>
                <Text style={styles.openMapText}>카카오맵</Text>
                <Ionicons name="open-outline" size={15} color="#5D442D" />
              </Pressable>
            </View>
          ) : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <ScrollView contentContainerStyle={styles.placeList} keyboardShouldPersistTaps="handled">
          {places.map((place, index) => {
            const selected = isSamePlace(place, previewPlace);
            return (
              <Pressable
                key={place.placeId ?? `${place.name}-${place.address}-${index}`}
                onPress={() => setPreviewPlace(place)}
                style={({ pressed }) => [
                  styles.placeCard,
                  selected && styles.placeCardSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="location-outline" size={22} color={selected ? '#92A62E' : '#888'} />
                <View style={styles.placeCopy}>
                  <Text numberOfLines={1} style={styles.placeName}>{place.name}</Text>
                  <Text numberOfLines={2} style={styles.placeAddress}>{place.address}</Text>
                </View>
                {selected ? <Ionicons name="checkmark-circle" size={22} color="#A0B243" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            disabled={!previewPlace}
            onPress={() => {
              if (!previewPlace) return;
              onSelect(previewPlace);
              onClose();
            }}
            style={[styles.selectButton, !previewPlace && styles.selectButtonDisabled]}
          >
            <Text style={styles.selectButtonText}>이 장소 선택</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerSpace: { width: 40 },
  title: { color: '#111', fontSize: 18, fontWeight: '900' },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchBar: { height: 48, marginHorizontal: 16, borderWidth: 1.5, borderColor: '#A0B243', borderRadius: 13, flexDirection: 'row', alignItems: 'center', paddingLeft: 14 },
  searchInput: { flex: 1, height: '100%', paddingVertical: 0, color: '#2F2924', fontSize: 15 },
  searchButton: { width: 48, height: 46, alignItems: 'center', justifyContent: 'center' },
  mapPanel: { height: 220, marginTop: 16, marginHorizontal: 16, overflow: 'hidden', borderRadius: 15, backgroundColor: '#EEF0E8' },
  mapImage: { width: '100%', height: '100%' },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapFallbackText: { marginTop: 8, color: '#74746E', fontSize: 12 },
  mapCaption: { position: 'absolute', left: 9, right: 9, bottom: 9, minHeight: 54, borderRadius: 11, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.94)' },
  mapCaptionCopy: { flex: 1, minWidth: 0 },
  previewName: { color: '#2B2019', fontSize: 13, fontWeight: '900' },
  previewAddress: { marginTop: 3, color: '#777', fontSize: 10 },
  openMap: { height: 34, flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 8, paddingHorizontal: 9, borderRadius: 9, backgroundColor: '#F9E34B' },
  openMapText: { color: '#5D442D', fontSize: 11, fontWeight: '900' },
  error: { marginHorizontal: 20, marginTop: 12, color: '#B64E43', fontSize: 12, textAlign: 'center' },
  placeList: { padding: 16, gap: 9 },
  placeCard: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E2DC', borderRadius: 13, backgroundColor: '#FFF' },
  placeCardSelected: { borderColor: '#A0B243', backgroundColor: '#F8FBEA' },
  pressed: { opacity: 0.62 },
  placeCopy: { flex: 1, minWidth: 0 },
  placeName: { color: '#222', fontSize: 14, fontWeight: '900' },
  placeAddress: { marginTop: 4, color: '#777', fontSize: 11, lineHeight: 15 },
  footer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#DDD' },
  selectButton: { height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#A0B243' },
  selectButtonDisabled: { opacity: 0.35 },
  selectButtonText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
