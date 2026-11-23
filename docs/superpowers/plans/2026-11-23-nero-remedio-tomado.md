# Marcar remédio tomado (adesão aos remédios) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** O idoso marca cada dose de remédio em um toque (pela notificação, pela tela inicial, pelo ＋ Anotar ou por Meus medicamentos), o app classifica cada dose prevista e mostra a adesão da semana no check-in semanal; um segundo lembrete avulso cobre a dose sem resposta.

**Architecture:** Só a dose marcada vira linha (`tomadas_medicacao`); as doses previstas são calculadas por funções puras (`src/core/medicacoes/adesao.ts`) a partir do cadastro, que ganha quantidade por horário, unidade, "dose muda conforme o dia" e "se precisar". O lembrete diário (D-048) continua um por horário, agora com o texto e a rota da tela "Tomou?"; o segundo lembrete é avulso, planejado por função pura (`segundoLembrete.ts`) numa janela de hoje + amanhã, refeita ao abrir o app e ao salvar um remédio, e não grava linha em `lembretes`. A tela "Tomou?" (`app/(app)/remedios/tomar.tsx`) grava, corrige ou soma tomadas e cancela o segundo lembrete da dose.

**Tech Stack:** Expo SDK 57, expo-router, expo-notifications, Supabase (Postgres + RLS, pgTAP), TypeScript, Jest + react-test-renderer.

**Spec:** `docs/superpowers/specs/2026-11-23-remedio-tomado-design.md`
**Contrato entre planos:** este é o plano 2 de 3 (ordem: navegação → remédio tomado → relatório novo). O plano 1 já criou `src/modules/anotar/itensAnotar.ts` (`ITENS_ANOTAR`), `src/ui/components/BotaoAcao.tsx` e `app/(app)/anotar.tsx`; o plano 3 consome `resumirAdesao` e `listarTomadas` deste plano. Não mexer em `src/core/relatorios/*` além da adaptação de tipo da Task 2.

## Global Constraints

- Nomes do contrato, exatos: `UnidadeDose = 'comprimido' | 'gota' | 'unidade' | 'ml' | 'jato'`; `HorarioDose { hora: string; quantidade: number }`; `Medicacao` ganha `horarios: HorarioDose[]`, `unidade`, `doseVariavel`, `sePrecisar`, `horariosDesde: string | null`; `Tomada`, `EstadoDose`, `DoseClassificada`, `ResumoAdesao`, `classificarDoses`, `resumirAdesao`, `listarTomadas`, `useDosesHoje` com as assinaturas do contrato; rotas `app/(app)/remedios/tomar.tsx` (params `med`, `hora`, `data`) e `app/(app)/remedios/hoje.tsx`.
- Datas de dia são `'AAAA-MM-DD'` no fuso local; horas são `'HH:MM'`; instantes (`marcadoEm`, `horariosDesde`) são ISO.
- Atraso: tomou **mais de 2 h** depois do horário previsto → `comAtraso` (não é erro).
- Prazo para marcar: até **o fim do dia seguinte** ao da dose; depois a dose sem marca é "sem registro".
- Segundo lembrete: **30 min** depois do horário, **no máximo um** por dose, avulso, para as doses de **hoje e amanhã**; teto de **40** avulsos (e nunca passar de 64 agendados no total, D-048): passou do teto → só hoje.
- Passo da quantidade: comprimido 0,5; gota 1; unidade 1; mL 0,5; jato 1. Padrão ao migrar: 1 comprimido por horário.
- Textos fixos (copiar exatamente): lembrete `Hora do remédio: Losartana 50 mg · 1 comprimido` / `Toque aqui para marcar`; segundo lembrete `Você tomou Losartana das 8h?` / `Toque aqui para marcar`; explicação `Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento.`; aviso `Você já marcou essa dose às 8h10`; botões `✓ Tomei`, `Não tomei`, `Corrigir`, `Tomei de novo`; confirmação `Marcado ✓`; item do ＋ Anotar `Tomei remédio`.
- Remédio com horário e lembrete desligado conta na adesão e aparece em "Para fazer hoje"; só não recebe notificação.
- A preferência "Medicamentos" (`preferencias_lembretes.medicacao`) desligada também cala o segundo lembrete.
- Migração `supabase/migrations/0023_remedio_tomado.sql`, RLS de dono igual à 0005; testes pgTAP em `supabase/tests/`.
- Testes: `npx jest <caminho>`; tipos: `npx tsc --noEmit`. Não rodar `expo lint`. Testes de tela usam react-test-renderer (não @testing-library), com os auxiliares `textoDe`/`apertar` no molde de `src/core/documentos/__tests__/telaNovoDocumento.test.tsx`.
- A tela `medicamentos.tsx` passa a se chamar **"Meus remédios"** (título do `InternalHeader`; pendência do plano 1). Os outros textos "Meus medicamentos" do app (Home, Minha Saúde) ficam como o plano 1 deixou.
- Interface e comentários em português do Brasil, com acentos.
- Commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Decisões deste plano que se afastam da letra da spec

- **`medicacoes.horarios` continua uma lista de textos `'HH:MM'`**; a quantidade vai numa coluna nova `quantidades jsonb` (`{"08:00": 1, "20:00": 2}`). Motivo: o build atual nas lojas lê `horarios` como `string[]` (`formatarHorarios`, `agendarLembretesMedicacao` fazem `h.split(':')`); trocar o formato no banco derrubaria a tela e os lembretes de quem ainda não atualizou (spec §7: "não quebrar os lembretes atuais"). Hora sem entrada em `quantidades` vale 1. No app o modelo é o do contrato (`horarios: HorarioDose[]`).
- **`horarios_desde` é mantido por gatilho no banco** (insert, ou mudança em `horarios`/`quantidades`), não pelo app — assim também vale para edições feitas pelo build antigo.
- **O segundo lembrete não grava linha em `lembretes`**: é cancelado pelo identificador da notificação (`medicacao2:<med>:<data>:<hora>`). Não aparece na Agenda (seria um segundo item por dose, e ele some quando a dose é marcada).
- **"Dose muda conforme o dia":** o lembrete principal não mostra quantidade (`Hora do remédio: Insulina` / `Toque aqui para marcar`).
- **Título com emoji:** pelo padrão D-044, o título leva o 💊 no fim (`Hora do remédio: Losartana 50 mg · 1 comprimido 💊`).
- **Params da tela "Tomou?":** o contrato lista `{ med, hora, data }`; aqui `hora` e `data` são opcionais — sem `data` vale hoje, sem `hora` é a tomada de um remédio "se precisar" (que não tem horário). Quem passa os três (notificação, Home, lista de hoje) continua igual ao contrato.
- **Linha do tempo:** só semanas completas e só a partir da primeira tomada registrada (sem isso, quem nunca marca ganharia um "0 %" por semana).

## Review Focus

1. Pessoa com o build antigo depois da migração: `horarios` continua `string[]` e uma hora nova gravada pelo build antigo (sem entrada em `quantidades`) vira quantidade 1 — teste `paraMedicacao` na Task 2 e pgTAP na Task 1.
2. Toque duplo em "✓ Tomei" (comum em idoso): grava uma tomada só, não uma "dose dobrada" — teste na Task 6.
3. Dose das 23:45: o segundo lembrete toca às 00:15 do dia seguinte, mas marca a dose do dia anterior (`data` da dose na rota e no identificador) — teste na Task 5.
4. Sem internet ao marcar: a gravação falha, a tela avisa e **não** mostra "Marcado ✓" nem volta — teste na Task 6.
5. Notificação antiga de um remédio que foi apagado/não existe mais na lista: a tela "Tomou?" diz que o remédio não está mais na lista, sem quebrar — teste na Task 6.

