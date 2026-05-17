import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Radius, Spacing } from '@/constants/Theme';

interface ListItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

export function ListItem({ icon, title, subtitle, onPress }: ListItemProps) {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.row}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={16} color={Colors.white} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={14} color={Colors.border} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.sm + 2, gap: Spacing.sm + 2 },
  iconBox:  { width: 28, height: 28, backgroundColor: Colors.primary, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1 },
  title:    { ...Typography.subheading, fontSize: 13, color: Colors.textPrimary },
  subtitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 1 },
});
