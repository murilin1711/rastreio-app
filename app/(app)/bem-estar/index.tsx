import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useConquistas } from '@core/bemestar/useConquistas';
import { CONQUISTAS_BEM_ESTAR } from '@core/regras/bemestar/conquistas';
import { useHabitos } from '@core/bemestar/useHabitos';
import { formatarHm } from '@core/regras/bemestar/sono';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { ACOES_BEM_ESTAR } from '@modules/bem-estar/acoes';
import { TEXTO_CHECKIN } from '@modules/bem-estar/conteudo/checkin';
import { TEXTO_CONQUISTA } from '@modules/bem-estar/conteudo/conquistas';
import { Button, Colors, InternalHeader, ListaAcoes, ModalComemoracao, NeroAnimado, Radius, Spacing, Typography } from '@ui/index';
import { useAbrir } from '@core/navegacao/useVoltar';
import { LinkFontes } from '@modules/fontes/FontesDaTela';

const fmt = (n: number) => String(n).replace('.', ',');

/** Módulo "Hábitos e bem-estar" no molde único (spec de navegação §6.5, D-065): o que fazer primeiro, depois só os números que existem. */
export default function BemEstar() {
  const router = useRouter();
  const abrir = useAbrir();
  const { habitos: h, carregando, recarregar } = useHabitos();
  const conquistas = useConquistas({ chaves: CONQUISTAS_BEM_ESTAR });
  useFocusEffect(useCallback(() => { recarregar(); conquistas.avaliar(); }, [recarregar, conquistas.avaliar]));

  // Só os cartões com valor: sem cartão vazio pedindo registro (spec §6.5).
  const cartoes = h ? [
    h.movimentoMin > 0 && <CardResumo key="movimento" titulo="Movimento" valor={`${h.movimentoMin} de ${h.metaMin} min`} detalhe="minutos que contam para a meta" vazio="" onPress={() => abrir('/(app)/bem-estar/atividade')} />,
    h.sonoMediaMin != null && <CardResumo key="sono" titulo="Sono" valor={formatarHm(h.sonoMediaMin)} detalhe="média por noite" vazio="" onPress={() => abrir('/(app)/bem-estar/sono')} />,
    h.pesoKg != null && <CardResumo key="peso" titulo="Peso" valor={`${fmt(h.pesoKg)} kg`} detalhe={h.pesoVariacaoKg != null ? `${h.pesoVariacaoKg > 0 ? '+' : ''}${fmt(h.pesoVariacaoKg)} kg vs. média anterior` : 'última medida'} vazio="" onPress={() => abrir('/(app)/bem-estar/corpo')} />,
    h.cinturaCm != null && <CardResumo key="cintura" titulo="Cintura" valor={`${fmt(h.cinturaCm)} cm`} detalhe={h.cinturaHaDias != null ? (h.cinturaHaDias === 0 ? 'hoje' : `último registro há ${h.cinturaHaDias} dias`) : undefined} vazio="" onPress={() => abrir('/(app)/bem-estar/corpo')} />,
    h.refeicoes > 0 && <CardResumo key="alimentacao" titulo="Alimentação" valor={`${h.refeicoes} ${h.refeicoes === 1 ? 'refeição' : 'refeições'}`} detalhe="registradas" vazio="" onPress={() => abrir('/(app)/bem-estar/alimentacao')} />,
  ].filter(Boolean) : [];

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Módulo" title="Hábitos e bem-estar" onBack={() => router.replace('/(app)/(tabs)')} />

        {h?.checkinPendente ? (
          <View style={styles.checkin}>
            <Text style={styles.checkinTexto}>{TEXTO_CHECKIN.pendenteCard}</Text>
            <Button label="Responder" pill onPress={() => abrir('/(app)/bem-estar/checkin')} />
          </View>
        ) : null}

        <View style={styles.acoes}>
          <ListaAcoes acoes={ACOES_BEM_ESTAR} onAbrir={abrir} />
        </View>

        {cartoes.length ? (
          <>
            <Text style={styles.secao}>Seus últimos números</Text>
            <View style={styles.grade}>{cartoes}</View>
          </>
        ) : null}

        <View style={styles.cabecalho}>
          <Text style={styles.sub}>Como seus hábitos e seu corpo estão evoluindo ao longo do tempo — sem contar calorias e sem julgar.</Text>
          <NeroAnimado size={88} />
        </View>
        <LinkFontes />
      </ScrollView>
      <ModalComemoracao conteudo={conquistas.proxima ? TEXTO_CONQUISTA[conquistas.proxima] : null} aoFechar={conquistas.dispensar} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  acoes: { marginTop: Spacing.lg },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xxl, marginBottom: Spacing.lg },
  sub: { ...Typography.body, color: Colors.textSecondary, flex: 1 },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  checkin: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.bloco, padding: Spacing.lg, marginTop: Spacing.lg },
  checkinTexto: { ...Typography.body, color: Colors.textPrimary, flex: 1 },
});
