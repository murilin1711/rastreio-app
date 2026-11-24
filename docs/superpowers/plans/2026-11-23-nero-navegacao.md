# Reorganização da navegação do NERO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pôr a entrada de cada função a no máximo 2 toques da tela inicial: 5 ações grandes no topo do Início, um círculo "＋ Anotar" que abre uma folha com tudo o que dá para anotar, o mesmo molde ("O que você quer fazer?" → "Seus últimos números") nos módulos e na aba Minha Saúde, nomes novos e cada função num lugar só.

**Architecture:** As listas de ações viram dados puros e testáveis (`ITENS_ANOTAR`, `acoesInicio`, `acoesCoracao`, `ACOES_BEM_ESTAR`, `ACOES_PREVENCAO`), desenhadas por dois componentes novos de UI (`BotaoAcao`, `ListaAcoes`). A folha Anotar é uma rota modal no Stack de `(app)`; o círculo é um componente nosso posto em cada tela raiz de aba (a `NativeTabs` não muda). Nenhuma rota existente some: `coracao/exames` vira redirecionamento para a lista única de Minha Saúde, e `coracao/linha-do-tempo` só perde a entrada.

**Tech Stack:** Expo 57, expo-router (Stack + `NativeTabs`, typed routes), React Native, `@expo/vector-icons` (Ionicons), Jest com `jest-expo` + `react-test-renderer` (o projeto não usa `@testing-library/react-native`).

**Spec:** `docs/superpowers/specs/2026-11-23-reorganizacao-navegacao-design.md`
**Contrato entre planos:** este é o plano 1 de 3 (navegação). Os planos 2 (`2026-11-23-nero-remedio-tomado.md`) e 3 (`2026-11-23-nero-relatorio-novo.md`) rodam depois, no mesmo branch, e consomem `ItemAnotar`, `ITENS_ANOTAR`, a rota `app/(app)/anotar.tsx` e `BotaoAcao` com os nomes exatos daqui.

## Global Constraints

- Testes: `npx jest <caminho>`; tipos: `npx tsc --noEmit`. **Não** rodar `expo lint` (não há ESLint; ele instala dependências sozinho).
- Rota nova exige regenerar os tipos de rota antes do `tsc`: `npm run rotas` (sobe o `expo start` e grava `.expo/types/router.d.ts`).
- Textos de interface em português do Brasil, com acentos. Nomes com verbo e palavras do dia a dia; sigla só entre parênteses depois do nome comum (spec §2.6, §6.7.2).
- Barra de abas inalterada: `NativeTabs`, 4 abas `Início · Agenda · Histórico · Minha Saúde` (D-022). Nada em `app/(app)/(tabs)/_layout.tsx` muda.
- Círculo "Anotar": redondo, **≥ 60 pt**, cor `Colors.primary`, ícone "+", `accessibilityLabel="Anotar"`, logo acima da barra, canto direito, **só nas 4 telas raiz das abas**.
- Topo do Início com **no máximo 5 ações** (anti-objetivo §4).
- Letra mínima **17 pt** em botões e itens de lista; cada botão com `accessibilityLabel` igual ao texto; sem `numberOfLines` que corte texto em letra grande do sistema.
- Rotas antigas não quebram: nenhuma rota em `app/` é apagada; a que deixa de ser entrada continua existindo ou redireciona (§7).
- Sem mudança de banco, sem módulo nativo novo.
- Fora deste plano (contrato): `src/core/relatorios/*` (plano 3), `app/(app)/(tabs)/minha-saude/medicamentos.tsx` (plano 2), o item "Tomei remédio" de `ITENS_ANOTAR` (plano 2 acrescenta).
- Decisão registrada como **D-065** em `docs/nero/02-DECISOES.md`.
- Os 627 testes existentes continuam passando (exceto `faixaAtalhos.test.ts`, removido junto com a faixa que ele testava).
- Commits terminam com a linha `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

### Nomes novos (spec §6.4) — valem em todo texto visível

| Hoje | Novo |
|---|---|
| Coração & Metabolismo | Pressão, coração e diabetes |
| Rastreamentos | Exames de prevenção |
| Saúde & Bem-estar | Hábitos e bem-estar |
| MRPA (cartão) | Medir a pressão por 7 dias (MRPA) |
| HbA1c / LDL | Glicada (HbA1c) / Colesterol LDL |
| Relatório / Relatório de Saúde & Hábitos | Levar ao médico |
| Pendências (Início) | Para fazer hoje |
| Sinais de alerta (Coração) | Quando procurar o pronto-socorro |

## Review Focus

1. **Link antigo (notificação, pendência, linha do tempo) aponta para `/(app)/coracao/exames`, `/(app)/coracao/linha-do-tempo` ou para a tela de um módulo** → a tela abre como antes (ou redireciona para a lista única), nunca "rota não encontrada". Teste: `rotasAntigas.test.ts` (Tarefa 8) e `telaExamesCoracao.test.tsx` (Tarefa 5).
2. **Perfil ainda carregando (`perfil` nulo) ou `temDiabetes` nulo** → o terceiro botão do Início é "Meus exames", sem erro e sem piscar "Anotar minha glicemia". Teste em `acoesInicio.test.ts` (Tarefa 4).
3. **MRPA em andamento com `dia` fora de 1..N** (antes do primeiro dia, ou depois do último sem concluir) → o item diz "dia 1 de 7" / "dia 7 de 7", nunca "dia 0" ou "dia 9 de 7". Teste em `acoesCoracao.test.ts` (Tarefa 5).
4. **Pessoa nova, sem nenhum número registrado** → o módulo mostra só "O que você quer fazer?"; o título "Seus últimos números" não aparece sozinho, vazio. Testes em `telaCardio.test.tsx` (Tarefa 5) e `telaBemEstar.test.tsx` (Tarefa 6).
5. **Letra grande do sistema com rótulo longo ("Anotar minha glicemia")** → o texto quebra linha em vez de cortar, e o círculo não cobre o último item da rolagem. Testes em `botaoAcao.test.tsx` e `espacoAbas.test.ts` (Tarefa 1).

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/ui/components/BotaoAcao.tsx` (novo) | Botão grande de ação (Início e folha Anotar). Assinatura fixada pelo contrato. |
| `src/ui/components/ListaAcoes.tsx` (novo) | Seção "O que você quer fazer?" dos módulos: título + `ListItem` por ação. Exporta o tipo `AcaoModulo`. |
| `src/ui/components/ListItem.tsx` | Título a 17 pt e `accessibilityLabel={title}`. |
| `src/ui/components/espacoAbas.ts` | Soma a altura do círculo ao espaço do fim da rolagem; exporta as medidas do círculo. |
| `src/modules/anotar/itensAnotar.ts` (novo) | `ItemAnotar`, `ITENS_ANOTAR` (contrato). |
| `src/modules/anotar/abrirDaFolha.ts` (novo) | Regra pura: abrir um item da folha empilhando sobre ela ou fechando-a antes (D-054). |
| `src/modules/anotar/BotaoAnotar.tsx` (novo) | O círculo flutuante "＋". |
| `app/(app)/anotar.tsx` (novo) | Folha "O que você quer anotar?". |
| `app/(app)/_layout.tsx` | Declara `anotar` como modal. |
| `src/modules/home/acoesInicio.ts` (novo) | As 5 ações do topo do Início, com a troca glicemia/exames pelo perfil. |
| `src/modules/coracao/acoes.ts` (novo) | Ações do módulo "Pressão, coração e diabetes". |
| `src/modules/bem-estar/acoes.ts` (novo) | Ações do módulo "Hábitos e bem-estar". |
| `src/modules/rastreando/acoes.ts` (novo) | Ações do topo de "Exames de prevenção". |
| Telas de `app/` tocadas | Molde único, nomes novos, botão "Anotar" primeiro nas telas de tema. |

