import React from 'react';
import { TextInput, TextInputProps, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { borderRadius, spacing } from '../../theme/spacing';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export function Input({ label, error, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={containerStyle}>
      {label && (
        <Text variant="caption" color={colors.moss} style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={colors.bark + '60'}
        {...props}
      />
      {error && (
        <Text variant="caption" color={colors.terracotta} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  input: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.bark,
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.parchment,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  inputError: {
    borderColor: colors.terracotta,
  },
  error: {
    marginTop: spacing.xs,
  },
});
