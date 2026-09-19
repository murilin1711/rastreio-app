import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Radius, Spacing, Typography } from '@ui/theme';

/**
 * Selo de dias seguidos com registro (D-016, parte C). Só aparece com a sequência viva; quando ela
 * zera, o selo some em silêncio — sem aviso, sem "você perdeu", como decidido em 19/09.
 * Nunca diz o que foi registrado: conta dias, não eventos.
 */
export function SeloSequencia({ dias }: { dias: number }) {
  if (dias < 1) return null;
  return (
    <View style={styles.selo}>
      <Ionicons name="flame" size={16} color={Colors.primary} />
      <Text style={styles.numero}>{dias}</Text>
      <Text style={styles.rotulo}>{dias === 1 ? 'dia' : 'dias'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'flex-start', paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.surface },
  numero: { ...Typography.subheading, color: Colors.primary },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
});
