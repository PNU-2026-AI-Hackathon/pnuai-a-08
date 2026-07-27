import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';
import { ChatRoom, ChatRoomStatus } from '@/models/ChatRoom';

type ChatRoomRowProps = {
  room: ChatRoom;
  onPress: (room: ChatRoom) => void;
};

const statusLabel: Record<ChatRoomStatus, string> = {
  requested: '신청 확인 중',
  accepted: '대여 약속',
  onLoan: '대여 중',
  completed: '대여 완료',
};

function formatMessageTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  if (isToday) {
    return new Intl.DateTimeFormat('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

export function ChatRoomRow({ room, onPress }: ChatRoomRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${room.otherUser.displayName}님과 ${room.book.title} 대화`}
      accessibilityHint="채팅방으로 이동합니다"
      onPress={() => onPress(room)}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <LinearGradient colors={[...room.book.colors]} style={styles.cover}>
        <Text numberOfLines={2} style={styles.coverTitle}>
          {room.book.title}
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.userName}>
            {room.otherUser.displayName}
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{statusLabel[room.status]}</Text>
          </View>
        </View>

        <Text numberOfLines={1} style={styles.bookInfo}>
          {room.book.title} · {room.book.author}
        </Text>
        <Text numberOfLines={1} style={styles.message}>
          {room.lastMessage}
        </Text>
      </View>

      <View style={styles.meta}>
        <Text style={styles.time}>{formatMessageTime(room.lastMessageAt)}</Text>
        {room.unreadCount > 0 ? (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{Math.min(room.unreadCount, 99)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 116,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.68,
    transform: [{ scale: 0.99 }],
  },
  cover: {
    width: 60,
    height: 82,
    borderRadius: radius.sm,
    padding: spacing.sm,
    justifyContent: 'flex-end',
    shadowColor: '#4A3425',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.13,
    shadowRadius: 5,
    elevation: 3,
  },
  coverTitle: {
    color: colors.white,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  userName: {
    maxWidth: '48%',
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '900',
  },
  statusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: colors.accentSoft,
  },
  statusText: {
    color: colors.text,
    fontSize: 10,
    fontWeight: '800',
  },
  bookInfo: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
  },
  message: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
  },
  meta: {
    alignSelf: 'stretch',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: spacing.sm,
    paddingVertical: 4,
  },
  time: {
    color: colors.inactive,
    fontSize: 10,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    backgroundColor: colors.accent,
  },
  unreadText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
  },
});

