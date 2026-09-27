# Mascote Nero — animações (D-015)

> 19/09/2026. Caminho escolhido: clipes curtos gerados por IA (image-to-video) a partir do PNG final do mascote (`assets/images/nero/mascote-nero.png`), já sobre o bege do app (`#F3F0EA`) para não depender de transparência; convertidos para WebP animado e exibidos com `expo-image`. Descartados: rig 3D do Meshy + Blender (muito passo manual) e só animação por código (fica estático).

## Conjunto

| # | Animação | Onde aparece | Duração | Loop |
|---|---|---|---|---|
| 1 | Repouso — respira, pisca, olha de leve | Home, capa dos módulos, Minha Saúde | 4 s | sim |
| 2 | Acenar | Onboarding, abertura do app | 3 s | não |
| 3 | Comemorar — pulo, braços para cima | Meta batida, check-in, exame em dia, MRPA concluída | 3 s | não |
| 4 | Pensando | Gerando PDF, calculando risco, enviando documento | 3 s | sim |
| 5 | Acolher (depois) | Sinais de alarme, resultado alterado (§25) | 3 s | sim |

Fora de propósito: "triste/preocupado" (§66, tom calmo) e "dormindo".

## Configurações comuns
1:1, 24 fps, ≥ 1024 px, referência = PNG do mascote. Negative prompt: `text, watermark, logo, extra limbs, extra fingers, distorted face, camera movement, zoom, background change, shadow on ground, blur, morphing`.

Bloco comum:
```
The exact same 3D cartoon character from the reference image: small white body with light-blue swirl hair and stripes, big blue glossy eyes, gentle smile, Pixar-style soft render. Full body visible, centered, facing the camera. Completely flat solid background in light beige color #F3F0EA, no floor, no shadow on the ground, no props. Static camera, no zoom, no pan. Character keeps identical proportions, colors and design throughout.
```

## Prompts
1. Repouso (4 s, loop): `[bloco comum] The character stands calmly in an idle pose. Subtle breathing motion: the body gently rises and falls. He blinks naturally twice, and softly glances left then right with his eyes, then returns to looking at the camera with a gentle smile. Very small, slow, relaxed movements. The final frame matches the first frame so the clip loops seamlessly. 4 seconds.`
2. Acenar (3 s): `[bloco comum] The character looks at the camera, smiles wider, and raises his right hand to wave hello in a friendly way, two gentle waves, then lowers the hand back to the idle pose. Cheerful and warm, small bouncy motion, feet stay in place. Starts and ends in the same calm standing pose. 3 seconds.`
3. Comemorar (3 s): `[bloco comum] The character celebrates joyfully: he does one small happy jump, both arms raised above his head, eyes closed in a big delighted smile, then lands softly and returns to the calm standing pose. Playful cartoon squash-and-stretch, no confetti, no props. Starts and ends in the same calm standing pose. 3 seconds.`
4. Pensando (3 s, loop): `[bloco comum] The character is thinking: he brings one hand to his chin, tilts his head slightly, and looks up and to the side with curious eyes, then gently taps his chin. Calm, slow, thoughtful movement, gentle smile. The final frame matches the first frame so the clip loops seamlessly. 3 seconds.`

## Entrega
MP4 nomeados `repouso.mp4`, `acenar.mp4`, `comemorar.mp4`, `pensando.mp4`. O Claude corta, fecha o loop, converte para WebP animado (`assets/animacoes/nero/`), cria `NeroAnimado` e substitui `NeroImage` nos pontos da tabela.

## Clipe 1 — repouso (19/09/2026)
Vídeo gerado pelo Murilo (720 × 1280, 24 fps, 10 s). Processamento: fundo saiu `#E9E2D5` com sombra de chão e marca d'água ✦ no rodapé → recorte por silhueta (distância de cor + `binary_fill_holes` + maior componente, scipy), corte do rodapé, loop fechado nos frames 0–105 (4,4 s) com fusão de 6 frames, 360 px de altura, 20 fps, WebP lossy q75 = **948 KB** (`assets/animacoes/nero/repouso.webp`, 220 × 360, 88 frames). Alternativas medidas: 9 s de loop ficava em 1,7–3,6 MB.
Componente `NeroAnimado` (`expo-image`, `autoplay`), em uso na Home (ao lado da saudação, 104 pt), Minha Saúde (96 pt) e Bem-estar (88 pt). `NeroImage` (PNG parado) continua disponível.

