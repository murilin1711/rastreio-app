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
