# Handoff: NERO — trilho das lojas (política, backup, confirmação por e-mail) e água no relatório

**Data:** 22/09/2026
**Status:** em andamento — **servidor todo validado; nada foi testado no aparelho**

> Nova sessão: ler este arquivo, depois `docs/nero/publicacao/README.md` (fila das lojas), `docs/nero/checklists/publicacao.md` (tem o teste do código de confirmação) e `02-DECISOES.md` (**D-018 a D-021**). Handoffs anteriores: `2026-09-19-adesao-e-agua.md` (adesão, água, mascote — continua válido) e `2026-09-19-publicacao-e-mascote.md`.

## 1. Objetivo
Destravar o caminho até as lojas. O Murilo escolheu atacar o trilho de publicação (política de privacidade, infraestrutura, confirmação de e-mail) em vez de validar no aparelho o bloco de adesão de 19/09. De quebra, implementar a D-020 (água no relatório), que não dependia de nada dele.

## 2. Contexto essencial

- Branch `desenvolvimento-2`, repositório `murilin1711/rastreio-app`. Último commit: `71d1f4a`. **448 Jest, `tsc` limpo, `expo-doctor` 21/21.** Migrações 0001–0019 na nuvem.
- **Projeto Supabase:** `ycljqpwpeoonqisqdrws` ("Nero Saude APP"), região São Paulo, org `hardzrbvlwnrvfjpaleq` — **agora no plano Pro** (D-018).
- **Domínio registrado: `nerosaude.com.br`** (22/09). Destravou bundle id, remetente de e-mail e URL da política.
- **Regras que atravessam o trabalho:** D-016 (o Nero comemora **só comportamento**, nunca resultado clínico) continua valendo para qualquer coisa nova. Regras clínicas só com fonte real e atual, preferindo sociedade brasileira.
- Metro em CI não recarrega ao salvar: depois de editar, `npm run rotas` e o Murilo fecha/reabre o app. **Rota nova exige `npm run rotas` antes de o `tsc` passar** — aconteceu de novo com `/(auth)/confirmar`.

## 3. O que já foi feito

**D-018 — Backup (o assunto que mais mudou de forma)**
1. A política dizia "cópias sobrescritas em até 7 dias". **Verificado: isso é o plano Pro. O Free não tem backup nenhum**, nem para download.
2. Primeira decisão do Murilo foi ficar no Free **sem dump**. Ele supôs que dump declarado atrapalharia a aprovação nas lojas — **verificado e não procede**: nem Apple, nem Google, nem a LGPD proíbem backup declarado; o que reprova é manter cópia sem declarar.
3. Ao perguntar "como recebo o backup automático?", ficou claro que **não existe o que receber** no Free. Opções com paciente real: **(A)** Pro · **(B)** backup próprio automatizado (GitHub Actions + armazenamento grátis) · **(C)** nada. **(C) descartada** para paciente real; **(B) descartada** porque colocaria prontuários de terceiros **sob guarda pessoal do Murilo**.
4. Ele lembrou que **já tinha uma organização com Pro**. Decisão: **transferir o projeto** — custo marginal de **~US$ 10/mês** (a assinatura de US$ 25 e o crédito de computação são por organização e já estavam consumidos pelo `menulive-app`).
5. **Obstáculo:** a lista de destinos vinha vazia porque a org Pro está em **outro e-mail** dele. A transferência exige a **mesma conta** como dona da origem e membro do destino. Resolvido **convidando a conta do NERO como Owner** da org Pro — e **não** criando projeto novo com migração, caminho descartado porque traria URL e chaves novas, migração manual dos usuários do Auth (risco de órfãos, já que `user_id` carimba tudo) e reenvio um a um dos buckets `laudos` e `relatorios`, que o dump não leva.
6. **Transferência concluída.** Verificado do lado do código que **nada técnico mudou**: mesmo ref, mesma URL, chave anônima funcionando (REST e Auth em HTTP 200).

