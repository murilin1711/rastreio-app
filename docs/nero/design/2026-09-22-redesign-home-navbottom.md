# Redesign da Home e do navbottom — 22/09/2026

> Sessão de brainstorming com o Murilo, com mockups no companion visual
> (`.superpowers/brainstorm/14723-1790111228/content/`).
> Gatilho: *"não gostei do dashboard principal da página home; do navbottom também não gostei"*.
> Referências enviadas pelo Murilo: ver **Referências de design** no fim deste arquivo.

## O que estava errado (diagnóstico no código)

| Onde | Problema |
|---|---|
| `app/(app)/_layout.tsx` | `Tabs` JS: faixa branca opaca colada no rodapé, borda de 1px, ícone ativo em `-outline` (no iOS o ativo é sempre a variante *fill*). Não é a camada flutuante que a HIG descreve. |
| `app/(app)/_layout.tsx` | 4 abas para 5 áreas — Bem-estar só existia como card na home. |
| `app/(app)/index.tsx` | Tudo é retângulo branco com borda de 1px sobre `#F5F7FB`: pendência e módulo com o mesmo contraste. Sem hierarquia por profundidade. |
| `src/modules/home/CardModulo.tsx` | Capa-gradiente de 92px para um ícone decorativo, e o dado real espremido numa `caption` de 13px cortada em 2 linhas. Falha de deferência: a decoração ganhava do conteúdo. |
| `minha-saude/lembretes`, `minha-saude/linha-do-tempo` | Duas telas **já cross-módulo** enterradas a 3 toques dentro de Minha Saúde. |
| `app.json` | `backgroundColor` do splash e do adaptive icon ainda em `#F3F0EA` — o bege abandonado na revisão de 15/09. |

## Decisões fechadas

### 1 · Tab bar nativa
`expo-router/unstable-native-tabs` (disponível no expo-router 57.0.22; vira
`expo-router/native-tabs` no SDK 58). Entrega de graça, sem desenhar um pixel:
Liquid Glass no iOS 26, ícone ativo em `.fill`, adaptação claro/escuro pelo conteúdo,
minimizar ao rolar, scroll edge effect, e os modos de acessibilidade do sistema
(Reduce Transparency, Increase Contrast, Reduce Motion).

Ícones por plataforma: `sf` (SF Symbols, só Apple — a licença não permite fora das
plataformas Apple) e `md` (Material Symbols, Android). O NativeTabs faz o par sozinho.

**Descartado:** botão central elevado (FAB). É linguagem do Material, não existe na HIG,
e quebraria a continuidade do vidro. O Murilo perguntou; explicado e retirado.

### 2 · Quatro abas, todas de telas que já existem

| Aba | Rota | Estado |
|---|---|---|
| Início | `(app)/index` | existe |
| Agenda | central de lembretes, hoje em `minha-saude/lembretes` | **já é cross-módulo** (§63, D-010): próximos 30 dias de todos os módulos agrupados por dia |
| Histórico | linha do tempo geral, hoje em `minha-saude/linha-do-tempo` | **já é cross-módulo** (§60): `montarLinhaDoTempoGeral`, todos os módulos por ano |
| Minha Saúde | `(app)/minha-saude` | existe |

**Raciocínio:** com a grade 2×2 permanecendo na home, repetir os módulos na barra não
acrescentaria destino nenhum. As abas passam a ser os **eixos transversais** — e o código
já apontava quais são: `linha-do-tempo` estava duplicado em `coracao/` e `minha-saude/`,
`lembretes` em `rastreando/` e `minha-saude/`. O que aparece dentro de dois módulos não
pertence a nenhum: pertence ao nível de cima.

**Descartado:** aba "Registrar" (agregaria pressão, glicemia, exame, água, peso, sono num
lugar só). Era a única das cinco que não existe; o Murilo pediu para ficar só no que existe.
Vale reconsiderar depois.

### 3 · Estrutura de rotas: as abas vão para um grupo

`hidden` **não serve** para tirar Rastreando/Coração/Bem-estar da barra —
`node_modules/expo-router/build/native-tabs/types.d.ts:473`:
*"Marking a tab as `hidden` means it cannot be navigated to in any way."*
Escondido = inalcançável, e eles precisam ser alcançáveis pela grade da home.

Solução: mover **as abas** para `app/(app)/(tabs)/`, não os módulos para fora.
Grupos entre parênteses são invisíveis na URL, então `/(app)/minha-saude/perfil`
continua resolvendo. Os ~49 arquivos que citam Rastreando, Coração e Bem-estar
ficam intocados; só mudam os 5 que citam lembretes e linha-do-tempo.

