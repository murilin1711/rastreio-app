import { Text, type TextProps, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/constants/Theme';

export type TextVariant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'label';

export type ThemedTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
};

export function ThemedText({ style, variant = 'body', color, ...rest }: ThemedTextProps) {
  return (
    <Text
      style={[
        styles[variant],
        { color: color ?? Colors.textPrimary },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  display:    { ...Typography.display,    color: Colors.textPrimary },
  title:      { ...Typography.title,      color: Colors.textPrimary },
  heading:    { ...Typography.heading,    color: Colors.textPrimary },
  subheading: { ...Typography.subheading, color: Colors.textSecondary },
  body:       { ...Typography.body,       color: Colors.textSecondary },
  caption:    { ...Typography.caption,    color: Colors.textMuted },
  label:      { ...Typography.label,      color: Colors.textMuted },
});
