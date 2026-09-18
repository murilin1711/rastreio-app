import { StyleSheet, Text, View } from 'react-native';
import type { MedidaCorporal } from '@core/regras/bemestar/tipos';
import { dataHoraBr } from '@modules/coracao/componentes/formato';
import { Colors, Spacing, Typography } from '@ui/theme';

const fmt = (n: number) => String(n).replace('.', ',');

export function resumoMedidaCorporal(m: MedidaCorporal): string {
  const v = m.valores;
  switch (m.tipo) {
    case 'peso': return `${fmt(v.kg ?? 0)} kg`;
    case 'cintura': return `Cintura ${fmt(v.cm ?? 0)} cm`;
    case 'quadril': return `Quadril ${fmt(v.cm ?? 0)} cm`;
    case 'composicao': return [v.gordura_pct != null ? `gordura ${fmt(v.gordura_pct)} %` : null, v.massa_muscular_kg != null ? `músculo ${fmt(v.massa_muscular_kg)} kg` : null, v.massa_magra_kg != null ? `massa magra ${fmt(v.massa_magra_kg)} kg` : null].filter(Boolean).join(' · ') || 'Composição corporal';
  }
}

/** Linha plana de histórico (sem cor de alerta). */
export function LinhaMedidaCorporal({ medida }: { medida: MedidaCorporal }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.data}>{dataHoraBr(medida.medidoEm)}</Text>
      <Text style={styles.valor}>{resumoMedidaCorporal(medida)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing.md },
  data: { ...Typography.caption, color: Colors.textSecondary },
  valor: { ...Typography.body, color: Colors.textPrimary, flexShrink: 1, textAlign: 'right' },
});
