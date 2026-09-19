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
