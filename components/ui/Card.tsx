import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/Theme';

export function Card({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: 12,
    ...Shadows.card,
  },
});
