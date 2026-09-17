# NERO — Fase 2: Coração & Metabolismo — Spec Técnica

**Data:** 17/09/2026 · **Status:** em revisão pelo Murilo
**Base:** `docs/nero/01-ESPECIFICACAO-NERO.md` §1–§26, §57 · Decisões clínicas **C-010 a C-014** em `docs/nero/02-DECISOES.md` (todas aprovadas em 17/09/2026) · Funcionamento por funcionalidade em `docs/nero/04-CARDIO-FUNCIONAMENTO.md` · Acervo em `docs/nero/referencias/REFERENCIAS.md` (seção "Fase 2") · Fundação: `2026-09-14-nero-fundacao-design.md` · Fase 1: `2026-09-15-nero-fase1-rastreando-design.md`.
**Entrega:** uma spec, **dois planos** com checklist e merge separados — **2a** (pressão, MRPA, alertas, lembretes de medicação, dashboard inicial, Home) e **2b** (glicemia, exames, PREVENT, agravantes/CAC, check-up, linha do tempo).

---

## 1. Objetivo

Ativar o módulo **Coração & Metabolismo** (card hoje "em breve" na Home) com: registro de pressão arterial casual e MRPA guiada com relatório; alertas de PA e glicemia em camadas; registro de glicemia com metas e plano de monitorização; central de exames laboratoriais e cardiológicos com valor estruturado; risco cardiovascular PREVENT com preenchimento automático; check-up "Como está minha prevenção?"; dashboard e linha do tempo cardiovascular.

**Critério de pronto (2a):** o paciente registra uma PA 185/95 e o app pede repouso/repetição e pergunta sintomas de alarme; com "dor no peito" marcada, orienta emergência. Inicia uma MRPA de 6 dias, recebe lembretes manhã/noite, faz 3+3 medidas por dia guiadas com cronômetro de 1 min, conclui e vê relatório com médias e "acima da referência (≥ 130 e/ou ≥ 80)" quando for o caso; uma sessão com um dia sem medida da noite aparece "não atinge o mínimo para interpretação". A Home mostra "MRPA — dia 3 de 6".

**Critério de pronto (2b):** paciente com diabetes sem metas do médico vê metas SBD 2026 (80–130 / < 180 / 90–150); registra 48 mg/dL e recebe laranja com "siga a orientação do seu médico para hipoglicemia"; registra LDL 87 e HbA1c 5,7 % em Meus Exames; abre Meu Risco, o app puxa PA (média dos últimos 7 dias), CT, HDL, creatinina, IMC, tabagismo, medicações, pergunta "usar seus dados mais recentes?", calcula ASCVD 10 anos e mostra categoria pelo escore; marca "história familiar prematura" e recebe a frase do §17. Check-up mostra "informações atualizadas: n/8" com o item faltante nomeado.

## 2. Fora de escopo

PDF de relatórios (§3, §8, §26 — Fase 3; nesta fase relatório em tela com botão "Compartilhar" desabilitado e etiqueta "em breve") · anexar laudo/imagem (Storage — Fase 3; `anexos` fica vazio) · CGM/sensores · offline · notificações push remotas (só locais) · IC e DCV total do PREVENT · Steno T1 Risk Engine · SDI · peso/IMC como funcionalidade própria (Fase 4; aqui só o registro mínimo de peso quando o PREVENT precisar) · atividade física (Fase 4; conta como "não registrado" no check-up).

## 3. Princípios que governam esta fase

1. **Diretriz vigente, texto literal** (`02-DECISOES.md`, princípio de 15/09 + método de 17/09): DBHA 2025, Medidas PA 2023, SBD 2026, Dislipidemias 2025, PREVENT (Khan 2023/2024). Versões substituídas (DBHA 2020, MRPA 2018) não são usadas. Onde a diretriz não fixa, o app **convida ou pergunta**, nunca alerta com cor.
2. **Dado ≠ interpretação educativa ≠ conduta (§25).** O app não diagnostica hipertensão nem diabetes, não sugere dose de insulina nem "coma 15 g de carboidrato". Toda conduta remete ao médico. Frases proibidas: "você tem hipertensão", "você está tendo um infarto", "aumente a dose".
3. **Medidas casuais são triagem (AMPA)**; só a MRPA válida tem interpretação com cor (C-010/C-011).
4. **Parâmetros em `regras_clinicas`, lógica em TypeScript puro testada** (D-003). `src/core/regras/**` não importa UI/Expo/Supabase.
5. **Uma fonte de dados:** perfil (idade, sexo, diabetes, tabagismo, altura), `medidas`, `exames`, `medicacoes`. O módulo só pergunta o que falta e grava de volta.
6. **Antes das telas, reler `docs/nero/03-DESIGN.md`** e usar a skill `frontend-design`. Capa do módulo: vermelho-tijolo `#B4321F` → coral `#F2734A`.

