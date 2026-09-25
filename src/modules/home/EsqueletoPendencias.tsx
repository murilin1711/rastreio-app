import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '@ui/theme';

/**
 * Lugar das pendências enquanto as fontes carregam (D-041). Mesmo desenho do `ItemHoje` — caixa,
 * anel e duas linhas —, para a troca pela lista real não mexer no que está em volta. Parado de
 * propósito: um brilho correndo seria movimento a mais numa tela que dura um instante.
 */
export function EsqueletoPendencias() {
  return (
    <View testID="esqueleto-pendencias" accessibilityLabel="Carregando pendências" style={{ gap: Spacing.sm }}>
      {[0.55, 0.4].map((largura, i) => (
        <View key={i} style={styles.caixa}>
          <View style={styles.anel} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={[styles.barra, { width: `${largura * 100}%` }]} />
            <View style={[styles.barra, styles.fina, { width: `${(largura + 0.3) * 100}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  caixa: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.linha, borderWidth: 1, borderColor: Colors.border,
  },
  anel: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border },
  barra: { height: 12, borderRadius: 6, backgroundColor: Colors.border },
  fina: { height: 9, opacity: 0.7 },
});
