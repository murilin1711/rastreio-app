# NERO Fase 2a — Minha Pressão, MRPA, alertas, lembretes e dashboard — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ativar o módulo Coração & Metabolismo com registro de pressão arterial casual (alertas em camadas), MRPA guiada com validade e relatório, lembretes de MRPA e de medicação, dashboard inicial e itens na Home.

**Architecture:** Regras puras em `src/core/regras/cardio/` (parâmetros vindos de `regras_clinicas`, TDD) → serviços com Supabase em `src/core/cardio/` → telas em `app/(app)/coracao/**`. A migração `0010_cardio.sql` já cria **tudo** que 2a e 2b precisam (o 2b não migra de novo).

**Tech Stack:** Expo SDK 57 · Expo Router · Supabase (Postgres/RLS, pgTAP) · Jest (`jest-expo`) · expo-notifications.

**Spec:** `docs/superpowers/specs/2026-09-17-nero-fase2-cardio-design.md` · Decisões C-010, C-011 (`docs/nero/02-DECISOES.md`) · Funcionamento: `docs/nero/funcionamento/coracao-metabolismo.md` §1–§2 · Referências: `docs/nero/referencias/REFERENCIAS.md` (Fase 2).

## Global Constraints

- **Diretrizes vigentes, texto literal:** DBHA 2025 (Quadro 3.4, cap. 11.1) e Diretrizes de Medidas da PA 2023 (Parte 4 §3–§5, Quadro 19). Antes da Task 1, abrir as duas URLs em `REFERENCIAS.md`, confirmar que não há versão mais nova e anotar a data na coluna "Última verificação".
- **Medidas casuais nunca recebem cor de alerta abaixo de 180/110** (AMPA é triagem — DBHA 2025 §3.7.1). Só a MRPA válida tem cor amarela.
- Mensagens ao paciente: caixa normal, sem diagnóstico ("você tem hipertensão" é proibido), conduta sempre remetida ao médico (§25). Textos clínicos vêm de `regras_clinicas.mensagem_paciente`; `mensagens.ts` só tem os textos de interface.
- `src/core/regras/**` não importa React/Expo/Supabase/UI (teste `sem-dependencias` continua verde).
- Toda linha nova em `regras_clinicas`: `modulo='cardio'`, `fonte` com seção/quadro, `ano`, `versao='2026.2'`, `revisada_em='2026-09-17'`.
- Português com acentos em UI, mensagens, comentários e commits. Rodapé de commit: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Antes das Tasks 6–9 (telas), reler `docs/nero/03-DESIGN.md` e usar a skill `frontend-design`. Cronômetro da MRPA é o único movimento.
- Branch `nero-fase2a-pressao` a partir de `desenvolvimento-2`. Supabase local (`supabase start`) para pgTAP e tipos; `.env` aponta para a nuvem — `supabase db push` **só na Task 10**.
- Rotas novas em `app/` → `npm run rotas` (reinicia o Metro em segundo plano e regenera `.expo/types/router.d.ts`).
- Verificação de cada task: `npx tsc --noEmit && npx jest --ci` verdes antes do commit.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0010_cardio.sql` | mrpa_sessoes (4–6, colunas novas), perfil (campos 2a+2b), `riscos_cv`, check de `programa`, RLS |
| `supabase/seed.sql` | bloco Fase 2 — regras `pressao` (as de `glicemia`/`risco_cv` entram no plano 2b) |
| `supabase/tests/cardio.test.sql` | pgTAP: check dias 4–6, RLS `riscos_cv`, programa `pressao` |
| `src/core/regras/cardio/tipos.ts` | tipos do domínio cardio (MedidaPA, SintomaPA, MotivoExclusao, SessaoMrpa, RelatorioMrpa) |
| `src/core/regras/cardio/parametros.ts` | extrai parâmetros tipados das linhas de `regras_clinicas` por `condicao.camada` |
| `src/core/regras/cardio/pressao.ts` | plausibilidade, camadas 1–4, convite MRPA, resumo casual |
| `src/core/regras/cardio/mrpa.ts` | dia atual, pode concluir, montar relatório (exclusões, médias, validade, referência) |
| `src/core/regras/cardio/lembretesMrpa.ts` | função pura: datas dos lembretes de uma sessão |
| `src/core/cardio/regras.ts` | `carregarRegrasCardio(programa)` |
| `src/core/cardio/medidas.ts` | inserir/listar medidas `pa`, inserir lote da MRPA, último convite |
| `src/core/cardio/sessoesMrpa.ts` | iniciar, ativa, listar, concluir (grava `resultado`), cancelar |
| `src/core/cardio/lembretesCardio.ts` | agenda/cancela notificações locais + `lembretes` (MRPA e medicação) |
| `src/core/cardio/usePressao.ts` · `useMrpa.ts` | hooks |
| `src/core/cardio/resumoHome.ts` | `ResumoCardio` para a Home |
| `src/modules/coracao/conteudo/pressao.ts` · `sinais.ts` | textos (Quadro 19, §23) |
| `src/modules/coracao/componentes/*` | `LinhaMedida`, `CardResumoPA`, `GraficoBarras`, `Cronometro` |
| `app/(app)/coracao/**` | rotas |
| `app/(app)/_layout.tsx` | aba "Coração" |
| `app/(app)/index.tsx` · `src/modules/home/montarItensHoje.ts` | card ativo + itens do Cardio |
| `app/(app)/minha-saude/medicamentos.tsx` | toggle "Lembrar nos horários" |

---

## Task 1: Branch, migração 0010, tipos, pgTAP e semente de pressão

**Files:**
- Create: `supabase/migrations/0010_cardio.sql`, `supabase/tests/cardio.test.sql`
- Modify: `supabase/seed.sql` (bloco novo no fim), `src/core/supabase/database.types.ts` (gerado), `docs/nero/referencias/REFERENCIAS.md` (coluna "Última verificação")

**Interfaces:**
- Produces: colunas `mrpa_sessoes.pa_consultorio`, `horarios`, `resultado`, `concluida_em`; `perfil_saude.tipo_diabetes`, `usa_insulina`, `evento_cv_previo`, `perfil_meta_glicemica`, `metas_glicemia`, `plano_glicemia`, `agravantes_cv`, `atividade_fisica_regular`; tabela `riscos_cv`; `regras_clinicas.programa` aceita `pressao|glicemia|risco_cv`; 7 linhas `cardio/pressao` na semente.

- [ ] **Step 1: Verificar versões das referências e criar a branch**

Abrir https://abccardiol.org/article/diretriz-brasileira-de-hipertensao-arterial-2025/ e https://abccardiol.org/article/diretrizes-brasileiras-de-medidas-da-pressao-arterial-dentro-e-fora-do-consultorio-2023/ ; confirmar que não há edição mais nova; em `REFERENCIAS.md` trocar "16/09/2026 ✔ (mais recente)" pela data de hoje nas duas linhas.

```bash
cd "/Users/muriloroizpovoa/Desktop/App de Rastreio/app-de-rastreio" && git checkout desenvolvimento-2 && git pull -q && git checkout -b nero-fase2a-pressao
```

- [ ] **Step 2: Escrever a migração**

`supabase/migrations/0010_cardio.sql`:

```sql
-- NERO · Fase 2 · Coração & Metabolismo (C-010–C-014). Uma migração para 2a e 2b.

-- MRPA: protocolo da Diretriz de Medidas da PA 2023, Parte 4 §3 — 4 a 6 dias, idealmente 6 (C-011)
alter table public.mrpa_sessoes drop constraint if exists mrpa_sessoes_dias_previstos_check;
alter table public.mrpa_sessoes
  alter column dias_previstos set default 6,
  add constraint mrpa_sessoes_dias_previstos_check check (dias_previstos between 4 and 6),
  add column pa_consultorio jsonb,               -- {"pas":n,"pad":n,"medido_em":"AAAA-MM-DD"} opcional
  add column horarios jsonb not null default '{}', -- {"manha":"HH:MM","noite":"HH:MM"}
  add column resultado jsonb,                    -- gravado ao concluir (RelatorioMrpa)
  add column concluida_em timestamptz;
comment on column public.mrpa_sessoes.resultado is 'RelatorioMrpa: médias total/manhã/noite/por dia, válidas/excluídas, valido, acima_referencia (≥130 e/ou ≥80, DBHA 2025 Quadro 3.4).';

-- Perfil: campos da Fase 2 (glicemia C-012, PREVENT C-013)
alter table public.perfil_saude
  add column tipo_diabetes text check (tipo_diabetes in ('dm1','dm2','gestacional','outro')),
  add column usa_insulina text check (usa_insulina in ('nao','basal','intensiva')),
  add column evento_cv_previo boolean,
  add column perfil_meta_glicemica text not null default 'adulto' check (perfil_meta_glicemica in ('adulto','idoso_comprometido','idoso_muito_comprometido')),
  add column metas_glicemia jsonb,
  add column plano_glicemia jsonb,
  add column agravantes_cv jsonb not null default '{"itens":[]}',
  add column atividade_fisica_regular boolean;

-- Risco cardiovascular (PREVENT) — Dislipidemias 2025 (C-013)
create table public.riscos_cv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calculado_em timestamptz not null default now(),
  modelo text not null check (modelo in ('prevent_base','prevent_hba1c','prevent_rac','prevent_hba1c_rac')),
  entradas jsonb not null,
  ascvd_10 numeric(5,2) not null,
  ascvd_30 numeric(5,2),
  categoria text not null check (categoria in ('baixo','intermediario','alto')),
  agravantes_presentes text[] not null default '{}',
  versao_coeficientes text not null,
  created_at timestamptz not null default now()
);
create index riscos_cv_user_data_idx on public.riscos_cv (user_id, calculado_em desc);
alter table public.riscos_cv enable row level security;
create policy riscos_cv_owner on public.riscos_cv for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Regras clínicas do módulo cardio
alter table public.regras_clinicas drop constraint if exists regras_clinicas_programa_check;
alter table public.regras_clinicas add constraint regras_clinicas_programa_check
  check (programa in ('mama','colo_utero','colorretal','pulmao','prostata','pressao','glicemia','risco_cv'));
```

- [ ] **Step 3: Escrever o teste pgTAP**

`supabase/tests/cardio.test.sql`:

```sql
begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000002a', 'ca@teste.dev'),
  ('00000000-0000-0000-0000-00000000002b', 'cb@teste.dev');

select throws_ok(
  $$insert into public.mrpa_sessoes (user_id, inicio, dias_previstos) values ('00000000-0000-0000-0000-00000000002a', '2026-09-17', 7)$$,
  '23514', null, 'MRPA não aceita 7 dias (Medidas PA 2023: 4 a 6)');
select lives_ok(
  $$insert into public.mrpa_sessoes (user_id, inicio) values ('00000000-0000-0000-0000-00000000002a', '2026-09-17')$$,
  'padrão de 6 dias é aceito');
select is((select dias_previstos from public.mrpa_sessoes where user_id = '00000000-0000-0000-0000-00000000002a'), 6, 'padrão é 6 dias');

insert into public.riscos_cv (user_id, modelo, entradas, ascvd_10, categoria, versao_coeficientes)
values ('00000000-0000-0000-0000-00000000002b', 'prevent_base', '{}', 4.5, 'baixo', 'teste');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000002a","role":"authenticated"}';
select is((select count(*) from public.riscos_cv), 0::bigint, 'A não vê riscos de B');
select is((select count(*) from public.regras_clinicas where programa = 'pressao' and ativa), 7::bigint, 'semente tem as 7 regras de pressão');

select * from finish();
rollback;
```

- [ ] **Step 4: Escrever a semente de pressão**

Acrescentar ao fim de `supabase/seed.sql`:

```sql
-- ---------------------------------------------------------------------------
-- NERO · Fase 2 · Coração & Metabolismo · versão 2026.2 · revisada em 2026-09-17
-- Pressão arterial (C-010, C-011). Fontes: DBHA 2025 (Arq Bras Cardiol 2025;122(9):e20250624)
-- e Diretrizes Brasileiras de Medidas da PA Dentro e Fora do Consultório 2023 (Arq Bras Cardiol 2024;121(4):e20240113).
insert into public.regras_clinicas
  (modulo, programa, exame_tipo, condicao, classificacao, nivel_alerta, proxima_acao, intervalo_meses, mensagem_paciente, fonte, ano, versao, revisada_em)
values
('cardio','pressao','pa','{"camada":"implausivel","pad_max":140,"pad_min":40,"pas_min":70,"pas_max":250,"pp_min":20,"pp_max":100}','pendente','cinza','Conferir os valores digitados',null,'Confira os valores digitados. Esta combinação é incomum para uma medida de pressão. Se estiver correta, você pode salvar mesmo assim.','Diretrizes de Medidas da PA 2023, Parte 4 §3 (critérios de exclusão de medidas)',2023,'2026.2','2026-09-17'),
('cardio','pressao','pa','{"camada":"referencia_domiciliar","pas":130,"pad":80}','normal','verde','Nenhuma',null,'Em casa, as diretrizes usam 130/80 como referência para a MRPA. Uma medida isolada não confirma nem afasta hipertensão.','DBHA 2025, Quadro 3.4 · Medidas da PA 2023, Quadro 9 e §3.1 (AMPA é triagem)',2025,'2026.2','2026-09-17'),
('cardio','pressao','pa','{"camada":"convite_mrpa","minimo_medidas":3,"janela_dias":7,"repetir_dias":30,"pas":130,"pad":80}','controle','verde','Sugerir MRPA',null,'Suas medidas em casa vêm ficando acima da referência. As diretrizes recomendam confirmar com uma MRPA. Quer iniciar uma pelo app e conversar com seu médico?','C-010 (gatilho de produto) · DBHA 2025 §3.7.1 (AMPA: triagem para MRPA/MAPA)',2025,'2026.2','2026-09-17'),
('cardio','pressao','pa','{"camada":"muito_elevado","pas":180,"pad":110}','investigacao','laranja','Repouso e repetição da medida',null,'Este valor está muito acima do habitual. Sente-se, descanse 5 minutos e meça de novo. Se você tiver algum dos sintomas a seguir, procure atendimento imediatamente.','DBHA 2025, cap. 11.1 (PAS ≥ 180 e/ou PAD ≥ 110)',2025,'2026.2','2026-09-17'),
('cardio','pressao','pa','{"camada":"muito_elevado_sintoma","pas":180,"pad":110,"sintomas":["dor_toracica","dispneia_importante","deficit_neurologico","alteracao_visual","confusao","sincope"]}','especializado','vermelho','Avaliação imediata em emergência',null,'Pressão muito elevada com esses sintomas pode indicar uma condição que precisa de avaliação urgente. Procure um serviço de emergência agora.','DBHA 2025, cap. 11 (emergência hipertensiva: elevação acentuada com lesão de órgão-alvo)',2025,'2026.2','2026-09-17'),
('cardio','pressao','mrpa','{"camada":"mrpa_acima","pas":130,"pad":80}','controle','amarelo','Levar o relatório ao médico',null,'Suas medidas recentes estão acima do esperado. Considere conversar com seu profissional de saúde. Leve este relatório à consulta.','DBHA 2025, Quadro 3.4 · Medidas da PA 2023, Parte 4 §4 (MRPA anormal ≥ 130 e/ou ≥ 80)',2025,'2026.2','2026-09-17'),
('cardio','pressao','mrpa','{"camada":"validade","minimos":{"4":14,"5":15,"6":18},"medidas_por_periodo":3,"intervalo_min":1,"dias_min":4,"dias_max":6,"dias_padrao":6}','pendente','cinza','Registro insuficiente para interpretação',null,'Esta MRPA não atingiu o número mínimo de medidas para interpretação. O relatório mostra o que foi registrado; converse com seu médico sobre repetir o protocolo.','Medidas da PA 2023, Parte 4 §3 (protocolo 3+3, 4–6 dias) e §5 (mínimos 14/15/18 com manhã e noite em todos os dias)',2023,'2026.2','2026-09-17');
```

- [ ] **Step 5: Rodar localmente, gerar tipos e testar**

```bash
supabase start && supabase db reset && supabase test db
npm run db:types && npx tsc --noEmit && npx jest --ci
```
Esperado: pgTAP 17 testes (12 + 5) verdes; tipos regenerados com `riscos_cv` e colunas novas; Jest 160 verdes.

- [ ] **Step 6: Commit**

```bash
git add supabase src/core/supabase/database.types.ts docs/nero/referencias/REFERENCIAS.md
git commit -m "feat(cardio): migração 0010 (MRPA 4–6 dias, perfil Fase 2, riscos_cv) + semente de pressão + pgTAP

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 2: Tipos e parâmetros do domínio cardio

**Files:**
- Create: `src/core/regras/cardio/tipos.ts`, `src/core/regras/cardio/parametros.ts`, `src/core/regras/cardio/__tests__/parametros.test.ts`

**Interfaces:**
- Produces: tipos abaixo e `extrairParametros(regras): ParametrosPressao` (lança se faltar camada).

- [ ] **Step 1: Tipos**

`src/core/regras/cardio/tipos.ts`:

```ts
/**
 * Domínio do módulo Coração & Metabolismo (§1–§4). TypeScript puro.
 * Referências: DBHA 2025 · Diretrizes de Medidas da PA 2023 (C-010, C-011).
 */
