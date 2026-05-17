# Redesign Visual — Rastreando App

**Data:** 2026-05-17  
**Escopo:** Reformulação completa da identidade visual — cores, tipografia, componentes e todas as 19 telas  
**Abordagem escolhida:** Design System Centralizado (Abordagem A)

---

## 1. Decisões de Design

| Dimensão | Decisão |
|---|---|
| Estilo geral | Moderno & Clean |
| Fonte | Poppins (substituindo Quicksand) |
| Layout Home | Header azul forte + card flutuante na borda + lista vertical |
| Paleta | Azul marinho #0f2d63 + Branco #ffffff |
| Identidade | Caranguejo animado via Lottie (símbolo do câncer) |

---

## 2. Design Tokens — `constants/Theme.ts`

### Cores

```ts
export const Colors = {
  primary:        '#0f2d63',  // azul marinho principal
  primaryLight:   '#1a3a7a',  // hover / variante
  accent:         '#2e5dbf',  // links e destaques
  background:     '#ffffff',  // fundo principal
  surface:        '#f5f7fc',  // cards e seções
  border:         '#e8eef8',  // divisores e bordas
  textPrimary:    '#0f2d63',  // títulos e corpo
  textSecondary:  '#6b7fa3',  // subtítulos
  textMuted:      '#a8b8d0',  // placeholder / datas
  success:        '#16a34a',  // exame em dia
  warning:        '#d97706',  // atenção / revisão
  danger:         '#dc2626',  // risco alto / urgente
}
```

### Tipografia (Poppins)

| Token | Tamanho | Peso | Uso |
|---|---|---|---|
| `display` | 28–22px | 800 | Saudação na Home |
| `title` | 20px | 700 | Títulos de tela |
| `heading` | 16px | 700 | Títulos de seção |
| `subheading` | 14px | 600 | Subtítulos |
| `body` | 14px | 400 | Corpo de texto |
| `label` | 10px | 600 | Labels uppercase, letter-spacing 1px |

### Espaçamento

```ts
export const Spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
```

### Border Radius

```ts
export const Radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 }
```

---

## 3. Componentes Novos — `components/ui/`

| Arquivo | Descrição |
|---|---|
| `ScreenHeader.tsx` | Header azul com saudação, barra de progresso e card flutuante |
| `InternalHeader.tsx` | Título inline no conteúdo (Padrão C aprovado): botão voltar + label uppercase + título peso 800 dentro do scroll, sem header fixo separado |
| `Button.tsx` | Primary (filled), Outline, Ghost, Danger, Disabled |
| `Card.tsx` | Card branco com sombra `0 6px 20px rgba(15,45,99,0.14)` |
| `ListItem.tsx` | Ícone azul sólido 28×28px + título + subtítulo + chevron, fundo `#f5f7fc` |
| `StatusBadge.tsx` | 4 estados: EM DIA (verde), PENDENTE (amarelo), URGENTE (vermelho), N/A (cinza) |
| `ProgressBar.tsx` | Barra gradiente `#0f2d63 → #2e5dbf`, label "% em dia" |
| `SectionTitle.tsx` | Label uppercase + linha divisória |
| `Input.tsx` | Campo com ícone à esquerda, borda `#e8eef8`, foco `#0f2d63` |
| `CrabLottie.tsx` | Wrapper Lottie para o caranguejo animado |

### Arquivos atualizados

| Arquivo | O que muda |
|---|---|
| `constants/Colors.ts` | Substituído pelos tokens acima |
| `components/ThemedText.tsx` | Novos variants: display, title, heading, subheading, body, label |
| `components/ThemedView.tsx` | Background padrão → `#ffffff`, surface → `#f5f7fc` |

---

## 4. Identidade — Caranguejo Animado

O caranguejo é o símbolo do câncer (origem latina/grega). Usado como elemento de identidade visual do app.

**Implementação:**
- Arquivo: `assets/lottie/crab-float.json` — animação de flutuação suave (bob up/down + leve rotação, loop infinito)
- Componente: `components/ui/CrabLottie.tsx` — wrapper com opacidade configurável
- Tamanho padrão: 56×56px
- Opacidade: 0.4 (semitransparente para não poluir)

**Onde aparece:**
- Home (todos): canto superior direito do header azul, opacidade 0.4, animação `float`
- Landing page: centro do hero azul, tamanho 80×80px, opacidade 0.85, animação `pulse`
- Login: mini hero, tamanho 40×40px, opacidade 0.7, animação `float`

---

## 5. Padrões de Tela

### Padrão 1 — Home com ScreenHeader flutuante (3 telas)

