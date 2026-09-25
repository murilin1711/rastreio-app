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
- [x] **Transferência concluída em 22/09.** A organização Pro estava em outro e-mail do Murilo: resolvido convidando a conta do NERO como **Owner** dela, e não migrando para projeto novo. Verificado que nada técnico mudou — mesmo ref, mesma URL, chaves funcionando (REST e Auth em HTTP 200).
- [x] **Backups confirmados em 24/09:** oito cópias diárias no painel (17 a 24/09), o que cobre os 7 dias prometidos na seção 8.
- [ ] Ligar **verificação em duas etapas nas duas contas** — ambas abrem o banco de prontuários agora.
- **A política já está escrita supondo a transferência feita** (seção 8: cópias de 7 dias). **Não publicar a política antes de confirmar os backups no painel.**

## Depende do Murilo (em ordem)
1. [~] Contas de desenvolvedor: **Apple Developer pronta (24/09), em CPF (pessoa física)**. Falta o **Google Play Console** (US$ 25, pagamento único). Atenção ao prazo do Play: conta pessoal nova exige 12 testadores por 14 dias antes de publicar aberto, então vale abrir cedo.
2. [x] **Nome nas lojas:** "Nero Saúde" (D-014, 18/09).
3. [x] **Bundle id iOS / package Android: `br.com.nerosaude.app`** (D-021, 22/09) — domínio invertido de `nerosaude.com.br`, já aplicado no `app.json` nos dois sistemas. `expo-doctor` 21/21. **Permanente a partir do primeiro envio.**
4. [x] Imagens: ícones, splash, favicon, Play e mascote gerados em 18/09 (`imagens.md`).
5. [~] Política de privacidade: **texto completo em 24/09** (responsável: Murilo Roiz Póvoa, CPF, Goiânia/GO, encarregado o próprio). Página pronta em `site/privacidade.html`, falta **hospedar** em **https://nerosaude.com.br/privacidade** (domínio comprado em 22/09; melhor que GitHub Pages porque as lojas esperam a política no domínio do próprio app) e idade mínima (**18+ confirmado pelo Murilo em 22/09**, já aplicado). **Atualizada em 22/09** com água, sequência/conquistas, insuficiência cardíaca, lembretes de água, operador Resend e a nova regra de exclusão sem backup (D-018). Faltam só os dados pessoais do responsável, a idade mínima e a URL.
6. [x] Migração 0014 aplicada na nuvem em 18/09.
7. [x] **Confirmação de e-mail por código de 6 dígitos via Resend (D-019) — CONFIGURADA E TESTADA em 22/09.** Domínio verificado no Resend, SMTP e template aplicados via `scripts/configurar-auth.mjs`, confirmação exigida, envio validado (`status=delivered`). Pendências: apagar o usuário de teste `nerosaude+teste1@gmail.com` e **revogar o token da Supabase** criado para essa configuração.
   - _Histórico:_ Depende de você: criar conta no Resend, verificar um domínio remetente e colar a chave no painel da Supabase. O resto (template com `{{ .Token }}`, tela do código, `verifyOtp`) eu implemento.
   - SMTP do Resend, em **Supabase › Authentication › SMTP Settings**: servidor `smtp.resend.com`, porta `465`, usuário `resend`, senha = a **chave de API do Resend**.
   - **App já implementado em 22/09** (tela do código, `verifyOtp`, reenvio, e o login levando quem não confirmou para a tela certa). Falta só o painel.
   - Texto do e-mail pronto para colar: [`email-confirmacao.md`](email-confirmacao.md).
   - **Ligar "Confirm email" é o ÚLTIMO passo**, depois de SMTP e template — antes disso o cadastro pediria um código que não chega.
   - **A chave nunca entra no repositório nem no chat** — ela vive só no painel da Supabase. Uma chave foi colada no chat em 22/09 e deve ser **apagada e recriada** no Resend (mesmo cuidado já aplicado à senha do banco).
8. [ ] Revogar tokens de acesso em `supabase.com/dashboard/account/tokens`: o antigo (22/09) **e** o criado em 24/09 para aplicar o template, que apareceu no chat e por isso deixou de ser secreto.
8b. [x] **Template de recuperação de senha aplicado em 24/09** (D-033). Antes o assunto era "Reset your password" e o corpo trazia link: o padrão da Supabase, nunca tocado. Agora manda o código de seis dígitos, que é o que a tela do app espera. Conferido na resposta do servidor.
   - A `RESEND_API_KEY` virou **opcional** no script: com o SMTP já no ar, dá para atualizar só os textos. A chave não é devolvida pela API, então exigi-la obrigaria a gerar uma nova só para trocar uma frase.
   - **Nunca usar `supabase config push` no lugar.** O `config.toml` local diverge do servidor: nele a confirmação de e-mail está desligada e o SMTP do Resend não existe. Um push derrubaria os dois.
