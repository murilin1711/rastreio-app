import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Alerta, Radius, Spacing, Typography, type NivelAlertaUI } from '@ui/theme';

interface Props { nivel: NivelAlertaUI; label: string; }

/** Chip de status clínico. Único lugar onde usamos caixa alta. */
export function StatusBadge({ nivel, label }: Props) {
  const cor = Alerta[nivel];
  return (
    <View style={[styles.badge, { backgroundColor: cor.bg }]}>
      <Text style={[styles.text, { color: cor.fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: Radius.chip, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
  text:  { ...Typography.chip },
});
