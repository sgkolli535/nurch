import { TextStyle } from 'react-native';

export const fonts = {
  display: 'Fraunces_700Bold',
  heading: 'Fraunces_700Bold',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  accent: 'Caveat_400Regular',
} as const;

export const typeScale: Record<string, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 42 },
  heading1: { fontFamily: fonts.heading, fontSize: 24, lineHeight: 30 },
  heading2: { fontFamily: fonts.heading, fontSize: 18, lineHeight: 24 },
  subtitle: { fontFamily: fonts.bodySemi, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  bodyMedium: { fontFamily: fonts.bodyMed, fontSize: 14, lineHeight: 20 },
  bodySemibold: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16 },
  handwritten: { fontFamily: fonts.accent, fontSize: 14, lineHeight: 18 },
} as const;
