import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, type TouchableOpacityProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

type Variante = 'primary' | 'outline' | 'ghost' | 'danger';

interface Props extends TouchableOpacityProps {
  label: string;
  variant?: Variante;
  loading?: boolean;
  pill?: boolean;
}

export function Button({ label, variant = 'primary', loading = false, pill = false, disabled, style, ...rest }: Props) {
  const desabilitado = disabled || loading;
  const claro = variant === 'primary' || variant === 'danger';
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={desabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!desabilitado, busy: loading }}
      style={[styles.base, pill && { borderRadius: Radius.pill }, styles[variant], desabilitado && styles.disabled, style]}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={claro ? Colors.white : Colors.primary} />
        : <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base:         { borderRadius: Radius.linha, minHeight: 50, paddingVertical: 13, paddingHorizontal: Spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  primary:      { backgroundColor: Colors.primary },
  outline:      { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  ghost:        { backgroundColor: 'transparent' },
  danger:       { backgroundColor: Colors.danger },
  disabled:     { opacity: 0.45 },
  label:        { ...Typography.subheading },
  primaryLabel: { color: Colors.white },
  outlineLabel: { color: Colors.primary },
  ghostLabel:   { color: Colors.textSecondary },
  dangerLabel:  { color: Colors.white },
});
