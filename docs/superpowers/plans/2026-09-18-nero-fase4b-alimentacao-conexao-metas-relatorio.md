# NERO Fase 4b — Saúde & Bem-estar: Alimentação, Conexão com glicemia, Metas, Check-in, Relatório e Merge — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fechar o módulo Saúde & Bem-estar: diário alimentar simples com resumo de hábitos, vínculo confirmado entre glicemia ↔ refeição ↔ atividade (C-020), Minhas Metas (§82), check-in semanal com bem-estar/estresse (§86–§87), "Meus hábitos" completo, Relatório de Saúde & Hábitos (§88) na central da Fase 3, linha do tempo geral, docs, nuvem e merge da Fase 4.

**Architecture:** Continua o 4a: lógica pura em `src/core/regras/bemestar/` (`alimentacao.ts`, `vinculos.ts`, `checkin.ts`), serviços em `src/core/bemestar/`, telas em `app/(app)/bem-estar/**`. O relatório reaproveita `DadosNero` + `montar.ts` da Fase 3 com seções novas e o tipo `bemestar`. A tabela `vinculos_glicemia` já existe (0012).

**Tech Stack:** Expo SDK 57 · Supabase · Jest · pgTAP · relatórios da Fase 3 (`html.ts`, `gerarPdf`, `compartilharQr`).

**Spec:** `docs/superpowers/specs/2026-09-18-nero-fase4-bem-estar-design.md` §4.3, §4.5–§4.7, §5.1 (alimentação, vínculos, hábitos), §5.3, §6 · Decisões C-019 (metas), C-020 (vínculo), §74–§76, §81–§82, §85–§88.

## Global Constraints

- Sem classificação de alimentos, sem "bom/ruim", sem contagem de calorias (§74, §76). Resumo alimentar só fala de dias registrados e horários; padrões em linguagem neutra.
- Vínculo glicemia ↔ refeição/atividade só com confirmação do usuário (C-020); janela de 3 h vem da regra `glicemia_vinculo/janela`.
- Metas nunca impostas (§82); o app registra e mostra distância, sem prazo.
- Check-in não é instrumento diagnóstico (§87): escalas 0–10, sem pontuação de corte, sem cor.
- Ressalvas literais da Fase 3 no PDF (§26 e §40) + frase "Registros de hábitos, alimentação e sono são autorrelatados." no relatório de hábitos.
- Português com acentos; rodapé de commit `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Branch `nero-fase4b-alimentacao-relatorio` a partir de `nero-fase4a-corpo-atividade-sono`. `npx tsc --noEmit && npx jest --ci` antes de cada commit; rotas novas → `npm run rotas`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/core/regras/bemestar/{alimentacao,vinculos,checkin}.ts` + `__tests__/` | resumo alimentar, candidatos a vínculo, médias mensais do check-in |
| `src/core/bemestar/{refeicoes,vinculos,checkins}.ts` + `useAlimentacao.ts`, `useCheckin.ts` | Supabase + hooks |
| `src/core/regras/bemestar/habitos.ts` · `src/core/bemestar/useHabitos.ts` | refeições e check-in pendente entram em `habitos7d` |
| `app/(app)/coracao/glicemia/registrar.tsx` · `src/core/cardio/useGlicemia.ts` · `src/core/cardio/glicemia.ts` | pergunta de vínculo após salvar |
| `app/(app)/bem-estar/{alimentacao,metas,checkin}/**` · `app/(app)/bem-estar/index.tsx` | telas |
| `src/core/relatorios/{tipos,especialidades,montar,carregar,html}.ts` · `app/(app)/minha-saude/relatorios/index.tsx` | tipo `bemestar`, seções `corpo/alimentacao/atividade/sono/checkins` |
| `src/core/linhaDoTempo/geral.ts` | itens do bem-estar |
| `supabase/migrations/0013_relatorio_bemestar.sql` | `compartilhamentos.tipo_relatorio` aceita `'bemestar'` |
| docs: `funcionamento/saude-bem-estar.md` §5–§8, `revisao/2026-09-XX-…-4b.md`, `checklists/fase-4b.md`, roadmap |

