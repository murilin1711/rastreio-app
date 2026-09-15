# NERO Fase 1 — Rastreando v2 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a tela-ponte do Rastreando pelo módulo completo: cinco programas de rastreamento oncológico com árvores de decisão fiéis às diretrizes, pendências, sintomas de alarme, lembretes e integração com a Home.

**Architecture:** Handlers por programa em `src/core/regras/programas/*` (TS puro, TDD) alimentados por `regras_clinicas` (semente SQL com fonte/versão). Camada `src/core/rastreando/` fala com o Supabase (contexto, registro de exame, lembretes). Telas em `app/(app)/rastreando/**` seguem a sequência do Rastreando v1 (escolher câncer → hub → preciso? / exames / sinais) com o design de `docs/nero/03-DESIGN.md`.

**Tech Stack:** Expo SDK 57 · Expo Router · Supabase (Postgres/RLS, pgTAP) · Jest · expo-notifications.

**Spec:** `docs/superpowers/specs/2026-09-15-nero-fase1-rastreando-design.md` · Decisões: `docs/nero/02-DECISOES.md` (C-001–C-009) · Referências: `docs/nero/referencias/REFERENCIAS.md`

## Global Constraints

- **Antes de codificar cada handler, abrir a URL oficial da referência em `REFERENCIAS.md`, confirmar que não há versão mais nova e anotar a data em "Última verificação".** Se houver versão nova: baixar para o acervo, atualizar a decisão C-00x e só então codificar.
- Toda linha de `regras_clinicas` tem `fonte`, `ano`, `versao='2026.1'`, `revisada_em='2026-09-15'` e, quando existir, o número da recomendação no campo `fonte`.
- `src/core/regras/**` continua sem importar React/Expo/Supabase/UI (teste `sem-dependencias` deve seguir verde).
- Mensagens ao paciente: caixa normal, sem diagnóstico, sempre com "converse com seu médico" quando a conduta depende do profissional. Proibido: "você tem câncer", "seu PSA indica câncer".
- Português com acentos em UI, mensagens, comentários e commits. Rodapé de commit: `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Antes de escrever qualquer tela (Tasks 9–12), reler `docs/nero/03-DESIGN.md` (skill `frontend-design`).
- Branch: `nero-fase1-rastreando` a partir de `desenvolvimento-2`. Supabase local (`supabase start`) para pgTAP; `.env` aponta para a nuvem — **as migrações vão para a nuvem com `supabase db push` só na Task 13**, depois do checklist.
- Novas rotas em `app/` exigem `npm run rotas` para regenerar tipos.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0008_rastreando.sql` | campos do perfil, `sintomas_alarme`, trigger fecha pendência |
| `supabase/seed.sql` | semente `regras_clinicas` |
| `supabase/tests/rastreando.test.sql` | pgTAP: trigger e RLS de sintomas |
| `src/core/regras/tipos.ts` | `ProgramaHandler.faixaEtaria`, campos novos em `PerfilRegras`/`ContextoAvaliacao` |
| `src/core/regras/programas/{mama,colo,colorretal,pulmao,prostata}.ts` | árvores de decisão |
| `src/core/regras/programas/index.ts` | registro dos handlers |
| `src/core/regras/elegibilidade.ts` | usa `faixaEtaria` do handler |
| `src/core/rastreando/contexto.ts` | `montarContexto(userId)` — perfil + antecedentes + medidas + exames + pendências + sintomas → `PerfilRegras` + `ContextoAvaliacao` |
| `src/core/rastreando/regras.ts` | `carregarRegras(programa)` da tabela |
| `src/core/rastreando/registrarExame.ts` | fluxo §42 |
| `src/core/rastreando/lembretes.ts` | agenda em `lembretes` + notificações locais |
| `src/core/rastreando/tipos.ts` | tipos de exame por programa, rótulos |
| `src/modules/rastreando/conteudo/*.ts` | textos educativos, sinais de alerta, perguntas |
| `src/modules/rastreando/componentes/*` | `CardPrograma`, `StatusPrograma`, `FormResultado*` |
| `app/(app)/rastreando/**` | rotas |
| `src/modules/home/montarItensHoje.ts` | itens do Rastreando na Home |

---

## Task 1: Branch, migração 0008, tipos e pgTAP

**Files:**
- Create: `supabase/migrations/0008_rastreando.sql`, `supabase/tests/rastreando.test.sql`
- Modify: `src/core/supabase/database.types.ts` (gerado), `src/core/perfil/tipos.ts`, `src/core/perfil/mapeamento.ts`, `src/core/perfil/__tests__/mapeamento.test.ts`, `src/modules/home/__tests__/montarItensHoje.test.ts`

**Interfaces:**
- Produces: colunas `perfil_saude.ja_teve_atividade_sexual`, `raca_cor`, `menopausa`; tabela `sintomas_alarme`; trigger `exames_fecha_pendencia`; `PerfilSaude.jaTeveAtividadeSexual: boolean | null`, `racaCor: RacaCor | null`, `menopausa: boolean | null`.

- [ ] **Step 1: Branch**

```bash
cd "/Users/muriloroizpovoa/Desktop/App de Rastreio/app-de-rastreio" && git checkout -b nero-fase1-rastreando
```

- [ ] **Step 2: Migração**

`supabase/migrations/0008_rastreando.sql`:
```sql
-- NERO · Fase 1 · campos exigidos pelas diretrizes, sintomas de alarme e fechamento de pendências
alter table public.perfil_saude
  add column ja_teve_atividade_sexual boolean,                 -- INCA 2025 Rec. 36
  add column raca_cor text check (raca_cor in ('branca','preta','parda','amarela','indigena','nao_informar')), -- SBU: 45 anos
  add column menopausa boolean;                                 -- INCA 2025 Rec. 32–33 (informativo)

create table public.sintomas_alarme (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programa text not null check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  sintoma text not null,
  observacao text,
  registrado_em timestamptz not null default now(),
  resolvido_em timestamptz
);
comment on table public.sintomas_alarme is 'Sinais de alerta informados pelo paciente (§52). Enquanto abertos, sobrepõem o calendário de rastreamento (§66).';
create index sintomas_alarme_user_abertos_idx on public.sintomas_alarme (user_id, programa) where resolvido_em is null;
alter table public.sintomas_alarme enable row level security;
create policy sintomas_alarme_owner on public.sintomas_alarme for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- §51: ao registrar o exame que investiga uma pendência, a pendência fecha
create or replace function public.exames_fecha_pendencia()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.resolve_exame_id is not null then
    update public.pendencias
       set status = 'resolvida', exame_resolucao_id = new.id, resolvida_em = now()
     where exame_origem_id = new.resolve_exame_id
       and user_id = new.user_id
       and status = 'aberta';
  end if;
  return new;
end $$;
create trigger exames_fecha_pendencia after insert on public.exames
  for each row execute function public.exames_fecha_pendencia();
```

- [ ] **Step 3: pgTAP**

`supabase/tests/rastreando.test.sql`:
```sql
begin;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000001a', 'ra@teste.dev'),
  ('00000000-0000-0000-0000-00000000001b', 'rb@teste.dev');

-- A tem FIT positivo com pendência aberta
insert into public.exames (id, user_id, tipo, categoria, modulo, programa, data_realizacao, resultado, classificacao, nivel_alerta, abre_pendencia)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000001a', 'fit', 'rastreamento', 'rastreando', 'colorretal', '2026-08-01', '{"fit":"positivo"}', 'investigacao', 'laranja', true);
insert into public.pendencias (user_id, exame_origem_id, programa, descricao, nivel_alerta)
values ('00000000-0000-0000-0000-00000000001a', '10000000-0000-0000-0000-000000000001', 'colorretal', 'Colonoscopia ainda não registrada', 'laranja');

-- registra a colonoscopia ligada ao FIT
insert into public.exames (user_id, tipo, categoria, modulo, programa, data_realizacao, resultado, classificacao, nivel_alerta, resolve_exame_id)
values ('00000000-0000-0000-0000-00000000001a', 'colonoscopia', 'rastreamento', 'rastreando', 'colorretal', '2026-09-10', '{"achado":"normal","qualidade_adequada":true}', 'normal', 'verde', '10000000-0000-0000-0000-000000000001');

select is((select status from public.pendencias where exame_origem_id = '10000000-0000-0000-0000-000000000001'), 'resolvida', 'trigger fecha a pendência ao registrar exame relacionado');
select isnt((select exame_resolucao_id from public.pendencias where exame_origem_id = '10000000-0000-0000-0000-000000000001'), null, 'pendência aponta para o exame que a resolveu');

insert into public.sintomas_alarme (user_id, programa, sintoma) values ('00000000-0000-0000-0000-00000000001b', 'mama', 'nodulo_mamario');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000001a","role":"authenticated"}';
select is((select count(*) from public.sintomas_alarme), 0::bigint, 'A não vê sintomas de B');
select throws_ok(
  $$insert into public.sintomas_alarme (user_id, programa, sintoma) values ('00000000-0000-0000-0000-00000000001b', 'mama', 'x')$$,
  '42501', null, 'A não registra sintoma em nome de B');

select * from finish();
rollback;
```

- [ ] **Step 4: Aplicar e testar**

```bash
supabase db reset && supabase test db
```
Esperado: `Files=2, Tests=8` PASS.

- [ ] **Step 5: Tipos gerados e domínio**

```bash
npm run -s db:types && sed -i '' '1,/^export type Json/{/A new version\|We recommend\|Connecting to db/d;}' src/core/supabase/database.types.ts
```
Em `src/core/perfil/tipos.ts` acrescentar:
```ts
export type RacaCor = 'branca' | 'preta' | 'parda' | 'amarela' | 'indigena' | 'nao_informar';
```
e no `PerfilSaude`, após `radioterapiaToracica`:
```ts
  jaTeveAtividadeSexual: boolean | null;
  racaCor: RacaCor | null;
  menopausa: boolean | null;
```
Em `mapeamento.ts`: `jaTeveAtividadeSexual: 'ja_teve_atividade_sexual', racaCor: 'raca_cor', menopausa: 'menopausa'` no mapa e em `paraDominio` (`racaCor: r.raca_cor as PerfilSaude['racaCor']`). Atualizar os objetos de teste (`row` em mapeamento.test e `completo` em montarItensHoje.test) com `ja_teve_atividade_sexual: null, raca_cor: null, menopausa: null` / `jaTeveAtividadeSexual: null, racaCor: null, menopausa: null`.

- [ ] **Step 6: Verificar e commitar**

```bash
npx tsc --noEmit && npx jest 2>&1 | grep Tests:
git add -A && git commit -m "feat(db): campos do perfil exigidos pelas diretrizes, sintomas_alarme e trigger que fecha pendências

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 2: Contratos do motor — `faixaEtaria`, contexto ampliado, perfil ampliado

**Files:**
- Modify: `src/core/regras/tipos.ts`, `src/core/regras/elegibilidade.ts`, `src/core/regras/__tests__/elegibilidade.test.ts`

**Interfaces:**
- Produces:
```ts
// PerfilRegras ganha:
racaCor: 'branca'|'preta'|'parda'|'amarela'|'indigena'|'nao_informar'|null;
imc: number | null;
jaTeveAtividadeSexual: boolean | null;
histerectomia: boolean | null;
// ContextoAvaliacao ganha:
colonoscopiaAdequadaEm: string | null;   // data ISO da última colonoscopia completa e de qualidade
// ProgramaHandler ganha (opcional):
faixaEtaria?(perfil: PerfilRegras): { min: number; max: number | null } | null;  // null = não aplicável por critérios
// ResultadoElegibilidade ganha:
detalhes?: string;   // regra citada (ex.: "ACG 2021, Rec. 9")
```

- [ ] **Step 1: Testes novos em `elegibilidade.test.ts`**

```ts
it('usa faixaEtaria do handler quando existir (ex.: 45 para alto risco)', () => {
  const handlers = { prostata: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => ({ min: 45, max: 75 }) } };
  const perfilM = { ...perfilBase, sexoNascimento: 'masculino' as const, idade: 46 };
  const r = avaliarElegibilidade(perfilM, 'prostata', [{ ...regraFaixa, id: 'r-prost', condicao: { idade_min: 50, idade_max: 75 } }], vazio, hoje, handlers);
  expect(r.status).toBe('indicado');
});
it('faixaEtaria null → não indicado no momento com mensagem do handler', () => {
  const handlers = { pulmao: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => null, mensagemNaoElegivel: () => 'Critérios de tabagismo não atendidos.' } };
  const r = avaliarElegibilidade(perfilBase, 'pulmao', [regraFaixa], vazio, hoje, handlers);
  expect(r.status).toBe('nao_indicado_no_momento');
  expect(r.mensagem).toMatch(/tabagismo/);
});
it('max null → nunca "acima da faixa"', () => {
  const handlers = { colo_utero: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => ({ min: 25, max: null }) } };
  expect(avaliarElegibilidade({ ...perfilBase, idade: 70 }, 'colo_utero', [regraFaixa], vazio, hoje, handlers).status).toBe('indicado');
});
```
Atualizar `perfilBase` do teste com `racaCor: null, imc: null, jaTeveAtividadeSexual: true, histerectomia: false` e `vazio` com `colonoscopiaAdequadaEm: null`. Fazer o mesmo em `classificar.test.ts` e `seguranca.test.ts`.

- [ ] **Step 2: Rodar (falha)** — `npx jest src/core/regras`.

- [ ] **Step 3: `tipos.ts`** — adicionar os campos acima; em `ProgramaHandler` acrescentar `faixaEtaria?` e `mensagemNaoElegivel?(perfil: PerfilRegras): string`.

- [ ] **Step 4: `elegibilidade.ts`** — substituir o bloco que lê `idade_min/idade_max` da regra por:

```ts
  const faixa = handler?.faixaEtaria
    ? handler.faixaEtaria(perfil)
    : (regra ? { min: regra.condicao.idade_min as number, max: (regra.condicao.idade_max as number | undefined) ?? null } : undefined);

  if (faixa === undefined) return { ...base, status: 'avaliacao_individualizada', mensagem: MSG.semRegra };
  if (faixa === null) return { ...ref, status: 'nao_indicado_no_momento', mensagem: handler?.mensagemNaoElegivel?.(perfil) ?? MSG.jovem };

  const min = faixa.min;
  const max = faixa.max ?? Infinity;