## 4. Mudanças no modelo de dados — migração `0010_cardio.sql` (única para 2a e 2b)

### 4.1 `mrpa_sessoes`
| alteração | motivo |
|---|---|
| `dias_previstos` check `between 4 and 6`, default 6 | Medidas 2023 Parte 4 §3 (C-011) |
| `+ pa_consultorio jsonb` `{ "pas": n, "pad": n, "medido_em": "AAAA-MM-DD" }` opcional | diferença consultório × MRPA no relatório |
| `+ horarios jsonb` `{ "manha": "HH:MM", "noite": "HH:MM" }` | lembretes |
| `+ resultado jsonb` gravado ao concluir: `{ medidas_validas, medidas_excluidas, dias_com_registro, medias: { total, manha, noite, por_dia[] }, valido, motivo_invalidez?, acima_referencia, diferenca_consultorio? }` | relatório e camada 2 de C-010 |
| `+ concluida_em timestamptz` | — |

### 4.2 `medidas` — sem coluna nova; contratos de `valores`/`contexto`
| tipo | `valores` | `contexto` |
|---|---|---|
| `pa` casual | `{ pas, pad, fc? }` | `{ braco?: 'esquerdo'\|'direito', posicao?: 'sentado'\|'deitado'\|'em_pe', momento_medicacao?: 'antes'\|'depois'\|'nao_uso', sintomas?: SintomaPA[], implausivel_confirmada?: boolean }` |
| `pa` em sessão (`sessao_id` preenchido) | idem | `{ periodo: 'manha'\|'noite', ordem: 1\|2\|3, excluida?: boolean, motivo_exclusao?: MotivoExclusao, sintomas?, momento_medicacao? }` |
| `glicemia` | `{ mgdl }` | `{ momento: MomentoGlicemia, refeicao?: 'nao_registrar'\|'pequena'\|'habitual'\|'maior', medicamento?: { nome?, dose?, horario? }, atividade_fisica?: boolean, sintomas?: SintomaGlicemia[] }` |
| `peso` | `{ kg }` | `{}` |

`SintomaPA` = `dor_toracica | dispneia_importante | deficit_neurologico | alteracao_visual | confusao | sincope` (§4). `SintomaGlicemia` = `tremor | sudorese | tontura | fraqueza | confusao | sede_intensa | nausea | vomito | dor_abdominal | respiracao_rapida | sonolencia | precisou_de_ajuda | nenhum | outro` (§6 + C-012). `MomentoGlicemia` = lista do §5 em snake_case. `MotivoExclusao` = `pad_maior_140 | pad_menor_40 | pas_menor_70 | pas_maior_250 | pas_menor_pad | pp_menor_20 | pp_maior_100`.

Índice novo: `medidas_user_sessao_periodo_idx (sessao_id, medido_em)` já coberto por `medidas_sessao_idx` — nada a criar.

