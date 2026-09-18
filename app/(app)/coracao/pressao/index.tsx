import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { media } from '@core/regras/cardio/pressao';
import { diasAtrasISO, usePressao } from '@core/cardio/usePressao';
import { dataCurtaBr } from '@modules/coracao/componentes/formato';
import { GraficoBarras } from '@modules/coracao/componentes/GraficoBarras';
import { LeituraPA } from '@modules/coracao/componentes/LeituraPA';
import { LinhaMedida } from '@modules/coracao/componentes/LinhaMedida';
import { entendaReferencia, preparoMedida } from '@modules/coracao/conteudo/pressao';
import { Button, Card, Colors, InternalHeader, Radius, Spacing, Typography } from '@ui/index';

/** Minha Pressão (§1, C-010): registro casual, médias descritivas e convite para MRPA. Sem cor por valor. */
export default function MinhaPressao() {
  const router = useRouter();
  const { medidas, parametros, resumo7, resumo30, convidarMrpa, carregando, erro, dispensarConvite, recarregar } = usePressao();

  // Uma barra por dia (média do dia), últimos 14 dias com registro
  const barras = useMemo(() => {
    const desde = diasAtrasISO(14);
    const porDia = new Map<string, { pas: number; pad: number }[]>();
    for (const m of medidas) {
      if (m.medidoEm < desde || m.contexto.excluida) continue;
      const dia = m.medidoEm.slice(0, 10);
      porDia.set(dia, [...(porDia.get(dia) ?? []), m]);
    }
    return [...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([dia, ms]) => {
      const md = media(ms)!;
      return { rotulo: dataCurtaBr(dia), pas: md.pas, pad: md.pad };
    });
  }, [medidas]);

  const ref = parametros?.referenciaDomiciliar;
  const ultimos30 = medidas.filter((m) => m.medidoEm >= diasAtrasISO(30));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Minha Pressão" />

        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}

        {resumo7.media ? (
          <Card style={styles.resumo}>
            <Text style={styles.resumoTitulo}>Média dos últimos 7 dias</Text>
            <LeituraPA pas={resumo7.media.pas} pad={resumo7.media.pad} tamanho="grande" />
            <Text style={styles.resumoSub}>
              {resumo7.media.n} {resumo7.media.n === 1 ? 'medida' : 'medidas'} · maior {resumo7.maior!.pas}/{resumo7.maior!.pad} · menor {resumo7.menor!.pas}/{resumo7.menor!.pad}
            </Text>
            {resumo30.media && resumo30.media.n > resumo7.media.n ? (
              <Text style={styles.resumoSub}>30 dias: {resumo30.media.pas}/{resumo30.media.pad} em {resumo30.media.n} medidas</Text>
            ) : null}
          </Card>
        ) : null}

        {convidarMrpa && parametros ? (
          <View style={styles.convite}>
            <Text style={styles.conviteTexto}>{parametros.conviteMrpa.regra.mensagemPaciente}</Text>
            <View style={styles.conviteBotoes}>
              <Button label="Iniciar MRPA" onPress={() => router.push('/(app)/coracao/mrpa/iniciar')} style={{ flex: 1 }} />
              <Button label="Agora não" variant="ghost" onPress={dispensarConvite} />
            </View>
          </View>
        ) : null}

        <View style={styles.acoes}>
          <Button label="Registrar medida" onPress={() => router.push('/(app)/coracao/pressao/registrar')} />
          <Button label="Iniciar MRPA" variant="outline" onPress={() => router.push('/(app)/coracao/mrpa/iniciar')} />
        </View>

        {barras.length > 1 ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Últimos 14 dias</Text>
            <GraficoBarras dados={barras} referencia={ref} />
          </View>
        ) : null}

        {ultimos30.length ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Medidas dos últimos 30 dias</Text>
            {ultimos30.map((m) => <LinhaMedida key={m.id} medida={m} />)}
            <Text style={styles.nota}>{entendaReferencia}</Text>
          </View>
        ) : !carregando ? (
          <View style={styles.bloco}>
            <Text style={styles.secao}>Registre sua primeira medida</Text>
            <Text style={styles.nota}>Antes de medir:</Text>
            {preparoMedida.map((t) => <Text key={t} style={styles.item}>• {t}</Text>)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  erro: { ...Typography.body, color: Colors.danger, marginBottom: Spacing.lg },
  resumo: { padding: Spacing.xl, marginBottom: Spacing.xxl, gap: Spacing.xs },
  resumoTitulo: { ...Typography.subheading, color: Colors.textSecondary },
  resumoSub: { ...Typography.caption, color: Colors.textSecondary },
  convite: { backgroundColor: Colors.surface, borderRadius: Radius.bloco, borderWidth: 1.5, borderColor: Colors.accent, padding: Spacing.xl, marginBottom: Spacing.xxl, gap: Spacing.md },
  conviteTexto: { ...Typography.body, color: Colors.textPrimary },
  conviteBotoes: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  acoes: { gap: Spacing.sm, marginBottom: Spacing.xxl },
  bloco: { marginBottom: Spacing.xxl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.md },
  nota: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.md },
  item: { ...Typography.body, color: Colors.textSecondary },
});
