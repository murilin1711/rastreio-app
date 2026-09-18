# Saúde & Bem-estar — como cada funcionalidade funciona e em que se baseia

> Fase 4 (§69–§88): Meu Corpo (peso, IMC, cintura, cintura/altura, composição corporal), Minha Alimentação, Minha Atividade, Meu Sono, conexão alimentação ↔ glicemia ↔ atividade, metas, hábitos, check-in semanal, relatório. Princípio do módulo (§69): mostrar evolução, não julgar; sem contagem de calorias; sem meta de peso imposta.

## Referências usadas neste módulo
| Fonte | Ano | Usada em |
|---|---|---|
| ABESO — Diretrizes Brasileiras de Obesidade, 4ª ed. (Tabela 4 IMC/OMS; Tabela 5 IDF; Rec. 1C–1G; técnica de medida) | 2016 | C-015, C-016 |
| ABESO — Diretriz Brasileira de Tratamento Farmacológico da Obesidade (R5 RCA > 0,5; R8 PMAV) | 2026 | C-016, C-019 |
| ABESO/SBEM — e-book Obesidade Controlada | 2023 | C-019 |
| Diretriz Brasileira 2025 (ABESO/SBD/SBEM/SBC/ABS, *Arq Bras Cardiol*) — cintura/RCQ/RCA como alternativas ao IMC | 2025 | C-015, C-016 |
| OMS — Waist circumference and waist–hip ratio (técnica; Tabela A1) | 2011 | C-016 |
| OMS — Guidelines on physical activity and sedentary behaviour · Guia de Atividade Física para a População Brasileira (MS) | 2020 · 2021 | C-017 |
| AASM/SRS — Recommended amount of sleep for a healthy adult (Watson et al.) | 2015 | C-018 |
| Guia TdC (resumo da Comissão Lancet 2025 + slide IDF 2009) — fonte secundária | 2026 | confirma C-016 |

Verificação de 18/09/2026: nenhuma sociedade brasileira adotou a Comissão Lancet 2025 com pontos de corte próprios; a 2016 continua a fonte das faixas. Detalhes em `docs/nero/referencias/REFERENCIAS.md`.

Todas as regras deste módulo estão em `regras_clinicas` (programa `bem_estar`, 12 linhas, versão 2026.3) com `classificacao 'normal'` e `nivel_alerta 'cinza'`: são **informação educativa**, nunca alerta clínico (§43). Leitura por `extrairParametrosBemEstar` (`src/core/regras/bemestar/parametros.ts`).

## 1. Meu Corpo (§70–§73, §82–§84) — Fase 4a
- **Dados:** peso, cintura, quadril e composição corporal ficam em `medidas` (tipos `peso`, `cintura`, `quadril`, `composicao`; D-011). PMAV e objetivo de peso no perfil (`peso_maximo_vida_kg`, `objetivo_peso`, migração 0012). O PREVENT e o check-up continuam lendo `peso` do mesmo lugar.
- **IMC (C-015):** `calcularIMC` (perfil) + `faixaIMC` (Tabela 4 OMS/ABESO 2016: < 18,5 · 18,5–24,9 · 25–29,9 · 30–34,9 · 35–39,9 · ≥ 40); a partir dos 60 anos também `faixaIMCIdoso` (MS: 22–27 referência). Texto fixo do §71 vem da regra `imc/faixas`. Sem cor.
- **Cintura (C-016):** `classificarCintura` — ≥ 90 (H) / ≥ 80 (M) "aumentada" (IDF para sul-americanos, ABESO 2016 Tabela 5); ≥ 102 / ≥ 88 "muito aumentada" (NCEP, DBHA 2025). `rca` = cintura/altura, referência < 0,5 (ABESO 2016 Rec. 1F, Grau A; ABESO 2026 R5) — indicador principal; `rcq` só com quadril (OMS: ≥ 0,90 / ≥ 0,85). Técnica de medida ensinada na tela de registro (regra `cintura/tecnica`: ponto médio entre a última costela e a crista ilíaca, fim da expiração normal, fita não elástica).
- **Evolução (§73):** período 30 d / 3 m / 6 m / 1 a / tudo; um gráfico por indicador (`GraficoSerie`): peso, IMC, cintura, gordura %, massa muscular. "Comparar períodos" (`compararPeriodos`): primeira → última medida de cada indicador entre dois meses.
- **Tendência (C-019):** `tendenciaPeso` — ≥ 3 medidas e ≥ 14 dias; média dos últimos 14 dias × 14 anteriores; ≥ 1 % define aumento/redução, senão estável; janela anterior vazia → "registre mais medidas". `evolucaoPercentual` = (atual − inicial)/inicial no período.
- **PMAV (ABESO 2026 R8):** `avaliarPMAV` — perda % em relação ao peso máximo; marcos: IMC 30–39,9 → 5–10 % reduzida, ≥ 10 % controlada; IMC 40–50 → 10–15 % reduzida, > 15 % controlada; IMC fora dessas faixas mostra só a perda %.
- **Perda não intencional (C-019, decisão de produto):** `perdaNaoIntencional` — objetivo ≠ redução e peso atual ≥ 5 % abaixo do maior peso dos últimos 6 meses → item **cinza** na Home ("Conversar com o médico…") e texto em Meu Corpo.
- **Objetivo de peso (§82):** redução / manutenção / aumento / sem meta, escolhido pelo usuário; o app nunca sugere.
- **Plausibilidade (spec §10):** peso 20–400 kg; altura 100–250; cintura 40–200; quadril 50–220; variação > 20 % vs. última medida pede confirmação. Altura diferente da do perfil atualiza o perfil.
- **Composição corporal (§83):** só armazena e mostra a evolução; aviso literal sobre métodos no topo; peso informado na bioimpedância também vira medida de peso (com `metodo`).
- Arquivos: `src/core/regras/bemestar/corpo.ts` (+ testes), `src/core/bemestar/{medidasCorporais,useCorpo}.ts`, `app/(app)/bem-estar/corpo/{index,registrar,composicao,entenda}.tsx`, `src/modules/bem-estar/{conteudo/corpo.ts,componentes/GraficoSerie.tsx}`.

