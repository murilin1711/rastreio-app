import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ultimoPorTipo } from '@core/cardio/examesCardio';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { ultimoRisco, type RiscoSalvo } from '@core/cardio/riscoCv';
import { useCheckup } from '@core/cardio/useCheckup';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { useMrpa } from '@core/cardio/useMrpa';
import { usePressao } from '@core/cardio/usePressao';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataLongaBr, haQuanto } from '@modules/coracao/componentes/formato';
import { LeituraGlicemia } from '@modules/coracao/componentes/LeituraGlicemia';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { rotuloMomento } from '@modules/coracao/conteudo/glicemia';
import { Colors, InternalHeader, ListItem, Spacing, Typography } from '@ui/index';

const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const mesAno = (iso: string) => `${MES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`;
const fmt = (n: number) => String(n).replace('.', ',');

/** Dashboard "Minha Saúde Cardiovascular" (§19): cada card abre a área correspondente. */
export default function Coracao() {
  const router = useRouter();
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

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={pressao.carregando} onRefresh={() => { pressao.recarregar(); mrpa.recarregar(); gli.recarregar(); checkup.recarregar(); carregarExtras(); }} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Módulo" title="Coração & Metabolismo" onBack={() => router.replace('/(app)/(tabs)')} />
        <Text style={styles.sub}>Pressão, glicemia, exames e risco cardiovascular em um só lugar, para você e seu médico.</Text>

        <View style={styles.grade}>
          <CardResumo titulo="Pressão" valor={ultimaPA ? <LeituraPA pas={ultimaPA.pas} pad={ultimaPA.pad} /> : undefined} detalhe={ultimaPA ? `última medida ${haQuanto(ultimaPA.medidoEm)}` : undefined} vazio="Registre para começar" onPress={() => router.push('/(app)/coracao/pressao')} />
          <CardResumo titulo="MRPA" valor={s ? `Dia ${Math.min(Math.max(mrpa.dia, 1), s.diasPrevistos)} de ${s.diasPrevistos}` : undefined} detalhe={s ? 'em andamento' : undefined} vazio="Nenhuma em andamento" onPress={() => router.push(s ? { pathname: '/(app)/coracao/mrpa/[sessao]', params: { sessao: s.id } } : '/(app)/coracao/mrpa/iniciar')} />
          <CardResumo titulo="Glicemia" valor={ultimaG ? <LeituraGlicemia mgdl={ultimaG.mgdl} /> : undefined} detalhe={ultimaG ? `${rotuloMomento(ultimaG.momento).toLowerCase()} · ${haQuanto(ultimaG.medidoEm)}` : undefined} vazio="Registre para começar" onPress={() => router.push('/(app)/coracao/glicemia')} />
          <CardResumo titulo="HbA1c" valor={hba1c?.resultado.valor != null ? `${fmt(hba1c.resultado.valor)} %` : undefined} detalhe={hba1c ? `último exame ${mesAno(hba1c.dataRealizacao)}` : undefined} vazio="Registre em Meus Exames" onPress={() => router.push(hba1c ? { pathname: '/(app)/coracao/exames/[id]', params: { id: hba1c.id } } : '/(app)/coracao/exames')} />
          <CardResumo titulo="LDL" valor={ldl?.resultado.valor != null ? `${fmt(ldl.resultado.valor)} mg/dL` : undefined} detalhe={ldl ? `último exame ${mesAno(ldl.dataRealizacao)}` : undefined} vazio="Registre em Meus Exames" onPress={() => router.push(ldl ? { pathname: '/(app)/coracao/exames/[id]', params: { id: ldl.id } } : '/(app)/coracao/exames')} />
          <CardResumo titulo="Risco cardiovascular" valor={risco ? `${fmt(risco.ascvd10)} %` : undefined} detalhe={risco ? `em 10 anos · ${dataLongaBr(risco.calculadoEm.slice(0, 10))}` : undefined} vazio="Calcule seu risco" onPress={() => router.push('/(app)/coracao/risco')} />
          <CardResumo titulo="Peso" valor={peso ? `${fmt(peso.kg)} kg` : undefined} detalhe={peso ? haQuanto(peso.em) : undefined} vazio="Informado ao calcular o risco" onPress={() => router.push('/(app)/coracao/risco/dados')} />
        </View>

        <View style={styles.lista}>
          <ListItem icon="checkmark-circle-outline" title="Como está minha prevenção?" subtitle={ck ? `Informações atualizadas: ${ck.atualizados}/${ck.total}` : 'Verificando…'} onPress={() => router.push('/(app)/coracao/checkup')} />
          <ListItem icon="flask-outline" title="Meus exames" subtitle="Laboratoriais e cardiológicos" onPress={() => router.push('/(app)/coracao/exames')} />
          <ListItem icon="time-outline" title="Minha linha do tempo" subtitle="Evolução ao longo dos anos" onPress={() => router.push('/(app)/coracao/linha-do-tempo')} />
          <ListItem icon="alert-circle-outline" title="Sinais de alerta" subtitle="Quando procurar atendimento" onPress={() => router.push('/(app)/coracao/sinais')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xxl },
  lista: { gap: Spacing.sm },
});