import type { NivelAlerta, RegraParametros } from '../tipos';

export type SintomaPA = 'dor_toracica' | 'dispneia_importante' | 'deficit_neurologico' | 'alteracao_visual' | 'confusao' | 'sincope';
export type MotivoExclusao = 'pad_maior_140' | 'pad_menor_40' | 'pas_menor_70' | 'pas_maior_250' | 'pas_menor_pad' | 'pp_menor_20' | 'pp_maior_100';
export type PeriodoMrpa = 'manha' | 'noite';

export interface MedidaPA {
  id: string;
  medidoEm: string; // ISO completo
  pas: number;
  pad: number;
  fc: number | null;
  sessaoId: string | null;
  contexto: {
    braco?: 'esquerdo' | 'direito';
    posicao?: 'sentado' | 'deitado' | 'em_pe';
    momentoMedicacao?: 'antes' | 'depois' | 'nao_uso';
    sintomas?: SintomaPA[];
    implausivelConfirmada?: boolean;
    periodo?: PeriodoMrpa;
    ordem?: 1 | 2 | 3;
    excluida?: boolean;
    motivoExclusao?: MotivoExclusao;
  };
}

export type CamadaPA = 'contexto' | 'muito_elevado' | 'muito_elevado_sintoma';

export interface AvaliacaoPA {
  camada: CamadaPA;
  nivel: NivelAlerta | null; // null = sem cor (medida casual dentro do habitual)
  mensagem: string;
  acimaReferenciaDomiciliar: boolean;
  regraId: string | null;
}

export interface SessaoMrpa {
  id: string;
  inicio: string; // 'AAAA-MM-DD'
  diasPrevistos: 4 | 5 | 6;
  status: 'em_andamento' | 'concluida' | 'cancelada';
  horarios: { manha: string; noite: string };
  paConsultorio: { pas: number; pad: number; medidoEm: string } | null;
}

export interface MediaPA { pas: number; pad: number; n: number }

export interface RelatorioMrpa {
  medidasValidas: number;
  medidasExcluidas: number;
  diasComRegistro: number;
  medias: { total: MediaPA | null; manha: MediaPA | null; noite: MediaPA | null; porDia: { dia: number; data: string; manha: MediaPA | null; noite: MediaPA | null; total: MediaPA | null }[] };
  valido: boolean;
  motivoInvalidez: 'poucas_medidas' | 'dia_sem_periodo' | 'sem_medidas' | null;
  acimaReferencia: boolean | null; // null quando inválido
  diferencaConsultorio: { pas: number; pad: number } | null;
  regraId: string | null;
}

/** Parâmetros lidos de `regras_clinicas` (programa 'pressao'), por camada. */
export interface ParametrosPressao {
  implausivel: { padMax: number; padMin: number; pasMin: number; pasMax: number; ppMin: number; ppMax: number; regra: RegraParametros };
  referenciaDomiciliar: { pas: number; pad: number; regra: RegraParametros };
  conviteMrpa: { minimoMedidas: number; janelaDias: number; repetirDias: number; pas: number; pad: number; regra: RegraParametros };
  muitoElevado: { pas: number; pad: number; regra: RegraParametros };
  muitoElevadoSintoma: { pas: number; pad: number; sintomas: SintomaPA[]; regra: RegraParametros };
  mrpaAcima: { pas: number; pad: number; regra: RegraParametros };
  validade: { minimos: Record<string, number>; medidasPorPeriodo: number; intervaloMin: number; diasMin: number; diasMax: number; diasPadrao: number; regra: RegraParametros };
}
```

- [ ] **Step 2: Teste de `extrairParametros`**

`src/core/regras/cardio/__tests__/parametros.test.ts`:

```ts
import { extrairParametros } from '../parametros';
import { regrasPressaoTeste } from './fixtures';

test('extrai as sete camadas da semente', () => {
  const p = extrairParametros(regrasPressaoTeste());
  expect(p.muitoElevado).toMatchObject({ pas: 180, pad: 110 });
  expect(p.validade.minimos).toEqual({ '4': 14, '5': 15, '6': 18 });
  expect(p.conviteMrpa.minimoMedidas).toBe(3);
});

test('lança erro claro quando falta uma camada', () => {
  const semValidade = regrasPressaoTeste().filter((r) => r.condicao.camada !== 'validade');
  expect(() => extrairParametros(semValidade)).toThrow('validade');
});
```

`src/core/regras/cardio/__tests__/fixtures.ts` — espelho da semente (mantê-lo igual ao `seed.sql`):

```ts
import type { RegraParametros } from '../../tipos';