---

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/migrations/0023_remedio_tomado.sql` (novo) | colunas novas em `medicacoes`, gatilho de `horarios_desde`, tabela `tomadas_medicacao` + RLS |
| `supabase/tests/remedio_tomado.test.sql` (novo) | pgTAP do gatilho, das restrições e do RLS |
| `src/core/medicacoes/tipos.ts` | tipos do contrato |
| `src/core/medicacoes/unidades.ts` (novo) | unidades, passo, plural, pergunta da quantidade |
| `src/core/medicacoes/horarios.ts` | + `horaCurta`, `mesclarQuantidades` |
| `src/core/medicacoes/repositorio.ts` | mapeamento novo, `listarTomadas`, `registrarTomada`, `substituirTomadas` |
| `src/core/medicacoes/adesao.ts` (novo) | classificação, resumo, prazo, semanas abaixo de 80 % |
| `src/core/medicacoes/segundoLembrete.ts` (novo) | plano puro dos segundos lembretes |
| `src/core/medicacoes/useDosesHoje.ts`, `useAdesao.ts` (novos) | hooks de leitura |
| `src/core/cardio/lembretesCardio.ts` | texto/rota do lembrete principal; agendar/cancelar segundos lembretes |
| `src/core/lembretes/{textos,rotina,preferencias,useToqueNotificacao}.ts` | textos novos, nome na rotina, preferência, data da dose no toque |
| `src/modules/remedios/{SeletorQuantidade.tsx,rotulos.ts,QuadroAdesao.tsx}` (novos) | peças de interface |
| `src/modules/minha-saude/DosesPorHorario.tsx` (novo) | quantidade por horário no cadastro |
| `app/(app)/remedios/tomar.tsx`, `app/(app)/remedios/hoje.tsx` (novos) | tela "Tomou?" e lista "Tomei remédio" |
| `app/(app)/(tabs)/minha-saude/medicamentos.tsx`, `app/(app)/bem-estar/checkin/index.tsx`, `app/(app)/(tabs)/index.tsx`, `src/modules/home/montarItensHoje.ts`, `src/modules/anotar/itensAnotar.ts`, `src/core/linhaDoTempo/geral.ts` | pontos de entrada |
| `docs/nero/publicacao/politica-de-privacidade.md`, `docs/nero/notificacoes.md`, `docs/nero/02-DECISOES.md` | documentação |

---

### Task 1: Banco — migração 0023, pgTAP, tipos gerados e política de privacidade

**Files:**
- Create: `supabase/migrations/0023_remedio_tomado.sql`
- Create: `supabase/tests/remedio_tomado.test.sql`
- Modify: `supabase/tests/excluir_conta.test.sql` (plano 9 → 10)
- Modify: `src/core/supabase/database.types.ts`
- Modify: `docs/nero/publicacao/politica-de-privacidade.md:35` e a linha "Última atualização"

**Interfaces:**
- Produces: colunas `medicacoes.quantidades jsonb not null default '{}'`, `unidade text not null default 'comprimido'` (check nos 5 valores), `dose_variavel boolean not null default false`, `se_precisar boolean not null default false`, `horarios_desde timestamptz`; tabela `public.tomadas_medicacao (id uuid pk default gen_random_uuid(), user_id uuid not null → auth.users on delete cascade, medicacao_id uuid not null → medicacoes on delete cascade, data_prevista date, hora_prevista text, quantidade_prevista numeric, tomou boolean not null, quantidade numeric, marcado_em timestamptz not null default now(), created_at timestamptz not null default now())`.

- [ ] **Step 1: Escrever o pgTAP `supabase/tests/remedio_tomado.test.sql`** (mesmo molde de `consentimentos.test.sql`: `begin; select plan(N); … select * from finish(); rollback;`)

Asserções (usuários `…0000d1` e `…0000d2`):
```sql
-- gatilho
insert med A com horarios '["08:00"]'  → isnt(horarios_desde, null, 'cadastrar com horário marca horarios_desde')
insert med A2 sem horários             → is(horarios_desde, null, 'sem horário não marca horarios_desde')
update A set horarios_desde = '2020-01-01'; update A set observacao = 'x'
                                       → is(horarios_desde, '2020-01-01'::timestamptz, 'mudar observação não mexe em horarios_desde')
update A set quantidades = '{"08:00": 2}' → is(horarios_desde, now(), 'mudar quantidade marca horarios_desde')
is((select unidade from medicacoes where id = A), 'comprimido', 'unidade padrão é comprimido')
is(jsonb_typeof((select horarios->0 from medicacoes where id = A)), 'string', 'horarios continua lista de textos (build antigo)')
-- restrições
throws_ok(insert tomada com data_prevista e hora_prevista null, '23514', …, 'data sem hora é recusada')
throws_ok(update medicacoes set unidade = 'colher', '23514', …, 'unidade fora da lista é recusada')
-- RLS (set local role authenticated; jwt sub = d1)
lives_ok(insert tomada de d1 para A, 'dono registra a própria tomada')
throws_ok(insert tomada com user_id d2, '42501', null, 'ninguém registra tomada em nome de outro')
-- jwt sub = d2
is((select count(*) from tomadas_medicacao), 0::bigint, 'D2 não vê as tomadas de D1')
-- cascata (reset role)
delete from medicacoes where id = A → is(count tomadas de A, 0::bigint, 'apagar o remédio apaga as tomadas')
```

- [ ] **Step 2: Em `supabase/tests/excluir_conta.test.sql`**, inserir uma tomada de A (para a `Losartana` de A) e acrescentar `is(count tomadas_medicacao de A, 0::bigint, 'tomadas de A removidas por cascata')`; `plan(9)` → `plan(10)`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `supabase db reset && npm run db:test`
Expected: FAIL em `remedio_tomado.test.sql` (coluna/tabela não existe) e em `excluir_conta.test.sql`.

- [ ] **Step 4: Escrever `supabase/migrations/0023_remedio_tomado.sql`**

Cabeçalho no estilo das outras (`-- NERO · D-066: marcar remédio tomado.` + por que `quantidades` é coluna à parte). Conteúdo:
- `alter table public.medicacoes add column …` (as cinco colunas acima; check `quantidade > 0` não cabe em jsonb — fica no app).
- Dados existentes: `update … set se_precisar = true where ativa and jsonb_array_length(horarios) = 0;` e `update … set horarios_desde = now() where jsonb_array_length(horarios) > 0;` (quantidades fica `{}` = 1 por horário).
- Gatilho `before insert or update` `public.medicacoes_horarios_desde()` (`language plpgsql set search_path = ''`): em INSERT, ou quando `new.horarios is distinct from old.horarios or new.quantidades is distinct from old.quantidades`, faz `new.horarios_desde := case when jsonb_array_length(new.horarios) > 0 then now() else null end`.
- `create table public.tomadas_medicacao (…)` com checks: `(data_prevista is null) = (hora_prevista is null)`, `hora_prevista ~ '^\d{2}:\d{2}$'`, `quantidade is null or quantidade > 0`, `quantidade_prevista is null or quantidade_prevista > 0`, `not tomou or quantidade is not null`.
- Índices: `(user_id, data_prevista)` e `(user_id, marcado_em) where data_prevista is null`.
- RLS igual à 0005: `enable row level security` + `create policy tomadas_medicacao_owner … for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)`.
- Não precisa mexer na 0014: `excluir_minha_conta` apaga `auth.users` e a cascata leva a tabela nova.

- [ ] **Step 5: Rodar e ver passar**

Run: `supabase db reset && npm run db:test`
Expected: todos os arquivos `ok`, incluindo `remedio_tomado.test.sql` e `excluir_conta.test.sql`.

- [ ] **Step 6: Regenerar os tipos**

Run: `npm run db:types`
Expected: `database.types.ts` ganha `tomadas_medicacao` e as cinco colunas de `medicacoes` (sem Docker: editar à mão nos três blocos Row/Insert/Update, no mesmo formato).

- [ ] **Step 7: Política de privacidade**

Linha 35 passa a: `- Medicações, horários e quantidade de cada dose; registro de tomada de remédios (se tomou ou não, quanto e a hora em que marcou); sintomas de alarme assinalados.` e "Última atualização" → `23 de novembro de 2026`. Não rodar `site:publicar` (publicação é do Murilo).

- [ ] **Step 8: Commit**

```bash
git add supabase/migrations/0023_remedio_tomado.sql supabase/tests/remedio_tomado.test.sql supabase/tests/excluir_conta.test.sql src/core/supabase/database.types.ts docs/nero/publicacao/politica-de-privacidade.md
git commit -m "feat(remédios): tabela de tomadas e quantidade por horário (migração 0023)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Modelo — tipos, unidades, repositório e consumidores adaptados

**Files:**
- Modify: `src/core/medicacoes/tipos.ts`, `src/core/medicacoes/horarios.ts`, `src/core/medicacoes/repositorio.ts`, `src/core/medicacoes/useMedicacoes.ts`
- Create: `src/core/medicacoes/unidades.ts`
- Modify (só adaptação de tipo): `src/core/cardio/lembretesCardio.ts` (`agendarLembretesMedicacao`, `sincronizarLembretesMedicacao`), `src/core/relatorios/montar.ts:194`, `src/core/relatorios/__tests__/fixtures.ts:28-30`, `app/(app)/coracao/mrpa/relatorio.tsx:107`, `app/(app)/coracao/glicemia/relatorio.tsx:81`, `app/(app)/(tabs)/minha-saude/medicamentos.tsx`, `src/core/cardio/__tests__/lembretesMedicacao.test.ts`
- Test: `src/core/medicacoes/__tests__/unidades.test.ts`, `src/core/medicacoes/__tests__/horarios.test.ts`, `src/core/medicacoes/__tests__/repositorio.test.ts`

