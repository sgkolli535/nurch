import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'warm' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  children: string;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.sage, text: colors.cream },
  secondary: { bg: 'transparent', text: colors.forest, border: colors.sage },
  warm: { bg: colors.terracotta, text: colors.cream },
  ghost: { bg: colors.parchment, text: colors.bark },
};

export function Button({
  variant = 'primary',
  children,
  style,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          opacity: pressed ? 0.9 : 1,
        },
        pressed ? shadows.hover : shadows.rest,
        style,
      ]}
      {...props}
    >
      <Text variant="bodySemibold" color={v.text} style={styles.label}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
  },
});
