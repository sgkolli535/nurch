import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../ui/Text';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ReasoningChainProps {
  steps: string[];
  defaultExpanded?: boolean;
}

export function ReasoningChain({ steps, defaultExpanded = false }: ReasoningChainProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!steps || steps.length === 0) return null;

  return (
    <View style={styles.container}>
      <Pressable onPress={() => setExpanded(!expanded)} style={styles.header}>
        <Text variant="caption" color={colors.moss} style={styles.headerText}>
          {expanded ? 'Hide' : 'View'} reasoning ({steps.length} steps)
        </Text>
        <Text style={styles.chevron}>{expanded ? '\u25B2' : '\u25BC'}</Text>
      </Pressable>

      {expanded && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.stepsContainer}>
          {steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text variant="caption" color={colors.cream} style={styles.stepNumberText}>
                  {i + 1}
                </Text>
              </View>
              <Text variant="caption" color={colors.bark} style={styles.stepText}>
                {step}
              </Text>
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.parchment,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerText: {
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 10,
    color: colors.moss,
  },
  stepsContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 10,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    lineHeight: 18,
    opacity: 0.9,
  },
});
