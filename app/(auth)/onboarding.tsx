import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { Colors, LogoNero, Radius, Spacing, Typography } from '@ui/index';

const { width } = Dimensions.get('window');

const slides = [
  { id: '1', titulo: 'Sua saúde,\nem um só lugar', texto: 'Pressão, glicemia, exames, hábitos e rastreamento de câncer — organizados para você e para o seu médico.' },
  { id: '2', titulo: 'Cadastre uma vez,\nuse em tudo', texto: 'Idade, tabagismo, medicamentos e histórico alimentam todos os módulos automaticamente.' },
  { id: '3', titulo: 'Orientação,\nnão diagnóstico', texto: 'O NERO organiza seus dados e avisa quando algo merece atenção. As decisões continuam com o seu médico.' },
];

export default function Onboarding() {
  const router = useRouter();
  const lista = useRef<FlatList>(null);
  const [atual, setAtual] = useState(0);
  const ultimo = atual === slides.length - 1;

  // Um único movimento: o símbolo flutua devagar (herdado do Rastreando).
  const flutua = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flutua, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flutua, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flutua]);
  const translateY = flutua.interpolate({ inputRange: [0, 1], outputRange: [0, -14] });

  const concluir = async () => {
    try { await AsyncStorage.setItem(ONBOARDING_KEY, 'true'); } catch {}
    router.replace('/(auth)/login');
  };
  const proxima = () => (ultimo ? concluir() : lista.current?.scrollToIndex({ index: atual + 1 }));

  return (
    <View style={styles.fundo}>
      <StatusBar style="light" />
      <View style={[styles.bolha, styles.bolha1]} />
      <View style={[styles.bolha, styles.bolha2]} />
      <View style={[styles.bolha, styles.bolha3]} />

      <SafeAreaView style={styles.tela}>
        <View style={styles.topo}>
          {!ultimo ? (
            <Pressable onPress={concluir} hitSlop={12} accessibilityRole="button">
              <Text style={styles.pular}>Pular</Text>
            </Pressable>
          ) : null}
        </View>

        <Animated.View style={[styles.simbolo, { transform: [{ translateY }] }]}>
          <LogoNero variante="simbolo" width={150} />
        </Animated.View>

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
              <Text style={styles.titulo}>{item.titulo}</Text>
              <Text style={styles.texto}>{item.texto}</Text>
            </View>
          )}
        />

        <View style={styles.cartao}>
          <View style={styles.pontos}>
            {slides.map((_, i) => <View key={i} style={[styles.ponto, i === atual && styles.pontoAtivo]} />)}
          </View>
          <Pressable onPress={proxima} style={({ pressed }) => [styles.botao, pressed && { opacity: 0.85 }]} accessibilityRole="button">
            <Text style={styles.botaoTexto}>{ultimo ? 'Começar' : 'Próxima'}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: Colors.hero },
  tela: { flex: 1 },
  bolha: { position: 'absolute', borderRadius: Radius.pill, backgroundColor: Colors.white, opacity: 0.05 },
  bolha1: { width: 320, height: 320, top: -120, right: -100 },
  bolha2: { width: 200, height: 200, top: 260, left: -90, opacity: 0.04 },
  bolha3: { width: 140, height: 140, bottom: 220, right: -30, opacity: 0.06 },
  topo: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: Spacing.xxl },
  pular: { ...Typography.subheading, color: 'rgba(255,255,255,0.7)' },
  simbolo: { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  slide: { width, paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.xl },
  titulo: { ...Typography.display, fontSize: 30, lineHeight: 36, color: Colors.white },
  texto: { ...Typography.body, fontSize: 16, lineHeight: 25, color: 'rgba(255,255,255,0.72)', marginTop: Spacing.lg, maxWidth: 340 },
  cartao: { margin: Spacing.xl, padding: Spacing.xl, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.bloco, gap: Spacing.lg },
  pontos: { flexDirection: 'row', gap: Spacing.sm },
  ponto: { width: 8, height: 8, borderRadius: Radius.pill, backgroundColor: 'rgba(255,255,255,0.25)' },
  pontoAtivo: { width: 24, backgroundColor: '#6FD8E6' },
  botao: { backgroundColor: Colors.white, borderRadius: Radius.pill, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { ...Typography.subheading, fontSize: 16, color: Colors.hero },
});