---

## Task 1: Branch, migração 0013 e núcleo de alimentação (TDD)

**Files:** Create `supabase/migrations/0013_relatorio_bemestar.sql`, `src/core/regras/bemestar/alimentacao.ts`, `__tests__/alimentacao.test.ts`.

**Interfaces:**
```ts
export type TipoRefeicao = 'cafe'|'lanche'|'almoco'|'lanche_tarde'|'jantar'|'ceia'|'outra';
export interface Refeicao { id: string; em: string; tipo: TipoRefeicao; descricao: string; quantidade: 'pequena'|'habitual'|'grande'|null; fomeAntes: number|null; saciedade: 'com_fome'|'satisfeito'|'muito_cheio'|null; local: 'casa'|'trabalho'|'restaurante'|'outro'|null; observacao: string|null }   // em tipos.ts
export const ROTULO_REFEICAO: Record<TipoRefeicao, string>;
export function resumoAlimentacaoSemana(refeicoes: Refeicao[], semana: { inicio: string; fim: string }): { diasComRegistro: number; totalRefeicoes: number; horarioMedio: Partial<Record<'cafe'|'almoco'|'jantar', string>>; variacaoMin: Partial<Record<'cafe'|'almoco'|'jantar', number>>; padrao: 'semelhantes'|'variaram'|null; porDia: { dia: string; refeicoes: number }[] }
```
- [ ] `git checkout nero-fase4a-corpo-atividade-sono && git checkout -b nero-fase4b-alimentacao-relatorio`.
- [ ] Migração 0013: `alter table public.compartilhamentos drop constraint if exists compartilhamentos_tipo_relatorio_check; add constraint … check (tipo_relatorio in ('cardiovascular','oncologico','geral','consulta','bemestar'))`. `supabase db reset && supabase test db` (30).
- [ ] Testes: semana 14–20/09 com café 07:30/07:50/07:45, almoço 12:30/13:00/13:30/12:50, jantar 20:00/21:30 em 6 dias → `diasComRegistro` 6, `totalRefeicoes` 9, `horarioMedio.cafe` '07:42', `horarioMedio.almoco` '12:57', `variacaoMin.jantar` 45 (desvio-padrão populacional em minutos, arredondado), `padrao`: 'semelhantes' se **todos** os desvios das três refeições principais presentes ≤ 45 min; 'variaram' se algum > 90; senão null; `porDia` com 7 posições; sem refeições → zeros, `padrao` null. Horários usam média circular (`mediaCircularHora` de `sono.ts`).
- [ ] Implementar; commit `feat(bem-estar): núcleo de alimentação — resumo da semana com horários médios (§76) + migração 0013`.

## Task 2: Diário alimentar — serviço, hook e telas (§74–§76)

**Files:** Create `src/core/bemestar/refeicoes.ts`, `useAlimentacao.ts`, `src/modules/bem-estar/conteudo/alimentacao.ts`, `app/(app)/bem-estar/alimentacao/{index,registrar}.tsx`.