9. [~] **Primeiro build iOS concluído em 25/09/2026.** Projeto EAS `@murilorp1711/nero` (id `e30fea11-66fa-49b6-b3c5-a1e0cc60ff93`), perfil `production`, versão 1.0.0.
   - **Bundle `br.com.nerosaude.app` registrado na Apple**, time BWHCTJ2PUW (Murilo Povoa, pessoa física). A partir daqui é permanente: mudar significa app novo, sem histórico nem usuários.
   - Certificado de distribuição e provisioning profile criados pelo EAS, válidos até 25/09/2027. Chave APNs gerada por precaução (o app só usa notificação local).
   - **Armadilha resolvida antes do build:** o `.env` está no `.gitignore` e o EAS envia o projeto respeitando o git, então `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` não chegariam à nuvem — e `client.ts` lança erro sem elas. O app fecharia ao abrir, depois de meia hora de fila. As duas agora vivem como variáveis do projeto no EAS, nos três ambientes.
   - Limpezas do mesmo dia: `expo-doctor` de 1 falha para 21/21 (sete versões de patch atrasadas), `ios.buildNumber` removido do app config (o EAS controla, com `appVersionSource: remote`) e `channel` removido dos perfis do `eas.json` (sem `expo-updates`, era ignorado).
   - **O comando precisa de terminal de verdade:** a Apple exige o código de dois fatores numa sessão interativa, e o `!` do Claude Code roda sem TTY.
10. [x] **Enviado ao App Store Connect em 25/09/2026.** App ID **6815939474**, versão 1.0.0, build 2.
   - Chave de envio criada com papel **APP_MANAGER**, não ADMIN: ela fica guardada nos servidores do Expo e só precisa subir build. ADMIN daria à mesma chave poder sobre usuários, acordos e dados bancários da conta.
   - TestFlight: https://appstoreconnect.apple.com/apps/6815939474/testflight/ios
11. [ ] Instalar pelo TestFlight e percorrer `checklists/publicacao.md` no aparelho. **Só agora dá para testar ícone, splash e Face ID** — nada disso existe no Expo Go.
12. [ ] Ficha da App Store: nome, subtítulo, descrição, palavras-chave, categoria, capturas de tela (tamanhos em `imagens.md`) e URL da política (https://nerosaude.com.br/privacidade).
13. [ ] Questionário de privacidade da App Store, respondido a partir da política. O ponto sensível: dados de saúde **são** coletados e **são** vinculados à identidade, mas **não** servem a rastreamento nem publicidade.

## Política de privacidade (24/09/2026)

- **Texto:** `docs/nero/publicacao/politica-de-privacidade.md`, sem campos em aberto.
- **Página:** `site/privacidade.html` + `site/index.html` (redireciona). HTML puro, tema claro/escuro, sem dependências.
- **No app:** botão "Política de privacidade" em Minha Saúde, abaixo de Excluir conta. A URL vive em `src/core/publicacao.ts`, num lugar só.
- **Hospedagem:** Hostinger (Apache). Subir `site/index.html` em `public_html/` e `site/privacidade/index.html` em `public_html/privacidade/`. A pasta com index dentro é o que faz a URL funcionar sem `.html`. Passo a passo em `site/README.md`.
- **Falta:** subir os dois arquivos e colar a URL nas fichas das duas lojas.
- **CPF:** decidido em 24/09 que fica. A conta das lojas é pessoa física, e o nome do titular aparece na ficha de qualquer forma.
- **Backups confirmados** em 24/09; a seção 8 está honesta.
- **Correção feita na mesma conferência:** o painel avisa que os backups **não incluem o Storage**, e é lá que ficam laudos, fotos de exame e PDFs de relatório. A política dava a entender que tudo tinha cópia de 7 dias. O texto agora separa as duas coisas: o banco tem 7 dias; os arquivos não têm cópia nenhuma — some na hora quando o paciente exclui (melhor para privacidade) e não há como restaurar se for perdido (pior para durabilidade).
- **No ar desde 24/09** em https://nerosaude.com.br/privacidade, com HTTPS. Publicação por `npm run site:publicar`; a Vercel republica sozinha a cada push.

## Depois do primeiro build
- Capturas de tela (tamanhos em `imagens.md`), textos da ficha (descrição curta/longa, categoria "Saúde e fitness" ou "Medicina"), questionário de privacidade da App Store e "Segurança dos dados" do Play (ambos respondidos a partir da política).
- Apple: apps de saúde precisam declarar que não são dispositivo médico; ressalvas §26/§40 já cobrem no app.
