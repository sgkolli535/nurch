import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { colors } from '../../theme/colors';
import { typeScale } from '../../theme/typography';

type TextVariant = keyof typeof typeScale;

interface NurchTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function Text({
  variant = 'body',
  color = colors.bark,
  style,
  ...props
}: NurchTextProps) {
  const variantStyle = typeScale[variant] ?? typeScale.body;

  return (
    <RNText
      style={[variantStyle, { color } as TextStyle, style]}
      {...props}
    />
  );
}
