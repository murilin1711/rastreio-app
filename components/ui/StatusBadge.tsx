import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

export type BadgeStatus = 'ok' | 'pending' | 'urgent' | 'na';

const config: Record<BadgeStatus, { label: string; bg: string; color: string }> = {
  ok:      { label: 'EM DIA',   bg: '#dcfce7', color: Colors.success },
  pending: { label: 'PENDENTE', bg: '#fef3c7', color: Colors.warning },
  urgent:  { label: 'URGENTE',  bg: '#fee2e2', color: Colors.danger  },
  na:      { label: 'N/A',      bg: Colors.surface, color: Colors.textMuted },
};

export function StatusBadge({ status }: { status: BadgeStatus }) {
  const { label, bg, color } = config[status];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: Radius.sm, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  text:  { ...Typography.label, fontSize: 9 },
});
