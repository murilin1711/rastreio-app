import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

interface ProgressBarProps {
  value: number;
  label?: string;
  labelColor?: string;
  trackColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  value,
  label,
  labelColor = 'rgba(255,255,255,0.7)',
  trackColor = 'rgba(255,255,255,0.15)',
  fillColor = '#7eb3ff',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <View style={styles.row}>
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View style={[styles.fill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
      </View>
      {label && <Text style={[styles.label, { color: labelColor }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  track: { flex: 1, height: 4, borderRadius: Radius.pill, overflow: 'hidden' },
  fill:  { height: '100%', borderRadius: Radius.pill },
  label: { ...Typography.label, fontSize: 9 },
});
