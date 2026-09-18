import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { listarAtividades } from '@core/bemestar/atividades';
import { listarRefeicoes } from '@core/bemestar/refeicoes';
import { carregarRegrasBemEstar } from '@core/bemestar/regras';
import { salvarVinculo } from '@core/bemestar/vinculos';
import { ROTULO_REFEICAO } from '@core/regras/bemestar/alimentacao';
import { ROTULO_ATIVIDADE } from '@core/regras/bemestar/atividade';
import { extrairParametrosBemEstar } from '@core/regras/bemestar/parametros';
import type { Atividade, Refeicao } from '@core/regras/bemestar/tipos';
import { candidatosVinculo } from '@core/regras/bemestar/vinculos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { horaLocal } from '@modules/coracao/componentes/formato';
import { Button, Colors, Radius, Spacing, Typography } from '@ui/index';

/**
 * C-020 (§81): logo após registrar uma glicemia, pergunta se ela se relaciona à refeição ou à atividade
 * das últimas horas. Só aparece quando há candidato; nada é vinculado sem "Sim".
 */
export function VinculoGlicemia({ glicemiaId, medidoEm }: { glicemiaId: string; medidoEm: string }) {
  const { sessao } = useSessao();
  const [refeicao, setRefeicao] = useState<Refeicao | null>(null);
  const [atividade, setAtividade] = useState<Atividade | null>(null);
  const [resposta, setResposta] = useState<{ refeicao?: boolean; atividade?: boolean }>({});

  useEffect(() => {
    if (!sessao?.user.id) return;
    const desde = new Date(Date.parse(medidoEm) - 24 * 3_600_000).toISOString();
    Promise.all([listarRefeicoes(sessao.user.id, { desde }), listarAtividades(sessao.user.id, { desde }), carregarRegrasBemEstar()])
      .then(([rs, as, regras]) => { const c = candidatosVinculo({ medidoEm }, rs, as, extrairParametrosBemEstar(regras)); setRefeicao(c.refeicao); setAtividade(c.atividade); })
      .catch(() => {});
  }, [sessao?.user.id, medidoEm]);

  const responder = async (campo: 'refeicao' | 'atividade', sim: boolean) => {
    const nova = { ...resposta, [campo]: sim };
    setResposta(nova);
    if (!sim) return;
    try {
      await salvarVinculo({ glicemiaId, refeicaoId: nova.refeicao && refeicao ? refeicao.id : null, atividadeId: nova.atividade && atividade ? atividade.id : null });
    } catch (e) { Alert.alert('Não foi possível vincular', traduzirErro(e).mensagemUsuario); }
  };

  if (!refeicao && !atividade) return null;
  return (
    <View style={styles.bloco}>
      {refeicao ? (
        <View style={styles.pergunta}>
          <Text style={styles.texto}>Esta glicemia está relacionada ao {ROTULO_REFEICAO[refeicao.tipo].toLowerCase()} das {horaLocal(refeicao.em)}?</Text>
          {resposta.refeicao == null ? (
            <View style={styles.botoes}><Button label="Sim" pill onPress={() => responder('refeicao', true)} /><Button label="Não" pill variant="outline" onPress={() => responder('refeicao', false)} /></View>
          ) : <Text style={styles.nota}>{resposta.refeicao ? 'Vinculada. Aparece junto no relatório.' : 'Sem vínculo.'}</Text>}
        </View>
      ) : null}
      {atividade ? (
        <View style={styles.pergunta}>
          <Text style={styles.texto}>Foi medida após a {ROTULO_ATIVIDADE[atividade.tipo].toLowerCase()} das {horaLocal(atividade.inicio)}?</Text>
          {resposta.atividade == null ? (
            <View style={styles.botoes}><Button label="Sim" pill onPress={() => responder('atividade', true)} /><Button label="Não" pill variant="outline" onPress={() => responder('atividade', false)} /></View>
          ) : <Text style={styles.nota}>{resposta.atividade ? 'Vinculada. Aparece junto no relatório.' : 'Sem vínculo.'}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bloco: { marginTop: Spacing.xl, gap: Spacing.sm },
  pergunta: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, gap: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textPrimary },
  botoes: { flexDirection: 'row', gap: Spacing.sm },
  nota: { ...Typography.caption, color: Colors.textSecondary },
});
