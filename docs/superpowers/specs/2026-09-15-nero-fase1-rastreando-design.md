# NERO — Fase 1: Rastreando v2 — Spec Técnica

**Data:** 15/09/2026 · **Status:** em revisão pelo Murilo
**Base:** `docs/nero/01-ESPECIFICACAO-NERO.md` §27–§53, §58 · Decisões clínicas C-001–C-009 em `docs/nero/02-DECISOES.md` (C-001, 002, 003, 004, 006, 007, 008 validadas no texto-fonte; C-005 e C-009 a validar durante a implementação) · Fundação: `2026-09-14-nero-fundacao-design.md`

---

## 1. Objetivo

Substituir a tela-ponte pelo módulo **Rastreando** completo, ligado ao Supabase e ao motor de regras: elegibilidade por perfil, cinco programas (mama, colo do útero, colorretal, pulmão, próstata) com árvores de decisão por resultado estruturado, pendências, alertas de sintomas, lembretes e linha do tempo. O módulo mantém a sequência de telas que o Murilo já conhece do Rastreando v1 (escolher câncer → hub → "preciso rastrear?" / exames / sinais) com a lógica agora vinda do motor e da tabela `regras_clinicas`.

**Critério de pronto:** um paciente com perfil preenchido abre Rastreando e vê só os programas aplicáveis com o status certo (§28); registra uma mamografia BI-RADS 3 e o app cria controle em 6 meses; registra FIT positivo e o app abre pendência e bloqueia FIT de rotina; registra a colonoscopia ligada àquela pendência e ela fecha; marca um sintoma de alarme e o calendário é sobreposto pela orientação de procurar avaliação; a Home mostra as pendências do Rastreando. Toda regra tem `regra_id`/`versao` gravados no exame.

## 2. Fora de escopo

Relatório PDF de rastreamento (§40 — Fase 3) · notificações push remotas (lembretes ficam **no app + notificação local**) · anexar laudo/imagem ao exame (Storage — Fase 3; o campo `anexos` fica vazio) · Cardio e Bem-estar · reclassificação de risco por Lp(a)/agravantes (cardio) · conteúdo educativo extenso (textos curtos, revisados pelo Murilo).

## 3. Princípios que governam esta fase

1. **Aderência integral às diretrizes brasileiras** (princípio registrado em `02-DECISOES.md`): cada linha de `regras_clinicas` cita fonte, ano, versão e recomendação numerada quando houver. **As referências vivem em `docs/nero/referencias/` (`REFERENCIAS.md`); antes de codificar cada handler, checar se há versão mais nova e usar sempre a mais recente.**
2. **Hierarquia de segurança (§66)** aplicada antes de qualquer cálculo — já implementada em `src/core/regras/seguranca.ts`.
3. **Dado ≠ alerta ≠ conduta (§25):** o app classifica e orienta; nunca escreve diagnóstico. Frases proibidas: "você tem câncer", "seu PSA indica câncer".
4. **Resultado estruturado sempre que existir classificação** (BI-RADS, Lung-RADS, FIT, DNA-HPV, citologia Bethesda, achados de colonoscopia); texto livre é complemento.
5. **Uma fonte de dados:** sexo, idade, colo do útero, tabagismo, HIV/imunossupressão, DII, história pessoal/familiar vêm do Perfil de Saúde; o módulo só pergunta o que ainda não está lá e grava de volta no perfil.

## 4. Mudanças no modelo de dados

### 4.1 `perfil_saude` — campos novos (migração 0008)

| coluna | tipo | motivo |
|---|---|---|
| `ja_teve_atividade_sexual` | boolean | INCA Rec. 36 — sem atividade sexual não rastreia colo |
| `raca_cor` | text check in ('branca','preta','parda','amarela','indigena','nao_informar') | SBU — negros iniciam decisão compartilhada aos 45 |
| `menopausa` | boolean | INCA Rec. 32–33 (atrofia/citologia reflexa) — informativo |

Peso já vive em `medidas` (IMC calculado para SBU/obesidade).

### 4.2 `sintomas_alarme` (nova)

