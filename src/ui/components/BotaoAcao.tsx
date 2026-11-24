import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing } from '@ui/theme';

interface Props {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  onPress: () => void;
  /** Ocupa a linha inteira, com o ícone ao lado do texto. */
  largo?: boolean;
}

/** Botão de ação grande: ícone + rótulo a 17 pt, sem cortar o texto em letra grande do sistema. */
export function BotaoAcao({ icone, rotulo, onPress, largo }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={[styles.base, largo ? styles.largo : styles.normal]}
    >
      <Ionicons name={icone} size={28} color={Colors.primary} />
      <Text style={[styles.rotulo, largo ? styles.rotuloLargo : styles.rotuloNormal]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base:         { backgroundColor: Colors.surface, borderRadius: Radius.bloco, ...Shadows.card, minHeight: 96, alignItems: 'center', justifyContent: 'center', padding: Spacing.md, gap: Spacing.sm },
  normal:       { flex: 1, flexDirection: 'column' },
  largo:        { width: '100%', minHeight: 64, flexDirection: 'row', justifyContent: 'flex-start', gap: Spacing.md },
  rotulo:       { fontFamily: 'Poppins-SemiBold', fontSize: 17, lineHeight: 23, color: Colors.textPrimary },
  rotuloNormal: { textAlign: 'center' },
  rotuloLargo:  { flex: 1 },
});
