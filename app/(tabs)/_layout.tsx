import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { colors } from '@/constants/theme';

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  explore: 'search-outline',
  rental: 'book-outline',
  home: 'home-outline',
  community: 'chatbubble-ellipses-outline',
  mypage: 'person-outline',
};

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarStyle: {
          height: Platform.select({ ios: 84, default: 72 }),
          paddingTop: 8,
          paddingBottom: Platform.select({ ios: 22, default: 10 }),
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 14,
          shadowColor: '#5D4635',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 14,
        },
        tabBarIcon: ({ color, focused, size }) => (
          <Ionicons
            name={focused && route.name === 'home' ? 'home' : tabIcons[route.name]}
            color={focused && route.name === 'home' ? colors.accent : color}
            size={focused && route.name === 'home' ? size + 3 : size}
          />
        ),
      })}
    >
      <Tabs.Screen name="explore" options={{ title: '탐색' }} />
      <Tabs.Screen name="rental" options={{ title: '대여' }} />
      <Tabs.Screen name="home" options={{ title: '홈' }} />
      <Tabs.Screen name="community" options={{ title: '커뮤니티' }} />
      <Tabs.Screen name="mypage" options={{ title: '마이페이지' }} />
    </Tabs>
  );
}