const base = { versao: '2026.2', ano: 2025, intervaloMeses: null, proximaAcao: '' };
export function regrasPressaoTeste(): RegraParametros[] {
  return [
    { ...base, id: 'r-implausivel', fonte: 'Medidas 2023 P4 §3', condicao: { camada: 'implausivel', pad_max: 140, pad_min: 40, pas_min: 70, pas_max: 250, pp_min: 20, pp_max: 100 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Confira os valores digitados.' },
    { ...base, id: 'r-ref', fonte: 'DBHA 2025 Q3.4', condicao: { camada: 'referencia_domiciliar', pas: 130, pad: 80 }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Em casa, as diretrizes usam 130/80 como referência para a MRPA.' },
    { ...base, id: 'r-convite', fonte: 'C-010', condicao: { camada: 'convite_mrpa', minimo_medidas: 3, janela_dias: 7, repetir_dias: 30, pas: 130, pad: 80 }, classificacao: 'controle', nivelAlerta: 'verde', mensagemPaciente: 'Quer iniciar uma MRPA?' },
    { ...base, id: 'r-alto', fonte: 'DBHA 2025 11.1', condicao: { camada: 'muito_elevado', pas: 180, pad: 110 }, classificacao: 'investigacao', nivelAlerta: 'laranja', mensagemPaciente: 'Descanse 5 minutos e meça de novo.' },
    { ...base, id: 'r-alto-sint', fonte: 'DBHA 2025 11', condicao: { camada: 'muito_elevado_sintoma', pas: 180, pad: 110, sintomas: ['dor_toracica', 'dispneia_importante', 'deficit_neurologico', 'alteracao_visual', 'confusao', 'sincope'] }, classificacao: 'especializado', nivelAlerta: 'vermelho', mensagemPaciente: 'Procure um serviço de emergência agora.' },
    { ...base, id: 'r-mrpa-acima', fonte: 'DBHA 2025 Q3.4', condicao: { camada: 'mrpa_acima', pas: 130, pad: 80 }, classificacao: 'controle', nivelAlerta: 'amarelo', mensagemPaciente: 'Suas medidas recentes estão acima do esperado.' },
    { ...base, id: 'r-validade', ano: 2023, fonte: 'Medidas 2023 P4 §5', condicao: { camada: 'validade', minimos: { '4': 14, '5': 15, '6': 18 }, medidas_por_periodo: 3, intervalo_min: 1, dias_min: 4, dias_max: 6, dias_padrao: 6 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Não atingiu o mínimo para interpretação.' },
  ];
}
```

- [ ] **Step 3: Rodar — deve falhar** (`npx jest src/core/regras/cardio -v` → "Cannot find module '../parametros'").

- [ ] **Step 4: Implementar**

`src/core/regras/cardio/parametros.ts`:

```ts
import type { RegraParametros } from '../tipos';
import type { ParametrosPressao, SintomaPA } from './tipos';

function porCamada(regras: RegraParametros[], camada: string): RegraParametros {
  const r = regras.find((x) => x.condicao.camada === camada);
  if (!r) throw new Error(`regras_clinicas: falta a camada "${camada}" do programa pressao`);
  return r;
}
const n = (c: Record<string, unknown>, k: string): number => Number(c[k]);

/** Lê as sete camadas de `regras_clinicas` (programa 'pressao') em um objeto tipado. */
export function extrairParametros(regras: RegraParametros[]): ParametrosPressao {
  const imp = porCamada(regras, 'implausivel');
  const ref = porCamada(regras, 'referencia_domiciliar');
  const conv = porCamada(regras, 'convite_mrpa');
  const alto = porCamada(regras, 'muito_elevado');
  const altoS = porCamada(regras, 'muito_elevado_sintoma');
  const acima = porCamada(regras, 'mrpa_acima');
  const val = porCamada(regras, 'validade');
  return {
    implausivel: { padMax: n(imp.condicao, 'pad_max'), padMin: n(imp.condicao, 'pad_min'), pasMin: n(imp.condicao, 'pas_min'), pasMax: n(imp.condicao, 'pas_max'), ppMin: n(imp.condicao, 'pp_min'), ppMax: n(imp.condicao, 'pp_max'), regra: imp },
    referenciaDomiciliar: { pas: n(ref.condicao, 'pas'), pad: n(ref.condicao, 'pad'), regra: ref },
    conviteMrpa: { minimoMedidas: n(conv.condicao, 'minimo_medidas'), janelaDias: n(conv.condicao, 'janela_dias'), repetirDias: n(conv.condicao, 'repetir_dias'), pas: n(conv.condicao, 'pas'), pad: n(conv.condicao, 'pad'), regra: conv },
    muitoElevado: { pas: n(alto.condicao, 'pas'), pad: n(alto.condicao, 'pad'), regra: alto },
    muitoElevadoSintoma: { pas: n(altoS.condicao, 'pas'), pad: n(altoS.condicao, 'pad'), sintomas: (altoS.condicao.sintomas as SintomaPA[]) ?? [], regra: altoS },
    mrpaAcima: { pas: n(acima.condicao, 'pas'), pad: n(acima.condicao, 'pad'), regra: acima },
    validade: { minimos: (val.condicao.minimos as Record<string, number>) ?? {}, medidasPorPeriodo: n(val.condicao, 'medidas_por_periodo'), intervaloMin: n(val.condicao, 'intervalo_min'), diasMin: n(val.condicao, 'dias_min'), diasMax: n(val.condicao, 'dias_max'), diasPadrao: n(val.condicao, 'dias_padrao'), regra: val },
  };
}
```

- [ ] **Step 5: Rodar — verde**: `npx jest src/core/regras -v` (inclui `sem-dependencias`).

- [ ] **Step 6: Commit** — `feat(cardio): tipos do domínio e leitura de parâmetros de regras_clinicas`.

---

## Task 3: `pressao.ts` — plausibilidade, camadas e convite (TDD)

**Files:**
- Create: `src/core/regras/cardio/pressao.ts`, `src/core/regras/cardio/__tests__/pressao.test.ts`

**Interfaces:**
- Produces: `validarPlausibilidade(m: {pas,pad}, p): MotivoExclusao | null` · `avaliarMedidaCasual(m: {pas,pad}, sintomas: SintomaPA[], p): AvaliacaoPA` · `deveConvidarMrpa(medidas: MedidaPA[], ultimoConviteEm: string | null, hoje: string, p): boolean` · `resumoCasual(medidas: MedidaPA[]): { media: MediaPA | null; maior: MedidaPA | null; menor: MedidaPA | null }`.

- [ ] **Step 1: Testes**

`src/core/regras/cardio/__tests__/pressao.test.ts`:

```ts
import { extrairParametros } from '../parametros';
import { avaliarMedidaCasual, deveConvidarMrpa, resumoCasual, validarPlausibilidade } from '../pressao';
import type { MedidaPA } from '../tipos';
import { regrasPressaoTeste } from './fixtures';

const p = extrairParametros(regrasPressaoTeste());
const m = (pas: number, pad: number, dia: string, extra: Partial<MedidaPA> = {}): MedidaPA =>
  ({ id: `${pas}-${pad}-${dia}`, medidoEm: `${dia}T08:00:00.000Z`, pas, pad, fc: null, sessaoId: null, contexto: {}, ...extra });

describe('plausibilidade (Medidas 2023, Parte 4 §3)', () => {
  test.each([
    [120, 141, 'pad_maior_140'], [120, 39, 'pad_menor_40'], [69, 50, 'pas_menor_70'], [251, 90, 'pas_maior_250'],
    [80, 90, 'pas_menor_pad'], [100, 85, 'pp_menor_20'], [200, 90, 'pp_maior_100'],
  ])('%i/%i → %s', (pas, pad, motivo) => expect(validarPlausibilidade({ pas, pad }, p)).toBe(motivo));
  test('128/78 é plausível', () => expect(validarPlausibilidade({ pas: 128, pad: 78 }, p)).toBeNull());
});

describe('camadas de uma medida casual (C-010)', () => {
  test('128/78: só contexto, sem cor, dentro da referência', () => {
    const a = avaliarMedidaCasual({ pas: 128, pad: 78 }, [], p);
    expect(a).toMatchObject({ camada: 'contexto', nivel: null, acimaReferenciaDomiciliar: false });
    expect(a.mensagem).toContain('130/80');
  });
  test('142/88: contexto, sem cor, acima da referência (AMPA não classifica)', () => {
    expect(avaliarMedidaCasual({ pas: 142, pad: 88 }, [], p)).toMatchObject({ camada: 'contexto', nivel: null, acimaReferenciaDomiciliar: true });
  });
  test('179/109 continua sem cor; 180/x e x/110 viram laranja', () => {
    expect(avaliarMedidaCasual({ pas: 179, pad: 109 }, [], p).nivel).toBeNull();
    expect(avaliarMedidaCasual({ pas: 180, pad: 70 }, [], p)).toMatchObject({ camada: 'muito_elevado', nivel: 'laranja', regraId: 'r-alto' });
    expect(avaliarMedidaCasual({ pas: 150, pad: 110 }, [], p).camada).toBe('muito_elevado');
  });
  test('muito elevado + sintoma de alarme → vermelho', () => {
    expect(avaliarMedidaCasual({ pas: 185, pad: 95 }, ['dor_toracica'], p)).toMatchObject({ camada: 'muito_elevado_sintoma', nivel: 'vermelho', regraId: 'r-alto-sint' });
  });
  test('sintoma sem valor muito elevado não muda a camada (sintomas são tratados na tela de sinais)', () => {
    expect(avaliarMedidaCasual({ pas: 140, pad: 90 }, ['dor_toracica'], p).camada).toBe('contexto');
  });
});

describe('convite para MRPA (C-010, camada 2b)', () => {
  const hoje = '2026-09-17';
  test('2 medidas ≥ 130/80 em 7 dias → não', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-15'), m(131, 70, '2026-09-16')], null, hoje, p)).toBe(false);
  });
  test('3 medidas ≥ 130 e/ou ≥ 80 em 7 dias → sim', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-12'), m(120, 80, '2026-09-14'), m(131, 70, '2026-09-16')], null, hoje, p)).toBe(true);
  });
  test('medida fora da janela de 7 dias não conta', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-09'), m(135, 85, '2026-09-14'), m(135, 85, '2026-09-16')], null, hoje, p)).toBe(false);
  });
  test('convite mostrado há menos de 30 dias → não repete', () => {
    const ms = [m(135, 85, '2026-09-12'), m(135, 85, '2026-09-14'), m(135, 85, '2026-09-16')];
    expect(deveConvidarMrpa(ms, '2026-09-01', hoje, p)).toBe(false);
    expect(deveConvidarMrpa(ms, '2026-08-10', hoje, p)).toBe(true);
  });
  test('medidas de sessão MRPA não contam como casuais', () => {
    const ms = [m(135, 85, '2026-09-12', { sessaoId: 's1' }), m(135, 85, '2026-09-14', { sessaoId: 's1' }), m(135, 85, '2026-09-16', { sessaoId: 's1' })];
    expect(deveConvidarMrpa(ms, null, hoje, p)).toBe(false);
  });
});

test('resumo casual: média arredondada, maior e menor por PAS', () => {
  const r = resumoCasual([m(120, 80, '2026-09-10'), m(130, 70, '2026-09-11'), m(125, 75, '2026-09-12')]);
  expect(r.media).toEqual({ pas: 125, pad: 75, n: 3 });
  expect(r.maior?.pas).toBe(130);
  expect(r.menor?.pas).toBe(120);
  expect(resumoCasual([]).media).toBeNull();
});
```

- [ ] **Step 2: Rodar — falha** (módulo inexistente).

- [ ] **Step 3: Implementar**

`src/core/regras/cardio/pressao.ts`:

```ts
/**
 * Pressão arterial casual (AMPA) — C-010.
 * AMPA é triagem (DBHA 2025 §3.7.1): sem cor abaixo de 180/110; só contextualiza com a referência da MRPA (130/80).
 */
import type { AvaliacaoPA, MediaPA, MedidaPA, MotivoExclusao, ParametrosPressao, SintomaPA } from './tipos';

export function validarPlausibilidade(m: { pas: number; pad: number }, p: ParametrosPressao): MotivoExclusao | null {
  const { implausivel: i } = p;
  const pp = m.pas - m.pad;
  if (m.pad > i.padMax) return 'pad_maior_140';
  if (m.pad < i.padMin) return 'pad_menor_40';
  if (m.pas < i.pasMin) return 'pas_menor_70';
  if (m.pas > i.pasMax) return 'pas_maior_250';
  if (m.pas < m.pad) return 'pas_menor_pad';
  if (pp < i.ppMin) return 'pp_menor_20';
  if (pp > i.ppMax) return 'pp_maior_100';
  return null;
}

export function acimaDe(m: { pas: number; pad: number }, ref: { pas: number; pad: number }): boolean {
  return m.pas >= ref.pas || m.pad >= ref.pad;
}

export function avaliarMedidaCasual(m: { pas: number; pad: number }, sintomas: SintomaPA[], p: ParametrosPressao): AvaliacaoPA {
  const acima = acimaDe(m, p.referenciaDomiciliar);
  if (acimaDe(m, p.muitoElevadoSintoma) && sintomas.some((s) => p.muitoElevadoSintoma.sintomas.includes(s))) {
    return { camada: 'muito_elevado_sintoma', nivel: p.muitoElevadoSintoma.regra.nivelAlerta, mensagem: p.muitoElevadoSintoma.regra.mensagemPaciente, acimaReferenciaDomiciliar: true, regraId: p.muitoElevadoSintoma.regra.id };
  }
  if (acimaDe(m, p.muitoElevado)) {
    return { camada: 'muito_elevado', nivel: p.muitoElevado.regra.nivelAlerta, mensagem: p.muitoElevado.regra.mensagemPaciente, acimaReferenciaDomiciliar: true, regraId: p.muitoElevado.regra.id };
  }
  return { camada: 'contexto', nivel: null, mensagem: p.referenciaDomiciliar.regra.mensagemPaciente, acimaReferenciaDomiciliar: acima, regraId: p.referenciaDomiciliar.regra.id };
}

const DIA_MS = 86_400_000;
const diasEntre = (a: string, b: string) => Math.floor((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / DIA_MS);

/** Camada 2b (C-010): ≥ N medidas casuais ≥ 130/80 nos últimos 7 dias, no máximo uma vez a cada 30 dias. Nunca alerta — convite. */
export function deveConvidarMrpa(medidas: MedidaPA[], ultimoConviteEm: string | null, hoje: string, p: ParametrosPressao): boolean {
  const c = p.conviteMrpa;
  if (ultimoConviteEm && diasEntre(ultimoConviteEm, hoje) < c.repetirDias) return false;
  const recentes = medidas.filter((m) => !m.sessaoId && !m.contexto.excluida && diasEntre(m.medidoEm, hoje) <= c.janelaDias && diasEntre(m.medidoEm, hoje) >= 0);
  return recentes.filter((m) => acimaDe(m, c)).length >= c.minimoMedidas;
}

export function media(medidas: { pas: number; pad: number }[]): MediaPA | null {
  if (!medidas.length) return null;
  const s = medidas.reduce((a, m) => ({ pas: a.pas + m.pas, pad: a.pad + m.pad }), { pas: 0, pad: 0 });
  return { pas: Math.round(s.pas / medidas.length), pad: Math.round(s.pad / medidas.length), n: medidas.length };
}

export function resumoCasual(medidas: MedidaPA[]): { media: MediaPA | null; maior: MedidaPA | null; menor: MedidaPA | null } {
  const validas = medidas.filter((m) => !m.contexto.excluida);
  if (!validas.length) return { media: null, maior: null, menor: null };
  const porPas = [...validas].sort((a, b) => a.pas - b.pas);
  return { media: media(validas), maior: porPas[porPas.length - 1], menor: porPas[0] };
}
```

- [ ] **Step 4: Rodar — verde.**

- [ ] **Step 5: Commit** — `feat(cardio): regras de pressão casual — plausibilidade, camadas e convite para MRPA (C-010)`.

---

## Task 4: `mrpa.ts` — dia, conclusão, relatório e validade (TDD)

**Files:**
- Create: `src/core/regras/cardio/mrpa.ts`, `src/core/regras/cardio/__tests__/mrpa.test.ts`

**Interfaces:**
- Consumes: `media`, `acimaDe`, `validarPlausibilidade` de `./pressao`.
- Produces: `diaDaSessao(sessao, hoje): number` (1-based; 0 se antes do início) · `podeConcluir(sessao, hoje): boolean` · `dataDoDia(sessao, dia): string` · `classificarMedidaSessao(m, p): { excluida: boolean; motivo: MotivoExclusao | null }` · `montarRelatorio(sessao, medidas, p): RelatorioMrpa`.

- [ ] **Step 1: Testes**

`src/core/regras/cardio/__tests__/mrpa.test.ts`:

```ts
import { extrairParametros } from '../parametros';
import { dataDoDia, diaDaSessao, montarRelatorio, podeConcluir } from '../mrpa';
import type { MedidaPA, SessaoMrpa } from '../tipos';
import { regrasPressaoTeste } from './fixtures';

const p = extrairParametros(regrasPressaoTeste());
const sessao = (dias: 4 | 5 | 6 = 6, extra: Partial<SessaoMrpa> = {}): SessaoMrpa =>
  ({ id: 's1', inicio: '2026-09-10', diasPrevistos: dias, status: 'em_andamento', horarios: { manha: '08:00', noite: '20:00' }, paConsultorio: null, ...extra });

let seq = 0;
const med = (dia: number, periodo: 'manha' | 'noite', ordem: 1 | 2 | 3, pas: number, pad: number): MedidaPA => ({
  id: `m${++seq}`, medidoEm: `${dataDoDia(sessao(), dia)}T${periodo === 'manha' ? '08' : '20'}:0${ordem}:00.000Z`,
  pas, pad, fc: 70, sessaoId: 's1', contexto: { periodo, ordem },
});
/** Sessão completa: `dias` × (3 manhã + 3 noite) com os valores dados. */
const completa = (dias: number, pas = 125, pad = 78) =>
  Array.from({ length: dias }, (_, i) => i + 1).flatMap((d) => ([1, 2, 3] as const).flatMap((o) => [med(d, 'manha', o, pas, pad), med(d, 'noite', o, pas - 4, pad - 3)]));

describe('dia e conclusão', () => {
  test('dia 1 no início, dia 6 no último; 0 antes; continua contando depois', () => {
    expect(diaDaSessao(sessao(), '2026-09-10')).toBe(1);
    expect(diaDaSessao(sessao(), '2026-09-15')).toBe(6);
    expect(diaDaSessao(sessao(), '2026-09-09')).toBe(0);
    expect(dataDoDia(sessao(), 3)).toBe('2026-09-12');
  });
  test('só pode concluir a partir do último dia previsto', () => {
    expect(podeConcluir(sessao(), '2026-09-14')).toBe(false);
    expect(podeConcluir(sessao(), '2026-09-15')).toBe(true);
    expect(podeConcluir(sessao(4), '2026-09-13')).toBe(true);
  });
});

describe('relatório e validade (Medidas 2023, Parte 4 §5)', () => {
  test('6 dias completos → válida, 36 medidas, médias por período, dentro da referência', () => {
    const r = montarRelatorio(sessao(), completa(6), p);
    expect(r.valido).toBe(true);
    expect(r.medidasValidas).toBe(36);
    expect(r.medias.total).toEqual({ pas: 123, pad: 77, n: 36 });
    expect(r.medias.manha).toEqual({ pas: 125, pad: 78, n: 18 });
    expect(r.medias.noite).toEqual({ pas: 121, pad: 75, n: 18 });
    expect(r.medias.porDia).toHaveLength(6);
    expect(r.acimaReferencia).toBe(false);
    expect(r.regraId).toBe('r-validade');
  });
  test('média ≥ 130 e/ou ≥ 80 → acima da referência (regra mrpa_acima)', () => {
    const r = montarRelatorio(sessao(), completa(6, 134, 76), p);
    expect(r.acimaReferencia).toBe(true);
    expect(r.regraId).toBe('r-mrpa-acima');
  });
  test('4 dias com 13 medidas → inválida por poucas medidas', () => {
    const ms = completa(4).slice(0, 13);
    const r = montarRelatorio(sessao(4), ms, p);
    expect(r).toMatchObject({ valido: false, motivoInvalidez: 'poucas_medidas', acimaReferencia: null });
  });
  test('6 dias com 18 medidas, mas um dia sem noite → inválida', () => {
    const ms = completa(6).filter((m) => !(m.contexto.periodo === 'noite' && m.medidoEm.startsWith(dataDoDia(sessao(), 2))));
    const r = montarRelatorio(sessao(), ms, p);
    expect(ms.length).toBeGreaterThanOrEqual(18);
    expect(r).toMatchObject({ valido: false, motivoInvalidez: 'dia_sem_periodo' });
  });
  test('medida implausível (PP < 20) é excluída do cálculo mas contada', () => {
    const ms = [...completa(6), med(1, 'manha', 3, 100, 85)];
    const r = montarRelatorio(sessao(), ms, p);
    expect(r.medidasExcluidas).toBe(1);
    expect(r.medidasValidas).toBe(36);
    expect(r.valido).toBe(true);
  });
  test('sem medidas → inválida', () => {
    expect(montarRelatorio(sessao(), [], p).motivoInvalidez).toBe('sem_medidas');
  });
  test('diferença consultório × MRPA quando informada', () => {
    const r = montarRelatorio(sessao(6, { paConsultorio: { pas: 140, pad: 90, medidoEm: '2026-09-09' } }), completa(6), p);
    expect(r.diferencaConsultorio).toEqual({ pas: 17, pad: 13 });
  });
});
```

- [ ] **Step 2: Rodar — falha.**

- [ ] **Step 3: Implementar**

`src/core/regras/cardio/mrpa.ts`:

```ts
/**
 * MRPA — protocolo da Diretriz de Medidas da PA 2023, Parte 4 (C-011).
 * 3 medidas manhã + 3 noite, 4–6 dias; validade 14/15/18 com manhã e noite em todos os dias; anormal ≥ 130 e/ou ≥ 80.
 */
import { acimaDe, media, validarPlausibilidade } from './pressao';
import type { MedidaPA, MotivoExclusao, ParametrosPressao, RelatorioMrpa, SessaoMrpa } from './tipos';

const DIA_MS = 86_400_000;

export function dataDoDia(sessao: SessaoMrpa, dia: number): string {
  return new Date(Date.parse(sessao.inicio) + (dia - 1) * DIA_MS).toISOString().slice(0, 10);
}

/** 1 no dia de início; 0 antes dele; segue contando após o último dia (a tela limita). */
export function diaDaSessao(sessao: SessaoMrpa, hoje: string): number {
  const d = Math.floor((Date.parse(hoje.slice(0, 10)) - Date.parse(sessao.inicio)) / DIA_MS) + 1;
  return d < 1 ? 0 : d;
}

export function podeConcluir(sessao: SessaoMrpa, hoje: string): boolean {
  return diaDaSessao(sessao, hoje) >= sessao.diasPrevistos;
}

export function classificarMedidaSessao(m: { pas: number; pad: number }, p: ParametrosPressao): { excluida: boolean; motivo: MotivoExclusao | null } {
  const motivo = validarPlausibilidade(m, p);
  return { excluida: motivo !== null, motivo };
}

export function montarRelatorio(sessao: SessaoMrpa, medidas: MedidaPA[], p: ParametrosPressao): RelatorioMrpa {
  const daSessao = medidas.filter((m) => m.sessaoId === sessao.id);
  const validas = daSessao.filter((m) => !m.contexto.excluida && validarPlausibilidade(m, p) === null);
  const excluidas = daSessao.length - validas.length;
  const dias = Array.from({ length: sessao.diasPrevistos }, (_, i) => i + 1);

  const porDia = dias.map((dia) => {
    const data = dataDoDia(sessao, dia);
    const doDia = validas.filter((m) => m.medidoEm.slice(0, 10) === data);
    const manha = doDia.filter((m) => m.contexto.periodo === 'manha');
    const noite = doDia.filter((m) => m.contexto.periodo === 'noite');
    return { dia, data, manha: media(manha), noite: media(noite), total: media(doDia) };
  });
  const diasComRegistro = porDia.filter((d) => d.total).length;

  let motivoInvalidez: RelatorioMrpa['motivoInvalidez'] = null;
  if (!validas.length) motivoInvalidez = 'sem_medidas';
  else if (validas.length < (p.validade.minimos[String(sessao.diasPrevistos)] ?? Infinity)) motivoInvalidez = 'poucas_medidas';
  else if (porDia.some((d) => !d.manha || !d.noite)) motivoInvalidez = 'dia_sem_periodo';
  const valido = motivoInvalidez === null;

  const total = media(validas);
  const acima = valido && total ? acimaDe(total, p.mrpaAcima) : null;
  const diferencaConsultorio = sessao.paConsultorio && total ? { pas: sessao.paConsultorio.pas - total.pas, pad: sessao.paConsultorio.pad - total.pad } : null;

  return {
    medidasValidas: validas.length,
    medidasExcluidas: excluidas,
    diasComRegistro,
    medias: { total, manha: media(validas.filter((m) => m.contexto.periodo === 'manha')), noite: media(validas.filter((m) => m.contexto.periodo === 'noite')), porDia },
    valido,
    motivoInvalidez,
    acimaReferencia: acima,
    diferencaConsultorio,
    regraId: !valido ? p.validade.regra.id : acima ? p.mrpaAcima.regra.id : p.validade.regra.id,
  };
}
```

- [ ] **Step 4: Rodar — verde.** Se a média de teste "total" der 123/77 diferente por arredondamento, ajustar o teste ao valor calculado à mão (manhã 125/78 ×18 + noite 121/75 ×18 → 123/76,5 → `Math.round` = 77).

- [ ] **Step 5: Commit** — `feat(cardio): MRPA — dia, conclusão, relatório e validade 14/15/18 (C-011)`.

---

## Task 5: Lembretes da MRPA (função pura) e serviços com Supabase

**Files:**
- Create: `src/core/regras/cardio/lembretesMrpa.ts`, `src/core/regras/cardio/__tests__/lembretesMrpa.test.ts`, `src/core/cardio/regras.ts`, `src/core/cardio/medidas.ts`, `src/core/cardio/sessoesMrpa.ts`, `src/core/cardio/lembretesCardio.ts`, `src/core/cardio/__tests__/medidas.test.ts`

**Interfaces:**
- Produces:
  - `planejarLembretesMrpa(sessao): { dia: number; periodo: PeriodoMrpa; quando: Date; titulo: string; texto: string }[]`
  - `carregarRegrasCardio(programa: 'pressao' | 'glicemia' | 'risco_cv'): Promise<RegraParametros[]>` (cache 10 min, como `rastreando/regras.ts`)
  - `medidas.ts`: `linhaParaMedidaPA(linha): MedidaPA` · `listarPA(userId, { desde?: string; sessaoId?: string | null }): Promise<MedidaPA[]>` · `inserirPACasual(userId, entrada: { medidoEm: string; pas; pad; fc: number | null; contexto: MedidaPA['contexto']; observacao?: string }): Promise<string>` · `inserirLoteMrpa(userId, sessaoId, periodo, trio: { pas; pad; fc: number | null; medidoEm: string; excluida: boolean; motivo: MotivoExclusao | null }[]): Promise<void>` · `ultimoConviteMrpaEm(userId): Promise<string | null>` · `registrarConviteMrpa(userId): Promise<void>` (usa `lembretes` com `origem_tipo='sistema'`, `titulo='convite_mrpa'`, `status='lido'`)
  - `sessoesMrpa.ts`: `linhaParaSessao(linha): SessaoMrpa` · `sessaoAtiva(userId): Promise<SessaoMrpa | null>` · `listarSessoes(userId): Promise<(SessaoMrpa & { resultado: RelatorioMrpa | null; concluidaEm: string | null })[]>` · `iniciarSessao(userId, { inicio; diasPrevistos; horarios; paConsultorio }): Promise<SessaoMrpa>` · `concluirSessao(userId, sessao, medidas, p): Promise<RelatorioMrpa>` · `cancelarSessao(userId, sessaoId): Promise<void>`
  - `lembretesCardio.ts`: `agendarLembretesMrpa(userId, sessao)` · `cancelarLembretes(userId, prefixoTitulo)` · `agendarLembretesMedicacao(userId, medicacao: { id; nome; horarios: string[] })` · `sincronizarLembretesMedicacao(userId, medicacoesAtivas)`.

- [ ] **Step 1: Teste da função pura de lembretes**

`src/core/regras/cardio/__tests__/lembretesMrpa.test.ts`:

```ts
import { planejarLembretesMrpa } from '../lembretesMrpa';
import type { SessaoMrpa } from '../tipos';

const s: SessaoMrpa = { id: 's1', inicio: '2026-09-10', diasPrevistos: 4, status: 'em_andamento', horarios: { manha: '07:30', noite: '20:00' }, paConsultorio: null };

test('um lembrete por período por dia, no horário escolhido, com título rastreável', () => {
  const l = planejarLembretesMrpa(s);
  expect(l).toHaveLength(8);
  expect(l[0]).toMatchObject({ dia: 1, periodo: 'manha', titulo: 'mrpa:s1:1:manha' });
  expect(l[0].quando.getHours()).toBe(7);
  expect(l[0].quando.getMinutes()).toBe(30);
  expect(l[0].quando.getDate()).toBe(10);
  expect(l[7]).toMatchObject({ dia: 4, periodo: 'noite' });
  expect(l[0].texto).toBe('Hora de registrar sua pressão — MRPA, dia 1 de 4 (manhã).');
});
```

- [ ] **Step 2: Rodar — falha.** Implementar:

`src/core/regras/cardio/lembretesMrpa.ts`:

```ts
import { dataDoDia } from './mrpa';
import type { PeriodoMrpa, SessaoMrpa } from './tipos';

export interface LembretePlanejado { dia: number; periodo: PeriodoMrpa; quando: Date; titulo: string; texto: string }

/** §22: "08:00 — Hora de registrar sua pressão — MRPA, dia 3 de 7." Datas no fuso do aparelho. */
export function planejarLembretesMrpa(sessao: SessaoMrpa): LembretePlanejado[] {
  const out: LembretePlanejado[] = [];
  for (let dia = 1; dia <= sessao.diasPrevistos; dia++) {
    const [a, m, d] = dataDoDia(sessao, dia).split('-').map(Number);
    for (const periodo of ['manha', 'noite'] as const) {
      const [h, min] = sessao.horarios[periodo].split(':').map(Number);
      out.push({
        dia, periodo, quando: new Date(a, m - 1, d, h, min, 0),
        titulo: `mrpa:${sessao.id}:${dia}:${periodo}`,
        texto: `Hora de registrar sua pressão — MRPA, dia ${dia} de ${sessao.diasPrevistos} (${periodo === 'manha' ? 'manhã' : 'noite'}).`,
      });
    }
  }
  return out;
}
```

Rodar — verde. Commit — `feat(cardio): planejamento de lembretes da MRPA`.

- [ ] **Step 3: `carregarRegrasCardio`**

`src/core/cardio/regras.ts`:

```ts
import type { RegraParametros } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export type ProgramaCardio = 'pressao' | 'glicemia' | 'risco_cv';
const cache = new Map<ProgramaCardio, { em: number; regras: RegraParametros[] }>();
const TTL_MS = 10 * 60 * 1000;

/** Regras ativas de um programa do módulo cardio (§65), com cache de 10 minutos. */
export async function carregarRegrasCardio(programa: ProgramaCardio): Promise<RegraParametros[]> {
  const c = cache.get(programa);
  if (c && Date.now() - c.em < TTL_MS) return c.regras;
  const { data, error } = await supabase.from('regras_clinicas').select('*').eq('modulo', 'cardio').eq('programa', programa).eq('ativa', true);
  if (error) throw traduzirErro(error);
  const regras: RegraParametros[] = data.map((r) => ({
    id: r.id, versao: r.versao, fonte: r.fonte, ano: r.ano,
    condicao: (r.condicao as Record<string, unknown>) ?? {},
    classificacao: r.classificacao as RegraParametros['classificacao'],
    nivelAlerta: r.nivel_alerta as RegraParametros['nivelAlerta'],
    proximaAcao: r.proxima_acao ?? '', intervaloMeses: r.intervalo_meses, mensagemPaciente: r.mensagem_paciente ?? '',
  }));
  cache.set(programa, { em: Date.now(), regras });
  return regras;
}
export function limparCacheRegrasCardio(): void { cache.clear(); }
```

- [ ] **Step 4: Teste do mapeamento de medidas**

`src/core/cardio/__tests__/medidas.test.ts`:

```ts
import { linhaParaMedidaPA } from '../medidas';

test('mapeia linha de `medidas` para MedidaPA', () => {
  const m = linhaParaMedidaPA({ id: 'x', medido_em: '2026-09-17T11:00:00+00:00', valores: { pas: 128, pad: 78, fc: 68 }, contexto: { braco: 'esquerdo', periodo: 'manha', ordem: 2 }, sessao_id: 's1' });
  expect(m).toEqual({ id: 'x', medidoEm: '2026-09-17T11:00:00+00:00', pas: 128, pad: 78, fc: 68, sessaoId: 's1', contexto: { braco: 'esquerdo', periodo: 'manha', ordem: 2 } });
});
test('fc ausente vira null', () => {
  expect(linhaParaMedidaPA({ id: 'x', medido_em: 't', valores: { pas: 120, pad: 80 }, contexto: {}, sessao_id: null }).fc).toBeNull();
});
```

- [ ] **Step 5: Implementar `medidas.ts`**

```ts
import type { MedidaPA, MotivoExclusao, PeriodoMrpa } from '@core/regras/cardio/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

type Linha = { id: string; medido_em: string; valores: unknown; contexto: unknown; sessao_id: string | null };

export function linhaParaMedidaPA(l: Linha): MedidaPA {
  const v = (l.valores ?? {}) as { pas: number; pad: number; fc?: number | null };
  return { id: l.id, medidoEm: l.medido_em, pas: v.pas, pad: v.pad, fc: v.fc ?? null, sessaoId: l.sessao_id, contexto: (l.contexto ?? {}) as MedidaPA['contexto'] };
}

export async function listarPA(userId: string, f: { desde?: string; sessaoId?: string | null } = {}): Promise<MedidaPA[]> {
  let q = supabase.from('medidas').select('id, medido_em, valores, contexto, sessao_id').eq('user_id', userId).eq('tipo', 'pa').order('medido_em', { ascending: false });
  if (f.desde) q = q.gte('medido_em', f.desde);
  if (f.sessaoId === null) q = q.is('sessao_id', null);
  else if (f.sessaoId) q = q.eq('sessao_id', f.sessaoId);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(linhaParaMedidaPA);
}

export async function inserirPACasual(userId: string, e: { medidoEm: string; pas: number; pad: number; fc: number | null; contexto: MedidaPA['contexto']; observacao?: string }): Promise<string> {
  const { data, error } = await supabase.from('medidas')
    .insert({ user_id: userId, tipo: 'pa', medido_em: e.medidoEm, valores: { pas: e.pas, pad: e.pad, fc: e.fc }, contexto: e.contexto, observacao: e.observacao ?? null })
    .select('id').single();
  if (error) throw traduzirErro(error);
  return data.id;
}

export async function inserirLoteMrpa(userId: string, sessaoId: string, periodo: PeriodoMrpa, trio: { pas: number; pad: number; fc: number | null; medidoEm: string; excluida: boolean; motivo: MotivoExclusao | null }[]): Promise<void> {
  const linhas = trio.map((m, i) => ({
    user_id: userId, tipo: 'pa', sessao_id: sessaoId, medido_em: m.medidoEm,
    valores: { pas: m.pas, pad: m.pad, fc: m.fc },
    contexto: { periodo, ordem: i + 1, ...(m.excluida ? { excluida: true, motivo_exclusao: m.motivo } : {}) },
  }));
  const { error } = await supabase.from('medidas').insert(linhas);
  if (error) throw traduzirErro(error);
}

/** O convite para MRPA (C-010) é registrado em `lembretes` como evento de sistema já lido. */
export async function ultimoConviteMrpaEm(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from('lembretes').select('agendado_para').eq('user_id', userId).eq('origem_tipo', 'sistema').eq('titulo', 'convite_mrpa').order('agendado_para', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  return data?.agendado_para ?? null;
}
export async function registrarConviteMrpa(userId: string): Promise<void> {
  const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: 'sistema', agendado_para: new Date().toISOString(), titulo: 'convite_mrpa', mensagem: 'Convite para iniciar MRPA exibido', status: 'lido' });
  if (error) throw traduzirErro(error);
}
```

Nota: o contexto no banco usa `motivo_exclusao` (snake) e o tipo TS usa `motivoExclusao`; `linhaParaMedidaPA` deve converter: acrescentar antes do `return` — `const c = { ...(l.contexto as Record<string, unknown>) }; if ('motivo_exclusao' in c) { c.motivoExclusao = c.motivo_exclusao; delete c.motivo_exclusao; }` e usar `c` no `contexto`. Ajustar o teste do Step 4 com um caso `{ excluida: true, motivo_exclusao: 'pp_menor_20' }` → `{ excluida: true, motivoExclusao: 'pp_menor_20' }`.

- [ ] **Step 6: `sessoesMrpa.ts`**

```ts
import type { RelatorioMrpa, SessaoMrpa, ParametrosPressao, MedidaPA } from '@core/regras/cardio/tipos';
import { montarRelatorio } from '@core/regras/cardio/mrpa';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

type Linha = { id: string; inicio: string; dias_previstos: number; status: string; horarios: unknown; pa_consultorio: unknown; resultado: unknown; concluida_em: string | null };

export function linhaParaSessao(l: Linha): SessaoMrpa & { resultado: RelatorioMrpa | null; concluidaEm: string | null } {
  const pc = l.pa_consultorio as { pas: number; pad: number; medido_em: string } | null;
  return {
    id: l.id, inicio: l.inicio, diasPrevistos: l.dias_previstos as 4 | 5 | 6, status: l.status as SessaoMrpa['status'],
    horarios: (l.horarios as SessaoMrpa['horarios']) ?? { manha: '08:00', noite: '20:00' },
    paConsultorio: pc ? { pas: pc.pas, pad: pc.pad, medidoEm: pc.medido_em } : null,
    resultado: (l.resultado as RelatorioMrpa | null) ?? null, concluidaEm: l.concluida_em,
  };
}
const CAMPOS = 'id, inicio, dias_previstos, status, horarios, pa_consultorio, resultado, concluida_em';

export async function sessaoAtiva(userId: string): Promise<SessaoMrpa | null> {
  const { data, error } = await supabase.from('mrpa_sessoes').select(CAMPOS).eq('user_id', userId).eq('status', 'em_andamento').order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? linhaParaSessao(data) : null;
}
export async function listarSessoes(userId: string) {
  const { data, error } = await supabase.from('mrpa_sessoes').select(CAMPOS).eq('user_id', userId).order('inicio', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(linhaParaSessao);
}
export async function iniciarSessao(userId: string, e: { inicio: string; diasPrevistos: 4 | 5 | 6; horarios: SessaoMrpa['horarios']; paConsultorio: SessaoMrpa['paConsultorio'] }): Promise<SessaoMrpa> {
  const { data, error } = await supabase.from('mrpa_sessoes').insert({
    user_id: userId, inicio: e.inicio, dias_previstos: e.diasPrevistos, horarios: e.horarios,
    pa_consultorio: e.paConsultorio ? { pas: e.paConsultorio.pas, pad: e.paConsultorio.pad, medido_em: e.paConsultorio.medidoEm } : null,
  }).select(CAMPOS).single();
  if (error) throw traduzirErro(error);
  return linhaParaSessao(data);
}
export async function concluirSessao(userId: string, sessao: SessaoMrpa, medidas: MedidaPA[], p: ParametrosPressao): Promise<RelatorioMrpa> {
  const relatorio = montarRelatorio(sessao, medidas, p);
  const { error } = await supabase.from('mrpa_sessoes').update({ status: 'concluida', fim: new Date().toISOString().slice(0, 10), concluida_em: new Date().toISOString(), resultado: relatorio }).eq('id', sessao.id).eq('user_id', userId);
  if (error) throw traduzirErro(error);
  return relatorio;
}
export async function cancelarSessao(userId: string, sessaoId: string): Promise<void> {
  const { error } = await supabase.from('mrpa_sessoes').update({ status: 'cancelada', fim: new Date().toISOString().slice(0, 10) }).eq('id', sessaoId).eq('user_id', userId);
  if (error) throw traduzirErro(error);
}
```

- [ ] **Step 7: `lembretesCardio.ts`** (mesmo padrão de `rastreando/lembretes.ts`: notificação local + linha em `lembretes` com `notif:<id>` na mensagem)

```ts
import * as Notifications from 'expo-notifications';
import { planejarLembretesMrpa } from '@core/regras/cardio/lembretesMrpa';
import type { SessaoMrpa } from '@core/regras/cardio/tipos';
import { pedirPermissaoNotificacoes } from '@core/rastreando/lembretes';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

async function agendar(userId: string, origemTipo: 'medida' | 'medicacao', origemId: string | null, titulo: string, texto: string, quando: Date, temPermissao: boolean): Promise<void> {
  if (quando.getTime() < Date.now()) return;
  let notifId: string | null = null;
  if (temPermissao) {
    notifId = await Notifications.scheduleNotificationAsync({
      content: { title: 'NERO — Coração & Metabolismo', body: texto },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando },
    }).catch(() => null);
  }
  const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: origemTipo, origem_id: origemId, agendado_para: quando.toISOString(), titulo, mensagem: `${texto}${notifId ? ` notif:${notifId}` : ''}` });
  if (error) throw traduzirErro(error);
}

