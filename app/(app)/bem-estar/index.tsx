import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConquistas } from '@core/bemestar/useConquistas';
import { useHabitos } from '@core/bemestar/useHabitos';
import { formatarHm } from '@core/regras/bemestar/sono';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { TEXTO_CHECKIN } from '@modules/bem-estar/conteudo/checkin';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { Button, Colors, InternalHeader, ListItem, ModalComemoracao, NeroAnimado, Radius, Spacing, Typography } from '@ui/index';

const fmt = (n: number) => String(n).replace('.', ',');

/** Saúde & Bem-estar — "Meus hábitos" (§85): os últimos 7 dias em cinco números e os atalhos do módulo. */
export default function BemEstar() {
  const router = useRouter();
  const { habitos: h, carregando, recarregar } = useHabitos();
  const conquistas = useConquistas();
  useFocusEffect(useCallback(() => { recarregar(); conquistas.avaliar(); }, [recarregar, conquistas.avaliar]));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Módulo" title="Saúde & Bem-estar" onBack={() => router.replace('/(app)')} />
        <View style={styles.cabecalho}>
          <Text style={styles.sub}>Como seus hábitos e seu corpo estão evoluindo ao longo do tempo — sem contar calorias e sem julgar.</Text>
          <NeroAnimado size={88} />
        </View>

        {h?.checkinPendente ? (
          <View style={styles.checkin}>
            <Text style={styles.checkinTexto}>{TEXTO_CHECKIN.pendenteCard}</Text>
            <Button label="Responder" pill onPress={() => router.push('/(app)/bem-estar/checkin')} />
          </View>
        ) : null}

        <Text style={styles.secao}>Seus últimos 7 dias</Text>
        <View style={styles.grade}>
          <CardResumo titulo="Movimento" valor={h ? `${h.movimentoMin} de ${h.metaMin} min` : undefined} detalhe={h ? 'minutos que contam para a meta' : undefined} vazio="Registre uma atividade" onPress={() => router.push('/(app)/bem-estar/atividade')} />
          <CardResumo titulo="Sono" valor={h?.sonoMediaMin != null ? `${formatarHm(h.sonoMediaMin)}` : undefined} detalhe={h?.sonoMediaMin != null ? 'média por noite' : undefined} vazio="Registre uma noite" onPress={() => router.push('/(app)/bem-estar/sono')} />
          <CardResumo titulo="Peso" valor={h?.pesoKg != null ? `${fmt(h.pesoKg)} kg` : undefined} detalhe={h?.pesoVariacaoKg != null ? `${h.pesoVariacaoKg > 0 ? '+' : ''}${fmt(h.pesoVariacaoKg)} kg vs. média anterior` : h?.pesoKg != null ? 'última medida' : undefined} vazio="Registre o peso" onPress={() => router.push('/(app)/bem-estar/corpo')} />
          <CardResumo titulo="Cintura" valor={h?.cinturaCm != null ? `${fmt(h.cinturaCm)} cm` : undefined} detalhe={h?.cinturaHaDias != null ? (h.cinturaHaDias === 0 ? 'hoje' : `último registro há ${h.cinturaHaDias} dias`) : undefined} vazio="Registre a cintura" onPress={() => router.push('/(app)/bem-estar/corpo')} />
          <CardResumo titulo="Alimentação" valor={h?.refeicoes ? `${h.refeicoes} ${h.refeicoes === 1 ? 'refeição' : 'refeições'}` : undefined} detalhe={h?.refeicoes ? 'registradas' : undefined} vazio="Registre uma refeição" onPress={() => router.push('/(app)/bem-estar/alimentacao')} />
        </View>

        <Text style={styles.secao}>Ferramentas</Text>
        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="body-outline" title="Meu Corpo" subtitle="Peso, IMC, cintura, composição corporal e evolução" onPress={() => router.push('/(app)/bem-estar/corpo')} />
          <ListItem icon="walk-outline" title="Minhas Atividades" subtitle="Sua semana, últimos 30 dias e meta" onPress={() => router.push('/(app)/bem-estar/atividade')} />
          <ListItem icon="moon-outline" title="Meu Sono" subtitle="Média de 7 dias e horários" onPress={() => router.push('/(app)/bem-estar/sono')} />
          <ListItem icon="restaurant-outline" title="Minha Alimentação" subtitle="Diário simples e horários das refeições" onPress={() => router.push('/(app)/bem-estar/alimentacao')} />
          <ListItem icon="flag-outline" title="Minhas Metas" subtitle="Objetivos definidos por você ou com o profissional" onPress={() => router.push('/(app)/bem-estar/metas')} />
          <ListItem icon="chatbubble-ellipses-outline" title="Check-in semanal" subtitle="Como foi sua semana, de 0 a 10" onPress={() => router.push('/(app)/bem-estar/checkin')} />
          <ListItem icon="document-text-outline" title="Relatório de Saúde & Hábitos" subtitle="PDF para clínico, endocrinologista, nutricionista ou educador físico" onPress={() => router.push({ pathname: '/(app)/minha-saude/relatorios/previa', params: { tipo: 'bemestar', dias: '90' } })} />
        </View>
      </ScrollView>
      <ModalComemoracao conteudo={conquistas.proxima ? TEXTO_CONQUISTA[conquistas.proxima] : null} aoFechar={conquistas.dispensar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sub: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  checkin: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, marginTop: Spacing.lg },
  checkinTexto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
