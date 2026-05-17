import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const [fontsLoaded] = useFonts({
    'Poppins-Regular':   require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium':    require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold':  require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold':      require('../assets/fonts/Poppins-Bold.ttf'),
    'Poppins-ExtraBold': require('../assets/fonts/Poppins-ExtraBold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splashScreen" />
      <Stack.Screen name="paginaInicial" />
      <Stack.Screen name="PerfilIndividual" />
    </Stack>
  );
}
