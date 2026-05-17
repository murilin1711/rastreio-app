import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '@/constants/Theme';

interface InternalHeaderProps {
  sectionLabel: string;
  title: string;
  onBack?: () => void;
}

export function InternalHeader({ sectionLabel, title, onBack }: InternalHeaderProps) {
  const router = useRouter();
  const handleBack = onBack ?? (() => router.back());
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBack} style={styles.backBtn} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={16} color={Colors.primary} />
      </TouchableOpacity>
      <Text style={styles.section}>{sectionLabel}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg, backgroundColor: Colors.background },
  backBtn:   { width: 28, height: 28, backgroundColor: Colors.surface, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  section:   { ...Typography.label, color: Colors.textMuted, marginBottom: 2 },
  title:     { ...Typography.display, fontSize: 22, color: Colors.textPrimary },
});
