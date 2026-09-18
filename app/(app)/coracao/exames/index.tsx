import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExamesCardio } from '@core/cardio/useExamesCardio';
import { LinhaExame } from '@modules/coracao/componentes/LinhaExame';
import { Button, Colors, EmBreveBadge, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Filtro = 'todos' | 'laboratorial' | 'cardiologico';

/** Meus Exames (§9): laboratoriais e cardiológicos com valor estruturado. Anexos chegam na Fase 3. */
export default function MeusExames() {
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { exames, carregando, erro, recarregar } = useExamesCardio();
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));
  const lista = exames.filter((e) => filtro === 'todos' || e.categoria === filtro);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Coração & Metabolismo" title="Meus Exames" />
        <Text style={styles.sub}>Registre o valor de cada exame para o app montar gráficos, evolução e o cálculo de risco. O laudo original pode ser anexado em breve.</Text>
        {erro ? <Text style={styles.erro}>{erro.mensagemUsuario}</Text> : null}
        <Button label="Adicionar exame" onPress={() => router.push('/(app)/coracao/exames/registrar')} />
        <View style={{ marginTop: Spacing.lg }}>
          <Opcoes<Filtro> opcoes={[{ valor: 'todos', rotulo: 'Todos' }, { valor: 'laboratorial', rotulo: 'Laboratoriais' }, { valor: 'cardiologico', rotulo: 'Cardiológicos' }]} valor={filtro} onChange={setFiltro} />
        </View>
        {lista.length ? (
          <View style={styles.bloco}>{lista.map((e) => <LinhaExame key={e.id} exame={e} onPress={() => router.push({ pathname: '/(app)/coracao/exames/[id]', params: { id: e.id } })} />)}</View>
        ) : !carregando ? (
          <View style={styles.bloco}><Text style={styles.secao}>Nenhum exame ainda</Text><Text style={styles.texto}>Comece pelos que o cálculo de risco usa: colesterol total, HDL, creatinina e, se tiver, hemoglobina glicada.</Text></View>
        ) : null}
        <View style={styles.anexo}><Text style={styles.texto}>Anexar laudo (PDF ou foto)</Text><EmBreveBadge /></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  sub: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.lg },
  erro: { ...Typography.body, color: Colors.danger, marginBottom: Spacing.lg },
  bloco: { marginTop: Spacing.xl },
  secao: { ...Typography.heading, color: Colors.textPrimary, marginBottom: Spacing.sm },
  texto: { ...Typography.body, color: Colors.textSecondary },
  anexo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xxl },
});
