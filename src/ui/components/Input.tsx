import React, { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props extends TextInputProps {
  icon?: React.ReactNode;
}

export function Input({ icon, style, onFocus, onBlur, ...rest }: Props) {
  const [focado, setFocado] = useState(false);
  return (
    <View style={[styles.container, focado && styles.focado, style as object]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        onFocus={(e) => { setFocado(true); onFocus?.(e); }}
        onBlur={(e) => { setFocado(false); onBlur?.(e); }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', minHeight: 50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.linha, paddingHorizontal: Spacing.lg, backgroundColor: Colors.surface },
  focado:    { borderColor: Colors.primary },
  icon:      { marginRight: Spacing.sm },
  input:     { flex: 1, ...Typography.body, color: Colors.textPrimary, paddingVertical: Spacing.md },
});