`id, user_id, programa text check (…5 programas…), sintoma text not null, registrado_em timestamptz default now(), resolvido_em timestamptz, observacao text`. Índice parcial `(user_id, programa) where resolvido_em is null`. RLS owner. Alimenta `contexto.sintomasAlarme` (§52).

### 4.3 `exames` — uso na Fase 1

`categoria='rastreamento'`, `modulo='rastreando'`, `programa` preenchido. `tipo` ∈ {mamografia, dna_hpv, citologia, colposcopia, fit, colonoscopia, tcbd, psa, outro_rastreamento}. `resultado` por tipo:

| tipo | `resultado` (jsonb) |
|---|---|
| mamografia | `{ "birads": 0..6, "densidade"?: "a" \| "b" \| "c" \| "d", "intervalo_laudo_meses"?: number }` |
| dna_hpv | `{ "hpv": "negativo" \| "16_18" \| "outros_oncogenicos", "citologia_reflexa"?: Citologia }` |
| citologia | `{ "citologia": Citologia }` com `Citologia = "negativa" \| "insatisfatoria" \| "asc_us" \| "asc_h" \| "lsil" \| "hsil" \| "agc" \| "ais" \| "suspeita_malignidade"` |
| colposcopia | `{ "achado": "normal" \| "nic1" \| "nic2" \| "nic3" \| "ais" \| "carcinoma" \| "inconclusiva" }` |
| fit | `{ "fit": "negativo" \| "positivo" }` |
| colonoscopia | `{ "achado": "normal" \| "polipos" \| "massa_suspeita" \| "incompleta", "polipos"?: { "quantidade": number, "maior_mm": number, "removidos": boolean, "histopatologico"?: "aguardando" \| "hiperplasico" \| "adenoma" \| "adenoma_avancado" \| "carcinoma" }, "qualidade_adequada"?: boolean }` |
| tcbd | `{ "lungrads": "0" \| "1" \| "2" \| "3" \| "4A" \| "4B" \| "4X", "modificador_s"?: boolean }` |
| psa | `{ "psa_total": number, "psa_livre"?: number, "referencia_max"?: number, "repetir_em"?: "AAAA-MM-DD" }` (data definida pelo médico) |

`resolve_exame_id` liga o exame à pendência anterior (§51). Trigger novo `exames_fecha_pendencia`: ao inserir exame com `resolve_exame_id`, marca `pendencias.status='resolvida'`, `exame_resolucao_id`, `resolvida_em` para a pendência aberta daquele exame de origem.

### 4.4 `regras_clinicas` — semente (`supabase/seed.sql`)

Uma linha por combinação exame × resultado, mais linhas de elegibilidade (`exame_tipo` null, `condicao` com `idade_min/idade_max`, `intervalo_meses` do rastreamento habitual). Colunas `fonte`, `ano`, `versao` (`'2026.1'`), `revisada_em` (`'2026-09-15'`). Conteúdo derivado das decisões C-001–C-009; resumo em §6.

## 5. Motor de regras — handlers por programa

`src/core/regras/programas/{mama,colo,colorretal,pulmao,prostata}.ts`, registrados em `programas/index.ts`. Cada um implementa `ProgramaHandler` (Fundação §5.1):