**Interfaces:**
- Produces (em `tipos.ts`, exatamente como no contrato): `UnidadeDose`, `HorarioDose`, `Medicacao` com `horarios: HorarioDose[]; unidade: UnidadeDose; doseVariavel: boolean; sePrecisar: boolean; horariosDesde: string | null`, `Tomada { id; medicacaoId; dataPrevista: string | null; horaPrevista: string | null; quantidadePrevista: number | null; tomou: boolean; quantidade: number | null; marcadoEm: string }`.
- Produces (`unidades.ts`): `UNIDADES: Record<UnidadeDose, { rotulo: string; singular: string; plural: string; passo: number; pergunta: string }>`; `formatarQuantidade(q: number, u: UnidadeDose): string`; `numeroBr(q: number): string`.
- Produces (`horarios.ts`): `horaCurta(hora: string): string`; `mesclarQuantidades(horas: string[], anteriores: HorarioDose[]): HorarioDose[]`.
- Produces (`repositorio.ts`): `paraMedicacao(linha): Medicacao`; `paraLinhaMedicacao(userId, m)`; `listarTomadas(userId: string, desde: string, ate: string): Promise<Tomada[]>`; `registrarTomada(userId: string, t: Omit<Tomada, 'id' | 'marcadoEm'>): Promise<void>`; `substituirTomadas(userId: string, dose: { medicacaoId: string; dataPrevista: string; horaPrevista: string }, nova: Omit<Tomada, 'id' | 'marcadoEm'>): Promise<void>`; `salvarMedicacao(userId, m: Omit<Medicacao, 'id' | 'horariosDesde'> & { id?: string })`.

- [ ] **Step 1: Testes que falham**

`unidades.test.ts`:
```ts
expect(UNIDADES.comprimido.passo).toBe(0.5); expect(UNIDADES.gota.passo).toBe(1);
expect(UNIDADES.unidade.passo).toBe(1); expect(UNIDADES.ml.passo).toBe(0.5); expect(UNIDADES.jato.passo).toBe(1);
expect(formatarQuantidade(1, 'comprimido')).toBe('1 comprimido');
expect(formatarQuantidade(2, 'comprimido')).toBe('2 comprimidos');
expect(formatarQuantidade(0.5, 'comprimido')).toBe('meio comprimido');
expect(formatarQuantidade(1.5, 'comprimido')).toBe('1 comprimido e meio');
expect(formatarQuantidade(2.5, 'comprimido')).toBe('2 comprimidos e meio');
expect(formatarQuantidade(10, 'gota')).toBe('10 gotas');
expect(formatarQuantidade(8, 'unidade')).toBe('8 unidades');
expect(formatarQuantidade(2.5, 'ml')).toBe('2,5 mL');
expect(formatarQuantidade(1, 'jato')).toBe('1 jato');
expect(UNIDADES.comprimido.pergunta).toBe('Quantos comprimidos?'); expect(UNIDADES.gota.pergunta).toBe('Quantas gotas?');
expect(numeroBr(1.5)).toBe('1,5'); expect(numeroBr(2)).toBe('2');
```
`horarios.test.ts` (acrescentar):
```ts
expect(horaCurta('08:00')).toBe('8h'); expect(horaCurta('20:30')).toBe('20h30'); expect(horaCurta('00:15')).toBe('0h15');
// mantém a quantidade de quem continua; hora nova entra com 1
expect(mesclarQuantidades(['08:00', '14:00'], [{ hora: '08:00', quantidade: 2 }, { hora: '20:00', quantidade: 1 }]))
  .toEqual([{ hora: '08:00', quantidade: 2 }, { hora: '14:00', quantidade: 1 }]);
```
`repositorio.test.ts` (só as funções puras de mapeamento; mockar `@core/supabase/client` com `{ supabase: {} }`):
```ts
const linha = { id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: ['08:00', '20:00'], quantidades: { '08:00': 2 }, unidade: 'comprimido', dose_variavel: false, se_precisar: false, horarios_desde: '2026-11-20T12:00:00.000Z', desde: null, ate: null, prescritor: null, ativa: true, lembrar: true, observacao: null };
it('hora sem quantidade gravada (build antigo) vale 1', () => {
  expect(paraMedicacao(linha).horarios).toEqual([{ hora: '08:00', quantidade: 2 }, { hora: '20:00', quantidade: 1 }]);
});
it('remédio sem horário é "se precisar"', () => {
  expect(paraMedicacao({ ...linha, horarios: [], se_precisar: false }).sePrecisar).toBe(true);
});
it('grava horarios como textos e a quantidade à parte', () => {
  const l = paraLinhaMedicacao('u1', { ...paraMedicacao(linha) });
  expect(l.horarios).toEqual(['08:00', '20:00']); expect(l.quantidades).toEqual({ '08:00': 2, '20:00': 1 });
  expect(l).not.toHaveProperty('horarios_desde');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/medicacoes`
Expected: FAIL (`formatarQuantidade`, `horaCurta`, `paraMedicacao` não existem).

- [ ] **Step 3: Implementar tipos, `unidades.ts`, `horaCurta`, `mesclarQuantidades` e o repositório**

- `UNIDADES`: rótulos `Comprimido`, `Gota`, `Unidade (insulina)`, `mL`, `Jato ou inalação`; plural de `ml` é `mL`.
- `paraMedicacao` substitui o `map` atual de `listarMedicacoes`; `sePrecisar = se_precisar || horarios.length === 0`. `paraLinhaMedicacao` substitui o objeto `linha` de `salvarMedicacao` (sem `horarios_desde`, que é do gatilho).
- `listarTomadas`: duas consultas em `tomadas_medicacao` (`user_id = userId`): (a) `data_prevista` entre `desde` e `ate`; (b) `data_prevista is null` e `marcado_em` em `[desde 00:00 local, dia seguinte a ate 00:00 local)` (converter com `new Date(a, m-1, d).toISOString()`). Junta, ordena por `marcadoEm`, mapeia com `paraTomada`. Erro → `throw traduzirErro(error)`, como o resto do arquivo.
- `substituirTomadas`: `delete` por `user_id`, `medicacao_id`, `data_prevista`, `hora_prevista`; depois `registrarTomada`.

- [ ] **Step 4: Adaptar os consumidores (sem mudar comportamento)**

- `lembretesCardio.ts`: `agendarLembretesMedicacao(userId, m: Medicacao)` e `sincronizarLembretesMedicacao(userId, ativasComLembrete: Medicacao[])`; laço usa `h.hora` (texto continua o antigo até a Task 4). Teste `lembretesMedicacao.test.ts`: montar o remédio com `horarios: horarios.map((hora) => ({ hora, quantidade: 1 }))` e os campos novos.
- `relatorios/montar.ts:194`: `m.horarios.map((h) => h.hora).join(', ')` (o plano 3 refaz esta seção; aqui é só para não sair "[object Object]"). `fixtures.ts`: horários como `HorarioDose[]` + `unidade: 'comprimido', doseVariavel: false, sePrecisar: false, horariosDesde: null`.
- `mrpa/relatorio.tsx` e `glicemia/relatorio.tsx`: `formatarHorarios(m.horarios.map((h) => h.hora))`.
- `medicamentos.tsx`: `HorariosRemedio horarios={(editando.horarios ?? []).map((h) => h.hora)} onChange={(hs) => setEditando({ ...editando, horarios: mesclarQuantidades(hs, editando.horarios ?? []) })}`; `gravar` passa `unidade: editando?.unidade ?? 'comprimido', doseVariavel: editando?.doseVariavel ?? false, sePrecisar: horarios.length === 0`; `CardMed` usa `formatarHorarios(m.horarios.map((h) => h.hora))`. A interface nova é da Task 8.
- `useMedicacoes.salvar`: tipo `Omit<Medicacao, 'id' | 'horariosDesde'> & { id?: string }`.

- [ ] **Step 5: Rodar e ver passar**

Run: `npx jest src/core/medicacoes src/core/cardio src/core/relatorios && npx tsc --noEmit`
Expected: PASS; `tsc` sem erros.

- [ ] **Step 6: Commit**

```bash
git add src/core/medicacoes src/core/cardio src/core/relatorios/montar.ts src/core/relatorios/__tests__/fixtures.ts "app/(app)/coracao/mrpa/relatorio.tsx" "app/(app)/coracao/glicemia/relatorio.tsx" "app/(app)/(tabs)/minha-saude/medicamentos.tsx"
git commit -m "feat(remédios): quantidade e unidade por horário no modelo; tomadas no repositório

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Adesão — classificação de cada dose, resumo e semanas abaixo de 80 %

**Files:**
- Create: `src/core/medicacoes/adesao.ts`
- Test: `src/core/medicacoes/__tests__/adesao.test.ts`

**Interfaces:**
- Consumes: `Medicacao`, `Tomada`, `UnidadeDose` (Task 2); `semanaDe` de `@core/regras/bemestar/atividade`.
- Produces (contrato): `EstadoDose`, `DoseClassificada`, `ResumoAdesao`, `classificarDoses(m, tomadas, desde, ate, agora)`, `resumirAdesao(medicacoes, tomadas, desde, ate, agora)`.
- Produces (deste plano): `MS_TOLERANCIA_ATRASO = 2 * 3_600_000`; `podeMarcar(data: string, agora: Date): boolean`; `semanasAbaixoDe80(medicacoes: Medicacao[], tomadas: Tomada[], agora: Date): { semana: string; medicacaoId: string; nome: string; tomou: number; previstas: number; percentual: number }[]`.

- [ ] **Step 1: Testes que falham** (datas locais, sem `Z`; `m` = Losartana `08:00`/`20:00`, 1 comprimido, `horariosDesde: new Date(2026, 10, 16).toISOString()`, `desde: null`, `ate: null`; `agora = new Date('2026-11-23T09:00:00')`)

```ts
const t = (data, hora, extra = {}) => ({ id: `${data}${hora}${Math.random()}`, medicacaoId: 'm1', dataPrevista: data, horaPrevista: hora, quantidadePrevista: 1, tomou: true, quantidade: 1, marcadoEm: new Date(`${data}T${hora}:00`).toISOString(), ...extra });
const um = (ts, data = '2026-11-20', hora = '08:00', mm = m) => classificarDoses(mm, ts, data, data, agora).find((d) => d.hora === hora)!;