**Estrutura:**
1. Status bar (azul)
2. Header azul: label "Rastreando" peso 300 + nome em peso 800 + barra de progresso + `paddingBottom: 28`
3. Card flutuante: `position absolute, bottom: -28px` no wrapper do header, `zIndex: 10`, sombra `0 6px 20px rgba(15,45,99,0.18)` — label "PRÓXIMO EXAME", nome do exame, botão "Agendar"
4. Corpo branco: `paddingTop: 42px` + SectionTitle "SEUS RASTREIOS" + ListItems
5. Bottom tab bar

**Telas:**
- `Home/TelaDeHomeUsuario.tsx`
- `Home/TelaDeHomeProfissional.tsx`
- `Home/TelaDeHomeProfissionalPessoal.tsx`

---

### Padrão 2 — Título inline no conteúdo (17 telas)

**Estrutura (sem header fixo separado):**
1. Status bar (branca)
2. Dentro do ScrollView: botão voltar (26×26, fundo `#f5f7fc`, ícone `#0f2d63`) + label uppercase muted → título em peso 800 tamanho 20–22px
3. Conteúdo da tela com Cards e StatusBadges
4. Bottom tab bar

**Telas:**
- `PerfilIndividual/SeusExamesDeRastreio/` (7 telas)
- `PerfilIndividual/PerfilIndividualMulher.tsx`
- `PerfilIndividual/PerfilIndividualHomem.tsx`
- `PerfilIndividual/SinaisESintomas.tsx`
- `ProximosExames.tsx`
- `MarcarConsulta.tsx`
- `RastrearMeuPaciente/RastrearMeuPaciente.tsx`
- `RastrearMeuPaciente/RastrearHomem.tsx`
- `RastrearMeuPaciente/RastrearMulher.tsx`
- `RastrearMeuPaciente/RastrearPacienteNeoplasia.tsx`
- `RastrearMeuPaciente/IndicacoesRastreio.tsx`
- `RastrearMeuPaciente/CondutaManejoResultados.tsx`

---

### Padrão 3 — Calculadoras e formulários (6 telas)

**Estrutura:**
1. Header azul compacto: botão voltar + label + título da calculadora + steps como barras horizontais (cada barra = 1 etapa, azul = atual, branco 25% = restante) + contador "X / Y"
2. Corpo branco:
   - Pergunta em peso 700 tamanho 14px
   - Opções com radio button circular: borda `#e8eef8` padrão → borda `#0f2d63` + fundo `#f0f4ff` + radio preenchido ao selecionar
   - Botão "Próxima →" fixo no rodapé
3. Tela de resultado: card flutuante com gauge SVG + nível de risco colorido + lista de recomendações em ListItems

**Telas:**
- `PerfilIndividual/CalculeSeuRisco/` (6 telas — 3 masculinas, 3 femininas)

---

### Padrão 4 — Autenticação (3 telas)

**Landing (`paginaInicial.tsx`):**
1. Hero azul: CrabLottie 80×80px pulsando + título "Rastreando" peso 800 + subtítulo muted + onda SVG na base
2. Área branca: Button Primary "Entrar" + Button Outline "Criar conta" + link ghost "Sou profissional de saúde →"

**Login (`Login/TelaLogin.tsx`):**
1. Mini hero azul compacto: CrabLottie 40×40px flutuando + "Bem-vindo de volta" + onda SVG
2. Formulário: Input email + Input senha + link "Esqueci minha senha" (alinhado à direita) + Button Primary "Entrar" + link "Não tem conta? Criar conta"

**Cadastro (`Cadastro/TelaCadastro.tsx`):**
1. Header azul: botão voltar + label + título "Crie sua conta" + subtítulo + seletor Paciente/Profissional (tab no próprio header, selecionado = fundo branco) + onda SVG
2. Formulário: campos conforme tipo selecionado + Button Primary "Criar conta"

---

## 6. Ordem de Implementação

1. `constants/Theme.ts` — tokens centrais
2. `constants/Colors.ts` — atualizar com nova paleta
3. `assets/lottie/crab-float.json` — criar animação
4. `components/ui/` — criar os 10 componentes novos
5. `components/ThemedText.tsx` e `ThemedView.tsx` — atualizar
6. Padrão 4 — Auth (Landing, Login, Cadastro) — mais simples, valida o sistema
7. Padrão 1 — Homes (paciente + profissional) — telas principais
8. Padrão 2 — Telas internas (13 telas)
9. Padrão 3 — Calculadoras (6 telas) + telas de resultado

---

## 7. Fontes — Troca de Quicksand para Poppins

- Baixar: Poppins-Regular, Medium, SemiBold, Bold, ExtraBold (400, 500, 600, 700, 800)
- Salvar em `assets/fonts/`
- Atualizar carregamento no `_layout.tsx` via `useFonts()`
- Remover arquivos Helvetica e SpaceMono (não serão mais usados)
- Manter Quicksand temporariamente até todas as telas serem migradas