- [ ] `refeicoes.ts`: `listarRefeicoes(userId, { desde })`, `inserirRefeicao(userId, Omit<Refeicao,'id'>)`, `excluirRefeicao`. `useAlimentacao()` → `{ refeicoes (90 dias), semana: resumoAlimentacaoSemana(...semanaDe(hoje)), porDia (últimos 7 dias agrupados), inserir, excluir, recarregar }`.
- [ ] `alimentacao/index.tsx`: "Sua semana" (§76): "Você registrou refeições em 6 de 7 dias", horário médio de café/almoço/jantar, frase neutra do padrão ("Você costuma realizar suas refeições principais em horários semelhantes." / "Nos últimos sete dias, seus horários de refeição variaram bastante."), lista dos últimos 7 dias com as refeições (tipo, hora, descrição truncada, quantidade); botão "Registrar refeição"; texto fixo: "O NERO não conta calorias nem classifica alimentos. O diário serve para você e seu médico enxergarem padrões."
- [ ] `alimentacao/registrar.tsx` (§74–§75): data + hora (padrão agora), tipo (`Opcoes` 7), "O que você comeu?" (`Input multiline`, obrigatório), opcionais: quantidade (pequena/habitual/grande), fome antes (0–10, `Opcoes` compacta de 0..10 ou `Input` numérico), como ficou (com fome/satisfeito/muito cheio), onde (casa/trabalho/restaurante/outro), observação.
- [ ] `npm run rotas`, checks, commit `feat(bem-estar): Minha Alimentação — diário simples e resumo da semana (§74–§76)`.

## Task 3: Conexão glicemia ↔ refeição ↔ atividade (C-020)

**Files:** Create `src/core/regras/bemestar/vinculos.ts`, `__tests__/vinculos.test.ts`, `src/core/bemestar/vinculos.ts` · Modify `src/core/cardio/glicemia.ts` (`inserirGlicemia` já devolve id), `src/core/cardio/useGlicemia.ts` (`registrar` devolve `{ id, avaliacao }`), `app/(app)/coracao/glicemia/registrar.tsx`.

**Interfaces:**
```ts
export function candidatosVinculo(glicemia: { medidoEm: string }, refeicoes: Refeicao[], atividades: Atividade[], p: ParametrosBemEstar): { refeicao: Refeicao | null; atividade: Atividade | null }
// refeição: a mais recente com `em` em [medidoEm − horas, medidoEm]; atividade: a mais recente cujo fim (inicio + duracao) está em [medidoEm − horas, medidoEm] e cujo início é anterior à glicemia.
export interface Vinculo { glicemiaId: string; refeicaoId: string | null; atividadeId: string | null }
export async function salvarVinculo(v: Vinculo): Promise<void>   // upsert por glicemia_id
export async function listarVinculos(userId: string, desde?: string): Promise<Vinculo[]>
```
- [ ] Testes: almoço 12:30 + glicemia 14:35 → refeição = almoço; refeição às 09:00 → null (5 h); duas refeições (12:30 e 13:10) → a de 13:10; atividade 18:00–18:40 + glicemia 19:30 → atividade; atividade 15:00–15:30 + glicemia 19:30 → null (fim há 4 h); atividade 14:40–15:20 + glicemia 14:35 → null (começou depois).
- [ ] `useGlicemia.registrar` passa a devolver `{ id, avaliacao }` (ajustar o único uso em `registrar.tsx`). Na tela pós-registro (bloco `saida`), antes do botão "Concluir": carregar refeições e atividades das últimas `horas` (serviços do 4a/4b) → `candidatosVinculo` → cartões "Esta glicemia está relacionada ao almoço das 12:30?" e "Foi medida após a caminhada das 18:00?" com **Sim / Não**; Sim → `salvarVinculo`. Sem candidatos → nada aparece.
- [ ] Commit `feat(bem-estar): vínculo glicemia ↔ refeição ↔ atividade com confirmação do usuário (C-020, §81)`.

## Task 4: Minhas Metas (§82) e check-in semanal (§86–§87)

**Files:** Create `src/core/regras/bemestar/checkin.ts`, `__tests__/checkin.test.ts`, `src/core/bemestar/checkins.ts`, `useCheckin.ts`, `src/modules/bem-estar/conteudo/{metas,checkin}.ts`, `app/(app)/bem-estar/metas/index.tsx`, `app/(app)/bem-estar/checkin/index.tsx`.