```
app/(app)/_layout.tsx          Stack
app/(app)/(tabs)/_layout.tsx   NativeTabs
app/(app)/(tabs)/index.tsx     Início
app/(app)/(tabs)/agenda/       ← minha-saude/lembretes/
app/(app)/(tabs)/historico.tsx ← minha-saude/linha-do-tempo.tsx
app/(app)/(tabs)/minha-saude/
app/(app)/rastreando/          (fora das abas, alcançável pela grade)
app/(app)/coracao/
app/(app)/bem-estar/
```

### 4 · Grade 2×2 continua na home, em blocos de cor cheia

O card **é** a cor: gradiente do módulo ocupando o bloco inteiro, símbolo discreto no
canto superior esquerdo, nome em branco embaixo. **Sem número, sem status, sem descrição.**

> *"Eu não quero colocar nenhuma informação nos módulos. Quero deixar algo bem bonito,
> só uma imagem ou só uma cor mesmo e o nome do módulo, senão fica muita informação."*

Isso **anula** a proposta intermediária de "card de dado vivo" (que mostrava `128/82`,
`120/150 min`). Coerente com o princípio nº 1 do `03-DESIGN.md`: a ousadia fica num só
lugar. Se as pendências já dizem o que fazer, o módulo não repete número nenhum —
ele é o mapa, não o painel.

Efeito colateral bom: sem a informação, a grade inteira passa a caber na primeira tela.

Cores de capa (mantidas de 15/09): Rastreando aço→ciano · Coração tijolo→coral ·
Bem-estar verde→verde-claro · Minha Saúde marinho→aço.

### 5 · A logo do NERO fica na home

Decisão do Murilo, contra a recomendação da HIG (que desaconselha marca em tela interna):
reconhecimento de marca num app novo pesa mais. Lockup horizontal — símbolo + palavra
"Nero" — à esquerda da barra superior, com o avatar à direita, na mesma linha.

### 6 · O avatar é item da barra, não conteúdo solto

Estava largado no meio do conteúdo, e era por isso que parecia deslocado. Vai para a
barra superior, alinhado com a logo — o lugar que a HIG reserva para ele.

### 7 · Cor e tipografia: fechadas, não mexer

> *"Cores e tipografia está perfeito, apenas posições e tamanhos dos elementos na parte
> de cima não estão encaixando."*

Paleta e escala de `src/ui/theme.ts` mantidas integralmente.

## O topo da home — DECIDIDO: eixo central (22/09/2026)

O Murilo calibrou duas composições no painel interativo (`calibrar-v2.html`) e escolheu a
**centralizada**: Nero de corpo inteiro no eixo, saudação e pergunta centralizadas abaixo,
selo de sequência centralizado. Implementado com `NeroAnimado size={84}` e
`translateY: -6` (sobe o mascote sem abrir espaço no layout), espaço 10 antes e 24 depois.

**Verificação de centralização, antes de implementar:** o PNG do mascote está centrado
(desvio de −1px em 718) e os três clipes animados também (cabeça a no máximo 3px do centro
do quadro, o que a 84pt vira menos de 1px na tela). O desalinhamento era do layout, não da arte.

A finalista descartada fica registrada caso se queira voltar atrás. Todos os outros elementos do topo são iguais nas duas: logo à
esquerda, avatar à direita, saudação de 28px em uma linha, com a pergunta
"Como está sua saúde hoje?" e o selo de sequência; espaço 10px antes, 24px depois.

| | Finalista A (descartada) | **Finalista B (escolhida)** |
|---|---|---|
| Arranjo | texto à esquerda, Nero à direita | tudo no eixo central |
| Recorte | corpo inteiro | corpo inteiro |
| Tamanho | 64px | 84px |
| Deslocamento | `dy -34` · `dx -59` | `dy -6` · `dx 0` |

### O que aprendemos sobre o mascote (vale para qualquer tela)

A arte (`assets/images/nero/mascote-nero.png`, 718×1192) é **frontal e simétrica**, com a
cabeça ocupando metade da altura — o pescoço está em y≈640, onde a silhueta afina.
Consequências:

- Ele **não** funciona apoiado de lado em bordas e faixas. Seis tentativas nesse sentido
  foram rejeitadas. Ele te encara de frente; é um recepcionista, não um personagem de perfil.
- Em **corpo inteiro e pequeno** (≤ 44px) vira uma mancha azul ilegível.
  A **cabeça sozinha** lê perfeitamente a partir de 52px, e cabe num círculo.
- Recortes úteis, gerados nesta sessão: cabeça (quadrado, y 0–660), busto (y 0–980).

## Pendente, fora desta rodada