## Clipe 2 — acenar (19/09/2026)
Vídeo de 10 s; o aceno ocupa os frames 48–120 (3 s): mão sobe, dois acenos, mão desce. Cortado por folha de contato + medida de movimento entre frames. Mesmo enquadramento vertical (y 185–1100) e centro horizontal (x 343) do repouso, para o personagem ter o mesmo tamanho; largura maior (278 × 360) porque a mão sai do corpo. 61 frames, 20 fps, **643 KB**, sem loop (`-loop 1`).
`NeroAnimado` ganhou `entrada`: toca o clipe uma vez e troca para o loop ao fim da duração (timer, `expo-image` não avisa o fim); largura fixa pela proporção do clipe mais largo para não mexer no layout. Home: `entrada="acenar"`. Pipeline reutilizável: `scripts/processar-clipe-nero.py <frames> <saida.webp> <ini> <fim> <loop 0|1>` (frames extraídos com `ffmpeg -i video.mp4 frames/f%03d.png`).

## Correção do aceno — mão piscando branco (19/09/2026)
Sintoma relatado pelo Murilo: ao acenar, a mão do Nero piscava branco.

Causa raiz (medida, não suposta): quando a mão está levantada, a face inferior dela tem **a mesma cor do fundo bege do gerador** — a distância de cor cai a 0,0, com mediana 5–11 e metade dos pixels abaixo de 8, contra um limiar de 14. A máscara abria um buraco dentro da mão que escapava pela fresta entre a mão e a cabeça, e por isso sobrevivia ao `binary_fill_holes`; o bege claro da tela (`#F3F0EA`) aparecia através da mão. Nenhum ajuste de limiar resolve: as duas cores são idênticas. Verificado que o vídeo original está limpo e que a compressão WebP não tem culpa (erro estável de ~3 níveis por frame).

Correção: `binary_closing` com 5 iterações em vez de 2 (`FECHAMENTO`, padrão 2 para reproduzir os clipes antigos). Fecha a fresta, o `fill_holes` recupera o interior da mão e a silhueta externa não engorda — com 9 o contorno já fica chapado e quadrado.

Efeito colateral encontrado e corrigido no mesmo passo: abaixo da linha do chão o fechamento forte gruda a sombra na silhueta, a medida das pernas ia de `238..476` para `6..476` e o corte de sombra lateral parava de funcionar, alargando o recorte de 252 para 276 px. Por isso o fechamento forte vale só acima de `y = 940`; abaixo continua 2.

Resultado: área opaca da mão passou de 1258–2321 px (oscilação de 45 %) para 2104–2361 px (11 %, que é o movimento real da mão). Enquadramento idêntico ao aprovado (252 × 360, recorte x 22–664, 61 frames, 591 KB), então `CLIPES` não muda. `repouso.webp` **não foi regerado**.

Comando: `FECHAMENTO=5 python3 scripts/processar-clipe-nero.py <frames> assets/animacoes/nero/acenar.webp 48 120 0`

Tentativa descartada: um verificador automático de buracos no WebP final (`binary_closing` + critério de cerco). Na resolução de entrega, 3,5× menor, o buraco encolhe para o tamanho das concavidades legítimas (fresta entre braço e corpo, vão entre as pernas) e as duas calibrações testadas não os separaram. A verificação que funciona é comparar os mapas de alpha da mão frame a frame, antes e depois.

Observação para depois (não é o bug relatado): o corte de sombra lateral deixa uma quina reta clara à esquerda do pé em alguns frames.

