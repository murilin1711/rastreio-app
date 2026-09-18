# NERO Fase 2b — Glicemia, Meus Exames, Risco PREVENT, check-up e linha do tempo — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o módulo Coração & Metabolismo: registro de glicemia com metas e plano de monitorização (SBD 2026), central de exames laboratoriais/cardiológicos com valor estruturado, risco cardiovascular PREVENT com preenchimento automático e janelas de "dado recente", agravantes e CAC, check-up "Como está minha prevenção?", linha do tempo e dashboard completo.

**Architecture:** Mesma da 2a — regras puras em `src/core/regras/cardio/` (parâmetros de `regras_clinicas`, TDD), serviços em `src/core/cardio/`, telas em `app/(app)/coracao/**`. A migração 0010 já existe (2a); esta fase só semeia regras e mapeia campos do perfil. O PREVENT fica em `prevent.ts` + `prevent.coeficientes.ts` (transcrição do suplemento de Khan 2024, validada contra a calculadora da AHA).

**Tech Stack:** Expo SDK 57 · Expo Router · Supabase · Jest · expo-notifications.

**Spec:** `docs/superpowers/specs/2026-09-17-nero-fase2-cardio-design.md` · Decisões C-012, C-013, C-014 (`docs/nero/02-DECISOES.md`) · Funcionamento: `docs/nero/funcionamento/coracao-metabolismo.md` §3–§5 · Referências: `docs/nero/referencias/REFERENCIAS.md` (Fase 2).

## Global Constraints

- **Diretrizes vigentes, texto literal:** SBD 2026 (Metas R6/Tabela 1; níveis de hipoglicemia; Monitorização R5/R8–R10; Diagnóstico R1–R2/Tabela 1; Dias de doença Tabela 1; Cetoacidose) · Dislipidemias 2025 (Tabelas 4.1, 4.3, 4.4; §4.2, §4.8–4.9) · Khan 2023/2024 (PREVENT). Antes da Task 1, reabrir as URLs em `REFERENCIAS.md`, confirmar versão e anotar a data.
- **Bloqueio conhecido:** a Task 4 (coeficientes do PREVENT) exige `docs/nero/referencias/pdf/2024-AHA-PREVENT-development-validation-Khan-Circulation.pdf` e `…-supplement.pdf` (download manual pelo Murilo). As demais tasks não dependem dela; se os PDFs não existirem ao chegar na Task 4, pular para a 5 e voltar depois.
- O app **não** diagnostica diabetes, não sugere dose de insulina nem "coma 15 g de carboidrato" (C-012: "siga a orientação do seu médico para hipoglicemia"). Não reclassifica risco por agravantes (§17). Categoria do PREVENT sempre com o rótulo "categoria pelo escore — a estratificação final é do seu médico".
- SDI (índice de privação social) **nunca** entra no cálculo.
- `src/core/regras/**` sem React/Expo/Supabase/UI. Toda linha nova em `regras_clinicas`: `modulo='cardio'`, fonte com recomendação/tabela, `versao='2026.2'`, `revisada_em='2026-09-17'`.
- Português com acentos; rodapé de commit `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Antes das telas (Tasks 6–9) reler `docs/nero/03-DESIGN.md` (skill `frontend-design`). Cores de nível só em chips; leitura de glicemia segue o padrão tipográfico de `LeituraPA`.
- Branch `nero-fase2b-glicemia-risco` a partir de `nero-fase2a-pressao` (ou de `desenvolvimento-2` se a 2a já tiver sido mesclada). Nuvem: semente das regras novas na Task 10 (não há migração nova).
- `npx tsc --noEmit && npx jest --ci` verdes antes de cada commit; rotas novas → `npm run rotas`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/seed.sql` | bloco `glicemia` (8 linhas) e `risco_cv` (4 linhas) |
| `supabase/tests/cardio.test.sql` | contagem das regras novas |
| `src/core/perfil/{tipos,mapeamento}.ts` | campos da Fase 2 no domínio |
| `src/core/regras/cardio/tiposGlicemia.ts` | tipos de glicemia, metas, plano, avaliação |
| `src/core/regras/cardio/parametrosGlicemia.ts` · `parametrosRisco.ts` | leitura tipada das regras |
| `src/core/regras/cardio/glicemia.ts` | metas por perfil, camadas hipo/hiper, sem diabetes, modelos de plano, resumo §8 |
| `src/core/regras/cardio/dadoRecente.ts` | janelas C-014 |
| `src/core/regras/cardio/checkup.ts` | n/8 do §24 |
| `src/core/regras/cardio/agravantes.ts` | Tabela 4.3 |
| `src/core/regras/cardio/ckdEpi.ts` | CKD-EPI 2021 |
| `src/core/regras/cardio/prevent.coeficientes.ts` · `prevent.ts` | equações PREVENT (ASCVD 10/30 anos) + categoria Tabela 4.1 |
| `src/core/cardio/tiposExames.ts` | lista fechada de tipos lab/cardio, unidades e rótulos |
| `src/core/cardio/{glicemia,examesCardio,riscoCv,linhaDoTempo}.ts` | serviços com Supabase |
| `src/core/cardio/lembretesCardio.ts` | `+ agendarLembretesGlicemia` |
| `src/core/cardio/{useGlicemia,useExamesCardio,useRiscoCv,useCheckup,useLinhaDoTempo}.ts` | hooks |
| `src/core/cardio/resumoHome.ts` | `+ glicemia`, `+ checkup` no `ResumoCardio` |
| `src/modules/coracao/conteudo/{glicemia,risco}.ts` | textos |
| `src/modules/coracao/componentes/{LeituraGlicemia,LinhaGlicemia,LinhaExame,SerieExame,EntradaRisco,FatorRisco}.tsx` | componentes |
| `app/(app)/coracao/glicemia/{index,registrar,plano,relatorio}.tsx` · `exames/{index,registrar,[id]}.tsx` · `risco/{index,dados,resultado,agravantes}.tsx` · `checkup.tsx` · `linha-do-tempo.tsx` · `index.tsx` | rotas |
| `src/modules/home/montarItensHoje.ts` | itens de glicemia, lembrete do plano e check-up |

---

## Task 1: Branch, perfil (campos da Fase 2), semente de glicemia e risco, pgTAP

**Files:**
- Modify: `src/core/perfil/tipos.ts`, `src/core/perfil/mapeamento.ts`, `src/core/perfil/__tests__/mapeamento.test.ts`, `supabase/seed.sql`, `supabase/tests/cardio.test.sql`, `docs/nero/referencias/REFERENCIAS.md`

