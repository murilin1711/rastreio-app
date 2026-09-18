# NERO — Fase 4: Saúde & Bem-estar — Spec Técnica

**Data:** 18/09/2026 · **Status:** em revisão pelo Murilo
**Base:** `docs/nero/01-ESPECIFICACAO-NERO.md` §69–§88 · Decisões clínicas **C-015 a C-020** e técnica **D-011** em `docs/nero/02-DECISOES.md` (aprovadas em 18/09/2026) · Acervo: `docs/nero/referencias/REFERENCIAS.md` (Fase 4) · Funcionamento: `docs/nero/funcionamento/saude-bem-estar.md` (a preencher na execução) · Fases anteriores: `2026-09-17-nero-fase2-cardio-design.md` (mesmo padrão de motor/regras), `2026-09-17-nero-fase3-minha-saude-relatorios-design.md` (relatórios).
**Entrega:** dois planos (4a Meu Corpo + Atividade + Sono; 4b Alimentação + conexão + metas/hábitos/check-in + relatório), um checklist, um merge.

---

## 1. Objetivo

Entregar o quarto módulo: acompanhamento longitudinal de **corpo, alimentação, atividade física, sono, hábitos e metas** (§69), sem virar contador de calorias nem ferramenta estética. O foco é "como meus hábitos e meu corpo estão evoluindo ao longo do tempo".

**Critério de pronto:** o paciente registra peso 82 kg / altura 170 / cintura 96 → vê IMC 28,4 "sobrepeso (OMS)", RCA 0,56 "acima de 0,5", cintura "≥ 90 cm (referência IDF para sul-americanos)", tudo sem cor, com "Entenda cada medida"; três meses de pesos → gráfico, "tendência de redução", "−4,9 % desde 01/06"; informa PMAV 95 kg → "13,7 % abaixo do peso máximo: faixa de obesidade controlada (ABESO 2026)"; registra caminhada 40 min moderada e musculação 50 min → "Sua semana: 90 de 150 min · fortalecimento 1 de 2 dias"; registra sono 23:40 → 06:20 → média 7 dias "6h40 — abaixo das 7 h"; registra almoço 12:30 e glicemia 14:35 → app pergunta "relacionada ao almoço das 12:30?" → Sim → relatório mostra os dois juntos; faz o check-in semanal → "Meus hábitos" mostra os 7 dias; gera "Relatório de Saúde & Hábitos" em PDF com a mesma central da Fase 3; Home mostra a atividade da semana e o card do módulo sai de "em breve".

## 2. Fora de escopo

Contagem de calorias e banco de alimentos · foto da refeição (fica para depois; a tabela já tem `documento_id` opcional) · importação de wearables/HealthKit/Google Fit · diagnóstico de insônia/apneia · rastreio de transtornos alimentares ou psiquiátricos · classificação de alimentos em bom/ruim · metas de peso impostas pelo app (§82) · calculadora de gasto calórico · lado profissional.

## 3. Princípios

1. **Mostra evolução, não julga** (§69, §73, §76): nenhuma mensagem de "você comeu errado", "emagrecer é bom"; textos educativos, sem cor de alerta clínico nas medidas corporais (C-015/C-016). A única exceção de Home é a perda de peso não intencional (C-019, cinza).
2. **Parâmetros em `regras_clinicas`, lógica pura em TS** (D-003): faixas de IMC, cortes de cintura/RCA/RCQ, meta de atividade, referência de sono, marcos do PMAV e a regra de tendência ficam em linhas do programa `bem_estar` e são lidos por `extrairParametrosBemEstar`.
3. **Reutilizar `medidas`** (D-011): peso/cintura/quadril/composição/sono na tabela existente; PREVENT e check-up continuam lendo `peso` de onde leem.
4. **Nada de meta automática de peso** (§82): o usuário escolhe redução / manutenção / aumento / sem meta; o app registra a meta e mostra distância, sem prazo sugerido.
5. **Conexão com glicemia é opcional e confirmada pelo usuário** (C-020): o app pergunta, nunca vincula sozinho.
6. Antes das telas, reler `03-DESIGN.md` (skill `frontend-design`). Cor do módulo: verde `#15803D → #5FCB8A` (capa já definida na Home). Gráficos: um indicador por gráfico (§73), reaproveitando `GraficoPontos`/`GraficoBarras` do cardio.

## 4. Modelo de dados — migração `0012_bem_estar.sql`