- **Ícone do app.** `assets/images/icon.png` é camada única. O iOS 26 espera ícone em
  camadas (default/dark/mono + Liquid Glass), feito no **Icon Composer** (requer macOS
  Tahoe 26.4+). Falta verificar o suporte do Expo ao formato `.icon`.
- **`app.json`:** `backgroundColor` do splash e do adaptive icon ainda em `#F3F0EA`,
  inconsistente com a paleta desde 15/09.
- **Aba "Registrar"** — reconsiderar quando a tela existir.

---

## Implementado em 22/09/2026

| Mudança | Arquivos |
|---|---|
| Bloco de cor cheia, só cor e nome | `src/modules/home/CardModulo.tsx` (prop `descricao` removida) |
| Home sem os subtítulos dos módulos | `app/(app)/(tabs)/index.tsx` |
| Abas nativas, 4 triggers | `app/(app)/(tabs)/_layout.tsx` (novo) |
| `(app)` vira Stack | `app/(app)/_layout.tsx` |
| Agenda = central de lembretes | `minha-saude/lembretes/` → `(tabs)/agenda/` + `_layout.tsx` novo |
| Histórico = linha do tempo geral | `minha-saude/linha-do-tempo.tsx` → `(tabs)/historico.tsx` |
| Cabeçalho sem "voltar" em raiz de aba | `src/ui/components/InternalHeader.tsx` (`variante="raiz"`) |
| Caminhos com o novo grupo | 20 arquivos em `app/` e `src/` |

**Convenção de rotas:** mantida a forma explícita com grupos, agora
`/(app)/(tabs)/minha-saude/…`. A forma sem grupo (`/minha-saude/…`) também é válida e
seria imune a mudanças de grupo — fica como possível limpeza futura.

**Verificação:** `tsc --noEmit` limpo · `jest` 448 testes / 59 suítes passando ·
bundle iOS monta (HTTP 200, `NativeTabs` presente). **Não testado em aparelho** —
o Liquid Glass só aparece de fato no iOS 26.

**Minha Saúde continua listando** "Linha do tempo" e "Meus lembretes", agora apontando
para as abas. Duplicação deliberada: a barra é o atalho de quem já sabe onde vai, a lista
é o mapa de quem procura.


---

## Referências de design (enviadas pelo Murilo em 22/09/2026)

Cinco links da Apple. Acesso em 22/09/2026. O que cada um efetivamente mudou no redesign:

| Documento | URL | O que saiu daqui |
|---|---|---|
| Human Interface Guidelines — Designing for iOS | https://developer.apple.com/design/human-interface-guidelines/designing-for-ios | Os três princípios (clareza, **deferência**, profundidade). A deferência é o que condenou a capa-gradiente de 92px do `CardModulo`: decoração ganhando do conteúdo. A profundidade é o que faltava na home, onde tudo era retângulo branco com o mesmo contraste. |
| WWDC25 — Meet Liquid Glass (sessão 219) | https://developer.apple.com/videos/play/wwdc2025/219/ | A tab bar como **camada funcional flutuando sobre o conteúdo**, não faixa colada no rodapé. Também as regras que evitamos violar: nada de "glass on glass", não tingir tudo, não misturar as variantes Regular e Clear. E o fato de os modos de acessibilidade (Reduce Transparency, Increase Contrast, Reduce Motion) serem aplicados pelo sistema — argumento decisivo a favor das abas nativas. |
| SF Symbols | https://developer.apple.com/sf-symbols/ | Mais de 7.000 símbolos, 9 pesos, alinhados à San Francisco. Usados via prop `sf` no `NativeTabs`. **Restrição:** a biblioteca é feita para plataformas Apple — por isso o par `md` (Material Symbols) no Android, que o `NativeTabs` resolve sozinho. |
| Icon Composer | https://developer.apple.com/icon-composer/ | Ícone de app **em camadas** com Liquid Glass (realces especulares, refração, translucidez), anotado para os modos default / dark / mono num arquivo só, com sincronização para o Xcode. Requer macOS Tahoe 26.4+. Base da pendência do ícone — hoje `assets/images/icon.png` é camada única. |
| Apple Design Resources | https://developer.apple.com/design/resources/ | Enviado pelo Murilo; **não consultado nesta sessão** — nada aqui saiu dele. Fica para quando formos fazer o ícone e precisarmos dos templates e da grade oficial. |

**Onde as HIG foram deliberadamente contrariadas:** a logo do NERO fica na home. A HIG desaconselha marca em tela interna (a pessoa já sabe em que app está), mas o Murilo decidiu manter por reconhecimento de marca num app novo. Decisão de produto, consciente — ver item 5.
