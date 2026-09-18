# NERO Fase 4a — Saúde & Bem-estar: Meu Corpo, Atividade, Sono e Home — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Entregar a primeira metade do módulo Saúde & Bem-estar: medidas corporais com IMC/RCA/RCQ, tendência e evolução do peso, PMAV; atividade física com resumo semanal e meta; sono com média de 7 dias; dashboard "Meus hábitos" parcial e Home com o card ativo.

**Architecture:** Parâmetros em `regras_clinicas` (programa `bem_estar`) lidos por `extrairParametrosBemEstar`; lógica pura e testada em `src/core/regras/bemestar/`; serviços Supabase em `src/core/bemestar/`; telas em `app/(app)/bem-estar/**` reaproveitando os gráficos do cardio. Peso/cintura/quadril/composição/sono vivem em `medidas` (D-011).

**Tech Stack:** Expo SDK 57 · Supabase (Postgres/RLS) · Jest · pgTAP · componentes de `src/ui` e `src/modules/coracao/componentes/{GraficoPontos,GraficoBarras}`.

**Spec:** `docs/superpowers/specs/2026-09-18-nero-fase4-bem-estar-design.md` · Decisões C-015–C-019, D-011 (`docs/nero/02-DECISOES.md`).

## Global Constraints

- Nenhuma cor de alerta clínico (§43) nas medidas corporais, atividade ou sono; textos educativos vindos de `regras_clinicas`. Única exceção: item **cinza** na Home para perda de peso não intencional (C-019).
- Nenhuma meta de peso imposta (§82): o usuário escolhe redução / manutenção / aumento / sem meta.
- Português com acentos; rodapé de commit `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Antes das telas, reler `docs/nero/03-DESIGN.md` (skill `frontend-design`). Cor do módulo: capa `#15803D → #5FCB8A`.
- Branch `nero-fase4a-corpo-atividade-sono` a partir de `desenvolvimento-2`. Nuvem (`db push` 0012) só na Task 8 do plano 4b.
- `npx tsc --noEmit && npx jest --ci` verdes antes de cada commit; rotas novas → `npm run rotas`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0012_bem_estar.sql` · `supabase/seed.sql` · `supabase/tests/bem_estar.test.sql` | tabelas, colunas do perfil, programa `bem_estar` nas regras, RLS, semente, pgTAP |
| `src/core/regras/bemestar/{tipos,parametros,corpo,atividade,sono}.ts` + `__tests__/` | lógica pura |
| `src/core/bemestar/{regras,medidasCorporais,atividades,sono,metas}.ts` + `use*.ts` | Supabase + hooks |
| `src/core/perfil/{tipos,mapeamento}.ts` | `pesoMaximoVidaKg`, `objetivoPeso` |
| `src/modules/bem-estar/{conteudo,componentes}/**` | textos fixos e componentes |
| `app/(app)/bem-estar/**` | rotas |
| `src/modules/home/montarItensHoje.ts` · `app/(app)/index.tsx` | Home |

---

## Task 1: Branch, migração 0012, regras, pgTAP, tipos do perfil

**Files:** Create `supabase/migrations/0012_bem_estar.sql`, `supabase/tests/bem_estar.test.sql` · Modify `supabase/seed.sql`, `src/core/perfil/tipos.ts`, `src/core/perfil/mapeamento.ts`, `src/core/supabase/database.types.ts` (gerado), fixtures de teste do perfil.

- [x] `git checkout desenvolvimento-2 && git pull && git checkout -b nero-fase4a-corpo-atividade-sono`
- [x] Migração `0012_bem_estar.sql`, na ordem: (a) `alter table public.regras_clinicas drop constraint if exists regras_clinicas_programa_check; add constraint … check (programa in ('mama','colo_utero','colorretal','pulmao','prostata','pressao','glicemia','risco_cv','bem_estar'))`; (b) `perfil_saude`: `peso_maximo_vida_kg numeric(5,1) check (… between 20 and 400)`, `objetivo_peso text check (objetivo_peso in ('reducao','manutencao','aumento','sem_meta'))`; (c) tabelas `refeicoes`, `atividades`, `checkins`, `metas`, `vinculos_glicemia` exatamente como a spec §4.3–§4.7, com `enable row level security` e política `for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))` (padrão de 0005); `vinculos_glicemia` usa `exists (select 1 from public.medidas m where m.id = glicemia_id and m.user_id = (select auth.uid()))` no `using` e no `with check`; (d) `create unique index metas_ativa_unica_idx on public.metas (user_id, tipo) where ativa;` (e) `comment on column public.medidas.valores` atualizado com os formatos de `composicao` e `sono` da spec §4.1.
- [x] Semente: acrescentar bloco `-- NERO · Fase 4 · Saúde & Bem-estar · versão 2026.3 · revisada em 2026-09-18` com as **12 linhas** da spec §4.8 (`modulo 'bem_estar'`, `programa 'bem_estar'`, `exame_tipo` em `imc | cintura | atividade | sono | peso | glicemia_vinculo`, `classificacao 'normal'`, `nivel_alerta 'cinza'`, `proxima_acao 'Nenhuma'`, `intervalo_meses null`). Mensagens completas (não resumo), cada uma com fonte e ano: IMC faixas (ABESO 2016 Tabela 4, 2016); IMC idoso (ABESO 2016 Rec. 1C / MS, 2016); cintura cortes (ABESO 2016 Tabela 5 · DBHA 2025, 2025); RCA (ABESO 2016 Rec. 1F · ABESO 2026 R5, 2026); RCQ (OMS 2011, 2011); técnica (OMS 2011 · ABESO 2016, 2011); atividade meta (OMS 2020 · Guia MS 2021, 2021); sono (AASM/SRS 2015, 2015); tendência (C-019, 2026); PMAV (ABESO 2026 R8, 2026); perda não intencional (C-019, 2026); vínculo (C-020 · SBD 2026, 2026).
- [x] `supabase/tests/bem_estar.test.sql` (plan 6): semente tem 12 regras `bem_estar`; A não vê `refeicoes` de B; A não insere `atividades` em nome de B (42501); A não vê `checkins` de B; segunda meta ativa do mesmo tipo para A viola `metas_ativa_unica_idx` (23505); A não insere `vinculos_glicemia` apontando para glicemia de B (42501).
- [x] `supabase db reset && supabase test db` (30) · `npm run db:types`.
- [x] `PerfilSaude` ganha `pesoMaximoVidaKg: number | null` e `objetivoPeso: 'reducao' | 'manutencao' | 'aumento' | 'sem_meta' | null`; mapeamento linha↔domínio nos dois sentidos; fixtures de `PerfilSaude` nos testes (`montarItensHoje.test.ts`, `relatorios/__tests__/fixtures.ts`, `perfil/__tests__`) ganham os dois campos.
- [x] `npx tsc --noEmit && npx jest --ci` · commit `feat(bem-estar): migração 0012 (refeições, atividades, check-ins, metas, vínculos, PMAV/objetivo) + 12 regras bem_estar`.

## Task 2: Parâmetros e núcleo de corpo (TDD)

**Files:** Create `src/core/regras/bemestar/tipos.ts`, `parametros.ts`, `corpo.ts`, `__tests__/fixtures.ts`, `__tests__/parametros.test.ts`, `__tests__/corpo.test.ts`.

**Interfaces (produz):**
```ts
// tipos.ts
export type Sexo = 'feminino' | 'masculino';
export type ObjetivoPeso = 'reducao' | 'manutencao' | 'aumento' | 'sem_meta';
export interface MedidaCorporal { id: string; medidoEm: string; tipo: 'peso' | 'cintura' | 'quadril' | 'composicao'; valores: { kg?: number; cm?: number; metodo?: string; gordura_pct?: number; massa_gordura_kg?: number; massa_magra_kg?: number; massa_muscular_kg?: number; agua_pct?: number; gordura_visceral?: number; tmb_kcal?: number } }
export interface ParametrosBemEstar {
  imc: { baixo: number; sobrepeso: number; obesidade1: number; obesidade2: number; obesidade3: number; regra: RegraParametros };
  imcIdoso: { idadeMin: number; baixo: number; alto: number; regra: RegraParametros };
  cintura: { hAumentado: number; mAumentado: number; hMuito: number; mMuito: number; regra: RegraParametros };
  rca: { limite: number; regra: RegraParametros };
  rcq: { h: number; m: number; regra: RegraParametros };
  tecnica: { regra: RegraParametros };
  atividade: { moderadaMin: number; moderadaMax: number; vigorosaMin: number; vigorosaMax: number; fatorVigorosa: number; fortalecimentoDias: number; idosoIdade: number; equilibrioDias: number; regra: RegraParametros };
  sono: { minimoMin: number; maximoIncertoMin: number; regra: RegraParametros };
  tendencia: { minimoMedidas: number; janelaDias: number; limiarPct: number; regra: RegraParametros };
  pmav: { imcMin: number; imc2: number; imcMax: number; reduzida1: number; controlada1: number; reduzida2: number; controlada2: number; regra: RegraParametros };
  perdaNaoIntencional: { pct: number; meses: number; regra: RegraParametros };
  vinculo: { horas: number; regra: RegraParametros };
}
// corpo.ts
export type FaixaIMC = 'baixo_peso' | 'referencia' | 'sobrepeso' | 'obesidade_1' | 'obesidade_2' | 'obesidade_3';
export function faixaIMC(imc: number, p: ParametrosBemEstar): { faixa: FaixaIMC; rotulo: string; regra: RegraParametros }
export function faixaIMCIdoso(imc: number, idade: number | null, p: ParametrosBemEstar): { faixa: 'baixo_peso' | 'referencia' | 'excesso'; rotulo: string; regra: RegraParametros } | null  // null se idade < idadeMin
export function rca(cinturaCm: number, alturaCm: number): number  // 2 casas
export function classificarRCA(v: number, p): { acima: boolean; regra }
export function classificarCintura(cm: number, sexo: Sexo, p): { faixa: 'referencia' | 'aumentado' | 'muito_aumentado'; regra }
export function rcq(cinturaCm: number, quadrilCm: number): number
export function classificarRCQ(v: number, sexo: Sexo, p): { acima: boolean; regra }
export function tendenciaPeso(pesos: { medidoEm: string; kg: number }[], hoje: string, p): 'estavel' | 'aumento' | 'reducao' | null
export function evolucaoPercentual(inicialKg: number, atualKg: number): number  // 1 casa, sinal
export function avaliarPMAV(pesoAtualKg: number, pmavKg: number, imc: number, p): { perdaPct: number; faixa: 'nenhuma' | 'reduzida' | 'controlada' | null; regra }  // faixa null se imc fora de [imcMin, imcMax]
export function perdaNaoIntencional(pesos, objetivo: ObjetivoPeso | null, hoje: string, p): { pct: number; desde: string; regra } | null
export function compararPeriodos(medidas: MedidaCorporal[], de: string, ate: string): { peso?: [number, number]; cintura?: [number, number]; gorduraPct?: [number, number]; massaMuscularKg?: [number, number] }  // primeira do período → última do período
```

- [x] `fixtures.ts`: `regrasBemEstarTeste(): RegraParametros[]` com as 12 camadas e os mesmos números da semente.
- [x] `parametros.test.ts`: extrai todas as camadas; falta de camada lança `regras_clinicas: falta a camada "…" do programa bem_estar`.
- [x] `corpo.test.ts` (casos obrigatórios): IMC 82/1,70² = 28,4 → `sobrepeso` · 17,9 → `baixo_peso` · 24,9 → `referencia` · 30 → `obesidade_1` · 35 → `obesidade_2` · 40 → `obesidade_3`; idoso 65 anos IMC 26 → `referencia` (idoso) enquanto OMS diz sobrepeso; 65 anos IMC 21 → `baixo_peso`; 59 anos → `null`; `rca(96,170)` = 0,56 e acima; `rca(78,165)` = 0,47 e não; cintura 96 H → aumentado; 103 H → muito_aumentado; 79 M → referencia; 80 M → aumentado; `rcq(96,102)` = 0,94 H → acima; M 0,84 → não; tendência: 2 medidas → null; 3 medidas em 10 dias → null (janela); médias 80,0 → 79,0 (−1,25 %) → `reducao`; 80,0 → 80,5 → `estavel`; `evolucaoPercentual(82, 76)` = −7,3; PMAV 95 → 82 com IMC 28,4 → `faixa null` (IMC < 30), perdaPct 13,7; PMAV 95 → 82 com IMC 31 → `controlada`; perda 7 % IMC 32 → `reduzida`; perda 12 % IMC 42 → `reduzida`; 16 % IMC 42 → `controlada`; perda não intencional: objetivo `manutencao`, 80 → 75,5 em 5 meses → `{ pct: 5.6 }`; objetivo `reducao` → null; queda em 8 meses → null; `compararPeriodos` devolve pares primeira→última só dos tipos presentes.
- [x] Implementar `tipos.ts`, `parametros.ts` (padrão `porCamada` de `parametrosRisco.ts`), `corpo.ts`; `faixaIMC` usa `<` nos limites inferiores (18,5 é referência; 25,0 é sobrepeso); `tendenciaPeso`: exige `≥ minimoMedidas` medidas e `≥ janelaDias` entre primeira e última; média dos últimos `janelaDias` dias × média dos `janelaDias` anteriores; se a janela anterior estiver vazia → null; `perdaNaoIntencional`: só se objetivo ∈ {`manutencao`,`aumento`,`sem_meta`,`null`}, compara o peso mais recente com o **maior** peso registrado nos últimos `meses` meses; devolve `null` se `< pct`.
- [x] Verde; commit `feat(bem-estar): parâmetros e núcleo de corpo (IMC, cintura, RCA, RCQ, tendência, PMAV) com testes (C-015, C-016, C-019)`.

## Task 3: Serviços de medidas corporais, perfil (PMAV/objetivo) e telas de Meu Corpo

**Files:** Create `src/core/bemestar/regras.ts`, `medidasCorporais.ts`, `useCorpo.ts`, `src/modules/bem-estar/conteudo/corpo.ts`, `src/modules/bem-estar/componentes/{LinhaMedidaCorporal,GraficoSerie,CartaoIndicador}.tsx`, `app/(app)/bem-estar/_layout.tsx`, `app/(app)/bem-estar/corpo/{index,registrar,composicao,entenda}.tsx` · Modify `src/core/perfil/repositorio.ts` (nada se `salvarPerfil` já aceita `Partial`).

**Interfaces:**
```ts
// bemestar/regras.ts
export async function carregarRegrasBemEstar(): Promise<RegraParametros[]>   // cache 10 min, modulo 'bem_estar', programa 'bem_estar'
// bemestar/medidasCorporais.ts
export async function listarCorporais(userId: string, f: { tipo?: MedidaCorporal['tipo']; desde?: string } = {}): Promise<MedidaCorporal[]>
export async function inserirCorporal(userId: string, m: { tipo: MedidaCorporal['tipo']; medidoEm: string; valores: MedidaCorporal['valores']; contexto?: Record<string, unknown> }): Promise<string>
export async function ultimoPorTipoCorporal(userId: string): Promise<Record<MedidaCorporal['tipo'], MedidaCorporal | null>>
// useCorpo.ts → { medidas, ultimos, parametros, perfil, carregando, erro, registrar(lote: { peso?, cintura?, quadril?, alturaCm?, metodo?, medidoEm }), salvarComposicao(...), salvarPMAV(kg|null), salvarObjetivo(objetivo), recarregar }
```
- [x] `registrar` grava uma linha por tipo informado (peso, cintura, quadril) com o mesmo `medidoEm`; se `alturaCm` diferir do perfil, `salvarPerfil({ alturaCm })`. Validação de plausibilidade (spec §10): peso 20–400; cintura 40–200; quadril 50–220; variação de peso > 20 % vs. última medida → `Alert` "Confirma? A última medida foi X kg" antes de gravar.
- [x] `GraficoSerie` (`src/modules/bem-estar/componentes/`): série temporal simples (pontos ligados por linhas finas, eixo com min/max, rótulos de data), sem cor de alerta; usada para peso, IMC, cintura, gordura %, massa muscular — **um indicador por gráfico** (§73).
- [x] `corpo/index.tsx`: cabeçalho "Meu Corpo" com `NeroImage variant="bem_estar"` (ou símbolo); bloco "Composição corporal" (§72) com `CartaoIndicador` para peso, IMC (+ faixa OMS e, se ≥ 60 anos, faixa idoso), cintura (+ faixa IDF/NCEP), RCA (+ "abaixo/acima de 0,5"), RCQ quando houver quadril, "última composição corporal"; link "Entenda cada medida"; botão "Registrar medidas"; seletor `Opcoes` 30 d / 3 m / 6 m / 1 a / tudo; um `GraficoSerie` por indicador disponível; "Comparar períodos" (dois seletores de mês → `compararPeriodos`); bloco "Tendência" (`tendenciaPeso` ou "registre pelo menos 3 medidas em 2 semanas") e "Evolução" (`evolucaoPercentual` desde a primeira medida do período); bloco "Peso máximo da vida" (campo + `avaliarPMAV` com o texto da regra quando `faixa` não é null); bloco "Objetivo de peso" (`Opcoes` redução / manutenção / aumento / sem meta, salvo no perfil). Textos das faixas vêm de `regra.mensagemPaciente`.
- [x] `corpo/registrar.tsx`: campos peso, altura (pré-preenchida), cintura, quadril, método (`Select`), data (`CampoData`, padrão hoje); botão "Como medir a cintura" abre folha (`Modal`) com `parametros.tecnica.regra.mensagemPaciente`.
- [x] `corpo/composicao.tsx` (§83): formulário dos campos opcionais + método obrigatório; aviso literal do §83 no topo; histórico em lista.
- [x] `corpo/entenda.tsx`: uma seção por regra (IMC, idoso, cintura, RCA, RCQ, PMAV) com `mensagemPaciente` + "Fonte: …".
- [x] `npm run rotas`, checks, commit `feat(bem-estar): Meu Corpo — medidas, IMC/RCA/RCQ, evolução, comparar períodos, PMAV e objetivo (§70–§73, §82–§84)`.

## Task 4: Núcleo de atividade (TDD), serviços, telas e meta

**Files:** Create `src/core/regras/bemestar/atividade.ts`, `__tests__/atividade.test.ts`, `src/core/bemestar/atividades.ts`, `metas.ts`, `useAtividades.ts`, `useMetas.ts`, `src/modules/bem-estar/conteudo/atividade.ts`, `app/(app)/bem-estar/atividade/{index,registrar}.tsx`.

**Interfaces:**
```ts
export type TipoAtividade = 'caminhada'|'corrida'|'ciclismo'|'musculacao'|'natacao'|'esporte_coletivo'|'danca'|'funcional'|'pilates'|'yoga'|'outra';
export interface Atividade { id: string; inicio: string; tipo: TipoAtividade; duracaoMin: number; intensidade: 'leve'|'moderada'|'vigorosa'; distanciaKm: number|null; fcMedia: number|null; calorias: number|null; observacao: string|null }
export const TIPOS_FORTALECIMENTO: TipoAtividade[] = ['musculacao','funcional','pilates'];
export function minutosQueContam(a: Atividade[], p): number            // moderada + vigorosa × fatorVigorosa; leve = 0
export function semanaDe(iso: string): { inicio: string; fim: string } // segunda 00:00 → domingo 23:59 local
export function resumoSemana(a: Atividade[], semana: { inicio; fim }, p, idade: number|null, meta: Meta|null): { totalMin: number; leveMin: number; moderadaMin: number; vigorosaMin: number; minutosQueContam: number; diasAtivos: number; diasFortalecimento: number; porDia: { dia: string; minutos: number }[] /* seg→dom */; metaMin: number; metaAtingidaPct: number; fortalecimentoMeta: number; idoso: boolean; equilibrioDias: number }
export function resumo30d(a: Atividade[], hoje: string): { porTipo: { tipo; sessoes; minutos }[]; totalMin: number }
export interface Meta { id: string; tipo: 'peso'|'cintura'|'atividade_min'|'atividade_dias'|'fortalecimento_dias'|'sono_min'|'pressao'; valor: number; origem: 'app'|'usuario'|'profissional'; detalhe: string|null; ativa: boolean }
```
- [x] Testes: caminhada 40 moderada + musculação 50 moderada + corrida 20 vigorosa → `minutosQueContam` 130 (40+50+20×2), `moderadaMin` 90, `vigorosaMin` 20, `diasFortalecimento` 1, `metaMin` 150 (sem meta própria = `moderadaMin` da regra), `metaAtingidaPct` 87; yoga 30 leve → `leveMin` 30 e não conta; meta própria `atividade_min` 200 → `metaMin` 200; idade 65 → `idoso` true e `equilibrioDias` 3; `semanaDe('2026-09-18')` (sexta) → inicio 2026-09-14; `porDia` sempre 7 posições; `resumo30d` agrupa por tipo com contagem e minutos.
- [x] Serviços: `listarAtividades(userId, { desde })`, `inserirAtividade`, `excluirAtividade`; `metas.ts`: `listarMetas(userId)`, `definirMeta(userId, { tipo, valor, origem, detalhe })` (desativa a ativa anterior do tipo e insere), `desativarMeta(id)`.
- [x] `atividade/index.tsx` (§78–§79): "Sua semana" (total, moderada, vigorosa, dias ativos, fortalecimento n/2, gráfico seg→dom com `GraficoBarras`-like simples), frase da OMS (`parametros.atividade.regra.mensagemPaciente`), progresso `115 / 150 minutos`; "Últimos 30 dias" por tipo; bloco "Meta": "Usar a meta sugerida (150 min + fortalecimento 2 dias)" ou "Criar minha meta" (minutos/semana, dias/semana de um tipo, ex.: musculação 3×) → `definirMeta`; botão "Registrar atividade".
- [x] `atividade/registrar.tsx` (§77): tipo (`Select`), data + hora, duração, intensidade (`Opcoes` leve/moderada/intensa → `vigorosa`), opcionais distância/FC/calorias/observação.
- [x] `npm run rotas`, checks, commit `feat(bem-estar): atividade física — registro, resumo semanal, 30 dias e metas (§77–§79, C-017)`.

## Task 5: Núcleo de sono (TDD), serviços e telas

**Files:** Create `src/core/regras/bemestar/sono.ts`, `__tests__/sono.test.ts`, `src/core/bemestar/sono.ts`, `useSono.ts`, `src/modules/bem-estar/conteudo/sono.ts`, `app/(app)/bem-estar/sono/{index,registrar}.tsx`.

**Interfaces:**
```ts
export interface Sono { id: string; dormiuEm: string; acordouEm: string; minutos: number; qualidade: 1|2|3|4|5|null; contexto: { acordouNoite?: boolean; cochilou?: boolean; dificuldadeAdormecer?: boolean; acordouDescansado?: boolean } }
export function minutosDeSono(dormiuEm: string, acordouEm: string): number   // lança se acordou ≤ dormiu ou > 20 h
export function mediaCircularHora(horas: { h: number; m: number }[]): { h: number; m: number }   // ângulos; 23:40 + 00:20 → 00:00
export function resumo7d(sonos: Sono[], hoje: string, p): { noites: number; mediaMin: number|null; horarioDormir: string|null; horarioAcordar: string|null; abaixoDaReferencia: boolean; regra: RegraParametros; porNoite: { data: string; minutos: number; qualidade: number|null }[] }
export function formatarHm(min: number): string   // 400 → '6h40'
```
- [x] Testes: `minutosDeSono('2026-09-17T23:40', '2026-09-18T06:20')` = 400; `formatarHm(400)` = '6h40'; `mediaCircularHora([23:40, 00:20])` = 00:00; `[22:00, 23:00]` = 22:30; `resumo7d` com 7 noites (400, 420, 450, 380, 470, 430, 410) → média 423 → `abaixoDaReferencia` false... (média 7h03); com médias < 420 → true; sem noites → `mediaMin null`, `abaixoDaReferencia false`; noites fora dos 7 dias ignoradas; `porNoite` ordenado.
- [x] Serviços em `medidas` (`tipo 'sono'`): `listarSono(userId, { desde })`, `inserirSono(userId, { dormiuEm, acordouEm, qualidade, contexto })` calcula `minutos` e grava `{ dormiu_em, acordou_em, minutos, qualidade }`; `excluirSono`.
- [x] `sono/index.tsx` (§80): "Média dos últimos 7 dias 7h12/noite", horário médio de dormir/acordar, barras por noite (reuso de `GraficoBarras` com `pas = minutos`, `pad = 0`, referência 420), texto neutro quando abaixo de 7 h (`regra.mensagemPaciente`), lista das noites com qualidade; botão "Registrar noite".
- [x] `sono/registrar.tsx`: data + hora que dormiu, hora que acordou (se acordou < dormiu, assume dia seguinte), qualidade (`Opcoes` muito ruim…muito bom), 4 interruptores opcionais.
- [x] `npm run rotas`, checks, commit `feat(bem-estar): sono — registro, média de 7 dias e horários médios (§80, C-018)`.

## Task 6: Dashboard "Meus hábitos" (parcial), Home e módulo ativo

**Files:** Create `src/core/regras/bemestar/habitos.ts`, `__tests__/habitos.test.ts`, `src/core/bemestar/useHabitos.ts`, `app/(app)/bem-estar/index.tsx` · Modify `src/modules/home/montarItensHoje.ts` + teste, `app/(app)/index.tsx`, `src/ui/components/NeroImage.tsx` (variante `bem_estar` se não existir).

**Interfaces:**
```ts
export interface Habitos7d { movimentoMin: number; metaMin: number; sonoMediaMin: number|null; refeicoes: number /* 0 até 4b */; pesoKg: number|null; pesoVariacaoKg: number|null /* vs média dos 7 dias anteriores */; cinturaCm: number|null; cinturaHaDias: number|null; checkinPendente: boolean /* false até 4b */ }
export function habitos7d(e: { atividades: Atividade[]; sonos: Sono[]; pesos: MedidaCorporal[]; cinturas: MedidaCorporal[]; hoje: string; p: ParametrosBemEstar; idade: number|null; meta: Meta|null }): Habitos7d
// montarItensHoje: Entrada ganha bemEstar?: { movimentoMin: number; metaMin: number; diaDaSemana: number /* 0=dom */; perdaNaoIntencional: { pct: number; desde: string } | null }
```
- [x] Testes de `habitos7d` (peso 82,4 com média anterior 82,7 → variação −0,3; cintura há 32 dias) e de `montarItensHoje`: perda não intencional → item **cinza** `perda_peso` "Conversar com o médico: seu peso caiu 5,6 % sem meta de redução" rota `/(app)/bem-estar/corpo`; domingo com `movimentoMin < metaMin` → item cinza `atividade_semana` "Movimentar-se: 90 de 150 minutos esta semana" (só aos domingos, para não virar cobrança diária); demais dias nada.
- [x] `bem-estar/index.tsx` (§85): cabeçalho do módulo; "Seus últimos 7 dias" com cinco blocos (movimento n/meta, sono média, alimentação "em breve", peso + variação, cintura + "há n dias"); atalhos Meu Corpo · Atividade · Sono · Metas (Metas e Alimentação/Check-in como `EmBreve` até 4b).
- [x] Home: `useHabitos` alimenta `montarItensHoje` e o `CardModulo` de Saúde & Bem-estar (sem `emBreve`, subtítulo "n de 150 min esta semana · sono 7h03" ou "Peso, atividade e sono").
- [x] `npm run rotas`, checks, commit `feat(bem-estar): Meus hábitos (parcial), Home com card ativo, perda não intencional e resumo semanal`.

## Task 7: Docs e checklist 4a

- [x] `docs/nero/funcionamento/saude-bem-estar.md` §1–§4 (corpo, atividade, sono, hábitos/Home) com referências e arquivos; `docs/nero/revisao/2026-09-XX-revisao-textos-bem-estar-4a.md` (mensagens das 12 regras + textos das telas); `docs/nero/checklists/fase-4a.md`; roadmap.
- [x] Commit `docs(nero): funcionamento, revisão e checklist da Fase 4a`. Sem merge (o 4b fecha a fase).

## Autorrevisão
- Spec §4 coberta na Task 1 (todas as tabelas, mesmo as usadas só no 4b, para uma única migração); §5.1 corpo/atividade/sono/habitos nas Tasks 2, 4, 5, 6; §6 corpo/atividade/sono/index nas Tasks 3–6; §5.3 Home na Task 6; alimentação, vínculos, metas gerais, check-in, relatório e linha do tempo ficam para o plano 4b.
- Nomes consistentes: `ParametrosBemEstar`, `MedidaCorporal`, `Atividade`, `Sono`, `Meta`, `Habitos7d`, `carregarRegrasBemEstar`, `resumoSemana`, `resumo7d`, `habitos7d`.
