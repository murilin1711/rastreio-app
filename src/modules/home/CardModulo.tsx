import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, EmBreveBadge, Radius, Shadows, Spacing, Typography } from '@ui/index';

interface Props {
  titulo: string;
  icone: keyof typeof Ionicons.glyphMap;
  /** Duas cores do gradiente do bloco. */
  capa: [string, string];
  emBreve?: boolean;
  onPress?: () => void;
}

/**
 * Bloco de módulo: o card *é* a cor (D-022). Gradiente ocupando tudo, símbolo discreto no
 * canto e o nome embaixo — sem número, sem status, sem descrição. O módulo é o mapa da
 * home, não o painel; quem diz o que fazer são as pendências acima.
 */
export function CardModulo({ titulo, icone, capa, emBreve, onPress }: Props) {
  return (
    <Pressable
      onPress={emBreve ? undefined : onPress}
      disabled={emBreve}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: !!emBreve }}
      style={({ pressed }) => [styles.card, pressed && !emBreve && styles.pressionado]}
    >
      <LinearGradient
        colors={capa}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.bloco, emBreve && { opacity: 0.45 }]}
      >
        {/* Brilho no canto: dá volume ao bloco sem acrescentar informação. */}
        <View style={styles.brilho} />
        <Ionicons name={icone} size={25} color="rgba(255,255,255,0.92)" />
        <Text style={styles.titulo} numberOfLines={2}>{titulo}</Text>
      </LinearGradient>
      {emBreve ? <View style={styles.etiqueta}><EmBreveBadge /></View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: Radius.bloco, overflow: 'hidden', ...Shadows.card },
  pressionado: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  bloco: { height: 114, padding: Spacing.lg - 2, justifyContent: 'space-between' },
  brilho: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70, top: -58, right: -46,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  titulo: { ...Typography.subheading, color: Colors.white },
  etiqueta: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
});
