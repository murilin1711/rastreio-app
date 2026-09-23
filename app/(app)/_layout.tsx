import { Stack } from 'expo-router';

/**
 * Área logada. As abas vivem no grupo `(tabs)`; os módulos (Rastreando, Coração, Bem-estar)
 * ficam neste nível, fora da barra, e são abertos pela grade da Home (D-022).
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