/** Cancela (notificação + linha) todos os lembretes pendentes cujo título começa com o prefixo. */
export async function cancelarLembretes(userId: string, prefixoTitulo: string): Promise<void> {
  const { data, error } = await supabase.from('lembretes').select('id, mensagem').eq('user_id', userId).eq('status', 'pendente').like('titulo', `${prefixoTitulo}%`);
  if (error) throw traduzirErro(error);
  for (const l of data ?? []) {
    const notifId = l.mensagem?.match(/notif:([\w-]+)/)?.[1];
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  }
  const { error: e2 } = await supabase.from('lembretes').update({ status: 'cancelado' }).eq('user_id', userId).eq('status', 'pendente').like('titulo', `${prefixoTitulo}%`);
  if (e2) throw traduzirErro(e2);
}

export async function agendarLembretesMrpa(userId: string, sessao: SessaoMrpa): Promise<void> {
  await cancelarLembretes(userId, `mrpa:${sessao.id}:`);
  const temPermissao = await pedirPermissaoNotificacoes();
  for (const l of planejarLembretesMrpa(sessao)) await agendar(userId, 'medida', sessao.id, l.titulo, l.texto, l.quando, temPermissao);
}

/** §21: um lembrete por horário para os próximos 7 dias; `sincronizar` reagenda ao abrir o app. */
export async function agendarLembretesMedicacao(userId: string, m: { id: string; nome: string; horarios: string[] }): Promise<void> {
  await cancelarLembretes(userId, `medicacao:${m.id}:`);
  const temPermissao = await pedirPermissaoNotificacoes();
  const hoje = new Date();
  for (let d = 0; d < 7; d++) {
    for (const h of m.horarios) {
      const [hh, mm] = h.split(':').map(Number);
      const quando = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + d, hh, mm, 0);
      await agendar(userId, 'medicacao', m.id, `medicacao:${m.id}:${h}`, `Hora do seu medicamento: ${m.nome}.`, quando, temPermissao);
    }
  }
}
export async function sincronizarLembretesMedicacao(userId: string, ativasComLembrete: { id: string; nome: string; horarios: string[] }[]): Promise<void> {
  for (const m of ativasComLembrete) await agendarLembretesMedicacao(userId, m);
}
```

O "toggle" de lembrete da medicação é persistido em `medicacoes.observacao`? Não — criar coluna: acrescentar à migração 0010 (Task 1, antes do commit se ainda não feito; senão nova linha na mesma migração, pois ainda não foi para a nuvem): `alter table public.medicacoes add column lembrar boolean not null default false;` e `Medicacao.lembrar: boolean` em `src/core/medicacoes/tipos.ts`, `repositorio.ts` (map + insert/update), com teste de mapeamento se houver. Rodar `supabase db reset && npm run db:types`.

- [ ] **Step 8: Verificar e commitar**

```bash
npx tsc --noEmit && npx jest --ci
git add -A src supabase && git commit -m "feat(cardio): serviços de medidas, sessões de MRPA e lembretes (MRPA + medicação)"
```

---

## Task 6: Hooks, conteúdo e telas de Minha Pressão

**Files:**
- Create: `src/core/cardio/usePressao.ts`, `src/modules/coracao/conteudo/pressao.ts`, `src/modules/coracao/componentes/LinhaMedida.tsx`, `src/modules/coracao/componentes/GraficoBarras.tsx`, `src/modules/coracao/componentes/SintomasAlarmePA.tsx`, `app/(app)/coracao/_layout.tsx`, `app/(app)/coracao/pressao/index.tsx`, `app/(app)/coracao/pressao/registrar.tsx`
- Modify: `app/(app)/_layout.tsx` (aba), `app/(app)/index.tsx` (card ativo — o `index.tsx` do módulo vem na Task 8; até lá o card aponta para `/(app)/coracao/pressao`)

**Interfaces:**
- Produces: `usePressao(): { medidas: MedidaPA[]; parametros: ParametrosPressao | null; resumo7: ReturnType<typeof resumoCasual>; resumo30; convidarMrpa: boolean; carregando; registrar(entrada): Promise<AvaliacaoPA>; dispensarConvite(): Promise<void>; recarregar() }`.

- [ ] **Step 1: Reler `docs/nero/03-DESIGN.md`** e invocar a skill `frontend-design` antes de escrever JSX.

- [ ] **Step 2: Conteúdo**

`src/modules/coracao/conteudo/pressao.ts`:

```ts
/** Textos do Minha Pressão. Fonte: Diretrizes de Medidas da PA 2023, Quadro 19 (instruções ao paciente), em linguagem do §25. */
export const preparoMedida = [
  'Fique em um lugar tranquilo e confortável.',
  'Não fume, não tome café e não faça exercício nos 30 minutos antes.',
  'Sente-se e relaxe por 3 a 5 minutos, com a bexiga vazia.',
  'Costas apoiadas, pernas descruzadas, pés no chão.',
  'Braço apoiado na mesa, na altura do coração, sem roupa apertando.',
  'Não converse durante a medida.',
  'Use sempre o mesmo braço.',
];
export const entendaReferencia =
  'Uma medida isolada não confirma nem afasta hipertensão. Em casa, as diretrizes usam 130/80 como referência para a MRPA, um protocolo de vários dias. Se suas medidas ficarem acima disso com frequência, o caminho é confirmar com uma MRPA e conversar com seu médico.';
