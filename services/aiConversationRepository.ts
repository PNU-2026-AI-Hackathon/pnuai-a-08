import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { AiChatMessage, AiChatRole } from '@/models/AiChatMessage';
import { AiConversation, AiConversationSourceType } from '@/models/AiConversation';
import { toIsoString } from '@/services/firestoreMappers';

type ConversationData = {
  userId: string;
  sourceType: AiConversationSourceType;
  sourceId: string;
  sourceTitle: string;
  sourceDescription?: string;
};

type AppendMessageInput = {
  conversationId: string;
  role: AiChatRole;
  text: string;
};

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function mapConversationSnapshot(snapshot: Awaited<ReturnType<typeof getDoc>>): AiConversation {
  const data = (snapshot.data() ?? {}) as Record<string, unknown>;
  return {
    id: snapshot.id,
    userId: asString(data.userId),
    sourceType: data.sourceType === 'magazine' ? 'magazine' : 'book',
    sourceId: asString(data.sourceId),
    sourceTitle: asString(data.sourceTitle, '서로 AI 대화'),
    sourceDescription: asString(data.sourceDescription) || undefined,
    lastMessage: asString(data.lastMessage) || undefined,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt),
  };
}

function mapMessageSnapshot(snapshot: Awaited<ReturnType<typeof getDoc>>): AiChatMessage {
  const data = (snapshot.data() ?? {}) as Record<string, unknown>;
  return {
    id: snapshot.id,
    role: data.role === 'assistant' ? 'assistant' : 'user',
    text: asString(data.text),
    createdAt: toIsoString(data.createdAt),
  };
}

function dateValue(value?: string) {
  return value ? new Date(value).getTime() || 0 : 0;
}

export const aiConversationRepository = {
  async create(input: ConversationData): Promise<string> {
    if (!input.userId) throw new Error('AI_CONVERSATION_USER_REQUIRED');
    const reference = doc(collection(db, 'aiConversations'));
    await setDoc(reference, {
      conversationId: reference.id,
      userId: input.userId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      sourceTitle: input.sourceTitle,
      sourceDescription: input.sourceDescription ?? '',
      lastMessage: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return reference.id;
  },

  async get(conversationId: string, userId: string): Promise<AiConversation | null> {
    if (!conversationId || !userId) return null;
    const snapshot = await getDoc(doc(db, 'aiConversations', conversationId));
    if (!snapshot.exists()) return null;
    const conversation = mapConversationSnapshot(snapshot);
    return conversation.userId === userId ? conversation : null;
  },

  async listByUser(userId: string): Promise<AiConversation[]> {
    if (!userId) return [];
    const snapshot = await getDocs(
      query(collection(db, 'aiConversations'), where('userId', '==', userId)),
    );
    return snapshot.docs
      .map(mapConversationSnapshot)
      .sort((a, b) => dateValue(b.updatedAt ?? b.createdAt) - dateValue(a.updatedAt ?? a.createdAt));
  },

  async listMessages(conversationId: string, userId: string): Promise<AiChatMessage[]> {
    if (!conversationId || !userId) return [];
    const conversation = await this.get(conversationId, userId);
    if (!conversation) return [];
    const snapshot = await getDocs(
      query(collection(db, 'aiConversations', conversationId, 'messages'), orderBy('createdAt', 'asc')),
    );
    return snapshot.docs.map(mapMessageSnapshot);
  },

  async appendMessage(input: AppendMessageInput): Promise<AiChatMessage> {
    const reference = doc(collection(db, 'aiConversations', input.conversationId, 'messages'));
    const text = input.text.trim();
    if (!text) throw new Error('AI_MESSAGE_EMPTY');

    await runTransaction(db, async (transaction) => {
      transaction.set(reference, {
        messageId: reference.id,
        role: input.role,
        text,
        createdAt: serverTimestamp(),
      });
      transaction.update(doc(db, 'aiConversations', input.conversationId), {
        lastMessage: text.slice(0, 160),
        updatedAt: serverTimestamp(),
      });
    });

    return {
      id: reference.id,
      role: input.role,
      text,
      createdAt: new Date().toISOString(),
    };
  },
};
