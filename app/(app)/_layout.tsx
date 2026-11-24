import { Stack } from 'expo-router';

/**
 * Área logada. As abas vivem no grupo `(tabs)`; os módulos (Rastreando, Coração, Bem-estar)
 * ficam neste nível, fora da barra, e são abertos pela grade da Home (D-022).
 *
 * A folha "O que você quer anotar?" (`anotar`), aberta pelo círculo ＋ das abas, é `modal` e não
 * `formSheet`: as telas de registro de módulo empilham por cima dela (o `router.back()` de quem salva
 * volta para a folha) e o arrastar para baixo fecha a folha (spec de navegação §6.2).
 *
 * A guarda de sessão **não** fica aqui: é o `Stack.Protected` de `app/_layout.tsx` (D-038). Um
 * `<Redirect>` neste layout entra em loop infinito — ele chama `router.replace` a cada renderização,
 * e um layout continua em foco enquanto a navegação acontece.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="anotar" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
