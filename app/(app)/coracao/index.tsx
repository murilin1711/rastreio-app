import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMrpa } from '@core/cardio/useMrpa';
import { usePressao } from '@core/cardio/usePressao';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataLongaBr, haQuanto } from '@modules/coracao/componentes/formato';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { Colors, EmBreveBadge, InternalHeader, ListItem, Spacing, Typography } from '@ui/index';

/** Dashboard "Minha Saúde Cardiovascular" (§19). Cards de glicemia, exames, risco e peso ativam no plano 2b. */
export default function Coracao() {
  const router = useRouter();
  const pressao = usePressao();
  const mrpa = useMrpa();
  const ultima = pressao.medidas[0];
  const s = mrpa.sessao;

  useFocusEffect(useCallback(() => { pressao.recarregar(); mrpa.recarregar(); }, [pressao.recarregar, mrpa.recarregar]));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={pressao.carregando} onRefresh={() => { pressao.recarregar(); mrpa.recarregar(); }} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Módulo" title="Coração & Metabolismo" onBack={() => router.replace('/(app)')} />
        <Text style={styles.sub}>Pressão, glicemia, exames e risco cardiovascular em um só lugar, para você e seu médico.</Text>

        <View style={styles.grade}>
          <CardResumo
            titulo="Pressão"
            valor={ultima ? <LeituraPA pas={ultima.pas} pad={ultima.pad} /> : undefined}
            detalhe={ultima ? `última medida ${haQuanto(ultima.medidoEm)}` : undefined}
            vazio="Registre para começar"
            onPress={() => router.push('/(app)/coracao/pressao')}
          />
          <CardResumo
            titulo="MRPA"
            valor={s ? `Dia ${Math.min(Math.max(mrpa.dia, 1), s.diasPrevistos)} de ${s.diasPrevistos}` : undefined}
            detalhe={s ? 'em andamento' : undefined}
            vazio="Nenhuma em andamento"
            onPress={() => router.push(s ? { pathname: '/(app)/coracao/mrpa/[sessao]', params: { sessao: s.id } } : '/(app)/coracao/mrpa/iniciar')}
          />
          <CardResumo titulo="Glicemia" vazio="Chega no próximo passo" rodape={<EmBreveBadge />} />
          <CardResumo titulo="HbA1c" vazio="Chega no próximo passo" rodape={<EmBreveBadge />} />
          <CardResumo titulo="LDL" vazio="Chega no próximo passo" rodape={<EmBreveBadge />} />
          <CardResumo titulo="Risco cardiovascular" vazio="Chega no próximo passo" rodape={<EmBreveBadge />} />
        </View>

        <View style={styles.lista}>
          <ListItem icon="alert-circle-outline" title="Sinais de alerta" subtitle="Quando procurar atendimento" onPress={() => router.push('/(app)/coracao/sinais')} />
          <ListItem icon="checkmark-circle-outline" title="Como está minha prevenção?" subtitle="Em breve" onPress={() => {}} />
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