### 4.3 `perfil_saude` — campos novos
| coluna | tipo | motivo |
|---|---|---|
| `tipo_diabetes` | text check in ('dm1','dm2','gestacional','outro') | modelos de plano (SBD R5/R9/R10); cetonas no laranja > 250 |
| `usa_insulina` | text check in ('nao','basal','intensiva') | idem |
| `evento_cv_previo` | boolean | PREVENT não se aplica (Dislipidemias 2025) |
| `perfil_meta_glicemica` | text check in ('adulto','idoso_comprometido','idoso_muito_comprometido') default 'adulto' | Tabela 1 SBD (C-012) — só muda se o médico enquadrou |
| `metas_glicemia` | jsonb `{ definidas_por: 'medico'\|'outro_profissional'\|'diretriz', jejum_min, jejum_max, pos_max, deitar_min, deitar_max }` | §7 |
| `plano_glicemia` | jsonb `{ definido_por: 'medico'\|'outro_profissional'\|'nenhum', modelo?: 'dm1_sem_sensor'\|'dm2_basal'\|'dm2_intensiva'\|'dm2_sem_insulina', momentos: MomentoGlicemia[], horarios: { momento, hora }[] }` | §7, §22 |
| `agravantes_cv` | jsonb `{ itens: AgravanteCV[], atualizado_em }` | Tabela 4.3 (C-013) |
| `atividade_fisica_regular` | boolean | §16/§24 (Fase 4 detalha) |

`AgravanteCV` = `hist_familiar_dcv_prematura | sindrome_metabolica | esteatose_hepatica | artrite_reumatoide | psoriase | lupus | dii | hiv | transplante | menarca_precoce_ou_tardia | disturbio_gestacional | parto_prematuro | rciu | abortos_repeticao | menopausa_precoce | lpa_elevada | pcr_us_elevada`.

### 4.4 `exames` — uso na Fase 2
`modulo='cardio'`, `programa=null`, `categoria ∈ {laboratorial, cardiologico}`. `classificacao/nivel_alerta/proxima_acao/abre_pendencia` ficam **nulos** (laboratoriais não geram conduta automática — §9/§10; a interpretação vem do médico). `tipo` fechado:

- laboratorial: `hemograma, glicemia_plasmatica, hba1c, colesterol_total, ldl, hdl, triglicerideos, nao_hdl, creatinina, tfg, ureia, sodio, potassio, magnesio, rac_urinaria, tsh, vitamina_b12, vitamina_d, tgo, tgp, fosfatase_alcalina, gama_gt, lpa, pcr_us, outro_laboratorial` — `resultado = { valor: number, unidade: string, referencia_min?: number, referencia_max?: number }`. Unidade padrão por tipo (mg/dL; % para HbA1c; mL/min/1,73 m² para TFG; mg/g para RAC; nmol/L ou mg/dL para Lp(a)).
- cardiológico: `ecg, ecocardiograma, teste_ergometrico, holter, mapa, mrpa_externa, cac, angiotc_coronarias, doppler_carotidas, rm_cardiaca, cintilografia, cateterismo, outro_cardiologico` — `resultado = { conclusao: string, agatston?: number, percentil?: number, medias_mapa?: {...} }`.

Uma linha por analito (o paciente registra "LDL 87 em 13/09"; um mesmo laudo vira várias linhas com a mesma `data_realizacao`/`instituicao`).

### 4.5 `riscos_cv` (nova)
`id, user_id, calculado_em timestamptz, modelo text check in ('prevent_base','prevent_hba1c','prevent_rac','prevent_hba1c_rac'), entradas jsonb, ascvd_10 numeric(5,2), ascvd_30 numeric(5,2), categoria text check in ('baixo','intermediario','alto'), agravantes_presentes text[], versao_coeficientes text, created_at`. `entradas` guarda cada variável com `{ valor, origem: 'perfil'|'medida'|'exame'|'digitado', data }`. Índice `(user_id, calculado_em desc)`. RLS owner (padrão da 0005). pgTAP: RLS.

### 4.6 `lembretes`
`origem_tipo` já aceita `medida` e `medicacao`. Convenção de `titulo`: `mrpa:<sessao_id>:<dia>:<periodo>`, `glicemia:<momento>`, `medicacao:<medicacao_id>:<HH:MM>` (mesmo esquema de `rastreando/lembretes.ts`, que guarda o id da notificação local em `mensagem`).

### 4.7 `regras_clinicas`
`programa` check estendido: `+ 'pressao','glicemia','risco_cv'`. Semente `supabase/seed.sql` (bloco Fase 2) — uma linha por limiar, `modulo='cardio'`, `versao='2026.2'`, `revisada_em='2026-09-17'`:

| programa | exame_tipo | condicao | classificacao / nivel | mensagem (resumo) | fonte |
|---|---|---|---|---|---|
| pressao | pa | `{ "camada": "implausivel", "pad_max":140,"pad_min":40,"pas_min":70,"pas_max":250,"pp_min":20,"pp_max":100 }` | pendente / cinza | Confira os valores digitados | Medidas 2023 Parte 4 §3 |
| pressao | pa | `{ "camada": "referencia_domiciliar", "pas":130,"pad":80 }` | normal / verde (sem cor na UI) | referência da MRPA; medida isolada não confirma nem afasta | DBHA 2025 Q3.4; Medidas 2023 Q9 |
| pressao | pa | `{ "camada": "convite_mrpa", "minimo_medidas":3,"janela_dias":7,"repetir_dias":30 }` | controle / verde (convite) | Quer iniciar uma MRPA? | C-010 (produto) |
| pressao | mrpa | `{ "camada": "mrpa_acima", "pas":130,"pad":80 }` | controle / amarelo | acima do esperado; leve o relatório | DBHA 2025 Q3.4; Medidas 2023 P4 §4 |
| pressao | mrpa | `{ "camada": "validade", "minimos": {"4":14,"5":15,"6":18} }` | pendente / cinza | não atinge o mínimo para interpretação | Medidas 2023 P4 §5 |
| pressao | pa | `{ "camada": "muito_elevado", "pas":180,"pad":110 }` | investigacao / laranja | repouso 5 min e repita; sintomas? | DBHA 2025 cap. 11.1 |
| pressao | pa | `{ "camada": "muito_elevado_sintoma", "pas":180,"pad":110, "sintomas": [...] }` | especializado / vermelho | procure emergência agora | DBHA 2025 cap. 11 |
| glicemia | glicemia | `{ "camada": "metas", "perfil": "adulto", "jejum":[80,130],"pos":180,"deitar":[90,150] }` (+ linhas idoso_comprometido, idoso_muito_comprometido) | normal / verde | meta da diretriz — confirme com seu médico | SBD 2026 Metas R6, Tabela 1 |
| glicemia | glicemia | `{ "camada": "hipo_n1", "min":54,"max":69 }` | controle / amarelo | abaixo de 70: siga a orientação do seu médico | SBD 2026 Metas (níveis) |
| glicemia | glicemia | `{ "camada": "hipo_n2", "max":53 }` | investigacao / laranja | muito baixo: siga agora a orientação…; se não melhorar, peça ajuda | idem |
| glicemia | glicemia | `{ "camada": "hipo_n3", "sintomas": ["confusao","precisou_de_ajuda"] }` | especializado / vermelho | emergência | idem |
| glicemia | glicemia | `{ "camada": "hiper", "min":251 }` | investigacao / laranja | repita; DM1/bomba: cetonas como o médico orientou | SBD 2026 Dias de doença T1 |
| glicemia | glicemia | `{ "camada": "hiper_sintoma", "min":251, "sintomas":["nausea","vomito","dor_abdominal","respiracao_rapida","sonolencia"] }` | especializado / vermelho | emergência | SBD 2026 Cetoacidose |
| glicemia | glicemia | `{ "camada": "sem_diabetes", "jejum_normal_max":99,"jejum_pre_max":125,"jejum_dm":126,"casual_dm":200 }` | normal / verde (convite) | capilar não faz diagnóstico; converse sobre exame de laboratório | SBD 2026 Diagnóstico R1–R2, T1 |
| risco_cv | prevent | `{ "camada": "categorias", "baixo_max":5,"alto_min":20 }` | normal / verde | categoria pelo escore | Dislipidemias 2025 T4.1 |
| risco_cv | prevent | `{ "camada": "elegibilidade", "idade_min":30,"idade_max":79 }` | pendente / cinza | escore não desenvolvido para sua situação | Dislipidemias 2025 §4.8–4.9 |
| risco_cv | cac | `{ "camada": "cac", "alto":100,"percentil_alto":75,"muito_alto":300 }` | controle / amarelo | estratificador de risco; converse com seu médico | Dislipidemias 2025 T4.4 |
| risco_cv | prevent | `{ "camada": "dado_recente", "pa_mrpa_dias":30,"pa_casual_dias":7,"pa_casual_min":3,"peso_dias":30,"peso_perguntar_dias":90,"lipidios_meses":12,"renal_meses":12,"hba1c_meses":6,"rac_meses":12,"risco_meses":12 }` | pendente / cinza | — | C-014 (produto) |