it('tomou a quantidade do cadastro → tomou', () => expect(um([t('2026-11-20', '08:00')]).estado).toBe('tomou'));
it('mais de 2 h depois → com atraso; 2 h em ponto → no horário', () => {
  expect(um([t('2026-11-20', '08:00', { marcadoEm: new Date('2026-11-20T10:01:00').toISOString() })]).comAtraso).toBe(true);
  expect(um([t('2026-11-20', '08:00', { marcadoEm: new Date('2026-11-20T10:00:00').toISOString() })]).comAtraso).toBe(false);
});
it('quantidade diferente → errado; com dose variável → tomou', () => {
  expect(um([t('2026-11-20', '08:00', { quantidade: 2 })]).estado).toBe('errado');
  expect(um([t('2026-11-20', '08:00', { quantidade: 2 })], '2026-11-20', '08:00', { ...m, doseVariavel: true }).estado).toBe('tomou');
});
it('duas tomadas na mesma dose → errado, mesmo com dose variável', () => {
  const duas = [t('2026-11-20', '08:00'), t('2026-11-20', '08:00')];
  expect(um(duas).estado).toBe('errado');
  expect(um(duas, '2026-11-20', '08:00', { ...m, doseVariavel: true }).estado).toBe('errado');
});
it('"Não tomei" → nao_tomou', () => expect(um([t('2026-11-20', '08:00', { tomou: false, quantidade: null })]).estado).toBe('nao_tomou'));
it('sem marca: até o fim do dia seguinte é pendente, depois sem registro', () => {
  expect(um([], '2026-11-21').estado).toBe('sem_registro');
  expect(um([], '2026-11-22').estado).toBe('pendente');
  expect(classificarDoses(m, [], '2026-11-22', '2026-11-22', new Date('2026-11-24T00:00:00'))[0].estado).toBe('sem_registro');
});
it('mudança de cadastro não reescreve o passado', () => {
  const mudou = { ...m, horarios: [{ hora: '08:00', quantidade: 2 }], horariosDesde: new Date('2026-11-20T12:00:00').toISOString() };
  const doses = classificarDoses(mudou, [t('2026-11-18', '20:00')], '2026-11-18', '2026-11-21', agora);
  // antes de horarios_desde só contam as tomadas, com a cópia do previsto; nada de "sem registro" calculado pelo cadastro novo
  expect(doses.map((d) => `${d.data} ${d.hora} ${d.estado}`)).toEqual(['2026-11-18 20:00 tomou', '2026-11-21 08:00 sem_registro']);
  expect(doses[1].quantidadePrevista).toBe(2);
});
it('fora de desde/ate do remédio não conta; "se precisar" não tem dose prevista', () => {
  expect(classificarDoses({ ...m, desde: '2026-11-21' }, [], '2026-11-20', '2026-11-21', agora).map((d) => d.data)).toEqual(['2026-11-21', '2026-11-21']);
  expect(classificarDoses({ ...m, sePrecisar: true, horarios: [] }, [], '2026-11-16', '2026-11-22', agora)).toEqual([]);
});
it('podeMarcar: hoje e ontem sim; anteontem e amanhã não', () => {
  expect(podeMarcar('2026-11-23', agora)).toBe(true); expect(podeMarcar('2026-11-22', agora)).toBe(true);
  expect(podeMarcar('2026-11-21', agora)).toBe(false); expect(podeMarcar('2026-11-24', agora)).toBe(false);
});
```
`resumirAdesao` (semana `2026-11-16`…`2026-11-22`, `agora = 2026-11-24T09:00`):
```ts
// Losartana: 14 previstas, 12 tomadas (uma com atraso), 1 "Não tomei", 1 sem marca
expect(r.losartana).toMatchObject({ previstas: 14, tomou: 12, naoTomou: 1, errado: 0, semRegistro: 1, comAtraso: 1, percentual: 86, sePrecisar: false });
// Metformina 08:00 todos os dias: 7 de 7
expect(r.metformina).toMatchObject({ previstas: 7, tomou: 7, percentual: 100 });
// Dipirona "se precisar": 3 tomadas sem data prevista, marcadas na semana
expect(r.dipirona).toMatchObject({ sePrecisar: true, previstas: 0, usosSePrecisar: 3, percentual: null });
// pendentes não entram em previstas (agora = 2026-11-22T21:00: as doses de 22/11 ainda estão no prazo)
// remédio sem dose nem uso no período não aparece no resumo
```
`semanasAbaixoDe80` (`agora = 2026-11-25T09:00`, uma tomada qualquer em 09/11):
```ts
// semana de 09/11 com 10 de 14 → entra (71 %); semana de 16/11 com 12 de 14 → não entra (86 %); semana atual (23/11) nunca entra
expect(semanasAbaixoDe80([m], tomadas, agora)).toEqual([{ semana: '2026-11-09', medicacaoId: 'm1', nome: 'Losartana', tomou: 10, previstas: 14, percentual: 71 }]);
// sem nenhuma tomada registrada → []
expect(semanasAbaixoDe80([m], [], agora)).toEqual([]);
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/medicacoes/__tests__/adesao.test.ts`
Expected: FAIL ("Cannot find module '../adesao'").

- [ ] **Step 3: Implementar `adesao.ts`**

Algoritmo de `classificarDoses` (o que a assinatura não determina):
```
se m.sePrecisar → []
janela = [max(desde, m.desde), min(ate, m.ate)]
inicioCadastro = m.horariosDesde ? new Date(m.horariosDesde) : início local de desde
slots = para cada dia da janela × m.horarios: instante = dia+hora local; entra se instante >= inicioCadastro
      ∪ (data, hora) de cada tomada de m com dataPrevista na janela (mesmo se a hora não está mais no cadastro)
para cada slot (ordenado por data, hora):
  doSlot = tomadas de m com mesma dataPrevista e horaPrevista
  quantidadePrevista = doSlot[0]?.quantidadePrevista ?? quantidade do cadastro
  sim = doSlot.filter(tomou)
  estado = sim.length >= 2 ? 'errado'
         : sim.length === 1 ? (!m.doseVariavel && sim[0].quantidade !== quantidadePrevista ? 'errado' : 'tomou')
         : doSlot.length ? 'nao_tomou'
         : agora < 00:00 de (data + 2 dias) ? 'pendente' : 'sem_registro'
  comAtraso = sim.length > 0 && Date.parse(sim[0].marcadoEm) - instante > MS_TOLERANCIA_ATRASO
