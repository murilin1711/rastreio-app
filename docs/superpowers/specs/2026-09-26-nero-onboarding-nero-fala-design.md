# Onboarding novo: o Nero fala — design

**Data:** 26/09/2026 · **Decisão:** D-063 (a registrar em `docs/nero/02-DECISOES.md` quando implementado)
**Substitui:** o onboarding de três slides da D-033 (`app/(auth)/onboarding.tsx` + `src/modules/onboarding/Miniaturas.tsx`)
**Aprovado pelo Murilo:** roteiro, fala, animações, integrações e estrutura, parte por parte, em 26/09/2026.

## 1. Objetivo

Um onboarding mais interativo e mais bonito, com o **Nero falando** com a pessoa (referência: Gentler Streak / "Yorhart", Mobbin), as falas aparecendo palavra por palavra e telas animadas que mostram o que o app faz. Ele pergunta o nome da pessoa e, antes do aviso do sistema, se pode mandar notificações.

**Público:** 60+. Frases curtas, letra grande, um botão claro por tela, nada avança sozinho.

**Sucesso:** a pessoa termina sabendo três coisas que o NERO faz por ela, chega ao "Criar conta" com o nome já preenchido, e a pergunta dos avisos aparece com contexto, sem gastar a única chance do iOS.

**Fora do escopo:** mudar o fluxo depois do cadastro (aceite, perfil inicial, Home), ilustração encomendada (Lottie) ou vídeo das funções, exames de prevenção (o Murilo os deixou de fora), Android com layout próprio.

## 2. Decisões do Murilo (26/09)

| Tema | Decisão |
|---|---|
| Nome | O Nero pergunta; o cadastro já vem preenchido. |
| Avisos | O Nero pergunta antes do sistema: "Sim, pode me avisar" abre o aviso do iOS; "Agora não" não gasta a chance, e a pergunta volta ao ligar um lembrete (D-043). |
| Funções mostradas | Pressão e glicemia · Relatório para o médico · Lembretes de remédio. |
| Animações | **Caminho A:** feitas no próprio app, com peças da interface animadas em código e os clipes do Nero que já existem. Sem arte nova nem vídeo. |
| Ordem | 1 Oi · 2 Nome · 3 Prazer · 4 Pressão e glicemia · 5 Relatório · 6 Lembretes e avisos · 7 Final. (Ele testou pôr o relatório antes e voltou para esta ordem.) |
| Fala do relatório | A versão dele: "Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico." |

## 3. Roteiro

Em todas as telas: a fala em cima, o Nero embaixo, um botão grande que aparece quando a fala termina. No topo, **pontinhos de progresso** e **"Pular"** (vai ao cadastro). Voltar pela seta no topo e arrastando para a direita.

| # | Nero (clipe) | Linha pequena (cinza) | Fala principal | Ação |
|---|---|---|---|---|
| 1 | acenar | "Oi, eu sou o Nero!" | "Vou te ajudar a organizar a sua saúde." | **Oi, Nero!** |
| 2 | pensando | — | "E você, como se chama?" | Campo de nome (teclado aberto) · **Continuar** · link "Prefiro não dizer" |
| 3 | acenar | — | "Prazer, {nome}! Vou te mostrar o que eu faço por você." / sem nome: "Prazer! Vou te mostrar…" | **Vamos lá** |
| 4 | repouso, pequeno | — | "Anote sua pressão e sua glicemia. Eu organizo tudo pra você." | Demo pressão · **Próximo** |
| 5 | repouso, pequeno | — | "Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico." | Demo relatório · **Próximo** |
| 6 | repouso, pequeno | — | "Eu te lembro do remédio na hora certa." → depois da demo: "Posso te avisar?" | Demo lembrete · **Sim, pode me avisar** · **Agora não** |
| 7 | comemorar | — | "Pronto, {nome}! Agora é só criar sua conta." / sem nome: "Pronto! Agora…" | **Criar minha conta** · link "Já tenho conta" |

