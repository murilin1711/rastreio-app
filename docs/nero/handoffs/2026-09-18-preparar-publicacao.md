# Handoff: NERO — preparar publicação nas lojas

**Data:** 18/09/2026
**Status:** em andamento — todas as 4 fases do roadmap implementadas; próxima etapa é validação e preparação para publicar

> Para a próxima sessão do Claude Code: ler este arquivo, depois `docs/nero/00-ROADMAP.md` (topo: "Fila do Murilo") e `docs/nero/02-DECISOES.md`.

## 1. Objetivo
O app Rastreando virou a plataforma NERO (4 módulos: Rastreando, Coração & Metabolismo, Minha Saúde, Saúde & Bem-estar). Código completo, mesclado em `desenvolvimento-2` e na nuvem. Agora: validar no aparelho, corrigir o que aparecer e preparar para App Store / Play Store.

## 2. Contexto essencial
- **Projeto:** `~/Desktop/App de Rastreio/app-de-rastreio` (Expo SDK 57, Expo Router com rotas tipadas, Supabase remoto `Nero Saude APP`, ref `ycljqpwpeoonqisqdrws`, São Paulo). Remoto Git `origin` = `github.com/murilin1711/rastreio-app`, branch de trabalho `desenvolvimento-2`. **Não deixar o projeto no iCloud** (em 18/09 o iCloud absorveu a Mesa e o git travou; o Murilo devolveu a pasta ao Desktop).
- **Fonte da verdade:** `docs/nero/00-ROADMAP.md`, `02-DECISOES.md` (D-001–D-011, C-001–C-020), `funcionamento/*.md` (como cada regra funciona e a fonte), `referencias/REFERENCIAS.md` (acervo com PDFs).
- **Método do Murilo (médico):** uma decisão por vez com recomendação; ele responde curto; registrar tudo em `.md` na hora; regras clínicas sempre com fonte real e atual, preferindo sociedade brasileira (ex.: corrigimos a cintura para ≥ 90/≥ 80 pela IDF/ABESO 2016 depois que ele trouxe o material da professora). Sem legendas de cores nos docs.
- **Regras clínicas** vivem em `regras_clinicas` (94 ativas na nuvem) + lógica TS pura testada em `src/core/regras/**`. Nenhuma cor de alerta em bem-estar; relatórios organizam, não interpretam; ressalvas literais §26/§40.
- **Commits:** rodapé `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`. `npx tsc --noEmit && npx jest --ci` antes de cada commit; `npm run rotas` após rota nova (reinicia o Metro).
- **Operacional:** Docker Desktop precisa estar aberto para `supabase db reset/test`; `db push` usa `SUPABASE_DB_PASSWORD` (senha do Murilo, pedir na hora); a rede pode bloquear 5432/6543 por um tempo — se falhar, tentar de novo. O classificador do modo automático às vezes cai; nesse caso usar Write/Edit em vez de Bash com heredoc.

## 3. O que já foi feito
- Fases 0–4 implementadas e mescladas em `desenvolvimento-2`. 350 Jest, 30 pgTAP, `tsc` limpo. Migrações 0001–0013 na nuvem; semente completa.
- Fase 3 (18/09): documentos, relatórios PDF + QR (URL assinada 7 dias), preparar consulta, lembretes/preferências/consultas, exames, linha do tempo.
- Fase 4 (18/09): C-015–C-020 aprovadas; corpo (IMC/RCA/RCQ/tendência/PMAV), atividade, sono, alimentação, vínculo glicemia ↔ refeição, metas, check-in, relatório de hábitos.
- 6 PDFs de revisão de textos em `~/Downloads/NERO - Revisões de textos/` (gerados por um `md2pdf.py` de scratchpad, fora do repo; o gerador `make-pdf` do gstack foi descartado por quebrar tabelas largas).

