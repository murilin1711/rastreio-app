# NERO — Sistema de Design (v0, Fase 0)

> Tokens em `src/ui/theme.ts`. Este documento explica as escolhas; o código é a fonte da verdade dos valores.

## Brief
App de saúde para pacientes brasileiros adultos (grande parte entre 40 e 70 anos). Tom educativo e sereno: **orienta, não assusta** (§25). Mascote **Nero** (render 3D: branco perolado, listras azul-aço, olhos cobalto). Logo: "N" em gradiente azul/ciano com cruz + palavra "Nero" em marinho (`assets/images/nero/logo-nero.png`, `simbolo-nero.png`).

> **Revisão 15/09/2026 (feedback do Murilo no aparelho):** o onboarding claro perdeu personalidade — voltamos ao estilo escuro do Rastreando (marinho, bolhas, um único movimento de flutuação). O fundo areia não combinou — telas internas em branco frio. O arquivo do mascote ainda não foi enviado; o símbolo da logo ocupa o lugar dele até então.

## Cor
| Nome | Hex | Uso |
|---|---|---|
| Marinho | `#0f2d63` | texto principal, ação primária (herdado do Rastreando) |
| Aço | `#5B8DB8` | acento — as listras do Nero; links, marca |
| Branco frio | `#F5F7FB` | fundo das telas internas (**revisão 15/09**: o bege/areia não combinou no aparelho; voltamos ao azul + branco do Rastreando) |
| Marinho profundo | `#0a1f4e` | fundo do onboarding e login — herdado do Rastreando, o Murilo preferiu manter o estilo escuro |
| Porcelana | `#FFFFFF` | superfícies (campos, blocos de módulo) |
| Grafite-azul | `#4A5C7A` | texto secundário (legível sobre areia) |
| Alertas §43 | verde `#16a34a` · amarelo `#d97706` · laranja `#ea580c` · vermelho `#dc2626` · cinza `#6b7280` | níveis clínicos, sempre com fundo pastel correspondente |

## Tipografia
Só **Poppins**. Escala: display 28 ExtraBold · title 22 Bold · heading 17 SemiBold · body 15 Regular (entrelinha 23) · caption 13.
**Regra:** rótulos em CAIXA ALTA espaçada só em chips de status. Nunca como "eyebrow" acima de títulos. Títulos de seção em caixa normal ("Hoje", "Seus módulos").

## Layout
- Alinhado à esquerda; margem lateral 20; blocos separados por 24.
- **Dois raios codificam hierarquia:** 20 para blocos de módulo e cartões grandes; 12 para linhas, campos e chips.
- A lista "Hoje" são **linhas planas sobre a areia** com um ponto colorido — o nível de alerta é a informação; não vira cartão branco.
- Sombra sempre tingida de marinho (`#0f2d63`, opacidade baixa), nunca cinza neutro.

## Princípios
1. A ousadia fica num só lugar: o Nero. Tudo ao redor é quieto.
2. Sem movimento decorativo; movimento só em resposta a ação do usuário.
3. Copy em caixa normal, verbos diretos, sem "→" em botões. O botão diz o que acontece: "Salvar", "Continuar", "Sair da conta".
4. Erros dizem o que houve e como resolver; telas vazias convidam a agir.

## O que evitamos de propósito (defaults genéricos)
Eyebrow em caps · cartões idênticos com o mesmo raio · sombra cinza · "→" em links · metadados separados por "·" em excesso · acento terracota.
