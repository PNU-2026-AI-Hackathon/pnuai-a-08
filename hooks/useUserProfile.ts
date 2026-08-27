import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { userRepository, UserProfile } from '@/services/userRepository';

export function useUserProfile(userId: string) {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(useCallback(() => {
    let isActive = true;
    void userRepository.getUserProfile(userId)
      .then((nextProfile) => {
        if (isActive) setProfile(nextProfile);
      })
      .catch((error) => console.warn('사용자 프로필 조회 실패:', error));
    return () => {
      isActive = false;
    };
  }, [userId]));

  return profile;
}
