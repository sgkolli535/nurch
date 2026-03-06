import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ChatBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function ChatBubble({ role, content, timestamp }: ChatBubbleProps) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text
          variant="body"
          color={isUser ? colors.cream : colors.bark}
        >
          {content}
        </Text>
        {timestamp && (
          <Text
            variant="caption"
            color={isUser ? colors.cream + 'AA' : colors.bark + '60'}
            style={styles.time}
          >
            {timestamp}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bubbleUser: {
    backgroundColor: colors.sage,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.parchment,
    borderBottomLeftRadius: 4,
  },
  time: {
    marginTop: spacing.xs,
    fontSize: 10,
  },
});
