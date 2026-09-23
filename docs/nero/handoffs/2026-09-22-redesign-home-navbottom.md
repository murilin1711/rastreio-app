# Handoff: NERO — redesign da home e do navbottom (abas nativas, D-022)

**Data:** 22/09/2026
**Status:** em andamento — **tudo verificado no servidor; nada testado no aparelho**. Bloqueio único: o vídeo do Nero pensando.

> Nova sessão: ler este arquivo, depois `docs/nero/design/2026-09-22-redesign-home-navbottom.md` (o raciocínio completo do redesign) e **D-022** em `02-DECISOES.md`. O handoff anterior, `2026-09-22-publicacao-auth-e-agua.md`, continua valendo para o trilho das lojas — este aqui não toca nele.

## 1. Objetivo

O Murilo não gostou do dashboard da home nem do navbottom, e mandou cinco links de design da Apple (HIG "Designing for iOS", WWDC25 "Meet Liquid Glass", SF Symbols, Icon Composer, Design Resources) pedindo inspiração. Ele foi explícito sobre o que **não** queria mexer: as telas de entrada de dados e o toggler de lembretes, que ele gosta.

## 2. Contexto essencial

- Branch `desenvolvimento-2`, repo `murilin1711/rastreio-app`. Commit deste trabalho: **`4cec281`**. `tsc` limpo, **448 Jest em 59 suítes**, bundle iOS monta (HTTP 200).
- **Cor e tipografia estão fechadas e não devem ser mexidas.** O Murilo: *"Cores e tipografia está perfeito, apenas posições e tamanhos dos elementos na parte de cima não estão encaixando."* Paleta e escala de `src/ui/theme.ts` seguem intactas.
- **A logo do NERO fica na home**, por decisão dele, contra a recomendação da HIG (que desaconselha marca em tela interna). Argumento aceito: reconhecimento de marca num app novo pesa mais. Não reabrir.
- **Sobre o mascote (vale para qualquer tela):** a arte é **frontal e simétrica**, cabeça ocupando metade da altura, pescoço em y≈640. Ele **não** funciona apoiado de lado em bordas ou faixas — seis tentativas nesse sentido foram rejeitadas pelo Murilo. Em corpo inteiro e pequeno (≤44px) vira mancha azul; a cabeça sozinha lê bem a partir de 52px.
- **Método que funcionou depois de seis rejeições:** parar de mandar conceitos prontos e montar um **painel de calibração** (mockup 1:1 com sliders de tamanho, posição e espaçamento). Ele mexeu e devolveu os números. Se o assunto voltar a ser composição, repetir isso em vez de gerar variações.
- Metro em CI não recarrega ao salvar: depois de editar, `npm run rotas` e o Murilo fecha/reabre o app. **Rota nova exige `npm run rotas` antes de o `tsc` passar.**

## 3. O que já foi feito

**Navbottom — abas nativas**
1. `Tabs` JS → `expo-router/unstable-native-tabs` (existe no expo-router 57.0.22; vira `expo-router/native-tabs` no SDK 58). Liquid Glass, ícone ativo em `.fill`, adaptação clara/escura, minimizar ao rolar e os modos de acessibilidade vêm do sistema — nada disso foi desenhado à mão.
2. Quatro abas: **Início · Agenda · Histórico · Minha Saúde**, todas de telas que já existiam. Agenda = `minha-saude/lembretes` (central de todos os módulos, §63/D-010); Histórico = `minha-saude/linha-do-tempo` (`montarLinhaDoTempoGeral`, §60). As duas já eram cross-módulo e estavam a três toques de distância.
3. **Achado que definiu a estrutura:** `native-tabs/types.d.ts:473` — *"Marking a tab as `hidden` means it cannot be navigated to in any way."* Esconder não basta: bloqueia. Por isso **as abas** foram para o grupo `app/(app)/(tabs)/`, em vez de tirar os módulos de lá. Grupo é invisível na URL, então mudaram 20 arquivos em vez dos ~49 do caminho oposto.
4. `InternalHeader` ganhou `variante="raiz"` — raiz de aba não tem para onde voltar.