**Interfaces:**
- Produces: em `PerfilSaude`: `tipoDiabetes: 'dm1'|'dm2'|'gestacional'|'outro'|null` · `usaInsulina: 'nao'|'basal'|'intensiva'|null` · `eventoCvPrevio: boolean|null` · `perfilMetaGlicemica: 'adulto'|'idoso_comprometido'|'idoso_muito_comprometido'` · `metasGlicemia: MetasGlicemia|null` · `planoGlicemia: PlanoGlicemia|null` · `agravantesCv: { itens: AgravanteCV[]; atualizadoEm: string|null }` · `atividadeFisicaRegular: boolean|null`; 12 linhas novas em `regras_clinicas`.

- [ ] **Step 1: Branch e verificação de referências**

```bash
cd "/Users/muriloroizpovoa/Desktop/App de Rastreio/app-de-rastreio" && git checkout nero-fase2a-pressao && git pull -q && git checkout -b nero-fase2b-glicemia-risco
```
Abrir as URLs da SBD 2026 (5 capítulos) e da Dislipidemias 2025 em `REFERENCIAS.md`; anotar a data em "Última verificação".

- [ ] **Step 2: Tipos do perfil** — em `src/core/perfil/tipos.ts`, antes de `semMedicacoes`:

```ts
  /** Fase 2 — Coração & Metabolismo (C-012, C-013). */
  tipoDiabetes: TipoDiabetes | null;
  usaInsulina: UsoInsulina | null;
  eventoCvPrevio: boolean | null;
  perfilMetaGlicemica: PerfilMetaGlicemica;
  metasGlicemia: MetasGlicemia | null;
  planoGlicemia: PlanoGlicemia | null;
  agravantesCv: { itens: AgravanteCV[]; atualizadoEm: string | null };
  atividadeFisicaRegular: boolean | null;
```
e no topo do arquivo:
```ts
export type TipoDiabetes = 'dm1' | 'dm2' | 'gestacional' | 'outro';
export type UsoInsulina = 'nao' | 'basal' | 'intensiva';
export type PerfilMetaGlicemica = 'adulto' | 'idoso_comprometido' | 'idoso_muito_comprometido';
export type MomentoGlicemia = 'jejum' | 'antes_cafe' | 'pos_cafe_1h' | 'pos_cafe_2h' | 'antes_almoco' | 'pos_almoco_1h' | 'pos_almoco_2h' | 'antes_jantar' | 'pos_jantar_1h' | 'pos_jantar_2h' | 'antes_dormir' | 'madrugada' | 'antes_exercicio' | 'depois_exercicio' | 'sintomas_hipoglicemia' | 'aleatoria' | 'outro';
export interface MetasGlicemia { definidasPor: 'medico' | 'outro_profissional' | 'diretriz'; jejumMin: number; jejumMax: number; posMax: number | null; deitarMin: number; deitarMax: number }
export interface PlanoGlicemia { definidoPor: 'medico' | 'outro_profissional' | 'nenhum'; modelo: 'dm1_sem_sensor' | 'dm2_basal' | 'dm2_intensiva' | 'dm2_sem_insulina' | null; horarios: { momento: MomentoGlicemia; hora: string }[] }
export type AgravanteCV = 'hist_familiar_dcv_prematura' | 'sindrome_metabolica' | 'esteatose_hepatica' | 'artrite_reumatoide' | 'psoriase' | 'lupus' | 'dii' | 'hiv' | 'transplante' | 'menarca_precoce_ou_tardia' | 'disturbio_gestacional' | 'parto_prematuro' | 'rciu' | 'abortos_repeticao' | 'menopausa_precoce' | 'lpa_elevada' | 'pcr_us_elevada';
```

- [ ] **Step 3: Mapeamento** — em `mapeamento.ts`, acrescentar ao `MAPA`: `tipoDiabetes: 'tipo_diabetes', usaInsulina: 'usa_insulina', eventoCvPrevio: 'evento_cv_previo', perfilMetaGlicemica: 'perfil_meta_glicemica', metasGlicemia: 'metas_glicemia', planoGlicemia: 'plano_glicemia', agravantesCv: 'agravantes_cv', atividadeFisicaRegular: 'atividade_fisica_regular'`. Os jsonb (`metas_glicemia`, `plano_glicemia`, `agravantes_cv`) são gravados em **camelCase** dentro do JSON (como `historicoCancerPessoal`), sem conversão de chaves. `paraDominio` deve devolver `agravantesCv` com `{ itens: [], atualizadoEm: null }` quando o banco tiver `{"itens":[]}`. Teste em `mapeamento.test.ts`: ida e volta com `metasGlicemia: { definidasPor: 'medico', jejumMin: 80, jejumMax: 130, posMax: 180, deitarMin: 90, deitarMax: 150 }` e `agravantesCv: { itens: ['hiv'], atualizadoEm: '2026-09-17' }`.

- [ ] **Step 4: Semente** — acrescentar ao fim de `supabase/seed.sql`:

```sql
-- Glicemia (C-012). Fonte: Diretriz da SBD ed. 2026 — Metas de controle glicêmico (R6, Tabela 1, níveis de hipoglicemia);
-- Diagnóstico de DM (R1–R2, Tabela 1); Manejo dos dias de doença no DM1 (Tabela 1); Cetoacidose diabética; Monitorização (R5, R8–R10).
insert into public.regras_clinicas
  (modulo, programa, exame_tipo, condicao, classificacao, nivel_alerta, proxima_acao, intervalo_meses, mensagem_paciente, fonte, ano, versao, revisada_em)
values
('cardio','glicemia','glicemia','{"camada":"metas","perfil":"adulto","jejum":[80,130],"pos":180,"deitar":[90,150]}','normal','verde','Nenhuma',null,'Metas da diretriz da SBD 2026 para adultos e idosos saudáveis: jejum e antes das refeições entre 80 e 130, 2 horas após as refeições abaixo de 180, ao deitar entre 90 e 150. Confirme com seu médico.','SBD 2026 — Metas de controle glicêmico, R6 (IIa, C) e Tabela 1',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"metas","perfil":"idoso_comprometido","jejum":[90,150],"pos":180,"deitar":[100,180]}','normal','verde','Nenhuma',null,'Metas da diretriz da SBD 2026 para idosos com saúde comprometida: jejum e antes das refeições entre 90 e 150, 2 horas após as refeições abaixo de 180, ao deitar entre 100 e 180. Use só se seu médico indicou este enquadramento.','SBD 2026 — Metas de controle glicêmico, Tabela 1',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"metas","perfil":"idoso_muito_comprometido","jejum":[100,180],"pos":null,"deitar":[110,200]}','normal','verde','Nenhuma',null,'Metas da diretriz da SBD 2026 para idosos muito comprometidos: jejum e antes das refeições entre 100 e 180, ao deitar entre 110 e 200, sem meta após as refeições. Use só se seu médico indicou este enquadramento.','SBD 2026 — Metas de controle glicêmico, Tabela 1',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"hipo_n1","min":54,"max":69}','controle','amarelo','Seguir a orientação do médico para hipoglicemia',null,'Sua glicemia está abaixo de 70. Siga a orientação do seu médico para hipoglicemia e meça de novo em seguida. Se tiver sintomas, trate agora.','SBD 2026 — Metas de controle glicêmico (hipoglicemia nível 1: 54–69 mg/dL)',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"hipo_n2","max":53}','investigacao','laranja','Intervenção imediata',null,'Sua glicemia está muito baixa (abaixo de 54). Siga agora a orientação do seu médico para hipoglicemia. Se não melhorar ou tiver confusão, peça ajuda a alguém próximo ou procure atendimento.','SBD 2026 — Metas de controle glicêmico (hipoglicemia nível 2: < 54 mg/dL, "exige intervenção imediata")',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"hipo_n3","sintomas":["confusao","precisou_de_ajuda"]}','especializado','vermelho','Atendimento de emergência',null,'Hipoglicemia com confusão ou que precisou da ajuda de outra pessoa é um evento grave. Procure atendimento de emergência agora.','SBD 2026 — Metas de controle glicêmico (hipoglicemia nível 3)',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"hiper","min":251}','investigacao','laranja','Repetir a medida',null,'Sua glicemia está muito alta (acima de 250). Meça de novo e siga a orientação do seu médico. Se você tem diabetes tipo 1 ou usa bomba de insulina, verifique cetonas como seu médico orientou.','SBD 2026 — Manejo dos dias de doença no DM1, Tabela 1 (> 250 mg/dL: checar cetonas)',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"hiper_sintoma","min":251,"sintomas":["nausea","vomito","dor_abdominal","respiracao_rapida","sonolencia"]}','especializado','vermelho','Atendimento de emergência',null,'Glicemia muito alta com esses sintomas precisa de avaliação urgente. Procure um serviço de emergência agora.','SBD 2026 — Diagnóstico e tratamento da cetoacidose diabética (sintomas de CAD)',2026,'2026.2','2026-09-17'),
('cardio','glicemia','glicemia','{"camada":"sem_diabetes","jejum_normal_max":99,"jejum_pre_max":125,"jejum_dm":126,"casual_dm":200}','normal','verde','Conversar com o médico sobre exame de laboratório',null,'Glicemia medida no dedo não faz diagnóstico. A diretriz usa exames de laboratório: jejum abaixo de 100 é normal; entre 100 e 125 é a faixa chamada de pré-diabetes; 126 ou mais, ou 200 ou mais com sintomas, é critério de diabetes. Converse com seu médico sobre fazer um exame de laboratório.','SBD 2026 — Diagnóstico de diabetes mellitus, R1–R2 e Tabela 1',2026,'2026.2','2026-09-17'),
-- Risco cardiovascular (C-013, C-014). Fonte: Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose 2025.
('cardio','risco_cv','prevent','{"camada":"categorias","baixo_max":5,"alto_min":20}','normal','verde','Nenhuma',null,'Categoria pelo escore: abaixo de 5% em 10 anos é risco baixo; de 5% a menos de 20% é intermediário; 20% ou mais é alto. A estratificação final é do seu médico, que considera diabetes, LDL, exames de imagem e outros fatores.','Dislipidemias 2025, Tabela 4.1',2025,'2026.2','2026-09-17'),
('cardio','risco_cv','prevent','{"camada":"elegibilidade","idade_min":30,"idade_max":79}','pendente','cinza','Avaliação de risco com o médico',null,'O escore PREVENT foi desenvolvido para pessoas de 30 a 79 anos sem doença cardiovascular conhecida. Fora dessa situação, a avaliação de risco é feita pelo seu médico.','Dislipidemias 2025, §4.2 (30–79 anos, sem DCV prévia), §4.8–4.9',2025,'2026.2','2026-09-17'),
('cardio','risco_cv','cac','{"camada":"cac","alto":100,"percentil_alto":75,"muito_alto":300}','controle','amarelo','Conversar com o médico',null,'A diretriz considera esse valor de escore de cálcio um estratificador de risco cardiovascular. Converse com seu médico sobre o que ele significa para você.','Dislipidemias 2025, Tabela 4.4',2025,'2026.2','2026-09-17'),
('cardio','risco_cv','prevent','{"camada":"dado_recente","pa_mrpa_dias":30,"pa_casual_dias":7,"pa_casual_min":3,"peso_dias":30,"peso_perguntar_dias":90,"lipidios_meses":12,"renal_meses":12,"hba1c_meses":6,"rac_meses":12,"risco_meses":12}','pendente','cinza','Atualizar dados',null,'Alguns dados usados no cálculo têm mais de um ano. O resultado é mostrado, mas vale atualizar seus exames para uma estimativa mais fiel.','C-014 (decisão de produto) · Dislipidemias 2025 (perfil lipídico anual) · DBHA 2025 (reavaliação anual de fatores de risco)',2025,'2026.2','2026-09-17')
on conflict do nothing;
```

- [ ] **Step 5: pgTAP** — em `supabase/tests/cardio.test.sql`: `select plan(7);` e, após o teste das 7 de pressão: `select is((select count(*) from public.regras_clinicas where programa = 'glicemia' and ativa), 9::bigint, 'semente tem as 9 regras de glicemia');` e `select is((select count(*) from public.regras_clinicas where programa = 'risco_cv' and ativa), 4::bigint, 'semente tem as 4 regras de risco');`.

- [ ] **Step 6: Verificar e commitar** — `supabase db reset && supabase test db` (19 pgTAP) · `npm run db:types` (sem mudança esperada) · `npx tsc --noEmit && npx jest --ci` · commit `feat(cardio): campos da Fase 2 no perfil + semente de glicemia e risco`.

---

## Task 2: `glicemia.ts` — metas, camadas e plano (TDD)

**Files:**
- Create: `src/core/regras/cardio/tiposGlicemia.ts`, `src/core/regras/cardio/parametrosGlicemia.ts`, `src/core/regras/cardio/glicemia.ts`, `src/core/regras/cardio/__tests__/glicemia.test.ts`, `src/core/regras/cardio/__tests__/fixturesGlicemia.ts`