## 4. Estado atual
- Tudo commitado e no GitHub; `git status` limpo. Nada quebrado conhecido.
- **Sessão 2 (18/09, tarde):** D-012 (app.json/eas.json/notificações/limpeza de deps/política rascunho) e D-013 (exclusão de conta: migração 0014 na nuvem), D-014 (nome "Nero Saúde"). 358 Jest, 39 pgTAP. Docs em `docs/nero/publicacao/`.
- **Nunca testado no aparelho:** Fases 3 e 4 inteiras (PDF via `expo-print`, QR via `qrcode` no Hermes, upload no Storage, vínculo de glicemia, notificações de consulta). Checklists prontos.
- O mascote Nero ainda é o símbolo da logo em todas as variantes (`src/ui/components/NeroImage.tsx`).
- Supabase Auth com confirmação de e-mail **desativada** desde a Fase 0 (facilitar testes).
- Supabase CLI atualizado para v2.117 em 18/09; token do CLI da Fase 0 ainda não revogado.

## 5. Próximos passos
1. Murilo roda os checklists no aparelho (`docs/nero/checklists/fase-2a, 2b, 3, 4a, 4b.md`) e revisa os textos (PDFs em Downloads / `docs/nero/revisao/`). Correções sob demanda, uma por vez. Texto clínico muda em `supabase/seed.sql` (linha da regra) e na nuvem via `psql` com `update` explícito (a semente é `on conflict do nothing`, não atualiza mensagens existentes).
2. Pendências técnicas: PNG transparente do mascote (o Murilo fornece); reativar confirmação de e-mail no Auth (dashboard) e testar o cadastro; revogar token do CLI antigo; atualizar Supabase CLI.
3. Preparação para lojas, na ordem sugerida: ícone e splash (`app.json`/`assets/`); `app.json` com bundle id iOS / package Android e textos de permissão em português (câmera, fotos, notificações); política de privacidade (dados de saúde, LGPD, bucket `laudos`, QR de 7 dias, retenção) publicada em URL; `eas build` (perfil `preview` → TestFlight / teste interno Play); revisar `expo-notifications` em produção (permissões, canal Android).
4. Depois: decidir sobre o "futuro" da spec (foto da refeição, wearables, mascote 3D, lado profissional).

## 6. Perguntas em aberto
- Nome final nas lojas ("NERO"? conflito de marca?), bundle id, contas de desenvolvedor Apple/Google — o Murilo já tem?
- Onde hospedar a política de privacidade (GitHub Pages do repositório é o mais simples).
- Fase de testes: TestFlight fechado com quantas pessoas antes de abrir?

## 7. Artefatos relevantes
- `docs/nero/00-ROADMAP.md`, `02-DECISOES.md`, `checklists/`, `revisao/`, `funcionamento/`, `referencias/`; `docs/superpowers/specs/` e `plans/` (Fases 0–4).
- Comandos: `npx tsc --noEmit && npx jest --ci` · `npx supabase start && npx supabase db reset && npx supabase test db` · `SUPABASE_DB_PASSWORD='<senha>' npx supabase db push` · Metro: `npm run rotas` (ou `CI=1 nohup npx expo start`; QR `exp://<IP>:8081`; conta Expo `murilorp1711`).
- Memória persistente do Claude Code: `~/.claude/projects/-Users-muriloroizpovoa-Desktop-App-de-Rastreio/memory/` — atualizada com o estado de 18/09.

## 8. Instruções para a próxima sessão
- Português com acentos; uma pergunta por vez, com recomendação; registrar decisões em `02-DECISOES.md` (D-012+, C-021+) antes de executar.
- Não reescrever nem "melhorar" regras clínicas sem fonte; diretriz nova → verificar edição e registrar em `REFERENCIAS.md` antes.
- Não inventar textos clínicos: mensagens vêm de `regras_clinicas`; textos de tela em `src/modules/*/conteudo/`.
- Antes de qualquer `db push`, `supabase test db` local com Docker aberto. Nunca `--force`.
- Para publicação, confirmar com o Murilo cada dado externo (ids, nomes, e-mails de contato da política) — não presumir.