**D-019 — Confirmação de e-mail por código**
7. `db522e4` — app pronto. `src/core/auth/codigo.ts` (puro, 12 testes) + `app/(auth)/confirmar.tsx` (6 testes de regressão). A tela **verifica sozinha ao sexto dígito**, sem botão de confirmar. Aceita código colado com espaços ou "Código:" junto.
8. **Beco sem saída fechado:** quem se cadastrava, não confirmava e tentava **entrar** travava num alerta. O login agora detecta o e-mail não confirmado (e só ele — senha errada continua senha errada), reenvia o código e leva à tela certa.
9. `60355ee` — **configuração aplicada e verificada via Management API** (`scripts/configurar-auth.mjs`). Domínio **verified** no Resend (região `sa-east-1`). SMTP, assunto, template com `{{ .Token }}`, 6 dígitos, validade 1 h, 1 e-mail/min por endereço, `rate_limit_email_sent` de 2 → 100, `mailer_autoconfirm: false`.
10. **Teste de ponta a ponta:** cadastro real pela API → log do Resend com **`status=delivered`**, assunto "Seu código do Nero Saúde", remetente do domínio próprio.

**D-020 — Água no relatório** · `45775f0`
11. Seção `agua` entre alimentação e atividade; regra pura `resumoAguaSemana` (6 testes). **Sequência de dias ficou de fora**, com teste de regressão.

**D-021 — Domínio e identificadores** · `bcbea3f`
12. Bundle id **`br.com.nerosaude.app`** (iOS e Android), domínio invertido de `nerosaude.com.br`. Política aponta para `https://nerosaude.com.br/privacidade`.

**Política de privacidade** — atualizada com água, sequência/conquistas, insuficiência cardíaca (campo novo da 0018), lembretes de água, Resend como operador, exclusão com backup de 7 dias, 18+ e e-mail de contato.

## 4. Estado atual

- **Nada foi testado no aparelho.** Todo o trabalho desta sessão foi validado por teste automatizado e por chamada de API — **nenhuma tela foi aberta**.
- `git status` limpo, local e remoto em `71d1f4a`.
- **Achado que corrige o handoff anterior:** `src/core/bemestar/__tests__/useAgua.test.tsx` **nunca havia rodado** — estourava na importação e o Jest contava a suíte como **0 testes**, por isso os "420" de 19/09 não a incluíam. Corrigido (mock de `lembretesAgua`); os 2 testes passam. Confirmado rodando em `HEAD` antes da correção.
- **Aviso de worker do Jest é pré-existente** (confirmado em `HEAD`), não foi introduzido agora.
- **Incerteza única e conhecida:** `verifyOtp({ type: 'signup' })` em `app/(auth)/confirmar.tsx`. É o que o template "Confirm signup" emite, mas `EmailOtpType` também aceita `'email'`. **Só o teste no aparelho decide.** Sintoma: e-mail chega, tela recusa o código.

## 5. Próximos passos

1. **Contas Apple Developer e Google Play** — virou o **maior bloqueio**. Sem elas não há `eas build`, TestFlight nem teste interno, e a aprovação da Apple demora. Nada no código adianta isso.
2. **Rodar `docs/nero/checklists/publicacao.md`**, que ganhou três blocos novos: confirmação por código (9 itens), backup e água no relatório.
3. **Duas pendências criadas pela configuração de 22/09:** apagar o usuário de teste `nerosaude+teste1@gmail.com` (id `c8c75d7e-e0cc-41d8-b901-6acef5bdf703`) em Authentication › Users, e **revogar o token da Supabase** criado para configurar (foi colado no chat).
4. **Confirmar em Database › Backups** que os backups diários apareceram. **A política não pode ser publicada antes disso** — a seção 8 promete as cópias de 7 dias.
5. **Ligar 2FA nas duas contas Supabase** — ambas abrem o banco de prontuários; a mais fraca define a segurança.
6. **Preencher os 2 campos restantes da política:** nome completo ou razão social + CPF/CNPJ, e cidade/UF (seção 1). A data de publicação se preenche no dia.
7. Publicar a política em `https://nerosaude.com.br/privacidade`.
8. Rodar os demais checklists (`fase-2a`, `2b`, `3`, `4a`, `4b`) — **nenhum rodado até hoje**, cobrem o app inteiro.
9. Validar no aparelho o bloco de adesão de 19/09 (selo de sequência, água, lembretes, modal de permissão) — **continua sem validação desde então**.
10. Clipe **pensando** do mascote (último do conjunto; prompt em `mascote/animacoes.md`) — medir enquadramento antes de processar.