**Interfaces:**
- Produces: `extrairParametrosGlicemia(regras): ParametrosGlicemia` · `metasPara(perfil: { temDiabetes; perfilMetaGlicemica; metasGlicemia }, p): Metas | null` · `avaliarGlicemia(m: { mgdl; momento; sintomas }, perfil: { temDiabetes; tipoDiabetes; usaInsulina }, metas: Metas | null, p): AvaliacaoGlicemia` · `modelosPlano(tipoDiabetes, usaInsulina): ModeloPlano[]` · `resumoGlicemia(medidas, metas): ResumoGlicemia`.

- [ ] **Step 1: Tipos** (`tiposGlicemia.ts`)

```ts
import type { NivelAlerta, RegraParametros } from '../tipos';
import type { MomentoGlicemia } from '@core/perfil/tipos'; // ⚠ só o tipo: `import type` não viola a regra de isolamento (verificar teste sem-dependencias; se falhar, duplicar o union aqui)

export type SintomaGlicemia = 'tremor' | 'sudorese' | 'tontura' | 'fraqueza' | 'confusao' | 'sede_intensa' | 'nausea' | 'vomito' | 'dor_abdominal' | 'respiracao_rapida' | 'sonolencia' | 'precisou_de_ajuda' | 'nenhum' | 'outro';
export interface MedidaGlicemia { id: string; medidoEm: string; mgdl: number; momento: MomentoGlicemia; contexto: { refeicao?: 'nao_registrar' | 'pequena' | 'habitual' | 'maior'; medicamento?: { nome?: string; dose?: string; horario?: string }; atividadeFisica?: boolean; sintomas?: SintomaGlicemia[] } }
export interface Metas { origem: 'medico' | 'outro_profissional' | 'diretriz'; perfil: 'adulto' | 'idoso_comprometido' | 'idoso_muito_comprometido' | 'medico'; jejumMin: number; jejumMax: number; posMax: number | null; deitarMin: number; deitarMax: number; regraId: string | null }
export type CamadaGlicemia = 'hipo_n3' | 'hiper_sintoma' | 'hipo_n2' | 'hiper' | 'hipo_n1' | 'fora_da_meta' | 'na_meta' | 'sem_diabetes_convite' | 'sem_diabetes_contexto' | 'sem_diabetes_normal';
export interface AvaliacaoGlicemia { camada: CamadaGlicemia; nivel: NivelAlerta | null; mensagem: string; foraDaMeta: 'acima' | 'abaixo' | null; regraId: string | null }
export type ModeloPlano = { id: 'dm1_sem_sensor' | 'dm2_basal' | 'dm2_intensiva' | 'dm2_sem_insulina'; rotulo: string; descricao: string; momentos: MomentoGlicemia[]; fonte: string };
export interface ResumoGlicemia { n: number; media: number | null; mediaJejum: number | null; mediaPre: number | null; mediaPos2h: number | null; menor: MedidaGlicemia | null; maior: MedidaGlicemia | null; abaixoDaMeta: number; acimaDaMeta: number; episodiosBaixos: number; episodiosAltos: number }
export interface ParametrosGlicemia {
  metas: Record<'adulto' | 'idoso_comprometido' | 'idoso_muito_comprometido', { jejum: [number, number]; pos: number | null; deitar: [number, number]; regra: RegraParametros }>;
  hipoN1: { min: number; max: number; regra: RegraParametros };
  hipoN2: { max: number; regra: RegraParametros };
  hipoN3: { sintomas: SintomaGlicemia[]; regra: RegraParametros };
  hiper: { min: number; regra: RegraParametros };
  hiperSintoma: { min: number; sintomas: SintomaGlicemia[]; regra: RegraParametros };
  semDiabetes: { jejumNormalMax: number; jejumPreMax: number; jejumDm: number; casualDm: number; regra: RegraParametros };
}
```
Momentos classificados: `JEJUM = ['jejum']`, `PRE = ['antes_cafe','antes_almoco','antes_jantar']`, `POS2H = ['pos_cafe_2h','pos_almoco_2h','pos_jantar_2h']`, `DEITAR = ['antes_dormir']`; os demais não comparam com meta.

- [ ] **Step 2: Testes** (`glicemia.test.ts`) — fixtures espelhando a semente (9 regras). Casos obrigatórios:
  - `metasPara`: sem diabetes → `null`; com diabetes sem metas do médico e perfil `adulto` → `{ jejumMin: 80, jejumMax: 130, posMax: 180, deitarMin: 90, deitarMax: 150, origem: 'diretriz' }`; perfil `idoso_muito_comprometido` → `posMax: null`; metas do médico prevalecem (`origem: 'medico'`).
  - `avaliarGlicemia` (com diabetes, metas adulto): 69 → `hipo_n1` amarelo · 54 → `hipo_n1` · 53 → `hipo_n2` laranja · 60 + `confusao` → `hipo_n3` vermelho · 45 + `precisou_de_ajuda` → vermelho · 250 jejum → `fora_da_meta` (acima), **sem** nível laranja · 251 → `hiper` laranja · 251 + `vomito` → `hiper_sintoma` vermelho · 110 jejum → `na_meta` · 140 jejum → `fora_da_meta` acima · 75 jejum → `fora_da_meta` abaixo (não é hipo: ≥ 70) · 170 `pos_almoco_2h` → na meta · 190 `pos_almoco_2h` → acima · 150 `aleatoria` → `na_meta` com `foraDaMeta: null` (momento sem meta).
  - Sem diabetes: 126 jejum → `sem_diabetes_convite`, nível `null` · 200 `aleatoria` com sintomas de hiper → convite · 110 jejum → `sem_diabetes_contexto` · 92 jejum → `sem_diabetes_normal` · 53 → `hipo_n2` laranja (hipo vale para todos).
  - `modelosPlano('dm1','intensiva')` → `dm1_sem_sensor` (momentos antes das refeições + antes de dormir); `('dm2','basal')` → `dm2_basal` (jejum); `('dm2','intensiva')` → `dm2_intensiva`; `('dm2','nao')` → `dm2_sem_insulina` com `momentos: []`.
  - `resumoGlicemia`: médias por grupo, contagem abaixo/acima da meta (só momentos com meta), episódios < 70 e > 250.

- [ ] **Step 3: Implementar** `parametrosGlicemia.ts` (mesmo padrão de `parametros.ts`, por `condicao.camada` e `condicao.perfil`) e `glicemia.ts`:

```ts
const JEJUM = ['jejum'], PRE = ['antes_cafe', 'antes_almoco', 'antes_jantar'], POS2H = ['pos_cafe_2h', 'pos_almoco_2h', 'pos_jantar_2h'], DEITAR = ['antes_dormir'];

export function metasPara(perfil, p): Metas | null {
  if (!perfil.temDiabetes) return null;
  const m = perfil.metasGlicemia;
  if (m && m.definidasPor !== 'diretriz') return { origem: m.definidasPor, perfil: 'medico', jejumMin: m.jejumMin, jejumMax: m.jejumMax, posMax: m.posMax, deitarMin: m.deitarMin, deitarMax: m.deitarMax, regraId: null };
  const t = p.metas[perfil.perfilMetaGlicemica ?? 'adulto'];
  return { origem: 'diretriz', perfil: perfil.perfilMetaGlicemica ?? 'adulto', jejumMin: t.jejum[0], jejumMax: t.jejum[1], posMax: t.pos, deitarMin: t.deitar[0], deitarMax: t.deitar[1], regraId: t.regra.id };
}

export function avaliarGlicemia(m, perfil, metas, p): AvaliacaoGlicemia {
  const s = m.sintomas ?? [];
  const r = (camada, regra, foraDaMeta = null) => ({ camada, nivel: regra.nivelAlerta, mensagem: regra.mensagemPaciente, foraDaMeta, regraId: regra.id });
  // Ordem: emergências → laranja → amarelo → meta/contexto (hierarquia de segurança §66)
  if (m.mgdl < 70 && s.some((x) => p.hipoN3.sintomas.includes(x))) return r('hipo_n3', p.hipoN3.regra);
  if (m.mgdl >= p.hiperSintoma.min && s.some((x) => p.hiperSintoma.sintomas.includes(x))) return r('hiper_sintoma', p.hiperSintoma.regra);
  if (m.mgdl <= p.hipoN2.max) return r('hipo_n2', p.hipoN2.regra);
  if (m.mgdl >= p.hiper.min) return r('hiper', p.hiper.regra);
  if (m.mgdl >= p.hipoN1.min && m.mgdl <= p.hipoN1.max) return r('hipo_n1', p.hipoN1.regra);
  if (!perfil.temDiabetes) {
    const sd = p.semDiabetes;
    const jejum = JEJUM.includes(m.momento);
    if ((jejum && m.mgdl >= sd.jejumDm) || (!jejum && m.mgdl >= sd.casualDm)) return { camada: 'sem_diabetes_convite', nivel: null, mensagem: sd.regra.mensagemPaciente, foraDaMeta: null, regraId: sd.regra.id };
    if (jejum && m.mgdl > sd.jejumNormalMax) return { camada: 'sem_diabetes_contexto', nivel: null, mensagem: sd.regra.mensagemPaciente, foraDaMeta: null, regraId: sd.regra.id };
    return { camada: 'sem_diabetes_normal', nivel: null, mensagem: '', foraDaMeta: null, regraId: null };
  }
  if (!metas) return { camada: 'na_meta', nivel: null, mensagem: '', foraDaMeta: null, regraId: null };
  const faixa = JEJUM.includes(m.momento) || PRE.includes(m.momento) ? [metas.jejumMin, metas.jejumMax] : POS2H.includes(m.momento) && metas.posMax != null ? [0, metas.posMax] : DEITAR.includes(m.momento) ? [metas.deitarMin, metas.deitarMax] : null;
  if (!faixa) return { camada: 'na_meta', nivel: null, mensagem: '', foraDaMeta: null, regraId: metas.regraId };
  const fora = m.mgdl < faixa[0] ? 'abaixo' : m.mgdl > faixa[1] ? 'acima' : null;
  return { camada: fora ? 'fora_da_meta' : 'na_meta', nivel: null, mensagem: fora ? `Este valor está ${fora} da sua meta para este momento (${faixa[0] > 0 ? `${faixa[0]}–` : 'até '}${faixa[1]}).` : 'Dentro da sua meta para este momento.', foraDaMeta: fora, regraId: metas.regraId };
}
```
(`modelosPlano` e `resumoGlicemia` conforme os testes; textos dos modelos citam "SBD 2026 — Monitorização, R5/R9/R10/R8".)

- [ ] **Step 4: Verde, commit** — `feat(cardio): regras de glicemia — metas SBD 2026, camadas hipo/hiper, plano (C-012)`.

---

## Task 3: `dadoRecente.ts`, `checkup.ts`, `agravantes.ts`, `ckdEpi.ts` (TDD)

**Files:**
- Create: `src/core/regras/cardio/{parametrosRisco,dadoRecente,checkup,agravantes,ckdEpi}.ts` e testes correspondentes em `__tests__/`.

**Interfaces:**
- `extrairParametrosRisco(regras): ParametrosRisco` (`categorias`, `elegibilidade`, `cac`, `dadoRecente`).
- `estadoDoDado(tipo: 'pa_mrpa'|'pa_casual'|'peso'|'lipidios'|'renal'|'hba1c'|'rac'|'risco', data: string | null, hoje: string, p): 'atual'|'antigo'|'faltando'` — `pa_casual` recebe também `n` (≥ `pa_casual_min`).
- `montarEntradasPrevent(fontes: FontesPrevent, hoje, p): EntradaPrevent[]` onde cada entrada = `{ chave, rotulo, valor, unidade, data, origem: 'perfil'|'medida'|'exame'|'medicacao'|'digitado', estado }` para: idade, sexo, colesterolTotal, hdl, pas, antiHipertensivo, estatina, diabetes, tabagismo, imc, tfg (ou creatinina), hba1c?, rac?.
- `avaliarCheckup(fontes, perfil, hoje, p): { itens: { chave, rotulo, atualizado, frase }[]; total: 8; atualizados: number }` — chaves: `pa, peso, tabagismo, glicemia_hba1c (só se diabetes; senão conta como atualizado com frase "não se aplica"), lipidios, renal, atividade, risco`.
- `LISTA_AGRAVANTES: { id: AgravanteCV; rotulo: string; detalhe: string }[]` (Tabela 4.3, textos leigos) · `temAgravante(itens): boolean`.
- `ckdEpi2021(creatininaMgDl, idade, sexo): number` — sem raça: `142 × min(Scr/κ, 1)^α × max(Scr/κ, 1)^-1.200 × 0.9938^idade × (1.012 se feminino)`, κ = 0,7 (F) / 0,9 (M), α = −0,241 (F) / −0,302 (M).

- [ ] **Step 1: Testes** — cada janela nos dois lados do limite (ex.: lipídios 364 dias → atual, 366 → antigo; peso 30 → atual, 31 → antigo, 91 → faltando; PA casual com 2 medidas em 7 dias → faltando, 3 → atual; MRPA 30 dias → atual, 31 → faltando); `avaliarCheckup` 0/8 e 8/8 e "sem diabetes → glicemia não se aplica"; CKD-EPI: mulher 50 anos Scr 0,8 → 91 (±1); homem 65 anos Scr 1,2 → 67 (±1); homem 40 anos Scr 0,9 → 106 (±1) (valores da calculadora NKF).

