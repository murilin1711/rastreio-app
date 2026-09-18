import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSono } from '@core/bemestar/useSono';
import { formatarHm } from '@core/regras/bemestar/sono';
import { traduzirErro } from '@core/supabase/erros';
import { ROTULO_CONTEXTO_SONO, ROTULO_QUALIDADE, TEXTO_SONO } from '@modules/bem-estar/conteudo/sono';
import { CardResumo } from '@modules/coracao/componentes/CardResumo';
import { dataCurtaBr, dataHoraBr, horaLocal } from '@modules/coracao/componentes/formato';
import { Button, Card, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** Meu Sono (§80): média de 7 dias, horários médios, barras por noite, referência AASM (C-018), noites registradas. */
export default function MeuSono() {
  const router = useRouter();
  const { sonos, resumo, parametros: p, carregando, erro, excluir, recarregar } = useSono();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));
  const maxMin = resumo ? Math.max(p?.sono.minimoMin ?? 420, ...resumo.porNoite.map((n) => n.minutos)) : 420;
  const refPct = p && maxMin ? Math.round((p.sono.minimoMin / maxMin) * 100) : 0;

  const apagar = (id: string, rotulo: string) => Alert.alert('Apagar registro?', rotulo, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: () => excluir(id).catch((e) => Alert.alert('Não foi possível apagar', traduzirErro(e).mensagemUsuario)) }]);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Saúde & Bem-estar" title="Meu Sono" onBack={() => router.back()} />
        <Text style={styles.sub}>{TEXTO_SONO.subtitulo}</Text>
        <Button label="Registrar noite" onPress={() => router.push('/(app)/bem-estar/sono/registrar')} style={{ marginTop: Spacing.lg }} />
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}

        <Text style={styles.secao}>Últimos 7 dias</Text>
        <View style={styles.grade}>
          <CardResumo titulo="Média por noite" valor={resumo?.mediaMin != null ? `${formatarHm(resumo.mediaMin)}` : undefined} detalhe={resumo?.noites ? `${resumo.noites} ${resumo.noites === 1 ? 'noite' : 'noites'} registradas` : undefined} vazio="Sem registros" />
          <CardResumo titulo="Horário médio de dormir" valor={resumo?.horarioDormir ?? undefined} vazio="—" />
          <CardResumo titulo="Horário médio de acordar" valor={resumo?.horarioAcordar ?? undefined} vazio="—" />
        </View>
        {resumo?.abaixoDaReferencia ? <Text style={styles.nota}>{TEXTO_SONO.abaixo}</Text> : null}
        {resumo?.porNoite.length ? (
          <Card style={styles.card}>
            <View style={styles.grafico}>
              {resumo.porNoite.map((n) => (
                <View key={n.data} style={styles.colunaDia}>
                  <View style={styles.trilho}>
                    <View style={[styles.referencia, { bottom: `${refPct}%` }]} />
                    <View style={[styles.barra, { height: `${Math.round((n.minutos / maxMin) * 100)}%` }]} />
                  </View>
                  <Text style={styles.diaRotulo}>{dataCurtaBr(n.data)}</Text>
                  <Text style={styles.diaValor}>{formatarHm(n.minutos)}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.nota}>Linha: {p ? formatarHm(p.sono.minimoMin) : '7h00'} (referência para adultos).</Text>
          </Card>
        ) : null}
        {p ? <Text style={styles.nota}>{p.sono.regra.mensagemPaciente}</Text> : null}

        {sonos.length ? (
          <>
            <Text style={styles.secao}>Noites registradas</Text>
            {sonos.slice(0, 30).map((s) => (
              <Pressable key={s.id} onLongPress={() => apagar(s.id, `Noite de ${dataHoraBr(s.dormiuEm)}`)} style={styles.linha}>
                <Text style={styles.texto}>{formatarHm(s.minutos)} · dormiu {horaLocal(s.dormiuEm)}, acordou {horaLocal(s.acordouEm)}</Text>
                <Text style={styles.nota}>{dataCurtaBr(s.acordouEm.slice(0, 10))}{s.qualidade ? ` · ${ROTULO_QUALIDADE[s.qualidade].toLowerCase()}` : ''}{(Object.keys(ROTULO_CONTEXTO_SONO) as (keyof typeof ROTULO_CONTEXTO_SONO)[]).filter((k) => s.contexto[k]).map((k) => ` · ${ROTULO_CONTEXTO_SONO[k].toLowerCase()}`).join('')}</Text>
              </Pressable>
            ))}
            <Text style={styles.nota}>Toque e segure um registro para apagar.</Text>
          </>
        ) : !carregando ? <Text style={styles.vazio}>{TEXTO_SONO.semRegistros}</Text> : null}
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
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: { padding: Spacing.lg, gap: Spacing.sm, marginTop: Spacing.md },
  grafico: { flexDirection: 'row', gap: Spacing.xs, height: 130 },
  colunaDia: { flex: 1, alignItems: 'center' },
  trilho: { flex: 1, width: '70%', justifyContent: 'flex-end', backgroundColor: Colors.surfaceAlt, borderRadius: 6, overflow: 'hidden' },
  referencia: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: Colors.primary, opacity: 0.5 },
  barra: { width: '100%', backgroundColor: Colors.accent, borderRadius: 6 },
  diaRotulo: { ...Typography.caption, fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
  diaValor: { ...Typography.caption, fontSize: 10, color: Colors.textMuted },
  texto: { ...Typography.body, color: Colors.textPrimary },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  vazio: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  linha: { backgroundColor: Colors.surface, borderRadius: Radius.linha, padding: Spacing.md, marginBottom: Spacing.xs },
});