"Continuar" na tela 2 exige ao menos 2 letras. O botão "Continuar" do teclado também avança.

## 4. Como o Nero fala (`FalaNero`)

- Palavras aparecem uma a uma, de cinza-claro para a cor final. Ritmo de ~2 s por frase (intervalo por palavra calculado a partir do número de palavras, com mínimo e máximo por palavra).
- Linha pequena: `Typography.subheading`, `Colors.textMuted`. Fala principal: `Typography.title` ou maior, `Colors.primary`.
- **Tocar em qualquer ponto da tela** durante a fala mostra a frase inteira na hora.
- O botão da tela entra (deslizar de baixo + opacidade) quando a fala termina (`onTerminou`).
- **Reduzir movimento** (`AccessibilityInfo.isReduceMotionEnabled`): a frase aparece inteira de imediato, e `onTerminou` é chamado já.
- **Leitor de tela:** o bloco da fala tem `accessibilityLabel` com a frase inteira e é anunciado ao abrir a tela; não depende da animação.
- A letra respeita o tamanho de fonte do sistema (sem `allowFontScaling={false}`).

## 5. Cena (`CenaNero`)

- Fundo: degradê vertical claro (`expo-linear-gradient`) de um azul-céu muito suave no topo para `Colors.background`, e um "chão" discreto (elipse clara) sob o Nero. Só formas e cores do app.
- O Nero usa `NeroAnimado` com o clipe da tela. Tamanho grande nas telas 1, 2, 3 e 7; **pequeno e no canto inferior** nas telas de função (4–6), para a demonstração ocupar o centro.

## 6. As três demonstrações

Todas: ~3 s, rodam uma vez ao entrar na tela e param no quadro final; tocar na área **roda de novo**; com Reduzir movimento, vão direto ao quadro final. Dados de exemplo, **sem valor fora do normal nem cor de alerta** (o Nero não comemora nem alarma resultado clínico, nem em demonstração).

**`DemoPressao`:** cartão no estilo do app desliza de baixo: "Pressão de hoje · 128 por 78" com etiqueta "no alvo" (verde); abaixo, gráfico de 7 dias (`react-native-svg`) cuja linha se desenha da esquerda para a direita e cujos pontos surgem um a um; no fim, "Média da semana: 126 por 80".

**`DemoRelatorio`:** três folhas pequenas entram de lados diferentes (ícones: coração, frasco, comprimido), se empilham e viram um documento com o título "Relatório para o médico"; o código QR (desenho estático em SVG, sem gerar QR de verdade) aparece ao lado com "Mostre ao médico".

**`DemoLembrete`:** um iPhone estilizado com a tela bloqueada às 08:00; a notificação desce do topo com o texto real da D-044: "Hora de tomar seu remédio 💊" / "Losartana 50 mg". Ao terminar, a tela 6 mostra a pergunta dos avisos.

## 7. Dados e integrações

**Nome** (`src/core/onboarding/nomeGuardado.ts`): `guardarNome`, `lerNome`, `apagarNome` em AsyncStorage (chave própria), todos em `try/catch`, sem travar se o armazenamento falhar. "Prefiro não dizer" apaga qualquer nome guardado.
- `app/(auth)/cadastro.tsx`: lê o nome e preenche o campo Nome (editável).
- `app/perfil-inicial.tsx`: quando o perfil está sem nome (login Apple/Google sem nome, D-061), o campo "Seu nome" vem preenchido com o nome guardado.
- Depois de criar a conta (cadastro por e-mail concluído, ou perfil inicial salvo), `apagarNome`.

