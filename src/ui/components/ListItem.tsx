import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function ListItem({ icon, title, subtitle, onPress }: Props) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row} accessibilityRole="button">
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.lg, gap: Spacing.md },
  iconBox:  { width: 44, height: 44, backgroundColor: Colors.background, borderRadius: Radius.linha, alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1 },
  title:    { ...Typography.subheading, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
});