**Home**
5. `CardModulo` virou **bloco de cor cheia**: gradiente ocupando tudo, símbolo no canto, nome embaixo. A prop `descricao` **deixou de existir**.
6. Abertura centralizada no eixo: `NeroAnimado size={84}` com `translateY: -6`, saudação e pergunta centralizadas, selo de sequência centralizado. Espaço 10 antes, 24 depois — números calibrados pelo Murilo no painel.

**Descartado no caminho (não retomar sem motivo novo)**
- **Botão central elevado (FAB):** é linguagem do Material, não existe na HIG do iOS, e quebraria a continuidade do vidro. O Murilo perguntou; explicado e retirado.
- **Aba "Registrar"** (agregaria pressão, glicemia, exame, água, peso, sono): era a única das cinco que não existe. Ele pediu para ficar só no que existe. **Vale reconsiderar quando a tela existir.**
- **Card de módulo com "dado vivo"** (mostrando `128/82`, `120/150 min`): chegou a ser aprovado e depois foi anulado por ele — *"não quero colocar nenhuma informação nos módulos... senão fica muita informação."*
- **Cinco abas** (com Bem-estar, ou com Documentos, ou com Relatórios): ele escolheu quatro, com rótulos inteiros.
- **Seis composições de topo** com o Nero apoiado em faixa, borda, círculo e barra: todas rejeitadas. A centralizada foi a que passou.

## 4. Estado atual

Funciona e está verificado no servidor: `tsc --noEmit` limpo, 448 testes passando, bundle iOS com `NativeTabs` presente. **Nada foi aberto no aparelho** — e o Liquid Glass só aparece de fato no iOS 26, então essa é a primeira coisa a confirmar.

Ponto que sobrou de propósito: **Minha Saúde ainda lista "Linha do tempo" e "Meus lembretes"**, agora apontando para as abas novas. Duplicação deliberada (a barra é o atalho de quem sabe onde vai; a lista é o mapa de quem procura), mas é uma linha para remover cada, se incomodar.

## 5. Próximos passos

1. **Abrir no aparelho** e conferir: a barra flutuante com vidro, o ícone ativo preenchido, a barra minimizando ao rolar, e o topo centralizado da home.
2. **Quando o Murilo mandar `pensando.mp4`:** medir o enquadramento **antes** de processar (`Y0`, `Y1`, `CX`), porque cada geração sai com escala e posição próprias — foi o que aconteceu no `comemorar`. Depois:
   `FECHAMENTO=5 python3 scripts/processar-clipe-nero.py <frames> assets/animacoes/nero/pensando.webp <ini> <fim> 1`
   (`FUNDO=linha` só se o fundo não sair chapado; com o fundo cinza pedido no prompt, `pixel` deve bastar).
3. Acrescentar `pensando` a `CLIPES` em `src/ui/components/NeroAnimado.tsx` e ligar nos três pontos previstos: gerando PDF, calculando risco, enviando documento.
4. **Antes de aplicar, conferir a largura do clipe.** `PROPORCAO_MAX` é calculada sobre o clipe mais largo (hoje `acenar`, 252px). Se o `pensando` for mais largo, a caixa do mascote muda **em todas as telas** — inclusive no topo da home que acabou de ser fechado. Avisar o Murilo antes.
5. Pendências fora desta rodada, já registradas: **ícone do app em camadas** (iOS 26 espera default/dark/mono via Icon Composer, que pede macOS Tahoe 26.4+; falta verificar o suporte do Expo ao formato `.icon`) e **`app.json` ainda com `backgroundColor: "#F3F0EA"`** no splash e no adaptive icon — o bege abandonado desde 15/09.

## 6. Perguntas em aberto