- **`aplicavel(perfil)`** — mama: feminino (homens só via história familiar → educativo); colo: `possuiColoUtero && jaTeveAtividadeSexual` (Rec. 34/36); prostata: masculino; colorretal e pulmão: todos.
- **`fatoresModificadores(perfil)`** — devolve mensagem de "avaliação individualizada" quando:
  - mama (CBR/SBM/FEBRASGO 2023, C-001 validado): história pessoal de câncer de mama tratado → `acompanhamento_especializado`; mutação patogênica (BRCA1 → MG ≥ 35; TP53 → ≥ 30; BRCA2/outros → ≥ 30) ou 1º grau portadora sem teste; radioterapia torácica antes dos 30 → MG anual a partir do 8º ano após o tratamento (≥ 30); HLA/CLIS/HDA → estimar risco com o médico; forte história familiar (1º grau com mama, ovário, mama masculina, ≥ 2 parentes) → orientar estimativa de risco por modelo com o médico — se ≥ 20%, MG/RM 10 anos antes do parente mais jovem, não antes de 30. A mensagem cita a regra e a idade calculada quando possível;
  - colo: histerectomia por lesão/câncer (Rec. 35 — coleta vaginal 25 anos); NIC 2/3/AIS tratada (Rec. 14) — *nota: HIV/imunossupressão **não** é modificador; muda intervalo (Rec. 39) e conduta (Rec. 40) dentro do fluxo normal*;
  - colorretal: CCR ou adenoma prévio, DII, Lynch/PAF (CONITEC "risco padrão"); 1º grau < 60 ou ≥ 2 de 1º grau → ACG: início 40 ou (idade do caso mais jovem − 10), a cada 5 anos → mensagem calcula a idade sugerida (§34.1); 1 parente de 1º grau ≥ 60 → início aos 40, intervalo habitual (a validar C-005);
  - pulmão: não usa modificador — elegibilidade é o critério USPSTF (`macosAno ≥ 20 && (status==='atual' || anosDesdeCessacao ≤ 15)`, 50–80); fora disso `nao_indicado_no_momento` com texto explicando os critérios;
  - próstata (SBU, C-008 validado): 45 se `racaCor==='preta'` ou parente de 1º grau com próstata ou IMC ≥ 30; senão 50; > 75 → `acompanhamento_medico` (só com expectativa de vida > 10 anos). Status `indicado` significa "converse com seu médico" (decisão compartilhada). **Sem intervalo automático de PSA**: a SBU não fixa periodicidade; ao registrar PSA o app pergunta a data que o médico definiu para repetir (`data_proxima_acao` manual) e o status passa a `acompanhamento_medico`.
- **`selecionarRegra(exame, regras, perfil, contexto)`** — casa `regra.condicao` com `exame.resultado`; regras dependentes de perfil usam chaves extras na condição (`{"hpv":"negativo","imunossuprimida":true}`) e o handler injeta `imunossuprimida` a partir do perfil antes do casamento. Colo: `dna_hpv` com `outros_oncogenicos` sem `citologia_reflexa` → `pendente` (§45.3); com reflexa → regra da citologia decide. Colonoscopia: `polipos` com `histopatologico='aguardando'` → `pendente` ("aguardar histopatológico", §47); `adenoma`/`adenoma_avancado` → `controle` com intervalo do laudo (campo `intervalo_laudo_meses`) ou `avaliacao_individualizada`; `normal` + `qualidade_adequada` → `normal` com 120 meses e **marca `contexto` para suprimir FIT** (nova regra CONITEC).

### 5.1 Alterações no núcleo genérico

- `avaliarElegibilidade`: passa a receber `handlers` reais; para pulmão e próstata a faixa vem do handler (`faixaEtaria(perfil)`) — adicionar método opcional `faixaEtaria?(perfil): {min, max} | null` ao `ProgramaHandler`.
- `ContextoAvaliacao` ganha `colonoscopiaAdequadaEm?: string` (data) para o handler colorretal suprimir FIT por 10 anos.
- `classificarExame` grava `motivoSeguranca` e nunca calcula data quando há bloqueio (já feito).
- Nova função `montarContexto(userId)` em `src/core/regras/contexto.ts` — **única** que fala com o banco (fica fora de `regras/` puro: mover para `src/core/rastreando/contexto.ts`) e monta `PerfilRegras` + `ContextoAvaliacao` a partir de perfil, antecedentes, medidas (IMC), exames, pendências e sintomas.

### 5.2 Serviço de registro de exame (`src/core/rastreando/registrarExame.ts`)

```
registrarExame(entrada) →
  1. contexto = montarContexto(userId)
  2. regras = carregarRegras(programa)            // regras_clinicas ativas
  3. resultado = classificarExame(exame, perfil, contexto, regras, handlers)
  4. insert exames {…, classificacao, nivel_alerta, proxima_acao, data_proxima_acao, abre_pendencia, regra_id, regra_versao, resolve_exame_id}
  5. se abre_pendencia → insert pendencias
  6. se data_proxima_acao → agendarLembretes(exame)  // 60/30/7 dias antes, no dia, +7 após (§38)
  7. devolve resultado + mensagem para a tela
```
Tudo em uma função RPC? Não — Fase 1 faz no cliente em sequência com tratamento de erro; se falhar após o insert do exame, a tela mostra "exame salvo; não foi possível gerar lembretes" e um botão "tentar de novo". (RPC transacional fica como melhoria futura.)

