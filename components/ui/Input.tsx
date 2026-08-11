import React, { useState } from 'react';
import { TextInput, View, StyleSheet, type TextInputProps } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

interface InputProps extends TextInputProps {
  icon?: React.ReactNode;
}

export function Input({ icon, style, onFocus, onBlur, ...rest }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.container, focused && styles.focused, style as any]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        onFocus={(e) => { setFocused(true); onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); onBlur?.(e); }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, backgroundColor: Colors.background },
  focused:   { borderColor: Colors.primary },
  icon:      { marginRight: Spacing.sm },
  input:     { flex: 1, ...Typography.body, color: Colors.textPrimary, padding: 0 },
});
