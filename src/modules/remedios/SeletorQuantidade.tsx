import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { numeroBr, UNIDADES } from '@core/medicacoes/unidades';
import type { UnidadeDose } from '@core/medicacoes/tipos';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * `[−] n [+]` da quantidade tomada. O passo e o mínimo são os da unidade (meio comprimido, uma gota…):
 * não dá para chegar a zero — quem não tomou usa "Não tomei".
 */
export function SeletorQuantidade({ valor, unidade, onChange }: { valor: number; unidade: UnidadeDose; onChange: (q: number) => void }) {
  const { passo } = UNIDADES[unidade];
  // Arredonda para não acumular 0,1 + 0,2 do ponto flutuante.
  const ajustar = (delta: number) => onChange(Math.max(passo, Math.round((valor + delta) * 100) / 100));
  const noMinimo = valor <= passo;

  return (
    <View style={styles.linha}>
      <Pressable
        onPress={() => ajustar(-passo)}
        disabled={noMinimo}
        accessibilityRole="button"
        accessibilityLabel="Diminuir"
        accessibilityState={{ disabled: noMinimo }}
        hitSlop={8}
        style={({ pressed }) => [styles.botao, noMinimo && styles.desligado, pressed && styles.pressionado]}
      >
        <Text style={styles.sinal}>−</Text>
      </Pressable>
      <Text style={styles.valor} testID="quantidade" accessibilityLiveRegion="polite">{numeroBr(valor)}</Text>
      <Pressable
        onPress={() => ajustar(passo)}
        accessibilityRole="button"
        accessibilityLabel="Aumentar"
        hitSlop={8}
        style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
      >
        <Text style={styles.sinal}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xl },
  botao: {
    width: 56, height: 56, borderRadius: Radius.linha, borderWidth: 1.5, borderColor: Colors.primary,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  desligado: { opacity: 0.35 },
  pressionado: { opacity: 0.6 },
  sinal: { ...Typography.title, color: Colors.primary },
  valor: { ...Typography.display, color: Colors.textPrimary, minWidth: 64, textAlign: 'center' },
});
