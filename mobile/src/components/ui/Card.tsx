import React from 'react';
import { View, ViewProps, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';

interface CardProps extends ViewProps {
  elevated?: boolean;
  style?: ViewStyle;
}

export function Card({ elevated = false, style, children, ...props }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        elevated ? shadows.hover : shadows.rest,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.cream,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.parchment,
    padding: spacing.lg,
  },
});