export const SINTOMAS_PA: { valor: import('@core/regras/cardio/tipos').SintomaPA; rotulo: string }[] = [
  { valor: 'dor_toracica', rotulo: 'Dor ou aperto no peito' },
  { valor: 'dispneia_importante', rotulo: 'Falta de ar importante' },
  { valor: 'deficit_neurologico', rotulo: 'Fraqueza ou formigamento de um lado do corpo, dificuldade para falar' },
  { valor: 'alteracao_visual', rotulo: 'Alteração importante da visão' },
  { valor: 'confusao', rotulo: 'Confusão mental' },
  { valor: 'sincope', rotulo: 'Desmaio' },
];
```

- [ ] **Step 3: Hook `usePressao.ts`**

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { extrairParametros } from '@core/regras/cardio/parametros';
import { avaliarMedidaCasual, deveConvidarMrpa, resumoCasual, validarPlausibilidade } from '@core/regras/cardio/pressao';
import type { AvaliacaoPA, MedidaPA, ParametrosPressao, SintomaPA } from '@core/regras/cardio/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import * as medidasRepo from './medidas';
import { carregarRegrasCardio } from './regras';

const diasAtras = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
export const hojeISO = () => new Date().toISOString().slice(0, 10);

export interface EntradaPA { medidoEm: string; pas: number; pad: number; fc: number | null; contexto: MedidaPA['contexto']; observacao?: string; sintomas: SintomaPA[] }

export function usePressao() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [medidas, setMedidas] = useState<MedidaPA[]>([]);
  const [parametros, setParametros] = useState<ParametrosPressao | null>(null);
  const [ultimoConvite, setUltimoConvite] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const [ms, regras, convite] = await Promise.all([medidasRepo.listarPA(userId, { desde: diasAtras(90), sessaoId: null }), carregarRegrasCardio('pressao'), medidasRepo.ultimoConviteMrpaEm(userId)]);
      setMedidas(ms); setParametros(extrairParametros(regras)); setUltimoConvite(convite);
    } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const resumo7 = useMemo(() => resumoCasual(medidas.filter((m) => m.medidoEm >= diasAtras(7))), [medidas]);
  const resumo30 = useMemo(() => resumoCasual(medidas.filter((m) => m.medidoEm >= diasAtras(30))), [medidas]);
  const convidarMrpa = useMemo(() => (parametros ? deveConvidarMrpa(medidas, ultimoConvite, hojeISO(), parametros) : false), [medidas, ultimoConvite, parametros]);

  /** Validação de plausibilidade é feita pela tela antes (pede confirmação); aqui só grava e avalia. */
  const registrar = async (e: EntradaPA): Promise<AvaliacaoPA> => {
    if (!userId || !parametros) throw new Error('Sessão ou regras indisponíveis');
    const implausivel = validarPlausibilidade(e, parametros) !== null;
    await medidasRepo.inserirPACasual(userId, { ...e, contexto: { ...e.contexto, sintomas: e.sintomas, ...(implausivel ? { implausivelConfirmada: true } : {}) } });
    await recarregar();
    return avaliarMedidaCasual(e, e.sintomas, parametros);
  };
  const dispensarConvite = async () => { if (userId) { await medidasRepo.registrarConviteMrpa(userId); await recarregar(); } };

  return { medidas, parametros, resumo7, resumo30, convidarMrpa, carregando, registrar, dispensarConvite, recarregar };
}
```

