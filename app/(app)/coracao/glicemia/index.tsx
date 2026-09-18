import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlicemia } from '@core/cardio/useGlicemia';
import { diasAtrasISO } from '@core/cardio/usePressao';
import { LeituraGlicemia } from '@modules/coracao/componentes/LeituraGlicemia';
import { LinhaGlicemia } from '@modules/coracao/componentes/LinhaGlicemia';
import { entendaMetas, ROTULO_PERFIL_META, semDiabetesRodape } from '@modules/coracao/conteudo/glicemia';
import { Button, Card, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

/** Minha Glicemia (§5, C-012): registros, metas visíveis com origem, resumo dos 7 dias. */
export default function MinhaGlicemia() {
  const router = useRouter();
  const { medidas, metas, perfil, resumo7, carregando, erro, avaliar, recarregar } = useGlicemia();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));
  const ultimos30 = medidas.filter((m) => m.medidoEm >= diasAtrasISO(30));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Minha Glicemia" />
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}

        {resumo7.n > 0 ? (
          <Card style={styles.resumo}>
            <Text style={styles.resumoTitulo}>Últimos 7 dias</Text>
            <View style={styles.resumoLinha}>
              <View><Text style={styles.rotulo}>Média em jejum</Text>{resumo7.mediaJejum != null ? <LeituraGlicemia mgdl={resumo7.mediaJejum} /> : <Text style={styles.texto}>—</Text>}</View>
              <View><Text style={styles.rotulo}>Média 2 h após</Text>{resumo7.mediaPos2h != null ? <LeituraGlicemia mgdl={resumo7.mediaPos2h} /> : <Text style={styles.texto}>—</Text>}</View>
            </View>
            <Text style={styles.resumoSub}>{resumo7.n} {resumo7.n === 1 ? 'registro' : 'registros'}{metas ? ` · ${resumo7.acimaDaMeta} acima e ${resumo7.abaixoDaMeta} abaixo da meta` : ''}{resumo7.episodiosBaixos ? ` · ${resumo7.episodiosBaixos} abaixo de 70` : ''}</Text>
          </Card>
        ) : null}

        {metas ? (
          <Card style={styles.metas}>
            <Text style={styles.resumoTitulo}>Suas metas</Text>
            <Text style={styles.texto}>Jejum e antes das refeições: {metas.jejumMin}–{metas.jejumMax} · 2 h após: {metas.posMax != null ? `< ${metas.posMax}` : 'sem meta'} · ao deitar: {metas.deitarMin}–{metas.deitarMax}</Text>
            <Text style={styles.resumoSub}>{metas.origem === 'diretriz' ? `Meta da diretriz SBD 2026 (${ROTULO_PERFIL_META[metas.perfil as keyof typeof ROTULO_PERFIL_META] ?? 'adulto'}) — confirme com seu médico.` : metas.origem === 'medico' ? 'Definidas pelo seu médico.' : 'Definidas por outro profissional de saúde.'}</Text>
          </Card>
        ) : perfil && !perfil.temDiabetes ? (
          <Text style={styles.nota}>{semDiabetesRodape}</Text>
        ) : null}

        <View style={styles.acoes}>
          <Button label="Registrar glicemia" onPress={() => router.push('/(app)/coracao/glicemia/registrar')} />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button label="Meu plano" variant="outline" onPress={() => router.push('/(app)/coracao/glicemia/plano')} style={{ flex: 1 }} />
            <Button label="Relatório" variant="outline" onPress={() => router.push('/(app)/coracao/glicemia/relatorio')} style={{ flex: 1 }} />
          </View>
        </View>

        {ultimos30.length ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Últimos 30 dias</Text>
            {ultimos30.map((m) => <LinhaGlicemia key={m.id} medida={m} avaliacao={avaliar({ mgdl: m.mgdl, momento: m.momento, sintomas: m.contexto.sintomas })} />)}
            {metas ? <Text style={styles.nota}>{entendaMetas}</Text> : null}
          </View>
        ) : !carregando ? (
          <View style={styles.bloco}><Text style={styles.secao}>Registre sua primeira glicemia</Text><Text style={styles.texto}>Escolha o momento da medida (em jejum, antes ou depois das refeições) para o app comparar com a meta certa.</Text></View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  erro: { ...Typography.body, color: Colors.danger, marginBottom: Spacing.lg },
  resumo: { padding: Spacing.xl, marginBottom: Spacing.lg, gap: Spacing.sm },
  resumoLinha: { flexDirection: 'row', gap: Spacing.xxxl },
  metas: { padding: Spacing.xl, marginBottom: Spacing.xxl, gap: Spacing.xs },
  resumoTitulo: { ...Typography.subheading, color: Colors.textSecondary },
  resumoSub: { ...Typography.caption, color: Colors.textSecondary },
  rotulo: { ...Typography.caption, color: Colors.textSecondary },
  texto: { ...Typography.body, color: Colors.textPrimary },
  acoes: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  bloco: { marginBottom: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: Spacing.lg },
});
