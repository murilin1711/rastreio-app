# Publicação nas lojas — estado e pendências

> Atualizado em 22/09/2026. Decisão técnica de base: D-012 em `../02-DECISOES.md`.

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

## Infraestrutura — backup (D-018, 22/09)
- **Decidido: transferir o projeto NERO para a organização do Murilo que já assina o Supabase Pro.** Custo marginal **~US$ 10/mês** (a assinatura de US$ 25 e o crédito de computação são por organização e já estão consumidos; o NERO entra como projeto adicional). Organização confirmada como exclusivamente dele.
- **Por quê:** o Free **não tem backup nenhum**. Montar backup próprio (GitHub Actions + armazenamento gratuito) sairia de graça, mas colocaria prontuários de pacientes sob guarda pessoal do Murilo — exposição maior que a mensalidade.
- [ ] **Ação do Murilo (painel):** Settings › General › **Transfer project** → organização com Pro. Exige **nenhuma integração GitHub ativa**; não muda a região (segue São Paulo).
- [ ] **Depois da transferência:** confirmar que **Database › Backups** mostra os backups diários, e abrir o app para ver se ainda conecta (URL e chaves não devem mudar).
- **A política já está escrita supondo a transferência feita** (seção 8: cópias de 7 dias). **Não publicar a política antes de confirmar os backups no painel.**

## Depende do Murilo (em ordem)
1. [ ] Contas **Apple Developer** e **Google Play Console** (pessoa física recomendada).
2. [x] **Nome nas lojas:** "Nero Saúde" (D-014, 18/09).
3. [ ] **Bundle id iOS / package Android** — permanente. Recomendação: domínio invertido que você controle (ex.: `br.com.<dominio>.nero`); sem domínio, `com.murilopovoa.nero`.
4. [x] Imagens: ícones, splash, favicon, Play e mascote gerados em 18/09 (`imagens.md`).
5. [ ] Política de privacidade: preencher `[[ ]]`, decidir hospedagem (recomendação: GitHub Pages do repositório) e idade mínima (**18+ confirmado pelo Murilo em 22/09**, já aplicado). **Atualizada em 22/09** com água, sequência/conquistas, insuficiência cardíaca, lembretes de água, operador Resend e a nova regra de exclusão sem backup (D-018). Faltam só os dados pessoais do responsável, a idade mínima e a URL.
6. [x] Migração 0014 aplicada na nuvem em 18/09.
7. [ ] **Confirmação de e-mail por código de 6 dígitos via Resend (D-019).** Depende de você: criar conta no Resend, verificar um domínio remetente e passar as credenciais SMTP. O resto (template com `{{ .Token }}`, tela do código, `verifyOtp`) eu implemento.
8. [ ] Revogar token antigo do CLI (`supabase.com/dashboard/account/tokens`).
9. [ ] `eas init` (cria o projeto na conta Expo `murilorp1711`) → `eas build --profile preview` → TestFlight / teste interno.

## Depois do primeiro build
- Capturas de tela (tamanhos em `imagens.md`), textos da ficha (descrição curta/longa, categoria "Saúde e fitness" ou "Medicina"), questionário de privacidade da App Store e "Segurança dos dados" do Play (ambos respondidos a partir da política).
- Apple: apps de saúde precisam declarar que não são dispositivo médico; ressalvas §26/§40 já cobrem no app.
