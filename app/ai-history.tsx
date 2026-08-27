import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { AiConversation } from '@/models/AiConversation';
import { aiConversationRepository } from '@/services/aiConversationRepository';

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function sourceLabel(type: AiConversation['sourceType']) {
  return type === 'book' ? '책' : '매거진';
}

function ConversationCard({ conversation }: { conversation: AiConversation }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/home/ai', params: { conversationId: conversation.id } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.badge}>{sourceLabel(conversation.sourceType)}</Text>
        <Text style={styles.date}>{formatDate(conversation.updatedAt ?? conversation.createdAt)}</Text>
      </View>
      <Text numberOfLines={2} style={styles.title}>{conversation.sourceTitle}</Text>
      <Text numberOfLines={2} style={styles.preview}>{conversation.lastMessage || '아직 저장된 메시지가 없어요.'}</Text>
    </Pressable>
  );
}

export default function AiHistoryScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<AiConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      setItems(await aiConversationRepository.listByUser(user.uid));
    } catch (loadError) {
      console.error('AI 대화 기록 목록 조회 실패:', loadError);
      setError('AI 대화 기록을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [user]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={23} color="#1A1A1A" />
        </Pressable>
        <Text style={styles.headerTitle}>서로 AI 대화 기록</Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <View style={styles.state}><ActivityIndicator color="#A0B243" size="large" /></View>
      ) : error ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>다시 시도</Text></Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.state}>
          <Ionicons name="sparkles-outline" size={42} color="#B1B1B1" />
          <Text style={styles.emptyTitle}>아직 AI 대화 기록이 없어요.</Text>
          <Text style={styles.stateText}>책이나 매거진에서 AI와 대화하면 이곳에 저장됩니다.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {items.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFF' },
  header: { height: 77, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#878787', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 13 },
  backButton: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#111', fontSize: 18, fontWeight: '900' },
  content: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 34, gap: 12 },
  card: { minHeight: 118, borderWidth: 1, borderColor: '#E6E1E9', borderRadius: 13, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  badge: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#D8FF45', paddingHorizontal: 9, paddingVertical: 4, color: '#34271F', fontSize: 11, fontWeight: '900' },
  date: { color: '#85818A', fontSize: 11, fontWeight: '700' },
  title: { color: '#1D1D23', fontSize: 15, lineHeight: 21, fontWeight: '900' },
  preview: { marginTop: 8, color: '#85818A', fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.62 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingBottom: 70 },
  emptyTitle: { marginTop: 14, color: '#1D1D23', fontSize: 16, fontWeight: '900' },
  stateText: { marginTop: 8, color: '#85818A', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retry: { height: 42, marginTop: 16, paddingHorizontal: 22, borderRadius: 12, backgroundColor: '#BBDD2A', alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});

