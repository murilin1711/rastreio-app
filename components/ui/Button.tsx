import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, type TouchableOpacityProps } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  pill?: boolean;
}

export function Button({ label, variant = 'primary', loading = false, pill = false, disabled, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        pill && { borderRadius: Radius.pill },
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary} />
        : <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:          { borderRadius: Radius.md, paddingVertical: 13, paddingHorizontal: Spacing.xl, alignItems: 'center', justifyContent: 'center' },
  primary:       { backgroundColor: Colors.primary },
  outline:       { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary },
  ghost:         { backgroundColor: 'transparent' },
  danger:        { backgroundColor: Colors.danger },
  disabled:      { opacity: 0.5 },
  label:         { ...Typography.subheading },
  primaryLabel:  { color: Colors.white },
  outlineLabel:  { color: Colors.primary },
  ghostLabel:    { color: Colors.accent },
  dangerLabel:   { color: Colors.white },
});
