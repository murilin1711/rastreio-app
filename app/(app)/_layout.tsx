import { Stack } from 'expo-router';

/**
 * Área logada. As abas vivem no grupo `(tabs)`; os módulos (Rastreando, Coração, Bem-estar)
 * ficam neste nível, fora da barra, e são abertos pela grade da Home (D-022).
 *
 * A guarda de sessão **não** fica aqui: é o `Stack.Protected` de `app/_layout.tsx` (D-038). Um
 * `<Redirect>` neste layout entra em loop infinito — ele chama `router.replace` a cada renderização,
 * e um layout continua em foco enquanto a navegação acontece.
 */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
