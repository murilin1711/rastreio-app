import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMedicacoes } from '@core/medicacoes/useMedicacoes';
import { formatarHorarios } from '@core/medicacoes/horarios';
import { dataDoDia } from '@core/regras/cardio/mrpa';
import { marcarRelatorioLido } from '@core/cardio/resumoHome';
import { useMrpa } from '@core/cardio/useMrpa';
import { useSessao } from '@core/sessao/SessaoProvider';
import { dataCurtaBr, dataLongaBr, horaLocal } from '@modules/coracao/componentes/formato';
import { GraficoBarras } from '@modules/coracao/componentes/GraficoBarras';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { ressalvaDiretriz, ressalvaRelatorio, ROTULO_INVALIDEZ, ROTULO_MOTIVO_EXCLUSAO, SINTOMAS_PA } from '@modules/coracao/conteudo/pressao';
import { Alerta, Button, Card, Colors, EmBreveBadge, InternalHeader, Radius, Spacing, StatusBadge, Typography } from '@ui/index';

/** Relatório da MRPA (§3, C-011): período, qualidade, médias, resultado, medicações, sintomas, tabela e ressalvas literais. */
export default function RelatorioMrpaTela() {
  const router = useRouter();
  const { sessao: sessaoId } = useLocalSearchParams<{ sessao: string }>();
  const { sessao, medidas, parametros, relatorioParcial, carregando } = useMrpa(sessaoId);
  const { ativas } = useMedicacoes();
  const { sessao: auth } = useSessao();

  useEffect(() => {
    if (auth?.user.id && sessao?.status === 'concluida') marcarRelatorioLido(auth.user.id, sessao.id).catch(() => {});
  }, [auth?.user.id, sessao?.id, sessao?.status]);

  if (!sessao || !parametros) {
    return <SafeAreaView style={styles.tela} edges={['top']}><View style={styles.conteudo}><InternalHeader sectionLabel="MRPA" title="Relatório" /><Text style={styles.texto}>{carregando ? 'Carregando…' : 'Sessão não encontrada.'}</Text></View></SafeAreaView>;
  }
  const r = sessao.resultado ?? relatorioParcial;
  if (!r) return null;
  const previa = !sessao.resultado;
  const fim = dataDoDia(sessao, sessao.diasPrevistos);
  const ordenadas = [...medidas].sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  const sintomas = [...new Set(ordenadas.flatMap((m) => m.contexto.sintomas ?? []))];

  const resultadoTexto = !r.valido
    ? null
    : r.acimaReferencia
      ? { nivel: 'amarelo' as const, chip: `Acima da referência (≥ ${parametros.mrpaAcima.pas} e/ou ≥ ${parametros.mrpaAcima.pad})`, msg: parametros.mrpaAcima.regra.mensagemPaciente }
      : { nivel: null, chip: `Dentro da referência da MRPA (< ${parametros.mrpaAcima.pas} e < ${parametros.mrpaAcima.pad})`, msg: 'Suas medidas em casa ficaram dentro da referência usada pelas diretrizes. Leve o relatório à consulta para o seu médico avaliar junto com os demais dados.' };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="MRPA" title={previa ? 'Prévia do relatório' : 'Relatório da MRPA'} onBack={() => router.replace('/(app)/coracao/pressao')} />

        <Card style={styles.card}>
          <Text style={styles.rotulo}>Período e protocolo</Text>
          <Text style={styles.texto}>{dataLongaBr(sessao.inicio)} a {dataLongaBr(fim)} · {sessao.diasPrevistos} dias · 3 medidas de manhã e 3 à noite</Text>
          <Text style={[styles.rotulo, { marginTop: Spacing.md }]}>Qualidade do registro</Text>
          <Text style={styles.texto}>{r.medidasValidas} medidas válidas em {r.diasComRegistro} {r.diasComRegistro === 1 ? 'dia' : 'dias'}{r.medidasExcluidas ? ` · ${r.medidasExcluidas} excluída${r.medidasExcluidas > 1 ? 's' : ''} pelo critério da diretriz` : ''}</Text>
          {!r.valido ? (
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              <StatusBadge nivel="cinza" label="Não atinge o mínimo para interpretação" />
              <Text style={styles.texto}>{r.motivoInvalidez ? ROTULO_INVALIDEZ[r.motivoInvalidez] : ''} {parametros.validade.regra.mensagemPaciente}</Text>
            </View>
          ) : null}
        </Card>

        {r.medias.total ? (
          <Card style={styles.card}>
            <Text style={styles.rotulo}>Média geral</Text>
            <LeituraPA pas={r.medias.total.pas} pad={r.medias.total.pad} tamanho="grande" />
            <View style={styles.duasColunas}>
              <View><Text style={styles.rotulo}>Manhã</Text>{r.medias.manha ? <LeituraPA pas={r.medias.manha.pas} pad={r.medias.manha.pad} /> : <Text style={styles.texto}>—</Text>}</View>
              <View><Text style={styles.rotulo}>Noite</Text>{r.medias.noite ? <LeituraPA pas={r.medias.noite.pas} pad={r.medias.noite.pad} /> : <Text style={styles.texto}>—</Text>}</View>
            </View>
            {resultadoTexto ? (
              <View style={[styles.resultado, resultadoTexto.nivel ? { backgroundColor: Alerta[resultadoTexto.nivel].bg } : { backgroundColor: Colors.surfaceAlt }]}>
                {resultadoTexto.nivel ? <StatusBadge nivel={resultadoTexto.nivel} label={resultadoTexto.chip} /> : <Text style={styles.chipNeutro}>{resultadoTexto.chip}</Text>}
                <Text style={[styles.texto, resultadoTexto.nivel ? { color: Alerta[resultadoTexto.nivel].fg } : null]}>{resultadoTexto.msg}</Text>
              </View>
            ) : null}
            {r.diferencaConsultorio && sessao.paConsultorio ? (
              <Text style={styles.nota}>Consultório ({sessao.paConsultorio.pas}/{sessao.paConsultorio.pad} em {dataLongaBr(sessao.paConsultorio.medidoEm)}) menos MRPA: {r.diferencaConsultorio.pas > 0 ? '+' : ''}{r.diferencaConsultorio.pas}/{r.diferencaConsultorio.pad > 0 ? '+' : ''}{r.diferencaConsultorio.pad} mmHg.</Text>
            ) : null}
          </Card>
        ) : null}

        {r.medias.porDia.some((d) => d.total) ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Por dia</Text>
            <GraficoBarras dados={r.medias.porDia.filter((d) => d.total).map((d) => ({ rotulo: dataCurtaBr(d.data), pas: d.total!.pas, pad: d.total!.pad }))} referencia={parametros.mrpaAcima} />
            <View style={{ marginTop: Spacing.md }}>
              {r.medias.porDia.map((d) => (
                <View key={d.dia} style={styles.linhaDia}>
                  <Text style={styles.linhaDiaData}>Dia {d.dia} · {dataCurtaBr(d.data)}</Text>
                  <Text style={styles.linhaDiaValor}>manhã {d.manha ? `${d.manha.pas}/${d.manha.pad}` : '—'}</Text>
                  <Text style={styles.linhaDiaValor}>noite {d.noite ? `${d.noite.pas}/${d.noite.pad}` : '—'}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.bloco}>
          <Text style={styles.secao}>Medicamentos em uso</Text>
          {ativas.length ? ativas.map((m) => <Text key={m.id} style={styles.texto}>• {m.nome}{m.dose ? ` ${m.dose}` : ''}{m.horarios.length ? ` — ${formatarHorarios(m.horarios)}` : ''}</Text>) : <Text style={styles.texto}>Nenhum cadastrado.</Text>}
        </View>

        {sintomas.length ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Sintomas registrados</Text>
            {sintomas.map((s) => <Text key={s} style={styles.texto}>• {SINTOMAS_PA.find((x) => x.valor === s)?.rotulo ?? s}</Text>)}
          </View>
        ) : null}

        <View style={styles.bloco}>
          <Text style={styles.secao}>Todas as medidas</Text>
          {ordenadas.map((m) => (
            <View key={m.id} style={styles.linhaMedida}>
              <Text style={styles.linhaDiaData}>{dataCurtaBr(m.medidoEm)} {horaLocal(m.medidoEm)} · {m.contexto.periodo === 'manha' ? 'manhã' : 'noite'}</Text>
              <Text style={styles.linhaDiaValor}>{m.pas}/{m.pad}{m.fc != null ? ` · ${m.fc} bpm` : ''}</Text>
              {m.contexto.excluida ? <Text style={styles.excluida}>excluída: {m.contexto.motivoExclusao ? ROTULO_MOTIVO_EXCLUSAO[m.contexto.motivoExclusao] : ''}</Text> : null}
            </View>
          ))}
        </View>

        <Text style={styles.ressalva}>{ressalvaDiretriz}</Text>
        <Text style={styles.ressalva}>{ressalvaRelatorio}</Text>

        <View style={styles.compartilhar}>
          <Button label="Compartilhar em PDF" variant="outline" disabled onPress={() => {}} />
          <EmBreveBadge />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  card: { padding: Spacing.xl, marginBottom: Spacing.lg, gap: Spacing.xs },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.sm },
  duasColunas: { flexDirection: 'row', gap: Spacing.xxxl, marginTop: Spacing.md },
  resultado: { borderRadius: Radius.linha, padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md },
  chipNeutro: { ...Typography.subheading, color: Colors.textPrimary },
  bloco: { marginBottom: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  linhaDia: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  linhaDiaData: { ...Typography.caption, color: Colors.textSecondary, flex: 1.4 },
  linhaDiaValor: { ...Typography.caption, color: Colors.textPrimary, flex: 1, textAlign: 'right' },
  linhaMedida: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingVertical: Spacing.xs, borderBottomWidth: 1, borderBottomColor: Colors.border },
  excluida: { ...Typography.caption, color: Colors.textMuted, width: '100%' },
  ressalva: { ...Typography.caption, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: Spacing.sm },
  compartilhar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg },
});