```
(`regra` continua sendo a linha de elegibilidade — usada para `intervaloMeses`, `mensagemPaciente`, `regraId`; se não houver regra mas houver handler com faixa, `ref` usa `regraId: null`.)

- [ ] **Step 5: Rodar (passa) e commitar**

```bash
npx jest src/core/regras && npx tsc --noEmit
git add -A && git commit -m "feat(regras): faixa etária por handler, contexto de colonoscopia e campos de perfil para as diretrizes

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 3: Handler **mama** (TDD) — CBR/SBM/FEBRASGO 2023

**Pré-passo obrigatório:** abrir https://cbr.org.br/wp-content/uploads/2023/09/Recomendacoes-do-Colegio.pdf e a página do CBR; confirmar que não há atualização posterior a 2023; anotar em `REFERENCIAS.md` → "Última verificação".

**Files:**
- Create: `src/core/regras/programas/mama.ts`, `src/core/regras/programas/__tests__/mama.test.ts`, `src/core/regras/programas/util.ts`
- Modify: `src/core/regras/programas/index.ts`

**Interfaces:**
- Produces: `mama: ProgramaHandler`; `util.ts` exporta `temAntecedente(perfil, condicao, grau?, idadeMax?)`, `idadeMaisJovem(perfil, condicao)`, `temGenetica(perfil, ...nomes)`, `temHistoricoPessoal(perfil, termo)`, `casaCondicao(regra, exame, extras?)`.

- [ ] **Step 1: `util.ts`**

```ts
import type { ExameEntrada, PerfilRegras, RegraParametros } from '../tipos';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function temAntecedente(perfil: PerfilRegras, condicao: string, grau?: 'primeiro' | 'segundo', idadeMax?: number): boolean {
  return perfil.antecedentes.some((a) =>
    a.condicao === condicao &&
    (grau ? a.grau === grau : true) &&
    (idadeMax == null ? true : a.idadeDiagnostico != null && a.idadeDiagnostico < idadeMax));
}

export function contarAntecedentes(perfil: PerfilRegras, condicao: string, grau: 'primeiro' | 'segundo'): number {
  return perfil.antecedentes.filter((a) => a.condicao === condicao && a.grau === grau).length;
}

export function idadeMaisJovem(perfil: PerfilRegras, condicao: string, grau?: 'primeiro' | 'segundo'): number | null {
  const idades = perfil.antecedentes
    .filter((a) => a.condicao === condicao && (grau ? a.grau === grau : true) && a.idadeDiagnostico != null)
    .map((a) => a.idadeDiagnostico as number);
  return idades.length ? Math.min(...idades) : null;
}

export function temGenetica(perfil: PerfilRegras, ...termos: string[]): boolean {
  const lista = perfil.doencasGeneticas.map(norm);
  return termos.some((t) => lista.some((g) => g.includes(norm(t))));
}

export function temHistoricoPessoal(perfil: PerfilRegras, ...termos: string[]): boolean {
  const lista = [...perfil.historicoCancerPessoal, ...perfil.lesoesPrecursoras].map(norm);
  return termos.some((t) => lista.some((h) => h.includes(norm(t))));
}

/** Casamento genérico com campos extras injetados pelo handler (ex.: imunossuprimida). */
export function casaCondicao(regra: RegraParametros, exame: ExameEntrada, extras: Record<string, unknown> = {}): boolean {
  const alvo = { ...exame.resultado, ...extras };
  const chaves = Object.keys(regra.condicao).filter((k) => !k.startsWith('idade_'));
  return chaves.length > 0 && chaves.every((k) => regra.condicao[k] === alvo[k]);
}
```

- [ ] **Step 2: Teste `mama.test.ts` (falhando)**

```ts
import { mama } from '../mama';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 45, sexoNascimento: 'feminino', possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false,
  racaCor: null, imc: 24, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'T', ano: 2023, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 12, mensagemPaciente: '', ...extra,
});
const mamo = (birads: number, extra: Record<string, unknown> = {}): ExameEntrada => ({ tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-09-01', resultado: { birads, ...extra } });

describe('mama — aplicabilidade e faixa (CBR/SBM/FEBRASGO 2023)', () => {
  it('só sexo feminino', () => expect(mama.aplicavel({ ...base, sexoNascimento: 'masculino' })).toBe(false));
  it('faixa habitual 40–74', () => expect(mama.faixaEtaria!(base)).toEqual({ min: 40, max: 74 }));
});

describe('mama — fatores modificadores', () => {
  it('risco habitual → null', () => expect(mama.fatoresModificadores(base)).toBeNull());
  it('câncer de mama tratado → acompanhamento especializado (mensagem cita mamografia anual)', () => {
    expect(mama.fatoresModificadores({ ...base, historicoCancerPessoal: ['Câncer de mama'] })).toMatch(/tratamento.*mamografia anual/i);
  });
  it('BRCA1 → não antes de 35', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['BRCA1'] })).toMatch(/35 anos/));
  it('TP53 → não antes de 30', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['TP53'] })).toMatch(/30 anos/));
  it('BRCA2 ou PALB2 → não antes de 30', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['PALB2'] })).toMatch(/30 anos/));
  it('radioterapia torácica antes dos 30 → 8º ano após o tratamento', () => expect(mama.fatoresModificadores({ ...base, radioterapiaToracica: true })).toMatch(/8/));
  it('HLA/CLIS/HDA → estimativa de risco com o médico', () => expect(mama.fatoresModificadores({ ...base, lesoesPrecursoras: ['Hiperplasia ductal atípica'] })).toMatch(/modelo|estimativa/i));
  it('1º grau com mama → orientar estimativa de risco; se ≥20%, 10 anos antes do parente (não antes de 30)', () => {
    const m = mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'mama', grau: 'primeiro', idadeDiagnostico: 42 }] });
    expect(m).toMatch(/32 anos|10 anos antes/);
  });
  it('mama masculina ou ovário na família → forte história familiar', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'ovario', grau: 'primeiro', idadeDiagnostico: null }] })).toMatch(/hist[oó]ria familiar/i);
  });
  it('2º grau isolado → não é modificador', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'mama', grau: 'segundo', idadeDiagnostico: 70 }] })).toBeNull();
  });
});

describe('mama — seleção de regra por BI-RADS', () => {
  const regras = [regra('b1', { birads: 1 }), regra('b3', { birads: 3 }, { classificacao: 'controle', intervaloMeses: 6 })];
  it('casa pelo birads', () => expect(mama.selecionarRegra(mamo(1), regras, base, ctx)?.id).toBe('b1'));
  it('BI-RADS 3 com intervalo do laudo usa o laudo', () => {
    const r = mama.selecionarRegra(mamo(3, { intervalo_laudo_meses: 4 }), regras, base, ctx);
    expect(r?.intervaloMeses).toBe(4);
  });
  it('sem regra → null', () => expect(mama.selecionarRegra(mamo(9), regras, base, ctx)).toBeNull());
});
```

- [ ] **Step 3: Rodar (falha)** — `npx jest src/core/regras/programas`.

- [ ] **Step 4: `mama.ts`**

```ts
import type { ProgramaHandler } from '../tipos';
import { casaCondicao, contarAntecedentes, idadeMaisJovem, temAntecedente, temGenetica, temHistoricoPessoal } from './util';

const FONTE = 'CBR/SBM/FEBRASGO 2023 (Urban et al., Radiol Bras 56(4):207-14)';

/** Rastreamento do câncer de mama — decisões C-001 e C-009. */
export const mama: ProgramaHandler = {
  aplicavel: (p) => p.sexoNascimento === 'feminino',

  // Risco habitual: MG anual 40–74; ≥ 75 → "acompanhamento médico" (expectativa de vida ≥ 7 anos).
  faixaEtaria: () => ({ min: 40, max: 74 }),

  fatoresModificadores(p) {
    if (temHistoricoPessoal(p, 'mama', 'CDIS', 'carcinoma ductal')) {
      return `Você já teve câncer de mama. Após o tratamento, a recomendação é mamografia anual (6 meses após a radioterapia em cirurgia conservadora; 1 ano após o tratamento na mastectomia, para a mama contralateral). O seguimento é definido pela sua equipe. (${FONTE})`;
    }
    if (temGenetica(p, 'BRCA1')) {
      return `Mutação em BRCA1: mamografia anual a partir do diagnóstico da mutação, não antes dos 35 anos, e ressonância anual não antes dos 25. Seu protocolo é individualizado — converse com mastologista. (${FONTE})`;
    }
    if (temGenetica(p, 'TP53', 'Li-Fraumeni')) {
      return `Mutação em TP53: mamografia anual não antes dos 30 anos e ressonância não antes dos 20. Protocolo individualizado com mastologista. (${FONTE})`;
    }
    if (temGenetica(p, 'BRCA2', 'PALB2', 'CHEK2', 'ATM', 'CDH1', 'PTEN', 'STK11')) {
      return `Mutação em gene de risco moderado a alto para câncer de mama: mamografia e ressonância anuais a partir do diagnóstico, não antes dos 30 anos. Protocolo individualizado com mastologista. (${FONTE})`;
    }
    if (p.radioterapiaToracica) {
      return `Radioterapia no tórax antes dos 30 anos: mamografia anual a partir do 8º ano após o tratamento (não antes dos 30) e ressonância anual (não antes dos 25). Converse com mastologista. (${FONTE})`;
    }
    if (temHistoricoPessoal(p, 'hiperplasia', 'HLA', 'HDA', 'CLIS', 'carcinoma lobular in situ')) {
      return `Lesão como hiperplasia atípica ou carcinoma lobular in situ pede estimativa do seu risco por um modelo matemático com o médico: abaixo de 20%, mamografia anual a partir dos 40; a partir de 20%, mamografia e ressonância anuais desde o diagnóstico (não antes dos 30). (${FONTE})`;
    }
    const forte =
      temAntecedente(p, 'mama', 'primeiro') ||
      temAntecedente(p, 'ovario') ||
      contarAntecedentes(p, 'mama', 'primeiro') + contarAntecedentes(p, 'mama', 'segundo') >= 2;
    if (forte) {
      const jovem = idadeMaisJovem(p, 'mama', 'primeiro');
      const inicio = jovem != null ? Math.max(30, jovem - 10) : null;
      const quando = inicio != null ? ` Se o risco estimado for de 20% ou mais, a recomendação é mamografia e ressonância anuais a partir dos ${inicio} anos (10 anos antes do parente mais jovem, não antes dos 30).` : ' Se o risco estimado for de 20% ou mais, mamografia e ressonância anuais começam 10 anos antes do diagnóstico do parente mais jovem (não antes dos 30).';
      return `Sua história familiar pode indicar risco aumentado. Peça ao seu médico uma estimativa do risco ao longo da vida por um modelo matemático.${quando} (${FONTE})`;
    }
    return null;
  },

  selecionarRegra(exame, regras) {
    const regra = regras.find((r) => casaCondicao(r, exame)) ?? null;
    if (!regra) return null;
    // BI-RADS 3: o intervalo do laudo prevalece sobre o padrão de 6 meses (C-009)
    const doLaudo = exame.resultado.intervalo_laudo_meses;
    if (regra.classificacao === 'controle' && typeof doLaudo === 'number' && doLaudo > 0) {
      return { ...regra, intervaloMeses: doLaudo };
    }
    return regra;
  },
};
```

- [ ] **Step 5: Registrar em `programas/index.ts`**

```ts
import type { ProgramaHandlers } from '../tipos';
import { mama } from './mama';

export const handlers: ProgramaHandlers = { mama };
```

- [ ] **Step 6: Rodar (passa), tsc, commit**

