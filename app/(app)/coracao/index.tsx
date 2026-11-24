import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ultimoPorTipo } from '@core/cardio/examesCardio';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { ultimoRisco, type RiscoSalvo } from '@core/cardio/riscoCv';
import { useCheckup } from '@core/cardio/useCheckup';
import { useAbrir } from '@core/navegacao/useVoltar';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { useMrpa } from '@core/cardio/useMrpa';
import { usePressao } from '@core/cardio/usePressao';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { acoesCoracao } from '@modules/coracao/acoes';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataLongaBr, haQuanto } from '@modules/coracao/componentes/formato';
import { LeituraGlicemia } from '@modules/coracao/componentes/LeituraGlicemia';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { rotuloMomento } from '@modules/coracao/conteudo/glicemia';
import { Colors, InternalHeader, ListaAcoes, Spacing, Typography } from '@ui/index';
import { FontesDaTela } from '@modules/fontes/FontesDaTela';

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesAno = (iso: string) => `${MES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;
const fmt = (n: number) => String(n).replace('.', ',');

/** Módulo "Pressão, coração e diabetes" no molde único (spec de navegação §6.5, D-065): o que fazer primeiro, depois só os números que existem. */
export default function Coracao() {
  const router = useRouter();
  const abrir = useAbrir();
  const { sessao } = useSessao();
  const pressao = usePressao();
  const mrpa = useMrpa();
  const gli = useGlicemia();
  const checkup = useCheckup();
  const [exames, setExames] = useState<Record<string, ExameCardio | null>>({});
  const [risco, setRisco] = useState<RiscoSalvo | null>(null);
  const [peso, setPeso] = useState<{ kg: number; em: string } | null>(null);

  const carregarExtras = useCallback(async () => {
    if (!sessao?.user.id) return;
    const [ex, r, p] = await Promise.all([
      ultimoPorTipo(sessao.user.id, ['hba1c', 'ldl']).catch(() => ({})),
      ultimoRisco(sessao.user.id).catch(() => null),
      supabase.from('medidas').select('valores, medido_em').eq('user_id', sessao.user.id).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setExames(ex);
    setRisco(r);
    setPeso(p.data ? { kg: (p.data.valores as { kg: number }).kg, em: p.data.medido_em } : null);
  }, [sessao?.user.id]);

  useEffect(() => { carregarExtras(); }, [carregarExtras]);
  useFocusEffect(useCallback(() => { pressao.recarregar(); mrpa.recarregar(); gli.recarregar(); checkup.recarregar(); carregarExtras(); }, [pressao.recarregar, mrpa.recarregar, gli.recarregar, checkup.recarregar, carregarExtras]));

  const ultimaPA = pressao.medidas[0];
  const s = mrpa.sessao;
  const ultimaG = gli.medidas[0];
  const hba1c = exames.hba1c;
  const ldl = exames.ldl;
  const ck = checkup.resultado;

  const cartoes = [
    ultimaPA && <CardResumo key="pressao" titulo="Pressão" valor={<LeituraPA pas={ultimaPA.pas} pad={ultimaPA.pad} />} detalhe={`última medida ${haQuanto(ultimaPA.medidoEm)}`} vazio="" onPress={() => router.push('/(app)/coracao/pressao')} />,
    ultimaG && <CardResumo key="glicemia" titulo="Glicemia" valor={<LeituraGlicemia mgdl={ultimaG.mgdl} />} detalhe={`${rotuloMomento(ultimaG.momento).toLowerCase()} · ${haQuanto(ultimaG.medidoEm)}`} vazio="" onPress={() => router.push('/(app)/coracao/glicemia')} />,
    hba1c?.resultado.valor != null && <CardResumo key="hba1c" titulo="Glicada (HbA1c)" valor={`${fmt(hba1c.resultado.valor)} %`} detalhe={`último exame ${mesAno(hba1c.dataRealizacao)}`} vazio="" onPress={() => router.push({ pathname: '/(app)/coracao/exames/[id]', params: { id: hba1c.id } })} />,
    ldl?.resultado.valor != null && <CardResumo key="ldl" titulo="Colesterol LDL" valor={`${fmt(ldl.resultado.valor)} mg/dL`} detalhe={`último exame ${mesAno(ldl.dataRealizacao)}`} vazio="" onPress={() => router.push({ pathname: '/(app)/coracao/exames/[id]', params: { id: ldl.id } })} />,
    risco && <CardResumo key="risco" titulo="Risco cardiovascular" valor={`${fmt(risco.ascvd10)} %`} detalhe={`em 10 anos · ${dataLongaBr(risco.calculadoEm.slice(0, 10))}`} vazio="" onPress={() => router.push('/(app)/coracao/risco')} />,
    // Peso mora em Hábitos e bem-estar › Corpo (casa única, spec §6.6).
    peso && <CardResumo key="peso" titulo="Peso" valor={`${fmt(peso.kg)} kg`} detalhe={haQuanto(peso.em)} vazio="" onPress={() => router.push('/(app)/bem-estar/corpo')} />,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={pressao.carregando} onRefresh={() => { pressao.recarregar(); mrpa.recarregar(); gli.recarregar(); checkup.recarregar(); carregarExtras(); }} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Módulo" title="Pressão, coração e diabetes" onBack={() => router.replace('/(app)/(tabs)')} />

        <ListaAcoes
          acoes={acoesCoracao({
            mrpa: s ? { id: s.id, dia: mrpa.dia, diasPrevistos: s.diasPrevistos } : null,
            subtituloPrevencao: ck ? `Informações atualizadas: ${ck.atualizados}/${ck.total}` : 'Verificando…',
          })}
          onAbrir={abrir}
        />

        {/* Só os números que existem: sem cartão vazio pedindo registro (spec §6.5). */}
        {cartoes.length ? (
          <View style={styles.numeros}>
            <Text style={styles.secao}>Seus últimos números</Text>
            <View style={styles.grade}>{cartoes}</View>
          </View>
        ) : null}

        <Text style={styles.sub}>Pressão, glicemia, exames e risco cardiovascular em um só lugar, para você e seu médico.</Text>
        <FontesDaTela tema='coracao' />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.xxl, marginBottom: Spacing.xxl },
  numeros: { marginTop: Spacing.xxl, gap: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
});
