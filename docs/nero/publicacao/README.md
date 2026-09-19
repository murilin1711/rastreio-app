# Publicação nas lojas — estado e pendências

> Atualizado em 19/09/2026. Decisão técnica de base: D-012 em `../02-DECISOES.md`.

## Feito (não dependia do Murilo)
- [x] `app.json`: permissões em português (câmera, fotos, documentos, notificações), `ITSAppUsesNonExemptEncryption`, localização pt-BR, build 1.
- [x] `eas.json`: perfis `development`, `preview`, `production`.
- [x] Canal Android `lembretes` + handler de primeiro plano (`src/core/lembretes/configurar.ts`, 4 testes).
- [x] Dependências nativas sem uso removidas (`expo-sensors`, `lottie-react-native`); `expo-doctor` 21/21.
- [x] Rascunho da política de privacidade (`politica-de-privacidade.md`) com lacunas `[[ ]]`.
- [x] Especificação das imagens a exportar (`imagens.md`).
- [x] **Exclusão de conta no app** (D-013): migração 0014, função `excluir_minha_conta()`, tela em Minha Saúde, 9 pgTAP + 4 Jest. Falta `db push` (senha) e teste no aparelho.

## Mascote (D-015, 19/09)
- [x] Clipes repouso e acenar no app (`NeroAnimado`), **aprovados pelo Murilo em 19/09** (commit `70d27d6`, que corrigiu a mão piscando branco ao acenar). Alinhamento do mascote na Home também aprovado.
- [ ] Clipes comemorar e pensando (prompts em `../mascote/animacoes.md`).
- [ ] Onde acena no primeiro contato: login (recomendado) ou onboarding.

## Depende do Murilo (em ordem)
1. [ ] Contas **Apple Developer** e **Google Play Console** (pessoa física recomendada).
2. [x] **Nome nas lojas:** "Nero Saúde" (D-014, 18/09).
3. [ ] **Bundle id iOS / package Android** — permanente. Recomendação: domínio invertido que você controle (ex.: `br.com.<dominio>.nero`); sem domínio, `com.murilopovoa.nero`.
4. [x] Imagens: ícones, splash, favicon, Play e mascote gerados em 18/09 (`imagens.md`).
5. [ ] Política de privacidade: preencher `[[ ]]`, decidir hospedagem (recomendação: GitHub Pages do repositório) e idade mínima.
6. [x] Migração 0014 aplicada na nuvem em 18/09.
7. [ ] Reativar confirmação de e-mail no Supabase Auth e testar cadastro.
8. [ ] Revogar token antigo do CLI (`supabase.com/dashboard/account/tokens`).
9. [ ] `eas init` (cria o projeto na conta Expo `murilorp1711`) → `eas build --profile preview` → TestFlight / teste interno.

## Depois do primeiro build
- Capturas de tela (tamanhos em `imagens.md`), textos da ficha (descrição curta/longa, categoria "Saúde e fitness" ou "Medicina"), questionário de privacidade da App Store e "Segurança dos dados" do Play (ambos respondidos a partir da política).
- Apple: apps de saúde precisam declarar que não são dispositivo médico; ressalvas §26/§40 já cobrem no app.
