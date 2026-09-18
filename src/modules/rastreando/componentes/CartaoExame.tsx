import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ExameRegistrado } from '@core/rastreando/contexto';
import { CLASSIFICACAO, resumoResultado } from '@core/rastreando/formato';
import { ROTULO_EXAME, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { Card, Colors, Spacing, StatusBadge, Typography } from '@ui/index';

export { resumoResultado };
import { dataBr, NIVEL_PENDENCIA } from './statusUI';

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