**Interfaces:**
```ts
export interface Checkin { id: string; semana: string; disposicao: number|null; alimentacao: number|null; atividade: number|null; sono: number|null; estresse: number|null; energia: number|null; bemEstar: number|null; observacao: string|null }
export function semanaDoCheckin(hoje: string): string          // segunda-feira ISO (reusa semanaDe)
export function checkinPendente(checkins: Checkin[], hoje: string): boolean   // sem registro para a semana **anterior** e hoje é dom/seg/ter (janela de resposta)
export function mediasMensais(checkins: Checkin[]): { mes: string; energia: number|null; estresse: number|null; bemEstar: number|null; n: number }[]   // 'AAAA-MM', 1 casa, mais recente primeiro
```
- [ ] Testes: `checkinPendente` verdadeiro na segunda 14/09 sem check-in da semana de 07/09; falso na quarta; falso se já respondido; `mediasMensais` com 4 check-ins em set e 2 em ago → duas linhas com médias corretas e `n`.
- [ ] `checkins.ts`: `listarCheckins(userId)`, `salvarCheckin(userId, Omit<Checkin,'id'>)` (upsert por `user_id, semana`). `useCheckin()` → `{ checkins, pendente, mediasMensais, salvar }`.
- [ ] `metas/index.tsx` (§82): lista das metas ativas por tipo (peso com objetivo do perfil, cintura, atividade min, sono min) com "meta X · atual Y · distância"; formulário: tipo (`Select`), valor, origem ("Definida com profissional" / "Minha"); peso só aparece se `objetivoPeso ∈ {reducao, aumento}` (manutenção/sem meta não tem valor-alvo) — usa `useMetas` do 4a e `useCorpo`/`useSono`/`useAtividades` para o "atual"; "Encerrar meta" → `desativar`.
- [ ] `checkin/index.tsx` (§86–§87): "Como foi sua semana?" para a semana anterior (ou a atual se domingo): 7 escalas 0–10 (`Opcoes` horizontal compacta ou 11 botões) — disposição, alimentação, atividade física, sono, estresse, energia, bem-estar geral; "Existe algo que gostaria de registrar sobre esta semana?"; salvar (upsert). Abaixo, "Seus meses": tabela mês × energia/estresse/bem-estar (`mediasMensais`). Texto fixo: "Isso cria um histórico do que você sentiu ao lado dos números. O NERO não faz diagnóstico com essas respostas."
- [ ] `npm run rotas`, checks, commit `feat(bem-estar): Minhas Metas e check-in semanal com bem-estar e estresse (§82, §86–§87)`.

## Task 5: "Meus hábitos" completo e Home

**Files:** Modify `src/core/regras/bemestar/habitos.ts` (+ teste), `src/core/bemestar/useHabitos.ts`, `app/(app)/bem-estar/index.tsx`, `src/modules/home/montarItensHoje.ts` (+ teste), `app/(app)/index.tsx`.

- [ ] `useHabitos` carrega também refeições (7 dias) e check-ins; `habitos7d` recebe `refeicoes` (contagem) e `checkinPendente`. Dashboard: card "Alimentação" com "17 refeições registradas" e atalho; card de check-in pendente ("Como foi sua semana? Responder leva 1 minuto") no topo quando `checkinPendente`; "Em breve" some; atalhos Alimentação, Metas, Check-in.
- [ ] Home: `BemEstarResumo` ganha `checkinPendente: boolean` → item cinza `checkin_semana` "Fazer o check-in da semana" (rota `/(app)/bem-estar/checkin`) — teste.
- [ ] Checks, commit `feat(bem-estar): Meus hábitos completo e check-in na Home (§85)`.

## Task 6: Relatório de Saúde & Hábitos (§88) e linha do tempo geral

