import { StyleSheet, Text, View } from 'react-native';
import { Colors, Typography } from '@ui/theme';

interface Props { mgdl: number; tamanho?: 'grande' | 'medio' | 'linha' }

/** Glicemia como tipografia, mesmo padrão de LeituraPA. Sem cor por valor. */
export function LeituraGlicemia({ mgdl, tamanho = 'medio' }: Props) {
  const fs = { grande: 56, medio: 28, linha: 20 }[tamanho];
  return (
    <View style={styles.linha} accessibilityLabel={`${mgdl} miligramas por decilitro`}>
      <Text style={[styles.valor, { fontSize: fs, lineHeight: fs * 1.1 }]}>{mgdl}</Text>
      {tamanho !== 'linha' ? <Text style={[styles.unidade, { lineHeight: fs * 1.1 }]}>mg/dL</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  valor: { fontFamily: 'Poppins-ExtraBold', color: Colors.textPrimary, letterSpacing: -1 },
  unidade: { ...Typography.caption, color: Colors.textMuted },
});
