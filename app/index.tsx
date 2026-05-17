import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Theme';

SplashScreen.preventAutoHideAsync();

export default function SplashScreenApp() {
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push({ pathname: '/paginaInicial' });
    }, 3500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <View style={styles.container}>
      <StatusBar hidden={true} />
      <LottieView
        source={require('../assets/lottie/lupa.json')}
        autoPlay
        loop={true}
        speed={0.5}
        style={styles.lottie}
      />
      <Text style={styles.title}>RASTREANDO</Text>
      <Text style={styles.subtitle}>APP</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    color: Colors.white,
    fontFamily: 'Poppins-ExtraBold',
  },
  subtitle: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'Poppins-Regular',
  },
});
