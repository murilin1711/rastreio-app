import { StyleSheet, Text, View } from 'react-native';
import { Alerta, Colors, Spacing, Typography, type NivelAlertaUI } from '@ui/theme';

/** "O que está impactando meu risco" (§16): ponto colorido educativo + texto. Não é diagnóstico. */
export function FatorRisco({ nivel, texto }: { nivel: NivelAlertaUI; texto: string }) {
  return (
    <View style={styles.linha}>
      <View style={[styles.ponto, { backgroundColor: Alerta[nivel].fg }]} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  ponto: { width: 10, height: 10, borderRadius: 5 },
  texto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
