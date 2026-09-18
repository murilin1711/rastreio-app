import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCorpo } from '@core/bemestar/useCorpo';
import { calcularIdade, calcularIMC } from '@core/perfil/calculos';
import type { ObjetivoPeso } from '@core/perfil/tipos';
import { avaliarPMAV, classificarCintura, classificarRCA, classificarRCQ, compararPeriodos, evolucaoPercentual, faixaIMC, faixaIMCIdoso, perdaNaoIntencional, rca, rcq, tendenciaPeso } from '@core/regras/bemestar/corpo';
import { GraficoSerie } from '@modules/bem-estar/componentes/GraficoSerie';
import { ROTULO_FAIXA_CINTURA, ROTULO_OBJETIVO, ROTULO_PMAV, ROTULO_TENDENCIA, TEXTO_CORPO } from '@modules/bem-estar/conteudo/corpo';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataLongaBr, haQuanto } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, Input, InternalHeader, ListItem, Opcoes, Radius, Select, Spacing, Typography } from '@ui/index';

type Periodo = '30' | '90' | '180' | '365' | 'tudo';
const PERIODOS: { valor: Periodo; rotulo: string }[] = [{ valor: '30', rotulo: '30 dias' }, { valor: '90', rotulo: '3 meses' }, { valor: '180', rotulo: '6 meses' }, { valor: '365', rotulo: '1 ano' }, { valor: 'tudo', rotulo: 'Tudo' }];
const fmt = (n: number, casas = 1) => n.toFixed(casas).replace('.', ',');
const hojeISO = () => new Date().toISOString().slice(0, 10);
const mesDe = (iso: string) => iso.slice(0, 7);