Os coeficientes do PREVENT **não** vão para o banco (são ~200 números por modelo/sexo): ficam em `prevent.coeficientes.ts` com `versao_coeficientes = 'khan-2024-suppl'`; a linha `categorias` registra a fonte da categorização.

## 5. Núcleo puro — `src/core/regras/cardio/`

Sem React/Expo/Supabase (teste de isolamento existente cobre a pasta). Cada função recebe os parâmetros vindos de `regras_clinicas` (mesmo padrão `RegraParametros`), nunca constantes fixas.

| arquivo | exporta | regra |
|---|---|---|
| `pressao.ts` | `validarPlausibilidade(m, p) → MotivoExclusao \| null` · `avaliarMedidaCasual(m, sintomas, p) → { camada: 'contexto'\|'muito_elevado'\|'muito_elevado_sintoma', nivel, mensagem }` · `deveConvidarMrpa(medidas7d, ultimoConviteEm, p) → boolean` · `resumoCasual(medidas, periodo) → { media, maior, menor, n }` | C-010 |
| `mrpa.ts` | `montarSessao(sessao, medidas, p) → RelatorioMrpa` (exclusões, médias total/manhã/noite/por dia, `valido` pela tabela 14/15/18 + manhã e noite em todos os dias, `acimaReferencia`, diferença consultório) · `diaAtual(sessao, hoje)` · `podeConcluir(sessao, hoje)` | C-011 |
| `glicemia.ts` | `metasPara(perfil, metasMedico, p) → Metas \| null` · `avaliarGlicemia(m, contexto, perfil, metas, p) → { camada, nivel, mensagem, foraDaMeta?: 'acima'\|'abaixo' }` · `modelosPlano(tipoDiabetes, usaInsulina) → Modelo[]` · `resumoGlicemia(medidas, metas) → Relatório §8` | C-012 |
| `prevent.ts` | `elegivel(perfil) → { ok, motivo? }` · `calcularPrevent(entradas) → { ascvd10, ascvd30?, modelo }` · `categoria(ascvd10, p)` · `ckdEpi2021(creatinina, idade, sexo)` | C-013; Khan 2024 |
| `prevent.coeficientes.ts` | tabelas por sexo × modelo (base, +HbA1c, +RAC, +ambos) × desfecho ASCVD × horizonte (10, 30) | suplemento Khan 2024 (transcrição revisada duas vezes; testes contra a calculadora AHA) |
| `agravantes.ts` | `listaAgravantes()` (Tabela 4.3 com rótulos) · `temAgravante(perfil)` | C-013 |
| `dadoRecente.ts` | `estadoDoDado(tipo, data, hoje, p) → 'atual'\|'antigo'\|'faltando'` · `montarEntradasPrevent(fontes, hoje, p) → EntradaComEstado[]` | C-014 |
| `checkup.ts` | `avaliarCheckup(fontes, perfil, hoje, p) → { itens: {chave, atualizado, frase}[], total, atualizados }` | §24, C-014 |
| `mensagens.ts` | textos das camadas (pt-BR, §25) — únicos textos clínicos fora de `regras_clinicas.mensagem_paciente`; a regra do banco prevalece quando existir | — |

Serviços com banco em **`src/core/cardio/`** (padrão de `src/core/rastreando/`): `medidas.ts` (inserir/listar por tipo e período; inserir 3 medidas de MRPA em lote), `sessoesMrpa.ts` (iniciar, listar ativa, concluir → chama `montarSessao` e grava `resultado`, cancelar), `examesCardio.ts`, `riscoCv.ts` (monta fontes, chama `montarEntradasPrevent`, salva em `riscos_cv`), `lembretesCardio.ts` (MRPA manhã/noite por dia da sessão; plano de glicemia diário; medicação por horário — reaproveita `pedirPermissaoNotificacoes` e a convenção de `rastreando/lembretes.ts`), `resumoHome.ts` (dados para `montarItensHoje`), `linhaDoTempo.ts` (une `medidas` agregadas, `exames`, `riscos_cv`, `mrpa_sessoes` por mês/ano), hooks `useCardio*.ts`.

