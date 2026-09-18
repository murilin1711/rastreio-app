import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listarExamesCardio } from '@core/cardio/examesCardio';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { montarContexto, type ExameRegistrado } from '@core/rastreando/contexto';
import { useSessao } from '@core/sessao/SessaoProvider';
import { LinhaExame } from '@modules/coracao/componentes/LinhaExame';
import { CartaoExame } from '@modules/rastreando/componentes/CartaoExame';
import { Button, Colors, InternalHeader, Opcoes, Spacing, Typography } from '@ui/index';

type Filtro = 'todos' | 'laboratorial' | 'cardiologico' | 'oncologico';
const FILTROS: { valor: Filtro; rotulo: string }[] = [{ valor: 'todos', rotulo: 'Todos' }, { valor: 'laboratorial', rotulo: 'Laboratoriais' }, { valor: 'cardiologico', rotulo: 'Cardiológicos' }, { valor: 'oncologico', rotulo: 'Oncológicos' }];

type Item = { data: string; cardio?: ExameCardio; rastreando?: ExameRegistrado };

/** Central de exames (§59): tudo o que o usuário registrou, de qualquer módulo, em uma lista só com filtros. */
export default function Exames() {
  const router = useRouter();
  const { sessao } = useSessao();
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [cardio, setCardio] = useState<ExameCardio[]>([]);
  const [rastreando, setRastreando] = useState<ExameRegistrado[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!sessao?.user.id) return;
    setCarregando(true);
    try {
      const [c, ctx] = await Promise.all([listarExamesCardio(sessao.user.id), montarContexto(sessao.user.id)]);
      setCardio(c); setRastreando(ctx.exames);
    } catch { /* telas de origem mostram o erro */ } finally { setCarregando(false); }
  }, [sessao?.user.id]);
  useEffect(() => { recarregar(); }, [recarregar]);
  useFocusEffect(useCallback(() => { recarregar(); }, [recarregar]));

  const itens: Item[] = [
    ...cardio.filter((e) => filtro === 'todos' || e.categoria === filtro).map((e) => ({ data: e.dataRealizacao, cardio: e })),
    ...(filtro === 'todos' || filtro === 'oncologico' ? rastreando.map((e) => ({ data: e.dataRealizacao, rastreando: e })) : []),
  ].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel="Minha Saúde" title="Meus exames" onBack={() => router.back()} />
        <View style={styles.acoes}>
          <Button label="Exame de laboratório ou cardiológico" variant="outline" onPress={() => router.push('/(app)/coracao/exames/registrar')} />
          <Button label="Exame de rastreamento" variant="outline" onPress={() => router.push('/(app)/rastreando')} />
        </View>
        <Text style={styles.rotulo}>Mostrar</Text>
        <Opcoes<Filtro> opcoes={FILTROS} valor={filtro} onChange={setFiltro} />
        <View style={{ gap: Spacing.sm, marginTop: Spacing.xxl }}>
          {itens.length === 0 && !carregando ? <Text style={styles.vazio}>Nenhum exame registrado ainda.</Text> : null}
          {itens.map((i) => i.cardio
            ? <LinhaExame key={i.cardio.id} exame={i.cardio} onPress={() => router.push({ pathname: '/(app)/coracao/exames/[id]', params: { id: i.cardio!.id } })} />
            : <Pressable key={i.rastreando!.id} onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]/exames', params: { programa: i.rastreando!.programa } })}><CartaoExame exame={i.rastreando!} /></Pressable>)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingBottom: Spacing.xxxl },
  acoes: { gap: Spacing.sm },
  rotulo: { ...Typography.subheading, color: Colors.textPrimary, marginTop: Spacing.xxl, marginBottom: Spacing.sm },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
