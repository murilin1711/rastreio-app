import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExameRegistrado } from '@core/rastreando/contexto';
import { ROTULO_EXAME, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { Card, Colors, Spacing, StatusBadge, Typography } from '@ui/index';
import { dataBr, NIVEL_PENDENCIA } from './statusUI';

const CLASSIFICACAO: Record<string, string> = {
  normal: 'Rastreamento em dia', controle: 'Controle em curto intervalo', complementar: 'Exame complementar pendente',
  investigacao: 'Investigação necessária', especializado: 'Acompanhamento especializado', pendente: 'Resultado pendente',
};

/** Resumo legível do resultado estruturado. */
export function resumoResultado(e: ExameRegistrado): string {
  const r = e.resultado;
  switch (e.tipo) {
    case 'mamografia': return `BI-RADS ${r.birads}`;
    case 'dna_hpv': return r.hpv === 'negativo' ? 'HPV negativo' : r.hpv === '16_18' ? 'HPV 16/18' : r.hpv === 'invalido' ? 'Inválido' : `HPV outros${r.citologia_reflexa ? ` · citologia ${String(r.citologia_reflexa).toUpperCase().replace('_', '-')}` : ''}`;
    case 'citologia': return `Citologia ${String(r.citologia).toUpperCase().replace('_', '-')}`;
    case 'colposcopia': return `Colposcopia: ${String(r.achado).toUpperCase()}`;
    case 'fit': return `FIT ${r.fit}`;
    case 'colonoscopia': return r.achado === 'polipos' ? `Pólipos · ${String((r.polipos as { histopatologico?: string })?.histopatologico ?? '').replace('_', ' ')}` : `Colonoscopia: ${r.achado}`;
    case 'tcbd': return `Lung-RADS ${r.lungrads}`;
    case 'psa': return `PSA ${r.psa_total} ng/mL${r.referencia_max ? ` (ref. até ${r.referencia_max})` : ''}`;
    default: return e.tipo;
  }
}

export function CartaoExame({ exame }: { exame: ExameRegistrado }) {
  return (
    <Card style={styles.card}>
      <View style={styles.topo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.tipo}>{ROTULO_EXAME[exame.tipo as TipoExameRastreamento] ?? exame.tipo}</Text>
          <Text style={styles.data}>{dataBr(exame.dataRealizacao)}</Text>
        </View>
        <StatusBadge nivel={NIVEL_PENDENCIA[exame.nivelAlerta] ?? 'cinza'} label={CLASSIFICACAO[exame.classificacao] ?? exame.classificacao} />
      </View>
      <Text style={styles.resultado}>{resumoResultado(exame)}</Text>
      {exame.proximaAcao ? <Text style={styles.acao}>{exame.proximaAcao}{exame.dataProximaAcao ? ` · ${dataBr(exame.dataProximaAcao)}` : ''}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm, padding: Spacing.lg },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipo: { ...Typography.subheading, color: Colors.textPrimary },
  data: { ...Typography.caption, color: Colors.textSecondary },
  resultado: { ...Typography.body, color: Colors.textPrimary },
  acao: { ...Typography.caption, color: Colors.accent },
});
