import { api } from './api';

export interface ChatResponse {
  conversation_id: string;
  message: string;
  citations: Array<{ source: string; claim: string }>;
  confidence_level: string;
}

export interface Conversation {
  id: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: { citations?: Array<{ source: string; claim: string }>; confidence_level?: string } | null;
  created_at: string;
}

export async function sendChat(message: string, conversationId?: string): Promise<ChatResponse> {
  const { data } = await api.post<ChatResponse>('/api/v1/agent/chat', {
    message,
    conversation_id: conversationId,
  });
  return data;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/api/v1/agent/conversations');
  return data;
}

export async function getConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  const { data } = await api.get<ConversationMessage[]>(
    `/api/v1/agent/conversations/${conversationId}/messages`
  );
  return data;
}