### 4.1 `medidas` (existente) — tipos e formatos
| tipo | `valores` | `contexto` |
|---|---|---|
| `peso` | `{ kg: 82.4, metodo?: 'balanca' \| 'bioimpedancia' \| 'profissional' \| 'outro' }` | — |
| `cintura` | `{ cm: 96 }` | `{ tecnica_confirmada?: boolean }` |
| `quadril` | `{ cm: 102 }` | — |
| `composicao` | `{ gordura_pct?, massa_gordura_kg?, massa_magra_kg?, massa_muscular_kg?, agua_pct?, gordura_visceral?, tmb_kcal?, metodo: 'bioimpedancia' \| 'dexa' \| 'profissional' \| 'outro' }` | — |
| `sono` | `{ dormiu_em: ISO, acordou_em: ISO, minutos: 400, qualidade?: 1..5 }` | `{ acordou_noite?, cochilou?, dificuldade_adormecer?, acordou_descansado? }` (booleanos) |
Sem alteração de schema em `medidas`. Comentário da coluna atualizado.

### 4.2 `perfil_saude` — colunas novas
```sql
alter table public.perfil_saude
  add column peso_maximo_vida_kg numeric(5,1) check (peso_maximo_vida_kg is null or peso_maximo_vida_kg between 20 and 400),
  add column objetivo_peso text check (objetivo_peso in ('reducao','manutencao','aumento','sem_meta'));
```
`objetivo_peso` nulo = ainda não escolheu (a tela pergunta uma vez).

### 4.3 `refeicoes` (§74–§75)
```sql
create table public.refeicoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  em timestamptz not null,
  tipo text not null check (tipo in ('cafe','lanche','almoco','lanche_tarde','jantar','ceia','outra')),
  descricao text not null,
  quantidade text check (quantidade in ('pequena','habitual','grande')),
  fome_antes smallint check (fome_antes between 0 and 10),
  saciedade text check (saciedade in ('com_fome','satisfeito','muito_cheio')),
  local text check (local in ('casa','trabalho','restaurante','outro')),
  observacao text,
  documento_id uuid references public.documentos(id) on delete set null, -- foto (futuro)
  created_at timestamptz not null default now()
);
create index refeicoes_user_em_idx on public.refeicoes (user_id, em desc);
```

### 4.4 `atividades` (§77)
```sql
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio timestamptz not null,
  tipo text not null check (tipo in ('caminhada','corrida','ciclismo','musculacao','natacao','esporte_coletivo','danca','funcional','pilates','yoga','outra')),
  duracao_min integer not null check (duracao_min between 1 and 720),
  intensidade text not null check (intensidade in ('leve','moderada','vigorosa')),
  distancia_km numeric(6,2),
  fc_media integer check (fc_media is null or fc_media between 30 and 250),
  calorias integer,
  observacao text,
  created_at timestamptz not null default now()
);
create index atividades_user_inicio_idx on public.atividades (user_id, inicio desc);
```

### 4.5 `checkins` (§86–§87)
```sql
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semana date not null,              -- segunda-feira da semana
  disposicao smallint check (disposicao between 0 and 10),
  alimentacao smallint check (alimentacao between 0 and 10),
  atividade smallint check (atividade between 0 and 10),
  sono smallint check (sono between 0 and 10),
  estresse smallint check (estresse between 0 and 10),
  energia smallint check (energia between 0 and 10),
  bem_estar smallint check (bem_estar between 0 and 10),
  observacao text,
  created_at timestamptz not null default now(),
  unique (user_id, semana)
);
```

### 4.6 `metas` (§79, §82)
```sql
create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('peso','cintura','atividade_min','atividade_dias','fortalecimento_dias','sono_min','pressao')),
  valor numeric not null,
  origem text not null check (origem in ('app','usuario','profissional')),
  detalhe text,                      -- ex.: 'musculacao' para atividade_dias
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index metas_user_ativas_idx on public.metas (user_id) where ativa;
```
Uma meta ativa por tipo (constraint parcial `unique (user_id, tipo) where ativa`).

### 4.7 `vinculos_glicemia` (§81, C-020)
```sql
create table public.vinculos_glicemia (
  glicemia_id uuid not null references public.medidas(id) on delete cascade,
  refeicao_id uuid references public.refeicoes(id) on delete cascade,
  atividade_id uuid references public.atividades(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (glicemia_id),
  check (refeicao_id is not null or atividade_id is not null)
);
```
Uma glicemia pode vincular refeição e/ou atividade. RLS pelo dono da medida (subselect em `medidas`).

