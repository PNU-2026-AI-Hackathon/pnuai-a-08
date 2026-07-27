import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatRoomRow } from '@/components/ChatRoomRow';
import { colors, spacing, typography } from '@/constants/theme';
import { useChatRooms } from '@/hooks/useChatRooms';
import { ChatRoom } from '@/models/ChatRoom';

const CURRENT_USER_ID = 'current-user';

export default function CommunityScreen() {
  const { width } = useWindowDimensions();
  const { rooms, isLoading, error } = useChatRooms(CURRENT_USER_ID);
  const contentWidth = Math.min(width, 620);
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;

  const handleRoomPress = (room: ChatRoom) => {
    // 채팅 화면 구현 시 이 한 곳을 router.push(`/chats/${room.id}`)로 교체합니다.
    Alert.alert(room.book.title, `${room.otherUser.displayName}님과의 채팅 화면은 준비 중이에요.`);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.page, { width: contentWidth }]}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Image
            source={require('../../assets/images/rental-symbol.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="서로서가 심볼"
          />
          <View style={styles.headerCopy}>
            <Text style={styles.title}>책으로 이어진 대화</Text>
            <Text style={styles.subtitle}>대여 약속과 책 이야기를 나눠보세요.</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{error}</Text>
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatRoomRow room={item} onPress={handleRoomPress} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.list,
              { paddingHorizontal: horizontalPadding },
              rooms.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="chatbubble-ellipses-outline" size={34} color={colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>아직 시작된 대화가 없어요.</Text>
                <Text style={styles.statusText}>
                  대여 신청이 수락되면 이곳에 채팅방이 만들어져요.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  page: {
    flex: 1,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  list: {
    paddingBottom: spacing.xxl,
  },
  separator: {
    height: spacing.md,
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyList: {
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: 100,
  },
  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
    marginBottom: spacing.sm,
  },
});

