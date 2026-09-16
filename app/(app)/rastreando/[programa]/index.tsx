import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { STATUS_UI, dataBr } from '@modules/rastreando/componentes/statusUI';
import { Colors, InternalHeader, ListItem, Spacing, StatusBadge, Typography } from '@ui/index';

/** Hub do câncer (§29): informações, elegibilidade, fatores, sinais, exames e histórico. */
export default function HubPrograma() {
  const router = useRouter();
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { avaliacoes, exames, pendencias, sintomas } = useRastreando();

  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const p = programa as Programa;
  const c = CONTEUDO[p];
  const av = avaliacoes?.[p];
  const status = av ? STATUS_UI[av.status] : null;
  const pend = pendencias.filter((x) => x.programa === p);
  const sint = sintomas.filter((x) => x.programa === p);
  const meus = exames.filter((e) => e.programa === p);
  const ir = (tela: string) => router.push({ pathname: `/(app)/rastreando/[programa]/${tela}` as never, params: { programa: p } } as never);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <InternalHeader sectionLabel="Rastreando" title={c.titulo} />

        <View style={styles.resumo}>
          {sint.length ? <StatusBadge nivel="vermelho" label="Sinal de alerta" /> : pend.length ? <StatusBadge nivel="laranja" label="Pendência" /> : status ? <StatusBadge nivel={status.nivel} label={status.rotulo} /> : null}
          <Text style={styles.mensagem}>
            {sint.length ? 'Você informou um sinal de alerta. Não espere pela data do rastreamento: procure avaliação médica.' : pend.length ? pend[0].descricao : av?.mensagem}
          </Text>
          {av?.proximaData && !pend.length && !sint.length ? <Text style={styles.proxima}>Próximo exame previsto: {dataBr(av.proximaData)}</Text> : null}
        </View>

        <View style={{ gap: Spacing.sm }}>
          <ListItem icon="book-outline" title="Entenda este câncer" subtitle={c.subtitulo} onPress={() => ir('entenda')} />
          <ListItem icon="help-circle-outline" title="Preciso fazer rastreamento?" subtitle="Avaliação pelo seu perfil" onPress={() => ir('preciso')} />
          <ListItem icon="analytics-outline" title="Fatores de risco" subtitle="O que aumenta o risco e o que muda o protocolo" onPress={() => ir('fatores')} />
          <ListItem icon="warning-outline" title="Sinais de alerta" subtitle="Quando não esperar pelo rastreamento" onPress={() => ir('sinais')} />
          <ListItem icon="document-text-outline" title="Meus exames" subtitle={meus.length ? `${meus.length} registrado${meus.length > 1 ? 's' : ''}` : 'Nenhum registrado'} onPress={() => ir('exames')} />
          <ListItem icon="time-outline" title="Histórico" subtitle="Linha do tempo deste rastreamento" onPress={() => ir('historico')} />
        </View>

        <Text style={styles.fonte}>Fontes: {c.fonteResumo}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  resumo: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  mensagem: { ...Typography.body, color: Colors.textPrimary },
  proxima: { ...Typography.subheading, color: Colors.accent },
  fonte: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.xxl },
});
