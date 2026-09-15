import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { MiniaturaOrientacao, MiniaturaTudoEmUmLugar, MiniaturaUmaVez } from '@modules/onboarding/Miniaturas';
import { Colors, LogoNero, Radius, Spacing, Typography } from '@ui/index';

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', titulo: 'Sua saúde,\nem um só lugar', texto: 'Pressão, glicemia, exames, hábitos e rastreamento de câncer, organizados para você e para o seu médico.', Miniatura: MiniaturaTudoEmUmLugar },
  { id: '2', titulo: 'Cadastre uma vez,\nuse em tudo', texto: 'O que você informa alimenta todos os módulos. Nada de repetir idade, tabagismo ou medicamentos em cada tela.', Miniatura: MiniaturaUmaVez },
  { id: '3', titulo: 'Orientação,\nnão diagnóstico', texto: 'O NERO organiza seus dados e avisa quando algo merece atenção. As decisões continuam com o seu médico.', Miniatura: MiniaturaOrientacao },
];

export default function Onboarding() {
  const router = useRouter();
  const lista = useRef<FlatList>(null);
  const [atual, setAtual] = useState(0);
  const ultimo = atual === slides.length - 1;

  const concluir = async () => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    router.replace('/(auth)/login');
  };
  const proxima = () => (ultimo ? concluir() : lista.current?.scrollToIndex({ index: atual + 1 }));

  return (
    <LinearGradient colors={[Colors.hero, Colors.heroBottom]} style={styles.fundo}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.tela}>
        <View style={styles.topo}>
          <View style={styles.marca}>
            <LogoNero variante="simbolo" width={30} />
            <Text style={styles.marcaTexto}>NERO</Text>
          </View>
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
              <View style={styles.miniatura}><item.Miniatura /></View>
              <Text style={styles.titulo}>{item.titulo}</Text>
              <Text style={styles.texto}>{item.texto}</Text>
            </View>
          )}
        />

        <View style={styles.rodape}>
          <Pressable onPress={proxima} style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={styles.botaoTexto}>{ultimo ? 'Começar' : 'Próxima'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1 },
  tela: { flex: 1 },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.xxl, paddingTop: Spacing.md, height: 56 },
  marca: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  marcaTexto: { fontFamily: 'Poppins-ExtraBold', fontSize: 16, letterSpacing: 2, color: Colors.white },
  pular: { ...Typography.subheading, color: 'rgba(255,255,255,0.7)' },
  progresso: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xxl, marginTop: Spacing.sm },
  segmento: { flex: 1, height: 3, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.18)' },
  segmentoAtivo: { backgroundColor: Colors.logoCiano },
  slide: { width, paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxxl, flex: 1 },
  miniatura: { minHeight: 240, justifyContent: 'center', marginBottom: Spacing.xxxl },
  titulo: { fontFamily: 'Poppins-ExtraBold', fontSize: 32, lineHeight: 38, letterSpacing: -0.5, color: Colors.white },
  texto: { ...Typography.body, fontSize: 16, lineHeight: 25, color: 'rgba(255,255,255,0.72)', marginTop: Spacing.lg, maxWidth: 340 },
  rodape: { padding: Spacing.xxl },
  botao: { backgroundColor: Colors.white, borderRadius: Radius.pill, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { ...Typography.subheading, fontSize: 16, color: Colors.hero },
});