```
`resumirAdesao`: um item por remédio que tenha dose no período ou uso "se precisar"; `previstas = tomou + naoTomou + errado + semRegistro` (pendentes fora); `percentual = Math.round(tomou / previstas * 100)` ou `null` (se precisar, ou `previstas === 0`); `usosSePrecisar` = tomadas `tomou` com `dataPrevista === null` do remédio (já vêm filtradas pelo período de `listarTomadas`); `doses` = saída de `classificarDoses`. `semanasAbaixoDe80`: semanas (segunda a domingo, `semanaDe`) da semana da tomada mais antiga até a última semana completa antes da de `agora`; `resumirAdesao` por semana; entra quem tem `percentual !== null && percentual < 80`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/core/medicacoes/__tests__/adesao.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/medicacoes/adesao.ts src/core/medicacoes/__tests__/adesao.test.ts
git commit -m "feat(remédios): classificação de cada dose e resumo de adesão

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Lembrete principal — texto novo, rota da tela "Tomou?" e data da dose no toque

**Files:**
- Modify: `src/core/lembretes/textos.ts` (`textoRemedio`), `src/core/medicacoes/horarios.ts` (+ `rotaTomar`), `src/core/cardio/lembretesCardio.ts` (`agendarDiario`, `agendarLembretesMedicacao`), `src/core/lembretes/useToqueNotificacao.ts`, `src/core/lembretes/rotina.ts` (`nomeDo`)
- Modify: `docs/nero/notificacoes.md` (linha "Medicamento" da tabela "Decididas" e destino do remédio em "Toque na notificação")
- Test: `src/core/lembretes/__tests__/textos.test.ts`, `src/core/cardio/__tests__/lembretesMedicacao.test.ts`, `src/core/lembretes/__tests__/useToqueNotificacao.test.tsx`, `src/core/lembretes/__tests__/rotina.test.ts`

**Interfaces:**
- Consumes: `formatarQuantidade` (Task 2), `horaCurta` (Task 2).
- Produces: `textoRemedio(nome: string, dose: string | null, quantidade: string | null): TextoNotificacao`; `agendarDiario(…, temPermissao: boolean, rota?: string)` (rota explícita ganha de `origemDe`); `rotaTomar(medicacaoId: string, hora?: string, data?: string): string` em `src/core/medicacoes/horarios.ts` → `/(app)/remedios/tomar?med=<id>&hora=<HH:MM>[&data=<AAAA-MM-DD>]` (sem `hora`, só `?med=`); `rotaComData(rota: string, entregueEm: number): string` exportada de `useToqueNotificacao.ts`.

- [ ] **Step 1: Testes que falham**

`textos.test.ts` (substitui o bloco "remédio"):
```ts
expect(textoRemedio('Losartana', '50 mg', '1 comprimido')).toEqual({ titulo: 'Hora do remédio: Losartana 50 mg · 1 comprimido', emoji: '💊', corpo: 'Toque aqui para marcar' });
expect(textoRemedio('Losartana', '  ', '2 comprimidos').titulo).toBe('Hora do remédio: Losartana · 2 comprimidos');
expect(textoRemedio('Insulina', null, null).titulo).toBe('Hora do remédio: Insulina'); // dose muda conforme o dia
```
`lembretesMedicacao.test.ts` (no primeiro teste):
```ts
expect(mockAgendadas[0].title).toBe('Hora do remédio: Losartana · 1 comprimido 💊');
expect(mockAgendadas[0].body).toBe('Toque aqui para marcar');
expect(mockAgendadas[0].rota).toBe('/(app)/remedios/tomar?med=m1&hora=08:00');
expect(mockAgendadas[1].rota).toBe('/(app)/remedios/tomar?med=m1&hora=20:00');
expect(mockLinhas[0].mensagem).toMatch(/^Hora do remédio: Losartana · 1 comprimido · Toque aqui para marcar notif:/);
```
e um novo: `doseVariavel: true` → `title` `'Hora do remédio: X 💊'`.

`useToqueNotificacao.test.tsx`: `toque` ganha `date` (`notification: { date, request: … }`), e:
```ts
it('lembrete de remédio: a data da dose é a da entrega, não a do toque', async () => {
  mockResposta = toque('/(app)/remedios/tomar?med=m1&hora=20:00', 'n9', undefined, new Date('2026-11-23T20:00:03').getTime());
  await act(async () => { create(<Sonda />); });
  expect(mockPush).toHaveBeenCalledWith('/(app)/remedios/tomar?med=m1&hora=20:00&data=2026-11-23');
});
it('rota que já traz a data (segundo lembrete) não muda', () => {
  expect(rotaComData('/(app)/remedios/tomar?med=m1&hora=23:45&data=2026-11-23', new Date('2026-11-24T00:15:00').getTime()))
    .toBe('/(app)/remedios/tomar?med=m1&hora=23:45&data=2026-11-23');
});
it('outras rotas não ganham data', () => expect(rotaComData('/(app)/bem-estar/agua', Date.now())).toBe('/(app)/bem-estar/agua'));
```
`rotina.test.ts`: trocar os textos de remédio para `'Hora do remédio: Losartana 50 mg · 1 comprimido · Toque aqui para marcar'` e manter `nome: 'Losartana 50 mg'`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/lembretes src/core/cardio/__tests__/lembretesMedicacao.test.ts`
Expected: FAIL nas asserções novas de título, rota, data e nome da rotina.

- [ ] **Step 3: Implementar**

- `textoRemedio` conforme os testes (comentário: texto decidido na spec de 23/11, D-066).
- `agendarLembretesMedicacao`: por horário, `textoRemedio(m.nome, m.dose, m.doseVariavel ? null : formatarQuantidade(h.quantidade, m.unidade))` e `rota = rotaTomar(m.id, h.hora)`; a chave continua `medicacao:<id>:<HH:MM>` (a Agenda e o cancelamento não mudam; `origemDe` continua mandando a Agenda para Meus medicamentos).
- `useToqueNotificacao`: `router.push(rotaComData(rota, resposta.notification.date))`. `rotaComData` só acrescenta `&data=` (dia local de `entregueEm`) quando a rota começa com `/(app)/remedios/tomar` e não tem `data=`.
- `rotina.nomeDo` para remédio: primeiro trecho antes de ` · `, sem o prefixo `Hora do remédio: `.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/core/lembretes src/core/cardio && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: `docs/nero/notificacoes.md`**

Linha "Medicamento": título `Hora do remédio: <nome> <dose> · <quantidade> 💊`, texto `Toque aqui para marcar`, decidido `23/11`; linha nova "Medicamento, 30 min depois, só se a dose não foi marcada" com `Você tomou <nome> das <8h>? 💊` / `Toque aqui para marcar` / `23/11`; em "Toque na notificação", destino do remédio → `tela "Tomou?"`.

- [ ] **Step 6: Commit**

