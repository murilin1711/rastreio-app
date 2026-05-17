import { Platform } from 'react-native';

export const Colors = {
  primary:       '#0f2d63',
  primaryLight:  '#1a3a7a',
  accent:        '#2e5dbf',
  background:    '#ffffff',
  surface:       '#f5f7fc',
  border:        '#e8eef8',
  textPrimary:   '#0f2d63',
  textSecondary: '#6b7fa3',
  textMuted:     '#a8b8d0',
  success:       '#16a34a',
  warning:       '#d97706',
  danger:        '#dc2626',
  white:         '#ffffff',
} as const;

export const Typography = {
  display:    { fontFamily: 'Poppins-ExtraBold', fontSize: 28, letterSpacing: -0.5 },
  title:      { fontFamily: 'Poppins-Bold',      fontSize: 20 },
  heading:    { fontFamily: 'Poppins-Bold',      fontSize: 16 },
  subheading: { fontFamily: 'Poppins-SemiBold',  fontSize: 14 },
  body:       { fontFamily: 'Poppins-Regular',   fontSize: 14, lineHeight: 22 },
  caption:    { fontFamily: 'Poppins-Regular',   fontSize: 12 },
  label:      { fontFamily: 'Poppins-SemiBold',  fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' as const },
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  xxl: 32,
} as const;

export const Radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  pill: 999,
} as const;

export const Shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#0f2d63',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
  }),
  floating: Platform.select({
    ios: {
      shadowColor: '#0f2d63',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
    },
    android: { elevation: 10 },
  }),
} as const;
