import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { LinhasExemplo, NeroDoSlide } from '@modules/onboarding/Miniaturas';
import { Colors, LogoNero, Radius, Spacing, Typography } from '@ui/index';

const { width } = Dimensions.get('window');

/**
 * Onboarding (D-033). Três slides, fundo claro, mascote em cada um.
 *
 * Os textos respondem **o que a pessoa ganha**, não como o app funciona. A versão anterior dizia
 * "o que você informa alimenta todos os módulos" — "módulos" é palavra nossa — e fechava com
 * "Orientação, não diagnóstico", definindo-se pela negação logo antes de a pessoa entrar. Agora o
 * terceiro slide promete o aviso e põe a ressalva no fim da frase, onde ela pertence.
 *
 * Fundo claro, calibrado pelo Murilo em 24/09: o mascote é azul e branco e desaparecia sobre o
 * gradiente marinho que havia aqui.
 */
const slides = [
  {
    id: '1',
    clipe: 'repouso' as const,
    titulo: 'Tudo num\nlugar só',
    texto: 'Pressão, exames, remédios e o que você sente. Do jeito que o seu médico precisa ver.',
    linhas: [
      { icone: 'heart-outline' as const, rotulo: 'Pressão de hoje', valor: '128 por 78' },
      { icone: 'checkmark-circle-outline' as const, rotulo: 'Mamografia', valor: 'Em dia até 2027' },
    ],
  },
  {
    id: '2',
    clipe: 'pensando' as const,
    titulo: 'Você conta\numa vez só',
    texto: 'O NERO lembra da sua história em todas as telas. Ninguém pede a mesma coisa duas vezes.',
    linhas: [
      { icone: 'create-outline' as const, rotulo: 'Você contou', valor: 'Parou de fumar em 2020' },
      { icone: 'arrow-forward-outline' as const, rotulo: 'Já preenchido em', valor: 'Risco do coração e pulmão', consequencia: true },
    ],
  },
  {
    id: '3',
    clipe: 'acenar' as const,
    titulo: 'O NERO\navisa a hora',
    texto: 'Remédio do dia, exame que está vencendo, pressão que subiu. Quem decide continua sendo o seu médico.',
    linhas: [
      { icone: 'time-outline' as const, rotulo: 'Hoje, às 8h', valor: 'Losartana' },
      { icone: 'calendar-outline' as const, rotulo: 'Este mês', valor: 'Mamografia: está na hora' },
    ],
  },
];

export default function Onboarding() {
  const router = useRouter();
  const lista = useRef<FlatList>(null);
  const [atual, setAtual] = useState(0);
  const ultimo = atual === slides.length - 1;

  const concluir = async () => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    // Quem acabou de ver o onboarding é gente nova: vai direto criar a conta (pedido do Murilo, 26/09).
    router.replace('/(auth)/cadastro');
  };
  const proxima = () => (ultimo ? concluir() : lista.current?.scrollToIndex({ index: atual + 1 }));

  return (
    <SafeAreaView style={styles.tela}>
      <StatusBar style="dark" />
      <View style={styles.topo}>
        <LogoNero variante="simbolo" width={26} />
        {!ultimo ? (
          <Pressable onPress={concluir} hitSlop={12} accessibilityRole="button">
            <Text style={styles.pular}>Pular</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.progresso}>
        {slides.map((_, i) => <View key={i} style={[styles.segmento, i <= atual && styles.segmentoAtivo]} />)}
      </View>

      <FlatList
        ref={lista}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.id}
        onMomentumScrollEnd={(e) => setAtual(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <NeroDoSlide clipe={item.clipe} />
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.texto}>{item.texto}</Text>
            <View style={styles.exemplos}>
              <LinhasExemplo linhas={item.linhas} />
            </View>
          </View>
        )}
      />

      <View style={styles.rodape}>
        <Pressable onPress={proxima} style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]} accessibilityRole="button">
          <Text style={styles.botaoTexto}>{ultimo ? 'Começar' : 'Próxima'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/** Espaçamento calibrado pelo Murilo em 24/09: 14 entre os blocos, título em 27. */
const RESPIRO = 14;

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, height: 44 },
  pular: { ...Typography.subheading, color: Colors.textSecondary },
  progresso: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xxl, marginTop: Spacing.xs },
  segmento: { flex: 1, height: 3, borderRadius: Radius.pill, backgroundColor: Colors.border },
  segmentoAtivo: { backgroundColor: Colors.logoCeu },
  slide: { width, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  titulo: { fontFamily: 'Poppins-ExtraBold', fontSize: 27, lineHeight: 31, letterSpacing: -0.4, color: Colors.primary, marginTop: RESPIRO },
  texto: { ...Typography.body, fontSize: 15, lineHeight: 23, color: Colors.textSecondary, marginTop: RESPIRO },
  exemplos: { marginTop: RESPIRO },
  rodape: { padding: Spacing.xxl },
  botao: { backgroundColor: Colors.primary, borderRadius: Radius.linha + 2, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { ...Typography.subheading, fontSize: 16, color: Colors.white },
});
