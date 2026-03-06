import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ConfidenceBadgeProps {
  level: 'high' | 'moderate' | 'low';
}

const CONFIG = {
  high: {
    label: 'High confidence',
    color: colors.forest,
    bg: colors.sprout + '25',
    icon: '\u2713',  // checkmark
  },
  moderate: {
    label: 'Moderate \u2014 consider a closer photo',
    color: colors.bark,
    bg: colors.sunlight + '25',
    icon: '\u25CB',  // circle
  },
  low: {
    label: 'Low confidence \u2014 see suggestions below',
    color: colors.terracotta,
    bg: colors.terracotta + '15',
    icon: '\u25B3',  // triangle
  },
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  const config = CONFIG[level] ?? CONFIG.moderate;

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text variant="caption" color={config.color} style={styles.label}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  icon: {
    fontSize: 12,
  },
  label: {
    fontWeight: '500',
  },
});
