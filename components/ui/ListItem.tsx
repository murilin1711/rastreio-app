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
        <Ionicons name={icon} size={26} color={Colors.white} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox:  { width: 56, height: 56, backgroundColor: Colors.primary, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  content:  { flex: 1 },
  title:    { ...Typography.subheading, fontSize: 16, color: Colors.textPrimary },
  subtitle: { ...Typography.body, fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
});