```bash
git add src/core/lembretes src/core/cardio src/core/medicacoes/horarios.ts docs/nero/notificacoes.md
git commit -m "feat(remédios): lembrete abre a tela de marcar, com a quantidade no título

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Segundo lembrete — janela de hoje + amanhã com teto

**Files:**
- Create: `src/core/medicacoes/segundoLembrete.ts`
- Modify: `src/core/lembretes/textos.ts` (+ `textoSegundoLembrete`), `src/core/cardio/lembretesCardio.ts`, `src/core/lembretes/preferencias.ts` (`silenciarTipo`), `src/core/medicacoes/useMedicacoes.ts` (`salvar`, `alternarAtiva`)
- Test: `src/core/medicacoes/__tests__/segundoLembrete.test.ts`, `src/core/cardio/__tests__/lembretesMedicacao.test.ts`, `src/core/lembretes/__tests__/textos.test.ts`

**Interfaces:**
- Consumes: `listarTomadas` (Task 2), `rotaTomar`, `horaCurta` (Tasks 2/4), `notificacoesPermitidas`.
- Produces (`segundoLembrete.ts`): `MIN_SEGUNDO_LEMBRETE = 30`; `TETO_SEGUNDOS_LEMBRETES = 40`; `LIMITE_AVISOS_IOS = 64`; `PREFIXO_SEGUNDO = 'medicacao2:'`; `idSegundoLembrete(medicacaoId: string, data: string, hora: string): string` (= `medicacao2:<med>:<data>:<hora>`); `vagasSegundos(outrosAgendados: number): number` (= `max(0, min(40, 64 − outros − 4))`); `interface SegundoLembrete { identificador: string; medicacaoId: string; data: string; hora: string; quando: Date; texto: TextoNotificacao; rota: string }`; `planejarSegundosLembretes(medicacoes: Medicacao[], tomadas: Tomada[], agora: Date, vagas: number): SegundoLembrete[]`.
- Produces (`textos.ts`): `textoSegundoLembrete(nome: string, hora: string): TextoNotificacao`.
- Produces (`lembretesCardio.ts`): `sincronizarSegundosLembretes(userId: string, medicacoes: Medicacao[], agora?: Date): Promise<void>`; `cancelarSegundoLembrete(medicacaoId: string, data: string, hora: string): Promise<void>`; `cancelarTodosSegundosLembretes(): Promise<void>`. `sincronizarLembretesMedicacao(userId, ativasComLembrete: Medicacao[])` passa a chamar `sincronizarSegundosLembretes` no fim.

- [ ] **Step 1: Testes que falham**

`textos.test.ts`:
```ts
expect(textoSegundoLembrete('Losartana', '08:00')).toEqual({ titulo: 'Você tomou Losartana das 8h?', emoji: '💊', corpo: 'Toque aqui para marcar' });
```
`segundoLembrete.test.ts` (`med(id)` = ativa, `lembrar: true`, horários `08:00` e `20:00`; `agora = new Date('2026-11-23T07:00:00')`):
```ts
it('3 remédios × 2 horários: 12 avulsos, hoje e amanhã, 30 min depois', () => {
  const p = planejarSegundosLembretes([med('a'), med('b'), med('c')], [], agora, 40);
  expect(p).toHaveLength(12);
  expect(p[0]).toMatchObject({ identificador: 'medicacao2:a:2026-11-23:08:00', data: '2026-11-23', hora: '08:00', rota: '/(app)/remedios/tomar?med=a&hora=08:00&data=2026-11-23' });
  expect(p[0].quando).toEqual(new Date('2026-11-23T08:30:00'));
  expect(p[0].texto.titulo).toBe('Você tomou Losartana das 8h?'); // fixture: nome 'Losartana' em todos
});
it('o que já passou não é agendado', () => expect(planejarSegundosLembretes([med('a')], [], new Date('2026-11-23T09:00:00'), 40)).toHaveLength(3));
it('dose já marcada (tomei ou não tomei) não tem segundo lembrete', () => {
  const marcada = { id: 't', medicacaoId: 'a', dataPrevista: '2026-11-23', horaPrevista: '20:00', quantidadePrevista: 1, tomou: false, quantidade: null, marcadoEm: '' };
  expect(planejarSegundosLembretes([med('a')], [marcada], agora, 40).map((s) => s.identificador)).not.toContain('medicacao2:a:2026-11-23:20:00');
});
it('sem lembrete, "se precisar" ou interrompido: nada', () => {
  expect(planejarSegundosLembretes([{ ...med('a'), lembrar: false }, { ...med('b'), sePrecisar: true, horarios: [] }, { ...med('c'), ativa: false }], [], agora, 40)).toEqual([]);
});
it('respeita desde e ate do remédio', () => {
  expect(planejarSegundosLembretes([{ ...med('a'), ate: '2026-11-23' }], [], agora, 40).every((s) => s.data === '2026-11-23')).toBe(true);
  expect(planejarSegundosLembretes([{ ...med('a'), desde: '2026-11-24' }], [], agora, 40).every((s) => s.data === '2026-11-24')).toBe(true);
});
it('passou do teto: a janela encolhe para só hoje', () => {
  const onze = 'abcdefghijk'.split('').map(med); // 11 × 2 × 2 = 44 > 40
  const p = planejarSegundosLembretes(onze, [], agora, 40);
  expect(p).toHaveLength(22); expect(p.every((s) => s.data === '2026-11-23')).toBe(true);
});
it('com poucas vagas, fica com os mais próximos', () => {
  const p = planejarSegundosLembretes('abcdefghijk'.split('').map(med), [], agora, 10);
  expect(p).toHaveLength(10); expect(p.every((s) => s.hora === '08:00')).toBe(true);
});
it('dose das 23:45: toca 00:15 do dia seguinte, mas é a dose do dia anterior', () => {
  const p = planejarSegundosLembretes([{ ...med('a'), horarios: [{ hora: '23:45', quantidade: 1 }] }], [], agora, 40);
  expect(p[0]).toMatchObject({ data: '2026-11-23', identificador: 'medicacao2:a:2026-11-23:23:45' });
  expect(p[0].quando).toEqual(new Date('2026-11-24T00:15:00'));
});
it('vagas: 40 no máximo, e nunca passa de 64 somando os outros avisos', () => {
  expect(vagasSegundos(10)).toBe(40); expect(vagasSegundos(30)).toBe(30); expect(vagasSegundos(70)).toBe(0);
});
```
`lembretesMedicacao.test.ts` (o mock de `expo-notifications` ganha `getAllScheduledNotificationsAsync` devolvendo `mockJaAgendadas` e `scheduleNotificationAsync` guarda `identifier`; mock de `@core/medicacoes/repositorio` com `listarTomadas: async () => mockTomadas`):
```ts
it('sincronizar troca os segundos lembretes antigos pelos da janela nova', async () => {
  mockJaAgendadas = [{ identifier: 'medicacao2:m1:2026-09-23:08:00' }, { identifier: 'diario-1' }];
  await sincronizarSegundosLembretes('u1', [losartana], AGORA); // AGORA = 2026-09-24T09:00
  expect(mockCanceladas).toEqual(['medicacao2:m1:2026-09-23:08:00']);
  expect(mockAgendadas.filter((a) => a.identifier?.startsWith('medicacao2:')).map((a) => a.identifier))
    .toEqual(['medicacao2:m1:2026-09-24:20:00', 'medicacao2:m1:2026-09-25:08:00', 'medicacao2:m1:2026-09-25:20:00']);
});
it('preferência "Medicamentos" desligada ou sem permissão: cancela e não agenda', async () => {
  mockPermissao = false; mockJaAgendadas = [{ identifier: 'medicacao2:m1:2026-09-24:20:00' }];
  await sincronizarSegundosLembretes('u1', [losartana], AGORA);
  expect(mockCanceladas).toEqual(['medicacao2:m1:2026-09-24:20:00']); expect(mockAgendadas).toHaveLength(0);
});
it('marcar a dose cancela o segundo lembrete dela', async () => {
  await cancelarSegundoLembrete('m1', '2026-09-24', '20:00');
  expect(mockCanceladas).toEqual(['medicacao2:m1:2026-09-24:20:00']);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/medicacoes/__tests__/segundoLembrete.test.ts src/core/cardio/__tests__/lembretesMedicacao.test.ts src/core/lembretes/__tests__/textos.test.ts`
Expected: FAIL (módulo e funções não existem).

- [ ] **Step 3: Implementar**

- `planejarSegundosLembretes`: candidatos = remédios `ativa && lembrar && !sePrecisar`, dias hoje e amanhã dentro de `desde`/`ate`, cada horário; `quando = dia+hora + 30 min`; fora se `quando <= agora` ou se há tomada com a mesma `dataPrevista`/`horaPrevista`. Ordena por `quando`. Se `candidatos.length > vagas`, fica só com os de hoje; se ainda passar, corta nos `vagas` primeiros.
- `sincronizarSegundosLembretes`: lê `getAllScheduledNotificationsAsync()`; cancela os de `PREFIXO_SEGUNDO`; se `!(await notificacoesPermitidas(userId, 'medicacao'))` para aqui; `tomadas = listarTomadas(userId, hoje, amanhã)`; agenda cada um com `scheduleNotificationAsync({ identifier, content: { title: tituloCompleto(texto), body: texto.corpo, data: { rota } }, trigger: { type: DATE, date: quando, channelId: CANAL_LEMBRETES } })`, recusa do sistema só gera `console.warn` (como `pedirAoSistema`). Falha de rede em `listarTomadas` → não agenda nada (melhor sem segundo lembrete do que um para dose já marcada).
- `preferencias.ts` `silenciarTipo`: quando `tipo === 'medicacao'`, chamar também `cancelarTodosSegundosLembretes()`. `reagendarTipo('medicacao')` já passa por `sincronizarLembretesMedicacao`.
- `useMedicacoes.salvar` e `alternarAtiva`: depois de `ajustarLembretes`, `sincronizarSegundosLembretes(userId, lista).catch(() => {})` (a janela é de todos os remédios, por causa do teto). A abertura do app já chama `sincronizarLembretesMedicacao` na Home — nada a mudar lá.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/core/medicacoes src/core/cardio src/core/lembretes && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/medicacoes src/core/cardio src/core/lembretes
git commit -m "feat(remédios): segundo lembrete 30 min depois, na janela de hoje e amanhã

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tela "Tomou?" e doses de hoje

**Files:**
- Create: `app/(app)/remedios/tomar.tsx`, `src/core/medicacoes/useDosesHoje.ts`, `src/modules/remedios/SeletorQuantidade.tsx`, `src/modules/remedios/rotulos.ts`
- Test: `src/modules/remedios/__tests__/rotulos.test.ts`, `src/modules/remedios/__tests__/seletorQuantidade.test.tsx`, `src/modules/remedios/__tests__/telaTomar.test.tsx`

**Interfaces:**
- Consumes: `listarMedicacoes`, `listarTomadas`, `registrarTomada`, `substituirTomadas` (Task 2); `classificarDoses`, `podeMarcar` (Task 3); `cancelarSegundoLembrete` (Task 5); `UNIDADES`, `formatarQuantidade`, `numeroBr`, `horaCurta`.
- Produces: `useDosesHoje(): { doses: DoseClassificada[]; carregando: boolean; recarregar: () => Promise<void> }` — **todas** as doses de hoje dos remédios ativos com horário (com ou sem lembrete), ordenadas por hora; quem quer só as que já chegaram filtra (`montarItensHoje` filtra). `SeletorQuantidade({ valor, unidade, onChange }: { valor: number; unidade: UnidadeDose; onChange: (q: number) => void })`. `rotuloEstadoDose(d: DoseClassificada): string`.

- [ ] **Step 1: Testes que falham**

`rotulos.test.ts`:
```ts
expect(rotuloEstadoDose({ ...d, estado: 'tomou', comAtraso: false })).toBe('✓ Tomou');
expect(rotuloEstadoDose({ ...d, estado: 'tomou', comAtraso: true })).toBe('✓ Tomou, com atraso');
expect(rotuloEstadoDose({ ...d, estado: 'nao_tomou' })).toBe('✗ Não tomou');
expect(rotuloEstadoDose({ ...d, estado: 'errado' })).toBe('⚠ Dose diferente');
expect(rotuloEstadoDose({ ...d, estado: 'sem_registro' })).toBe('— Sem registro');
expect(rotuloEstadoDose({ ...d, estado: 'pendente' })).toBe('Marcar');
```
`seletorQuantidade.test.tsx`: comprimido em 1 → "−" dá 0,5, "−" de novo continua 0,5 (não vai a zero); gota em 1 → "−" continua 1, "+" dá 2; botões com `accessibilityLabel` `Diminuir` / `Aumentar`; o número mostrado é `numeroBr(valor)`.

`telaTomar.test.tsx` (molde dos testes de tela da Home: mocks de `expo-router` com `useLocalSearchParams` → `{ med: 'm1', hora: '08:00', data: '2026-11-23' }`, `useRouter` → `{ back }`; de `@core/medicacoes/repositorio`; de `@core/cardio/lembretesCardio`; de `@core/sessao/SessaoProvider`; relógio em `2026-11-23T08:20:00`):
```ts
it('mostra remédio, horário e quantidade prevista', …) // textos 'Losartana 50 mg', 'Dose das 8h · 1 comprimido', 'Quantos comprimidos?'
it('"✓ Tomei" grava com a quantidade mostrada, cancela o segundo lembrete e mostra "Marcado ✓"', async () => {
  // aumentar para 2 antes de tocar
  expect(mockRegistrar).toHaveBeenCalledWith('u1', { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: true, quantidade: 2 });
  expect(mockCancelarSegundo).toHaveBeenCalledWith('m1', '2026-11-23', '08:00');
  // texto 'Marcado ✓' visível; depois do tempo, router.back()
});
it('"Não tomei" grava tomou=false sem quantidade', …) // quantidade: null
it('toque duplo em "✓ Tomei" grava uma vez só', …) // dois onPress seguidos antes de resolver → mockRegistrar chamado 1 vez
it('sem internet: avisa e não volta', …) // mockRegistrar rejeita → Alert.alert('Não foi possível marcar', …); 'Marcado ✓' ausente; back não chamado
it('dose já marcada: avisa a hora e oferece Corrigir e Tomei de novo', …)
  // listarTomadas devolve tomada marcada às 08:10 → texto 'Você já marcou essa dose às 8h10'
  // 'Tomei de novo' → mockRegistrar com tomou: true (segunda tomada)
  // 'Corrigir' → volta aos botões '✓ Tomei'/'Não tomei'; 'Não tomei' → mockSubstituir('u1', { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00' }, { …, tomou: false, quantidade: null })
it('fora do prazo: só a explicação, sem botões', …) // data '2026-11-21' → 'Essa dose já passou do prazo para marcar.'; nenhum '✓ Tomei'
it('remédio que não está mais na lista', …) // listarMedicacoes sem m1 → 'Esse remédio não está mais na sua lista.'
it('"se precisar": sem horário, grava sem data prevista', …) // params { med: 'm3' } → subtítulo 'Se precisar'; Tomei → { dataPrevista: null, horaPrevista: null, quantidadePrevista: null, tomou: true, quantidade: 1 }
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/remedios`
Expected: FAIL (módulos não existem).

- [ ] **Step 3: Implementar `rotulos.ts`, `SeletorQuantidade.tsx`, `useDosesHoje.ts` e `tomar.tsx`**

- `SeletorQuantidade`: `[−] n [+]` grandes (alvo de toque ≥ 48), passo e mínimo = `UNIDADES[unidade].passo`.
- `useDosesHoje`: `listarMedicacoes` + `listarTomadas(userId, hoje, hoje)`; `classificarDoses` de cada ativa com `desde = ate = hoje`, `agora = new Date()`; mesma forma de `useMedicacoes` (estado + `recarregar`).
- `tomar.tsx` (`useLocalSearchParams<{ med: string; hora?: string; data?: string }>()`; `data` ausente = hoje; `hora` ausente = "se precisar"): cabeçalho `InternalHeader` com `sectionLabel="Remédios"` e título = nome + dose; subtítulo `Dose das ${horaCurta(hora)} · ${formatarQuantidade(prevista, unidade)}` (só `Dose das 8h` com dose variável; `Se precisar` sem hora); `UNIDADES[u].pergunta` + `SeletorQuantidade` pré-preenchido com o previsto (1 no "se precisar"); `Button` `✓ Tomei` (principal, largo) e `Button variant="outline"` `Não tomei`. Estado `salvando` trava os dois botões até a gravação terminar. Se há tomadas da dose: `Você já marcou essa dose às ${horaCurta(hh:mm de marcadoEm da última)}` + `Corrigir` (mostra de novo Tomei/Não tomei, que então usam `substituirTomadas`) + `Tomei de novo` (`registrarTomada`, `tomou: true`). `!podeMarcar(data, agora)` → `Essa dose já passou do prazo para marcar.` sem botões. Depois de gravar: `cancelarSegundoLembrete(med, data, hora).catch(() => {})` (só com hora), mostra `Marcado ✓` e `router.back()` após `MS_SAIDA_CONCLUIDA`. Erro: `Alert.alert('Não foi possível marcar', traduzirErro(e).mensagemUsuario)`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/remedios && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/remedios/tomar.tsx" src/core/medicacoes/useDosesHoje.ts src/modules/remedios
git commit -m "feat(remédios): tela Tomou? — tomei, não tomei, corrigir e tomei de novo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Onde marcar sem notificação — "Tomei remédio", ＋ Anotar e "Para fazer hoje"

**Files:**
- Create: `app/(app)/remedios/hoje.tsx`
- Modify: `src/modules/anotar/itensAnotar.ts` (do plano 1), `src/modules/home/montarItensHoje.ts`, `app/(app)/(tabs)/index.tsx` (só a entrada de `montarItensHoje` e a recarga)
- Test: `src/modules/home/__tests__/montarItensHoje.test.ts`, o teste de `itensAnotar` do plano 1 (se não houver, criar `src/modules/anotar/__tests__/itensAnotar.test.ts`)

**Interfaces:**
- Consumes: `useDosesHoje`, `rotuloEstadoDose`, `rotaTomar`, `horaCurta`, `EstadoDose`; `ITENS_ANOTAR`/`ItemAnotar` (plano 1).
- Produces: `montarItensHoje` aceita `dosesHoje?: { medicacaoId: string; nome: string; data: string; hora: string; estado: EstadoDose }[]`.

- [ ] **Step 1: Testes que falham**

`montarItensHoje.test.ts` (`agora = new Date('2026-11-23T09:00:00')`):
```ts
const doses = [
  { medicacaoId: 'm1', nome: 'Losartana', data: '2026-11-23', hora: '08:00', estado: 'pendente' },
  { medicacaoId: 'm1', nome: 'Losartana', data: '2026-11-23', hora: '20:00', estado: 'pendente' }, // ainda não chegou
  { medicacaoId: 'm2', nome: 'Metformina', data: '2026-11-23', hora: '08:00', estado: 'tomou' },   // já marcada
] as const;
const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 2, dosesHoje: [...doses], agora });
expect(itens.filter((i) => i.id.startsWith('dose_'))).toEqual([
  { id: 'dose_m1_08:00', nivel: 'amarelo', titulo: 'Losartana · 8h', descricao: 'Toque para marcar se tomou.', rota: '/(app)/remedios/tomar?med=m1&hora=08:00&data=2026-11-23' },
]);
expect(itens.map((i) => i.id)).not.toContain('tudo_em_dia');
```
Teste do Anotar (no arquivo de teste de `itensAnotar` do plano 1: **apagar** o teste "ITENS_ANOTAR não tem Tomei remédio" e pôr este no lugar):
```ts
expect(ITENS_ANOTAR[2]).toEqual({ chave: 'remedio', icone: 'medkit-outline', rotulo: 'Tomei remédio', rota: '/(app)/remedios/hoje' });
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/home/__tests__/montarItensHoje.test.ts src/modules/anotar`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `montarItensHoje`: para cada dose `estado === 'pendente'` com `hora <= horaDe(agora)`, o item do teste (o horário que já chegou; doses de ontem não entram aqui).
- `itensAnotar.ts`: inserir o item como **terceiro** de `ITENS_ANOTAR`.
- `index.tsx`: `const dosesHoje = useDosesHoje();`; na chamada de `montarItensHoje`, `dosesHoje: dosesHoje.doses.map((d) => ({ ...d, nome: ativas.find((m) => m.id === d.medicacaoId)?.nome ?? 'Remédio' }))`; `dosesHoje.recarregar()` dentro de `atualizar` (a volta à Home já chama `atualizar`, então a dose marcada sai da lista com a saída verde existente). Não entra no `pronto` (não segura o esqueleto).
- `hoje.tsx`: título `Tomei remédio`; seção `Doses de hoje` — uma linha por dose (`<nome> · <8h>` + `rotuloEstadoDose`) que abre `rotaTomar(med, hora, data)`; seção `Se precisar` — uma linha por remédio ativo `sePrecisar` com o botão `Tomei agora` → `rotaTomar(med)`; recarrega em `useFocusEffect`. Sem remédio nenhum: `Nenhum remédio cadastrado.` + botão `Cadastrar remédio` → `/(app)/(tabs)/minha-saude/medicamentos`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/home src/modules/anotar && npx tsc --noEmit`
Expected: PASS (os testes de tela da Home continuam verdes; se algum mock de `@core/medicacoes/*` faltar, acrescentar `jest.mock('@core/medicacoes/useDosesHoje', () => ({ useDosesHoje: () => ({ doses: [], carregando: false, recarregar: async () => {} }) }))`).

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/remedios/hoje.tsx" src/modules/anotar src/modules/home "app/(app)/(tabs)/index.tsx"
git commit -m "feat(remédios): marcar pela tela inicial, pelo Anotar e pela lista de hoje

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Cadastro em "Meus medicamentos"

