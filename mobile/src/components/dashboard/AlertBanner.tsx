import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../ui/Text';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface Alert {
  id: string;
  tier: string;
  title: string;
  body: string;
}

interface AlertBannerProps {
  alerts: Alert[];
  onPress?: (alertId: string) => void;
}

const TIER_STYLES = {
  critical: { bg: colors.terracotta + '15', border: colors.terracotta + '40', text: colors.terracotta },
  advisory: { bg: colors.sunlight + '15', border: colors.sunlight + '40', text: colors.bark },
  informational: { bg: colors.sky + '15', border: colors.sky + '40', text: colors.bark },
};

export function AlertBanner({ alerts, onPress }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.slice(0, 3).map((alert) => {
        const tier = TIER_STYLES[alert.tier as keyof typeof TIER_STYLES] ?? TIER_STYLES.informational;
        return (
          <Pressable
            key={alert.id}
            style={[styles.alert, { backgroundColor: tier.bg, borderColor: tier.border }]}
            onPress={() => onPress?.(alert.id)}
          >
            <Text variant="bodySemibold" color={tier.text}>{alert.title}</Text>
            <Text variant="caption" color={colors.bark} numberOfLines={2} style={styles.body}>
              {alert.body}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginBottom: spacing.lg },
  alert: {
    borderWidth: 1, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  body: { marginTop: 2, opacity: 0.85 },
});
