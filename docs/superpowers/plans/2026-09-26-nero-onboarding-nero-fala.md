# Onboarding novo (o Nero fala) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o onboarding de três slides por uma conversa de 7 telas com o Nero, com fala palavra por palavra, três demonstrações animadas, pergunta do nome (que preenche o cadastro) e pergunta dos avisos antes do sistema.

**Architecture:** O roteiro é dado puro (`src/core/onboarding/roteiro.ts`); a tela `app/(auth)/onboarding.tsx` só conduz o passo atual e renderiza peças isoladas (`FalaNero`, `CenaNero`, três `Demo*`). O nome fica no AsyncStorage (`nomeGuardado.ts`) até a conta existir. Avisos reaproveitam `pedirPermissaoNotificacoes`, `estadoPermissao` e `marcarAdiado`.

**Tech Stack:** Expo SDK 57, expo-router, react-native-reanimated 4, react-native-svg, expo-linear-gradient, AsyncStorage, Jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-09-26-nero-onboarding-nero-fala-design.md`

## Global Constraints

- Nenhuma biblioteca nova com parte nativa (usar só o que está no `package.json`).
- Falas exatamente como no roteiro da spec §3 (texto aprovado pelo Murilo).
- Nada avança sozinho; o botão aparece quando a fala termina.
- Reduzir movimento: fala inteira e demonstrações no quadro final, de imediato.
- Demonstrações sem valor fora do normal nem cor de alerta.
- Português (Brasil) com acentuação em todo texto de interface e comentário.
- Não mexer em `app.json`, `eas.json`, `package.json` (o lote vai no build 4 por outro motivo, mas não criar dependência nativa nova).

## Review Focus

1. Tela do nome com teclado aberto num iPhone pequeno: campo e botão ficam visíveis (KeyboardAvoidingView) — conferir no simulador.
2. Nome com espaços nas pontas ou só espaços: tratado como sem nome (`trim`) — teste em `roteiro.test.ts` (`falaComNome`) e em `nomeGuardado.test.ts` (`guardarNome('  ')` apaga).
3. Voltar da tela 3 para a 2 e trocar o nome: a fala da tela 3 usa o nome novo — teste na tela (`onboarding.test.tsx`).
4. Permissão já decidida no iOS: a tela 6 não repete a pergunta, mostra "Próximo" — teste na tela.
5. Tocar para adiantar durante a fala não pula de tela sem querer: o toque só completa a fala; avançar exige o botão — teste em `falaNero.test.tsx`.

---

### Task 1: Roteiro e nome guardado

**Files:**
- Create: `src/core/onboarding/roteiro.ts`, `src/core/onboarding/nomeGuardado.ts`
- Test: `src/core/onboarding/__tests__/roteiro.test.ts`, `src/core/onboarding/__tests__/nomeGuardado.test.ts`

**Interfaces:**
- Produces: `type PassoOnboarding = 'oi' | 'nome' | 'prazer' | 'pressao' | 'relatorio' | 'lembrete' | 'final'`; `ROTEIRO: Passo[]` com `{ id, clipe: NeroClipe, nero: 'grande' | 'pequeno', linhaPequena?: string, fala: string, botao?: string }`; `falaComNome(texto: string, nome: string | null): string`; `guardarNome(nome: string): Promise<void>`; `lerNome(): Promise<string | null>`; `apagarNome(): Promise<void>`.

- [ ] **Step 1: testes que falham**

```ts
// roteiro.test.ts
import { falaComNome, ROTEIRO } from '../roteiro';
test('sete telas na ordem aprovada', () => {
  expect(ROTEIRO.map((p) => p.id)).toEqual(['oi', 'nome', 'prazer', 'pressao', 'relatorio', 'lembrete', 'final']);
});
test('fala com e sem nome', () => {
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', 'Maria')).toBe('Prazer, Maria! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Prazer{, nome}! Vou te mostrar o que eu faço por você.', null)).toBe('Prazer! Vou te mostrar o que eu faço por você.');
  expect(falaComNome('Pronto{, nome}! Agora é só criar sua conta.', '   ')).toBe('Pronto! Agora é só criar sua conta.');
});
test('fala do relatório é a aprovada pelo Murilo', () => {
  expect(ROTEIRO.find((p) => p.id === 'relatorio')!.fala).toBe('Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico.');
});
```

```ts
// nomeGuardado.test.ts
const mem: Record<string, string> = {}; let falhar = false;
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: async (k: string, v: string) => { if (falhar) throw new Error('x'); mem[k] = v; },
  getItem: async (k: string) => { if (falhar) throw new Error('x'); return mem[k] ?? null; },
  removeItem: async (k: string) => { if (falhar) throw new Error('x'); delete mem[k]; },
}));
import { apagarNome, guardarNome, lerNome } from '../nomeGuardado';
beforeEach(() => { falhar = false; for (const k of Object.keys(mem)) delete mem[k]; });
test('guarda, lê e apaga (sem espaços nas pontas)', async () => {
  await guardarNome('  Maria  '); expect(await lerNome()).toBe('Maria');
  await apagarNome(); expect(await lerNome()).toBeNull();
});
test('nome em branco apaga', async () => { await guardarNome('Maria'); await guardarNome('   '); expect(await lerNome()).toBeNull(); });
test('falha do armazenamento não lança', async () => {
  falhar = true;
  await expect(guardarNome('Maria')).resolves.toBeUndefined();
  await expect(lerNome()).resolves.toBeNull();
  await expect(apagarNome()).resolves.toBeUndefined();
});
```

- [ ] **Step 2:** `npx jest src/core/onboarding` → FAIL (módulos inexistentes).

- [ ] **Step 3: implementação**

```ts
// roteiro.ts
import type { NeroClipe } from '@ui/components/NeroAnimado';
export type PassoOnboarding = 'oi' | 'nome' | 'prazer' | 'pressao' | 'relatorio' | 'lembrete' | 'final';
export interface Passo { id: PassoOnboarding; clipe: NeroClipe; nero: 'grande' | 'pequeno'; linhaPequena?: string; fala: string; botao?: string }
/** D-063: roteiro aprovado pelo Murilo em 26/09. `{, nome}` vira ", Maria" ou some. */
export const ROTEIRO: Passo[] = [
  { id: 'oi', clipe: 'acenar', nero: 'grande', linhaPequena: 'Oi, eu sou o Nero!', fala: 'Vou te ajudar a organizar a sua saúde.', botao: 'Oi, Nero!' },
  { id: 'nome', clipe: 'pensando', nero: 'grande', fala: 'E você, como se chama?', botao: 'Continuar' },
  { id: 'prazer', clipe: 'acenar', nero: 'grande', fala: 'Prazer{, nome}! Vou te mostrar o que eu faço por você.', botao: 'Vamos lá' },
  { id: 'pressao', clipe: 'repouso', nero: 'pequeno', fala: 'Anote sua pressão e sua glicemia. Eu organizo tudo pra você.', botao: 'Próximo' },
  { id: 'relatorio', clipe: 'repouso', nero: 'pequeno', fala: 'Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico.', botao: 'Próximo' },
  { id: 'lembrete', clipe: 'repouso', nero: 'pequeno', fala: 'Eu te lembro do remédio na hora certa.', botao: 'Próximo' },
  { id: 'final', clipe: 'comemorar', nero: 'grande', fala: 'Pronto{, nome}! Agora é só criar sua conta.', botao: 'Criar minha conta' },
];
export const PERGUNTA_AVISOS = 'Posso te avisar?';
export function falaComNome(texto: string, nome: string | null): string {
  const n = nome?.trim();
  return texto.replace('{, nome}', n ? `, ${n}` : '');
}
```

```ts
// nomeGuardado.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
/** D-063: o nome dito ao Nero fica só no celular até a conta existir; preenche o cadastro. */
const CHAVE = 'nero:nome-onboarding';
export async function guardarNome(nome: string): Promise<void> {
  const n = nome.trim();
  try { if (n) await AsyncStorage.setItem(CHAVE, n); else await AsyncStorage.removeItem(CHAVE); } catch { /* sem armazenamento, segue sem nome */ }
}
export async function lerNome(): Promise<string | null> {
  try { return (await AsyncStorage.getItem(CHAVE))?.trim() || null; } catch { return null; }
}
export async function apagarNome(): Promise<void> {
  try { await AsyncStorage.removeItem(CHAVE); } catch { /* nada a fazer */ }
}
```

- [ ] **Step 4:** `npx jest src/core/onboarding` → PASS.
- [ ] **Step 5:** commit `feat(onboarding): roteiro e nome guardado (D-063)`.

---

### Task 2: FalaNero

**Files:**
- Create: `src/modules/onboarding/FalaNero.tsx`
- Test: `src/modules/onboarding/__tests__/falaNero.test.tsx`

**Interfaces:**
- Consumes: nada.
- Produces: `FalaNero({ linhaPequena?: string; fala: string; onTerminou: () => void; completar: number })` — `completar` é um contador: quando muda, a fala se completa (a tela incrementa ao receber um toque). Também exporta `MS_POR_PALAVRA(total: number): number`.

- [ ] **Step 1: testes que falham**

```tsx
import React from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { act, create } from 'react-test-renderer';
import { FalaNero } from '../FalaNero';
let reduzir = false;
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(reduzir));
beforeEach(() => { reduzir = false; jest.useFakeTimers(); });
afterEach(() => jest.useRealTimers());
const visiveis = (a: any) => a.root.findAll((n: any) => n.props?.testID === 'palavra' && n.props.style?.some?.((s: any) => s?.opacity === 1)).length;