### 5.3 Lembretes (§38, §63)

`agendarLembretes` grava em `lembretes` (origem `exame`) e agenda notificações locais com `expo-notifications` para as mesmas datas (ids guardados em `lembretes.origem_id`+`titulo`). Ao registrar um novo exame do mesmo programa, os lembretes pendentes anteriores desse programa são cancelados. Tela de lembretes lista os próximos 90 dias.

## 6. Tabela de regras (semente) — resumo

| programa | exame/resultado | classificação | alerta | intervalo | fonte |
|---|---|---|---|---|---|
| mama | elegibilidade 40–74 (≥ 75 → acompanhamento médico) | — | — | 12 | CBR/SBM/FEBRASGO 2023 |
| mama | mamas densas (campo `densidade` c/d no laudo) | mensagem educativa: US anual adjunta pode ser considerada | — | — | idem |
| mama | birads 0 | pendente (complementação) | cinza | — | ACR BI-RADS |
| mama | birads 1, 2 | normal | verde | 12 | idem |
| mama | birads 3 | controle | amarelo | 6 (ou `intervalo_laudo_meses`) | idem (C-009) |
| mama | birads 4 | investigacao | laranja | — | idem |
| mama | birads 5 | especializado | vermelho | — | idem |
| mama | birads 6 | especializado (sai do rastreamento) | vermelho | — | idem |
| colo | elegibilidade 25–(60/64) | — | — | 60 (36 se imunossuprimida) | INCA 2025 Rec. 1, 12, 18, 39 |
| colo | hpv negativo | normal | verde | 60 / 36 | Rec. 18 / 39 |
| colo | hpv 16_18 | investigacao (colposcopia) | laranja | — | §45.2 |
| colo | hpv outros + imunossuprimida | investigacao (colposcopia) | laranja | — | Rec. 40 |
| colo | hpv outros sem reflexa | pendente | cinza | — | §45.3 |
| colo | citologia negativa (após hpv outros) | controle | amarelo | 12 | INCA 2025 (a confirmar recomendação nº) |
| colo | citologia insatisfatoria | pendente (repetir) | cinza | — | §45.5 |
| colo | asc_us / lsil | controle ou complementar | amarelo | 12 | §45.6 (regra por idade — a confirmar) |
| colo | asc_h / hsil / agc / ais / suspeita | especializado | vermelho | — | §45.7 |
| colo | colposcopia normal / nic1 | controle | amarelo | 12 | INCA |
| colo | colposcopia nic2 / nic3 / ais / carcinoma | especializado | vermelho | — | INCA |
| colorretal | elegibilidade 50–75 | — | — | 24 | CONITEC 2026 Rec. 5–7 |
| colorretal | fit negativo | normal | verde | 24 | Rec. 7 |
| colorretal | fit positivo | investigacao (colonoscopia) | laranja | — | Rec. 8 |
| colorretal | colonoscopia normal adequada | normal | verde | 120 (suprime FIT) | Rec. 8 texto |
| colorretal | colonoscopia incompleta | pendente | cinza | — | §47 |
| colorretal | polipos aguardando | pendente | cinza | — | §47 |
| colorretal | polipos adenoma / adenoma_avancado | controle (intervalo do laudo) ou individualizada | amarelo | laudo | §47 |
| colorretal | polipos hiperplasico | normal | verde | 120 | §47 |
| colorretal | massa_suspeita / carcinoma | especializado | vermelho | — | §47 |
| pulmão | elegibilidade 50–80 + critérios | — | — | 12 | USPSTF 2021 |
| pulmão | lungrads 0 | pendente | cinza | — | ACR v2022 |
| pulmão | lungrads 1, 2 | normal | verde | 12 | idem |
| pulmão | lungrads 3 | controle | amarelo | 6 | idem |
| pulmão | lungrads 4A | investigacao | laranja | 3 | idem |
| pulmão | lungrads 4B, 4X | especializado | vermelho | — | idem |
| próstata | elegibilidade 50 (45 alto risco) | — | — | — | SBU 2025 |
| próstata | psa dentro da referência | normal (acompanhamento) | verde | **sem automático** — data informada pelo paciente conforme o médico | SBU 2018/2020 ("avaliações periódicas") · §49 |
| próstata | psa acima da referência | investigacao ("avaliação médica recomendada") | laranja | — | §49 |

