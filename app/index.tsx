import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Typography, Spacing, Radius } from '@/constants/Theme';

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');
const BG = '#0a1f4e';
const ONBOARDING_KEY = 'rastreando_onboarding_done';

const slides = [
  {
    id: '1',
    lottie: require('../assets/lottie/lupa2.json'),
    title: 'Rastreamento\nOncológico',
    description: 'Monitore sua saúde com exames de rastreio personalizados para você e sua família.',
  },
  {
    id: '2',
    lottie: require('../assets/lottie/relatorio.json'),
    title: 'Calcule\nseu Risco',
    description: 'Responda algumas perguntas e descubra seu nível de risco para diferentes tipos de câncer.',
  },
  {
    id: '3',
    lottie: require('../assets/lottie/inicio.json'),
    title: 'Fique\nem Dia',
    description: 'Acompanhe seus próximos exames e mantenha seu rastreio sempre atualizado.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const flatRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      SplashScreen.hideAsync();
      if (done === 'true') {
        router.replace('/paginaInicial');
      } else {
        setReady(true);
      }
    });
  }, []);

  const goNext = async () => {
    if (current < slides.length - 1) {
      flatRef.current?.scrollToIndex({ index: current + 1, animated: true });
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      router.replace('/paginaInicial');
    }
  };

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    router.replace('/paginaInicial');
  };

  if (!ready) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Blob decorativo */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <SafeAreaView style={styles.safe}>
        {/* Botão pular */}
        <View style={styles.topBar}>
          <View />
          <TouchableOpacity onPress={skip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={slides}
          keyExtractor={(s) => s.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrent(idx);
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <LottieView
                source={item.lottie}
                autoPlay
                loop
                style={styles.lottie}
              />
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          )}
        />

        {/* Dots + botão */}
        <View style={styles.footer}>
          <View style={styles.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === current && styles.dotActive]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={goNext} activeOpacity={0.85}>
            <Text style={styles.btnText}>
              {current === slides.length - 1 ? 'Começar' : 'Próximo'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  safe:      { flex: 1 },

  blob1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(46,93,191,0.18)', top: -70, right: -70 },
  blob2: { position: 'absolute', width: 180, height: 180, borderRadius: 90,  backgroundColor: 'rgba(46,93,191,0.12)', bottom: 160, left: -60 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  skipText: { ...Typography.subheading, color: 'rgba(255,255,255,0.45)', fontSize: 14 },

  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },

  lottie: { width: 240, height: 240 },

  title: {
    ...Typography.display,
    color: '#fff',
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 40,
  },
  description: {
    ...Typography.body,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },

  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
    alignItems: 'center',
  },

  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: {
    width: 24, backgroundColor: '#fff',
  },

  btn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnText: { ...Typography.subheading, color: BG, fontSize: 15 },
});
