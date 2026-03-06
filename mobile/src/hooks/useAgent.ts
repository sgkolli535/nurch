import { useCallback, useState } from 'react';
import { api } from '../services/api';

interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ source: string; claim: string }>;
  confidence_level?: string;
}

export function useAgent() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    try {
      const { data } = await api.post('/api/v1/agent/chat', {
        message: text,
        conversation_id: conversationId,
      });

      const assistantMsg: AgentMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        citations: data.citations,
        confidence_level: data.confidence_level,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setConversationId(data.conversation_id);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Sorry, something went wrong.' },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [conversationId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
  }, []);

  return { messages, isStreaming, conversationId, sendMessage, clearConversation };
}