**Files:** Modify `src/core/relatorios/tipos.ts` (`TipoRelatorio` + `'bemestar'`; `DadosNero.bemEstar`; `ChaveSecao` + `'corpo'|'alimentacao'|'atividade'|'sono'|'checkins'`), `especialidades.ts` (`SECOES_BEMESTAR`; `SECOES_GERAL` inclui as novas; `PRIORIDADES.endocrinologia` e `clinica_medica` ganham `'corpo','atividade'`), `montar.ts` (5 construtores + `montarBemEstar` + título "Relatório de Saúde & Hábitos"), `carregar.ts` (carrega corporais, refeições, atividades, sonos, check-ins, metas, vínculos do período), `html.ts` (`ressalvasPara('bemestar')` = §26 + §40 + frase de autorrelato), `compartilharQr.ts` (`TIPO_BANCO.bemestar = 'bemestar'`), `useRelatorio.ts`, `app/(app)/minha-saude/relatorios/index.tsx` (4º cartão), `app/(app)/bem-estar/index.tsx` (atalho "Relatório de Saúde & Hábitos"), `src/core/linhaDoTempo/geral.ts` (+ teste), testes de relatórios (fixture ganha `bemEstar`; snapshot novo).

**Seções (spec §88):**
- `corpo`: tabela peso/IMC/cintura/RCA por data (últimas 12 medidas) + linha "Tendência" + PMAV/objetivo; composição corporal se houver.
- `alimentacao`: "registros em n de m dias", horários médios, padrão neutro; tabela das refeições do período (data/hora, tipo, descrição) limitada a 60 linhas; **vínculos** aparecem na seção `glicemia` da Fase 3 como coluna "Refeição/atividade vinculada" (ex.: "almoço 12:30").
- `atividade`: semana a semana no período (minutos que contam, dias ativos, fortalecimento), tabela das atividades.
- `sono`: média e horários por semana; tabela das noites (data, dormiu, acordou, duração, qualidade).
- `checkins`: tabela semana × 7 escalas + observação; médias mensais.
- [ ] Testes: `montarBemEstar` traz as 5 seções na ordem (perfil, corpo, alimentacao, atividade, sono, checkins, documentos) + pendências abertas; `montarConsulta('endocrinologia')` inclui `corpo` e `atividade`; HTML do `bemestar` contém as duas ressalvas + "autorrelatados"; seção glicemia mostra "almoço 12:30" quando há vínculo; snapshot.
- [ ] Linha do tempo geral: pesos/cinturas individuais, composição, sono agregado por semana ("Sono — média 7h03"), atividades agregadas por semana ("Atividade — 130 min que contam"), check-ins ("Check-in — bem-estar 7/10"); cor do módulo verde. Teste do agrupamento semanal.
- [ ] Commit `feat(relatorios): Relatório de Saúde & Hábitos (§88), seções de bem-estar na consulta e linha do tempo geral`.

## Task 7: Docs, revisão, checklist 4b, nuvem e merge

- [ ] `docs/nero/funcionamento/saude-bem-estar.md` §5–§8; `docs/nero/revisao/2026-09-XX-revisao-textos-bem-estar-4b.md`; `docs/nero/checklists/fase-4b.md` (critério de pronto da spec §1); roadmap.
- [ ] Nuvem: `supabase db push` (0012 + 0013) e semente das 12 regras `bem_estar` (`psql`/SQL Editor com o bloco da semente), senha na hora.
- [ ] `npx tsc --noEmit && npx jest --ci` · `supabase test db` · merge `--no-ff` de `nero-fase4b-alimentacao-relatorio` em `desenvolvimento-2` (leva o 4a junto) · push · roadmap "Fase 4 mesclada".

## Autorrevisão
- Spec §5.1 alimentação/vinculos/habitos → Tasks 1, 3, 5; §5.3 glicemia/relatórios/linha do tempo → Tasks 3, 6; §6 alimentação/metas/checkin/relatorio → Tasks 2, 4, 6; §4.7 vínculos → Task 3; §4.5 checkins → Task 4; migração 0013 (tipo `bemestar` em compartilhamentos) → Task 1.
- Nomes: `Refeicao`, `Checkin`, `Vinculo`, `resumoAlimentacaoSemana`, `candidatosVinculo`, `checkinPendente`, `mediasMensais`, `montarBemEstar`, `SECOES_BEMESTAR`.
