# Handoff: build 3, onboarding novo e lote do build 4

**Data:** 27/09/2026 · **Status:** em andamento. Tudo commitado e no GitHub (`desenvolvimento-2`, último `f093cd8`). O lote do build 4 está acumulando; **não publicar sem o Murilo pedir.**
**Anterior:** [`2026-09-25-crash-lembretes-e-horarios.md`](2026-09-25-crash-lembretes-e-horarios.md)

## 1. Objetivo

Deixar o NERO pronto para as lojas. Esta sessão (25/09 à noite → 27/09) gerou o **build 3** (TestFlight), publicou a primeira **atualização pelo ar** e acumulou um lote grande para o **build 4**: logins Apple/Google corrigidos, onboarding novo com o Nero falando (D-063), termos/consentimento, créditos, comemorar v2.

## 2. Contexto essencial

- Expo SDK 57, RN 0.86, expo-router 57, Supabase (ref `ycljqpwpeoonqisqdrws`). **Testes: 610 Jest + 69 pgTAP**, `tsc` limpo, `expo-doctor` 21/21. Migrações na nuvem até **0022**.
- **O Murilo quer publicar em lotes:** nada de build nem `eas update` a cada mudança; só quando ele pedir. Commit + push no GitHub continuam normais (é backup). Memória `nero-publicar-em-lotes`.
- **Não mexer no mouse do Mac enquanto o Murilo usa o computador** (os toques no simulador movem o cursor dele). Para ver telas sem mouse: links diretos (`xcrun simctl openurl booted "exp://127.0.0.1:8082/--/<rota>"`) e, no onboarding, o atalho **só de desenvolvimento** `/onboarding?passo=relatorio` (fechar o Expo Go antes: o link não reinicia uma tela já aberta).
- Uma decisão por vez, com opções e prévia (`AskUserQuestion`); tudo registrado em `.md` (`02-DECISOES.md`, `PENDENCIAS.md`).

## 3. O que foi feito (D-047 a D-063, todas em `docs/nero/02-DECISOES.md`)

- **D-047** lembrete recusado pelo iOS fica silenciado; **D-048** remédio/glicemia/água = um aviso `DAILY` por horário (teto de 64 do iOS); sair/excluir conta apagam os avisos (`src/core/sessao/sair.ts`).
- **D-049** Agenda: card "Todo dia"/"Toda semana" (rotina) separado do pontual; botões do relatório no topo. **D-050** tabela da prévia sem palavra quebrada (vira blocos quando não cabe).
- **D-051** módulo "Rastreamentos" (rotas continuam `rastreando`); cartão do relatório renomeado. **D-052** "perfil completo" comemorado onde acontece. **D-053** faixa de atalhos na Home. **D-054** a seta de voltar leva de onde a pessoa veio (`src/core/navegacao/`, `voltarPara`).
- **D-055** onboarding termina em Criar conta. **D-056** termos de uso + consentimento (tabela `consentimentos`, 0021; **caixa única** por escolha do Murilo; tela "Antes de continuar" para contas antigas). **D-057** "Fale com o NERO" (e-mail **nerosaudeapp@gmail.com**). **D-058** Sentry (região UE, sem dado de saúde, `src/core/erros/`). **D-059** `expo-updates` (runtime por fingerprint, canais). **D-060** lembrete do check-in (domingo 10h, terça 19h só se não respondeu).
- **D-061** entrar com Apple e Google (0022: nome vindo do Google). **D-062** logo em Criar conta e créditos "Criado por Murilo Roiz Póvoa e Dra. Denise Padilha (CRM/AL 12430)". **D-063** onboarding novo: 7 telas, o Nero fala palavra por palavra, três demonstrações, nome que preenche o cadastro, pergunta dos avisos antes do sistema. Ajustado em várias rodadas com o Murilo (ver seção D-063).
- Mascote: **comemorar v2** (loop 5,25 s, olhos abertos, 640 px, centrado pelo tronco); `NeroAnimado` ganhou `pausaMs` e `larguraDaCaixa` (a caixa só alarga onde o comemorar aparece, para não mexer na Home e em Minha Saúde).
- Infra: build 3 no TestFlight (commit `76d93af`); atualização pelo ar `0084e967` (logo + créditos sem CRM) no runtime `a02e9b33`; contas de teste apagadas; política e termos publicados em nerosaude.com.br (a política **ainda descreve duas caixas**: publicar a versão nova junto com o build 4).
- **Descartado:** o botão oficial da Apple (sai em inglês) → botão próprio "Continuar com a Apple"; nonce no login Apple (formato web, falhou no aparelho) → sem nonce, como o exemplo oficial da Supabase para Expo; Reanimated nas demos e gesture-handler no voltar → `Animated` e `PanResponder` do RN (rodam nos testes sem configuração).

## 4. Estado atual

- **Build 3** no TestFlight. Testado pelo Murilo: Apple falhou ("não foi possível concluir") e Google deu "custom scheme não permitido para cliente Web". **Os dois foram corrigidos no código, mas só valem no build 4:** IDs do Google estavam trocados (Web = `…btk37n764…`, iOS = `…rg4u675l…`; o `iosUrlScheme` no `app.json` é nativo) e o login Apple ficou sem nonce. Falha de login agora vai ao Sentry (`registrarErro`, marca `login`).
- **Onboarding novo (D-063):** as 7 telas foram vistas no simulador **no estado final** (atalho `?passo=`). Animações em movimento e a pergunta dos avisos (o Expo Go já tem permissão decidida) só no aparelho.
- **Nitidez do Nero:** repouso, acenar e pensando continuam em 360 px e ficam macios no onboarding (padrão 1, até 290 pt). O comemorar já está em 640 px.
- A conta do Murilo, no app, está na tela **"Antes de continuar"** (ele não aceitou ainda). A chave "Check-in semanal" dele ficou **desligada** nos testes; pedir para religar em Agenda › Preferências.