- [ ] **Step 4: Componentes**

`GraficoBarras.tsx` — recebe `dados: { rotulo: string; pas: number; pad: number }[]` e uma linha de referência (`ref: { pas: number; pad: number }`); desenha barras verticais com `View`s (altura proporcional ao máximo entre valores e 200), duas por dia (PAS marinho, PAD aço), linha tracejada horizontal na referência com o texto "130/80 — referência da MRPA". Sem biblioteca. Sem cores de alerta.

`LinhaMedida.tsx` — `{ medida: MedidaPA; onPress? }`: data/hora à esquerda ("17/09 · 08:10"), "128/78" em heading, "FC 68" em caption, chips do contexto (braço, antes/depois da medicação). Se `medida.contexto.sintomas?.length` → chip cinza "com sintomas". **Nunca chip colorido por valor.**

`SintomasAlarmePA.tsx` — `Opcoes` múltiplas com `SINTOMAS_PA`, título "Você está sentindo algum destes sintomas agora?".

- [ ] **Step 5: Rotas**

`app/(app)/coracao/_layout.tsx`: `<Stack screenOptions={{ headerShown: false }} />`.

`app/(app)/_layout.tsx`: acrescentar entre Rastreando e Minha Saúde:
```tsx
<Tabs.Screen name="coracao" options={{ title: 'Coração', tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} /> }} />
```