## Clipe 3 — comemorar (19/09/2026)
Vídeo de 10 s; a comemoração ocupa os frames 88–150 (2,6 s): ergue os braços, pula, aterrissa e volta à pose calma. 53 frames, 20 fps, **404 KB**, sem loop (228 × 360 — mais estreito que o aceno, então `PROPORCAO_MAX` e o layout não mudam).

Este vídeo saiu diferente dos dois primeiros e exigiu duas mudanças no pipeline:

1. **Enquadramento próprio.** O personagem veio ~14 % menor e deslocado (topo da cabeça em y 332 contra 218 no aceno), e no ápice do pulo a cabeça sobe até y 170 — acima do `Y0 = 185` fixo, que cortaria a cabeça. `Y0`, `Y1` e `CX` viraram variáveis de ambiente (padrões = os dos clipes aprovados). Usado: `Y0=160 Y1=1105 CX=353`. Consequência aceita: no comemorar o Nero aparece um pouco menor que no repouso, o que não incomoda porque ele aparece sozinho, em contexto próprio — se algum dia trocar repouso → comemorar no mesmo lugar, haverá salto de tamanho.
2. **Fundo por linha** (`FUNDO=linha`, padrão `pixel`). O gerador ignorou o "completely flat solid background" do prompt e produziu cenário com linha de horizonte: a cor do fundo varia de `[230,219,202]` a `[237,227,212]` conforme a altura — distância ~11, quase o limiar 14. Com uma cor só, sobravam manchas do cenário no recorte. Medindo uma cor por linha (mediana das 40 colunas de cada borda ao longo do trecho), a área capturada caiu de 212–257 mil px para 191–214 mil.

Comando: `FUNDO=linha FECHAMENTO=5 Y0=160 Y1=1105 CX=353 python3 scripts/processar-clipe-nero.py <frames> assets/animacoes/nero/comemorar.webp 88 150 0`

## Clipe 4 — pensando (23/09/2026)
Vídeo de 10 s, 720 × 1280, 24 fps; o gesto de pensar ocupa os frames 12–72 (2,5 s): braços soltos, mão sobe ao queixo, cabeça inclina e o olhar vai para cima, mão desce e volta à pose inicial. 51 frames, 20 fps, **459 KB**, **em loop** (248 × 360 — 4 px mais estreito que o aceno, então `PROPORCAO_MAX` e o layout não mudam). Começa e termina na mesma pose, então o crossfade de 6 frames do `loop=1` fecha sem salto.

Foi o clipe mais limpo dos quatro, e o motivo é o fundo: o prompt pediu **cinza médio chapado** em vez do bege, exatamente por causa do buraco na mão do aceno. Medido antes de processar:

1. **Fundo perfeito.** `#808080` em todo o quadro, em todos os frames — desvio zero entre as linhas 100, 600, 1000 e 1250. `FUNDO=pixel` (padrão) bastou; nada de `FUNDO=linha`.
2. **`FECHAMENTO=5` não foi preciso.** Com o fundo cinza, o branco do personagem fica a uma distância de cor grande, e o padrão `2` já fecha a silhueta: **zero buracos internos** em todos os 51 frames (componentes de fundo não conectados à borda). A diferença entre `2` e `5` é de ~45 px por frame, espalhados pelo contorno — engorda sem ganho. Usado `FECHAMENTO=2`.
3. **Enquadramento próprio, casado com o repouso pela escala de saída.** O personagem veio menor (altura 757 px contra 867 no repouso) e deslocado. Em vez de aceitar o salto de tamanho como no comemorar, a janela de recorte foi dimensionada para que, depois do resize para 360 de altura, o personagem meça os mesmos ~341 px do repouso: `757 × 360/341 ≈ 799` de janela. Topo da cabeça em 272 (mínimo do trecho), menos a mesma margem relativa do repouso → `Y0=252 Y1=1051`. `CX=359` medido no centro das pernas (x 250–468), que é o ponto que não se move quando ele inclina o corpo.
4. **Marca d'água do gerador** no canto inferior direito (y 1135–1185, x 576–623), fora da faixa do corpo — o `hard[1120:] = False` que já existia no script a elimina.