### 4.8 `regras_clinicas` — programa `bem_estar`
`alter` no check de `programa` para incluir `'bem_estar'`. Semente (`supabase/seed.sql`), todas `modulo = 'bem_estar'`, `versao '2026.3'`, `revisada_em '2026-09-18'`:

| `exame_tipo` | `condicao` | `mensagem_paciente` (resumo) | `fonte` |
|---|---|---|---|
| `imc` | `{camada:'faixas', baixo:18.5, sobrepeso:25, obesidade_1:30, obesidade_2:35, obesidade_3:40}` | texto do §71 ("O IMC é uma ferramenta…") | ABESO 2016, Tabela 4 (OMS) |
| `imc` | `{camada:'idoso', idade_min:60, baixo:22, alto:27}` | "A partir dos 60 anos, o Ministério da Saúde considera 22 a 27 a faixa de referência…" | ABESO 2016 (MS), Rec. 1C |
| `cintura` | `{camada:'cintura', h_aumentado:90, m_aumentado:80, h_muito:102, m_muito:88}` | "Para sul-americanos, a referência da IDF é abaixo de 90 cm (homens) e 80 cm (mulheres)…" | ABESO 2016 Tabela 5 (IDF) · DBHA 2025 (NCEP) |
| `cintura` | `{camada:'rca', limite:0.5}` | "A cintura deve ser menor que a metade da altura…" | ABESO 2016 Rec. 1F · ABESO 2026 R5 |
| `cintura` | `{camada:'rcq', h:0.90, m:0.85}` | "Relação cintura/quadril acima de 0,90 (homens) ou 0,85 (mulheres) indica maior acúmulo de gordura central…" | OMS 2011, Tabela A1 |
| `cintura` | `{camada:'tecnica'}` | texto da técnica (ponto médio, fim da expiração, fita não elástica) | OMS 2008/2011 · ABESO 2016 |
| `atividade` | `{camada:'meta', moderada_min:150, moderada_max:300, vigorosa_min:75, vigorosa_max:150, fator_vigorosa:2, fortalecimento_dias:2, idoso_idade:60, equilibrio_dias:3}` | "A OMS e o Guia do Ministério da Saúde recomendam…"; "Qualquer atividade é melhor do que nenhuma." | OMS 2020 · Guia MS 2021 |
| `sono` | `{camada:'duracao', minimo_min:420, maximo_incerto_min:540}` | "Adultos devem dormir 7 horas ou mais por noite…" | AASM/SRS 2015 |
| `peso` | `{camada:'tendencia', minimo_medidas:3, janela_dias:14, limiar_pct:1}` | "Tendência calculada com a média das últimas duas semanas…" | decisão de produto C-019 |
| `peso` | `{camada:'pmav', imc_min:30, imc_2:40, imc_max:50, reduzida_1:5, controlada_1:10, reduzida_2:10, controlada_2:15}` | "Perda de 5 a 10 % do peso máximo é chamada de obesidade reduzida…" | ABESO 2026 R8 · e-book 2023 |
| `peso` | `{camada:'perda_nao_intencional', pct:5, meses:6}` | "Seu peso caiu X % sem meta de redução. Vale conversar com seu médico." | decisão de produto C-019 |
| `glicemia_vinculo` | `{camada:'janela', horas:3}` | "Esta glicemia está relacionada à refeição registrada às HH:MM?" | C-020 · SBD 2026 |

### 4.9 RLS, tipos, pgTAP
RLS dono nas 5 tabelas novas (padrão 0005); `vinculos_glicemia` via `exists (select 1 from medidas m where m.id = glicemia_id and m.user_id = auth.uid())`. `npm run db:types`. `supabase/tests/bem_estar.test.sql` (plan 6): A não vê refeições/atividades/checkins/metas de B; A não vincula glicemia de B; `unique (user_id, semana)` e meta ativa única funcionam.

## 5. Núcleo — `src/core/regras/bemestar/` (puro) e `src/core/bemestar/` (serviços)

