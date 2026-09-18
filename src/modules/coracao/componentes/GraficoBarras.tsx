import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';

interface Props {
  dados: { rotulo: string; pas: number; pad: number }[];
  referencia?: { pas: number; pad: number };
  altura?: number;
}

/** Barras planas sem biblioteca: PAS em marinho, PAD em aço, uma linha de referência. Sem cores de alerta. */
export function GraficoBarras({ dados, referencia, altura = 140 }: Props) {
  if (!dados.length) return null;
  const maximo = Math.max(200, ...dados.map((d) => d.pas));
  const y = (v: number) => (v / maximo) * altura;
  return (
    <View>
      <View style={[styles.area, { height: altura }]}>
        {referencia ? (
          <View style={[styles.ref, { bottom: y(referencia.pas) }]} pointerEvents="none">
            <Text style={styles.refTexto}>{referencia.pas}/{referencia.pad} — referência da MRPA</Text>
          </View>
        ) : null}
        <View style={styles.barras}>
          {dados.map((d, i) => (
            <View key={i} style={styles.coluna}>
              <View style={[styles.barra, { height: y(d.pas), backgroundColor: Colors.primary }]} />
              <View style={[styles.barra, { height: y(d.pad), backgroundColor: Colors.accent, position: 'absolute', bottom: 0 }]} />
            </View>
          ))}
        </View>
      </View>
      <View style={styles.rotulos}>
        {dados.map((d, i) => <Text key={i} style={styles.rotulo} numberOfLines={1}>{d.rotulo}</Text>)}
      </View>
      <View style={styles.legenda}>
        <View style={[styles.ponto, { backgroundColor: Colors.primary }]} /><Text style={styles.legendaTexto}>sistólica</Text>
        <View style={[styles.ponto, { backgroundColor: Colors.accent, marginLeft: Spacing.md }]} /><Text style={styles.legendaTexto}>diastólica</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  area: { justifyContent: 'flex-end' },
  barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: '100%' },
  coluna: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barra: { width: '100%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  ref: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderTopColor: Colors.textMuted, borderStyle: 'dashed' },
  refTexto: { ...Typography.caption, fontSize: 11, color: Colors.textMuted, alignSelf: 'flex-end', backgroundColor: Colors.background, paddingHorizontal: 4 },
  rotulos: { flexDirection: 'row', gap: 6, marginTop: Spacing.xs },
  rotulo: { flex: 1, ...Typography.caption, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  legenda: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: Spacing.sm },
  ponto: { width: 8, height: 8, borderRadius: 4 },
  legendaTexto: { ...Typography.caption, color: Colors.textSecondary },
});