`app/(app)/coracao/pressao/index.tsx` — `InternalHeader sectionLabel="Coração & Metabolismo" title="Minha Pressão"`; bloco resumo (Card raio 20): "Últimos 7 dias — média 126/76 · maior 138/84 · menor 118/70 · 5 medidas"; se `convidarMrpa`: Card com o texto de `parametros.conviteMrpa.regra.mensagemPaciente` e dois botões "Iniciar MRPA" (→ `/(app)/coracao/mrpa/iniciar`) e "Agora não" (`dispensarConvite`); `GraficoBarras` dos últimos 14 dias (uma barra por dia com a média do dia); botão primário "Registrar medida"; botão secundário "Iniciar MRPA"; lista `LinhaMedida` (30 dias); estado vazio: "Registre sua primeira medida" + `preparoMedida` como lista.

`app/(app)/coracao/pressao/registrar.tsx` — formulário: `CampoData` (hoje por padrão) + hora (Input `HH:MM`, usa `normalizarHorario` de `@core/medicacoes/horarios`), PAS, PAD, FC (numéricos), `Opcoes` braço, posição, medicação (antes/depois/não uso), `SintomasAlarmePA`, observação. Ao "Salvar":
  1. `validarPlausibilidade` → se motivo, `Alert` com a mensagem da regra `implausivel` e botões "Corrigir" / "Salvar assim mesmo".
  2. `registrar(...)` → tela de resultado inline (substitui o formulário): valor grande, texto de `avaliacao.mensagem`; se `nivel === 'laranja'`: `StatusBadge` laranja "Valor muito elevado", lista dos sintomas para marcar **de novo** ("Sente algum destes agora?") — marcar qualquer um reavalia com `avaliarMedidaCasual` e mostra o vermelho; se `nivel === 'vermelho'`: `StatusBadge` vermelho e a mensagem da regra; se `nivel === null`: texto de contexto sem chip, e a frase `entendaReferencia` quando `acimaReferenciaDomiciliar`. Botão "Concluir" → volta para a lista.

- [ ] **Step 6: `npm run rotas`, `npx tsc --noEmit && npx jest --ci`, abrir no Expo Go** e percorrer: 128/78 (sem cor) · 142/88 (sem cor, texto de referência) · 185/95 (laranja → marcar "dor no peito" → vermelho) · 100/85 (pede confirmação) · 3 medidas ≥ 130/80 em dias diferentes (convite aparece; "Agora não" some por 30 dias).

- [ ] **Step 7: Commit** — `feat(cardio): Minha Pressão — registro casual com alertas em camadas, resumo e convite para MRPA`.

---

## Task 7: Telas da MRPA (iniciar, sessão diária, medição guiada, relatório)

**Files:**
- Create: `src/core/cardio/useMrpa.ts`, `src/modules/coracao/componentes/Cronometro.tsx`, `src/modules/coracao/componentes/BlocoPeriodo.tsx`, `app/(app)/coracao/mrpa/iniciar.tsx`, `app/(app)/coracao/mrpa/[sessao].tsx`, `app/(app)/coracao/mrpa/medir.tsx`, `app/(app)/coracao/mrpa/relatorio.tsx`

**Interfaces:**
- Produces: `useMrpa(sessaoId?): { sessao: SessaoMrpa | null; medidas: MedidaPA[]; parametros; dia: number; podeConcluir: boolean; relatorioParcial: RelatorioMrpa | null; iniciar(e): Promise<SessaoMrpa>; registrarTrio(periodo, trio): Promise<void>; concluir(): Promise<RelatorioMrpa>; cancelar(): Promise<void>; recarregar() }`.

- [ ] **Step 1: Hook `useMrpa.ts`** — carrega `sessaoAtiva` (ou a sessão pelo id, via `listarSessoes().find`), `listarPA(userId, { sessaoId })`, `carregarRegrasCardio('pressao')` → `extrairParametros`. `dia = diaDaSessao(sessao, hojeISO())`; `podeConcluir = podeConcluir(sessao, hojeISO())`; `relatorioParcial = montarRelatorio(sessao, medidas, p)`. `iniciar(e)` = `iniciarSessao` → `agendarLembretesMrpa` → devolve a sessão. `registrarTrio(periodo, trio)` = para cada medida `classificarMedidaSessao` → `inserirLoteMrpa`. `concluir()` = `concluirSessao` → `cancelarLembretes(userId, 'mrpa:<id>:')`. `cancelar()` = `cancelarSessao` + `cancelarLembretes`.

- [ ] **Step 2: `Cronometro.tsx`** — `{ segundos: number; onFim: () => void; rotulo: string }`: conta regressiva com `setInterval` (limpa no unmount), texto grande "0:58", barra `ProgressBar`. Único elemento com movimento contínuo do módulo (responde ao toque "Começar").

- [ ] **Step 3: `iniciar.tsx`** — passos em uma tela rolável: (1) texto de abertura literal da spec §2 ("Você iniciará um protocolo de monitorização residencial da pressão arterial. Procure realizar todas as medidas nas mesmas condições.") + lista `preparoMedida` + "Regras do protocolo" (3 medidas de manhã e 3 à noite, com 1 minuto entre elas; antes do café/jantar e do remédio de pressão; se comeu, espere 2 horas; bexiga vazia; não meça a pressão de outras pessoas; não mude seus remédios por causa das medidas); (2) `Opcoes` duração 4/5/6 com descrição "A diretriz recomenda de 4 a 6 dias; o ideal são 6" — padrão `parametros.validade.diasPadrao`; (3) horários manhã/noite (Inputs `HH:MM`, padrão 08:00 / 20:00); (4) "Seu médico mediu sua pressão no consultório? (opcional)" PAS/PAD + data; (5) `CampoData` início (hoje; permite amanhã). Botão "Começar a MRPA" → `iniciar` → `router.replace('/(app)/coracao/mrpa/' + sessao.id)`. Se já houver sessão ativa, a tela redireciona para ela.

- [ ] **Step 4: `[sessao].tsx`** — cabeçalho "MRPA — dia {dia} de {diasPrevistos}" (se `dia === 0`: "Começa em {data}"; se `dia > diasPrevistos`: "Período encerrado — conclua para ver o relatório"); para o dia atual, `BlocoPeriodo` Manhã e Noite: cada um lista até 3 medidas (`LinhaMedida`) + média do período; se o período do dia ainda não tem 3 medidas → botão "Fazer as 3 medidas da manhã/noite" → `medir?periodo=manha`; navegação entre dias (setas) só para leitura dos anteriores; rodapé: "Concluir MRPA" (habilitado se `podeConcluir`; abaixo, quando desabilitado, caption "Disponível a partir do dia {diasPrevistos}") e "Cancelar MRPA" (confirmação). Ao concluir → `relatorio?sessao=<id>`.

- [ ] **Step 5: `medir.tsx`** — fluxo guiado: tela "Prepare-se" com `preparoMedida` e botão "Já descansei 5 minutos — começar"; para `ordem` 1→3: formulário PAS/PAD/FC + "Salvar medida {ordem} de 3"; entre elas `Cronometro` de `parametros.validade.intervaloMin * 60` s com rótulo "Aguarde 1 minuto para a próxima medida" (botão "Pular espera" em secundário — a diretriz pede o intervalo, mas o app não impede). Plausibilidade: mesmo `Alert` da Task 6 ("Corrigir"/"Salvar assim mesmo" — se salvar, entra `excluida` com motivo). Ao terminar as 3, `registrarTrio` e tela de resumo do período: "Média da manhã: 130/81" + "As medidas foram salvas. Nenhuma interpretação é feita antes do fim do protocolo." → volta para `[sessao]`. Valores ≥ 180/110 durante a MRPA: mostrar a mensagem `muitoElevado` (mesma regra) — a hierarquia de segurança vale dentro da sessão.

- [ ] **Step 6: `relatorio.tsx`** — usa `sessao.resultado` (ou `relatorioParcial` para prévia). Blocos: Período e protocolo ("07/09 a 12/09 · 6 dias · 3+3 medidas") · Qualidade ("34 medidas válidas · 2 excluídas pelo critério da diretriz" + se inválido `StatusBadge` cinza "Não atinge o mínimo para interpretação" e a `mensagemPaciente` da regra `validade`) · Médias (total, manhã, noite em destaque; tabela por dia) · Resultado: se válido e `acimaReferencia` → `StatusBadge` amarelo "Acima da referência (≥ 130 e/ou ≥ 80)" + mensagem da regra `mrpaAcima`; se válido e dentro → "Dentro da referência da MRPA (< 130 e < 80)" sem chip colorido; · Diferença consultório × MRPA quando houver · Medicações em uso (de `useMedicacoes().ativas`) · Sintomas registrados nas medidas · `GraficoBarras` por dia · tabela completa (data, hora, período, PAS/PAD/FC, "excluída: motivo") · rodapé com as duas ressalvas literais: "A MRPA, como os demais exames complementares em medicina, deve ser avaliada segundo critérios do médico assistente." e "Este relatório organiza suas aferições domiciliares e não substitui a interpretação realizada pelo seu médico." · botão "Compartilhar" desabilitado com `EmBreveBadge`.

- [ ] **Step 7: `npm run rotas`, typecheck, jest, Expo Go**: iniciar sessão de 4 dias com início ontem (para testar rápido, mudar a data do aparelho **não** — em vez disso, criar a sessão com `inicio` 3 dias atrás pelo `CampoData` com data passada permitida em desenvolvimento); fazer 3+3 em cada dia; verificar lembretes agendados (`Notifications.getAllScheduledNotificationsAsync()` no log ou tela de lembretes existente); concluir → relatório válido; cancelar uma segunda sessão.

- [ ] **Step 8: Commit** — `feat(cardio): MRPA guiada — iniciar, sessão diária, 3 medidas com cronômetro, relatório com validade (C-011)`.

---

## Task 8: Dashboard do módulo, sinais de alerta e card na Home

**Files:**
- Create: `app/(app)/coracao/index.tsx`, `app/(app)/coracao/sinais.tsx`, `src/modules/coracao/conteudo/sinais.ts`, `src/modules/coracao/componentes/CardResumo.tsx`
- Modify: `app/(app)/index.tsx:80`

- [ ] **Step 1: Conteúdo `sinais.ts`** (§23): lista "Quando procurar atendimento" — dor/pressão intensa no peito; falta de ar importante; desmaio; fraqueza ou formigamento súbito de um lado do corpo; dificuldade para falar; boca torta (assimetria facial); palpitações com mal-estar ou tontura; pressão muito alta (≥ 180/110) com qualquer sintoma acima; glicemia muito baixa com confusão ou muito alta com vômitos (texto de glicemia fica aqui já, pois é educativo). Frase-chave: "Esses sintomas podem representar uma condição que necessita avaliação urgente. Não espere: procure um serviço de emergência ou ligue 192."

