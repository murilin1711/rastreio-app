import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMrpa } from '@core/cardio/useMrpa';
import { abrirDaFolha } from '@modules/anotar/abrirDaFolha';
import { ITENS_ANOTAR, type ItemAnotar } from '@modules/anotar/itensAnotar';
import { BotaoAcao } from '@ui/components/BotaoAcao';
import { Button, Colors, Spacing, Typography } from '@ui/index';

/** Itens em linhas de dois; o que sobra sozinho na última linha fica com meia largura. */
const pares = (lista: ItemAnotar[]) =>
  lista.reduce<ItemAnotar[][]>((acc, item, i) => (i % 2 === 0 ? [...acc, [item]] : (acc[acc.length - 1].push(item), acc)), []);

/**
 * Folha "O que você quer anotar?" (spec §6.2), aberta pelo círculo ＋ das abas. É um modal do Stack
 * da área logada: as telas de registro de módulo empilham por cima e, ao salvar, voltam para cá. A
 * Foto de documento é tela de aba — a folha fecha antes e leva `voltarPara` com a `origem` (D-054).
 * Com um MRPA em andamento, a medida de agora vem primeiro (mesma rota da pendência `mrpa_hoje`).
 */
export default function Anotar() {
  const router = useRouter();
  const { origem = '/' } = useLocalSearchParams<{ origem?: string }>();
  const { sessao } = useMrpa();

  const abrir = (item: ItemAnotar) => {
    const { fecharAntes, href } = abrirDaFolha(item.rota, origem);
    if (fecharAntes) router.back();
    router.push(href as Href);
  };

  return (
    <SafeAreaView style={styles.tela} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.topo}>
          <Button label="Fechar" variant="ghost" accessibilityLabel="Fechar" onPress={() => router.back()} style={styles.fechar} />
        </View>
        <Text style={styles.titulo} accessibilityRole="header">O que você quer anotar?</Text>
        {sessao ? (
          <Button
            label="Medida do MRPA de agora"
            accessibilityLabel="Medida do MRPA de agora"
            onPress={() => router.push(`/(app)/coracao/mrpa/${sessao.id}` as Href)}
            style={styles.mrpa}
          />
        ) : null}
        <View style={styles.grade}>
          {pares(ITENS_ANOTAR).map((linha) => (
            <View key={linha[0].chave} style={styles.linha}>
              {linha.map((item) => <BotaoAcao key={item.chave} icone={item.icone} rotulo={item.rotulo} onPress={() => abrir(item)} />)}
              {linha.length === 1 ? <View style={{ flex: 1 }} /> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela:     { flex: 1, backgroundColor: Colors.background },
  conteudo: { padding: Spacing.xxl, paddingTop: Spacing.md },
  topo:     { flexDirection: 'row', justifyContent: 'flex-end' },
  fechar:   { paddingHorizontal: Spacing.md },
  titulo:   { ...Typography.title, color: Colors.primary, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  mrpa:     { width: '100%', marginBottom: Spacing.lg },
  grade:    { gap: Spacing.md },
  linha:    { flexDirection: 'row', gap: Spacing.md },
});
