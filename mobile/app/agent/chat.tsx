import React, { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { ChatBubble } from '../../src/components/agent/ChatBubble';
import { ConfidenceBadge } from '../../src/components/trust/ConfidenceBadge';
import { CitationList } from '../../src/components/trust/CitationList';
import { Text } from '../../src/components/ui/Text';
import { LoadingPulse } from '../../src/components/ui/LoadingPulse';
import { colors } from '../../src/theme/colors';
import { spacing, borderRadius } from '../../src/theme/spacing';
import { shadows } from '../../src/theme/shadows';
import { api } from '../../src/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{ source: string; claim: string }>;
  confidence_level?: string;
}

export default function AgentChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    try {
      // Use standard endpoint (SSE streaming would use EventSource in production)
      const res = await api.post('/api/v1/agent/chat', {
        message: userMessage.content,
        conversation_id: conversationId,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.data.message,
        citations: res.data.citations,
        confidence_level: res.data.confidence_level,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (res.data.conversation_id) {
        setConversationId(res.data.conversation_id);
      }
    } catch (e: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I couldn't process that right now. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View>
      <ChatBubble role={item.role} content={item.content} />
      {item.role === 'assistant' && item.confidence_level && (
        <View style={styles.metadata}>
          <ConfidenceBadge level={item.confidence_level as any} />
          {item.citations && item.citations.length > 0 && (
            <CitationList citations={item.citations} />
          )}
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="heading2" color={colors.soil} style={styles.emptyTitle}>
              Ask Nurch anything
            </Text>
            <Text variant="body" color={colors.bark} style={styles.emptyBody}>
              I can help with plant care, diagnose issues, explain your garden's
              health data, and suggest what to do next. I'll show my reasoning and
              cite my sources.
            </Text>
            <View style={styles.suggestions}>
              {[
                'Why are my tomato leaves yellowing?',
                'What should I do for my garden this week?',
                'Is my basil getting enough water?',
              ].map((suggestion) => (
                <Pressable
                  key={suggestion}
                  style={styles.suggestionChip}
                  onPress={() => { setInput(suggestion); }}
                >
                  <Text variant="caption" color={colors.forest}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      {isStreaming && (
        <View style={styles.streamingIndicator}>
          <LoadingPulse size={20} color={colors.sage} />
          <Text variant="caption" color={colors.sage}>Nurch is thinking...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your garden..."
          placeholderTextColor={colors.bark + '60'}
          multiline
          maxLength={1000}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || isStreaming) && styles.sendDisabled]}
          onPress={sendMessage}
          disabled={!input.trim() || isStreaming}
        >
          <Text variant="bodySemibold" color={colors.cream}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.linen },
  messageList: { padding: spacing.md, paddingBottom: spacing.xl },
  metadata: { paddingHorizontal: spacing.xl, paddingBottom: spacing.sm, gap: spacing.xs },
  emptyState: { padding: spacing.xxl, alignItems: 'center', marginTop: spacing.xxxl },
  emptyTitle: { textAlign: 'center', marginBottom: spacing.sm },
  emptyBody: { textAlign: 'center', opacity: 0.8, marginBottom: spacing.xl, lineHeight: 22 },
  suggestions: { gap: spacing.sm, width: '100%' },
  suggestionChip: {
    backgroundColor: colors.cream, borderWidth: 1, borderColor: colors.parchment,
    borderRadius: borderRadius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  streamingIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.xs,
  },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    padding: spacing.md, backgroundColor: colors.cream,
    borderTopWidth: 1, borderTopColor: colors.parchment,
    ...shadows.rest,
  },
  textInput: {
    flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.bark,
    backgroundColor: colors.linen, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    maxHeight: 100, borderWidth: 1, borderColor: colors.parchment,
  },
  sendButton: {
    backgroundColor: colors.sage, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  sendDisabled: { opacity: 0.5 },
});
