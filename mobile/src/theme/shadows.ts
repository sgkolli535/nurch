import { ViewStyle } from 'react-native';

// Warm-toned shadows using bark color (#3E3229) at low opacity
export const shadows: Record<string, ViewStyle> = {
  rest: {
    shadowColor: '#3E3229',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  hover: {
    shadowColor: '#3E3229',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#3E3229',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 6,
  },
} as const;
