import { MeetingPlace } from '@/models/ChatMessage';

type KakaoPlaceDocument = {
  place_name?: string;
  road_address_name?: string;
  address_name?: string;
  x?: string;
  y?: string;
};

export const kakaoPlaceRepository = {
  isConfigured() {
    return Boolean(process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim());
  },

  async search(keyword: string): Promise<MeetingPlace[]> {
    const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY?.trim();
    const query = keyword.trim();
    if (!apiKey) throw new Error('KAKAO_API_KEY_REQUIRED');
    if (!query) return [];
    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } },
    );
    if (!response.ok) throw new Error(`KAKAO_PLACE_SEARCH_FAILED_${response.status}`);
    const payload = await response.json() as { documents?: KakaoPlaceDocument[] };
    return (payload.documents ?? []).map((place) => ({
      name: place.place_name?.trim() || '이름 없는 장소',
      address: place.road_address_name?.trim() || place.address_name?.trim() || '',
      longitude: place.x ? Number(place.x) : undefined,
      latitude: place.y ? Number(place.y) : undefined,
    }));
  },
};
