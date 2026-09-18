import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlimentacao } from '@core/bemestar/useAlimentacao';
import { ROTULO_REFEICAO } from '@core/regras/bemestar/alimentacao';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_QUANTIDADE, TEXTO_ALIMENTACAO } from '@modules/bem-estar/conteudo/alimentacao';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataCurtaBr, horaLocal } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Minha Alimentação (§74–§76): resumo da semana e os últimos 7 dias, sem julgamento. */
export default function Alimentacao() {
  const router = useRouter();
  const { semana, ultimos7, carregando, erro, excluir, recarregar } = useAlimentacao();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  const apagar = (id: string, rotulo: string) => Alert.alert('Apagar registro?', rotulo, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: () => excluir(id).catch((e) => Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario)) }]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Minha Alimentação" onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_ALIMENTACAO.subtitulo}</Text>
        <Button label="Registrar refeição" onPress={() => router.push('/(app)/bem-estar/alimentacao/registrar')} style={{ marginTop: Spacing.lg }} />
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}

        <Text style={styles.secao}>Sua semana</Text>
        <Card style={styles.card}>
          <Text style={styles.destaque}>Você registrou refeições em {semana.diasComRegistro} de 7 dias</Text>
          <View style={styles.dias}>
            {semana.porDia.map((d, i) => (
              <View key={d.dia} style={styles.dia}>
                <View style={[styles.ponto, d.refeicoes ? styles.pontoCheio : null]}><Text style={[styles.pontoTexto, d.refeicoes ? { color: Colors.white } : null]}>{d.refeicoes || ''}</Text></View>
                <Text style={styles.diaRotulo}>{DIAS[i]}</Text>
              </View>
            ))}
          </View>
          {semana.padrao ? <Text style={styles.texto}>{semana.padrao === 'semelhantes' ? TEXTO_ALIMENTACAO.semelhantes : TEXTO_ALIMENTACAO.variaram}</Text> : null}
        </Card>
        <View style={styles.grade}>
          <CardResumo titulo="Café da manhã" valor={semana.horarioMedio.cafe} detalhe={semana.horarioMedio.cafe ? 'horário médio' : undefined} vazio="—" />
          <CardResumo titulo="Almoço" valor={semana.horarioMedio.almoco} detalhe={semana.horarioMedio.almoco ? 'horário médio' : undefined} vazio="—" />
          <CardResumo titulo="Jantar" valor={semana.horarioMedio.jantar} detalhe={semana.horarioMedio.jantar ? 'horário médio' : undefined} vazio="—" />
        </View>

        <Text style={styles.secao}>Últimos 7 dias</Text>
        {ultimos7.length === 0 && !carregando ? <Text style={styles.vazio}>{TEXTO_ALIMENTACAO.semRegistros}</Text> : null}
        {ultimos7.map((g) => (
          <View key={g.dia} style={{ marginBottom: Spacing.md }}>
            <Text style={styles.diaTitulo}>{dataCurtaBr(g.dia)}</Text>
            {g.itens.map((r) => (
              <Pressable key={r.id} onLongPress={() => apagar(r.id, `${ROTULO_REFEICAO[r.tipo]} · ${horaLocal(r.em)}`)} style={styles.linha}>
                <Text style={styles.hora}>{horaLocal(r.em)}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.texto}>{ROTULO_REFEICAO[r.tipo]}{r.quantidade ? ` · ${ROTULO_QUANTIDADE[r.quantidade].toLowerCase()}` : ''}</Text>
                  <Text style={styles.nota} numberOfLines={2}>{r.descricao}{r.observacao ? ` — ${r.observacao}` : ''}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ))}
        {ultimos7.length ? <Text style={styles.nota}>Toque e segure um registro para apagar.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary },
  erro: { ...Typography.caption, color: Colors.danger, marginTop: Spacing.md },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  card: { padding: Spacing.lg, gap: Spacing.sm },
  destaque: { ...Typography.subheading, color: Colors.textPrimary },
  dias: { flexDirection: 'row', justifyContent: 'space-between' },
  dia: { alignItems: 'center', gap: 2 },
  ponto: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  pontoCheio: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  pontoTexto: { ...Typography.caption, fontSize: 11, color: Colors.textMuted },
  diaRotulo: { ...Typography.caption, fontSize: 10, color: Colors.textSecondary },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  diaTitulo: { ...Typography.subheading, color: Colors.textSecondary, marginBottom: Spacing.xs },
  linha: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md, marginBottom: Spacing.xs },
  hora: { ...Typography.caption, color: Colors.textSecondary, width: 42, marginTop: 3 },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
