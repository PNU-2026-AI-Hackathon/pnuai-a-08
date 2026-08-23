import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { colors } from '@/constants/theme';

const tabIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  explore: 'search-outline',
  rental: 'book-outline',
  home: 'home-outline',
  community: 'chatbubble-ellipses-outline',
  mypage: 'person-outline',
};

export default function TabLayout() {
  const { user, isGuest, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(10, insets.bottom);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  if (!user && !isGuest) {
    return <Redirect href="/login" />;
  }

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
          height: 62 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
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

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
