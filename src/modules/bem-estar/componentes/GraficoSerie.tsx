import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';

interface Props { pontos: { data: string; valor: number }[]; unidade: string; altura?: number; casas?: number }

const fmt = (n: number, casas: number) => n.toFixed(casas).replace('.', ',');
const rotuloData = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Série temporal de um único indicador (§73): pontos sobre uma escala min–max com folga. Sem cores de alerta. */
export function GraficoSerie({ pontos, unidade, altura = 150, casas = 1 }: Props) {
  if (!pontos.length) return null;
  const ordenados = [...pontos].sort((a, b) => a.data.localeCompare(b.data));
  const valores = ordenados.map((p) => p.valor);
  const min = Math.min(...valores); const max = Math.max(...valores);
  const folga = Math.max((max - min) * 0.2, max * 0.02, 0.5);
  const base = min - folga; const topo = max + folga;
  const y = (v: number) => ((v - base) / (topo - base)) * altura;
  const mostrar = ordenados.length <= 12 ? ordenados : ordenados.filter((_, i) => i % Math.ceil(ordenados.length / 12) === 0 || i === ordenados.length - 1);
  return (
    <View>
      <View style={styles.escala}><Text style={styles.escalaTexto}>{fmt(topo, casas)} {unidade}</Text><Text style={styles.escalaTexto}>{fmt(base, casas)} {unidade}</Text></View>
      <View style={[styles.area, { height: altura }]}>
        {mostrar.map((p, i) => (
          <View key={i} style={styles.coluna}>
            <View style={[styles.ponto, { bottom: y(p.valor) - 5 }]} />
            <Text style={[styles.valor, { bottom: y(p.valor) + 8 }]}>{fmt(p.valor, casas)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.rotulos}>{mostrar.map((p, i) => <Text key={i} style={styles.rotulo} numberOfLines={1}>{rotuloData(p.data)}</Text>)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  escala: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  escalaTexto: { ...Typography.caption, fontSize: 10, color: Colors.textMuted },
  area: { flexDirection: 'row', gap: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  coluna: { flex: 1, height: '100%' },
  ponto: { position: 'absolute', alignSelf: 'center', width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  valor: { position: 'absolute', alignSelf: 'center', ...Typography.caption, fontSize: 10, color: Colors.textSecondary },
  rotulos: { flexDirection: 'row', gap: 4, marginTop: Spacing.xs },
  rotulo: { flex: 1, ...Typography.caption, fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
