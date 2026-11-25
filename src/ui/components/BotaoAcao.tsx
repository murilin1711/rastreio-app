import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Shadows, Spacing } from '@ui/theme';

interface Props {
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  onPress: () => void;
  /** Ocupa a linha inteira, com o ícone ao lado do texto. */
  largo?: boolean;
}

/** Cinza-azulado bem claro do ícone ao fundo: aparece como marca d'água, sem competir com o texto. */
const MARCA_DAGUA = '#EEF2F8';

/**
 * Botão de ação grande (escolhido pelo Murilo em 24/11/2026, opção "Z"): fundo branco, o ícone
 * gigante e clarinho no canto como marca d'água, o ícone pequeno em marinho no alto e o nome
 * embaixo a 17 pt, sem cortar em letra grande do sistema. O largo ganha uma faixa ciano à esquerda.
 * Sem cores próprias por ação: as cores da Home ficam nos cartões de "Meus cuidados".
 */
export function BotaoAcao({ icone, rotulo, onPress, largo }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      onPress={onPress}
      style={({ pressed }) => [styles.base, largo ? styles.largo : styles.normal, pressed && styles.pressionado]}
    >
      {largo ? <View style={styles.faixa} /> : null}
      <View pointerEvents="none" style={largo ? styles.fundoLargo : styles.fundo} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Ionicons name={icone} size={largo ? 80 : 96} color={MARCA_DAGUA} />
      </View>
      <Ionicons name={icone} size={26} color={Colors.primary} />
      <Text style={[styles.rotulo, largo && styles.rotuloLargo]}>{rotulo}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base:        { backgroundColor: Colors.surface, borderRadius: Radius.bloco + 2, ...Shadows.card, overflow: 'hidden', padding: Spacing.lg },
  normal:      { flex: 1, minHeight: 128, justifyContent: 'space-between', gap: Spacing.md },
  largo:       { width: '100%', minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingLeft: Spacing.lg + 4 },
  pressionado: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  faixa:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, backgroundColor: Colors.logoCiano },
  fundo:       { position: 'absolute', right: -14, top: -12 },
  fundoLargo:  { position: 'absolute', right: -10, top: -10 },
  rotulo:      { fontFamily: 'Poppins-Bold', fontSize: 17, lineHeight: 23, color: Colors.textPrimary },
  rotuloLargo: { flex: 1 },
});
