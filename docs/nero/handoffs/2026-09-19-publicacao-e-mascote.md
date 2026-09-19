# Handoff: NERO — publicação (pendências) e mascote animado

**Data:** 19/09/2026
**Status:** em andamento — preparação para as lojas quase toda feita do lado técnico; falta o que depende do Murilo + validação dos clipes do mascote

> Para a próxima sessão do Claude Code: ler este arquivo, depois `docs/nero/publicacao/README.md` (fila do que falta), `docs/nero/00-ROADMAP.md` (topo) e `02-DECISOES.md` (D-012–D-015). Handoff anterior: `2026-09-18-preparar-publicacao.md` (contexto de projeto, método do Murilo, operacional — continua válido).

## 1. Objetivo
Publicar o NERO na App Store e no Play. Nesta sessão (18–19/09) fizemos tudo que não dependia do Murilo, mais o mascote animado que ele pediu no meio do caminho. O que resta é quase todo dado externo (contas, bundle id, política) e o teste no aparelho.

## 2. Contexto essencial
- Projeto Expo SDK 57 / Expo Router / Supabase (`ycljqpwpeoonqisqdrws`). Branch `desenvolvimento-2`, tudo no GitHub (`murilin1711/rastreio-app`). Último commit: `ada419c`.
- **Metro roda em modo CI (`npm run rotas`) e NÃO recarrega ao salvar arquivo**: depois de qualquer mudança, rodar `npm run rotas` de novo e o Murilo fecha/reabre o app no Expo Go. Esquecer isso fez o Murilo ver código velho duas vezes nesta sessão.
- Expo Go novo não tem "Enter URL manually": o Murilo abre pelo QR (`~/Desktop/nero-qr.png`, gerado com `node -e "require('qrcode').toFile(...)"`) ou digitando `exp://<IP>:8081` no Safari. IP do Mac em 19/09: `192.168.1.17` (`ipconfig getifaddr en0`).
- Decisões desta sessão (todas em `02-DECISOES.md`):
  - **D-012** configuração nativa: `app.json` com permissões pt-BR (câmera/fotos/documentos/notificações, microfone bloqueado), `ITSAppUsesNonExemptEncryption: false`, `eas.json` (development/preview/production), canal Android `lembretes` + handler de primeiro plano (`src/core/lembretes/configurar.ts`), `expo-sensors` e `lottie-react-native` removidos.
  - **D-013** exclusão de conta: função SQL `excluir_minha_conta()` (migração 0014, **já na nuvem**), o app esvazia os buckets pela Storage API antes (o Storage bloqueia `delete` direto), tela `Minha Saúde → Excluir minha conta`. 9 pgTAP + 4 Jest.
  - **D-014** nome nas lojas: **"Nero Saúde"** (`expo.name`); slug/scheme continuam `nero`.
  - **D-015** mascote animado por clipes image-to-video → WebP com alpha via `expo-image`. Rejeitados: rig 3D do Meshy + Blender (Murilo achou difícil demais) e só animação por código (fica estático).
- Imagens finais: ícone iOS/adaptativo/mono, splash (só o símbolo), favicon, `assets/images/loja/icone-play-512.png`, `assets/images/nero/mascote-nero.png`. A logo completa nova veio em JPG com xadrez pintado — descartada; `logo-nero.png` antiga segue na tela de login.
- Senha do banco foi digitada no chat em 18/09 (não está em arquivo). Recomendar troca no dashboard após a publicação.

## 3. O que já foi feito
1. 18/09: D-012, D-013, D-014, política de privacidade (rascunho com `[[ ]]`), `docs/nero/publicacao/` (README, imagens, política), checklist `checklists/publicacao.md`, Supabase CLI 2.117, migração 0014 na nuvem, ícones/splash a partir das artes do Murilo.
2. 19/09: mascote — clipes **repouso** (loop 4,4 s, 88 frames) e **acenar** (3 s, toca uma vez) gerados pelo Murilo por IA a partir do PNG; processados por `scripts/processar-clipe-nero.py` (extrair frames com ffmpeg → recorte por silhueta → WebP via `img2webp`). Componente `src/ui/components/NeroAnimado.tsx` (`clipe`, `entrada` toca uma vez e cai no loop; largura fixa pela proporção do clipe mais largo; remonta por `key`). Em uso: Home (`entrada="acenar"`, ao lado da saudação), Minha Saúde, Bem-estar. Prompts dos clipes 3 (comemorar) e 4 (pensando) em `docs/nero/mascote/animacoes.md`.
3. 19/09: **bug real encontrado e corrigido** — "Maximum update depth exceeded" na tela do Cardio: `useGlicemia` devolvia `recarregar` novo a cada render e a tela o usava como dependência do `useFocusEffect`. Corrigido com `useCallback`; teste de regressão `src/core/cardio/__tests__/telaCardio.test.tsx` renderiza a tela com repositórios simulados (padrão útil para outras telas). Commit `44e9162`.
4. Tentativas descartadas no recorte do mascote (para não repetir): regra "sombra = bege escurecido" por cor (comia o branco sombreado do corpo → barriga/mãos piscando); limiar duplo com crescimento limitado (franja nos pés); `img2webp -exact -kmax 1` (não ajudou); `transition` cross-dissolve do `expo-image` na troca de clipe (suspeito de piscar; removido). O que ficou: limiar 14 no corpo / 22 tornozelos / 34 chão, `binary_fill_holes` + maior componente, mediana temporal de 3 frames no alpha, corte lateral fixo no chão pela largura das pernas do frame 0, normalização de escala/posição pela cabeça e pés.