Comando: `FECHAMENTO=2 Y0=252 Y1=1051 CX=359 python3 scripts/processar-clipe-nero.py <frames> assets/animacoes/nero/pensando.webp 12 72 1`

**Regra que se confirmou:** medir o enquadramento antes de processar, porque cada geração sai com escala e posição próprias. E o fundo cinza médio deve virar padrão nos prompts — resolveu de uma vez o problema que custou duas rodadas de calibração nos clipes 2 e 3.

## Prompts v2 — comemorar e pensando longos e em loop (27/09/2026)
Pedido do Murilo: refazer os dois clipes um pouco mais longos e em loop, para o onboarding (D-063). Ciclo de **6 s** dentro do vídeo de 10 s: o dobro do atual, e ainda abaixo de ~1 MB em WebP (medido: 4,4 s de loop = 948 KB; 9 s passava de 1,7 MB).

O que mudou em relação aos prompts de 19/09, pelo que os clipes 1–4 ensinaram:
- **Fundo cinza médio `#808080` chapado** (resolveu o recorte no clipe 4 sem calibração).
- **Mesmo tamanho e posição do repouso** pedidos no prompt (cada geração saía com escala própria).
- **Começa e termina na mesma pose, de olhos abertos**, com linha do tempo segundo a segundo: o loop fecha sem salto, e o comemorar deixa de terminar congelado de olhos fechados (reclamação do Murilo em 26/09).
- Formato vertical 9:16 (720 × 1280), como os vídeos que ele gerou.

Bloco comum v2:
```
The exact same 3D cartoon character from the reference image: small white body with light-blue swirl hair and stripes, big blue glossy eyes, gentle smile, Pixar-style soft render. Full body visible, centered, facing the camera, same size and position as the reference: head near the top third, feet near the bottom, with empty space around. Completely flat solid medium gray background (#808080), perfectly uniform, no gradient, no horizon line, no floor, no shadow on the ground, no props, no text. Static camera, no zoom, no pan, no cut. Character keeps identical proportions, colors and design in every frame.
```

Comemorar v2 (loop, 6 s):
```
[bloco comum] A joyful celebration that loops seamlessly. Timeline:
0–1 s: calm standing pose, eyes open, gentle smile, looking at the camera.
1–2 s: he raises both arms happily above his head, smile grows wider, eyes stay open and sparkling.
2–3.5 s: one small, soft happy jump with arms up, playful squash-and-stretch on landing, feet land in exactly the same spot.
3.5–4.5 s: a cheerful little side-to-side sway with arms still up, big open-eyed smile (a quick blink is fine, but eyes must be open most of the time).
4.5–6 s: arms come down slowly and he settles back into the exact same calm standing pose as the first frame, eyes open, gentle smile.
The last frame must match the first frame exactly (same pose, same position, eyes open) so the clip loops with no jump. Warm, happy, not frantic. No confetti, no props, no text. 6-second cycle.
```

Pensando v2 (loop, 6 s):
```
[bloco comum] A calm thinking animation that loops seamlessly. Timeline:
0–1 s: calm standing pose, arms relaxed, eyes open, looking at the camera with a gentle smile.
1–2 s: he slowly brings his right hand up to his chin.
2–3.5 s: he tilts his head slightly and looks up and to the side with curious eyes, as if thinking, then gently taps his chin twice.
3.5–4.5 s: he looks back toward the camera with a small "I've got it" smile, eyebrows lifting slightly.
4.5–6 s: the hand comes down slowly and he returns to the exact same calm standing pose as the first frame, eyes open.
The last frame must match the first frame exactly (same pose, same position, eyes open) so the clip loops with no jump. Slow, soft, thoughtful movements, feet never move. 6-second cycle.
```

Negativo v2: `text, watermark, logo, extra limbs, extra fingers, distorted face, closed eyes at the end, camera movement, zoom, background change, gradient background, horizon, floor, shadow on ground, blur, morphing`.