### 5.1 `src/core/regras/bemestar/`
| arquivo | responsabilidade |
|---|---|
| `tipos.ts` | `ParametrosBemEstar` (todas as camadas acima com `regra` anexada), `MedidaCorporal`, `Refeicao`, `Atividade`, `Sono`, `Checkin`, `Meta`, `ResumoCorpo`, `ResumoAtividade`, `ResumoSono`, `ResumoAlimentacao`, `Habitos7d` |
| `parametros.ts` | `extrairParametrosBemEstar(regras)` no padrão de `parametrosRisco.ts` |
| `corpo.ts` | `calcularIMC` (reusa `perfil/calculos`), `faixaIMC(imc, idade, p)` → `{ faixa, rotulo, regra }` (idoso aplica a camada `idoso` além da OMS), `rca(cintura, altura)`, `classificarRCA`, `classificarCintura(cm, sexo)`, `rcq`, `classificarRCQ`, `tendenciaPeso(medidas, hoje, p)` → `'estavel' \| 'aumento' \| 'reducao' \| null`, `evolucaoPercentual(inicial, atual)`, `avaliarPMAV(pesoAtual, pmav, imc, p)` → `{ perdaPct, faixa: 'nenhuma' \| 'reduzida' \| 'controlada' \| null }`, `perdaNaoIntencional(medidas, objetivo, hoje, p)` → `{ pct, desde } \| null`, `compararPeriodos(medidas, de, ate)` (§73) |
| `atividade.ts` | `minutosQueContam(atividades, p)` (moderada + vigorosa × fator), `resumoSemana(atividades, semana, p, idade)` → totais, dias ativos, fortalecimento (musculação/funcional/pilates), equilíbrio (idoso), progresso da meta ativa; `resumo30d`; `TIPOS_FORTALECIMENTO` |
| `sono.ts` | `minutosDeSono(dormiu, acordou)`, `resumo7d(sonos, p)` → média, horários médios (média circular para dormir), `abaixoDaReferencia` |
| `alimentacao.ts` | `resumoSemana(refeicoes)` → dias com registro/7, horário médio por tipo principal (café, almoço, jantar), variação (desvio-padrão em minutos → "horários semelhantes" se ≤ 45 min; "variaram bastante" se > 90 min — texto neutro, §76) |
| `vinculos.ts` | `candidatosVinculo(glicemia, refeicoes, atividades, p)` → refeição e atividade nas últimas `horas` (C-020) |
| `habitos.ts` | `habitos7d(...)` para a tela "Meus hábitos" (§85) e `itensHomeBemEstar` (atividade da semana vs meta; check-in pendente no domingo/segunda; perda não intencional cinza) |
| `__tests__/` | fixtures + testes de cada função com os exemplos do critério de pronto e das diretrizes (IMC 28,4 → sobrepeso; 65 anos IMC 26 → "referência para idosos"; cintura 96 H → aumentado; RCA 0,56 → acima; 90 min/150; sono 6h40; PMAV 95 → 82: 13,7 % controlada; tendência com 3 medidas; perda 5 % em 6 meses sem meta) |

### 5.2 `src/core/bemestar/` (Supabase)
`medidasCorporais.ts` (listar/inserir por tipo, reutilizando `cardio/medidas.ts` onde couber) · `refeicoes.ts` · `atividades.ts` · `sono.ts` · `checkins.ts` · `metas.ts` · `vinculos.ts` · `regras.ts` (`carregarRegrasBemEstar()` = `carregarRegrasCardio` com programa `bem_estar`) · hooks `useCorpo`, `useAtividades`, `useSono`, `useAlimentacao`, `useCheckin`, `useMetas`, `useHabitos`.

### 5.3 Integrações
- **Glicemia (cardio):** `coracao/glicemia/registrar.tsx` chama `candidatosVinculo` após salvar e mostra as perguntas Sim/Não (C-020); `linhaDoTempo` e relatório mostram o vínculo.
- **PREVENT/check-up:** continuam lendo `peso`; o check-up passa a marcar "peso atualizado" com a mesma janela (já implementado).
- **Home:** `montarItensHoje` recebe `bemEstar?: { atividadeSemana, metaMin, checkinPendente, perdaNaoIntencional }`; card do módulo sai de "em breve" com subtítulo "n de 150 min esta semana".
- **Relatórios (Fase 3):** `DadosNero` ganha `bemEstar` (medidas corporais, refeições, atividades, sonos, check-ins, metas, vínculos); seções novas `corpo`, `alimentacao`, `atividade`, `sono`, `checkins`; tipo `bemestar` ("Relatório de Saúde & Hábitos", §88) com as ressalvas da Fase 3 mais "Registros de hábitos são autorrelatados"; `montarConsulta` acrescenta `corpo`/`atividade` a endocrinologia e clínica médica.
- **Linha do tempo geral:** pesos, cintura, composição, sono agregado por semana, atividades por semana, check-ins.

## 6. Telas — `app/(app)/bem-estar/**`

