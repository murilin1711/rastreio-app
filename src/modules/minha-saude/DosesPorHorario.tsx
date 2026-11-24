import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { horaCurta } from '@core/medicacoes/horarios';
import type { HorarioDose, UnidadeDose } from '@core/medicacoes/tipos';
import { formatarQuantidade } from '@core/medicacoes/unidades';
import { SeletorQuantidade } from '@modules/remedios/SeletorQuantidade';
import { Colors, Radius, Spacing, Typography } from '@ui/index';

/**
 * Quanto tomar em cada horário do remédio (spec §6.1): uma linha por horário, com o `[−] n [+]` no
 * passo da unidade. Sem horário (remédio "se precisar"), não mostra nada.
 */
export function DosesPorHorario({ horarios, unidade, onChange }: { horarios: HorarioDose[]; unidade: UnidadeDose; onChange: (h: HorarioDose[]) => void }) {
  if (!horarios.length) return null;
  const mudar = (hora: string, quantidade: number) => onChange(horarios.map((h) => (h.hora === hora ? { ...h, quantidade } : h)));

  return (
    <View style={styles.grupo}>
      <Text style={styles.titulo}>Quanto tomar em cada horário</Text>
      {horarios.map((h) => (
        <View key={h.hora} style={styles.linha} accessibilityLabel={`Às ${horaCurta(h.hora)}: ${formatarQuantidade(h.quantidade, unidade)}`}>
          <View style={styles.cabeca}>
            <Text style={styles.hora}>{horaCurta(h.hora)}</Text>
            <Text style={styles.quanto}>{formatarQuantidade(h.quantidade, unidade)}</Text>
          </View>
          <SeletorQuantidade valor={h.quantidade} unidade={unidade} onChange={(q) => mudar(h.hora, q)} contexto={`a dose das ${horaCurta(h.hora)}`} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: Spacing.sm },
  titulo: { ...Typography.subheading, color: Colors.textPrimary },
  linha: { gap: Spacing.sm, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.linha, padding: Spacing.lg },
  cabeca: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.md },
  hora: { ...Typography.heading, color: Colors.textPrimary },
  quanto: { ...Typography.body, color: Colors.textSecondary, flexShrink: 1, textAlign: 'right' },
});
