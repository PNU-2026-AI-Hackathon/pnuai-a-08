export type AiChatRole = 'user' | 'assistant';

export type AiChatMessage = {
  id: string;
  role: AiChatRole;
  text: string;
};

