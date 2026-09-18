import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buscarExame } from '@core/cardio/examesCardio';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { carregarRegrasCardio } from '@core/cardio/regras';
import { rotuloExame } from '@core/cardio/tiposExames';
import { useExamesCardio } from '@core/cardio/useExamesCardio';
import { extrairParametrosRisco } from '@core/regras/cardio/parametrosRisco';
import type { ParametrosRisco } from '@core/regras/cardio/tiposRisco';
import { useSessao } from '@core/sessao/SessaoProvider';
import { BlocoDocumentos } from '@modules/minha-saude/componentes/BlocoDocumentos';
import { dataCurtaBr, dataLongaBr } from '@modules/coracao/componentes/formato';
import { GraficoBarras } from '@modules/coracao/componentes/GraficoBarras';
import { fmtNum, resumoResultadoExame } from '@modules/coracao/componentes/LinhaExame';
import { Alerta, Card, Colors, InternalHeader, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

/** Detalhe do exame + série histórica do mesmo tipo. CAC com a regra da Tabela 4.4 (C-013). Laboratório sem chip. */
export default function DetalheExame() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessao } = useSessao();
  const [exame, setExame] = useState<ExameCardio | null>(null);
  const [pr, setPr] = useState<ParametrosRisco | null>(null);
  const { exames: serie } = useExamesCardio({ tipo: exame?.tipo });

  useEffect(() => {
    if (!sessao?.user.id) return;
    buscarExame(sessao.user.id, id).then(setExame).catch(() => setExame(null));
    carregarRegrasCardio('risco_cv').then((r) => setPr(extrairParametrosRisco(r))).catch(() => {});
  }, [sessao?.user.id, id]);

  if (!exame) return <SafeAreaView style={styles.tela} edges={['top']}><View style={styles.conteudo}><InternalHeader sectionLabel="Meus Exames" title="Exame" /><Text style={styles.texto}>Carregando…</Text></View></SafeAreaView>;

  const r = exame.resultado;
  const foraRef = r.valor != null && ((r.referenciaMin != null && r.valor < r.referenciaMin) || (r.referenciaMax != null && r.valor > r.referenciaMax));
  const cacAlto = exame.tipo === 'cac' && pr && ((r.agatston ?? 0) > pr.cac.alto || (r.percentil ?? 0) > pr.cac.percentilAlto);
  const cacMuitoAlto = exame.tipo === 'cac' && pr && (r.agatston ?? 0) > pr.cac.muitoAlto;
  const historico = serie.filter((e) => e.resultado.valor != null).sort((a, b) => a.dataRealizacao.localeCompare(b.dataRealizacao));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Meus Exames" title={rotuloExame(exame.tipo)} onBack={() => router.back()} />
        <Card style={styles.card}>
          <Text style={styles.valor}>{resumoResultadoExame(exame)}</Text>
          <Text style={styles.meta}>{dataLongaBr(exame.dataRealizacao)}{exame.instituicao ? ` · ${exame.instituicao}` : ''}{exame.solicitante ? ` · pedido por ${exame.solicitante}` : ''}</Text>
          {r.referenciaMin != null || r.referenciaMax != null ? <Text style={styles.meta}>Referência do laboratório: {r.referenciaMin != null ? fmtNum(r.referenciaMin) : '—'} a {r.referenciaMax != null ? fmtNum(r.referenciaMax) : '—'}{foraRef ? ' · este valor está fora da referência informada' : ''}</Text> : null}
          {foraRef ? <Text style={styles.nota}>A interpretação depende do seu histórico e dos outros exames. Converse com seu médico.</Text> : null}
          {exame.observacoes ? <Text style={styles.texto}>{exame.observacoes}</Text> : null}
        </Card>

        {(cacAlto || cacMuitoAlto) && pr ? (
          <View style={[styles.aviso, { backgroundColor: Alerta.amarelo.bg }]}>
            <StatusBadge nivel="amarelo" label={cacMuitoAlto ? `Acima de ${pr.cac.muitoAlto} Agatston` : `Acima de ${pr.cac.alto} Agatston ou percentil ${pr.cac.percentilAlto}`} />
            <Text style={[styles.texto, { color: Alerta.amarelo.fg }]}>{pr.cac.regra.mensagemPaciente}</Text>
          </View>
        ) : null}

        {historico.length >= 2 ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Evolução</Text>
            <GraficoBarras dados={historico.map((e) => ({ rotulo: dataCurtaBr(e.dataRealizacao), pas: e.resultado.valor!, pad: 0 }))} />
            {historico.map((e) => <View key={e.id} style={styles.linhaHist}><Text style={styles.meta}>{dataLongaBr(e.dataRealizacao)}</Text><Text style={styles.texto}>{resumoResultadoExame(e)}</Text></View>)}
          </View>
        ) : null}

        <BlocoDocumentos exameId={exame.id} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  card: { padding: Spacing.xl, gap: Spacing.xs },
  valor: { ...Typography.display, color: Colors.textPrimary },
  meta: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
  aviso: { borderRadius: Radius.bloco, padding: Spacing.xl, gap: Spacing.sm, marginTop: Spacing.lg },
  bloco: { marginTop: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  linhaHist: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
});