```bash
npx jest src/core/regras && npx tsc --noEmit
git add -A && git commit -m "feat(regras): handler de mama — CBR/SBM/FEBRASGO 2023 (alto risco, BI-RADS, intervalo do laudo)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 4: Handler **colo do útero** (TDD) — INCA 2025

**Pré-passo obrigatório:** abrir https://ninho.inca.gov.br/jspui/handle/123456789/17858 e confirmar que a 3ª edição (2025) é a mais recente; anotar em `REFERENCIAS.md`.

**Files:**
- Create: `src/core/regras/programas/colo.ts`, `src/core/regras/programas/__tests__/colo.test.ts`
- Modify: `src/core/regras/programas/index.ts`

- [ ] **Step 1: Teste (falhando)**

```ts
import { colo } from '../colo';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 35, sexoNascimento: 'feminino', possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false,
  racaCor: null, imc: 24, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'INCA 2025', ano: 2025, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 60, mensagemPaciente: '', ...extra,
});
const hpv = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'dna_hpv', programa: 'colo_utero', dataRealizacao: '2026-09-01', resultado: r });
const regras = [
  regra('neg', { hpv: 'negativo', imunossuprimida: false }, { intervaloMeses: 60 }),
  regra('neg-imuno', { hpv: 'negativo', imunossuprimida: true }, { intervaloMeses: 36 }),
  regra('1618', { hpv: '16_18' }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('outros-imuno', { hpv: 'outros_oncogenicos', imunossuprimida: true }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('outros-reflexa-neg', { hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa', imunossuprimida: false }, { classificacao: 'controle', nivelAlerta: 'amarelo', intervaloMeses: 12 }),
  regra('outros-reflexa-hsil', { hpv: 'outros_oncogenicos', citologia_reflexa: 'hsil', imunossuprimida: false }, { classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: null }),
];

describe('colo — aplicabilidade (Rec. 34, 36)', () => {
  it('sem colo do útero → não aplicável', () => expect(colo.aplicavel({ ...base, possuiColoUtero: false })).toBe(false));
  it('sem atividade sexual → não aplicável', () => expect(colo.aplicavel({ ...base, jaTeveAtividadeSexual: false })).toBe(false));
  it('atividade sexual desconhecida → aplicável (pergunta depois)', () => expect(colo.aplicavel({ ...base, jaTeveAtividadeSexual: null })).toBe(true));
});

describe('colo — faixa etária (Rec. 1, 12, 13, 37, 38)', () => {
  it('risco padrão: 25 até 64 (encerra pelo último teste após 60)', () => expect(colo.faixaEtaria!(base)).toEqual({ min: 25, max: 64 }));
  it('HIV/imunossupressão: começa com a atividade sexual e não encerra', () => {
    expect(colo.faixaEtaria!({ ...base, idade: 20, condicoes: { hiv: true } })).toEqual({ min: 0, max: null });
  });
});

describe('colo — modificadores (Rec. 14, 35)', () => {
  it('NIC 2/3 ou AIS tratada → manter 25 anos após o tratamento', () => {
    expect(colo.fatoresModificadores({ ...base, lesoesPrecursoras: ['NIC 3'] })).toMatch(/25 anos/);
  });
  it('histerectomia por lesão/câncer → coleta vaginal ≥ 25 anos', () => {
    expect(colo.fatoresModificadores({ ...base, possuiColoUtero: false, histerectomia: true, historicoCancerPessoal: ['colo do útero'] })).toMatch(/coleta vaginal/i);
  });
  it('HIV não é modificador (muda intervalo e conduta no fluxo normal)', () => {
    expect(colo.fatoresModificadores({ ...base, condicoes: { hiv: true } })).toBeNull();
  });
});

describe('colo — seleção de regra (Rec. 18, 39, 40; §45)', () => {
  it('negativo, risco padrão → 60 meses', () => expect(colo.selecionarRegra(hpv({ hpv: 'negativo' }), regras, base, ctx)?.id).toBe('neg'));
  it('negativo, imunossuprimida → 36 meses (Rec. 39)', () => expect(colo.selecionarRegra(hpv({ hpv: 'negativo' }), regras, { ...base, condicoes: { imunossupressao: true } }, ctx)?.id).toBe('neg-imuno'));
  it('16/18 → colposcopia', () => expect(colo.selecionarRegra(hpv({ hpv: '16_18' }), regras, base, ctx)?.id).toBe('1618'));
  it('outros oncogênicos + imunossuprimida → colposcopia independentemente da reflexa (Rec. 40)', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa' }), regras, { ...base, condicoes: { hiv: true } }, ctx)?.id).toBe('outros-imuno');
  });
  it('outros oncogênicos sem citologia reflexa → null (pendente, §45.3)', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos' }), regras, base, ctx)).toBeNull();
  });
  it('outros oncogênicos + reflexa negativa → controle 12 meses', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa' }), regras, base, ctx)?.id).toBe('outros-reflexa-neg');
  });
  it('outros oncogênicos + reflexa HSIL → especializado', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'hsil' }), regras, base, ctx)?.id).toBe('outros-reflexa-hsil');
  });
});
```

- [ ] **Step 2: Rodar (falha).**

- [ ] **Step 3: `colo.ts`**

```ts
import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao, temHistoricoPessoal } from './util';

const FONTE = 'INCA 2025 — Diretrizes para o Rastreamento do Câncer do Colo do Útero, 3. ed.';

export function imunossuprimida(p: PerfilRegras): boolean {
  return p.condicoes.hiv === true || p.condicoes.imunossupressao === true;
}

/** Rastreamento do câncer do colo do útero — decisões C-002 e C-003. */
export const colo: ProgramaHandler = {
  // Rec. 34/36: sem colo do útero ou sem história de atividade sexual → fora do rastreamento.
  // Exceção tratada em fatoresModificadores: histerectomia por lesão/câncer (Rec. 35).
  aplicavel: (p) => p.possuiColoUtero === true && p.jaTeveAtividadeSexual !== false,

  // Rec. 1 (início aos 25). Rec. 12/13: encerra quando o último teste após os 60 for negativo; até lá, até 64 (programa histórico).
  // Rec. 37/38: HIV/imunossupressão inicia com a atividade sexual e não encerra.
  faixaEtaria: (p) => (imunossuprimida(p) ? { min: 0, max: null } : { min: 25, max: 64 }),

  mensagemNaoElegivel: () => 'O rastreamento do colo do útero começa aos 25 anos para quem já teve atividade sexual. Mantenha seu perfil atualizado para o NERO avisar quando chegar o momento.',

  fatoresModificadores(p) {
    if (temHistoricoPessoal(p, 'NIC 2', 'NIC2', 'NIC 3', 'NIC3', 'AIS', 'adenocarcinoma in situ')) {
      return `Você já tratou uma lesão de alto grau do colo do útero (NIC 2, NIC 3 ou AIS). A diretriz recomenda manter o rastreamento por até 25 anos após o tratamento, mesmo depois dos 60. Converse com seu ginecologista. (${FONTE}, Rec. 14)`;
    }
    if (p.histerectomia && temHistoricoPessoal(p, 'colo', 'cervical', 'NIC')) {
      return `Histerectomia por lesão precursora ou câncer do colo do útero: a diretriz recomenda coleta vaginal por pelo menos 25 anos ou indefinidamente. Converse com seu ginecologista. (${FONTE}, Rec. 35)`;
    }
    return null;
  },

  selecionarRegra(exame, regras, perfil) {
    const extras = { imunossuprimida: imunossuprimida(perfil) };
    // Rec. 40: em imunossupressão, qualquer HPV positivo vai à colposcopia — a regra específica casa antes da reflexa.
    if (exame.tipo === 'dna_hpv' && exame.resultado.hpv === 'outros_oncogenicos') {
      if (extras.imunossuprimida) return regras.find((r) => casaCondicao(r, { ...exame, resultado: { hpv: 'outros_oncogenicos' } }, extras)) ?? null;
      // §45.3: sem citologia reflexa não há conduta → null (classificarExame devolve "pendente")
      if (exame.resultado.citologia_reflexa == null) return null;
    }
    return regras.find((r) => casaCondicao(r, exame, extras)) ?? null;
  },
};
```

- [ ] **Step 4: Registrar em `index.ts`** (`import { colo } from './colo'; export const handlers = { mama, colo_utero: colo };`).

- [ ] **Step 5: Rodar (passa), tsc, commit**

```bash
npx jest src/core/regras && npx tsc --noEmit
git add -A && git commit -m "feat(regras): handler do colo do útero — INCA 2025 (DNA-HPV, imunossupressão, encerramento, modificadores)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 5: Handler **colorretal** (TDD) — CONITEC 2026 + ACG 2021

**Pré-passo obrigatório:** checar em https://www.gov.br/conitec/pt-br (relatórios/diretrizes) se a versão **final** das Diretrizes de Cólon e Reto foi publicada; se sim, baixar, substituir o preliminar no acervo, reler as recomendações 5–8 e atualizar C-004 antes de codificar. Checar também se a ACG publicou atualização posterior a 2021.

**Files:**
- Create: `src/core/regras/programas/colorretal.ts`, `src/core/regras/programas/__tests__/colorretal.test.ts`
- Modify: `src/core/regras/programas/index.ts`, `src/core/regras/elegibilidade.ts` (supressão de FIT), `src/core/regras/__tests__/elegibilidade.test.ts`

- [ ] **Step 1: Teste (falhando)**

```ts
import { colorretal } from '../colorretal';
import { avaliarElegibilidade } from '../../elegibilidade';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';

const hoje = new Date('2026-09-15T12:00:00Z');
const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 55, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null,
  racaCor: null, imc: 25, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'CONITEC 2026', ano: 2026, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 24, mensagemPaciente: 'FIT bienal', ...extra,
});
const regras = [
  regra('eleg', { idade_min: 50, idade_max: 75 }),
  regra('fit-neg', { fit: 'negativo' }),
  regra('fit-pos', { fit: 'positivo' }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('colo-normal', { achado: 'normal', qualidade_adequada: true }, { intervaloMeses: 120 }),
  regra('colo-incompleta', { achado: 'incompleta' }, { classificacao: 'pendente', nivelAlerta: 'cinza', intervaloMeses: null }),
  regra('polipo-aguardando', { achado: 'polipos', histopatologico: 'aguardando' }, { classificacao: 'pendente', nivelAlerta: 'cinza', intervaloMeses: null }),
  regra('polipo-hiperplasico', { achado: 'polipos', histopatologico: 'hiperplasico' }, { intervaloMeses: 120 }),
  regra('polipo-adenoma', { achado: 'polipos', histopatologico: 'adenoma' }, { classificacao: 'controle', nivelAlerta: 'amarelo', intervaloMeses: null }),
  regra('massa', { achado: 'massa_suspeita' }, { classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: null }),
];
const fit = (v: string): ExameEntrada => ({ tipo: 'fit', programa: 'colorretal', dataRealizacao: '2026-09-01', resultado: { fit: v } });
const colono = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'colonoscopia', programa: 'colorretal', dataRealizacao: '2026-09-01', resultado: r });

describe('colorretal — faixa e aplicabilidade (CONITEC Rec. 5–6)', () => {
  it('aplicável a todos', () => expect(colorretal.aplicavel(base)).toBe(true));
  it('50–75 risco padrão', () => expect(colorretal.faixaEtaria!(base)).toEqual({ min: 50, max: 75 }));
});

describe('colorretal — modificadores (CONITEC "risco padrão" + ACG 2021 Rec. 9–12)', () => {
  it('risco padrão → null', () => expect(colorretal.fatoresModificadores(base)).toBeNull());
  it('DII → individualizada', () => expect(colorretal.fatoresModificadores({ ...base, condicoes: { dii: true } })).toMatch(/inflamat/i));
  it('Lynch/PAF → individualizada com avaliação genética', () => expect(colorretal.fatoresModificadores({ ...base, doencasGeneticas: ['Síndrome de Lynch'] })).toMatch(/gen[eé]tic/i));
  it('CCR ou adenoma prévio → seguimento individualizado', () => expect(colorretal.fatoresModificadores({ ...base, lesoesPrecursoras: ['Adenoma tubular'] })).toMatch(/seguimento/i));
  it('1º grau < 60 → colonoscopia aos 40 ou 10 anos antes; a cada 5 anos (Rec. 9)', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 42 }] });
    expect(m).toMatch(/32 anos/); expect(m).toMatch(/5 anos/);
  });
  it('≥ 2 de 1º grau em qualquer idade → Rec. 9', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [
      { condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 70 }, { condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 65 }] });
    expect(m).toMatch(/40 anos/); expect(m).toMatch(/5 anos/);
  });
  it('1 de 1º grau ≥ 60 → iniciar aos 40 e depois risco médio (Rec. 11)', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 68 }] });
    expect(m).toMatch(/40 anos/); expect(m).toMatch(/risco m[eé]dio|habitual/i);
  });
  it('2º grau → risco médio (Rec. 12) → null', () => {
    expect(colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'segundo', idadeDiagnostico: 55 }] })).toBeNull();
  });
});

describe('colorretal — seleção de regra (§46–47)', () => {
  it('FIT negativo / positivo', () => {
    expect(colorretal.selecionarRegra(fit('negativo'), regras, base, ctx)?.id).toBe('fit-neg');
    expect(colorretal.selecionarRegra(fit('positivo'), regras, base, ctx)?.id).toBe('fit-pos');
  });
  it('colonoscopia normal e adequada → 120 meses', () => expect(colorretal.selecionarRegra(colono({ achado: 'normal', qualidade_adequada: true }), regras, base, ctx)?.id).toBe('colo-normal'));
  it('colonoscopia normal SEM qualidade adequada → null (pendente: repetir conforme o médico)', () => {
    expect(colorretal.selecionarRegra(colono({ achado: 'normal', qualidade_adequada: false }), regras, base, ctx)).toBeNull();
  });
  it('pólipos: o histopatológico aninhado decide', () => {
    expect(colorretal.selecionarRegra(colono({ achado: 'polipos', polipos: { quantidade: 1, maior_mm: 4, removidos: true, histopatologico: 'aguardando' } }), regras, base, ctx)?.id).toBe('polipo-aguardando');
    expect(colorretal.selecionarRegra(colono({ achado: 'polipos', polipos: { quantidade: 1, maior_mm: 4, removidos: true, histopatologico: 'hiperplasico' } }), regras, base, ctx)?.id).toBe('polipo-hiperplasico');
  });
  it('adenoma com intervalo do laudo → controle com o intervalo do laudo', () => {
    const r = colorretal.selecionarRegra(colono({ achado: 'polipos', intervalo_laudo_meses: 36, polipos: { quantidade: 2, maior_mm: 8, removidos: true, histopatologico: 'adenoma' } }), regras, base, ctx);
    expect(r?.id).toBe('polipo-adenoma'); expect(r?.intervaloMeses).toBe(36);
  });
  it('massa suspeita → especializado', () => expect(colorretal.selecionarRegra(colono({ achado: 'massa_suspeita' }), regras, base, ctx)?.id).toBe('massa'));
});

describe('colorretal — colonoscopia adequada suprime FIT por 10 anos (CONITEC, texto da Rec. 8)', () => {
  it('com colonoscopia adequada há 3 anos → em dia, próxima = colonoscopia + 120 meses', () => {
    const c: ContextoAvaliacao = { ...ctx, colonoscopiaAdequadaEm: '2023-06-01' };
    const r = avaliarElegibilidade(base, 'colorretal', regras, c, hoje, { colorretal });
    expect(r.status).toBe('em_dia'); expect(r.proximaData).toBe('2033-06-01');
  });
});
```

- [ ] **Step 2: Rodar (falha).**

- [ ] **Step 3: `colorretal.ts`**

