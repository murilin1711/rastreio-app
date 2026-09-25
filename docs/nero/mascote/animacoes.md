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