- [ ] **Step 2: Implementar, verde, commit** — `feat(cardio): dado recente (C-014), check-up (§24), agravantes (Tabela 4.3) e CKD-EPI 2021`.

---

## Task 4: PREVENT — coeficientes e equações (TDD) — **depende dos PDFs**

**Files:**
- Create: `src/core/regras/cardio/prevent.coeficientes.ts`, `src/core/regras/cardio/prevent.ts`, `src/core/regras/cardio/__tests__/prevent.test.ts`
- Modify: `docs/nero/referencias/REFERENCIAS.md` (mover os PDFs de "A obter" para a tabela principal, com "Última verificação")

**Interfaces:**
- `calcularPrevent(e: EntradasPrevent): { ascvd10: number; ascvd30: number | null; modelo: 'prevent_base'|'prevent_hba1c'|'prevent_rac'|'prevent_hba1c_rac'; versaoCoeficientes: 'khan-2024-suppl' }` com `EntradasPrevent = { sexo: 'feminino'|'masculino'; idade: number; colesterolTotal: number (mg/dL); hdl: number (mg/dL); pas: number; antiHipertensivo: boolean; estatina: boolean; diabetes: boolean; tabagismoAtual: boolean; imc: number; tfg: number; hba1c?: number; rac?: number }`.
- `categoriaPrevent(ascvd10, p): 'baixo'|'intermediario'|'alto'` · `elegivelPrevent(perfil: { idade; eventoCvPrevio }, p): { ok: boolean; motivo: 'idade'|'evento_previo'|null }`.

- [ ] **Step 1: Pré-condição** — verificar `ls docs/nero/referencias/pdf/2024-AHA-PREVENT-*`. Se ausentes, **pular para a Task 5** e registrar no roadmap "Task 4 pendente dos PDFs".

- [ ] **Step 2: Transcrever coeficientes** — do suplemento de Khan 2024 (Supplemental Tables com os coeficientes por sexo, para o desfecho **ASCVD**, horizontes 10 e 30 anos, modelos base / +HbA1c / +UACR / +ambos), para `prevent.coeficientes.ts` no formato:

```ts
export const VERSAO_COEFICIENTES = 'khan-2024-suppl';
export type ModeloPrevent = 'prevent_base' | 'prevent_hba1c' | 'prevent_rac' | 'prevent_hba1c_rac';
export interface Coeficientes { intercepto: number; idade: number; naoHdl: number; hdl: number; pasBaixa: number; pasAlta: number; diabetes: number; tabagismo: number; tfgBaixa: number; tfgAlta: number; antiHipertensivo: number; estatina: number; antiHipertensivoXpasAlta: number; estatinaXnaoHdl: number; idadeXnaoHdl: number; idadeXhdl: number; idadeXpasAlta: number; idadeXdiabetes: number; idadeXtabagismo: number; idadeXtfgBaixa: number; imc?: number; hba1c?: number; hba1cSemDiabetes?: number; rac?: number }
export const COEFICIENTES: Record<ModeloPrevent, Record<'feminino' | 'masculino', Record<'10' | '30', Coeficientes>>> = { /* transcrição linha a linha, comentando a tabela e a página de origem */ };
```
Transformações das variáveis (Khan 2024, Methods): idade `(idade − 55)/10`; não-HDL `(CT − HDL) × 0,02586 − 3,5` (mmol/L); HDL `(HDL × 0,02586 − 1,3)/0,3`; PAS `(min(PAS,110) − 110)/20` e `(max(PAS,110) − 130)/20`; TFG `(min(TFG,60) − 60)/−15` e `(max(TFG,60) − 90)/−15`; IMC `(IMC − 25)/5` (só no modelo de IC — **conferir no suplemento se entra no ASCVD**; se não entrar, remover `imc` do tipo); HbA1c `HbA1c − 5,3` com termo separado para sem diabetes; RAC `log(RAC)` centrado conforme a tabela. Risco = `e^logit / (1 + e^logit) × 100`. **Revisar a transcrição duas vezes** (segunda leitura em ordem inversa).

- [ ] **Step 3: Testes contra a calculadora da AHA** — abrir https://professional.heart.org/en/guidelines-and-statements/prevent-calculator, gerar **≥ 6 casos** (mulher e homem; base e com HbA1c/RAC; 10 e 30 anos; um caso de cada categoria) e fixar em `prevent.test.ts` com tolerância ±0,1 ponto percentual. Casos de elegibilidade 29/30/79/80 e evento prévio. Categorias 4,9/5/19,9/20.

- [ ] **Step 4: Verde, REFERENCIAS.md, commit** — `feat(cardio): equações PREVENT (ASCVD 10/30 anos) com coeficientes do suplemento de Khan 2024 (C-013)`.

---

## Task 5: Serviços com Supabase e hooks

**Files:**
- Create: `src/core/cardio/tiposExames.ts`, `src/core/cardio/glicemia.ts`, `src/core/cardio/examesCardio.ts`, `src/core/cardio/riscoCv.ts`, `src/core/cardio/linhaDoTempo.ts`, `src/core/cardio/useGlicemia.ts`, `src/core/cardio/useExamesCardio.ts`, `src/core/cardio/useRiscoCv.ts`, `src/core/cardio/useCheckup.ts`, `src/core/cardio/useLinhaDoTempo.ts`, `src/core/cardio/__tests__/tiposExames.test.ts`
- Modify: `src/core/cardio/mapeamento.ts` (`linhaParaGlicemia`, `linhaParaExame`), `src/core/cardio/lembretesCardio.ts` (`agendarLembretesGlicemia`), `src/core/cardio/resumoHome.ts`