```ts
import type { ProgramaHandler } from '../tipos';
import { casaCondicao, contarAntecedentes, idadeMaisJovem, temAntecedente, temGenetica, temHistoricoPessoal } from './util';

const CONITEC = 'CONITEC 2026 — Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto';
const ACG = 'ACG 2021 (Shaukat et al.)';

/** Rastreamento colorretal — decisões C-004 e C-005. */
export const colorretal: ProgramaHandler = {
  aplicavel: () => true,
  faixaEtaria: () => ({ min: 50, max: 75 }), // CONITEC Rec. 5 e 6
  mensagemNaoElegivel: () => 'O rastreamento colorretal de risco padrão começa aos 50 anos. Mantenha seu perfil atualizado.',

  fatoresModificadores(p) {
    // CONITEC: fora do "risco padrão"
    if (temGenetica(p, 'Lynch', 'polipose', 'PAF', 'FAP', 'MUTYH')) {
      return `Síndrome genética associada ao câncer colorretal: o rastreamento é individualizado e começa mais cedo. Procure acompanhamento com gastroenterologista/coloproctologista e avaliação genética. (${CONITEC})`;
    }
    if (p.condicoes.dii) {
      return `Doença inflamatória intestinal (Crohn ou retocolite) muda o protocolo: a vigilância é feita por colonoscopia em intervalos definidos pelo seu gastroenterologista, não pelo FIT. (${CONITEC})`;
    }
    if (temHistoricoPessoal(p, 'colorretal', 'cólon', 'colon', 'reto', 'adenoma', 'pólipo', 'polipo')) {
      return `Você já teve câncer colorretal ou pólipo adenomatoso. O seguimento é individualizado por colonoscopia, conforme seu médico. (${CONITEC})`;
    }
    // ACG 2021, Rec. 9–12: história familiar não sindrômica
    const primeiroGrau = contarAntecedentes(p, 'colorretal', 'primeiro');
    const jovem = idadeMaisJovem(p, 'colorretal', 'primeiro');
    const casoPrecoce = temAntecedente(p, 'colorretal', 'primeiro', 60);
    if (primeiroGrau >= 2 || casoPrecoce) {
      const inicio = jovem != null ? Math.min(40, jovem - 10) : 40;
      return `História familiar de câncer colorretal em parente de primeiro grau (${primeiroGrau >= 2 ? 'dois ou mais parentes' : 'diagnóstico antes dos 60 anos'}): a recomendação é começar com colonoscopia aos ${inicio} anos (40 anos ou 10 anos antes do parente mais jovem, o que vier primeiro) e repetir a cada 5 anos. ${primeiroGrau >= 2 ? 'Considere avaliação genética. ' : ''}Converse com gastroenterologista ou coloproctologista. (${ACG}, Rec. 9${primeiroGrau >= 2 ? '–10' : ''})`;
    }
    if (primeiroGrau === 1) {
      const inicio = jovem != null ? Math.min(40, jovem - 10) : 40;
      return `Um parente de primeiro grau com câncer colorretal diagnosticado aos 60 anos ou mais: a recomendação é começar o rastreamento aos ${inicio} anos e, depois, seguir o calendário de risco habitual. Converse com seu médico. (${ACG}, Rec. 11)`;
    }
    return null; // 2º grau → risco médio (Rec. 12)
  },

  selecionarRegra(exame, regras) {
    if (exame.tipo === 'colonoscopia') {
      const r = exame.resultado;
      if (r.achado === 'normal' && r.qualidade_adequada !== true) return null; // qualidade não confirmada → pendente
      const polipos = r.polipos as { histopatologico?: string } | undefined;
      const plano = { ...r, histopatologico: polipos?.histopatologico };
      const regra = regras.find((x) => casaCondicao(x, { ...exame, resultado: plano })) ?? null;
      if (!regra) return null;
      const doLaudo = r.intervalo_laudo_meses;
      if (regra.classificacao === 'controle' && typeof doLaudo === 'number' && doLaudo > 0) return { ...regra, intervaloMeses: doLaudo };
      return regra;
    }
    return regras.find((x) => casaCondicao(x, exame)) ?? null;
  },
};
```

- [ ] **Step 4: Supressão de FIT em `elegibilidade.ts`**

Antes de procurar `ultimoValido`, inserir:
```ts
  if (programa === 'colorretal' && contexto.colonoscopiaAdequadaEm) {
    const proximaData = somarMeses(contexto.colonoscopiaAdequadaEm, 120); // CONITEC: colonoscopia adequada → 10 anos, sem FIT
    const dias = diasAte(proximaData, hoje);
    if (dias < 0) return { ...ref, status: 'exame_atrasado', mensagem: MSG.atrasado, proximaData };
    return { ...ref, status: 'em_dia', mensagem: 'Colonoscopia recente e adequada: não é necessário FIT até a próxima colonoscopia.', proximaData };
  }
```

- [ ] **Step 5: Registrar handler; rodar; commit**

```bash
npx jest src/core/regras && npx tsc --noEmit
git add -A && git commit -m "feat(regras): handler colorretal — CONITEC 2026 (FIT, colonoscopia, 10 anos sem FIT) e ACG 2021 (história familiar)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 6: Handlers **pulmão** e **próstata** (TDD)

**Pré-passo obrigatório:** checar USPSTF (https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/lung-cancer-screening) e ACR Lung-RADS (versão posterior a v2022?) e SBU (nota mais recente que 2020/2025?). Anotar.

**Files:**
- Create: `src/core/regras/programas/pulmao.ts`, `prostata.ts`, `__tests__/pulmao.test.ts`, `__tests__/prostata.test.ts`
- Modify: `programas/index.ts`

- [ ] **Step 1: Testes (falhando)**

`pulmao.test.ts`:
```ts
import { pulmao } from '../pulmao';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const fumante: PerfilRegras = {
  idade: 60, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null, racaCor: null, imc: 26,
  tabagismo: { status: 'atual', macosAno: 30, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, lungrads: string, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'ACR v2022', ano: 2022, condicao: { lungrads }, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 12, mensagemPaciente: '', ...extra,
});
const tc = (lungrads: string): ExameEntrada => ({ tipo: 'tcbd', programa: 'pulmao', dataRealizacao: '2026-09-01', resultado: { lungrads } });

describe('pulmão — elegibilidade USPSTF 2021', () => {
  it('fumante atual, 30 maços-ano, 60 anos → 50–80', () => expect(pulmao.faixaEtaria!(fumante)).toEqual({ min: 50, max: 80 }));
  it('ex-fumante que parou há 10 anos → elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'ex', macosAno: 25, anosDesdeCessacao: 10 } })).toEqual({ min: 50, max: 80 }));
  it('parou há 16 anos → não elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'ex', macosAno: 25, anosDesdeCessacao: 16 } })).toBeNull());
  it('15 maços-ano → não elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'atual', macosAno: 15, anosDesdeCessacao: null } })).toBeNull());
  it('nunca fumou → não elegível, mensagem explica os critérios', () => {
    expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null } })).toBeNull();
    expect(pulmao.mensagemNaoElegivel!(fumante)).toMatch(/20 ma[çc]os-ano/);
  });
  it('maços-ano desconhecido em fumante → null com mensagem pedindo o dado', () => {
    expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'atual', macosAno: null, anosDesdeCessacao: null } })).toBeNull();
    expect(pulmao.mensagemNaoElegivel!({ ...fumante, tabagismo: { status: 'atual', macosAno: null, anosDesdeCessacao: null } })).toMatch(/cigarros por dia/);
  });
});
describe('pulmão — Lung-RADS', () => {
  const regras = ['0', '1', '2', '3', '4A', '4B', '4X'].map((c) => regra(`lr${c}`, c));
  it('casa pela categoria', () => expect(pulmao.selecionarRegra(tc('4A'), regras, fumante, ctx)?.id).toBe('lr4A'));
  it('sem modificador S alterar categoria', () => expect(pulmao.selecionarRegra({ ...tc('2'), resultado: { lungrads: '2', modificador_s: true } }, regras, fumante, ctx)?.id).toBe('lr2'));
});
```

`prostata.test.ts`:
```ts
import { prostata } from '../prostata';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 52, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null, racaCor: 'branca', imc: 25,
  tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'SBU', ano: 2020, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: null, mensagemPaciente: '', ...extra,
});
const psa = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'psa', programa: 'prostata', dataRealizacao: '2026-09-01', resultado: r });
const regras = [regra('psa-ok', { psa_fora_referencia: false }), regra('psa-alto', { psa_fora_referencia: true }, { classificacao: 'investigacao', nivelAlerta: 'laranja' })];

describe('próstata — SBU', () => {
  it('só masculino', () => expect(prostata.aplicavel({ ...base, sexoNascimento: 'feminino' })).toBe(false));
  it('risco habitual: 50–75', () => expect(prostata.faixaEtaria!(base)).toEqual({ min: 50, max: 75 }));
  it('raça preta → 45', () => expect(prostata.faixaEtaria!({ ...base, racaCor: 'preta' })).toEqual({ min: 45, max: 75 }));
  it('1º grau com próstata → 45', () => expect(prostata.faixaEtaria!({ ...base, antecedentes: [{ condicao: 'prostata', grau: 'primeiro', idadeDiagnostico: null }] })).toEqual({ min: 45, max: 75 }));
  it('IMC ≥ 30 → 45 (campanha 2025)', () => expect(prostata.faixaEtaria!({ ...base, imc: 31 })).toEqual({ min: 45, max: 75 }));
  it('sem modificadores', () => expect(prostata.fatoresModificadores(base)).toBeNull());
});
describe('próstata — PSA (§49): sem ponto de corte único, compara com a referência do laboratório', () => {
  it('dentro da referência → acompanhamento; sem intervalo automático', () => {
    const r = prostata.selecionarRegra(psa({ psa_total: 1.2, referencia_max: 4 }), regras, base, ctx);
    expect(r?.id).toBe('psa-ok'); expect(r?.intervaloMeses).toBeNull();
  });
  it('data de repetição informada → vira intervalo em meses a partir do exame', () => {
    const r = prostata.selecionarRegra(psa({ psa_total: 1.2, referencia_max: 4, repetir_em: '2027-09-01' }), regras, base, ctx);
    expect(r?.intervaloMeses).toBe(12);
  });
  it('acima da referência → avaliação médica recomendada', () => expect(prostata.selecionarRegra(psa({ psa_total: 5.1, referencia_max: 4 }), regras, base, ctx)?.id).toBe('psa-alto'));
  it('sem referência informada → null (pendente: informar a referência do laudo)', () => expect(prostata.selecionarRegra(psa({ psa_total: 3 }), regras, base, ctx)).toBeNull());
});
```

- [ ] **Step 2: `pulmao.ts`**

```ts
import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao } from './util';

const FONTE = 'USPSTF 2021 (endossada pela SBPT)';

/** Critérios USPSTF: 50–80 anos, ≥ 20 maços-ano, fumante atual ou cessação ≤ 15 anos. */
export function elegivelTcbd(p: PerfilRegras): boolean {
  const t = p.tabagismo;
  if (t.status === 'nunca' || t.macosAno == null || t.macosAno < 20) return false;
  if (t.status === 'ex' && (t.anosDesdeCessacao == null || t.anosDesdeCessacao > 15)) return false;
  return true;
}

export const pulmao: ProgramaHandler = {
  aplicavel: () => true,
  faixaEtaria: (p) => (elegivelTcbd(p) ? { min: 50, max: 80 } : null),
  mensagemNaoElegivel(p) {
    const t = p.tabagismo;
    if (t.status !== 'nunca' && t.macosAno == null) {
      return 'Para avaliar o rastreamento de câncer de pulmão, informe no seu perfil quantos cigarros por dia e por quantos anos você fumou.';
    }
    if (t.status === 'ex' && (t.anosDesdeCessacao ?? 0) > 15) {
      return `Você parou de fumar há mais de 15 anos: a diretriz não recomenda tomografia de rastreamento nesse caso. (${FONTE})`;
    }
    return `O rastreamento com tomografia de baixa dose é recomendado entre 50 e 80 anos para quem fumou pelo menos 20 maços-ano e fuma ou parou há até 15 anos. Você não atende a esses critérios no momento. (${FONTE})`;
  },
  fatoresModificadores: () => null,
  selecionarRegra: (exame, regras) => regras.find((r) => casaCondicao(r, { ...exame, resultado: { lungrads: exame.resultado.lungrads } })) ?? null,
};
```

- [ ] **Step 3: `prostata.ts`**

```ts
import { somarMeses } from '../elegibilidade';
import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao, temAntecedente } from './util';

const FONTE = 'SBU — Nota Oficial 2018 / Aconselhamento 2020 / Novembro Azul 2025';

function altoRisco(p: PerfilRegras): boolean {
  return p.racaCor === 'preta' || temAntecedente(p, 'prostata', 'primeiro') || (p.imc != null && p.imc >= 30);
}

