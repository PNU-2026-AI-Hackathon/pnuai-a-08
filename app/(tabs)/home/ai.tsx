import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useBookDetail } from '@/hooks/useBookDetail';
import { AiChatMessage } from '@/models/AiChatMessage';
import { AiConversation } from '@/models/AiConversation';
import { Book } from '@/models/Book';
import { aiConversationRepository } from '@/services/aiConversationRepository';
import { askGeminiAboutBook } from '@/services/geminiService';

function getFriendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : '';

  if (message === 'GEMINI_API_KEY_MISSING') {
    return 'Gemini API 키가 설정되지 않았어요.';
  }
  if (message.includes('401') || message.includes('403')) {
    return 'Gemini API 키 또는 사용 권한을 확인해주세요.';
  }
  if (message.includes('429')) {
    return '요청이 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return '응답 시간이 길어졌어요. 다시 시도해주세요.';
  }
  return 'AI 답변을 가져오지 못했어요. 잠시 후 다시 시도해주세요.';
}

function normalizeAssistantMarkdown(text: string) {
  return text
    .replace(/\\\*/g, '*')
    .replace(/\*\*/g, '');
}

export default function AiBookChatScreen() {
  const { bookId, magazineId, contextTitle, contextDescription, conversationId } = useLocalSearchParams<{
    bookId?: string;
    magazineId?: string;
    contextTitle?: string;
    contextDescription?: string;
    conversationId?: string;
  }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const bookDetail = useBookDetail(bookId ?? '');
  const [conversation, setConversation] = useState<AiConversation | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(conversationId);
  const [isHistoryLoading, setIsHistoryLoading] = useState(Boolean(conversationId));
  const magazineContext = useMemo<Book | null>(() => {
    if (!contextTitle) return null;
    return {
      id: `magazine-${magazineId ?? contextTitle}`,
      title: contextTitle,
      author: '서로서가 편집부',
      description: contextDescription,
      colors: ['#D8FF45', '#F7F6E9'],
      accent: '#34271F',
      motif: 'lines',
    };
  }, [contextDescription, contextTitle, magazineId]);
  const conversationContext = useMemo<Book | null>(() => {
    if (!conversation) return null;
    return {
      id: conversation.sourceId,
      title: conversation.sourceTitle,
      author: conversation.sourceType === 'magazine' ? '서로서가 편집부' : '',
      description: conversation.sourceDescription,
      colors: ['#D8FF45', '#F7F6E9'],
      accent: '#34271F',
      motif: 'lines',
    };
  }, [conversation]);
  const book = conversationContext ?? bookDetail.book ?? magazineContext;
  const isLoading = isHistoryLoading || (Boolean(bookId) && !conversationId && bookDetail.isLoading);
  const error = !conversationId && bookId ? bookDetail.error : null;
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [interactionId, setInteractionId] = useState<string>();
  const listRef = useRef<FlatList<AiChatMessage>>(null);
  const pageWidth = Math.min(width, 620);

  const suggestions = useMemo(() => {
    const title = book?.title.replace('\n', ' ') ?? '이 책';
    return [
      `${title}을 읽고 토론할 만한 주제를 추천해줘`,
      `${title}의 핵심 주제를 스포일러 없이 설명해줘`,
      `${title}의 시대적 배경을 알려줘`,
    ];
  }, [book]);

  useEffect(() => {
    let active = true;

    const loadConversation = async () => {
      if (!conversationId) {
        setConversation(null);
        setActiveConversationId(undefined);
        setIsHistoryLoading(false);
        return;
      }
      if (!user) {
        setIsHistoryLoading(false);
        return;
      }

      setIsHistoryLoading(true);
      try {
        const [nextConversation, nextMessages] = await Promise.all([
          aiConversationRepository.get(conversationId, user.uid),
          aiConversationRepository.listMessages(conversationId, user.uid),
        ]);
        if (!active) return;
        setConversation(nextConversation);
        setMessages(nextMessages);
        setActiveConversationId(nextConversation?.id ?? conversationId);
        requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
      } catch (loadError) {
        console.error('AI 대화 기록 조회 실패:', loadError);
        if (active) Alert.alert('AI 대화 기록을 불러오지 못했어요', '잠시 후 다시 시도해주세요.');
      } finally {
        if (active) setIsHistoryLoading(false);
      }
    };

    void loadConversation();
    return () => {
      active = false;
    };
  }, [conversationId, user]);

  const ensureConversation = async () => {
    if (activeConversationId) return activeConversationId;
    if (!user || !book) return undefined;

    const sourceType = bookId ? 'book' : 'magazine';
    const sourceId = sourceType === 'book' ? book.id : magazineId ?? book.id;
    const sourceTitle = book.title.replaceAll('\n', ' ');
    const nextConversationId = await aiConversationRepository.create({
      userId: user.uid,
      sourceType,
      sourceId,
      sourceTitle,
      sourceDescription: book.description,
    });

    const now = new Date().toISOString();
    setActiveConversationId(nextConversationId);
    setConversation({
      id: nextConversationId,
      userId: user.uid,
      sourceType,
      sourceId,
      sourceTitle,
      sourceDescription: book.description,
      createdAt: now,
      updatedAt: now,
    });
    return nextConversationId;
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!book || !message || isSending) return;

    const userMessage: AiChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
    };

    setMessages((current) => [...current, userMessage]);
    setInput('');
    setIsSending(true);

    try {
      const nextConversationId = await ensureConversation();
      if (nextConversationId) {
        await aiConversationRepository.appendMessage({
          conversationId: nextConversationId,
          role: 'user',
          text: message,
        });
      }

      const result = await askGeminiAboutBook({
        book,
        message,
        previousInteractionId: interactionId,
        history: messages.map((item) => ({
          role: item.role === 'assistant' ? 'model' : 'user',
          text: item.text,
        })),
      });
      setInteractionId(result.interactionId);
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${result.interactionId ?? Date.now()}`,
          role: 'assistant',
          text: result.text,
        },
      ]);
      if (nextConversationId) {
        await aiConversationRepository.appendMessage({
          conversationId: nextConversationId,
          role: 'assistant',
          text: result.text,
        });
      }
    } catch (sendError) {
      Alert.alert('답변을 불러오지 못했어요', getFriendlyError(sendError));
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={[styles.page, { width: pageWidth }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            hitSlop={12}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="arrow-back" size={25} color={colors.text} />
          </Pressable>

          <Image
            source={require('../../../pictures/Logo_full.png')}
            style={styles.wordmark}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="서로서가"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="홈으로 이동"
            hitSlop={12}
            onPress={() => router.replace('/(tabs)/home')}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons name="home-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.status}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : error || !book ? (
          <View style={styles.status}>
            <Text style={styles.statusText}>{error ?? '책 정보를 찾을 수 없어요.'}</Text>
          </View>
        ) : (
          <>
            {messages.length === 0 ? (
              <View style={styles.intro}>
                <Image
                  source={require('../../../assets/images/rental-symbol.png')}
                  style={styles.symbol}
                  resizeMode="contain"
                />
                <Text style={styles.introTitle}>서로 AI에게</Text>
                <Text style={styles.introSubtitle}>{magazineContext ? '이 매거진에 대해 질문해보세요' : '책에 대해 질문해보세요'}</Text>

                <View style={styles.suggestions}>
                  {suggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      accessibilityRole="button"
                      onPress={() => void sendMessage(suggestion)}
                      style={({ pressed }) => [
                        styles.suggestion,
                        pressed && styles.suggestionPressed,
                      ]}
                    >
                      <Text style={styles.suggestionText}>{suggestion}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.messageBubble,
                      item.role === 'user' ? styles.userBubble : styles.assistantBubble,
                    ]}
                  >
                    {item.role === 'assistant' ? (
                      <Text style={styles.aiLabel}>서로 AI</Text>
                    ) : null}
                    {item.role === 'assistant' ? (
                      <Markdown style={markdownStyles}>{normalizeAssistantMarkdown(item.text)}</Markdown>
                    ) : (
                      <Text style={styles.messageText}>{item.text}</Text>
                    )}
                  </View>
                )}
                ItemSeparatorComponent={() => <View style={styles.messageGap} />}
                contentContainerStyle={styles.messageList}
                keyboardShouldPersistTaps="handled"
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
                showsVerticalScrollIndicator={false}
                ListFooterComponent={
                  isSending ? (
                    <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                      <ActivityIndicator size="small" color={colors.accent} />
                      <Text style={styles.typingText}>답변을 생각하고 있어요</Text>
                    </View>
                  ) : null
                }
              />
            )}

            <View style={styles.composer}>
              <TextInput
                value={input}
                onChangeText={setInput}
                placeholder="메시지를 입력하세요"
                placeholderTextColor={colors.inactive}
                multiline
                maxLength={1000}
                editable={!isSending}
                accessibilityLabel="AI에게 보낼 메시지"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="메시지 보내기"
                disabled={!input.trim() || isSending}
                onPress={() => void sendMessage(input)}
                style={({ pressed }) => [
                  styles.sendButton,
                  (!input.trim() || isSending) && styles.sendButtonDisabled,
                  pressed && styles.pressed,
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Ionicons name="arrow-forward" size={21} color={colors.text} />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignSelf: 'center' },
  topBar: {
    height: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: { width: 116, height: 42 },
  intro: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  symbol: { width: 58, height: 58, marginBottom: spacing.md },
  introTitle: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  introSubtitle: {
    color: colors.text,
    fontSize: typography.subtitle,
    fontWeight: '600',
    marginTop: spacing.sm,
  },
  suggestions: { alignItems: 'flex-start', gap: spacing.sm, marginTop: spacing.lg },
  suggestion: {
    minHeight: 36,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  suggestionPressed: { backgroundColor: colors.accentSoft, transform: [{ scale: 0.99 }] },
  suggestionText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  messageList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  messageGap: { height: spacing.md },
  messageBubble: {
    maxWidth: '84%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.accentSoft },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  aiLabel: { color: colors.secondaryAccent, fontSize: 11, fontWeight: '900', marginBottom: 5 },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  typingBubble: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  typingText: { color: colors.textMuted, fontSize: 12, marginLeft: spacing.sm },
  composer: {
    minHeight: 58,
    maxHeight: 116,
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1.3,
    borderColor: colors.textMuted,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingLeft: spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 42,
    maxHeight: 96,
    color: colors.text,
    fontSize: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendButtonDisabled: { opacity: 0.38 },
  pressed: { opacity: 0.55 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  statusText: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
  text: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  strong: {
    fontWeight: '800',
  },
  heading1: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 8,
  },
  heading2: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 8,
  },
  heading3: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 0,
    marginBottom: 6,
  },
  bullet_list: {
    marginTop: 0,
    marginBottom: 8,
  },
  ordered_list: {
    marginTop: 0,
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  code_inline: {
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  fence: {
    color: colors.text,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 8,
    marginVertical: 6,
  },
});
