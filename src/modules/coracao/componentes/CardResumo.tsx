import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Shadows, Spacing, Typography } from '@ui/theme';

interface Props { titulo: string; valor?: ReactNode; detalhe?: string; vazio: string; onPress?: () => void; rodape?: ReactNode }

/** Card do dashboard cardiovascular (§19). Raio de bloco; sem cor por valor. */
export function CardResumo({ titulo, valor, detalhe, vazio, onPress, rodape }: Props) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <Text style={styles.titulo}>{titulo}</Text>
      {valor ? (
        <View style={{ marginTop: Spacing.xs }}>{typeof valor === 'string' ? <Text style={styles.valor}>{valor}</Text> : valor}</View>
      ) : (
        <Text style={styles.vazio}>{vazio}</Text>
      )}
      {detalhe ? <Text style={styles.detalhe}>{detalhe}</Text> : null}
      {rodape}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: '46%', backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: 2, ...(Shadows.card as object) },
  titulo: { ...Typography.caption, color: Colors.textSecondary },
  valor: { ...Typography.title, color: Colors.textPrimary },
  vazio: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.xs },
  detalhe: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
});
