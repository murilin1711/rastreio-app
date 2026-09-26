import { StyleSheet, Text } from 'react-native';
import { CREDITOS } from '@core/publicacao';
import { Colors, Spacing, Typography } from '@ui/theme';

/** Linha de créditos no fim das telas de entrada e de Minha Saúde (D-062). */
export function Creditos() {
  return <Text style={styles.texto}>{CREDITOS}</Text>;
}

const styles = StyleSheet.create({
  texto: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.md },
});