Entrega: `comemorar.mp4` e `pensando.mp4` (720 × 1280, 24 fps, 10 s). O Claude escolhe o ciclo, fecha o loop, casa o tamanho com o repouso pela escala de saída (como no clipe 4) e troca em `assets/animacoes/nero/`. Com o comemorar em loop, a tela final do onboarding pode deixar de voltar ao repouso; decidir com o Murilo quando os vídeos chegarem.

## Clipe 3 v2 — comemorar longo e em loop (27/09/2026)
Vídeo do Gemini (`gemini_generated_video_3b6c049d.mp4`), **1280 × 720 horizontal**, 24 fps, 10 s — diferente dos anteriores, que eram verticais. Fundo cinza como pedido, mas em **degradê** (126 no topo, 144 embaixo) e com sombra leve no chão; sem marca d'água nos cantos. Olhos abertos quase o tempo todo, como pedido.

- **Ciclo:** quadros 1–126 (5,25 s). O 126 é o mais parecido com o 1 (diferença média 1,26 em cinza, contra ~2,5 nos vizinhos), então o loop emenda sem salto; o crossfade do `loop=1` faz o resto.
- **Adaptação ao pipeline vertical:** em vez de mexer no script (que assume 720 × 1280), cada quadro foi recortado em 720 de largura centrado nas pernas (x 242–962) e completado em cima e embaixo com a cor da primeira e da última linha, pés na altura dos clipes antigos (deslocamento vertical 380).
- **Enquadramento:** no alto do pulo a cabeça vai a y 27 do original, então a janela precisou de 678 px (`Y0=392 Y1=1070`): o Nero sai ~9 % menor que no repouso, como no comemorar antigo. Aceito: ele aparece sozinho, em contexto próprio.
- `FUNDO=linha` (por causa do degradê), `FECHAMENTO=2`, `CX=360`. Saída: **308 × 360, 105 quadros, 20 fps, 954 KB**.
- Sobra uma sombra cinza muito leve sob os pés, visível só em fundo escuro; no fundo claro do app não aparece.

Comando: `FUNDO=linha FECHAMENTO=2 Y0=392 Y1=1070 CX=360 python3 scripts/processar-clipe-nero.py <quadros verticais> assets/animacoes/nero/comemorar.webp 1 126 1`

**Largura da caixa:** o clipe é mais largo (308) que o aceno (252) por causa dos braços abertos. A regra antiga (largura do clipe mais largo de todos) alargaria o Nero na Home e em Minha Saúde, onde o Murilo calibrou a posição. Nova regra (`larguraDaCaixa`): a caixa é a do aceno e só cresce onde um dos clipes usados é mais largo — o modal de comemoração e a tela final do onboarding. **No onboarding, a tela final passou a usar o comemorar em loop** (antes: comemorava uma vez e ia ao repouso). Falta o pensando v2.

**Correção do mesmo dia (27/09): centralização e nitidez.** O Murilo notou o Nero fora do centro e sem nitidez.
- *Centro:* eu tinha centrado pelo meio das pernas medido com limiar 40, que pegou a sombra do chão, assimétrica (x 602). Cabeça, tronco e pernas com limiar 70 concordam em **x ≈ 632**: 30 px de erro. Recorte refeito com `X0=272`; na saída, o tronco fica a 2–3 px do meio da imagem em todo o ciclo.
- *Nitidez:* todos os clipes tinham 360 px de altura, pensados para a Home (104 pt). No onboarding o Nero chega a 290 pt (~870 px na tela), esticado mais de 2×. O comemorar passou a **640 px, q 80: 490 × 640, 1,9 MB**.
- **Pendente:** repouso, acenar e pensando continuam em 360 px e ficam macios no onboarding (padrão 1). Regerar em 640 px exige os vídeos originais (o repouso e o acenar vieram de vídeos de 19/09 que não estão no repositório); o pensando v2 já será processado em 640.

Comando final: `FUNDO=linha FECHAMENTO=2 Y0=392 Y1=1070 CX=360 python3 scripts/processar-clipe-nero.py <quadros verticais, X0=272> assets/animacoes/nero/comemorar.webp 1 126 1 20 640 80`
