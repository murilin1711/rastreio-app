import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@ui/components/ProgressBar';
import { Colors, Spacing, Typography } from '@ui/theme';

interface Props { segundos: number; onFim: () => void; rotulo: string }

/** Contagem regressiva do intervalo entre medidas da MRPA (1 min, Medidas 2023 Fig. 8). Único movimento contínuo do módulo. */
export function Cronometro({ segundos, onFim, rotulo }: Props) {
  const [restante, setRestante] = useState(segundos);
  useEffect(() => {
    if (restante <= 0) { onFim(); return; }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [restante, onFim]);
  const m = Math.floor(restante / 60);
  const s = String(restante % 60).padStart(2, '0');
  return (
    <View style={styles.bloco}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.tempo}>{m}:{s}</Text>
      <View style={{ alignSelf: "stretch" }}><ProgressBar value={(1 - restante / segundos) * 100} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl },
  rotulo: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  tempo: { fontFamily: 'Poppins-ExtraBold', fontSize: 56, lineHeight: 62, color: Colors.primary, letterSpacing: -1 },
});