Linhas marcadas "a confirmar" são validadas na diretriz INCA 2025 (PDF já baixado) durante a Task de semente; qualquer divergência do documento vai para o Murilo antes de codificar.

## 7. Telas

```
(app)/rastreando/
  index.tsx                 "Seus rastreamentos" — cards por programa aplicável com status §28 + faixa "Pendências" + link "Sinais de alerta"
  [programa]/
    index.tsx               hub do câncer (§29): Entenda · Preciso rastrear? · Fatores de risco · Sinais de alerta · Meus exames · Histórico
    entenda.tsx             texto educativo curto (conteúdo em src/modules/rastreando/conteudo/<programa>.ts)
    preciso.tsx             questionário mínimo: só o que falta no perfil para aquele programa; grava no perfil; mostra ResultadoElegibilidade
    fatores.tsx             fatores educativos × modificadores (§29.3) — lista estática + marcação dos presentes no perfil
    sinais.tsx              sinais de alerta com "Tenho este sintoma" → insere sintomas_alarme → aviso §52
    exames.tsx              lista de exames do programa + "Registrar exame"
    registrar.tsx           formulário por tipo (Select do tipo → campos estruturados) + "relacionado a uma pendência?" (§51) + resultado do motor
  pendencias.tsx            §50 — abertas, com o exame de origem e a ação esperada
  lembretes.tsx             próximos lembretes do Rastreando
```
Aba "Rastreando" já existe. A Home passa a incluir itens do Rastreando em `montarItensHoje` (pendências abertas = laranja/vermelho; exame próximo = amarelo; exame atrasado = laranja; sintoma de alarme = vermelho).

**Design:** segue `03-DESIGN.md`. Status §28 usa `StatusBadge` com o nível: em dia/verde · próximo/amarelo · atrasado/laranja · pendência/laranja-vermelho · não indicado/cinza. Card por programa na tela inicial do módulo com o Nero do Rastreando (símbolo até o PNG chegar).

## 8. Conteúdo

`src/modules/rastreando/conteudo/<programa>.ts` exporta `{ entenda: string[], fatoresEducativos: string[], fatoresModificadores: string[], sinaisAlerta: {id, texto}[], perguntasPreciso: Pergunta[] }`. Textos curtos, em linguagem do §25, **revisados pelo Murilo antes do merge** (tarefa do plano com checkpoint). Reaproveitar do legado a lista de fatores/sintomas quando compatível com as diretrizes.

## 9. Testes

- Motor por programa: **um teste por linha da tabela §6** + testes de elegibilidade por programa (faixa, modificadores, pulmão maços-ano/cessação, próstata 45/50, colo imunossuprimida 36 meses, colonoscopia suprime FIT).
- `montarContexto` com Supabase local (mapeamento perfil → `PerfilRegras`, IMC de `medidas`).
- pgTAP: trigger fecha pendência; RLS de `sintomas_alarme`.
- Manual: checklist `docs/nero/checklists/fase-1.md` (fluxos do critério de pronto).

## 10. Ordem de implementação (base do plano)

1. Migração 0008 (perfil, sintomas_alarme, trigger) + tipos + pgTAP. Campos novos no perfil inicial/Meu perfil.
2. `ProgramaHandler` estendido (`faixaEtaria`) + handlers mama, colo, colorretal, pulmão, próstata com testes (TDD) — sem UI.
3. Semente `regras_clinicas` (validando linhas "a confirmar" no PDF INCA) + `carregarRegras`.
4. `montarContexto`, `registrarExame`, `agendarLembretes` (+ expo-notifications).
5. Telas: index do Rastreando + hub + preciso + exames/registrar.
6. Sinais de alerta, pendências, lembretes, histórico.
7. Home: itens do Rastreando em `montarItensHoje`.
8. Conteúdo educativo → revisão do Murilo → checklist → merge.
