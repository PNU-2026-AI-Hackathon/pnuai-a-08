export type AiConversationSourceType = 'book' | 'magazine';

export type AiConversation = {
  id: string;
  userId: string;
  sourceType: AiConversationSourceType;
  sourceId: string;
  sourceTitle: string;
  sourceDescription?: string;
  lastMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

