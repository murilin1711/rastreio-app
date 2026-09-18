import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';

interface Props {
  /** Uma coluna por dia; cada dia tem os valores medidos. */
  dias: { rotulo: string; valores: number[] }[];
  faixa?: { min: number; max: number } | null;
  altura?: number;
}

/** Pontos por dia com a faixa da meta sombreada. Sem cores de alerta. */
export function GraficoPontos({ dias, faixa, altura = 160 }: Props) {
  if (!dias.length) return null;
  const maximo = Math.max(300, ...dias.flatMap((d) => d.valores));
  const y = (v: number) => (v / maximo) * altura;
  return (
    <View>
      <View style={[styles.area, { height: altura }]}>
        {faixa ? <View style={[styles.faixa, { bottom: y(faixa.min), height: y(faixa.max) - y(faixa.min) }]} pointerEvents="none" /> : null}
        <View style={styles.colunas}>
          {dias.map((d, i) => (
            <View key={i} style={styles.coluna}>
              {d.valores.map((v, j) => <View key={j} style={[styles.ponto, { bottom: y(v) - 4 }]} />)}
            </View>
          ))}
        </View>
      </View>
      <View style={styles.rotulos}>{dias.map((d, i) => <Text key={i} style={styles.rotulo} numberOfLines={1}>{d.rotulo}</Text>)}</View>
      {faixa ? <Text style={styles.legenda}>Faixa sombreada: sua meta em jejum ({faixa.min}–{faixa.max}).</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  area: { justifyContent: 'flex-end' },
  faixa: { position: 'absolute', left: 0, right: 0, backgroundColor: Colors.surfaceAlt, borderRadius: 4 },
  colunas: { flexDirection: 'row', height: '100%', gap: 4 },
  coluna: { flex: 1, height: '100%' },
  ponto: { position: 'absolute', alignSelf: 'center', width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  rotulos: { flexDirection: 'row', gap: 4, marginTop: Spacing.xs },
  rotulo: { flex: 1, ...Typography.caption, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  legenda: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
});