**Interfaces:**
- `tiposExames.ts`: `TIPOS_LAB: { tipo: TipoLab; rotulo: string; unidade: string; chavePrevent?: 'colesterolTotal'|'hdl'|'creatinina'|'tfg'|'hba1c'|'rac'|'lpa'|'pcr_us' }[]` (lista fechada da spec §4.4) · `TIPOS_CARDIO: { tipo: TipoCardio; rotulo: string }[]` · `rotuloExame(tipo)`.
- `glicemia.ts`: `listarGlicemia(userId, { desde?, limite? })` · `inserirGlicemia(userId, { medidoEm; mgdl; momento; contexto; observacao? })`.
- `examesCardio.ts`: `listarExamesCardio(userId, { categoria?, tipo?, desde? })` · `inserirExame(userId, { categoria; tipo; dataRealizacao; resultado; instituicao?; solicitante?; observacoes? })` · `ultimoPorTipo(userId, tipos[]): Record<tipo, ExameCardio | null>`.
- `riscoCv.ts`: `montarFontesPrevent(userId): Promise<FontesPrevent>` (perfil + última MRPA válida ≤ 30 d ou casuais 7 d + últimos exames por tipo + último peso + medicações ativas por classe — classe inferida por lista de nomes em `tiposExames.ts`? **não**: pergunta na tela; guardamos a resposta em `entradas`) · `salvarRisco(userId, resultado, entradas, agravantes)` · `ultimoRisco(userId)`.
- `linhaDoTempo.ts`: `montarLinhaDoTempo(userId): Promise<{ ano: number; itens: { data; tipo: 'exame'|'pa'|'glicemia'|'risco'|'mrpa'|'peso'; titulo; valor }[] }[]>` — agrega PA e glicemia por mês (média), exames e riscos individuais, MRPAs concluídas.
- `lembretesCardio.agendarLembretesGlicemia(userId, plano)`: um por horário do plano, 7 dias, `titulo = glicemia:<momento>:<HH:MM>`, texto "Glicemia — <rótulo do momento>." (§22).
- `resumoHome.ts`: `ResumoCardio += { glicemia: { mgdl; medidoEm; nivel: 'laranja'|'vermelho'|null } | null; planoHoje: { momento; hora }[] (horários do plano ainda sem medida hoje); checkup: { atualizados; total; faltante: string | null } | null }`.

- [ ] Implementar seguindo o padrão de `medidas.ts`/`sessoesMrpa.ts`; testes só para funções puras (`tiposExames`, mapeamentos). Commit — `feat(cardio): serviços de glicemia, exames, risco, linha do tempo e lembretes de glicemia`.

---

## Task 6: Telas de glicemia (index, registrar, plano, relatório)

**Files:** `src/modules/coracao/conteudo/glicemia.ts`, `src/modules/coracao/componentes/{LeituraGlicemia,LinhaGlicemia}.tsx`, `app/(app)/coracao/glicemia/{index,registrar,plano,relatorio}.tsx`

- [ ] Reler `03-DESIGN.md`. `LeituraGlicemia` = mesmo padrão tipográfico de `LeituraPA` ("103" grande + "mg/dL" discreto).
- [ ] `index.tsx`: resumo 7 dias (média jejum / pós), metas visíveis com origem ("meta da diretriz SBD 2026 — confirme com seu médico" ou "definida pelo seu médico"), lista `LinhaGlicemia` (data/hora, momento, valor, chips de contexto; chip de cor **só** quando `nivel` ≠ null), botões "Registrar", "Meu plano", "Relatório". Sem diabetes no perfil: sem bloco de metas; texto da regra `sem_diabetes` no rodapé.
- [ ] `registrar.tsx`: momento (`Select` com os 17 do §5), valor, data/hora, opcionais do §6 (refeição, medicamento/insulina, atividade, sintomas — lista ampliada da spec), observação. Resultado inline após salvar: valor grande; chip conforme `nivel`; mensagem da regra; se `fora_da_meta` → texto sem chip; se `sem_diabetes_convite` → convite sem cor.
- [ ] `plano.tsx` (§7): "Quem definiu suas metas?" (médico / outro profissional / ainda não tenho) → se médico: campos jejum min/max, pós, deitar min/max + "Meu médico enquadrou minhas metas como" (adulto / idoso comprometido / muito comprometido, opcional); senão: mostra a Tabela 1 adulto com o rótulo. "Quem definiu seu plano de medidas?" → horários por momento; se nenhum: `modelosPlano(tipoDiabetes, usaInsulina)` como sugestões marcadas "confirme com seu médico" (pede `tipoDiabetes`/`usaInsulina` se faltarem no perfil e grava). Salvar → `perfil.metasGlicemia`/`planoGlicemia` + `agendarLembretesGlicemia`.
- [ ] `relatorio.tsx` (§8): período 7/14/30/90/personalizado; `resumoGlicemia`; tabela; gráfico de pontos por dia (reusar `GraficoBarras` com uma barra por medida? — não: criar `GraficoPontos` simples, uma coluna por dia, pontos por medida, linhas da meta); medicações do período; ressalva "organiza registros, não substitui a interpretação do médico"; "Compartilhar em PDF" em breve.
- [ ] `npm run rotas`, checks, commit — `feat(cardio): Minha Glicemia — registro, metas e plano SBD 2026, relatório (C-012)`.

---

## Task 7: Telas de Meus Exames (index, registrar, detalhe)

**Files:** `src/modules/coracao/componentes/{LinhaExame,SerieExame}.tsx`, `app/(app)/coracao/exames/{index,registrar,[id]}.tsx`

- [ ] `index.tsx` (§9): filtro Laboratoriais / Cardiológicos; lista por data (`LinhaExame`: rótulo, valor+unidade ou conclusão resumida, data, instituição); "Adicionar exame"; estado vazio convida.
- [ ] `registrar.tsx` (§10–§11): categoria → tipo (`Select`) → para lab: valor, unidade (pré-preenchida), referência min/max do laboratório (opcional); para cardio: conclusão (texto), e para `cac`: Agatston + percentil; data, instituição, solicitante, observações. "Anexar laudo" desabilitado com "em breve" (Fase 3). Vários analitos do mesmo laudo: botão "Adicionar outro exame da mesma data" mantém data/instituição.
- [ ] `[id].tsx`: detalhe + `SerieExame` (histórico do mesmo tipo: lista + `GraficoBarras` quando ≥ 2 valores); para `cac` com valor ≥ `cac.alto` ou percentil > `percentil_alto` ou ≥ `muito_alto`: chip amarelo + mensagem da regra `cac`. Para lab: nunca chip de cor (interpretação é do médico); mostra "fora da referência informada pelo laboratório" em texto quando houver referência.
- [ ] Rotas, checks, commit — `feat(cardio): Meus Exames — laboratoriais e cardiológicos com valor estruturado (§9–§11)`.

---

## Task 8: Telas de Meu Risco (index, dados, resultado, agravantes)

**Files:** `src/modules/coracao/conteudo/risco.ts`, `src/modules/coracao/componentes/{EntradaRisco,FatorRisco}.tsx`, `app/(app)/coracao/risco/{index,dados,resultado,agravantes}.tsx`

