/**
 * Os testes de tela simulam o expo-router só com `useRouter` (e às vezes `useFocusEffect`). Os ganchos de
 * navegação da D-054 usam também `useNavigation`, `usePathname` e `useLocalSearchParams`; aqui eles
 * voltam ao comportamento simples (empilhar/desempilhar). A regra de volta tem teste próprio em
 * `src/core/navegacao/__tests__/voltarPara.test.ts`.
 */
jest.mock('@core/navegacao/useVoltar', () => ({
  useAbrir: () => { const router = require('expo-router').useRouter(); return (href) => router.push(href); },
  useVoltar: () => { const router = require('expo-router').useRouter(); return () => router.back(); },
}));