**Files:**
- Create: `src/modules/minha-saude/DosesPorHorario.tsx`
- Modify: `app/(app)/(tabs)/minha-saude/medicamentos.tsx`, `src/modules/remedios/rotulos.ts`
- Test: `src/modules/minha-saude/__tests__/dosesPorHorario.test.tsx`, `src/modules/remedios/__tests__/rotulos.test.ts`

**Interfaces:**
- Consumes: `SeletorQuantidade`, `UNIDADES`, `mesclarQuantidades`, `useDosesHoje`, `rotuloEstadoDose`, `horaCurta`.
- Produces: `DosesPorHorario({ horarios, unidade, onChange }: { horarios: HorarioDose[]; unidade: UnidadeDose; onChange: (h: HorarioDose[]) => void })`; `FRASE_MARCAR = 'Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento.'` e `deveExplicarMarcacao(antes: Medicacao[], salvoTemHorario: boolean): boolean` em `rotulos.ts`.

- [ ] **Step 1: Testes que falham**

`rotulos.test.ts`:
```ts
expect(deveExplicarMarcacao([], true)).toBe(true);                              // primeiro remédio com horário
expect(deveExplicarMarcacao([comHorario], true)).toBe(false);                   // já havia um com horário (mesmo interrompido)
expect(deveExplicarMarcacao([sePrecisarSemHorario], true)).toBe(true);
expect(deveExplicarMarcacao([], false)).toBe(false);                            // "se precisar" não explica
```
`dosesPorHorario.test.tsx`: uma linha por horário com `horaCurta` (`8h`, `20h`) e um `SeletorQuantidade`; aumentar a de 20h → `onChange([{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 2 }])`; com `unidade="comprimido"`, diminuir a de 8h → `0.5`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/minha-saude src/modules/remedios/__tests__/rotulos.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `DosesPorHorario`, `deveExplicarMarcacao` e a tela**