## 6. Perguntas em aberto
- O relatório **geral** (`SECOES_GERAL`) não recebeu a seção de água — só o de hábitos, que foi o que a D-020 decidiu. Como o geral é a união de tudo e já tem sono/atividade/alimentação, ficou uma lacuna. **Perguntar ao Murilo.**
- Plano do Supabase: resolvido para agora (Pro). Revisar se o custo de ~US$ 10/mês incomodar.
- A conquista de água ("bateu a meta") é diária por decisão dele; observar no uso se cansa.

## 7. Artefatos relevantes
- Decisões: `docs/nero/02-DECISOES.md` — **D-018** (backup/Pro), **D-019** (código por e-mail), **D-020** (água no relatório), **D-021** (domínio, bundle id, URL).
- Política: `docs/nero/publicacao/politica-de-privacidade.md` (2 lacunas) · Fila das lojas: `docs/nero/publicacao/README.md` · Texto do e-mail: `docs/nero/publicacao/email-confirmacao.md`.
- Código novo: `src/core/auth/{codigo.ts,__tests__/}`, `app/(auth)/confirmar.tsx`, seção `agua` em `src/core/relatorios/montar.ts`, `resumoAguaSemana` em `src/core/regras/bemestar/agua.ts`.
- **Configuração do Auth:** `scripts/configurar-auth.mjs`. Simula por padrão; `--aplicar` grava; `--ligar-confirmacao` é flag separada. Segredos por variável de ambiente, nunca em disco:
  `SUPABASE_ACCESS_TOKEN=... RESEND_API_KEY=... node scripts/configurar-auth.mjs`
- Comandos: `npx tsc --noEmit && npx jest --ci` · `npx supabase db reset && npx supabase test db` (Docker aberto) · `npm run rotas` · `npm run db:types` · `SUPABASE_DB_PASSWORD='<senha>' npx supabase db push`.

## 8. Instruções para a próxima sessão
- Português com acentos; **uma decisão por vez, com recomendação**; registrar em `02-DECISOES.md` antes de executar. Commits com `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, sempre depois de `tsc` + Jest.
- **TDD de verdade:** escrever o teste, **ver falhar pelo motivo certo**, depois implementar. Rendeu duas capturas nesta sessão — a fixture de água com formato errado (NaN no relatório) e o `mailer_otp_length` em 8, que teria travado todo cadastro.
- **Modo de simulação antes de gravar em produção.** Foi assim que o `otp_length` apareceu. Qualquer script que toque a configuração da nuvem deve simular por padrão.
- **Segredos:** o Murilo colou no chat a senha do banco (2×, em set.), a chave do Resend e um token da Supabase. Ele **autorizou** explicitamente no caso dos dois últimos, depois de a alternativa por arquivo ter sido oferecida e recusada. Registrar a recomendação de revogar e seguir — **não repetir o alerta**.
- **Não comemorar nada ligado a resultado clínico** (D-016). Vale para qualquer coisa nova.
- Tela nova com efeito que grava e recarrega: escrever o teste de regressão **e conferir que ele falha sem a proteção**.
- Depois de editar: `npm run rotas` e pedir para ele reabrir o app, senão avalia código velho.
- **Não afirmar que algo funciona sem medir.** Nesta sessão, "a transferência não muda URL nem chaves" só foi dito depois de HTTP 200 em REST e Auth; "o e-mail funciona" só depois de `status=delivered` no log do Resend.
