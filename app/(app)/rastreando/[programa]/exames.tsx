import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Programa } from '@core/regras/tipos';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { useRastreando } from '@core/rastreando/useRastreando';
import { CartaoExame } from '@modules/rastreando/componentes/CartaoExame';
import { CONTEUDO } from '@modules/rastreando/conteudo';
import { Button, Colors, InternalHeader, Spacing, Typography } from '@ui/index';

export default function Exames() {
  const router = useRouter();
  const { programa } = useLocalSearchParams<{ programa: string }>();
  const { exames, carregando, recarregar } = useRastreando();
  if (!PROGRAMAS.includes(programa as Programa)) return <Redirect href="/(app)/rastreando" />;
  const p = programa as Programa;
  const meus = exames.filter((e) => e.programa === p);

  return (
    <SafeAreaView style={styles.tela} edges={['top']}>
      <ScrollView contentContainerStyle={styles.conteudo} refreshControl={<RefreshControl refreshing={carregando} onRefresh={recarregar} tintColor={Colors.primary} />}>
        <InternalHeader sectionLabel={CONTEUDO[p].titulo} title="Meus exames" />
        <Button label="Registrar exame" onPress={() => router.push({ pathname: '/(app)/rastreando/[programa]/registrar', params: { programa: p } })} />
        <View style={{ gap: Spacing.md, marginTop: Spacing.xxl }}>
          {meus.length === 0 && !carregando ? (
            <Text style={styles.vazio}>Nenhum exame registrado. Registre seu primeiro exame para o NERO organizar o seu acompanhamento.</Text>
          ) : meus.map((e) => <CartaoExame key={e.id} exame={e} />)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  conteudo: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxxl },
  vazio: { ...Typography.body, color: Colors.textSecondary },
});
