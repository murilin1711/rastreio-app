import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '@/constants/Theme';

export function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.text}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  text: { ...Typography.label, color: Colors.textMuted, marginRight: Spacing.sm },
  line: { flex: 1, height: 1, backgroundColor: Colors.border },
});