- [ ] **Step 2: `CardResumo.tsx`** — `{ titulo; valor: string | null; detalhe?: string; onPress; vazio: string }` — Card raio 20 com título em caption, valor em title, detalhe em caption; quando `valor` é null mostra `vazio` ("Registre para começar") em grafite.

- [ ] **Step 3: `coracao/index.tsx`** — `InternalHeader sectionLabel="Módulo" title="Coração & Metabolismo"`; grade 2 colunas de `CardResumo`: Pressão (última medida casual "128/78" + "há 2 dias"; ou, se há sessão ativa, "MRPA — dia 3 de 6") → `/pressao` ou `/mrpa/<id>`; MRPA (último relatório: "Concluída em 12/09 · média 128/79") → `/mrpa/relatorio?sessao=`; Glicemia · HbA1c · LDL · Risco · Peso com `vazio` "Chega no próximo passo" e `EmBreveBadge` (ativam no plano 2b); `ListItem` "Sinais de alerta — quando procurar atendimento" → `/sinais`; `ListItem` "Como está minha prevenção?" com `EmBreveBadge`.

- [ ] **Step 4: Home** — em `app/(app)/index.tsx:80` remover `emBreve`, `onPress={() => router.push('/(app)/coracao')}` e `descricao` dinâmica: se sessão ativa "MRPA em andamento — dia X de Y"; senão se última PA "Última pressão 128/78"; senão "Pressão, glicemia e risco cardiovascular". Para isso a Home usa `useMrpa()` e `usePressao()` (leves — o `usePressao` carrega 90 dias; aceitável) **ou** `resumoHome.ts` da Task 9 — implementar direto com `resumoHome.ts` (Task 9) para não duplicar; nesta task deixar o card ativo com a descrição fixa.

- [ ] **Step 5: `npm run rotas`, checks, Expo Go, commit** — `feat(cardio): dashboard do módulo, sinais de alerta e aba/card ativos`.

---

## Task 9: Home (itens do Cardio) e lembretes de medicação

**Files:**
- Create: `src/core/cardio/resumoHome.ts`, `src/core/cardio/useResumoCardio.ts`
- Modify: `src/modules/home/montarItensHoje.ts`, `src/modules/home/__tests__/montarItensHoje.test.ts`, `app/(app)/index.tsx`, `app/(app)/minha-saude/medicamentos.tsx`, `src/core/medicacoes/useMedicacoes.ts`

**Interfaces:**
- Produces: `ResumoCardio = { ultimaPA: { pas; pad; medidoEm; nivel: 'laranja' | 'vermelho' | null } | null; mrpaAtiva: { id; dia; diasPrevistos; faltaHoje: PeriodoMrpa[] } | null; mrpaAcimaSemLeitura: { id; concluidaEm } | null }` · `montarItensHoje({ ..., cardio?: ResumoCardio })`.

- [ ] **Step 1: Testes em `montarItensHoje.test.ts`** (acrescentar):

```ts
const perfilOk = { dataNascimento: '1980-01-01', sexoNascimento: 'feminino', alturaCm: 165, tabagismoStatus: 'nunca', temDiabetes: false, temHipertensao: false } as any;
const base = { perfil: perfilOk, antecedentesQtd: 1, medicacoesAtivasQtd: 1 };

test('PA muito elevada nas últimas 24 h vira item laranja/vermelho', () => {
  const itens = montarItensHoje({ ...base, cardio: { ultimaPA: { pas: 185, pad: 95, medidoEm: new Date().toISOString(), nivel: 'laranja' }, mrpaAtiva: null, mrpaAcimaSemLeitura: null } });
  expect(itens[0]).toMatchObject({ id: 'pa_elevada', nivel: 'laranja', rota: '/(app)/coracao/pressao' });
});
test('MRPA em andamento com período faltando hoje vira item amarelo com o dia', () => {
  const itens = montarItensHoje({ ...base, cardio: { ultimaPA: null, mrpaAtiva: { id: 's1', dia: 3, diasPrevistos: 6, faltaHoje: ['noite'] }, mrpaAcimaSemLeitura: null } });
  expect(itens[0]).toMatchObject({ id: 'mrpa_hoje', nivel: 'amarelo', titulo: 'Fazer as medidas da noite — MRPA, dia 3 de 6', rota: '/(app)/coracao/mrpa/s1' });
});
test('MRPA concluída acima da referência vira item amarelo para levar ao médico', () => {
  const itens = montarItensHoje({ ...base, cardio: { ultimaPA: null, mrpaAtiva: null, mrpaAcimaSemLeitura: { id: 's2', concluidaEm: '2026-09-12T10:00:00Z' } } });
  expect(itens.find((i) => i.id === 'mrpa_levar')).toMatchObject({ nivel: 'amarelo', rota: '/(app)/coracao/mrpa/relatorio?sessao=s2' });
});
test('sem cardio nada muda', () => {
  expect(montarItensHoje(base).some((i) => i.id.startsWith('pa_') || i.id.startsWith('mrpa_'))).toBe(false);
});
```

- [ ] **Step 2: Implementar em `montarItensHoje.ts`** — adicionar `cardio?: ResumoCardio` à `Entrada` e, logo após o bloco do Rastreando:

```ts
if (cardio) {
  const { ultimaPA, mrpaAtiva, mrpaAcimaSemLeitura } = cardio;
  if (ultimaPA?.nivel && Date.now() - Date.parse(ultimaPA.medidoEm) < 86_400_000) {
    itens.push({ id: 'pa_elevada', nivel: ultimaPA.nivel, titulo: ultimaPA.nivel === 'vermelho' ? 'Procurar atendimento: pressão muito elevada com sintomas' : 'Repetir a medida: pressão muito elevada', descricao: `Última medida ${ultimaPA.pas}/${ultimaPA.pad}. Descanse 5 minutos e meça de novo.`, rota: '/(app)/coracao/pressao' });
  }
  if (mrpaAtiva && mrpaAtiva.faltaHoje.length && mrpaAtiva.dia >= 1 && mrpaAtiva.dia <= mrpaAtiva.diasPrevistos) {
    const periodo = mrpaAtiva.faltaHoje.includes('manha') ? 'manhã' : 'noite';
    itens.push({ id: 'mrpa_hoje', nivel: 'amarelo', titulo: `Fazer as medidas da ${periodo} — MRPA, dia ${mrpaAtiva.dia} de ${mrpaAtiva.diasPrevistos}`, descricao: '3 medidas com 1 minuto de intervalo.', rota: `/(app)/coracao/mrpa/${mrpaAtiva.id}` });
  }
  if (mrpaAcimaSemLeitura) {
    itens.push({ id: 'mrpa_levar', nivel: 'amarelo', titulo: 'Levar o relatório da MRPA ao médico', descricao: 'Suas medidas ficaram acima da referência. Converse com seu profissional de saúde.', rota: `/(app)/coracao/mrpa/relatorio?sessao=${mrpaAcimaSemLeitura.id}` });
  }
}
```
Ajustar o item "tudo_em_dia" para considerar `cardio` no texto ("Perfil completo, rastreamentos e pressão em ordem.").

- [ ] **Step 3: `resumoHome.ts` + hook** — `montarResumoCardio(userId, hoje): Promise<ResumoCardio>`: última PA casual (`listarPA` limit 1 — acrescentar parâmetro `limite?` em `listarPA`) avaliada com `avaliarMedidaCasual` (sintomas do contexto) → `nivel`; `sessaoAtiva` → `dia` + períodos sem 3 medidas hoje; última sessão concluída com `resultado.acimaReferencia === true` nos últimos 30 dias → `mrpaAcimaSemLeitura` (some quando o usuário abre o relatório: gravar `lembretes` sistema `titulo='mrpa_lida:<id>'`, `status='lido'`; `montarResumoCardio` verifica). `useResumoCardio()` carrega no foco. Na Home: passar `cardio` ao `montarItensHoje` e usar `mrpaAtiva`/`ultimaPA` na descrição do card.

- [ ] **Step 4: Lembretes de medicação** — em `useMedicacoes`: após `salvar`/`alternarAtiva`, se `m.lembrar && m.ativa` → `agendarLembretesMedicacao`, senão `cancelarLembretes(userId, 'medicacao:<id>:')`. Em `medicamentos.tsx`: `Switch` "Lembrar nos horários" no formulário (só se houver horários) e, na Home (`index.tsx`), no `atualizar` chamar `sincronizarLembretesMedicacao(userId, ativas.filter((m) => m.lembrar))` uma vez por abertura (guardar em `useRef`).

- [ ] **Step 5: checks, Expo Go (Home mostra "MRPA — dia X"; medicação com lembrete gera notificações), commit** — `feat(cardio): itens do Cardio na Home e lembretes de medicação por horário (§21–§22)`.

---

## Task 10: Documentação, revisão clínica, checklist, nuvem e merge

**Files:**
- Create: `docs/nero/checklists/fase-2a.md`, `docs/nero/revisao/2026-09-XX-revisao-textos-cardio-2a.md`
- Modify: `docs/nero/funcionamento/coracao-metabolismo.md` (marcar o que foi implementado, ajustar qualquer divergência), `docs/nero/00-ROADMAP.md`, `README.md` (se lista módulos)

- [ ] **Step 1: Documento de revisão de textos** — mesmo formato de `docs/nero/revisao/2026-09-16-revisao-textos-rastreando.md`: todas as strings de `conteudo/pressao.ts`, `conteudo/sinais.ts`, mensagens da semente `pressao` e textos fixos das telas (relatório, ressalvas). Entregar ao Murilo.

- [ ] **Step 2: Checklist `fase-2a.md`** com os fluxos do critério de pronto da spec (§1, 2a) + os percursos das Tasks 6, 7, 9.

- [ ] **Step 3: Funcionamento** — em `coracao-metabolismo.md` §1–§2 acrescentar "Implementado em (data) — arquivos: …" e corrigir qualquer detalhe que tenha mudado na execução (ex.: nome da coluna `lembrar`).

- [ ] **Step 4: Nuvem** — `supabase db push` (0010) e semente das 7 regras na nuvem (executar o bloco Fase 2 do `seed.sql` via SQL editor ou `psql` com a senha do Murilo). Confirmar `select count(*) from regras_clinicas where programa='pressao'` = 7.

- [ ] **Step 5: Checklist do Murilo no celular** → correções → `npx tsc --noEmit && npx jest --ci` → merge em `desenvolvimento-2` (`git merge --no-ff nero-fase2a-pressao`) → push → roadmap: marcar Minha Pressão, MRPA, alertas, lembretes (parte) e dashboard inicial; log de progresso.

---

## Autorrevisão do plano

- **Cobertura da spec (2a):** §1 registro simples + médias/gráfico (T6) · §2–§3 MRPA + relatório em tela (T7) · §4 alertas em camadas (T3, T6) · §21–§22 lembretes de medicação e MRPA (T5, T9) · §19 dashboard inicial (T8) · §23 sinais (T8) · Home (T9) · semente/regras (T1) · testes (T2–T5, T9) · docs/checklist/nuvem (T10). Glicemia, exames, PREVENT, check-up e linha do tempo ficam para o plano 2b.
- **Sem placeholders:** cada função tem código; telas descrevem campos, estados e mensagens com a regra de origem.
- **Consistência de nomes:** `extrairParametros`, `validarPlausibilidade`, `avaliarMedidaCasual`, `deveConvidarMrpa`, `resumoCasual`, `media`, `acimaDe` (T3) usados em T4–T9; `montarRelatorio`, `diaDaSessao`, `podeConcluir`, `dataDoDia`, `classificarMedidaSessao` (T4) usados em T5, T7, T9; `planejarLembretesMrpa` (T5); `carregarRegrasCardio`, `listarPA`, `inserirPACasual`, `inserirLoteMrpa`, `ultimoConviteMrpaEm`, `registrarConviteMrpa`, `sessaoAtiva`, `listarSessoes`, `iniciarSessao`, `concluirSessao`, `cancelarSessao`, `agendarLembretesMrpa`, `cancelarLembretes`, `agendarLembretesMedicacao`, `sincronizarLembretesMedicacao` (T5) usados em T6–T9.