## 4. Estado atual
- 363 Jest, 39 pgTAP, `tsc` limpo, `expo-doctor` 21/21. `git status` limpo.
- **Clipes aprovados pelo Murilo em 19/09** ("ficou perfeito"), depois da correção da mão piscando branco ao acenar (`70d27d6`, ver `../mascote/animacoes.md`). `repouso.webp` nunca foi regerado desde a versão aprovada.
- Home: mascote alinhado pela base, colado à saudação (`086e092`) — aprovado em 19/09.
- Checklists 2a/2b/3/4a/4b e `publicacao.md` continuam **não rodados** no aparelho. O bug do Cardio só apareceu porque ele abriu a tela pela primeira vez; esperar mais desse tipo ao rodar os checklists.

## 5. Próximos passos
1. ~~Murilo confirma repouso/aceno e o alinhamento na Home.~~ Feito em 19/09. Gerar **comemorar** e **pensando** (prompts em `docs/nero/mascote/animacoes.md`): `mkdir -p /tmp/x/frames && ffmpeg -i video.mp4 /tmp/x/frames/f%03d.png`, achar o trecho por folha de contato (`ffmpeg -vf "select='not(mod(n,12))',scale=120:-1,tile=10x2" -frames:v 1`), depois `python3 scripts/processar-clipe-nero.py /tmp/x/frames assets/animacoes/nero/<nome>.webp <ini> <fim> <loop 0|1>`; registrar em `CLIPES` do `NeroAnimado.tsx` (largura/altura/duração) e usar: comemorar em meta batida/check-in/exame em dia; pensando enquanto gera PDF.
2. Decidir onde o Nero acena no primeiro contato: recomendação **A** = tela de login (o onboarding tem miniaturas aprovadas na Fase 0; não mexer).
3. Política de privacidade: Murilo preenche os `[[ ]]` (responsável/CPF/cidade, e-mail de contato, encarregado = ele, idade mínima 18, plano do Supabase para o prazo de backup, hospedagem = GitHub Pages recomendado). Depois: publicar a URL, referenciar em App Store Connect / Play Console.
4. Contas Apple Developer (PF) e Google Play Console — Murilo abre; **bundle id** (recomendação `com.nerosaude.app`; permanente) → `ios.bundleIdentifier` e `android.package` no `app.json`.
5. `eas init` (conta Expo `murilorp1711`) → `eas build --profile preview --platform ios` → TestFlight; Android APK interno.
6. Rodar `docs/nero/checklists/publicacao.md` + fases 2a–4b no aparelho; corrigir sob demanda (uma por vez).
7. Reativar confirmação de e-mail no Supabase Auth e testar cadastro; revogar token antigo do CLI; trocar a senha do banco.
8. Capturas de tela e textos das fichas (tamanhos em `docs/nero/publicacao/imagens.md`).

## 6. Perguntas em aberto
- Bundle id: tem domínio próprio? Senão, `com.nerosaude.app`.
- Plano do Supabase (Free ou Pro) — define o texto de backup na política.
- Nero na tela de login (A) ou no primeiro slide do onboarding (B)?

## 7. Artefatos relevantes
- `docs/nero/publicacao/README.md` (fila), `politica-de-privacidade.md`, `imagens.md`; `docs/nero/mascote/animacoes.md`; `docs/nero/checklists/publicacao.md`.
- `scripts/processar-clipe-nero.py` (env: `LIM_CORPO`, `MEDIANA_T`); `src/ui/components/NeroAnimado.tsx`; `src/core/lembretes/configurar.ts`; `src/core/sessao/excluirConta.ts`; `supabase/migrations/0014_excluir_conta.sql`.
- Comandos: `npx tsc --noEmit && npx jest --ci` · `npx supabase db reset && npx supabase test db` (Docker aberto) · `npm run rotas` (reinicia o Metro; obrigatório após qualquer edição) · `SUPABASE_DB_PASSWORD='<senha>' npx supabase db push`.
- Vídeos originais do Murilo: `~/Downloads/The_exact_same_D_cartoon_char.mp4` (repouso) e `-2.mp4` (aceno).

## 8. Instruções para a próxima sessão
- Português com acentos; uma decisão por vez com recomendação; registrar em `02-DECISOES.md` (D-016+) e nos docs antes de executar. Commits com `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, sempre após `tsc` + Jest.
- Depois de editar qualquer arquivo do app: `npm run rotas` e pedir para o Murilo reabrir o app — senão ele avalia código velho.
- No mascote: **não** mexer no pipeline sem comparar com a versão aprovada (hash do `2deb722`); mudanças de máscara "por cor" já provaram que quebram o corpo. Se algo piscar, primeiro perguntar *onde* e *quando*.
- Não mudar regras clínicas sem fonte; não inventar textos clínicos.
- Para dados externos das lojas (ids, nomes, e-mails), confirmar com o Murilo — nunca presumir.
