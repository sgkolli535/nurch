export const colors = {
  // Greens — Brand & Nature
  sage: '#8B9E7C',
  forest: '#4A5D3F',
  moss: '#6B7F5E',

  // Warm Accents
  terracotta: '#C67B5C',
  clay: '#D4956B',
  blush: '#D4A0A0',

  // Neutrals — Backgrounds & Text
  linen: '#F5F0E8',
  cream: '#FAF7F2',
  parchment: '#EDE6DA',
  bark: '#5C4A3A',
  soil: '#3E3229',

  // Semantic — States & Feedback
  sprout: '#A8C686',
  sunlight: '#E8C95A',
  sky: '#9BB5C9',
} as const;

export const semantic = {
  healthy: colors.sprout,
  warning: colors.sunlight,
  critical: colors.terracotta,
  info: colors.sky,
} as const;

export type ColorName = keyof typeof colors;
export type SemanticColor = keyof typeof semantic;
