import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { Badge } from '../ui/Badge';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface NotificationItemProps {
  tier: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  onPress?: () => void;
}

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: colors.cream, bg: colors.terracotta },
  advisory: { label: 'Advisory', color: colors.bark, bg: colors.sunlight },
  informational: { label: 'Info', color: colors.bark, bg: colors.sky + '40' },
};

export function NotificationItem({ tier, title, body, timestamp, isRead, onPress }: NotificationItemProps) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.informational;

  return (
    <Pressable
      style={[styles.container, !isRead && styles.unread]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Badge label={config.label} color={config.color} backgroundColor={config.bg} />
        <Text variant="caption" color={colors.bark} style={styles.time}>{timestamp}</Text>
      </View>
      <Text variant="bodySemibold" color={colors.soil}>{title}</Text>
      <Text variant="caption" color={colors.bark} numberOfLines={2} style={styles.body}>
        {body}
      </Text>
      {!isRead && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.parchment,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: colors.sage,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  time: { opacity: 0.6 },
  body: { marginTop: 2, opacity: 0.8 },
  unreadDot: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.sage,
  },
});