function mesesEntre(deIso: string, ateIso: string): number {
  const [a1, m1] = deIso.split('-').map(Number);
  const [a2, m2] = ateIso.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

/** Decisão compartilhada sobre o rastreamento do câncer de próstata — decisão C-008. */
export const prostata: ProgramaHandler = {
  aplicavel: (p) => p.sexoNascimento === 'masculino',
  // 50 anos; 45 se raça negra, 1º grau com próstata ou obesidade; > 75 só com expectativa de vida > 10 anos → "acompanhamento médico"
  faixaEtaria: (p) => ({ min: altoRisco(p) ? 45 : 50, max: 75 }),
  mensagemNaoElegivel: (p) => `A SBU recomenda conversar com um profissional sobre o rastreamento a partir dos ${altoRisco(p) ? 45 : 50} anos. (${FONTE})`,
  fatoresModificadores: () => null,
  selecionarRegra(exame, regras) {
    if (exame.tipo !== 'psa') return regras.find((r) => casaCondicao(r, exame)) ?? null;
    const total = exame.resultado.psa_total;
    const ref = exame.resultado.referencia_max;
    if (typeof total !== 'number' || typeof ref !== 'number') return null; // sem referência do laboratório não há como interpretar (§49)
    const regra = regras.find((r) => casaCondicao(r, { ...exame, resultado: { psa_fora_referencia: total > ref } })) ?? null;
    if (!regra) return null;
    // Sem intervalo automático (SBU não fixa periodicidade). Se o médico definiu quando repetir, usamos essa data.
    const repetir = exame.resultado.repetir_em;
    if (regra.classificacao === 'normal' && typeof repetir === 'string') {
      const meses = mesesEntre(exame.dataRealizacao, repetir);
      return { ...regra, intervaloMeses: meses > 0 ? meses : null };
    }
    return regra;
  },
};
```
Nota: `somarMeses` importado apenas se necessário; remover se não usado.

- [ ] **Step 4: Registrar os 5 handlers em `index.ts`**

```ts
import type { ProgramaHandlers } from '../tipos';
import { colo } from './colo';
import { colorretal } from './colorretal';
import { mama } from './mama';
import { prostata } from './prostata';
import { pulmao } from './pulmao';

export const handlers: ProgramaHandlers = { mama, colo_utero: colo, colorretal, pulmao, prostata };
```

- [ ] **Step 5: Rodar tudo, tsc, commit**

```bash
npx jest && npx tsc --noEmit
git add -A && git commit -m "feat(regras): handlers de pulmão (USPSTF 2021 + Lung-RADS v2022) e próstata (SBU, PSA sem intervalo automático)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 7: Semente `regras_clinicas` + `carregarRegras`

**Files:**
- Create: `supabase/seed.sql`, `src/core/rastreando/regras.ts`, `src/core/rastreando/tipos.ts`, `supabase/tests/seed.test.sql`

**Interfaces:**
- Produces: `carregarRegras(programa: Programa): Promise<RegraParametros[]>`; tipos `TipoExameRastreamento`, `TIPOS_POR_PROGRAMA`, `ROTULO_EXAME`.

- [ ] **Step 1: `supabase/seed.sql`** — inserir com `on conflict do nothing` por chave natural (`modulo, programa, exame_tipo, condicao`). Adicionar antes uma constraint única: em uma migração `0009_regras_unique.sql`: `create unique index regras_clinicas_chave_idx on public.regras_clinicas (modulo, coalesce(programa,''), coalesce(exame_tipo,''), condicao) where ativa;`

```sql
-- NERO · semente de regras clínicas · versão 2026.1 · revisada em 2026-09-15
-- Fontes: docs/nero/referencias/REFERENCIAS.md. Cada linha cita a recomendação quando existir.
insert into public.regras_clinicas
  (modulo, programa, exame_tipo, condicao, classificacao, nivel_alerta, proxima_acao, intervalo_meses, mensagem_paciente, fonte, ano, versao, revisada_em)
values
-- ===== MAMA — CBR/SBM/FEBRASGO 2023 (Urban et al.) · ACR BI-RADS =====
('rastreando','mama',null,'{"idade_min":40,"idade_max":74}','normal','verde','Mamografia anual',12,'Você está na faixa etária de rastreamento: mamografia anual dos 40 aos 74 anos.','CBR/SBM/FEBRASGO 2023 — risco populacional usual',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":0}','pendente','cinza','Complementar o exame',null,'Sua mamografia precisa de complementação (BI-RADS 0) antes de um resultado final. Procure o serviço que realizou o exame.','ACR BI-RADS · §44',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":1}','normal','verde','Nova mamografia em 12 meses',12,'Sua mamografia não apresentou achados suspeitos (BI-RADS 1). Seu próximo rastreamento foi programado. Consulte seu médico para orientações.','ACR BI-RADS · CBR/SBM/FEBRASGO 2023',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":2}','normal','verde','Nova mamografia em 12 meses',12,'Sua mamografia mostrou achados benignos (BI-RADS 2). Seu próximo rastreamento foi programado.','ACR BI-RADS · CBR/SBM/FEBRASGO 2023',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":3}','controle','amarelo','Controle de curto intervalo',6,'Achado provavelmente benigno (BI-RADS 3): a recomendação habitual é controle em 6 meses, ou no intervalo indicado no seu laudo. Consulte seu médico.','ACR BI-RADS (categoria 3: seguimento de curto intervalo) · C-009',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":4}','investigacao','laranja','Avaliação médica para investigação',null,'Seu exame apresentou um achado que necessita investigação complementar (BI-RADS 4). Procure o profissional responsável para definir a próxima etapa.','ACR BI-RADS · §44',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":5}','especializado','vermelho','Avaliação especializada prioritária',null,'Seu exame apresentou um achado que merece avaliação especializada prioritária (BI-RADS 5). Entre em contato com o profissional responsável ou serviço de referência.','ACR BI-RADS · §44',2023,'2026.1','2026-09-15'),
('rastreando','mama','mamografia','{"birads":6}','especializado','vermelho','Acompanhamento especializado',null,'Este exame indica acompanhamento especializado (BI-RADS 6). As próximas etapas são definidas pela sua equipe de tratamento.','ACR BI-RADS · §44',2023,'2026.1','2026-09-15'),
-- ===== COLO DO ÚTERO — INCA 2025, 3. ed. =====
('rastreando','colo_utero',null,'{"idade_min":25,"idade_max":64}','normal','verde','Teste de DNA-HPV a cada 5 anos',60,'Você está na faixa de rastreamento do colo do útero: teste de DNA-HPV a partir dos 25 anos, repetido a cada 5 anos quando negativo.','INCA 2025 Rec. 1, 12, 18',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"negativo","imunossuprimida":false}','normal','verde','Novo teste em 5 anos',60,'Não foi detectado HPV oncogênico. Seu próximo rastreamento foi programado para daqui a 5 anos.','INCA 2025 Rec. 18',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"negativo","imunossuprimida":true}','normal','verde','Novo teste em 3 anos',36,'Não foi detectado HPV oncogênico. Em situação de imunossupressão, o intervalo recomendado é de 3 anos.','INCA 2025 Rec. 39',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"16_18"}','investigacao','laranja','Colposcopia',null,'Foi detectado um tipo de HPV associado a maior risco de lesões do colo do útero (16 ou 18). Procure seu médico para a avaliação complementar (colposcopia).','INCA 2025 · §45.2',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","imunossuprimida":true}','investigacao','laranja','Colposcopia',null,'Foi detectado HPV oncogênico. Em situação de imunossupressão, a diretriz recomenda colposcopia independentemente da citologia. Procure seu médico.','INCA 2025 Rec. 40',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"negativa","imunossuprimida":false}','controle','amarelo','Repetir o teste em 12 meses',12,'HPV oncogênico (não 16/18) com citologia normal: a diretriz recomenda repetir o teste em 12 meses. Consulte seu médico.','INCA 2025 — fluxo pós-teste (validar nº da recomendação no PDF do acervo)',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"insatisfatoria","imunossuprimida":false}','pendente','cinza','Repetir a coleta',null,'A citologia não permitiu avaliação adequada. Será necessário repetir conforme orientação do profissional.','INCA 2025 · §45.5',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"asc_us","imunossuprimida":false}','investigacao','laranja','Avaliação complementar',null,'Seu exame apresentou um achado que necessita avaliação complementar. Procure o profissional responsável.','INCA 2025 · §45.6',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"lsil","imunossuprimida":false}','investigacao','laranja','Avaliação complementar',null,'Seu exame apresentou um achado que necessita avaliação complementar. Procure o profissional responsável.','INCA 2025 · §45.6',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"asc_h","imunossuprimida":false}','especializado','vermelho','Avaliação especializada',null,'Seu exame apresentou um achado que necessita avaliação profissional com prioridade. Procure o responsável para definir a próxima etapa.','INCA 2025 · §45.7',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"hsil","imunossuprimida":false}','especializado','vermelho','Avaliação especializada',null,'Seu exame apresentou um achado que necessita avaliação profissional com prioridade. Procure o responsável para definir a próxima etapa.','INCA 2025 · §45.7',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"agc","imunossuprimida":false}','especializado','vermelho','Avaliação especializada',null,'Seu exame apresentou um achado que necessita avaliação profissional com prioridade.','INCA 2025 · §45.7',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"ais","imunossuprimida":false}','especializado','vermelho','Avaliação especializada',null,'Seu exame apresentou um achado que necessita avaliação profissional com prioridade.','INCA 2025 · §45.7',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','dna_hpv','{"hpv":"outros_oncogenicos","citologia_reflexa":"suspeita_malignidade","imunossuprimida":false}','especializado','vermelho','Avaliação especializada',null,'Seu exame apresentou um achado que necessita avaliação profissional com prioridade.','INCA 2025 · §45.7',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"negativa"}','normal','verde','Repetir conforme protocolo (anual; trienal após 2 normais)',12,'Citologia sem alterações. Onde o DNA-HPV ainda não está disponível, repete-se anualmente e, após dois exames normais seguidos, a cada 3 anos.','INCA — citologia (transição) · C-003',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"insatisfatoria"}','pendente','cinza','Repetir a coleta',null,'A amostra não permitiu avaliação adequada. Repita o exame conforme orientação do profissional.','INCA · §45.5',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"asc_us"}','investigacao','laranja','Avaliação complementar',null,'Seu exame apresentou um achado que necessita avaliação complementar. Procure o profissional responsável.','INCA · §45.6',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"lsil"}','investigacao','laranja','Avaliação complementar',null,'Seu exame apresentou um achado que necessita avaliação complementar. Procure o profissional responsável.','INCA · §45.6',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"asc_h"}','especializado','vermelho','Avaliação especializada',null,'Seu exame necessita avaliação profissional com prioridade.','INCA · §45.7',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"hsil"}','especializado','vermelho','Avaliação especializada',null,'Seu exame necessita avaliação profissional com prioridade.','INCA · §45.7',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"agc"}','especializado','vermelho','Avaliação especializada',null,'Seu exame necessita avaliação profissional com prioridade.','INCA · §45.7',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"ais"}','especializado','vermelho','Avaliação especializada',null,'Seu exame necessita avaliação profissional com prioridade.','INCA · §45.7',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','citologia','{"citologia":"suspeita_malignidade"}','especializado','vermelho','Avaliação especializada',null,'Seu exame necessita avaliação profissional com prioridade.','INCA · §45.7',2016,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"normal"}','controle','amarelo','Seguimento conforme o médico',12,'Colposcopia sem alterações. O seguimento é definido pelo seu médico conforme o teste que motivou o exame.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"nic1"}','controle','amarelo','Seguimento conforme o médico',12,'Lesão de baixo grau (NIC 1): geralmente acompanhada, não tratada. Seu médico define o intervalo.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"nic2"}','especializado','vermelho','Acompanhamento especializado',null,'Lesão de alto grau: as próximas etapas são definidas pela sua equipe.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"nic3"}','especializado','vermelho','Acompanhamento especializado',null,'Lesão de alto grau: as próximas etapas são definidas pela sua equipe.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"ais"}','especializado','vermelho','Acompanhamento especializado',null,'As próximas etapas são definidas pela sua equipe.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"carcinoma"}','especializado','vermelho','Acompanhamento especializado',null,'As próximas etapas são definidas pela sua equipe.','INCA 2025',2025,'2026.1','2026-09-15'),
('rastreando','colo_utero','colposcopia','{"achado":"inconclusiva"}','pendente','cinza','Complementar a avaliação',null,'A colposcopia foi inconclusiva. Procure o profissional para complementar a avaliação.','INCA 2025',2025,'2026.1','2026-09-15'),
-- ===== COLORRETAL — CONITEC 2026 (preliminar) =====
('rastreando','colorretal',null,'{"idade_min":50,"idade_max":75}','normal','verde','FIT a cada 2 anos',24,'Você está na faixa de rastreamento colorretal: teste imunoquímico fecal (FIT) a cada 2 anos, dos 50 aos 75 anos.','CONITEC 2026 Rec. 5, 6, 7',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','fit','{"fit":"negativo"}','normal','verde','Novo FIT em 2 anos',24,'Seu teste não identificou sangue oculto nas fezes. Seu próximo rastreamento foi programado.','CONITEC 2026 Rec. 7',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','fit','{"fit":"positivo"}','investigacao','laranja','Colonoscopia',null,'Seu teste deu positivo. Isso não significa câncer, mas é necessária investigação com colonoscopia. Procure seu médico.','CONITEC 2026 Rec. 8',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"normal","qualidade_adequada":true}','normal','verde','Nova colonoscopia em 10 anos; sem FIT nesse período',120,'Colonoscopia completa e sem alterações: a recomendação é repetir só em 10 anos, sem necessidade de FIT nesse intervalo, se você seguir sem sintomas.','CONITEC 2026 — texto da Rec. 8',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"incompleta"}','pendente','cinza','Completar o exame',null,'A colonoscopia foi incompleta. Procure o profissional para completar a avaliação.','§47',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"polipos","histopatologico":"aguardando"}','pendente','cinza','Aguardar o histopatológico',null,'Foram removidos pólipos. Registre o resultado do histopatológico quando disponível para o NERO definir o seguimento.','§47',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"polipos","histopatologico":"hiperplasico"}','normal','verde','Nova colonoscopia em 10 anos',120,'Pólipo hiperplásico não aumenta o risco. O seguimento segue o habitual.','§47 · ACG 2021',2021,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"polipos","histopatologico":"adenoma"}','controle','amarelo','Colonoscopia de controle no intervalo do laudo',null,'Adenoma removido: o intervalo de controle depende do número e tamanho dos pólipos e é definido pelo seu médico. Registre o intervalo indicado no laudo.','§47',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"polipos","histopatologico":"adenoma_avancado"}','controle','amarelo','Colonoscopia de controle no intervalo do laudo',null,'Adenoma avançado removido: o controle costuma ser mais próximo e é definido pelo seu médico. Registre o intervalo indicado no laudo.','§47',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"polipos","histopatologico":"carcinoma"}','especializado','vermelho','Acompanhamento especializado',null,'As próximas etapas são definidas pela sua equipe.','§47',2026,'2026.1','2026-09-15'),
('rastreando','colorretal','colonoscopia','{"achado":"massa_suspeita"}','especializado','vermelho','Avaliação especializada prioritária',null,'Foi identificada uma lesão que precisa de avaliação especializada prioritária. Entre em contato com o profissional responsável.','§47',2026,'2026.1','2026-09-15'),
-- ===== PULMÃO — USPSTF 2021 · ACR Lung-RADS v2022 =====
('rastreando','pulmao',null,'{"idade_min":50,"idade_max":80}','normal','verde','TCBD anual',12,'Você atende aos critérios de rastreamento de câncer de pulmão: tomografia de baixa dose anual.','USPSTF 2021',2021,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"0"}','pendente','cinza','Complementar (comparação com exame prévio ou TC em 1–3 meses)',null,'O exame precisa de complementação (Lung-RADS 0). Siga a orientação do laudo e do profissional.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"1"}','normal','verde','TCBD em 12 meses',12,'Resultado negativo (Lung-RADS 1). Próxima tomografia em 12 meses.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"2"}','normal','verde','TCBD em 12 meses',12,'Achado de comportamento benigno (Lung-RADS 2). Próxima tomografia em 12 meses.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"3"}','controle','amarelo','TCBD em 6 meses',6,'Achado provavelmente benigno (Lung-RADS 3). Controle em 6 meses. Consulte seu médico.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"4A"}','investigacao','laranja','TCBD em 3 meses (PET/CT a critério médico)',3,'Foi identificado um achado que necessita avaliação mais próxima (Lung-RADS 4A). Siga a recomendação do laudo e do profissional.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"4B"}','especializado','vermelho','Avaliação especializada prioritária',null,'Este resultado merece avaliação especializada prioritária. Entre em contato com o profissional responsável.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
('rastreando','pulmao','tcbd','{"lungrads":"4X"}','especializado','vermelho','Avaliação especializada prioritária',null,'Este resultado merece avaliação especializada prioritária. Entre em contato com o profissional responsável.','ACR Lung-RADS v2022',2022,'2026.1','2026-09-15'),
-- ===== PRÓSTATA — SBU =====
('rastreando','prostata',null,'{"idade_min":50,"idade_max":75}','normal','verde','Conversar com o médico sobre o rastreamento',null,'Você está na faixa em que a SBU recomenda conversar com um profissional sobre riscos e benefícios do rastreamento (decisão compartilhada).','SBU 2018/2020/2025',2020,'2026.1','2026-09-15'),
('rastreando','prostata','psa','{"psa_fora_referencia":false}','normal','verde','Repetir conforme orientação do médico',null,'Seu PSA está dentro da referência do laboratório. A periodicidade da repetição é definida pelo seu médico.','SBU (avaliações periódicas, sem intervalo fixo) · §49',2020,'2026.1','2026-09-15'),
('rastreando','prostata','psa','{"psa_fora_referencia":true}','investigacao','laranja','Avaliação médica recomendada',null,'Seu resultado está fora da faixa de referência informada pelo laboratório. A interpretação do PSA depende de idade, histórico, exame clínico e outros fatores. Converse com seu médico.','§49',2020,'2026.1','2026-09-15')
on conflict do nothing;
```

- [ ] **Step 2: Validar as linhas "validar nº da recomendação"** lendo `docs/nero/referencias/texto/2025-INCA-colo-utero.txt` (buscar "citologia reflexa", "repetir em 12 meses" / "um ano") e corrigir `fonte` com o número. Se a diretriz divergir (ex.: repetição em 12 meses **do teste de DNA-HPV**, não citologia), ajustar `proxima_acao` e registrar em C-002.

- [ ] **Step 3: pgTAP `supabase/tests/seed.test.sql`**

```sql
begin;
select plan(3);
select cmp_ok((select count(*) from public.regras_clinicas where ativa), '>=', 60::bigint, 'semente carregada');
select is((select count(*) from public.regras_clinicas where fonte is null or fonte = ''), 0::bigint, 'toda regra tem fonte');
select is((select count(*) from public.regras_clinicas where programa is not null and exame_tipo is null), 5::bigint, 'uma regra de elegibilidade por programa');
select * from finish();
rollback;
```
`supabase db reset` (aplica seed) e `supabase test db` → PASS.

- [ ] **Step 4: `src/core/rastreando/tipos.ts`**

```ts
import type { Programa } from '@core/regras/tipos';

export type TipoExameRastreamento = 'mamografia' | 'dna_hpv' | 'citologia' | 'colposcopia' | 'fit' | 'colonoscopia' | 'tcbd' | 'psa';

export const TIPOS_POR_PROGRAMA: Record<Programa, TipoExameRastreamento[]> = {
  mama: ['mamografia'],
  colo_utero: ['dna_hpv', 'citologia', 'colposcopia'],
  colorretal: ['fit', 'colonoscopia'],
  pulmao: ['tcbd'],
  prostata: ['psa'],
};

export const ROTULO_EXAME: Record<TipoExameRastreamento, string> = {
  mamografia: 'Mamografia', dna_hpv: 'Teste de DNA-HPV', citologia: 'Citologia (Papanicolau)', colposcopia: 'Colposcopia',
  fit: 'Teste de sangue oculto nas fezes (FIT)', colonoscopia: 'Colonoscopia', tcbd: 'Tomografia de baixa dose', psa: 'PSA',
};

export const ROTULO_PROGRAMA: Record<Programa, string> = {
  mama: 'Mama', colo_utero: 'Colo do útero', colorretal: 'Intestino (colorretal)', pulmao: 'Pulmão', prostata: 'Próstata',
};
export const PROGRAMAS: Programa[] = ['mama', 'colo_utero', 'colorretal', 'pulmao', 'prostata'];
```

- [ ] **Step 5: `src/core/rastreando/regras.ts`**

```ts
import type { Programa, RegraParametros } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const cache = new Map<Programa, { em: number; regras: RegraParametros[] }>();
const TTL_MS = 10 * 60 * 1000;

export async function carregarRegras(programa: Programa): Promise<RegraParametros[]> {
  const c = cache.get(programa);
  if (c && Date.now() - c.em < TTL_MS) return c.regras;
  const { data, error } = await supabase.from('regras_clinicas').select('*').eq('modulo', 'rastreando').eq('programa', programa).eq('ativa', true);
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
```

- [ ] **Step 6: tsc, commit**

```bash
npx tsc --noEmit && supabase test db 2>&1 | grep Result
git add -A && git commit -m "feat(regras): semente de regras_clinicas (mama, colo, colorretal, pulmão, próstata) com fontes e carregador

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 8: `montarContexto`, `registrarExame`, lembretes

**Files:**
- Create: `src/core/rastreando/contexto.ts`, `src/core/rastreando/__tests__/contexto.test.ts`, `src/core/rastreando/registrarExame.ts`, `src/core/rastreando/lembretes.ts`, `src/core/rastreando/sintomas.ts`, `src/core/rastreando/useRastreando.ts`

**Interfaces:**
- Produces:
```ts
paraPerfilRegras(perfil: PerfilSaude, antecedentes: AntecedenteFamiliar[], pesoKg: number | null, hoje?: Date): PerfilRegras   // puro, testável
montarContexto(userId: string): Promise<{ perfil: PerfilRegras; contexto: ContextoAvaliacao; exames: ExameRegistrado[]; pendencias: PendenciaAberta[] }>
registrarExame(userId, entrada: { programa; tipo; dataRealizacao; resultado; laudoTexto?; instituicao?; solicitante?; observacoes?; resolveExameId? }): Promise<{ exameId: string; resultado: ResultadoClassificacao }>
agendarLembretes(userId, exameId, programa, dataProxima: string, rotulo: string): Promise<void>
registrarSintoma(userId, programa, sintoma, observacao?) / resolverSintoma(id)
useRastreando(): { avaliacoes: Record<Programa, ResultadoElegibilidade> | null; perfil: PerfilRegras | null; exames; pendencias; sintomas; carregando; erro; recarregar }
```

- [ ] **Step 1: Teste puro de `paraPerfilRegras`**

```ts
import { paraPerfilRegras } from '../contexto';
import type { PerfilSaude } from '@core/perfil/tipos';
const hoje = new Date('2026-09-15T12:00:00Z');
const p: PerfilSaude = { userId: 'u', nome: 'A', dataNascimento: '1976-03-10', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'ex', cigarrosDia: 20, anosFumando: 25, dataCessacao: '2020-01-01', temDiabetes: false, temHipertensao: null, temDoencaRenal: null, temImunossupressao: null, temHiv: true, temDii: null,
  historicoCancerPessoal: [{ tipo: 'Melanoma', ano: 2015 }], lesoesPrecursoras: [], doencasGeneticas: [{ nome: 'BRCA1' }], radioterapiaToracica: false,
  semMedicacoes: false, semAntecedentesFamiliares: false, jaTeveAtividadeSexual: true, racaCor: 'parda', menopausa: null, perfilInicialCompleto: true };
test('converte perfil de domínio em PerfilRegras com derivados', () => {
  const r = paraPerfilRegras(p, [{ id: '1', parentesco: 'mae', grau: 'primeiro', condicao: 'mama', idadeDiagnostico: 48, observacao: null }], 68, hoje);
  expect(r.idade).toBe(50);
  expect(r.tabagismo).toEqual({ status: 'ex', macosAno: 25, anosDesdeCessacao: 6 });
  expect(r.imc).toBe(25);
  expect(r.condicoes.hiv).toBe(true);
  expect(r.historicoCancerPessoal).toEqual(['Melanoma']);
  expect(r.doencasGeneticas).toEqual(['BRCA1']);
  expect(r.antecedentes[0]).toEqual({ condicao: 'mama', grau: 'primeiro', idadeDiagnostico: 48 });
});
```

- [ ] **Step 2: `contexto.ts`**

```ts
import { anosDesde, calcularIdade, calcularIMC, calcularMacosAno } from '@core/perfil/calculos';
import * as perfilRepo from '@core/perfil/repositorio';
import type { AntecedenteFamiliar, PerfilSaude } from '@core/perfil/tipos';
import type { Classificacao, ContextoAvaliacao, ExameEntrada, PerfilRegras, Programa } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export interface ExameRegistrado extends ExameEntrada {
  id: string; classificacao: Classificacao; nivelAlerta: string; proximaAcao: string | null; dataProximaAcao: string | null;
  mensagem: string | null; regraId: string | null; regraVersao: string | null; resolveExameId: string | null; laudoTexto: string | null;
}
export interface PendenciaAberta { id: string; programa: Programa; descricao: string; nivelAlerta: string; exameOrigemId: string; abertaEm: string }
export interface SintomaAberto { id: string; programa: Programa; sintoma: string; registradoEm: string }

export function paraPerfilRegras(p: PerfilSaude, antecedentes: AntecedenteFamiliar[], pesoKg: number | null, hoje = new Date()): PerfilRegras {
  return {
    idade: p.dataNascimento ? calcularIdade(p.dataNascimento, hoje) : 0,
    sexoNascimento: p.sexoNascimento ?? 'feminino',
    possuiColoUtero: p.possuiColoUtero,
    jaTeveAtividadeSexual: p.jaTeveAtividadeSexual,
    histerectomia: p.histerectomia,
    racaCor: p.racaCor,
    imc: pesoKg != null && p.alturaCm ? calcularIMC(pesoKg, p.alturaCm) : null,
    tabagismo: {
      status: p.tabagismoStatus ?? 'nunca',
      macosAno: calcularMacosAno(p.cigarrosDia, p.anosFumando),
      anosDesdeCessacao: p.tabagismoStatus === 'ex' ? anosDesde(p.dataCessacao, hoje) : null,
    },
    condicoes: { diabetes: p.temDiabetes ?? undefined, dii: p.temDii ?? undefined, imunossupressao: p.temImunossupressao ?? undefined, hiv: p.temHiv ?? undefined, doencaRenal: p.temDoencaRenal ?? undefined },
    historicoCancerPessoal: p.historicoCancerPessoal.map((h) => h.tipo),
    lesoesPrecursoras: p.lesoesPrecursoras.map((l) => l.tipo),
    doencasGeneticas: p.doencasGeneticas.map((d) => d.nome),
    radioterapiaToracica: p.radioterapiaToracica === true,
    antecedentes: antecedentes.map((a) => ({ condicao: a.condicao, grau: a.grau, idadeDiagnostico: a.idadeDiagnostico })),
  };
}

export async function montarContexto(userId: string) {
  const [perfil, antecedentes, peso, exames, pendencias, sintomas] = await Promise.all([
    perfilRepo.obterPerfil(userId),
    perfilRepo.listarAntecedentes(userId),
    supabase.from('medidas').select('valores').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('exames').select('*').eq('user_id', userId).eq('modulo', 'rastreando').order('data_realizacao', { ascending: false }),
    supabase.from('pendencias').select('*').eq('user_id', userId).eq('status', 'aberta'),
    supabase.from('sintomas_alarme').select('*').eq('user_id', userId).is('resolvido_em', null),
  ]);
  for (const r of [peso, exames, pendencias, sintomas]) if (r.error) throw traduzirErro(r.error);

  const pesoKg = (peso.data?.valores as { kg?: number } | null)?.kg ?? null;
  const listaExames: ExameRegistrado[] = (exames.data ?? []).map((e) => ({
    id: e.id, tipo: e.tipo, programa: e.programa as Programa, dataRealizacao: e.data_realizacao, resultado: (e.resultado as Record<string, unknown>) ?? {},
    classificacao: (e.classificacao ?? 'pendente') as Classificacao, nivelAlerta: e.nivel_alerta ?? 'cinza', proximaAcao: e.proxima_acao, dataProximaAcao: e.data_proxima_acao,
    mensagem: e.observacoes, regraId: e.regra_id, regraVersao: e.regra_versao, resolveExameId: e.resolve_exame_id, laudoTexto: e.laudo_texto,
  }));
  const listaPend: PendenciaAberta[] = (pendencias.data ?? []).map((p) => ({ id: p.id, programa: p.programa as Programa, descricao: p.descricao, nivelAlerta: p.nivel_alerta, exameOrigemId: p.exame_origem_id, abertaEm: p.aberta_em }));
  const listaSint: SintomaAberto[] = (sintomas.data ?? []).map((s) => ({ id: s.id, programa: s.programa as Programa, sintoma: s.sintoma, registradoEm: s.registrado_em }));

  const colonoAdequada = listaExames.find((e) => e.tipo === 'colonoscopia' && e.resultado.qualidade_adequada === true && (e.resultado.achado === 'normal' || (e.resultado.polipos as { histopatologico?: string } | undefined)?.histopatologico === 'hiperplasico'));
  const especializados = [...new Set(listaExames.filter((e) => e.classificacao === 'especializado').map((e) => e.programa))];

  const contextoPor = (programa: Programa): ContextoAvaliacao => ({
    sintomasAlarme: listaSint.filter((s) => s.programa === programa).map((s) => s.sintoma),
    pendenciasAbertas: listaPend.map((p) => ({ programa: p.programa, exameOrigemId: p.exameOrigemId })),
    emAcompanhamentoEspecializado: especializados,
    historicoExames: listaExames.map((e) => ({ id: e.id, tipo: e.tipo, programa: e.programa, dataRealizacao: e.dataRealizacao, resultado: e.resultado, classificacao: e.classificacao })),
    colonoscopiaAdequadaEm: colonoAdequada?.dataRealizacao ?? null,
  });

  return { perfilSaude: perfil, perfil: paraPerfilRegras(perfil, antecedentes, pesoKg), contextoPor, exames: listaExames, pendencias: listaPend, sintomas: listaSint };
}
```

- [ ] **Step 3: `lembretes.ts`**

```bash
npx expo install expo-notifications
```
```ts
import * as Notifications from 'expo-notifications';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const DIAS_ANTES = [60, 30, 7, 0, -7]; // §38: 60/30/7 dias antes, no dia, e 7 dias depois se não registrado

export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const r = await Notifications.requestPermissionsAsync();
  return r.status === 'granted';
}

