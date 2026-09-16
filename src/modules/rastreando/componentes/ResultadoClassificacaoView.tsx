import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ResultadoClassificacao } from '@core/regras/tipos';
import { Card, Colors, Spacing, StatusBadge, Typography } from '@ui/index';
import { dataBr, NIVEL_PENDENCIA } from './statusUI';

const ROTULO: Record<string, string> = {
  normal: 'Rastreamento em dia', controle: 'Controle em curto intervalo', complementar: 'Exame complementar necessário',
  investigacao: 'Avaliação médica necessária', especializado: 'Avaliação especializada', pendente: 'Resultado pendente',
};

/** Devolutiva do motor após registrar um exame (§42 passo 4–5, §43). */
export function ResultadoClassificacaoView({ r, lembretesOk }: { r: ResultadoClassificacao; lembretesOk: boolean }) {
  return (
    <Card style={{ gap: Spacing.md }}>
      <StatusBadge nivel={NIVEL_PENDENCIA[r.nivelAlerta] ?? 'cinza'} label={r.motivoSeguranca === 'sintoma_alarme' ? 'Sinal de alerta' : ROTULO[r.classificacao] ?? r.classificacao} />
      <Text style={styles.mensagem}>{r.mensagemPaciente}</Text>
      <View style={styles.linha}>
        <Text style={styles.chave}>Próxima ação</Text>
        <Text style={styles.valor}>{r.proximaAcao}{r.dataProximaAcao ? ` — ${dataBr(r.dataProximaAcao)}` : ''}</Text>
      </View>
      {r.abrePendencia ? <Text style={styles.pendencia}>Este exame ficou como pendência até você registrar a próxima etapa.</Text> : null}
      {r.dataProximaAcao && !lembretesOk ? <Text style={styles.aviso}>Exame salvo, mas não foi possível criar os lembretes. Tente de novo em Lembretes.</Text> : null}
      {r.regraVersao ? <Text style={styles.regra}>Regra clínica versão {r.regraVersao}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  mensagem: { ...Typography.body, color: Colors.textPrimary },
  linha: { gap: 2 },
  chave: { ...Typography.caption, color: Colors.textSecondary },
  valor: { ...Typography.subheading, color: Colors.textPrimary },
  pendencia: { ...Typography.caption, color: Colors.warning },
  aviso: { ...Typography.caption, color: Colors.warning },
  regra: { ...Typography.caption, color: Colors.textMuted },
});