Em `medicamentos.tsx`:
- `InternalHeader` com `title="Meus remédios"`.
- Logo abaixo do `InternalHeader`, a `FRASE_MARCAR` fixa em `Typography.caption` (antes do texto de ajuda atual).
- Formulário, nesta ordem: nome; dose; switch `Tomo só quando preciso` (sub: `Sem horário fixo e sem lembrete.`); se **não** for "se precisar": `HorariosRemedio` (como na Task 2), `Opcoes` com as cinco unidades (`UNIDADES[u].rotulo`), `DosesPorHorario`, switch `A dose muda conforme o dia` (sub: `Ex.: insulina de correção. Você anota a quantidade ao tomar.`), switch `Lembrar nos horários` (já existe). Trocar a unidade **não** mexe nas quantidades.
- `gravar`: `sePrecisar = editando.sePrecisar || horarios.length === 0`; "se precisar" grava `horarios: []` e `lembrar: false`. Antes de salvar, guarda `deveExplicarMarcacao(medicacoes, !sePrecisar)`; se verdadeiro, depois de salvar, `Alert.alert('Marque cada dose', FRASE_MARCAR)`.
- `CardMed`: subtítulo `Se precisar` para "se precisar"; senão os horários como hoje. Abaixo, as doses de hoje desse remédio (de `useDosesHoje`, recarregado ao salvar e no foco): `8h · ✓ Tomou`, cada uma tocável → `rotaTomar(m.id, d.hora, d.data)`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/minha-saude src/modules/remedios && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/modules/minha-saude src/modules/remedios "app/(app)/(tabs)/minha-saude/medicamentos.tsx"
git commit -m "feat(remédios): quanto tomar por horário, unidade, dose variável e se precisar no cadastro

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Resumo da semana no check-in e semanas fracas na linha do tempo

**Files:**
- Create: `src/core/medicacoes/useAdesao.ts`, `src/modules/remedios/QuadroAdesao.tsx`
- Modify: `src/modules/remedios/rotulos.ts`, `app/(app)/bem-estar/checkin/index.tsx`, `src/core/linhaDoTempo/geral.ts`
- Test: `src/modules/remedios/__tests__/rotulos.test.ts`, `src/modules/remedios/__tests__/quadroAdesao.test.tsx`

**Interfaces:**
- Consumes: `resumirAdesao`, `semanasAbaixoDe80` (Task 3), `listarMedicacoes`, `listarTomadas` (Task 2).
- Produces: `useAdesao(desde: string, ate: string): { resumos: ResumoAdesao[]; carregando: boolean }`; `textoResumoAdesao(r: ResumoAdesao): string`; `simboloDose(estado: EstadoDose): '●' | '○' | '–' | '⚠' | null`; `QuadroAdesao({ resumos }: { resumos: ResumoAdesao[] })`.

- [ ] **Step 1: Testes que falham**

`rotulos.test.ts`:
```ts
expect(textoResumoAdesao({ ...r, previstas: 14, tomou: 12, naoTomou: 1, semRegistro: 1, errado: 0, comAtraso: 0 })).toBe('12 de 14 · 1 não tomada · 1 sem registro');
expect(textoResumoAdesao({ ...r, previstas: 7, tomou: 7, naoTomou: 0, semRegistro: 0, errado: 0, comAtraso: 0 })).toBe('7 de 7 ✓');
expect(textoResumoAdesao({ ...r, previstas: 14, tomou: 11, naoTomou: 2, semRegistro: 0, errado: 1, comAtraso: 2 })).toBe('11 de 14 · 2 não tomadas · 1 errada · 2 com atraso');
expect(textoResumoAdesao({ ...r, sePrecisar: true, usosSePrecisar: 3 })).toBe('usou 3 vezes');
expect(textoResumoAdesao({ ...r, sePrecisar: true, usosSePrecisar: 1 })).toBe('usou 1 vez');
expect(['tomou', 'nao_tomou', 'sem_registro', 'errado', 'pendente'].map(simboloDose)).toEqual(['●', '○', '–', '⚠', null]);
```
`quadroAdesao.test.tsx`: com Losartana (12/14) e Dipirona (se precisar, 3): título `Seus remédios nesta semana`; linhas `Losartana 50 mg` e `Dipirona (se precisar)`; textos do resumo como acima; lista vazia → não renderiza nada (`toJSON()` nulo).

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/remedios`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- `textoResumoAdesao`: `"<tomou> de <previstas>"` + ` ✓` quando `tomou === previstas`; senão acrescenta, nesta ordem e só se > 0, `N não tomada(s)`, `N errada(s)`, `N sem registro`, `N com atraso`, separados por ` · `. "Se precisar": `usou N vez(es)`.
- `QuadroAdesao`: `Card` só de leitura; por remédio, nome (+ dose, ou ` (se precisar)`), a fileira de símbolos das doses (`simboloDose`, pendentes de fora) e `textoResumoAdesao`. Rótulo de acessibilidade da linha = nome + texto do resumo (os símbolos não são lidos).
- `useAdesao`: `listarMedicacoes` + `listarTomadas(userId, desde, ate)` → `resumirAdesao(…, new Date())`.
- `checkin/index.tsx`: `const { resumos } = useAdesao(semanaAlvo, somarDias(semanaAlvo, 6));` e `<QuadroAdesao resumos={resumos} />` entre a linha `semana` e as perguntas.
- `linhaDoTempo/geral.ts`: buscar `listarTomadas(userId, '2000-01-01', hoje)` junto no `Promise.all`; para cada item de `semanasAbaixoDe80(medicacoes, tomadas, new Date())`: `{ data: semana, modulo: 'medicacao', titulo: \`Remédios · semana de ${dd/mm}\`, valor: \`${nome}: ${tomou} de ${previstas} doses (${percentual} %)\`, rota: '/(app)/(tabs)/minha-saude/medicamentos' }`.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx jest src/modules/remedios src/core/linhaDoTempo src/modules/bem-estar && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/medicacoes/useAdesao.ts src/modules/remedios "app/(app)/bem-estar/checkin/index.tsx" src/core/linhaDoTempo/geral.ts
git commit -m "feat(remédios): adesão da semana no check-in e semanas abaixo de 80 % na linha do tempo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: D-066 e verificação final

**Files:**
- Modify: `docs/nero/02-DECISOES.md` (nova entrada depois da D-065 do plano 1)

- [ ] **Step 1: Escrever a D-066** no formato das anteriores (`### D-066 — Marcar remédio tomado — 23/11/2026`): toque simples abre "Tomou?" (botões na notificação descartados); só a dose marcada vira linha; estados e regras (2 h de atraso, prazo até o fim do dia seguinte, quantidade diferente ou dose dobrada = errado, dose variável só a dobrada); segundo lembrete 30 min, janela hoje + amanhã, teto 40, sem linha em `lembretes`; `quantidades` em coluna à parte para não quebrar o build antigo; `horarios_desde` por gatilho; texto com o 💊 no título; linha do tempo só semanas completas a partir da primeira tomada; PDF fica para o plano do relatório (D-067).

- [ ] **Step 2: Rodar tudo**

Run: `npx tsc --noEmit && npx jest`
Expected: sem erros de tipo; todas as suítes PASS.

Run: `supabase db reset && npm run db:test`
Expected: todos os arquivos pgTAP `ok`.

- [ ] **Step 3: Conferir no aparelho (build de desenvolvimento)**

Cadastrar um remédio com horário daqui a 2 min e lembrete ligado → a notificação diz `Hora do remédio: <nome> · 1 comprimido 💊` / `Toque aqui para marcar`; tocar abre "Tomou?" na dose certa; não marcar → 30 min depois chega `Você tomou <nome> das <h>? 💊`; marcar antes disso → o segundo não chega.

- [ ] **Step 4: Commit**

```bash
git add docs/nero/02-DECISOES.md
git commit -m "docs(decisões): D-066 — marcar remédio tomado

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