| Rota | Conteúdo |
|---|---|
| `index.tsx` | Dashboard "Meus hábitos" (§85): 7 dias — movimento (min/meta), sono (média), alimentação (refeições registradas), peso (último + variação vs média anterior), cintura (último + "há n dias"); atalhos para as 5 áreas, metas e check-in; card de check-in pendente. |
| `corpo/index.tsx` | Composição corporal (§72): peso, IMC + faixa, cintura, RCA, (RCQ), última composição; "Entenda cada medida"; "Registrar medidas"; período 30 d/3 m/6 m/1 a/tudo com gráficos separados (§73); "Comparar períodos"; tendência e evolução %; PMAV e objetivo de peso (§82, C-019). |
| `corpo/registrar.tsx` | Peso (obrigatório ou cintura), altura (pré-preenchida do perfil, editável), cintura, quadril, método, data; folha "Como medir a cintura" (técnica). |
| `corpo/composicao.tsx` | Bioimpedância/DEXA (§83) com o aviso literal sobre métodos; histórico. |
| `corpo/entenda.tsx` | Textos das regras (IMC, idoso, cintura, RCA, RCQ, PMAV) com fonte. |
| `atividade/index.tsx` | Sua semana (§78): total, moderada, vigorosa, dias ativos, fortalecimento, gráfico seg→dom; últimos 30 dias por tipo; meta (§79) com "usar meta sugerida" / "criar minha meta"; frase da OMS. |
| `atividade/registrar.tsx` | §77. |
| `sono/index.tsx` · `sono/registrar.tsx` | §80: registro (dormiu/acordou/qualidade/opcionais), média 7 dias, horários médios, gráfico de barras por noite, referência AASM. |
| `alimentacao/index.tsx` · `alimentacao/registrar.tsx` | §74–§76: diário simples; "Sua semana" com dias registrados e horários médios; lista por dia. |
| `metas/index.tsx` | §82: peso (com objetivo redução/manutenção/aumento/sem meta), cintura, atividade, sono; "definida com profissional"; distância atual. |
| `checkin/index.tsx` | §86–§87: 7 escalas 0–10 + texto; histórico mensal (médias). |
| `relatorio` | Reusa `minha-saude/relatorios/previa?tipo=bemestar`. |

## 7. Conteúdo
`src/modules/bem-estar/conteudo/{corpo,atividade,sono,alimentacao,checkin}.ts` — textos fixos (técnica da cintura, aviso de composição corporal §83, frase da OMS, explicações); mensagens clínicas vêm de `regras_clinicas`. Revisão em `docs/nero/revisao/2026-09-XX-revisao-textos-bem-estar.md`.

## 8. Testes
Jest: `src/core/regras/bemestar/__tests__/*` (≥ 40 casos) + `montarItensHoje` (3 itens novos) + relatórios (seções novas, `montarBemEstar`). pgTAP: `bem_estar.test.sql` (6). Snapshot do HTML do relatório de hábitos.

## 9. Ordem de implementação (base dos planos)
**Plano 4a:** (1) migração 0012 + regras + pgTAP + tipos; (2) núcleo `corpo.ts` TDD; (3) serviços + telas de Meu Corpo (registrar, composição, entenda, período/comparar, PMAV/objetivo); (4) `atividade.ts` TDD + telas + metas de atividade; (5) `sono.ts` TDD + telas; (6) dashboard "Meus hábitos" parcial + Home (card ativo, item de atividade, perda não intencional); (7) docs + checklist 4a.
**Plano 4b:** (1) `alimentacao.ts` + telas do diário; (2) `vinculos.ts` + integração no registrar glicemia + relatório; (3) metas gerais (§82) + check-in (§86–§87) + histórico; (4) "Meus hábitos" completo; (5) relatório de Saúde & Hábitos (Fase 3) + linha do tempo geral; (6) docs, revisão, checklist 4b, nuvem, merge.

## 10. Riscos
- **Média circular de horários de sono** (23:40 e 00:20 → 00:00, não 12:00): implementar com ângulos; teste dedicado.
- **Tendência com poucas medidas:** devolve `null` e a tela diz "registre mais medidas"; nunca conclui com < 3.
- **Perda não intencional** pode disparar após registro errado (ex.: 82 → 28): validação de plausibilidade no registro (peso entre 20 e 400 kg; variação > 20 % em relação à última medida pede confirmação).
- **RCA com altura desatualizada:** altura editável no registro; se mudar, grava no perfil.
- **Vínculo de glicemia** só na tela de registro do cardio — exige tocar código da Fase 2; cobrir com teste do `candidatosVinculo` e checklist manual.