## 6. Telas — `app/(app)/coracao/**`, quarta aba "Coração" (ícone `heart-outline`)

```
(app)/coracao/
  index.tsx                 dashboard §19: cards PA (última + MRPA ativa/última) · Glicemia (última + momento) · HbA1c · LDL · Risco (último cálculo) · Peso; cada card abre a área; linha "Sinais de alerta" (§23) e "Como está minha prevenção?" (§24)
  pressao/
    index.tsx               lista + médias 7/30 dias, maior/menor, gráfico PAS/PAD simples (barras por dia, sem biblioteca); botão "Registrar" e "Iniciar MRPA"; convite para MRPA quando `deveConvidarMrpa`
    registrar.tsx           §1: data/hora, PAS, PAD, FC, braço, posição, medicação, sintomas, observação → plausibilidade → camadas → mensagem
  mrpa/
    iniciar.tsx             texto §2 + Quadro 19 + duração 4/5/6 (padrão 6) + horários manhã/noite + PA do consultório (opcional) → cria sessão + lembretes
    [sessao].tsx            tela diária: "Dia 3 de 6", blocos Manhã/Noite com 3 slots; botão "Fazer as 3 medidas" → subtela guiada com cronômetro de 1 min; médias do dia; "Concluir" (só após o último dia) / "Cancelar"
    relatorio.tsx           §3 + C-011: período, válidas/excluídas, médias, resultado, diferença consultório, medicações, sintomas, tabela, ressalva literal; "Compartilhar" em breve
  glicemia/
    index.tsx               lista + resumo 7 dias (média jejum/pós), metas visíveis, botão "Registrar", "Meu plano", "Relatório"
    registrar.tsx           §5–§6 + camadas C-012
    plano.tsx               §7: quem definiu, metas (se médico), perfil (se médico enquadrou), horários/modelos → lembretes
    relatorio.tsx           §8: período 7/14/30/90/personalizado, resumo, tabela, gráfico
  exames/
    index.tsx               §9: lista por data/categoria, filtro lab/cardio, "Adicionar exame"
    registrar.tsx           categoria → tipo → campos (valor+unidade+referência | conclusão+Agatston) + data, instituição, solicitante, observações
    [id].tsx                detalhe + série histórica do mesmo tipo (LDL ao longo do tempo)
  risco/
    index.tsx               §13/§15: último cálculo, "Calcular agora"; se não elegível, explicação
    dados.tsx               §14: tabela de entradas com estado atual/antigo/faltando; confirmar/atualizar; medicações a confirmar
    resultado.tsx           §15–§16: ASCVD 10 anos + categoria pelo escore + 30 anos (30–59) + "o que impacta" + frase obrigatória
    agravantes.tsx          §17 checklist Tabela 4.3 + §18 CAC (atalho para exames/registrar tipo cac)
  checkup.tsx               §24
  linha-do-tempo.tsx        §20
  sinais.tsx                §23 (texto; "Tenho este sintoma agora" → orientação de emergência, sem gravar em sintomas_alarme do Rastreando)
```

- **Minha Saúde › Medicamentos** ganha o toggle "Lembrar nos horários" (§21) que agenda `lembretes` `medicacao:*` locais; sem outra mudança.
- **Home:** `CardModulo` do Coração deixa de ser "em breve"; `montarItensHoje` recebe `cardio: ResumoCardio` — vermelho/laranja: última PA/glicemia com camada laranja/vermelho nas últimas 24 h ("Rever orientação…"); laranja: MRPA com dia sem medidas; amarelo: "MRPA — dia 3 de 6: medidas da noite", lembrete de glicemia do plano no dia, MRPA válida acima da referência sem consulta marcada; cinza: check-up com item faltando ("Atualizar seu perfil lipídico").
- **Design:** `03-DESIGN.md`. Cores de nível só nos chips/anéis; medidas casuais **nunca** recebem cor de alerta abaixo de 180/110; a referência 130/80 aparece como texto. Cronômetro da MRPA é o único movimento (responde a ação do usuário). Gráficos: barras simples em `View`s (sem lib) — evolução para `victory-native` fica para a Fase 3 se necessário.