**Avisos** (tela 6), reaproveitando o que existe:
- "Sim, pode me avisar": `pedirPermissaoNotificacoes()` (`src/core/lembretes/permissao.ts`). Concedida ou negada, segue para a tela 7. Se negada, vale o fluxo existente da D-043 (modal "Seus avisos estão desligados" ao ligar um lembrete).
- "Agora não": não chama o sistema; chama `marcarAdiado()` (`src/core/lembretes/useAvisos.ts`), que já cala a pergunta da Home por 14 dias. Segue para a tela 7.
- Se o iOS já tiver resposta (`estadoPermissao()` diferente de `'perguntar'`), a pergunta não aparece: a tela 6 mostra só a demonstração e **Próximo**.

**Saídas:** "Criar minha conta" e "Pular" → `/(auth)/cadastro`; "Já tenho conta" → `/(auth)/login`. Em todas, grava `ONBOARDING_KEY` como hoje (`src/core/onboarding/chave.ts`), então o onboarding não volta; quem sai da conta cai no login (`app/index.tsx`, sem mudança).

## 8. Estrutura

| Arquivo | Papel |
|---|---|
| `src/core/onboarding/roteiro.ts` | As 7 telas como dados (clipe, linha pequena, fala, ações) e `falaComNome(texto, nome)`. Puro. |
| `src/core/onboarding/nomeGuardado.ts` | Guardar, ler e apagar o nome. |
| `src/modules/onboarding/FalaNero.tsx` | Fala palavra por palavra, tocar para adiantar, acessibilidade. |
| `src/modules/onboarding/CenaNero.tsx` | Céu, chão e Nero (grande/pequeno). |
| `src/modules/onboarding/demos/DemoPressao.tsx`, `DemoRelatorio.tsx`, `DemoLembrete.tsx` | As três demonstrações. |
| `app/(auth)/onboarding.tsx` | Conduz: passo atual, pontinhos, "Pular", voltar, saídas. |
| `src/modules/onboarding/Miniaturas.tsx` | **Sai** (só o onboarding antigo usa). |

Animações com `react-native-reanimated` (já instalado). **Nenhuma biblioteca nova com parte nativa**: `expo-linear-gradient`, `react-native-svg` e `react-native-gesture-handler` já estão no projeto. O onboarding em si poderia, portanto, ir pela atualização pelo ar; mas o lote atual já precisa do build 4 (IDs do Google, D-061), então segue junto dele.

## 9. Testes

- `roteiro`: `falaComNome` com e sem nome; as 7 telas na ordem aprovada.
- `nomeGuardado`: guardar/ler/apagar; falha do AsyncStorage não lança.
- `FalaNero`: tocar mostra a frase inteira e chama `onTerminou`; com Reduzir movimento, frase inteira e `onTerminou` imediatos; `accessibilityLabel` com a frase inteira.
- Tela do onboarding: avança pelas 7 telas; nome digitado é guardado e o cadastro o lê; "Prefiro não dizer" não guarda; "Pular" vai ao cadastro e grava `ONBOARDING_KEY`; "Agora não" não chama `pedirPermissaoNotificacoes` e chama `marcarAdiado`; "Sim" chama `pedirPermissaoNotificacoes`; com permissão já decidida, a pergunta não aparece.
- **Simulador:** percorrer as 7 telas e fotografar cada uma; conferir o tocar para adiantar e o "Reduzir movimento". Os toques usam o mouse do Mac: só quando o Murilo liberar o computador.

## 10. Riscos e cuidados

- **Ritmo para 60+:** 2 s por frase é o ponto de partida; se no aparelho parecer lento ou rápido, ajusta-se um número no `FalaNero`.
- **Teclado na tela 2:** o campo e o botão precisam ficar acima do teclado (`KeyboardAvoidingView`), e o Nero pode encolher enquanto o teclado está aberto.
- **Telas pequenas (iPhone SE):** a demonstração e o Nero pequeno não podem se sobrepor à fala; conferir no simulador de tela menor.
- **Textos novos de interface** entram no `02-DECISOES.md` (D-063) com o roteiro final, como os textos de notificação entram no `notificacoes.md`.
