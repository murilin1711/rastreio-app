import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { dataDoDia } from '@core/regras/cardio/mrpa';
import { useMrpa } from '@core/cardio/useMrpa';
import { traduzirErro } from '@core/supabase/erros';
import { BlocoPeriodo } from '@modules/coracao/componentes/BlocoPeriodo';
import { dataLongaBr } from '@modules/coracao/componentes/formato';
import { Button, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** Tela diária da MRPA (§2, C-011): "Dia 3 de 6", blocos manhã/noite, concluir só após o último dia. */
export default function SessaoMrpaTela() {
  const router = useRouter();
  const { sessao: sessaoId } = useLocalSearchParams<{ sessao: string }>();
  const { sessao, medidas, dia, podeConcluir, carregando, erro, concluir, cancelar, recarregar } = useMrpa(sessaoId);
  const [diaVisto, setDiaVisto] = useState<number | null>(null);
  const [processando, setProcessando] = useState(false);

  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  if (!sessao) {
    return (
      <SafeAreaView style={styles.tela} edges={['top']}>
        <View style={styles.conteudo}><InternalHeader sectionLabel="Minha Pressão" title="MRPA" /><Text style={styles.sub}>{carregando ? 'Carregando…' : erro?.mensagemUsuario ?? 'Sessão não encontrada.'}</Text></View>
      </SafeAreaView>
    );
  }

  if (sessao.status === 'concluida') {
    router.replace({ pathname: '/(app)/coracao/mrpa/relatorio', params: { sessao: sessao.id } });
    return null;
  }

  const total = sessao.diasPrevistos;
  const diaAtual = Math.min(Math.max(dia, 1), total);
  const diaMostrado = diaVisto ?? diaAtual;
  const dataMostrada = dataDoDia(sessao, diaMostrado);
  const doDia = medidas.filter((m) => m.medidoEm.slice(0, 10) === dataMostrada);
  const manha = doDia.filter((m) => m.contexto.periodo === 'manha').sort((a, b) => (a.contexto.ordem ?? 0) - (b.contexto.ordem ?? 0));
  const noite = doDia.filter((m) => m.contexto.periodo === 'noite').sort((a, b) => (a.contexto.ordem ?? 0) - (b.contexto.ordem ?? 0));
  const ehHoje = diaMostrado === dia;
  const encerrado = dia > total;

  const titulo = dia === 0 ? `Começa em ${dataLongaBr(sessao.inicio)}` : encerrado ? 'Período encerrado' : `Dia ${dia} de ${total}`;

  const confirmarConcluir = () => {
    Alert.alert('Concluir a MRPA?', 'O relatório será gerado com as medidas registradas.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Concluir', onPress: async () => { setProcessando(true); try { await concluir(); router.replace({ pathname: '/(app)/coracao/mrpa/relatorio', params: { sessao: sessao.id } }); } catch (e) { Alert.alert('Não foi possível concluir', traduzirErro(e).mensagemUsuario); } finally { setProcessando(false); } } },
    ]);
  };
  const confirmarCancelar = () => {
    Alert.alert('Cancelar a MRPA?', 'As medidas já feitas ficam guardadas, mas não haverá relatório.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar MRPA', style: 'destructive', onPress: async () => { setProcessando(true); try { await cancelar(); router.replace('/(app)/coracao/pressao'); } catch (e) { Alert.alert('Não foi possível cancelar', traduzirErro(e).mensagemUsuario); } finally { setProcessando(false); } } },
    ]);
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="MRPA" title={titulo} onBack={() => router.replace('/(app)/coracao/pressao')} />
        {encerrado ? <Text style={styles.sub}>Todos os dias previstos passaram. Conclua para ver o relatório.</Text> : null}

        <View style={styles.navDia}>
          <Pressable disabled={diaMostrado <= 1} onPress={() => setDiaVisto(diaMostrado - 1)} style={({ pressed }) => [styles.seta, (diaMostrado <= 1 || pressed) && { opacity: 0.4 }]}><Ionicons name="chevron-back" size={20} color={Colors.primary} /></Pressable>
          <Text style={styles.navTexto}>Dia {diaMostrado} · {dataLongaBr(dataMostrada)}{ehHoje ? ' · hoje' : ''}</Text>
          <Pressable disabled={diaMostrado >= Math.min(dia, total)} onPress={() => setDiaVisto(diaMostrado + 1)} style={({ pressed }) => [styles.seta, (diaMostrado >= Math.min(dia, total) || pressed) && { opacity: 0.4 }]}><Ionicons name="chevron-forward" size={20} color={Colors.primary} /></Pressable>
        </View>

        <View style={styles.blocos}>
          <BlocoPeriodo periodo="manha" medidas={manha} podeMedir={ehHoje && !encerrado} onMedir={() => router.push({ pathname: '/(app)/coracao/mrpa/medir', params: { sessao: sessao.id, periodo: 'manha' } })} />
          <BlocoPeriodo periodo="noite" medidas={noite} podeMedir={ehHoje && !encerrado} onMedir={() => router.push({ pathname: '/(app)/coracao/mrpa/medir', params: { sessao: sessao.id, periodo: 'noite' } })} />
        </View>

        <Text style={styles.nota}>Nenhuma interpretação é feita antes do fim do protocolo. Valores altos ou baixos isolados não devem preocupar; não mude seus remédios por causa deles.</Text>

        <View style={styles.rodape}>
          <Button label="Concluir MRPA" onPress={confirmarConcluir} disabled={!podeConcluir || processando} loading={processando} />
          {!podeConcluir ? <Text style={styles.ajuda}>Disponível a partir do dia {total}.</Text> : null}
          <Button label="Cancelar MRPA" variant="ghost" onPress={confirmarCancelar} disabled={processando} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  navDia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  seta: { padding: Spacing.sm },
  navTexto: { ...Typography.subheading, color: Colors.textPrimary },
  blocos: { gap: Spacing.lg },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xl },
  rodape: { gap: Spacing.sm, marginTop: Spacing.xxl, alignItems: 'stretch' },
  ajuda: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
});