## 5. Próximos passos

1. Esperar o Murilo: **vídeo do pensando v2** (prompt em `docs/nero/mascote/animacoes.md`, "Prompts v2") e, se ele achar, os **vídeos originais do repouso e do acenar** (19/09) para regerar em 640 px. Processar como o comemorar v2 (seção "Clipe 3 v2" do mesmo arquivo): medir o centro pelo tronco (cabeça/tronco/pernas com limiar 70), vídeo horizontal → recortar 720 de largura e completar até 720 × 1280, `altura 640 q 80`.
2. Quando ele pedir o **build 4**, antes: (a) devolver `"ascAppId": "6815939474"` ao `submit.production.ios` do `eas.json` e criar `.fingerprintignore` com `eas.json` (ver `PENDENCIAS.md`); (b) conferir na Supabase › Auth › Google que o **ID Web vem primeiro** em Client IDs e o "Skip nonce check" está ligado (`curl .../auth/v1/settings` mostra só se está ligado); (c) `npx expo-doctor`; (d) `npx eas-cli build --platform ios --profile production --non-interactive --no-wait` e acompanhar; (e) `npx eas-cli submit --platform ios --id <build> --non-interactive`; (f) **publicar a política** (`npm run site:publicar`, o §5 descreve a caixa única).
3. No build 4, o Murilo confere: logins Apple e Google, "Antes de continuar", onboarding inteiro (ritmo, teclado na tela do nome, pergunta dos avisos), um erro chegando ao Sentry com arquivo e linha, e uma atualização pelo ar chegando.
4. Pendências do Murilo fora do código (`PENDENCIAS.md` §1): verificação em duas etapas nas duas contas Supabase; revogar os 2 tokens da Supabase, o token do Sentry (apareceu no chat) e a chave do Resend; conta do Google Play; ficha da App Store (descrição, palavras-chave, capturas, questionário de privacidade; nome "Nero Saúde", subtítulo "Sua saúde organizada", categoria Medicina); revisão jurídica dos termos e da política; revisões clínicas e checklists.

## 6. Perguntas em aberto

- Com o comemorar v2 em loop, o **modal de comemoração** (água, conquistas) ainda usa `entrada="comemorar"` → repouso após 5,25 s. Manter ou deixar em loop? Não perguntado.
- Falas escritas pelo Claude que o Murilo pode trocar: tela 5 "Seu histórico." / "Seus exames." / "Suas medicações." / "E muito mais."; tela 6 "Eu lembro da sua consulta." / "Eu te lembro de marcar seu exame." / "Eu te lembro de tomar água." / "E do que mais você precisar."
- Menores deixados de lado (D-063): texto "Voltar" invisível dentro da seta (para os testes); arrastar para a direita em cima do campo de nome também volta de tela.

## 7. Artefatos relevantes

- Spec e plano do onboarding: `docs/superpowers/specs/2026-09-26-nero-onboarding-nero-fala-design.md`, `docs/superpowers/plans/2026-09-26-nero-onboarding-nero-fala.md`. Roteiro: `src/core/onboarding/roteiro.ts` (falas, ritmo por tela, marcos que chamam os cartões); peças em `src/modules/onboarding/` (`Conversa`, `FalaNero`, `CenaNero`, `demos/`).
- Termos/política: `docs/nero/publicacao/{termos-de-uso,politica-de-privacidade}.md` → `npm run site:publicar` (gera `site/` e envia ao repositório que a Hostinger publica).
- Mascote: `docs/nero/mascote/animacoes.md`; `scripts/processar-clipe-nero.py <quadros> <saida.webp> <ini> <fim> <loop> [fps] [altura] [q]` com `FUNDO=linha|pixel`, `FECHAMENTO`, `Y0`, `Y1`, `CX`.
- Metro: `cd app-de-rastreio && nohup npx expo start --go --port 8082 > <log> 2>&1 &` (**sem `CI=1`**, que desliga o recarregamento ao salvar). Reabrir do zero: `xcrun simctl terminate booted host.exp.Exponent; xcrun simctl openurl booted exp://127.0.0.1:8082`.
- SQL administrativo na nuvem: `npx supabase db query --linked "<sql>"`. Migração: `npx supabase db push --dry-run` e depois `--yes` (sempre com o ok do Murilo). pgTAP local: Docker + `npx supabase db reset --local && npx supabase test db`.
- Atualização pelo ar: `npx eas-cli fingerprint:compare <runtime do build> --environment production` **antes** de `npx eas-cli update --channel production --environment production --platform ios --message "…"`.
- Variáveis na EAS (produção e preview): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (secreto).

## 8. Instruções pra próxima sessão

- **Nunca** `supabase config push`; **nunca** `npm audit fix --force`.
- **Entre um build e as atualizações dele, não mexer em `eas.json`, `app.json`, `package.json` nem plugins**: muda a impressão digital e a atualização não chega ao build (aconteceu em 26/09 com o `ascAppId`).
- Texto de notificação novo entra primeiro em `docs/nero/notificacoes.md`, decidido com o Murilo.
- Suíte verde não prova tela: conferir no simulador (links diretos, sem mouse) antes de dizer que está pronto; animação em movimento, só no aparelho.
- Medir antes de processar vídeo do Nero: cada geração vem com escala, posição, orientação e fundo próprios.
- Erros no Metro logo depois de editar podem ser de um estado intermediário: reabrir o Expo Go do zero antes de concluir.
- Subagentes só se o Murilo pedir; revisão final de plano é feita pelo próprio Claude e dita como autorrevisão.
