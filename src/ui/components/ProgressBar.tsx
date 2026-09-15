import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props { value: number; label?: string; }

export function ProgressBar({ value, label }: Props) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.row} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  track: { flex: 1, height: 6, borderRadius: Radius.pill, backgroundColor: Colors.surfaceAlt, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.pill, backgroundColor: Colors.accent },
  label: { ...Typography.caption, color: Colors.textSecondary },
});