/** Meu Corpo (§70–§73, §82–§84): composição corporal, evolução por período, comparar períodos, tendência, PMAV e objetivo. */
export default function MeuCorpo() {
  const router = useRouter();
  const { medidas, ultimos, parametros: p, perfil, carregando, recarregar, salvarPMAV, salvarObjetivo } = useCorpo();
  const [periodo, setPeriodo] = useState<Periodo>('90');
  const [mesA, setMesA] = useState<string | null>(null);
  const [mesB, setMesB] = useState<string | null>(null);
  const [pmavTexto, setPmavTexto] = useState('');
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  const desde = periodo === 'tudo' ? '0000-00-00' : new Date(Date.now() - Number(periodo) * 86_400_000).toISOString().slice(0, 10);
  const noPeriodo = useMemo(() => medidas.filter((m) => m.medidoEm.slice(0, 10) >= desde), [medidas, desde]);
  const serie = (tipo: 'peso' | 'cintura', chave: 'kg' | 'cm') => noPeriodo.filter((m) => m.tipo === tipo && m.valores[chave] != null).map((m) => ({ data: m.medidoEm.slice(0, 10), valor: m.valores[chave]! }));
  const serieComp = (chave: 'gordura_pct' | 'massa_muscular_kg') => noPeriodo.filter((m) => m.tipo === 'composicao' && m.valores[chave] != null).map((m) => ({ data: m.medidoEm.slice(0, 10), valor: m.valores[chave]! }));
  const pesos = medidas.filter((m) => m.tipo === 'peso' && m.valores.kg != null).map((m) => ({ medidoEm: m.medidoEm, kg: m.valores.kg! }));
  const meses = useMemo(() => Array.from(new Set(medidas.map((m) => mesDe(m.medidoEm)))).sort(), [medidas]);

  const altura = perfil?.alturaCm ?? null;
  const idade = perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null;
  const sexo = perfil?.sexoNascimento ?? null;
  const pesoKg = ultimos.peso?.valores.kg ?? null;
  const cinturaCm = ultimos.cintura?.valores.cm ?? null;
  const quadrilCm = ultimos.quadril?.valores.cm ?? null;
  const imc = pesoKg != null && altura ? calcularIMC(pesoKg, altura) : null;
  const fImc = imc != null && p ? faixaIMC(imc, p) : null;
  const fIdoso = imc != null && p ? faixaIMCIdoso(imc, idade, p) : null;
  const vRca = cinturaCm != null && altura ? rca(cinturaCm, altura) : null;
  const cRca = vRca != null && p ? classificarRCA(vRca, p) : null;
  const cCintura = cinturaCm != null && sexo && p ? classificarCintura(cinturaCm, sexo, p) : null;
  const vRcq = cinturaCm != null && quadrilCm != null ? rcq(cinturaCm, quadrilCm) : null;
  const cRcq = vRcq != null && sexo && p ? classificarRCQ(vRcq, sexo, p) : null;
  const tendencia = p ? tendenciaPeso(pesos, hojeISO(), p) : null;
  const pesosPeriodo = serie('peso', 'kg');
  const evolucao = pesosPeriodo.length >= 2 ? evolucaoPercentual(pesosPeriodo[pesosPeriodo.length - 1].valor, pesosPeriodo[0].valor) : null;
  const pmav = perfil?.pesoMaximoVidaKg != null && pesoKg != null && imc != null && p ? avaliarPMAV(pesoKg, perfil.pesoMaximoVidaKg, imc, p) : null;
  const perda = p ? perdaNaoIntencional(pesos, perfil?.objetivoPeso ?? null, hojeISO(), p) : null;
  const comparacao = mesA && mesB ? compararPeriodos(medidas, `${mesA}-01`, `${mesB}-31`) : null;

  const gravarPMAV = async () => {
    const kg = Number(pmavTexto.replace(',', '.'));
    if (!pmavTexto.trim() || Number.isNaN(kg) || kg < 20 || kg > 400) { Alert.alert('Valor inválido', 'Informe o peso máximo em kg, entre 20 e 400.'); return; }
    try { await salvarPMAV(kg); setPmavTexto(''); } catch { Alert.alert('Não foi possível salvar'); }
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Meu Corpo" onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_CORPO.subtitulo}</Text>
        <Button label="Registrar medidas" onPress={() => router.push('/(app)/bem-estar/corpo/registrar')} style={{ marginTop: Spacing.lg }} />

        <Text style={styles.secao}>Composição corporal</Text>
        <View style={styles.grade}>
          <CardResumo titulo="Peso" valor={pesoKg != null ? `${fmt(pesoKg)} kg` : undefined} detalhe={ultimos.peso ? haQuanto(ultimos.peso.medidoEm) : undefined} vazio="Registre para começar" />
          <CardResumo titulo="IMC" valor={imc != null ? `${fmt(imc)} kg/m²` : undefined} detalhe={fImc ? `${fImc.rotulo}${fIdoso ? ` · ${fIdoso.rotulo}` : ''}` : undefined} vazio={altura ? 'Falta o peso' : 'Informe a altura'} />
          <CardResumo titulo="Circunferência abdominal" valor={cinturaCm != null ? `${fmt(cinturaCm, 0)} cm` : undefined} detalhe={cCintura ? ROTULO_FAIXA_CINTURA[cCintura.faixa] : undefined} vazio="Registre a cintura" />
          <CardResumo titulo="Relação cintura/altura" valor={vRca != null ? fmt(vRca, 2) : undefined} detalhe={cRca ? (cRca.acima ? 'Acima de 0,5' : 'Abaixo de 0,5') : undefined} vazio="Cintura + altura" />
          {vRcq != null ? <CardResumo titulo="Relação cintura/quadril" valor={fmt(vRcq, 2)} detalhe={cRcq ? (cRcq.acima ? 'Acima da referência' : 'Dentro da referência') : undefined} vazio="" /> : null}
          <CardResumo titulo="Composição corporal" valor={ultimos.composicao?.valores.gordura_pct != null ? `${fmt(ultimos.composicao.valores.gordura_pct)} % gordura` : undefined} detalhe={ultimos.composicao ? dataLongaBr(ultimos.composicao.medidoEm.slice(0, 10)) : undefined} vazio="Bioimpedância ou DEXA" onPress={() => router.push('/(app)/bem-estar/corpo/composicao')} />
        </View>
        {fImc ? <Text style={styles.nota}>{fImc.regra.mensagemPaciente}</Text> : null}
        {cRca?.acima ? <Text style={styles.nota}>Sua cintura está acima da metade da altura. Vale conversar com seu médico sobre isso.</Text> : null}
        <View style={{ marginTop: Spacing.md }}>
          <ListItem icon="book-outline" title="Entenda cada medida" subtitle="IMC, cintura, relação cintura/altura, cintura/quadril" onPress={() => router.push('/(app)/bem-estar/corpo/entenda')} />
        </View>

        <Text style={styles.secao}>Evolução</Text>
        <Opcoes<Periodo> opcoes={PERIODOS} valor={periodo} onChange={setPeriodo} />
        {pesosPeriodo.length ? <Card style={styles.card}><Text style={styles.cardTitulo}>Peso</Text><GraficoSerie pontos={pesosPeriodo} unidade="kg" /></Card> : null}
        {pesosPeriodo.length && altura ? <Card style={styles.card}><Text style={styles.cardTitulo}>IMC</Text><GraficoSerie pontos={pesosPeriodo.map((x) => ({ data: x.data, valor: calcularIMC(x.valor, altura) }))} unidade="kg/m²" /></Card> : null}
        {serie('cintura', 'cm').length ? <Card style={styles.card}><Text style={styles.cardTitulo}>Circunferência abdominal</Text><GraficoSerie pontos={serie('cintura', 'cm')} unidade="cm" casas={0} /></Card> : null}
        {serieComp('gordura_pct').length ? <Card style={styles.card}><Text style={styles.cardTitulo}>Percentual de gordura</Text><GraficoSerie pontos={serieComp('gordura_pct')} unidade="%" /></Card> : null}
        {serieComp('massa_muscular_kg').length ? <Card style={styles.card}><Text style={styles.cardTitulo}>Massa muscular</Text><GraficoSerie pontos={serieComp('massa_muscular_kg')} unidade="kg" /></Card> : null}
        {!noPeriodo.length && !carregando ? <Text style={styles.vazio}>Nenhuma medida neste período.</Text> : null}

        <Card style={styles.card}>
          <Text style={styles.cardTitulo}>Tendência do peso</Text>
          <Text style={styles.valorGrande}>{tendencia ? ROTULO_TENDENCIA[tendencia] : '—'}</Text>
          <Text style={styles.nota}>{tendencia && p ? p.tendencia.regra.mensagemPaciente : TEXTO_CORPO.tendenciaSemDados}</Text>
          {evolucao != null ? <Text style={styles.texto}>Evolução no período: {evolucao > 0 ? '+' : ''}{fmt(evolucao)} % ({fmt(pesosPeriodo[0].valor)} → {fmt(pesosPeriodo[pesosPeriodo.length - 1].valor)} kg)</Text> : null}
          {perda ? <Text style={styles.texto}>{perda.regra.mensagemPaciente.replace('mais de 5%', `${fmt(perda.pct)} %`)}</Text> : null}
        </Card>

        {meses.length >= 2 ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitulo}>Comparar períodos</Text>
            <Text style={styles.nota}>{TEXTO_CORPO.compararIntro}</Text>
            <View style={styles.linhaCampos}>
              <View style={{ flex: 1 }}><Select opcoes={meses.map((m) => ({ valor: m, rotulo: `${m.slice(5, 7)}/${m.slice(0, 4)}` }))} valor={mesA} onChange={setMesA} placeholder="De" /></View>
              <View style={{ flex: 1 }}><Select opcoes={meses.map((m) => ({ valor: m, rotulo: `${m.slice(5, 7)}/${m.slice(0, 4)}` }))} valor={mesB} onChange={setMesB} placeholder="Até" /></View>
            </View>
            {comparacao ? (
              <View style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
                {comparacao.peso ? <Text style={styles.texto}>Peso: {fmt(comparacao.peso[0])} → {fmt(comparacao.peso[1])} kg</Text> : null}
                {comparacao.cintura ? <Text style={styles.texto}>Circunferência abdominal: {fmt(comparacao.cintura[0], 0)} → {fmt(comparacao.cintura[1], 0)} cm</Text> : null}
                {comparacao.gorduraPct ? <Text style={styles.texto}>Percentual de gordura: {fmt(comparacao.gorduraPct[0])} → {fmt(comparacao.gorduraPct[1])} %</Text> : null}
                {comparacao.massaMuscularKg ? <Text style={styles.texto}>Massa muscular: {fmt(comparacao.massaMuscularKg[0])} → {fmt(comparacao.massaMuscularKg[1])} kg</Text> : null}
                {!Object.keys(comparacao).length ? <Text style={styles.nota}>Sem medidas entre esses meses.</Text> : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <Text style={styles.secao}>Objetivo de peso</Text>
        <Text style={styles.nota}>{TEXTO_CORPO.objetivoIntro}</Text>
        <Opcoes<ObjetivoPeso> opcoes={(Object.keys(ROTULO_OBJETIVO) as ObjetivoPeso[]).map((o) => ({ valor: o, rotulo: ROTULO_OBJETIVO[o] }))} valor={perfil?.objetivoPeso ?? null} onChange={(o) => salvarObjetivo(o).catch(() => Alert.alert('Não foi possível salvar'))} />

        <Text style={styles.secao}>Peso máximo da vida</Text>
        <Text style={styles.nota}>{TEXTO_CORPO.pmavIntro}</Text>
        {perfil?.pesoMaximoVidaKg != null ? (
          <Card style={styles.card}>
            <Text style={styles.valorGrande}>{fmt(perfil.pesoMaximoVidaKg)} kg</Text>
            {pmav ? <Text style={styles.texto}>{pmav.perdaPct > 0 ? `${fmt(pmav.perdaPct)} % abaixo do peso máximo` : 'No peso máximo'}{pmav.faixa ? ` · ${ROTULO_PMAV[pmav.faixa]}` : ''}</Text> : null}
            {pmav?.faixa ? <Text style={styles.nota}>{pmav.regra.mensagemPaciente}</Text> : null}
            <Button label="Alterar" variant="ghost" onPress={() => salvarPMAV(null).catch(() => {})} />
          </Card>
        ) : (
          <View style={styles.linhaCampos}>
            <Input value={pmavTexto} onChangeText={setPmavTexto} placeholder="kg" keyboardType="decimal-pad" style={{ flex: 1 }} />
            <Button label="Salvar" variant="outline" onPress={gravarPMAV} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: { padding: Spacing.lg, gap: Spacing.xs, marginTop: Spacing.md },
  cardTitulo: { ...Typography.subheading, color: Colors.textPrimary },
  valorGrande: { ...Typography.title, color: Colors.textPrimary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  vazio: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  linhaCampos: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginTop: Spacing.sm },
  aviso: { borderRadius: Radius.bloco, padding: Spacing.lg, backgroundColor: Colors.surfaceAlt },
});