- **Bloqueio ativo:** o Murilo vai gerar e mandar o vídeo do **Nero pensando**. O prompt foi entregue a ele nesta sessão e está na seção 7.
- A convenção de rotas ficou na forma explícita com grupos (`/(app)/(tabs)/minha-saude/…`). A forma sem grupo (`/minha-saude/…`) também é válida e seria imune a futuras mudanças de grupo — possível limpeza, não feita para não inflar o diff.

## 7. Artefatos relevantes

- `docs/nero/design/2026-09-22-redesign-home-navbottom.md` — diagnóstico, as sete decisões, o que foi descartado e por quê, e a finalista de topo que perdeu (caso se queira voltar atrás).
- `docs/nero/02-DECISOES.md` → **D-022**.
- `.superpowers/brainstorm/14723-1790111228/content/` — mockups e o painel de calibração (`calibrar-v2.html`). Ignorado pelo git.
- Recortes do mascote gerados nesta sessão (cabeça e busto), úteis para qualquer tela futura, no mesmo diretório.

**Prompt do Nero pensando, entregue ao Murilo** (3 s, loop, 1:1, 24 fps, ≥1024px, image-to-video a partir de `assets/images/nero/mascote-nero.png`):

```
The exact same 3D cartoon character from the reference image: small white body with
light-blue swirl hair and stripes, big blue glossy eyes, gentle smile, Pixar-style soft
render. Full body visible, centered, facing the camera, at the same scale and position
as the reference image. Completely flat solid background, uniform medium grey #808080,
filling the entire frame edge to edge — no horizon line, no gradient, no floor, no
shadow on the ground, no props, no scenery of any kind. Static camera, no zoom, no pan.
Character keeps identical proportions, colors and design throughout.

The character is thinking: he brings one hand to his chin, tilts his head slightly, and
looks up and to the side with curious eyes, then gently taps his chin. Calm, slow,
thoughtful movement, gentle smile. Keep the hand clearly separated from the head, with
a visible gap between the fingers and the face. The final frame matches the first frame
so the clip loops seamlessly. 3 seconds.
```

Negative: `text, watermark, logo, extra limbs, extra fingers, distorted face, camera movement, zoom, background change, shadow on ground, blur, morphing, horizon line, gradient background, floor, scenery`

Três mudanças em relação ao prompt original de `animacoes.md`, cada uma vinda de um problema medido numa geração anterior:

- **Fundo cinza médio no lugar do bege `#F3F0EA`.** No `acenar`, a face inferior da mão levantada tinha **exatamente** a cor do fundo (distância 0,0) e abria buraco na máscara — nenhum limiar resolve quando as duas cores são idênticas; foi preciso subir o fechamento para 5 iterações. No `pensando` a mão sobe até o queixo, mesmo risco. Cinza contra branco tem distância grande.
- **Fundo chapado repetido e cenário proibido explicitamente.** No `comemorar` o gerador ignorou "completely flat solid background" e entregou linha de horizonte, o que obrigou a `FUNDO=linha`.
- **"Same scale and position as the reference image"** e **"keep the hand clearly separated from the head"** — a primeira contra a deriva de escala (no `comemorar` veio 14% menor e deslocado); a segunda porque foi a fresta entre mão e cabeça que deixou o buraco escapar do `binary_fill_holes`.

## 8. Instruções pra próxima sessão

- **Uma decisão por vez**, e registrar tudo em `.md` — é como o Murilo trabalha.
- **Não mexer em cor nem em tipografia** sem ele pedir. Está fechado.
- Em questão de composição visual, **não mandar conceitos prontos em série**. Seis foram rejeitados antes de o painel de calibração resolver em uma rodada. Mockup interativo em tamanho real > três propostas bonitas.
- Quando ele reafirmar algo depois de você discordar (como a logo na home), é decisão dele: implementar e seguir.
- Regra clínica continua valendo o método de sempre: verificar a diretriz mais recente e o que ela retirou, documentar com referência, nunca inventar parâmetro.
