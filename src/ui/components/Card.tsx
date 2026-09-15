import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@ui/theme';

/** Bloco branco de hierarquia alta (raio `bloco`). Para linhas, use ListItem. */
export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.xl, ...Shadows.card },
});