## 7. Conteúdo

`src/modules/coracao/conteudo/`: `pressao.ts` (Quadro 19 em linguagem de paciente; "entenda a MRPA"), `glicemia.ts` (momentos, o que é meta, hipoglicemia), `risco.ts` (o que é o PREVENT, agravantes com rótulos leigos, CAC), `sinais.ts` (§23). Todos em pt-BR, §25, **revisados pelo Murilo antes de cada merge** (mesmo formato de `docs/nero/revisao/`).

## 8. Testes

- **Núcleo (TDD, um teste por camada/limiar de cada decisão):** plausibilidade (7 motivos); camadas de PA (179/109 sem cor, 180/110 laranja, 180/110 + sintoma vermelho); convite MRPA (2 medidas → não; 3 em 7 dias → sim; repetido em < 30 dias → não); MRPA (6 dias × 3+3 válida; 4 dias com 13 → inválida; 6 dias com 18 mas um dia sem noite → inválida; exclusão por PP < 20 mantém na tabela; média ≥ 130/80 → acima); glicemia (metas por perfil e por médico; 69/54/53; 250 sem cor de laranja, 251 laranja, 251 + vômito vermelho; sem diabetes 126 jejum → convite; 125 → contextualização); PREVENT (≥ 6 casos reproduzindo a calculadora AHA em 10 e 30 anos, mulher e homem, base e com HbA1c/RAC; CKD-EPI 2021 com 3 casos; elegibilidade 29/30/79/80 e evento prévio; categorias 4,9/5/19,9/20); dado recente (cada janela nos dois lados do limite); check-up (0/8 e 8/8).
- **Serviços com Supabase local:** inserir 3 medidas em lote com `ordem`; concluir sessão grava `resultado`; `riscos_cv` guarda `entradas` com origem/data.
- **pgTAP:** check de `dias_previstos`; RLS de `riscos_cv`; `programa` aceita `'pressao'`.
- **Manual:** `docs/nero/checklists/fase-2a.md` e `fase-2b.md` (fluxos dos critérios de pronto).

## 9. Ordem de implementação

**Plano 2a**
1. Migração 0010 completa (todas as tabelas/colunas, para não migrar duas vezes) + tipos + pgTAP + semente das regras de pressão.
2. `regras/cardio/pressao.ts` e `mrpa.ts` com testes (TDD).
3. Serviços `medidas.ts`, `sessoesMrpa.ts`, `lembretesCardio.ts` (MRPA + medicação).
4. Telas: pressão (index/registrar), MRPA (iniciar/[sessao]/relatorio), sinais, dashboard inicial com os cards de PA e MRPA (os demais cards mostram "registre para começar").
5. Toggle de lembretes em Medicamentos; Home com itens do Cardio; aba "Coração" ativa.
6. Conteúdo → revisão do Murilo → checklist 2a → merge.

**Plano 2b**
7. Semente das regras de glicemia e risco; `glicemia.ts`, `dadoRecente.ts`, `checkup.ts`, `agravantes.ts` com testes.
8. `prevent.coeficientes.ts` (transcrição do suplemento — **depende do download manual do Murilo**) + `prevent.ts` + casos da calculadora AHA.
9. Serviços `examesCardio.ts`, `riscoCv.ts`, `linhaDoTempo.ts`.
10. Telas: glicemia (4), exames (3), risco (4), check-up, linha do tempo; dashboard completo.
11. Conteúdo → revisão → checklist 2b → merge → roadmap.

## 10. Riscos e mitigação

- **Coeficientes do PREVENT** transcritos à mão: risco de erro de dígito. Mitigação: transcrição em dupla passagem (arquivo + revisão linha a linha) e testes contra a calculadora oficial com casos extremos; sem os PDFs o item 8 não começa.
- **Notificações locais** em quantidade (MRPA 12/sessão + glicemia diária + medicação): agendar só os próximos 7 dias e reagendar ao abrir o app (função `sincronizarLembretes`).
- **Fuso e "dia" da MRPA:** dia calculado no fuso do aparelho a partir de `inicio`; período manhã/noite é escolha do paciente no momento da medida (não por hora do relógio), evitando classificar errado quem mede "noite" às 17 h.