---

### Task 1: Peças de interface — `BotaoAcao`, `ListaAcoes`, `ListItem` a 17 pt e espaço do círculo

**Files:**
- Create: `src/ui/components/BotaoAcao.tsx`, `src/ui/components/ListaAcoes.tsx`
- Modify: `src/ui/components/ListItem.tsx`, `src/ui/components/espacoAbas.ts`, `src/ui/index.ts`
- Test: `src/ui/components/__tests__/botaoAcao.test.tsx`, `src/ui/components/__tests__/listaAcoes.test.tsx`, `src/ui/components/__tests__/espacoAbas.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `BotaoAcao({ icone, rotulo, onPress, largo? }: { icone: keyof typeof Ionicons.glyphMap; rotulo: string; onPress: () => void; largo?: boolean }): JSX.Element` — exportado em `@ui/index`.
  - `export interface AcaoModulo { chave: string; icone: keyof typeof Ionicons.glyphMap; titulo: string; subtitulo?: string; rota: string }` e `ListaAcoes({ acoes, onAbrir }: { acoes: AcaoModulo[]; onAbrir: (rota: string) => void }): JSX.Element` — ambos exportados em `@ui/index` (`export type { AcaoModulo }`).
  - `export const ALTURA_BARRA = 58`, `export const TAMANHO_BOTAO_ANOTAR = 64`, `export const FOLGA_BOTAO_ANOTAR = Spacing.md` em `espacoAbas.ts`; `useEspacoAbas(): number` passa a valer `ALTURA_BARRA + FOLGA_BOTAO_ANOTAR + TAMANHO_BOTAO_ANOTAR + Spacing.xxl + insets.bottom`.

- [ ] **Step 1: Escrever os testes que falham**

`botaoAcao.test.tsx` (react-test-renderer, `jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))` com `glyphMap: {}` como em `faixaAtalhos.test.ts`):
```tsx
it('mostra o rótulo, anuncia o mesmo texto e chama onPress', () => {
  const onPress = jest.fn();
  const a = create(<BotaoAcao icone="pulse-outline" rotulo="Anotar minha pressão" onPress={onPress} />);
  const botao = a.root.find((n) => n.props.accessibilityRole === 'button');
  expect(botao.props.accessibilityLabel).toBe('Anotar minha pressão');
  botao.props.onPress();
  expect(onPress).toHaveBeenCalledTimes(1);
});
it('o rótulo tem pelo menos 17 pt e não é cortado em letra grande', () => {
  const a = create(<BotaoAcao icone="pulse-outline" rotulo="Anotar minha glicemia" onPress={() => {}} />);
  const texto = a.root.findByType(Text);
  expect(StyleSheet.flatten(texto.props.style).fontSize).toBeGreaterThanOrEqual(17);
  expect(texto.props.numberOfLines).toBeUndefined();
});
it('largo ocupa a linha inteira (alignSelf stretch, sem flex: 1)', () => { /* flatten do estilo do botão: largo → width '100%'; normal → flex 1 */ });
```
`listaAcoes.test.tsx`:
```tsx
const ACOES: AcaoModulo[] = [
  { chave: 'pressao', icone: 'pulse-outline', titulo: 'Minha pressão', subtitulo: 'anotar e ver como está', rota: '/(app)/coracao/pressao' },
  { chave: 'sinais', icone: 'alert-circle-outline', titulo: 'Quando procurar o pronto-socorro', rota: '/(app)/coracao/sinais' },
];
it('abre com "O que você quer fazer?" e lista as ações na ordem', () => { /* textos: 'O que você quer fazer?', 'Minha pressão', 'Quando procurar o pronto-socorro' nessa ordem */ });
it('tocar numa ação chama onAbrir com a rota dela', () => { /* onPress do item 'Minha pressão' → onAbrir('/(app)/coracao/pressao') */ });
it('o título do item tem 17 pt e accessibilityLabel igual ao título', () => { /* ListItem */ });
```
`espacoAbas.test.ts` (mock de `react-native-safe-area-context` com `useSafeAreaInsets: () => ({ bottom: 34, top: 0, left: 0, right: 0 })`; chamar o hook via `renderHook` simples com `create` de um componente que guarda o retorno):
```ts
it('o fim da rolagem deixa lugar para a barra e para o círculo', () => {
  expect(valor).toBe(58 + 12 + 64 + 24 + 34); // 192
});
it('o círculo tem pelo menos 60 pt', () => { expect(TAMANHO_BOTAO_ANOTAR).toBeGreaterThanOrEqual(60); });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/ui/components/__tests__/botaoAcao.test.tsx src/ui/components/__tests__/listaAcoes.test.tsx src/ui/components/__tests__/espacoAbas.test.ts`
Expected: FAIL — módulos `BotaoAcao`/`ListaAcoes` não existem; `useEspacoAbas` devolve 116.

- [ ] **Step 3: Implementar**

- `BotaoAcao`: `Pressable` com `accessibilityRole="button"`, `accessibilityLabel={rotulo}`, fundo `Colors.surface`, `Radius.bloco`, `Shadows.card`, `minHeight: 96`; ícone Ionicons 28 em `Colors.primary`; texto `Poppins-SemiBold` 17/23 em `Colors.textPrimary`, sem `numberOfLines`. Normal: coluna, `flex: 1`. `largo`: linha (ícone à esquerda do texto), `width: '100%'`, `minHeight: 64`.
- `ListaAcoes`: `Text` "O que você quer fazer?" (`Typography.heading`) + `View` com `gap: Spacing.sm` e um `ListItem` por ação (`icon`, `title`, `subtitle`, `onPress={() => onAbrir(a.rota)}`), `key={a.chave}`.
- `ListItem`: `title` passa a `fontSize: 17, lineHeight: 23` (sobre `Typography.subheading`); `TouchableOpacity` ganha `accessibilityLabel={title}`.
- `espacoAbas.ts`: exportar as três constantes acima; atualizar o comentário (o círculo "Anotar" fica sobre a rolagem nas mesmas 4 telas).

- [ ] **Step 4: Rodar e ver passar**

Run: o mesmo comando do Step 2, depois `npx jest` (tudo).
Expected: PASS; nenhum teste antigo quebra com o `ListItem` maior.

- [ ] **Step 5: Commit**

```bash
git add src/ui/components/BotaoAcao.tsx src/ui/components/ListaAcoes.tsx src/ui/components/ListItem.tsx src/ui/components/espacoAbas.ts src/ui/index.ts src/ui/components/__tests__/botaoAcao.test.tsx src/ui/components/__tests__/listaAcoes.test.tsx src/ui/components/__tests__/espacoAbas.test.ts
git commit -m "feat(navegação): BotaoAcao, ListaAcoes, itens de lista a 17 pt e espaço para o ＋ Anotar"
```

---

### Task 2: Itens da folha Anotar e a regra de abertura

**Files:**
- Create: `src/modules/anotar/itensAnotar.ts`, `src/modules/anotar/abrirDaFolha.ts`
- Test: `src/modules/anotar/__tests__/itensAnotar.test.ts`, `src/modules/anotar/__tests__/abrirDaFolha.test.ts`

**Interfaces:**
- Consumes: `comVolta`, `abaDe` de `@core/navegacao/voltarPara`.
- Produces (contrato, nomes exatos):
  - `export interface ItemAnotar { chave: string; icone: keyof typeof Ionicons.glyphMap; rotulo: string; rota: string }`
  - `export const ITENS_ANOTAR: ItemAnotar[]`
  - `export function abrirDaFolha(rota: string, origem: string): { fecharAntes: boolean; href: string | { pathname: string; params?: Record<string, unknown> } }`

Valores de `ITENS_ANOTAR`, nesta ordem (o plano 2 insere `remedio` como terceiro):

| chave | ícone | rótulo | rota |
|---|---|---|---|
| `pressao` | `pulse-outline` | Pressão | `/(app)/coracao/pressao/registrar` |
| `glicemia` | `eyedrop-outline` | Glicemia | `/(app)/coracao/glicemia/registrar` |
| `peso` | `body-outline` | Peso e medidas | `/(app)/bem-estar/corpo/registrar` |
| `sono` | `moon-outline` | Sono | `/(app)/bem-estar/sono/registrar` |
| `atividade` | `walk-outline` | Atividade | `/(app)/bem-estar/atividade/registrar` |
| `agua` | `water-outline` | Água | `/(app)/bem-estar/agua` |
| `refeicao` | `restaurant-outline` | Refeição | `/(app)/bem-estar/alimentacao/registrar` |
| `exame` | `flask-outline` | Resultado de exame | `/(app)/coracao/exames/registrar` |
| `documento` | `camera-outline` | Foto de documento | `/(app)/(tabs)/minha-saude/documentos/novo` |

Regra de `abrirDaFolha`: rota de módulo (`abaDe(rota) === null`) empilha **sobre** a folha — o `router.back()` de quem salva volta para a folha (spec §6.2). Rota de aba fecha a folha antes e abre com `comVolta(rota, origem)` — ao salvar, a pessoa volta para onde estava antes de tocar no ＋ (D-054).

- [ ] **Step 1: Escrever os testes que falham**

`itensAnotar.test.ts` — mesmo padrão de `src/modules/home/__tests__/faixaAtalhos.test.ts` (`jest.mock('@expo/vector-icons', ...)`, função `existe(rota)` sobre `app/`):
```ts
it('começa por Pressão e Glicemia e tem os nove itens da spec', () => {
  const rotulos = ITENS_ANOTAR.map((i) => i.rotulo);
  expect(rotulos.slice(0, 2)).toEqual(['Pressão', 'Glicemia']);
  expect(rotulos).toEqual(expect.arrayContaining(['Peso e medidas', 'Sono', 'Atividade', 'Água', 'Refeição', 'Resultado de exame', 'Foto de documento']));
});
it('não tem "Tomei remédio" (vem do plano do remédio)', () => { /* nenhuma chave 'remedio' */ });
it('chaves não se repetem', () => { /* new Set(chaves).size === length */ });
it.each(/* [rotulo, rota] */)('%s leva a uma tela que existe (%s)', (_r, rota) => { expect(existe(rota)).toBe(true); });
```
`abrirDaFolha.test.ts`:
```ts
it('registro de módulo empilha sobre a folha, sem fechar', () => {
  expect(abrirDaFolha('/(app)/coracao/pressao/registrar', '/historico')).toEqual({ fecharAntes: false, href: '/(app)/coracao/pressao/registrar' });
});
it('documento, aberto de outra aba, fecha a folha e leva a volta', () => {
  expect(abrirDaFolha('/(app)/(tabs)/minha-saude/documentos/novo', '/historico')).toEqual({ fecharAntes: true, href: { pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { voltarPara: '/historico' } } });
});
it('documento, aberto da própria aba Minha Saúde, fecha a folha sem voltarPara', () => {
  expect(abrirDaFolha('/(app)/(tabs)/minha-saude/documentos/novo', '/minha-saude')).toEqual({ fecharAntes: true, href: '/(app)/(tabs)/minha-saude/documentos/novo' });
});
it('rota de módulo nova (ex.: /(app)/remedios/hoje) também empilha', () => { /* fecharAntes false */ });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/anotar`
Expected: FAIL — `Cannot find module '../itensAnotar'`.

- [ ] **Step 3: Implementar** `itensAnotar.ts` (tabela acima; comentário apontando §6.2 e que o plano 2 acrescenta o remédio como terceiro) e `abrirDaFolha.ts` (regra acima, usando `abaDe` e `comVolta`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/anotar`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/anotar
git commit -m "feat(anotar): itens da folha Anotar e regra de abertura"
```

---

### Task 3: Folha "O que você quer anotar?" e o círculo ＋ nas quatro abas

**Files:**
- Create: `app/(app)/anotar.tsx`, `src/modules/anotar/BotaoAnotar.tsx`
- Modify: `app/(app)/_layout.tsx`, `app/(app)/(tabs)/index.tsx` (só o círculo), `app/(app)/(tabs)/agenda/index.tsx`, `app/(app)/(tabs)/historico.tsx`, `app/(app)/(tabs)/minha-saude/index.tsx` (só o círculo), `app/(app)/(tabs)/minha-saude/documentos/novo.tsx:69`
- Test: `src/modules/anotar/__tests__/telaAnotar.test.tsx`, `src/modules/anotar/__tests__/botaoAnotar.test.tsx`, `src/core/documentos/__tests__/telaNovoDocumento.test.tsx` (um teste a mais)

**Interfaces:**
- Consumes: `ITENS_ANOTAR`, `abrirDaFolha` (Tarefa 2); `BotaoAcao`, `TAMANHO_BOTAO_ANOTAR`, `ALTURA_BARRA`, `FOLGA_BOTAO_ANOTAR` (Tarefa 1); `useMrpa()` de `@core/cardio/useMrpa` (`sessao` = sessão em andamento ou `null`); `useVoltar` de `@core/navegacao/useVoltar`.
- Produces:
  - Rota `/(app)/anotar` (arquivo `app/(app)/anotar.tsx`), parâmetro opcional `origem?: string` (caminho de quem abriu, padrão `'/'`), apresentada como `presentation: 'modal'`.
  - `BotaoAnotar({ origem }: { origem: string }): JSX.Element` — faz `router.push({ pathname: '/(app)/anotar', params: { origem } })`. Origens: Início `'/'`, Agenda `'/agenda'`, Histórico `'/historico'`, Minha Saúde `'/minha-saude'` (o mesmo formato de `usePathname`, que `comVolta` espera).

- [ ] **Step 1: Escrever os testes que falham**

`botaoAnotar.test.tsx` (mock de `expo-router` com `useRouter: () => ({ push: mockPush })` e de `react-native-safe-area-context` com `bottom: 34`):
```tsx
it('é um botão "Anotar" de pelo menos 60 pt que abre a folha com a origem', () => {
  const a = create(<BotaoAnotar origem="/historico" />);
  const b = a.root.find((n) => n.props.accessibilityLabel === 'Anotar');
  const s = StyleSheet.flatten(b.props.style);
  expect(s.width).toBeGreaterThanOrEqual(60); expect(s.height).toBe(s.width);
  expect(s.backgroundColor).toBe(Colors.primary);
  expect(s.bottom).toBe(58 + 12 + 34); expect(s.position).toBe('absolute');
  b.props.onPress();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/anotar', params: { origem: '/historico' } });
});
```
`telaAnotar.test.tsx` (mocks: `expo-router` com `useRouter: () => ({ push: mockPush, back: mockBack })` e `useLocalSearchParams: () => mockParams`; `@core/cardio/useMrpa` com `useMrpa: () => ({ sessao: mockSessao })`; `react-native-safe-area-context` como nos testes da Home; helpers `textoDe`/`apertar` copiados de `src/core/documentos/__tests__/telaNovoDocumento.test.tsx`):
```tsx
it('título "O que você quer anotar?" e um botão por item, na ordem de ITENS_ANOTAR', () => { /* rótulos dos BotaoAcao === ITENS_ANOTAR.map(rotulo) */ });
it('"Fechar" fecha a folha', () => { apertar(a, 'Fechar'); expect(mockBack).toHaveBeenCalled(); });
it('Pressão abre o registro empilhado sobre a folha', () => {
  apertar(a, 'Pressão');
  expect(mockBack).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/pressao/registrar');
});
it('Foto de documento fecha a folha e abre com a volta para a origem', () => {
  mockParams = { origem: '/historico' };
  apertar(a, 'Foto de documento');
  expect(mockBack).toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/(app)/(tabs)/minha-saude/documentos/novo', params: { voltarPara: '/historico' } });
});
it('sem MRPA em andamento, não mostra "Medida do MRPA de agora"', () => {});
it('com MRPA em andamento, o botão aparece no topo e abre a sessão', () => {
  mockSessao = { id: 's1' };
  apertar(a, 'Medida do MRPA de agora');
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/mrpa/s1');
});
```
`telaNovoDocumento.test.tsx` — acrescentar no topo `const mockVoltar = jest.fn(); jest.mock('@core/navegacao/useVoltar', () => ({ useVoltar: () => mockVoltar, useAbrir: () => jest.fn() }));` e o teste:
```tsx
it('depois de salvar, volta pelo useVoltar (respeita voltarPara)', async () => {
  /* mesmo roteiro de 'sem cancelar, grava o documento…' */
  expect(mockVoltar).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/anotar src/core/documentos/__tests__/telaNovoDocumento.test.tsx`
Expected: FAIL — tela e botão não existem; `mockVoltar` não é chamado (a tela usa `router.back()`).

- [ ] **Step 3: Implementar**

- `app/(app)/_layout.tsx`: `<Stack screenOptions={{ headerShown: false }}><Stack.Screen name="anotar" options={{ presentation: 'modal' }} /></Stack>`. `modal` (não `formSheet`) porque as telas de registro empilham sobre a folha e o arrastar para baixo fecha. Atualizar o comentário do arquivo.
- `app/(app)/anotar.tsx`: `SafeAreaView` + `ScrollView`; linha de topo com `Button` "Fechar" (`variant="ghost"`, `router.back()`); título "O que você quer anotar?" (`Typography.title`); se `useMrpa().sessao`, um `Button` (primário, largura total) "Medida do MRPA de agora" → `router.push(`/(app)/coracao/mrpa/${sessao.id}`)` — mesma rota da pendência `mrpa_hoje` em `montarItensHoje.ts:111`; depois a grade 2 colunas de `BotaoAcao` (pares de `ITENS_ANOTAR`; item sozinho na última linha ocupa meia largura, como `rastreando/index.tsx` faz com `pares`). Toque: `const { fecharAntes, href } = abrirDaFolha(item.rota, origem); if (fecharAntes) router.back(); router.push(href as Href);`.
- `src/modules/anotar/BotaoAnotar.tsx`: `Pressable` absoluto, `right: Spacing.xxl`, `bottom: ALTURA_BARRA + FOLGA_BOTAO_ANOTAR + insets.bottom`, `width = height = TAMANHO_BOTAO_ANOTAR`, `borderRadius` metade, `Colors.primary`, `Shadows.card`, Ionicons `add` 34 branco, `accessibilityRole="button"`, `accessibilityLabel="Anotar"`.
- As 4 telas raiz: `<BotaoAnotar origem="…" />` como último filho do `SafeAreaView`, depois do `ScrollView` (Início: antes dos modais de comemoração/avisos, para os modais ficarem por cima).
- `documentos/novo.tsx`: `const voltar = useVoltar();` e trocar o `router.back()` da linha 69 (depois de salvar) por `voltar()`. Sem `voltarPara`, `voltar` é o mesmo `router.back()`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/anotar src/core/documentos src/modules/home`
Expected: PASS (os testes da Home continuam passando com o círculo; ele só usa `useRouter` e `useSafeAreaInsets`, que já são simulados lá).

- [ ] **Step 5: Tipos**

Run: `npm run rotas && npx tsc --noEmit`
Expected: sem erros (`/(app)/anotar` aparece em `.expo/types/router.d.ts`).

- [ ] **Step 6: Conferir no simulador iOS** — tocar ＋ nas 4 abas; Pressão → salvar → "Concluir" volta à folha; Foto de documento aberto do Histórico → salvar volta ao Histórico; arrastar a folha para baixo fecha; o ＋ não aparece em telas internas (ex.: Minha Saúde › Meus exames).

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/anotar.tsx" "app/(app)/_layout.tsx" src/modules/anotar "app/(app)/(tabs)/index.tsx" "app/(app)/(tabs)/agenda/index.tsx" "app/(app)/(tabs)/historico.tsx" "app/(app)/(tabs)/minha-saude/index.tsx" "app/(app)/(tabs)/minha-saude/documentos/novo.tsx" src/core/documentos/__tests__/telaNovoDocumento.test.tsx
git commit -m "feat(anotar): folha O que você quer anotar? e círculo ＋ nas quatro abas"
```

---

### Task 4: Tela inicial — ações no topo, "Para fazer hoje" e "Meus cuidados"

**Files:**
- Create: `src/modules/home/acoesInicio.ts`
- Modify: `app/(app)/(tabs)/index.tsx`, `src/modules/home/CardModulo.tsx`
- Delete: `src/modules/home/FaixaAtalhos.tsx`, `src/modules/home/__tests__/faixaAtalhos.test.ts`
- Test: `src/modules/home/__tests__/acoesInicio.test.ts`, `src/modules/home/__tests__/telaHomeAcoes.test.tsx`

**Interfaces:**
- Consumes: `ItemAnotar` (Tarefa 2), `BotaoAcao` (Tarefa 1), `useAbrir` (existente), `perfil.temDiabetes: boolean | null` de `usePerfil()`.
- Produces: `export function acoesInicio(temDiabetes: boolean | null | undefined): { grade: ItemAnotar[]; largo: ItemAnotar }` em `src/modules/home/acoesInicio.ts`. `CardModulo` ganha `descricao?: string` e `largo?: boolean`. `montarItensHoje` **não muda** (o plano 2 acrescenta doses nele); só o título da seção muda na tela.

Valores (spec §6.3):

| posição | chave | ícone | rótulo | rota |
|---|---|---|---|---|
| grade 1 | `pressao` | `pulse-outline` | Anotar minha pressão | `/(app)/coracao/pressao/registrar` |
| grade 2 | `remedios` | `medkit-outline` | Meus remédios | `/(app)/(tabs)/minha-saude/medicamentos` |
| grade 3 (`temDiabetes === true`) | `glicemia` | `eyedrop-outline` | Anotar minha glicemia | `/(app)/coracao/glicemia/registrar` |
| grade 3 (demais) | `exames` | `flask-outline` | Meus exames | `/(app)/(tabs)/minha-saude/exames` |
| grade 4 | `medico` | `document-text-outline` | Levar ao médico | `/(app)/(tabs)/minha-saude/relatorios` |
| largo | `consultas` | `calendar-outline` | Minhas consultas | `/(app)/(tabs)/agenda/consultas` |

"Meus cuidados" (cartões de largura total, nesta ordem; capas e ícones de hoje):

| título | descrição (uma linha) | rota |
|---|---|---|
| Pressão, coração e diabetes | Pressão, MRPA, glicemia, exames e risco do coração | `/(app)/coracao` |
| Exames de prevenção | Mamografia, papanicolau, intestino e outros exames de rotina | `/(app)/rastreando` |
| Hábitos e bem-estar | Peso, sono, atividades, água, alimentação e metas | `/(app)/bem-estar` |

- [ ] **Step 1: Escrever os testes que falham**

`acoesInicio.test.ts` (padrão de `faixaAtalhos.test.ts` para o mock de ícones e a função `existe`):
```ts
it('com diabetes no perfil: pressão, remédios, glicemia, médico + consultas', () => {
  const { grade, largo } = acoesInicio(true);
  expect(grade.map((a) => a.rotulo)).toEqual(['Anotar minha pressão', 'Meus remédios', 'Anotar minha glicemia', 'Levar ao médico']);
  expect(largo.rotulo).toBe('Minhas consultas');
});
it.each([false, null, undefined])('sem diabetes confirmado (%s), o terceiro é "Meus exames"', (t) => {
  expect(acoesInicio(t).grade[2]).toMatchObject({ rotulo: 'Meus exames', rota: '/(app)/(tabs)/minha-saude/exames' });
});
it('no máximo cinco ações', () => { const { grade } = acoesInicio(true); expect(grade.length + 1).toBeLessThanOrEqual(5); });
it.each(/* todas as rotas das duas variantes */)('%s leva a uma tela que existe', ...);
```
`telaHomeAcoes.test.tsx` — copiar os mocks de `telaHomeAvisos.test.tsx`, com `usePerfil` lendo `mockPerfil` (variável) e `useRouter: () => ({ push: mockPush })`; helpers `textoDe`/`apertar`:
```tsx
it('abre com "O que você quer fazer?" e as cinco ações', ...);       // os 5 rótulos presentes
it('com diabetes, mostra "Anotar minha glicemia"; sem, "Meus exames"', ...);
it('"Para fazer hoje" substitui "Pendências"; "Meus cuidados" tem os três módulos novos', ...);
it('saíram "Atalhos", "Módulos", "Minha Saúde" da grade e "Como está sua saúde hoje?"', ...); // nenhum Text com esses textos
it('tocar em "Anotar minha pressão" abre o registro de pressão', () => { /* mockPush('/(app)/coracao/pressao/registrar') */ });
it('o círculo "Anotar" está na tela e abre a folha com origem "/"', ...);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/home`
Expected: FAIL — `acoesInicio` não existe; textos novos ausentes.

- [ ] **Step 3: Implementar**

- `acoesInicio.ts` com a tabela acima.
- `CardModulo`: `descricao` em `Typography.body` branco (opacidade 0.9) abaixo do título; `largo` → `flex` sai e `width: '100%'`, bloco `minHeight: 96` em vez de `height: 114`; título a 17 pt. `accessibilityLabel` continua o título.
- `index.tsx`, de cima para baixo: topo e boas-vindas como hoje **sem** o `Text` "Como está sua saúde hoje?" (apagar o estilo `pergunta`); "O que você quer fazer?" (`styles.secao`) com a grade 2×2 de `BotaoAcao` (`acoesInicio(perfil?.temDiabetes)`, duas linhas `flexDirection: 'row'`, `gap: Spacing.md`) e o `BotaoAcao largo`, cada um com `onPress={() => abrir(a.rota)}`; seção "Para fazer hoje" (antes "Pendências", mesmo contador e mesma lista); "Meus cuidados" com os três `CardModulo largo` da tabela; rodapé e `LinkFontes` como hoje. Remover `FaixaAtalhos` (import, seção "Atalhos") e o card "Minha Saúde". No alerta de `declararNegativa`, "Minha Saúde › Meus medicamentos" vira "Minha Saúde › Meus remédios". Atualizar o comentário da função (`§55, §56, §89` + D-065).
- Apagar `FaixaAtalhos.tsx` e `faixaAtalhos.test.ts` (o teste de rotas passou para `acoesInicio.test.ts`).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/home`
Expected: PASS, incluindo `telaHomeCarregamento`, `telaHomeSaida`, `telaHomeDeclaracao`, `telaHomeAvisos` (pendências, selo, conquistas e comemoração intactos — anti-objetivo §4).

- [ ] **Step 5: Commit**

```bash
git add src/modules/home "app/(app)/(tabs)/index.tsx"
git commit -m "feat(início): cinco ações no topo, Para fazer hoje e Meus cuidados"
```

---

### Task 5: Módulo "Pressão, coração e diabetes" no molde único

**Files:**
- Create: `src/modules/coracao/acoes.ts`
- Modify: `app/(app)/coracao/index.tsx`, `app/(app)/coracao/exames/index.tsx` (vira redirecionamento), `app/(app)/coracao/sinais.tsx`, `app/(app)/coracao/pressao/index.tsx`, `app/(app)/coracao/glicemia/index.tsx`, e o `sectionLabel` "Coração & Metabolismo" → "Pressão, coração e diabetes" em `checkup.tsx`, `linha-do-tempo.tsx`, `risco/index.tsx`
- Test: `src/modules/coracao/__tests__/acoesCoracao.test.ts`, `src/core/cardio/__tests__/telaCardio.test.tsx` (testes a mais), `src/core/cardio/__tests__/telaExamesCoracao.test.tsx`, `src/core/cardio/__tests__/telaTemaAnotar.test.tsx`

**Interfaces:**
- Consumes: `AcaoModulo`, `ListaAcoes` (Tarefa 1); `comVolta` de `@core/navegacao/voltarPara`; `useAbrir`.
- Produces: `export function acoesCoracao(entrada: { mrpa: { id: string; dia: number; diasPrevistos: number } | null; subtituloPrevencao?: string }): AcaoModulo[]` em `src/modules/coracao/acoes.ts`.

Valores de `acoesCoracao`, nesta ordem (spec §6.5):

| chave | ícone | título | subtítulo | rota |
|---|---|---|---|---|
| `pressao` | `pulse-outline` | Minha pressão | anotar e ver como está | `/(app)/coracao/pressao` |
| `mrpa` (sem sessão) | `calendar-outline` | Medir a pressão por 7 dias (MRPA) | quando o médico pedir | `/(app)/coracao/mrpa/iniciar` |
| `mrpa` (com sessão) | `calendar-outline` | Continuar o MRPA — dia X de N | quando o médico pedir | `/(app)/coracao/mrpa/<id>` |
| `glicemia` | `eyedrop-outline` | Minha glicemia | anotar, plano e relatório | `/(app)/coracao/glicemia` |
| `exames` | `flask-outline` | Ver meus exames | todos os exames num lugar só | `/(app)/(tabs)/minha-saude/exames` |
| `risco` | `heart-outline` | Calcular o risco do meu coração | — | `/(app)/coracao/risco` |
| `prevencao` | `checkmark-circle-outline` | Como está minha prevenção? | `subtituloPrevencao` | `/(app)/coracao/checkup` |
| `sinais` | `alert-circle-outline` | Quando procurar o pronto-socorro | — | `/(app)/coracao/sinais` |

X = `Math.min(Math.max(dia, 1), diasPrevistos)` (mesma conta do cartão MRPA de hoje). "Minha linha do tempo" sai da lista (a rota fica).

- [ ] **Step 1: Escrever os testes que falham**

`acoesCoracao.test.ts`:
```ts
it('sem MRPA, as sete ações na ordem da spec', () => {
  expect(acoesCoracao({ mrpa: null }).map((a) => a.titulo)).toEqual(['Minha pressão', 'Medir a pressão por 7 dias (MRPA)', 'Minha glicemia', 'Ver meus exames', 'Calcular o risco do meu coração', 'Como está minha prevenção?', 'Quando procurar o pronto-socorro']);
});
it('com MRPA em andamento, "Continuar o MRPA — dia 3 de 7" abre a sessão', () => {
  expect(acoesCoracao({ mrpa: { id: 's1', dia: 3, diasPrevistos: 7 } })[1]).toMatchObject({ titulo: 'Continuar o MRPA — dia 3 de 7', rota: '/(app)/coracao/mrpa/s1' });
});
it.each([[0, 'dia 1 de 7'], [9, 'dia 7 de 7']])('dia %i fora do intervalo vira "%s"', (dia, txt) => { /* titulo contém txt */ });
it('não tem mais a linha do tempo', () => { /* nenhuma rota '/(app)/coracao/linha-do-tempo' */ });
it.each(/* rotas sem parâmetro */)('%s existe em app/', ...);
```
`telaCardio.test.tsx` — acrescentar (os mocks atuais devolvem tudo vazio):
```tsx
it('cabeçalho "Pressão, coração e diabetes" e começa por "O que você quer fazer?"', ...);
it('sem nenhum número, "Seus últimos números" e "Registre para começar" não aparecem', ...);
```
e um terceiro teste com `ultimoPorTipo` devolvendo HbA1c 6,1 (mock por variável): aparece "Seus últimos números" com o cartão "Glicada (HbA1c)" e não aparece cartão de LDL.
`telaExamesCoracao.test.tsx` (mock de `expo-router` com `Redirect: (p: any) => { mockHref = p.href; return null; }`):
```tsx
it('a tela antiga de exames do coração leva à lista única de Minha Saúde, com volta ao módulo', () => {
  create(<ExamesCoracao />);
  expect(mockHref).toEqual({ pathname: '/(app)/(tabs)/minha-saude/exames', params: { voltarPara: '/coracao' } });
});
```
`telaTemaAnotar.test.tsx` — renderiza `coracao/pressao/index` e `coracao/glicemia/index` com `usePressao`/`useGlicemia` simulados (listas vazias, `resumo7.media` nulo, `convidarMrpa: false`; `diasAtrasISO: () => '2026-01-01'` no mock de `usePressao`):
```tsx
it('Minha pressão: o primeiro botão é "Anotar minha pressão"', () => { /* primeiro nó com props.label === 'Anotar minha pressão' */ });
it('Minha glicemia: o primeiro botão é "Anotar minha glicemia"', ...);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/coracao src/core/cardio/__tests__/telaCardio.test.tsx src/core/cardio/__tests__/telaExamesCoracao.test.tsx src/core/cardio/__tests__/telaTemaAnotar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `acoes.ts` com a tabela acima.
- `coracao/index.tsx`: `InternalHeader sectionLabel="Módulo" title="Pressão, coração e diabetes"`; `ListaAcoes` com `acoesCoracao({ mrpa: s ? { id: s.id, dia: mrpa.dia, diasPrevistos: s.diasPrevistos } : null, subtituloPrevencao: ck ? \`Informações atualizadas: ${ck.atualizados}/${ck.total}\` : 'Verificando…' })` e `onAbrir={abrir}` (`useAbrir`, para "Ver meus exames" levar a volta); depois "Seus últimos números" **só** com os cartões que têm valor — Pressão, Glicemia, "Glicada (HbA1c)", "Colesterol LDL", Risco cardiovascular, Peso — e o título só se houver pelo menos um. O cartão MRPA sai (está na lista). O Peso passa a abrir `/(app)/bem-estar/corpo` (casa única, §6.6). O parágrafo `sub` desce para o fim, antes de `FontesDaTela`.
- `coracao/exames/index.tsx`: o arquivo inteiro vira `export default function ExamesCoracao() { return <Redirect href={comVolta('/(app)/(tabs)/minha-saude/exames', '/coracao') as Href} />; }` com comentário (D-065: uma lista só; a rota fica por causa de links antigos). `exames/[id].tsx` e `exames/registrar.tsx` não mudam.
- `coracao/sinais.tsx`: `sectionLabel="Pressão, coração e diabetes"`, `title="Quando procurar o pronto-socorro"`.
- `pressao/index.tsx`: o bloco `styles.acoes` sobe para logo depois do cabeçalho/erro; o primeiro botão vira `label="Anotar minha pressão"` (primário, largura total); "Iniciar MRPA" fica como contorno logo abaixo. `glicemia/index.tsx`: idem, `label="Anotar minha glicemia"`, com "Meu plano" e "Relatório" na linha de baixo.
- `sectionLabel` novo nos demais arquivos listados em **Files**.

- [ ] **Step 4: Rodar e ver passar**

Run: o comando do Step 2 e depois `npx jest src/core/cardio`
Expected: PASS (o teste antigo de "sem loop de recarga" segue verde).

- [ ] **Step 5: Commit**

```bash
git add src/modules/coracao "app/(app)/coracao" src/core/cardio/__tests__
git commit -m "feat(coração): molde único, Ver meus exames na lista única e Anotar primeiro nas telas de tema"
```

---

### Task 6: "Exames de prevenção" e "Hábitos e bem-estar" no molde único

**Files:**
- Create: `src/modules/bem-estar/acoes.ts`, `src/modules/rastreando/acoes.ts`
- Modify: `app/(app)/bem-estar/index.tsx`, `app/(app)/rastreando/index.tsx`; `sectionLabel` "Saúde & Bem-estar" → "Hábitos e bem-estar" em `bem-estar/{alimentacao,atividade,corpo,sono,agua,checkin,metas}/index.tsx`; botões "Anotar …" em `bem-estar/{corpo,sono,atividade,alimentacao}/index.tsx`; `sectionLabel` "Rastreamentos" → "Exames de prevenção" em `rastreando/{pendencias,lembretes}.tsx` e `rastreando/[programa]/index.tsx`; "Voltar aos Rastreamentos" → "Voltar aos exames de prevenção" em `rastreando/[programa]/registrar.tsx:80`
- Test: `src/modules/bem-estar/__tests__/acoesBemEstar.test.ts`, `src/modules/rastreando/__tests__/acoesPrevencao.test.ts`, `src/core/bemestar/__tests__/telaBemEstar.test.tsx` (testes a mais), `src/modules/rastreando/__tests__/telaRastreando.test.tsx`

**Interfaces:**
- Consumes: `AcaoModulo`, `ListaAcoes` (Tarefa 1); `useAbrir`.
- Produces: `export const ACOES_BEM_ESTAR: AcaoModulo[]`, `export const ACOES_PREVENCAO: AcaoModulo[]`.

`ACOES_BEM_ESTAR`, nesta ordem (o "Relatório de Saúde & Hábitos" sai; vive em "Levar ao médico"):

| chave | ícone | título | subtítulo | rota |
|---|---|---|---|---|
| `corpo` | `body-outline` | Meu peso e medidas | anotar, composição corporal e "Entenda" | `/(app)/bem-estar/corpo` |
| `sono` | `moon-outline` | Meu sono | anotar e ver como está | `/(app)/bem-estar/sono` |
| `atividade` | `walk-outline` | Minhas atividades | anotar e ver como está | `/(app)/bem-estar/atividade` |
| `agua` | `water-outline` | Minha água | anotar e ver como está | `/(app)/bem-estar/agua` |
| `alimentacao` | `restaurant-outline` | Minha alimentação | anotar e ver como está | `/(app)/bem-estar/alimentacao` |
| `metas` | `flag-outline` | Minhas metas | — | `/(app)/bem-estar/metas` |
| `checkin` | `chatbubble-ellipses-outline` | Check-in da semana | — | `/(app)/bem-estar/checkin` |

`ACOES_PREVENCAO`:

| chave | ícone | título | rota |
|---|---|---|---|
| `lembretes` | `notifications-outline` | Ver meus lembretes | `/(app)/rastreando/lembretes` |
| `relatorio` | `document-text-outline` | Levar ao médico (relatório de prevenção) | `/(app)/(tabs)/minha-saude/relatorios/previa?tipo=oncologico&dias=180` |

Botões "Anotar" nas telas de tema (já são o primeiro botão; só o rótulo muda): Meu Corpo "Anotar peso e medidas", Meu Sono "Anotar noite de sono", Minhas Atividades "Anotar atividade", Minha Alimentação "Anotar refeição". Minha Água não muda (a própria tela registra).

- [ ] **Step 1: Escrever os testes que falham**

`acoesBemEstar.test.ts`: títulos na ordem da tabela; nenhum item com `relatorios/previa`; rotas existem (função `existe` sem a query string).
`acoesPrevencao.test.ts`: os dois títulos na ordem; `comVolta(ACOES_PREVENCAO[1].rota, '/rastreando')` devolve `{ pathname: '/(app)/(tabs)/minha-saude/relatorios/previa', params: { tipo: 'oncologico', dias: '180', voltarPara: '/rastreando' } }` (o parâmetro da prévia chega lá).
`telaBemEstar.test.tsx` — acrescentar:
```tsx
it('cabeçalho "Hábitos e bem-estar", "O que você quer fazer?" antes dos números', ...);
it('sem hábitos ainda (habitos: null), "Seus últimos números" não aparece', ...);   // mock atual já devolve null
it('não oferece mais o "Relatório de Saúde & Hábitos"', ...);
```
`telaRastreando.test.tsx` (mock de `@core/rastreando/useRastreando` com `avaliacoes: {}`, `perfil` mínimo, `pendencias: []`, `sintomas: []`; `expo-router` com `useRouter`):
```tsx
it('título "Exames de prevenção" e as duas ações no topo, antes de "Para o seu perfil"', ...);
it('os botões soltos "Ver lembretes" e "Relatório de rastreamento" saíram', ...);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/bem-estar src/modules/rastreando src/core/bemestar/__tests__/telaBemEstar.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `bem-estar/index.tsx`: `InternalHeader sectionLabel="Módulo" title="Hábitos e bem-estar"`; o aviso de check-in pendente fica onde está; `ListaAcoes acoes={ACOES_BEM_ESTAR} onAbrir={abrir}`; "Seus últimos 7 dias" vira "Seus últimos números" e mostra só os cartões com valor (Movimento, Sono, Peso, Cintura, Alimentação), o título só se houver algum; o cabeçalho com `sub` + `NeroAnimado` desce para o fim, antes de `LinkFontes`. Comentário do topo com o nome novo.
- `rastreando/index.tsx`: marca `RASTREAMENTOS` → `EXAMES DE PREVENÇÃO`; título "Exames de prevenção"; `ListaAcoes acoes={ACOES_PREVENCAO} onAbrir={abrir}` logo depois do erro; pendências e "Para o seu perfil" como hoje; o `sub` desce para junto do rodapé; os dois `Button` do fim saem.
- Rótulos e `sectionLabel` dos arquivos listados em **Files**.

- [ ] **Step 4: Rodar e ver passar**

Run: o comando do Step 2, depois `npx jest src/core/bemestar src/modules/rastreando`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/bem-estar src/modules/rastreando "app/(app)/bem-estar" "app/(app)/rastreando" src/core/bemestar/__tests__/telaBemEstar.test.tsx
git commit -m "feat(módulos): Exames de prevenção e Hábitos e bem-estar no molde único"
```

---

### Task 7: Aba Minha Saúde e "Levar ao médico"

**Files:**
- Modify: `app/(app)/(tabs)/minha-saude/index.tsx`, `app/(app)/(tabs)/minha-saude/relatorios/index.tsx`
- Test: `src/modules/minha-saude/__tests__/telaMinhaSaude.test.tsx`, `src/modules/minha-saude/__tests__/telaLevarAoMedico.test.tsx`

**Interfaces:**
- Consumes: `ListItem` (Tarefa 1); `listarSessoes(userId): Promise<SessaoComResultado[]>` de `@core/cardio/sessoesMrpa` (ordenado por `inicio` decrescente; concluída = `concluidaEm != null`); `useAbrir`.
- Produces: nada consumido por outras tarefas.

Minha Saúde, seção única "O que você quer fazer?", nesta ordem (subtítulos dinâmicos de hoje, mantidos): Meus remédios (`medkit-outline`, `/(app)/(tabs)/minha-saude/medicamentos`) · Meus exames · Meus documentos · Levar ao médico · Meus lembretes · Meu perfil · Antecedentes familiares. "Linha do tempo" sai. Segurança, Ajuda (Fontes, Fale com o NERO) e conta ficam como hoje.

"Levar ao médico", títulos dos cartões: `geral` "Resumo completo" (igual) · `cardio` "Pressão, coração e diabetes" · `oncologico` "Exames de prevenção" · `bemestar` "Hábitos e bem-estar". Aviso (só com MRPA concluída): texto "O relatório da MRPA e o da glicemia ficam nas telas deles." e dois links: "Abrir o relatório da MRPA" → `/(app)/coracao/mrpa/relatorio?sessao=<id da concluída mais recente>`; "Abrir o relatório da glicemia" → `/(app)/coracao/glicemia/relatorio`.

- [ ] **Step 1: Escrever os testes que falham**

`telaMinhaSaude.test.tsx` — mocks: `expo-router` (`useRouter`, `useFocusEffect` como em `telaBemEstar.test.tsx`), `expo-web-browser`, `expo-constants` (`{ expoConfig: { version: '1.0.0' } }`), `@core/sessao/bloqueio` (`recursoBiometrico: async () => ({ disponivel: false })`, `bloqueioAtivo: async () => false`), `@core/cardio/examesCardio`, `@core/documentos/repositorio`, `@core/lembretes/central`, `@core/rastreando/contexto` (listas vazias), `@core/lembretes/useConsultas`, `@core/medicacoes/useMedicacoes`, `@core/perfil/usePerfil`, `react-native-safe-area-context`, `@modules/conta/Creditos` (`Creditos: () => null`):
```tsx
it('as ações na ordem da spec, sob "O que você quer fazer?"', () => {
  expect(titulosDeListItem(a)).toEqual(['Meus remédios', 'Meus exames', 'Meus documentos', 'Levar ao médico', 'Meus lembretes', 'Meu perfil', 'Antecedentes familiares', 'Fontes científicas', 'Fale com o NERO']);
});
it('"Linha do tempo" saiu (mora na aba Histórico)', ...);
it('o círculo "Anotar" está na tela', ...);
```
`telaLevarAoMedico.test.tsx` — mocks de `@core/relatorios/compartilharQr` (`limparExpirados`, `listarAtivos: async () => []`, `revogar`), `@core/cardio/sessoesMrpa` (`listarSessoes: async () => mockSessoes`), `expo-router`, sessão:
```tsx
it('cartões com os nomes novos', () => { /* 'Resumo completo', 'Pressão, coração e diabetes', 'Exames de prevenção', 'Hábitos e bem-estar' */ });
it('sem MRPA concluída, não há aviso', ...);
it('com MRPA concluída, o aviso leva ao relatório dela', async () => {
  mockSessoes = [{ id: 'em', concluidaEm: null }, { id: 's9', concluidaEm: '2026-11-01T10:00:00Z' }];
  apertar(a, 'Abrir o relatório da MRPA');
  expect(mockPush).toHaveBeenCalledWith('/(app)/coracao/mrpa/relatorio?sessao=s9');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/minha-saude`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `minha-saude/index.tsx`: trocar as seções "Meus dados", "Meus registros" e "Para o médico" por uma seção "O que você quer fazer?" com os `ListItem` na ordem acima (mesmos subtítulos e rotas de hoje; "Meus medicamentos" vira "Meus remédios"); apagar o item "Linha do tempo".
- `relatorios/index.tsx`: os três títulos novos em `CARTOES`; estado `mrpaConcluida: string | null` carregado no `carregar` existente com `listarSessoes(...).then((l) => l.find((s) => s.concluidaEm)?.id ?? null).catch(() => null)`; o aviso (fundo `Colors.surface`, `Radius.linha`, dois `Pressable` de texto `accessibilityRole="link"`, 17 pt) entre os cartões e "Vou a um médico específico", aberto com `useAbrir`. Atualizar o comentário de `CARTOES` (D-065).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/minha-saude`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/(tabs)/minha-saude/index.tsx" "app/(app)/(tabs)/minha-saude/relatorios/index.tsx" src/modules/minha-saude/__tests__
git commit -m "feat(minha saúde): lista única de ações e Levar ao médico com nomes novos e aviso da MRPA"
```

---

### Task 8: Nomes no resto do app, rotas antigas, D-065 e verificação final

**Files:**
- Modify: `src/core/regras/cardio/checkup.ts:16`, `src/core/regras/cardio/__tests__/checkup.test.ts:32`, `src/core/referencias/catalogo.ts:86,88`, `docs/nero/02-DECISOES.md`
- Test: `src/core/navegacao/__tests__/nomesNovos.test.ts`, `src/core/navegacao/__tests__/rotasAntigas.test.ts`

**Interfaces:**
- Consumes: tudo das tarefas anteriores.
- Produces: nada.

- [ ] **Step 1: Escrever os testes que falham**

`nomesNovos.test.ts` — lê recursivamente `app/**/*.tsx` e os arquivos `src/core/regras/cardio/checkup.ts`, `src/core/referencias/catalogo.ts` com `fs`:
```ts
it.each(['Coração & Metabolismo', 'Saúde & Bem-estar', 'Relatório de Saúde & Hábitos', 'sectionLabel="Rastreamentos"'])('"%s" não aparece mais nas telas', (antigo) => {
  expect(arquivosCom(antigo)).toEqual([]);
});
it('o módulo do coração não diz mais "Sinais de alerta"', () => {
  expect(arquivosCom('Sinais de alerta', 'app/(app)/coracao')).toEqual([]);
});
```
(`arquivosCom(trecho: string, pasta = 'app')`. "Sinais de alerta" continua em `rastreando/[programa]/index.tsx` e `[programa]/sinais.tsx`, que falam de sinais de câncer — por isso a segunda verificação olha só `app/(app)/coracao`.)
`rotasAntigas.test.ts` — mesma função `existe` de `itensAnotar.test.ts`:
```ts
it.each(['/(app)/coracao', '/(app)/coracao/exames', '/(app)/coracao/linha-do-tempo', '/(app)/coracao/sinais', '/(app)/rastreando', '/(app)/rastreando/pendencias', '/(app)/rastreando/lembretes', '/(app)/bem-estar', '/(app)/bem-estar/checkin', '/(app)/(tabs)/historico', '/(app)/(tabs)/minha-saude/relatorios', '/(app)/(tabs)/minha-saude/medicamentos', '/(app)/(tabs)/agenda/consultas'])('%s continua existindo', (r) => expect(existe(r)).toBe(true));
it('toda rota fixa citada por montarItensHoje existe', () => { /* rotas literais extraídas do fonte por regex /'(\/\(app\)[^'`$?]*)'/g, sem as com ${…} */ });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/navegacao`
Expected: FAIL em `nomesNovos` (checkup.ts e catalogo.ts ainda têm os nomes antigos).

- [ ] **Step 3: Implementar**

- `checkup.ts`: frase → `'Falta registrar sua atividade física em Hábitos e bem-estar.'`; o `toBe` de `checkup.test.ts:32` acompanha.
- `catalogo.ts` (`GRUPOS_FONTES`): `'Coração & Metabolismo'` → `'Pressão, coração e diabetes'`; `'Saúde & Bem-estar'` → `'Hábitos e bem-estar'`; `'Rastreamento de câncer'` fica (descreve o conteúdo, não é nome de módulo). Os comentários `// Coração & Metabolismo` (linha 20) e `// Saúde & Bem-estar` (linha 45) acompanham, senão a varredura acusa.
- `docs/nero/02-DECISOES.md`: nova entrada `### D-065 — Reorganização da navegação: ações no topo, ＋ Anotar e molde único — 23/11/2026` logo depois da D-064 (antes de `## Decisões clínicas`), com: o porquê (§1 da spec, em duas linhas), A+B escolhidas pelo Murilo, a tabela de nomes novos, onde mora cada coisa (§6.6), `coracao/exames` → redirecionamento para Minha Saúde › Meus exames, linha do tempo só no Histórico, folha Anotar como `presentation: 'modal'` com a regra `abrirDaFolha`, fontes da spec e do plano. Apontar que D-053 (faixa de atalhos) foi substituída.

- [ ] **Step 4: Verificação completa**

Run: `npx jest`
Expected: PASS, todos (627 − 2 de `faixaAtalhos` + os novos).
Run: `npx tsc --noEmit`
Expected: sem erros.
Run: `grep -rn "FaixaAtalhos\|ATALHOS" app src`
Expected: nada.

- [ ] **Step 5: Conferência no simulador (regra dos 2 toques, §2.1)** — do Início, cada item de `ITENS_ANOTAR` e de cada lista "O que você quer fazer?" abre em ≤ 2 toques (aba ou ＋ conta como 1); ligar letra grande (Ajustes › Acessibilidade › Tamanho do texto) e conferir que os botões quebram linha e o ＋ não cobre o último item nas 4 abas.

- [ ] **Step 6: Commit**

```bash
git add src/core/regras/cardio src/core/referencias/catalogo.ts src/core/navegacao/__tests__ docs/nero/02-DECISOES.md
git commit -m "docs(D-065): reorganização da navegação; nomes novos no resto do app e guarda das rotas antigas"
```
