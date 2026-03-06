import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { StatusDot } from '../ui/StatusDot';
import { Card } from '../ui/Card';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type HealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown';

interface PlantCardProps {
  name: string;
  status: HealthStatus;
  zone?: string;
  emoji?: string;
  onPress?: () => void;
}

export function PlantCard({ name, status, zone, emoji, onPress }: PlantCardProps) {
  const statusLabels: Record<HealthStatus, string> = {
    healthy: 'Healthy',
    warning: 'Needs attention',
    critical: 'Critical',
    unknown: 'Unknown',
  };

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <Card style={pressed ? { ...styles.card, ...styles.pressed } : styles.card}>
          <Text style={styles.emoji}>{emoji ?? '🌱'}</Text>
          <Text variant="bodySemibold" color={colors.soil} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.statusRow}>
            <StatusDot status={status} pulse={status === 'warning' || status === 'critical'} />
            <Text variant="caption" color={colors.bark} style={styles.statusLabel}>
              {statusLabels[status]}
            </Text>
          </View>
          {zone && (
            <Text variant="handwritten" color={colors.sage}>
              {zone}
            </Text>
          )}
        </Card>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    padding: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
  emoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.xs,
  },
  statusLabel: {
    opacity: 0.8,
  },
});
