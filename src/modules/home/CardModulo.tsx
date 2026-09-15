import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, EmBreveBadge, Radius, Shadows, Spacing, Typography } from '@ui/index';

interface Props {
  titulo: string;
  descricao: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Duas cores do gradiente da capa. */
  capa: [string, string];
  emBreve?: boolean;
  onPress?: () => void;
}

/** Card de módulo em galeria (estilo Notion): capa com gradiente + ícone, título e descrição embaixo. */
export function CardModulo({ titulo, descricao, icone, capa, emBreve, onPress }: Props) {
  return (
    <Pressable
      onPress={emBreve ? undefined : onPress}
      disabled={emBreve}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!emBreve }}
      style={({ pressed }) => [styles.card, pressed && !emBreve && { opacity: 0.85 }]}
    >
      <LinearGradient colors={capa} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.capa, emBreve && { opacity: 0.45 }]}>
        <Ionicons name={icone} size={34} color="rgba(255,255,255,0.92)" />
      </LinearGradient>
      {emBreve ? <View style={styles.etiqueta}><EmBreveBadge /></View> : null}
      <View style={styles.corpo}>
        <Text style={[styles.titulo, emBreve && { color: Colors.textSecondary }]} numberOfLines={1}>{titulo}</Text>
        <Text style={styles.descricao} numberOfLines={2}>{descricao}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.bloco, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadows.card },
  capa: { height: 92, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { position: 'absolute', top: Spacing.sm, left: Spacing.sm },
  corpo: { padding: Spacing.md, paddingTop: Spacing.sm + 2, gap: 2, minHeight: 74 },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  descricao: { ...Typography.caption, color: Colors.textSecondary },
});