- [ ] `index.tsx` (§13/§15): último cálculo (data, ASCVD 10, categoria pelo escore) ou "Calcular agora"; se `elegivelPrevent` falha → mensagem da regra `elegibilidade` (sem cálculo); se o perfil não tem `eventoCvPrevio` → pergunta na hora e grava.
- [ ] `dados.tsx` (§14, C-014): tabela `EntradaRisco` por variável com valor, data, origem e estado (`atual` ✓ · `antigo` → "Tem exame mais recente?" [Sim → campo; Não → usa antigo com aviso] · `faltando` → campo obrigatório ou "medir agora" para PA). Medicações: "Você usa remédio para pressão?" / "Você usa estatina?" pré-marcados se houver medicação ativa (o app não classifica fármacos; o paciente confirma). Tabagismo: "Continua sem fumar?/Continua fumando?" um toque. HbA1c/RAC opcionais. "Calcular" → `calcularPrevent` → `salvarRisco` → `resultado`.
- [ ] `resultado.tsx` (§15–§16): "Seu risco cardiovascular estimado em 10 anos: X %" (display), chip de categoria **com** o rótulo "categoria pelo escore" e a mensagem da regra `categorias`; 30 anos (30–59) sem categoria + texto §4.9; frase obrigatória do §15; "O que está impactando meu risco" com `FatorRisco` (cores educativas: tabagismo, PA ≥ 130, diabetes, IMC ≥ 30, LDL vs. meta se houver, atividade física) — texto "cores educativas, não diagnóstico"; aviso de dados antigos (mensagem da regra `dado_recente`) quando houver; link para `agravantes`.
- [ ] `agravantes.tsx` (§17–§18): checklist `LISTA_AGRAVANTES` (grava `perfil.agravantesCv`); se algum marcado: frase literal do §17; bloco CAC: último exame `cac` ou botão "Registrar escore de cálcio" (→ exames/registrar com tipo pré-selecionado) + mensagem da regra `cac` quando aplicável.
- [ ] Rotas, checks, commit — `feat(cardio): Meu Risco — PREVENT com preenchimento automático, agravantes e CAC (C-013, C-014)`.

---

## Task 9: Check-up, linha do tempo, dashboard completo e Home

**Files:** `app/(app)/coracao/checkup.tsx`, `app/(app)/coracao/linha-do-tempo.tsx`, `app/(app)/coracao/index.tsx`, `src/modules/home/montarItensHoje.ts` (+ teste), `src/core/cardio/resumoHome.ts`, `src/core/cardio/useResumoCardio.ts`, `app/(app)/index.tsx`

- [ ] `checkup.tsx` (§24): "Informações atualizadas: n/8", lista com ✓/○ e frase por item faltante ("Falta atualizar seu perfil lipídico") com atalho para a tela certa; atividade física: "Chega na Fase 4 — por enquanto conta como não registrado" (sem penalizar visualmente: item cinza).
- [ ] `linha-do-tempo.tsx` (§20): agrupado por ano, itens em linhas planas com ponto neutro (sem cor de alerta), valores curtos ("LDL 87", "PA média 126/76", "HbA1c 5,6 %", "Risco 6,2 %", "MRPA concluída").
- [ ] `index.tsx`: ativar cards Glicemia (última + momento), HbA1c (último exame + mês/ano), LDL, Risco (último cálculo), Peso (último `peso`); `ListItem` "Como está minha prevenção?" ativo com "n/8"; `ListItem` "Linha do tempo".
- [ ] Home: testes novos em `montarItensHoje.test.ts` — glicemia laranja/vermelho nas últimas 24 h → item; horário do plano vencido hoje sem medida → item amarelo "Medir glicemia — antes do almoço"; check-up com faltante → item cinza "Atualizar seu perfil lipídico" (um por vez, o primeiro faltante). Implementar; `resumoHome` completa `ResumoCardio`; card do módulo na Home mostra "Glicemia 103 · Pressão 128/78" quando houver.
- [ ] Rotas, checks, commit — `feat(cardio): check-up, linha do tempo, dashboard completo e itens na Home (§19–§20, §24)`.

---

## Task 10: Documentação, revisão clínica, checklist, nuvem e merge

- [ ] `docs/nero/revisao/2026-09-XX-revisao-textos-cardio-2b.md` — todas as mensagens da semente (glicemia, risco), textos de `conteudo/glicemia.ts` e `conteudo/risco.ts`, rótulos dos agravantes, frases do check-up e da linha do tempo.
- [ ] `docs/nero/checklists/fase-2b.md` — fluxos do critério de pronto 2b da spec + percursos das Tasks 6–9.
- [ ] `docs/nero/funcionamento/coracao-metabolismo.md` §3–§5 — blocos "Implementado em … — arquivos" e ajustes de execução; §6 (exames, linha do tempo, check-up) preenchido.
- [ ] Nuvem: semear as 13 regras novas (bloco Fase 2 do `seed.sql` via `psql` com `SUPABASE_DB_PASSWORD`/`PGPASSWORD` fornecida pelo Murilo na hora — não gravar em arquivo) e conferir `select programa, count(*) … where modulo='cardio'` = pressao 7 · glicemia 9 · risco_cv 4.
- [ ] Checklist do Murilo → correções → merge de `nero-fase2b-glicemia-risco` (e da 2a, se ainda não mesclada) em `desenvolvimento-2` → push → roadmap (Fase 2 concluída; pendências: PDF na Fase 3, atividade física na Fase 4).

---

## Autorrevisão do plano

- **Cobertura da spec (2b):** §5–§8 glicemia (T2, T5, T6) · §9–§11 exames (T5, T7) · §13–§18 PREVENT, dados, resultado, agravantes, CAC (T3, T4, T5, T8) · §19 dashboard completo, §20 linha do tempo, §24 check-up (T9) · §22 lembretes de glicemia (T5, T6) · semente/regras (T1) · docs/checklist/nuvem/merge (T10). §26 (relatório para o médico em PDF) segue para a Fase 3, como a spec define.
- **Placeholders:** nenhum "TBD"; a única lacuna deliberada são os valores numéricos dos coeficientes do PREVENT, que **só podem** vir do suplemento (Global Constraints: bloqueio conhecido).
- **Consistência de nomes:** `metasPara`, `avaliarGlicemia`, `modelosPlano`, `resumoGlicemia` (T2) usados em T5–T6, T9; `estadoDoDado`, `montarEntradasPrevent`, `avaliarCheckup`, `LISTA_AGRAVANTES`, `temAgravante`, `ckdEpi2021` (T3) usados em T5, T8–T9; `calcularPrevent`, `categoriaPrevent`, `elegivelPrevent` (T4) usados em T5, T8; serviços/hooks (T5) usados em T6–T9.
