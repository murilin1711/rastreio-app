import { Colors as ThemeColors } from './Theme';

// Mantém estrutura light/dark esperada pelo useThemeColor
export const Colors = {
  light: {
    text:            ThemeColors.textPrimary,
    background:      ThemeColors.background,
    tint:            ThemeColors.primary,
    icon:            ThemeColors.textSecondary,
    tabIconDefault:  ThemeColors.textMuted,
    tabIconSelected: ThemeColors.primary,
  },
  dark: {
    text:            ThemeColors.background,
    background:      ThemeColors.primary,
    tint:            ThemeColors.background,
    icon:            ThemeColors.textMuted,
    tabIconDefault:  ThemeColors.textMuted,
    tabIconSelected: ThemeColors.background,
  },
};
