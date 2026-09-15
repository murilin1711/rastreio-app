import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_KEY } from '@core/onboarding/chave';
import { Button, Colors, NeroImage, Radius, Spacing, Typography } from '@ui/index';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    titulo: 'Sua saúde,\nem um só lugar',
    texto: 'Pressão, glicemia, exames, hábitos e rastreamento de câncer — organizados para você e para o seu médico.',
  },
  {
    id: '2',
    titulo: 'Cadastre uma vez,\nuse em tudo',
    texto: 'Idade, tabagismo, medicamentos e histórico alimentam todos os módulos automaticamente.',
  },
  {
    id: '3',
    titulo: 'Orientação,\nnão diagnóstico',
    texto: 'O NERO organiza seus dados e avisa quando algo merece atenção. As decisões continuam com o seu médico.',
  },
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
  const proximo = () => (ultimo ? concluir() : lista.current?.scrollToIndex({ index: atual + 1 }));

  return (
    <SafeAreaView style={styles.tela}>
      <View style={styles.topo}>
        {!ultimo ? (
          <Pressable onPress={concluir} hitSlop={12} accessibilityRole="button">
            <Text style={styles.pular}>Pular</Text>
          </Pressable>
        ) : null}
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
            <NeroImage size={240} />
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.texto}>{item.texto}</Text>
          </View>
        )}
      />

      <View style={styles.rodape}>
        <View style={styles.pontos}>
          {slides.map((_, i) => <View key={i} style={[styles.ponto, i === atual && styles.pontoAtivo]} />)}
        </View>
        <Button label={ultimo ? 'Começar' : 'Próximo'} onPress={proximo} pill />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: Colors.background },
  topo: { height: 44, alignItems: 'flex-end', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  pular: { ...Typography.subheading, color: Colors.textSecondary },
  slide: { width, alignItems: 'center', paddingHorizontal: Spacing.xxxl, paddingTop: Spacing.xl },
  titulo: { ...Typography.display, color: Colors.primary, textAlign: 'center', marginTop: Spacing.xxl },
  texto: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.md, maxWidth: 320 },
  rodape: { padding: Spacing.xxl, gap: Spacing.xl },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm },
  ponto: { width: 8, height: 8, borderRadius: Radius.pill, backgroundColor: Colors.border },
  pontoAtivo: { width: 24, backgroundColor: Colors.primary },
});