## 2. Minhas Atividades (§77–§79) — Fase 4a
- **Dados:** tabela `atividades` (tipo, início, duração, intensidade percebida leve/moderada/vigorosa, distância, FC, calorias, observação). Metas em `metas` (uma ativa por tipo).
- **Meta (C-017):** regra `atividade/meta` = OMS 2020 / Guia MS 2021: 150–300 min moderada ou 75–150 vigorosa ou combinação; fortalecimento ≥ 2 dias; ≥ 60 anos equilíbrio ≥ 3 dias. `minutosQueContam` = moderada + vigorosa × 2; leve não conta (aparece à parte). Meta sugerida (origem `app`, 150 min) ou própria (origem `usuario`) — `resumoSemana` usa a meta ativa de `atividade_min` ou a sugerida. Frase da OMS ("qualquer atividade é melhor do que nenhuma") na regra.
- **Sua semana (§78):** segunda a domingo (`semanaDe`), totais por intensidade, dias ativos, dias de fortalecimento (musculação, funcional, pilates), barras seg→dom, progresso da meta. **Últimos 30 dias:** sessões e minutos por tipo (`resumo30d`).
- Arquivos: `src/core/regras/bemestar/atividade.ts`, `src/core/bemestar/{atividades,metas,useAtividades,useMetas}.ts`, `app/(app)/bem-estar/atividade/{index,registrar}.tsx`.

## 3. Meu Sono (§80) — Fase 4a
- **Dados:** `medidas` tipo `sono` (`medido_em` = hora de acordar; `valores` = dormiu_em, acordou_em, minutos, qualidade 1–5; `contexto` = acordou à noite, cochilou, dificuldade para adormecer, acordou descansado).
- **Cálculo:** `minutosDeSono` (1 min a 20 h; acordar antes de dormir assume o dia seguinte na tela); `resumo7d` = noites cujo despertar cai nos últimos 7 dias, média, horário médio de dormir e de acordar por **média circular** (23:40 e 00:20 → 00:00), barras por noite com a linha de 7 h.
- **Referência (C-018):** regra `sono/duracao` = AASM/SRS 2015: adultos ≥ 7 h; média < 7 h → texto neutro ("se isso for frequente, vale conversar com seu médico"); > 9 h sem comentário; sem rastreio de insônia/apneia.
- Arquivos: `src/core/regras/bemestar/sono.ts`, `src/core/bemestar/{sono,useSono}.ts`, `app/(app)/bem-estar/sono/{index,registrar}.tsx`.

## 4. Meus hábitos e Home (§85) — Fase 4a (parcial)
- `habitos7d`: movimento da semana vs. meta, média de sono, peso (com variação vs. média dos 7 dias anteriores à medida), cintura (com "há n dias"). Refeições e check-in entram no plano 4b.
- **Home:** card do módulo ativo com subtítulo ("90 de 150 min esta semana · sono 7h03"); item cinza `perda_peso` (C-019); item cinza `atividade_semana` **só aos domingos** quando abaixo da meta (para não virar cobrança diária).
- Arquivos: `src/core/regras/bemestar/habitos.ts`, `src/core/bemestar/useHabitos.ts`, `app/(app)/bem-estar/index.tsx`, `src/modules/home/montarItensHoje.ts`.

## 5–8. Minha Alimentação · Conexão com glicemia · Metas e check-in · Relatório de Saúde & Hábitos — Fase 4b
*(a escrever com o plano 4b)*