it('termina sozinha no ritmo e avisa uma vez', async () => {
  const fim = jest.fn(); let a: any;
  await act(async () => { a = create(<FalaNero fala="Eu te lembro do remédio" onTerminou={fim} completar={0} />); });
  expect(fim).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(3000); });
  expect(fim).toHaveBeenCalledTimes(1);
});
it('incrementar `completar` mostra a frase inteira na hora', async () => {
  const fim = jest.fn(); let a: any;
  await act(async () => { a = create(<FalaNero fala="Uma frase de cinco palavras" onTerminou={fim} completar={0} />); });
  await act(async () => { a.update(<FalaNero fala="Uma frase de cinco palavras" onTerminou={fim} completar={1} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});
it('reduzir movimento: termina de imediato', async () => {
  reduzir = true; const fim = jest.fn();
  await act(async () => { create(<FalaNero fala="Oi" onTerminou={fim} completar={0} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});
it('leitor de tela recebe a frase inteira', async () => {
  let a: any;
  await act(async () => { a = create(<FalaNero linhaPequena="Oi, eu sou o Nero!" fala="Vou te ajudar." onTerminou={() => {}} completar={0} />); });
  expect(a.root.findByProps({ accessibilityRole: 'text' }).props.accessibilityLabel).toBe('Oi, eu sou o Nero! Vou te ajudar.');
});
```

- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: implementação**

```tsx
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, Typography } from '@ui/theme';
/** ~2 s por frase, entre 90 e 260 ms por palavra (D-063). */
export const MS_POR_PALAVRA = (total: number) => Math.min(260, Math.max(90, Math.round(2000 / Math.max(total, 1))));
interface Props { linhaPequena?: string; fala: string; onTerminou: () => void; completar: number }
/** A fala do Nero, palavra por palavra. A tela incrementa `completar` quando a pessoa toca: a frase se completa. */
export function FalaNero({ linhaPequena, fala, onTerminou, completar }: Props) {
  const palavras = fala.split(' ');
  const [mostradas, setMostradas] = useState(0);
  const avisou = useRef(false);
  const terminar = () => { setMostradas(palavras.length); if (!avisou.current) { avisou.current = true; onTerminou(); } };
  useEffect(() => {
    let vivo = true; let t: ReturnType<typeof setInterval> | undefined;
    avisou.current = false; setMostradas(0);
    AccessibilityInfo.isReduceMotionEnabled().then((reduzir) => {
      if (!vivo) return;
      if (reduzir) { terminar(); return; }
      const passo = MS_POR_PALAVRA(palavras.length);
      t = setInterval(() => setMostradas((n) => { const p = n + 1; if (p >= palavras.length) { clearInterval(t); setTimeout(terminar, 0); } return p; }), passo);
    }).catch(terminar);
    return () => { vivo = false; if (t) clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fala]);
  useEffect(() => { if (completar > 0) terminar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [completar]);
  return (
    <View accessible accessibilityRole="text" accessibilityLabel={[linhaPequena, fala].filter(Boolean).join(' ')}>
      {linhaPequena ? <Text style={styles.pequena}>{linhaPequena}</Text> : null}
      <Text style={styles.fala}>
        {palavras.map((p, i) => <Text key={i} testID="palavra" style={[styles.palavra, { opacity: i < mostradas ? 1 : 0.18 }]}>{p}{i < palavras.length - 1 ? ' ' : ''}</Text>)}
      </Text>
    </View>
  );
}
const styles = StyleSheet.create({
  pequena: { ...Typography.heading, color: Colors.textMuted, marginBottom: Spacing.sm },
  fala: { fontFamily: 'Poppins-Bold', fontSize: 26, lineHeight: 33, color: Colors.primary },
  palavra: {},
});
```

- [ ] **Step 4:** rodar → PASS.
- [ ] **Step 5:** commit `feat(onboarding): fala do Nero palavra por palavra (D-063)`.

---

### Task 3: CenaNero e as três demonstrações

**Files:**
- Create: `src/modules/onboarding/CenaNero.tsx`, `src/modules/onboarding/demos/DemoPressao.tsx`, `DemoRelatorio.tsx`, `DemoLembrete.tsx`, `src/modules/onboarding/demos/useSequencia.ts`
- Test: `src/modules/onboarding/__tests__/demos.test.tsx`

**Interfaces:**
- Produces: `CenaNero({ clipe: NeroClipe; tamanho: 'grande' | 'pequeno' })`; `DemoPressao`, `DemoRelatorio`, `DemoLembrete` com props `{ onTerminou?: () => void }`; `useSequencia(duracaoMs: number, onTerminou?: () => void): { progresso: SharedValue<number>; repetir: () => void }` — anima `progresso` de 0 a 1 em `duracaoMs`; com Reduzir movimento vai a 1 na hora; `repetir` recomeça.

- [ ] **Step 1: teste que falha** — cada demo renderiza e, com Reduzir movimento, chama `onTerminou` de imediato; tocar na área chama `repetir` sem quebrar.

```tsx
import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, create } from 'react-test-renderer';
import { DemoLembrete } from '../demos/DemoLembrete';
import { DemoPressao } from '../demos/DemoPressao';
import { DemoRelatorio } from '../demos/DemoRelatorio';
jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(() => Promise.resolve(true));
it.each([['pressão', DemoPressao], ['relatório', DemoRelatorio], ['lembrete', DemoLembrete]])('%s: com Reduzir movimento termina na hora', async (_n, Demo: any) => {
  const fim = jest.fn();
  await act(async () => { create(<Demo onTerminou={fim} />); });
  expect(fim).toHaveBeenCalledTimes(1);
});
it('o lembrete usa o texto real da notificação (D-044)', async () => {
  let a: any; await act(async () => { a = create(<DemoLembrete />); });
  const textos = a.root.findAll((n: any) => typeof n.props?.children === 'string').map((n: any) => n.props.children);
  expect(textos).toEqual(expect.arrayContaining(['Hora de tomar seu remédio 💊', 'Losartana 50 mg']));
});
```

- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: implementação** — `useSequencia` com `useSharedValue` + `withTiming(1, { duration }, (ok) => ok && onTerminou && runOnJS(onTerminou)())`; `CenaNero` com `LinearGradient` (`['#E7F1FB', Colors.background]`) e uma elipse clara como chão sob `NeroAnimado` (grande: `size` 230; pequeno: `size` 120, alinhado à direita embaixo). Demos com `Animated.View` + `useAnimatedStyle` interpolando `progresso` por fases (entrada do cartão 0–0,3; desenho do gráfico 0,3–0,85 via `strokeDashoffset` num `AnimatedPath` do react-native-svg; média 0,85–1). Relatório: três folhas convergindo 0–0,5, documento 0,5–0,75, QR 0,75–1 (QR estático em SVG, grade de quadrados fixa). Lembrete: aparelho estilizado com "08:00", notificação descendo 0,2–0,7. Textos de exemplo exatamente da spec §6. Toque na área (`Pressable`) chama `repetir`.
- [ ] **Step 4:** rodar → PASS; `npx tsc --noEmit` limpo.
- [ ] **Step 5:** commit `feat(onboarding): cena e as três demonstrações animadas (D-063)`.

---

### Task 4: A tela do onboarding

**Files:**
- Modify (reescrever): `app/(auth)/onboarding.tsx`
- Delete: `src/modules/onboarding/Miniaturas.tsx`
- Test: `src/modules/onboarding/__tests__/telaOnboarding.test.tsx`

**Interfaces:**
- Consumes: `ROTEIRO`, `falaComNome`, `PERGUNTA_AVISOS` (Task 1); `guardarNome`, `apagarNome` (Task 1); `FalaNero` (Task 2); `CenaNero`, `Demo*` (Task 3); `pedirPermissaoNotificacoes`, `estadoPermissao` (`@core/lembretes/permissao`); `marcarAdiado` (`@core/lembretes/useAvisos`); `ONBOARDING_KEY`.

- [ ] **Step 1: testes que falham** (mocks: `expo-router` com `useRouter` → `{ replace }`; AsyncStorage em memória; `@core/lembretes/permissao` com `estadoPermissao` configurável e `pedirPermissaoNotificacoes` jest.fn; `@core/lembretes/useAvisos` com `marcarAdiado` jest.fn; `AccessibilityInfo.isReduceMotionEnabled` → true para as falas terminarem na hora; `NeroAnimado` e `expo-linear-gradient` simples). Helpers: `tocar(rotulo)` acha o `Pressable` com `accessibilityLabel`/texto e chama `onPress`.
  - avança pelas 7 telas com os botões e termina em `/(auth)/cadastro`, gravando `ONBOARDING_KEY`;
  - nome digitado ("  Maria ") é guardado como "Maria" e a tela 3 mostra "Prazer, Maria!";
  - voltar da 3 para a 2, trocar para "Ana", avançar: a tela 3 mostra "Prazer, Ana!";
  - "Prefiro não dizer": nada guardado, tela 3 mostra "Prazer!";
  - "Pular" em qualquer tela vai ao cadastro e grava `ONBOARDING_KEY`;
  - tela 6 com `estadoPermissao` = `'perguntar'`: "Agora não" não chama `pedirPermissaoNotificacoes`, chama `marcarAdiado`, vai para a tela 7; "Sim, pode me avisar" chama `pedirPermissaoNotificacoes` e vai para a 7;
  - tela 6 com `estadoPermissao` = `'concedida'`: a pergunta não aparece, só "Próximo";
  - "Já tenho conta" na tela 7 vai para `/(auth)/login`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3: implementação** — estado `passo` (índice), `nome`, `completar` (contador), `falaPronta`, `perguntaAvisos: 'demo' | 'pergunta' | 'respondida'`. Topo: seta voltar (passo > 0), pontinhos (7), "Pular". Área da fala num `Pressable` que incrementa `completar`. Tela 2: `Input` grande com `autoFocus`, `onSubmitEditing` = continuar; "Continuar" exige `nome.trim().length >= 2`; "Prefiro não dizer" → `apagarNome()`, `nome=''`, avança. Ao sair da tela 2 com nome → `guardarNome(nome)`. Telas 4–6 mostram a demo entre a fala e o botão; na 6, quando a demo termina e `estadoPermissao()==='perguntar'`, mostra `FalaNero` com `PERGUNTA_AVISOS` e os dois botões. Botão só com `falaPronta` (entrada `FadeInDown` do Reanimated). `KeyboardAvoidingView` envolvendo tudo. Gesto de voltar: `Gesture.Pan()` do gesture-handler com `activeOffsetX(20)` → `runOnJS(voltar)` se `translationX > 80`. Saídas gravam `ONBOARDING_KEY` e fazem `router.replace`.
- [ ] **Step 4:** rodar → PASS; suíte inteira verde; `tsc` limpo.
- [ ] **Step 5:** commit `feat(onboarding): conversa com o Nero em 7 telas (D-063)`.

---

### Task 5: Integrações, documentação e simulador

**Files:**
- Modify: `app/(auth)/cadastro.tsx` (preencher Nome com `lerNome()`; após cadastro concluído, `apagarNome()`), `app/perfil-inicial.tsx` (preencher "Seu nome" com `lerNome()` quando `faltaNome`; ao concluir, `apagarNome()`), `docs/nero/02-DECISOES.md` (D-063 com o roteiro final), `docs/nero/PENDENCIAS.md` (conferir no aparelho).
- Test: `src/core/onboarding/__tests__/nomeGuardado.test.ts` já cobre a leitura; teste de tela do cadastro opcional não necessário.

- [ ] **Step 1:** cadastro: `useEffect(() => { lerNome().then((n) => { if (n) setNome((atual) => atual || n); }); }, [])`; após `signUp` sem erro, `apagarNome()`.
- [ ] **Step 2:** perfil inicial: mesmo preenchimento quando `faltaNome`; em `concluir` sem erro, `apagarNome()`.
- [ ] **Step 3:** `npx tsc --noEmit` e `npx jest` → verdes.
- [ ] **Step 4:** simulador (pedir ao Murilo para liberar o mouse): apagar a marca do onboarding (`xcrun simctl` + abrir `/onboarding` por link), percorrer as 7 telas, fotografar; conferir tocar para adiantar, teclado na tela 2, e Reduzir movimento (Ajustes do simulador).
- [ ] **Step 5:** D-063 no `02-DECISOES.md`; commit `feat(onboarding): nome do onboarding no cadastro e no perfil; D-063` e push.
