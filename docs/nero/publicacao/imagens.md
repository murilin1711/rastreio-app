# Publicação — imagens e logos

> Criado em 18/09/2026. O Murilo exporta as peças-mãe; o Claude deriva os tamanhos finais e coloca em `assets/images/`.

## Peças que o Murilo exporta

| # | Arquivo | Formato | Tamanho | Observações |
|---|---|---|---|---|
| 1 | Símbolo Nero (N + cruz) | PNG transparente ou SVG | 2048 × 2048 px, símbolo centralizado em ~65% da área | Origem do ícone iOS, ícone adaptativo Android e favicon. Sem sombra fora do desenho. |
| 2 | Logo completa (símbolo + "Nero") | PNG transparente ou SVG | ≥ 2000 px no lado maior | Splash e tela de login. |
| 3 | Símbolo monocromático (preto `#000000`) | PNG transparente | 2048 × 2048 px, mesmo enquadramento do #1 | Opcional; ícone temático Android 13+. Se faltar, gerado a partir do #1. |
| 4 | Mascote Nero | PNG transparente | ≥ 1500 px de altura | Pendente desde a Fase 0 (`src/ui/components/NeroImage.tsx`). Uma variante por arquivo. |

Regras: RGB 8 bits, sem CMYK, nunca JPEG, sem cantos arredondados nem margem.

## Derivados (gerados pelo Claude)

| Destino | Tamanho | Origem |
|---|---|---|
| `assets/images/icon.png` (iOS) | 1024 × 1024, sem alpha, fundo `#F3F0EA` | #1 |
| `assets/images/adaptive-icon.png` (Android, primeiro plano) | 1024 × 1024, transparente, símbolo dentro do círculo central de 672 px | #1 |
| Fundo do ícone adaptativo | `#F3F0EA` (`app.json`) | — |
| Ícone monocromático Android | 1024 × 1024 | #3 ou #1 |
| `assets/images/splash.png` | 1024 × 1024 transparente, `resizeMode: contain`, fundo `#F3F0EA` | #2 |
| `assets/images/favicon.png` | 48 × 48 | #1 |
| Ícone do Play Console | 512 × 512, sem alpha | #1 |

## Fichas das lojas (depois dos checklists)

- Capturas: iPhone 6,9" 1320 × 2868; iPad 13" 2064 × 2752 (opcional); Android ≥ 1080 × 1920. 3 a 10 por plataforma.
- Play Store, imagem de destaque: 1024 × 500, sem transparência.

## Decisão em aberto

- Ícone só com o símbolo (recomendado) ou símbolo + "Nero".

## Feito em 18/09/2026
Murilo entregou símbolo (1254 px, PNG transparente), mascote (1254 px, PNG transparente) e logo completa em JPG (xadrez pintado — descartada; a `logo-nero.png` antiga continua na tela de login). Gerados por script (Pillow) a partir do símbolo recortado (897 × 743): `icon.png` (68 % sobre `#F3F0EA`), `adaptive-icon.png` (58 %, dentro da zona segura), `adaptive-icon-mono.png` (silhueta preta), `splash.png` (60 %, `imageWidth` 220), `favicon.png`, `loja/icone-play-512.png`. Mascote em `nero/mascote-nero.png` (718 × 1192), usado em `NeroImage` para todas as variantes. Decisão: splash só com o símbolo, sem a palavra. Ícone só com o símbolo.
