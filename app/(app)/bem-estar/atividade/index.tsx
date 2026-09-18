import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAtividades } from '@core/bemestar/useAtividades';
import { ROTULO_ATIVIDADE } from '@core/regras/bemestar/atividade';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_INTENSIDADE, TEXTO_ATIVIDADE } from '@modules/bem-estar/conteudo/atividade';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataHoraBr } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, Input, InternalHeader, ProgressBar, Radius, Spacing, Typography } from '@ui/index';

const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

/** Minhas Atividades (§77–§79): sua semana, últimos 30 dias, meta sugerida ou própria, histórico. */
export default function Atividades() {
  const router = useRouter();
  const { atividades, semana, trintaDias, parametros: p, metas, carregando, erro, excluir, recarregar } = useAtividades();
  const [metaTexto, setMetaTexto] = useState('');
  const [criando, setCriando] = useState(false);
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));
  const metaAtiva = metas.porTipo('atividade_min');
  const maxDia = semana ? Math.max(30, ...semana.porDia.map((d) => d.minutos)) : 30;

  const usarSugerida = async () => {
    if (!p) return;
    try { await metas.definir({ tipo: 'atividade_min', valor: p.atividade.moderadaMin, origem: 'app' }); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
  };
  const criarPropria = async () => {
    const v = Number(metaTexto);
    if (!Number.isInteger(v) || v < 10 || v > 3000) { Alert.alert('Confira a meta', 'Informe minutos por semana entre 10 e 3000.'); return; }
    try { await metas.definir({ tipo: 'atividade_min', valor: v, origem: 'usuario' }); setCriando(false); setMetaTexto(''); } catch (e) { Alert.alert('Não foi possível salvar', traduzirErro(e).mensagemUsuario); }
  };
  const apagar = (id: string, rotulo: string) => Alert.alert('Apagar registro?', rotulo, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: () => excluir(id).catch((e) => Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario)) }]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Minhas Atividades" onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_ATIVIDADE.subtitulo}</Text>
        <Button label="Registrar atividade" onPress={() => router.push('/(app)/bem-estar/atividade/registrar')} style={{ marginTop: Spacing.lg }} />
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}

        {semana ? (
          <>
            <Text style={styles.secao}>Sua semana</Text>
            <Card style={styles.card}>
              <Text style={styles.progresso}>{semana.minutosQueContam} / {semana.metaMin} minutos</Text>
              <ProgressBar value={semana.metaAtingidaPct} />
              <Text style={styles.nota}>Minutos que contam para a meta (moderados + intensos em dobro). Fortalecimento: {semana.diasFortalecimento} de {semana.fortalecimentoMeta} dias{semana.idoso ? ` · equilíbrio: recomendado em ${semana.equilibrioDias} dias` : ''}.</Text>
              <View style={styles.grafico}>
                {semana.porDia.map((d, i) => (
                  <View key={d.dia} style={styles.colunaDia}>
                    <View style={styles.trilho}><View style={[styles.barra, { height: `${Math.round((d.minutos / maxDia) * 100)}%` }]} /></View>
                    <Text style={styles.diaRotulo}>{DIAS[i]}</Text>
                    <Text style={styles.diaValor}>{d.minutos || ''}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <View style={styles.grade}>
              <CardResumo titulo="Atividade total" valor={`${semana.totalMin} min`} vazio="" />
              <CardResumo titulo="Moderada" valor={`${semana.moderadaMin} min`} vazio="" />
              <CardResumo titulo="Intensa" valor={`${semana.vigorosaMin} min`} vazio="" />
              <CardResumo titulo="Dias ativos" valor={`${semana.diasAtivos} de 7`} vazio="" />
            </View>
            {p ? <Text style={styles.nota}>{p.atividade.regra.mensagemPaciente}</Text> : null}
          </>
        ) : null}

        <Text style={styles.secao}>Meta semanal</Text>
        <Text style={styles.nota}>{TEXTO_ATIVIDADE.metaIntro}</Text>
        <Card style={styles.card}>
          <Text style={styles.texto}>{metaAtiva ? `Meta atual: ${metaAtiva.valor} minutos por semana (${metaAtiva.origem === 'app' ? 'sugerida' : metaAtiva.origem === 'usuario' ? 'sua' : 'definida com profissional'})` : 'Sem meta definida — o NERO usa a sugerida (150 min) só para mostrar o progresso.'}</Text>
          {!criando ? (
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              {metaAtiva?.origem !== 'app' ? <Button label={TEXTO_ATIVIDADE.metaSugerida} variant="outline" onPress={usarSugerida} /> : null}
              <Text style={styles.nota}>{TEXTO_ATIVIDADE.metaSugeridaDetalhe}</Text>
              <Button label={TEXTO_ATIVIDADE.metaPropria} variant="outline" onPress={() => setCriando(true)} />
            </View>
          ) : (
            <View style={{ gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Input value={metaTexto} onChangeText={setMetaTexto} placeholder="Minutos por semana (ex.: 200)" keyboardType="number-pad" />
              <Button label="Salvar minha meta" onPress={criarPropria} />
              <Button label="Cancelar" variant="ghost" onPress={() => setCriando(false)} />
            </View>
          )}
        </Card>

        <Text style={styles.secao}>Últimos 30 dias</Text>
        {trintaDias.porTipo.length ? (
          <Card style={styles.card}>
            {trintaDias.porTipo.map((t) => <Text key={t.tipo} style={styles.texto}>{t.sessoes} {t.sessoes === 1 ? 'sessão' : 'sessões'} de {ROTULO_ATIVIDADE[t.tipo].toLowerCase()} · {t.minutos} min</Text>)}
            <Text style={styles.nota}>Tempo total: {trintaDias.totalMin} minutos</Text>
          </Card>
        ) : <Text style={styles.vazio}>{TEXTO_ATIVIDADE.semRegistros}</Text>}

        {atividades.length ? (
          <>
            <Text style={styles.secao}>Registros</Text>
            {atividades.slice(0, 30).map((a) => (
              <Pressable key={a.id} onLongPress={() => apagar(a.id, `${ROTULO_ATIVIDADE[a.tipo]} · ${dataHoraBr(a.inicio)}`)} style={styles.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.texto}>{ROTULO_ATIVIDADE[a.tipo]} · {a.duracaoMin} min · {ROTULO_INTENSIDADE[a.intensidade].toLowerCase()}</Text>
                  <Text style={styles.nota}>{dataHoraBr(a.inicio)}{a.distanciaKm ? ` · ${String(a.distanciaKm).replace('.', ',')} km` : ''}{a.fcMedia ? ` · FC ${a.fcMedia}` : ''}</Text>
                </View>
              </Pressable>
            ))}
            <Text style={styles.nota}>Toque e segure um registro para apagar.</Text>
          </>
        ) : null}
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
  progresso: { ...Typography.title, color: Colors.textPrimary },
  grafico: { flexDirection: 'row', gap: Spacing.xs, height: 120, marginTop: Spacing.sm },
  colunaDia: { flex: 1, alignItems: 'center' },
  trilho: { flex: 1, width: '70%', justifyContent: 'flex-end', backgroundColor: Colors.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
  barra: { width: '100%', backgroundColor: Colors.accent, borderRadius: 6 },
  diaRotulo: { ...Typography.caption, fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  diaValor: { ...Typography.caption, fontSize: 10, color: Colors.textMuted },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary },
  vazio: { ...Typography.body, color: Colors.textSecondary },
  linha: { backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md, marginBottom: Spacing.xs },
});