export async function cancelarLembretesDoPrograma(userId: string, programa: string): Promise<void> {
  const { data, error } = await supabase.from('lembretes').select('id, mensagem').eq('user_id', userId).eq('origem_tipo', 'exame').eq('status', 'pendente').like('titulo', `${programa}:%`);
  if (error) throw traduzirErro(error);
  for (const l of data ?? []) {
    const notifId = l.mensagem?.match(/notif:([\w-]+)/)?.[1];
    if (notifId) await Notifications.cancelScheduledNotificationAsync(notifId).catch(() => {});
  }
  await supabase.from('lembretes').update({ status: 'cancelado' }).eq('user_id', userId).eq('origem_tipo', 'exame').eq('status', 'pendente').like('titulo', `${programa}:%`);
}

export async function agendarLembretes(userId: string, exameId: string, programa: string, dataProxima: string, rotuloExame: string): Promise<void> {
  await cancelarLembretesDoPrograma(userId, programa);
  const temPermissao = await pedirPermissaoNotificacoes();
  const [a, m, d] = dataProxima.split('-').map(Number);
  for (const dias of DIAS_ANTES) {
    const quando = new Date(a, m - 1, d - dias, 9, 0, 0);
    if (quando.getTime() < Date.now()) continue;
    const texto = dias > 0 ? `Seu ${rotuloExame} está previsto para daqui a ${dias} dias.` : dias === 0 ? `Hoje é a data prevista do seu ${rotuloExame}.` : `Você já realizou seu ${rotuloExame}? Registre o resultado para manter seu acompanhamento atualizado.`;
    let notifId: string | null = null;
    if (temPermissao) {
      notifId = await Notifications.scheduleNotificationAsync({ content: { title: 'NERO — Rastreando', body: texto }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quando } });
    }
    const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: 'exame', origem_id: exameId, agendado_para: quando.toISOString(), titulo: `${programa}:${rotuloExame}`, mensagem: `${texto}${notifId ? ` notif:${notifId}` : ''}` });
    if (error) throw traduzirErro(error);
  }
}
```

- [ ] **Step 4: `registrarExame.ts`**

```ts
import { classificarExame } from '@core/regras/classificar';
import { handlers } from '@core/regras/programas';
import type { ExameEntrada, Programa, ResultadoClassificacao } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { ErroNero, traduzirErro } from '@core/supabase/erros';
import { montarContexto } from './contexto';
import { agendarLembretes } from './lembretes';
import { carregarRegras } from './regras';
import { ROTULO_EXAME, type TipoExameRastreamento } from './tipos';

export interface EntradaExame {
  programa: Programa; tipo: TipoExameRastreamento; dataRealizacao: string; resultado: Record<string, unknown>;
  laudoTexto?: string; instituicao?: string; solicitante?: string; observacoes?: string; resolveExameId?: string | null;
}

/** Fluxo §42: contexto → regras → classificação → gravação → pendência → lembretes. */
export async function registrarExame(userId: string, entrada: EntradaExame): Promise<{ exameId: string; resultado: ResultadoClassificacao; lembretesOk: boolean }> {
  const { perfil, contextoPor } = await montarContexto(userId);
  const regras = await carregarRegras(entrada.programa);
  const exame: ExameEntrada = { tipo: entrada.tipo, programa: entrada.programa, dataRealizacao: entrada.dataRealizacao, resultado: entrada.resultado };
  const contexto = contextoPor(entrada.programa);
  // Se este exame resolve uma pendência, ela não deve bloquear a própria classificação.
  if (entrada.resolveExameId) contexto.pendenciasAbertas = contexto.pendenciasAbertas.filter((p) => p.exameOrigemId !== entrada.resolveExameId);
  const resultado = classificarExame(exame, perfil, contexto, regras, handlers);

  const { data, error } = await supabase.from('exames').insert({
    user_id: userId, tipo: entrada.tipo, categoria: 'rastreamento', modulo: 'rastreando', programa: entrada.programa,
    data_realizacao: entrada.dataRealizacao, resultado: entrada.resultado, laudo_texto: entrada.laudoTexto ?? null,
    instituicao: entrada.instituicao ?? null, solicitante: entrada.solicitante ?? null, observacoes: resultado.mensagemPaciente,
    classificacao: resultado.classificacao, nivel_alerta: resultado.nivelAlerta, proxima_acao: resultado.proximaAcao,
    data_proxima_acao: resultado.dataProximaAcao, abre_pendencia: resultado.abrePendencia, regra_id: resultado.regraId, regra_versao: resultado.regraVersao,
    resolve_exame_id: entrada.resolveExameId ?? null,
  }).select('id').single();
  if (error) throw traduzirErro(error);
  const exameId = data.id;

  if (resultado.abrePendencia) {
    const { error: e2 } = await supabase.from('pendencias').insert({ user_id: userId, exame_origem_id: exameId, programa: entrada.programa, descricao: resultado.proximaAcao, nivel_alerta: resultado.nivelAlerta });
    if (e2) throw traduzirErro(e2);
  }

  let lembretesOk = true;
  if (resultado.dataProximaAcao) {
    try { await agendarLembretes(userId, exameId, entrada.programa, resultado.dataProximaAcao, ROTULO_EXAME[entrada.tipo].toLowerCase()); }
    catch (e) { lembretesOk = false; if (__DEV__) console.warn('lembretes', e instanceof ErroNero ? e.mensagemUsuario : e); }
  }
  return { exameId, resultado, lembretesOk };
}
```

- [ ] **Step 5: `sintomas.ts` e `useRastreando.ts`**

```ts
// sintomas.ts
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
export async function registrarSintoma(userId: string, programa: string, sintoma: string, observacao?: string) {
  const { error } = await supabase.from('sintomas_alarme').insert({ user_id: userId, programa, sintoma, observacao: observacao ?? null });
  if (error) throw traduzirErro(error);
}
export async function resolverSintoma(id: string) {
  const { error } = await supabase.from('sintomas_alarme').update({ resolvido_em: new Date().toISOString() }).eq('id', id);
  if (error) throw traduzirErro(error);
}
```
```ts
// useRastreando.ts
import { useCallback, useEffect, useState } from 'react';
import { avaliarElegibilidade } from '@core/regras/elegibilidade';
import { handlers } from '@core/regras/programas';
import type { PerfilRegras, Programa, ResultadoElegibilidade } from '@core/regras/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { montarContexto, type ExameRegistrado, type PendenciaAberta, type SintomaAberto } from './contexto';
import { carregarRegras } from './regras';
import { PROGRAMAS } from './tipos';

export function useRastreando() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [avaliacoes, setAvaliacoes] = useState<Record<Programa, ResultadoElegibilidade> | null>(null);
  const [perfil, setPerfil] = useState<PerfilRegras | null>(null);
  const [exames, setExames] = useState<ExameRegistrado[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaAberta[]>([]);
  const [sintomas, setSintomas] = useState<SintomaAberto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true); setErro(null);
    try {
      const ctx = await montarContexto(userId);
      const pares = await Promise.all(PROGRAMAS.map(async (p) => [p, avaliarElegibilidade(ctx.perfil, p, await carregarRegras(p), ctx.contextoPor(p), new Date(), handlers)] as const));
      setAvaliacoes(Object.fromEntries(pares) as Record<Programa, ResultadoElegibilidade>);
      setPerfil(ctx.perfil); setExames(ctx.exames); setPendencias(ctx.pendencias); setSintomas(ctx.sintomas);
    } catch (e) { setErro(e as ErroNero); }
    finally { setCarregando(false); }
  }, [userId]);

  useEffect(() => { recarregar(); }, [recarregar]);
  return { avaliacoes, perfil, exames, pendencias, sintomas, carregando, erro, recarregar };
}
```

- [ ] **Step 6: tsc, testes, commit**

```bash
npx tsc --noEmit && npx jest
git add -A && git commit -m "feat(rastreando): contexto do motor a partir do banco, registro de exame (§42), pendências, lembretes e sintomas

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 9: Conteúdo por programa + tela "Seus rastreamentos" + hub do câncer

> As Tasks 9–12 descrevem as telas em termos de componentes e comportamento; o código segue os padrões já estabelecidos na Fase 0 (`app/(app)/minha-saude/*.tsx`, `src/modules/home/*`, `PassoPerfil`, `Opcoes`, `Select`, `CampoData`, `StatusBadge`, `Card`, `ListItem`).

**Antes de começar:** reler `docs/nero/03-DESIGN.md`. Programas mostrados como cards (galeria) com `StatusBadge`; status §28 → nível: `em_dia` verde · `indicado` verde (texto "Indicado") · `exame_proximo` amarelo · `proximo_de_iniciar` cinza · `exame_atrasado` laranja · `avaliacao_individualizada`/`acompanhamento_medico` amarelo · `nao_indicado_no_momento` cinza; pendência aberta força laranja/vermelho.

**Files:**
- Create: `src/modules/rastreando/conteudo/{mama,colo_utero,colorretal,pulmao,prostata}.ts`, `src/modules/rastreando/conteudo/index.ts`, `src/modules/rastreando/componentes/CardPrograma.tsx`, `src/modules/rastreando/componentes/statusUI.ts`, `app/(app)/rastreando/index.tsx` (substitui a ponte), `app/(app)/rastreando/_layout.tsx`, `app/(app)/rastreando/[programa]/_layout.tsx`, `app/(app)/rastreando/[programa]/index.tsx`, `app/(app)/rastreando/[programa]/entenda.tsx`, `app/(app)/rastreando/[programa]/fatores.tsx`

- [ ] **Step 1: Contrato do conteúdo (`conteudo/index.ts`)**

```ts
import type { Programa } from '@core/regras/tipos';
import { mama } from './mama'; import { colo_utero } from './colo_utero'; import { colorretal } from './colorretal'; import { pulmao } from './pulmao'; import { prostata } from './prostata';

export interface SinalAlerta { id: string; texto: string }
export interface ConteudoPrograma {
  titulo: string; subtitulo: string;
  entenda: string[];                 // 3–5 parágrafos curtos
  fatoresEducativos: string[];       // §29.3 — não mudam o protocolo
  fatoresModificadores: string[];    // §29.3 — mudam o protocolo
  sinaisAlerta: SinalAlerta[];       // §29.4 / §52
  fonteResumo: string;               // ex.: "CBR/SBM/FEBRASGO 2023 · INCA 2025"
  divergenciaSus?: string;           // texto opcional sobre a recomendação do SUS
}
export const CONTEUDO: Record<Programa, ConteudoPrograma> = { mama, colo_utero, colorretal, pulmao, prostata };
```

- [ ] **Step 2: Conteúdo — `mama.ts`** (os demais seguem o mesmo molde; textos curtos, voz do §25; **checkpoint de revisão do Murilo na Task 13**)

```ts
import type { ConteudoPrograma } from './index';
export const mama: ConteudoPrograma = {
  titulo: 'Câncer de mama', subtitulo: 'Rastreamento com mamografia',
  entenda: [
    'O câncer de mama é o mais comum entre mulheres no Brasil, depois do câncer de pele. Descoberto cedo, as chances de tratamento com sucesso são muito altas.',
    'A mamografia consegue encontrar alterações antes de qualquer sintoma. Por isso é o exame usado no rastreamento de quem não tem queixas.',
    'As sociedades brasileiras de mastologia, radiologia e ginecologia recomendam mamografia anual dos 40 aos 74 anos para mulheres de risco habitual.',
  ],
  divergenciaSus: 'O SUS (Ministério da Saúde/INCA) oferece mamografia de rastreamento a cada dois anos entre 50 e 69 anos. Se você tem entre 40 e 49 anos, pode ser necessário pedido médico para fazer pelo SUS.',
  fatoresEducativos: ['Idade acima de 50 anos', 'Obesidade após a menopausa', 'Sedentarismo', 'Consumo de álcool', 'Primeira gestação após os 30 anos ou não ter tido filhos', 'Reposição hormonal prolongada', 'Menstruação precoce ou menopausa tardia'],
  fatoresModificadores: ['Mutação em BRCA1, BRCA2, TP53 ou outros genes de risco', 'Mãe, irmã ou filha com câncer de mama, especialmente antes dos 50', 'Câncer de ovário na família ou câncer de mama em homem da família', 'Radioterapia no tórax antes dos 30 anos', 'Biópsia prévia com hiperplasia atípica ou carcinoma lobular in situ', 'Câncer de mama já tratado'],
  sinaisAlerta: [
    { id: 'nodulo_mamario', texto: 'Nódulo ou caroço na mama ou axila' },
    { id: 'descarga_papilar', texto: 'Saída de líquido pelo mamilo, principalmente com sangue' },
    { id: 'retracao_pele', texto: 'Pele da mama enrugada, retraída ou com aspecto de casca de laranja' },
    { id: 'alteracao_mamilo', texto: 'Mamilo retraído ou com ferida que não cicatriza' },
    { id: 'vermelhidao', texto: 'Vermelhidão, inchaço ou calor na mama sem causa aparente' },
  ],
  fonteResumo: 'CBR/SBM/FEBRASGO 2023 · INCA 2025',
};
```
`colo_utero.ts` (fonte INCA 2025; sinais: sangramento fora do período/após relação, corrimento com odor, dor pélvica persistente), `colorretal.ts` (CONITEC 2026, ACG 2021; sinais: sangue nas fezes, mudança persistente do hábito intestinal, emagrecimento sem causa, anemia, dor abdominal persistente), `pulmao.ts` (USPSTF 2021, SBPT; sinais: tosse persistente > 3 semanas, escarro com sangue, falta de ar, dor torácica, rouquidão, emagrecimento), `prostata.ts` (SBU; sinais: dificuldade para urinar, jato fraco, sangue na urina ou sêmen, dor óssea persistente; texto sobre a posição do INCA). Cada `sinaisAlerta[].id` é o valor gravado em `sintomas_alarme.sintoma`.

- [ ] **Step 3: `statusUI.ts`**

```ts
import type { StatusRastreamento } from '@core/regras/tipos';
import type { NivelAlertaUI } from '@ui/theme';
export const STATUS_UI: Record<StatusRastreamento, { rotulo: string; nivel: NivelAlertaUI }> = {
  em_dia: { rotulo: 'Em dia', nivel: 'verde' },
  indicado: { rotulo: 'Indicado', nivel: 'verde' },
  exame_proximo: { rotulo: 'Exame próximo', nivel: 'amarelo' },
  exame_atrasado: { rotulo: 'Exame atrasado', nivel: 'laranja' },
  proximo_de_iniciar: { rotulo: 'Em breve', nivel: 'cinza' },
  nao_indicado_no_momento: { rotulo: 'Não indicado agora', nivel: 'cinza' },
  avaliacao_individualizada: { rotulo: 'Avaliação individualizada', nivel: 'amarelo' },
  acompanhamento_medico: { rotulo: 'Acompanhamento médico', nivel: 'amarelo' },
};
```

- [ ] **Step 4: `CardPrograma.tsx`** — card (raio `bloco`) com título, `StatusBadge`, uma linha de mensagem e, se houver, "Próximo: dd/mm/aaaa" ou "Pendência: …" em laranja/vermelho. Props: `{ programa, avaliacao: ResultadoElegibilidade, pendencia?: PendenciaAberta, sintomas: number, onPress }`. Quando `sintomas > 0`, badge vermelho "Sinal de alerta" prevalece.

- [ ] **Step 5: `app/(app)/rastreando/index.tsx`**

Lista "Seus rastreamentos": só programas com `aplicavel` (usar `handlers[p].aplicavel(perfil)` com o `perfil` devolvido por `useRastreando`) — os não aplicáveis ficam em uma seção recolhida "Outros programas" com `nao_indicado_no_momento`. Bloco "Pendências" (se houver) no topo com `ItemHoje`-like. Botão "Sinais de alerta" → lista geral. Pull-to-refresh → `recarregar`. Estado de erro → mensagem + "Tentar de novo".

- [ ] **Step 6: `[programa]/_layout.tsx` (Stack) e `[programa]/index.tsx` (hub §29)**

Hub: cabeçalho com título do conteúdo + `StatusBadge` + mensagem da avaliação; `ListItem`s: "Entenda este câncer", "Preciso fazer rastreamento?", "Fatores de risco", "Sinais de alerta", "Meus exames" (com contagem), "Histórico". `useLocalSearchParams<{ programa: Programa }>()`; validar contra `PROGRAMAS` (inválido → `Redirect` para `/(app)/rastreando`).

- [ ] **Step 7: `entenda.tsx` e `fatores.tsx`**

`entenda`: parágrafos de `entenda`, caixa "No SUS" com `divergenciaSus` quando existir, rodapé "Fontes: {fonteResumo}". `fatores`: duas seções — "Fatores que aumentam o risco" (educativos) e "Fatores que mudam o seu protocolo" (modificadores); os modificadores presentes no perfil marcados com check e texto "Presente no seu perfil" (derivar de `fatoresModificadores(perfil) !== null` + heurística simples por termo).

- [ ] **Step 8: `npm run rotas`, tsc, teste no celular, commit**

```bash
git add -A && git commit -m "feat(rastreando): conteúdo por programa, tela Seus rastreamentos e hub do câncer

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 10: "Preciso fazer rastreamento?" + campos novos no perfil

**Files:**
- Create: `app/(app)/rastreando/[programa]/preciso.tsx`, `src/modules/rastreando/perguntasFaltantes.ts`, `src/modules/rastreando/__tests__/perguntasFaltantes.test.ts`
- Modify: `app/(app)/minha-saude/perfil.tsx` (raça/cor, atividade sexual, menopausa), `app/perfil-inicial.tsx` (raça/cor no passo 2), `src/modules/minha-saude/opcoes.ts` (`OPCOES_RACA_COR`)

- [ ] **Step 1: `perguntasFaltantes(programa, perfilSaude, antecedentesQtd, semAntecedentes)`** — função pura que devolve a lista de campos do perfil que faltam para avaliar aquele programa:

| programa | campos |
|---|---|
| mama | `dataNascimento`, `sexoNascimento`, antecedentes (ou declaração negativa), `radioterapiaToracica`, `doencasGeneticas`/`lesoesPrecursoras` (perguntar "já teve biópsia de mama com hiperplasia atípica/CLIS?" → grava em lesoesPrecursoras) |
| colo_utero | `possuiColoUtero`, `jaTeveAtividadeSexual`, `temHiv`/`temImunossupressao`, `lesoesPrecursoras` (NIC 2/3 tratada?) |
| colorretal | antecedentes, `temDii`, `lesoesPrecursoras` (pólipo/adenoma prévio?), `doencasGeneticas` (Lynch/PAF?) |
| pulmao | `tabagismoStatus`, `cigarrosDia`, `anosFumando`, `dataCessacao` (se ex) |
| prostata | `racaCor`, antecedentes (próstata), peso recente (medidas) |

Teste: perfil completo → `[]`; fumante sem `cigarrosDia` → contém `'cigarrosDia'`.

- [ ] **Step 2: `preciso.tsx`** — se `perguntasFaltantes` vazia, mostra direto o resultado (`StatusBadge` + mensagem + `detalhes`/fonte + botão "Registrar exame" ou "Ver sinais de alerta"); senão, um passo por campo faltante (reutiliza `PassoPerfil`, `Opcoes`, `CampoData`, `Input`, `OPCOES_*`), grava via `usePerfil().salvar`/`salvarAntecedente`, e ao terminar chama `recarregar()` e mostra o resultado. Rodapé fixo: "Este resultado organiza as recomendações das diretrizes para o seu perfil e não substitui a avaliação do seu médico."

- [ ] **Step 3: Perfil** — `OPCOES_RACA_COR` (branca, preta, parda, amarela, indígena, prefiro não informar); no `perfil.tsx` seção "Dados básicos" ganha "Raça/cor (autodeclarada)" com `Select`, e para sexo feminino "Já teve atividade sexual?" e "Está na menopausa?" (`Opcoes` sim/não). No `perfil-inicial.tsx`, passo 2 ganha o `Select` de raça/cor abaixo do sexo (opcional).

- [ ] **Step 4: rotas, tsc, jest, celular, commit**

```bash
git add -A && git commit -m "feat(rastreando): 'Preciso fazer rastreamento?' com perguntas só do que falta; raça/cor, atividade sexual e menopausa no perfil

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 11: Meus exames + Registrar exame (formulários estruturados)

**Files:**
- Create: `app/(app)/rastreando/[programa]/exames.tsx`, `app/(app)/rastreando/[programa]/registrar.tsx`, `src/modules/rastreando/componentes/FormResultado.tsx`, `src/modules/rastreando/componentes/CartaoExame.tsx`, `src/modules/rastreando/componentes/ResultadoClassificacaoView.tsx`

- [ ] **Step 1: `FormResultado.tsx`** — recebe `tipo: TipoExameRastreamento`, `valor`, `onChange`; renderiza os campos estruturados da spec §4.3:
  - mamografia: `Opcoes` BI-RADS 0–6 (com descrição curta de cada), `Select` densidade (a–d, opcional), `Input` "intervalo indicado no laudo (meses)" só se BI-RADS 3.
  - dna_hpv: `Opcoes` negativo / 16 e/ou 18 / outros oncogênicos; se outros → `Select` citologia reflexa (opções Bethesda + "não informada").
  - citologia: `Select` Bethesda. colposcopia: `Select` achado.
  - fit: `Opcoes` negativo/positivo.
  - colonoscopia: `Opcoes` achado; se pólipos → quantidade, maior (mm), removidos (sim/não), histopatológico (`Select` aguardando/hiperplásico/adenoma/adenoma avançado/carcinoma), intervalo do laudo (meses); "exame completo e com preparo adequado?" (sim/não).
  - tcbd: `Opcoes` Lung-RADS 0–4X; "modificador S" (sim/não).
  - psa: `Input` PSA total, PSA livre (opc.), referência máxima do laboratório (obrigatório para interpretar), `CampoData futuro` "seu médico pediu para repetir em".
  Devolve também `valido: boolean`.

- [ ] **Step 2: `registrar.tsx`** — passos: (1) tipo do exame (`Opcoes` de `TIPOS_POR_PROGRAMA[programa]`, pula se só um); (2) data (`CampoData`); (3) resultado (`FormResultado`); (4) "Este exame está relacionado a uma pendência anterior?" — só aparece se houver pendência aberta no programa; lista as pendências como `Opcoes` + "Não"; (5) opcionais: instituição, solicitante, laudo em texto; (6) Salvar → `registrarExame` → `ResultadoClassificacaoView` (StatusBadge do nível, `mensagemPaciente`, `proximaAcao`, data prevista formatada, "regra: fonte/versão" em caption) → botões "Ver meus exames" / "Voltar ao início". Se `lembretesOk=false`, aviso discreto. Sem conexão → Salvar desabilitado.

- [ ] **Step 3: `exames.tsx`** — lista `CartaoExame` (tipo, data, resultado resumido, `StatusBadge` nível, próxima ação/data); vazio → convite "Registre seu primeiro exame". Botão "Registrar exame".

- [ ] **Step 4: rotas, tsc, celular (fluxo BI-RADS 3 → 6 meses; FIT + → pendência; colonoscopia relacionada → pendência fecha), commit**

```bash
git add -A && git commit -m "feat(rastreando): registro de exames com resultado estruturado, vínculo com pendência e devolutiva do motor

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 12: Sinais de alerta, pendências, lembretes, histórico e Home

**Files:**
- Create: `app/(app)/rastreando/[programa]/sinais.tsx`, `app/(app)/rastreando/[programa]/historico.tsx`, `app/(app)/rastreando/pendencias.tsx`, `app/(app)/rastreando/lembretes.tsx`
- Modify: `src/modules/home/montarItensHoje.ts` + teste, `app/(app)/index.tsx`

- [ ] **Step 1: `sinais.tsx`** — texto fixo no topo: "Rastreamento é para quem não tem sintomas. Se você tem algum destes sinais, não espere a data do próximo exame." Lista `sinaisAlerta` com botão "Tenho este sinal" → confirmação → `registrarSintoma` → tela mostra o aviso §52 em vermelho ("Não espere pela data do seu próximo rastreamento…") e o card do programa passa a exibir "Sinal de alerta". Sintomas abertos aparecem com "Já fui avaliado" → `resolverSintoma`.

- [ ] **Step 2: `pendencias.tsx`** — §50: lista das abertas (programa, exame de origem com data e resultado, `proxima_acao`, nível) + botão "Registrar exame relacionado" que abre `registrar.tsx` com `resolveExameId` pré-selecionado (query param). Vazio: "Nenhuma pendência. Quando um exame precisar de continuidade, ele aparece aqui."

- [ ] **Step 3: `lembretes.tsx`** — próximos 90 dias de `lembretes` (pendentes, origem exame), agrupados por mês; texto e data. Botão "Ativar notificações" se permissão negada.

- [ ] **Step 4: `historico.tsx`** — §39: linha do tempo do programa (ano → exames com resultado e nível) + "Próximo previsto".

- [ ] **Step 5: Home** — `montarItensHoje` recebe também `{ pendencias, avaliacoes, sintomas }` (opcionais) e gera: sintoma aberto → vermelho "Sinal de alerta em {programa}: procure avaliação"; pendência → laranja/vermelho com `descricao`; `exame_atrasado` → laranja; `exame_proximo` → amarelo. Testes: 4 novos casos. `app/(app)/index.tsx` usa `useRastreando()` e passa os dados; card Rastreando mostra subtítulo dinâmico ("2 pendências" / "Tudo em dia").

- [ ] **Step 6: rotas, tsc, jest, celular, commit**

```bash
git add -A && git commit -m "feat(rastreando): sinais de alerta, pendências, lembretes, histórico e integração com a Home

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY"
```

---

## Task 13: Revisão clínica do conteúdo, checklist, deploy do banco e encerramento

- [ ] **Step 1: Revisão do Murilo (checkpoint bloqueante)** — enviar para leitura: os 5 arquivos de `conteudo/*.ts` (textos), as mensagens em `seed.sql` e as mensagens dos handlers. Aplicar as correções pedidas. Registrar em `02-DECISOES.md` qualquer mudança clínica.

- [ ] **Step 2: Checklist manual `docs/nero/checklists/fase-1.md`** — itens do critério de pronto da spec + um cenário por programa (perfil feminino 45 anos: mama indicado, colo em dia após HPV negativo; masculino 55 fumante 30 maços-ano: pulmão indicado, colorretal indicado, próstata 50; HIV: intervalo 3 anos; história familiar CCR aos 42: mensagem "32 anos"; PSA sem referência → pendente; sintoma → sobrepõe). Murilo executa no aparelho.

- [ ] **Step 3: Testes completos**

```bash
npx tsc --noEmit && npx jest --ci && supabase test db
```

- [ ] **Step 4: Banco na nuvem** — `supabase db push` (migrações 0008, 0009) e semente: `psql "$SUPABASE_DB_URL" -f supabase/seed.sql` **ou** via SQL Editor do painel (colar `seed.sql`). Verificar: `select programa, count(*) from regras_clinicas group by 1`.

- [ ] **Step 5: Docs** — `00-ROADMAP.md` (Fase 1 marcada; log), `REFERENCIAS.md` (coluna "Última verificação" preenchida para cada fonte), `02-DECISOES.md` (C-009 marcada validada com a fonte usada), `README.md` (seção Rastreando).

- [ ] **Step 6: Merge e push**

```bash
git checkout desenvolvimento-2 && git merge --no-ff nero-fase1-rastreando -m "Merge nero-fase1-rastreando: Fase 1 do NERO (Rastreando v2)

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY" && git push
```
