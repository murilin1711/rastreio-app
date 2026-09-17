# Coração & Metabolismo — como cada funcionalidade funciona e em que se baseia

> Documento vivo da Fase 2 (índice dos módulos em `README.md`). Uma seção por funcionalidade, escrita conforme cada decisão (C-010…) é aprovada. Cada regra cita a referência do acervo (`../referencias/REFERENCIAS.md`) com seção/quadro. Serve de fonte para a spec técnica, para a semente de `regras_clinicas` e para revisão clínica futura.
>
> Regra de trabalho (Murilo, 17/09/2026): antes de propor um parâmetro, verificar o que a **diretriz mais recente** diz — inclusive o que ela *deixou de* recomendar. Nada de janelas ou contagens inventadas; onde a diretriz não fixa, o app convida ou pergunta, nunca alerta.

## Referências usadas nesta fase

| Sigla | Documento | Arquivo |
|---|---|---|
| DBHA 2025 | Diretriz Brasileira de Hipertensão Arterial – 2025 (SBC/SBH/SBN) | `../referencias/pdf/2025-SBC-SBH-SBN-diretriz-hipertensao-arterial.pdf` |
| Medidas 2023 | Diretrizes Brasileiras de Medidas da PA Dentro e Fora do Consultório – 2023 (SBC) | `../referencias/pdf/2023-SBC-medidas-pressao-arterial-dentro-fora-consultorio.pdf` |
| Dislipidemias 2025 | Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose – 2025 (SBC) | `../referencias/pdf/2025-SBC-diretriz-dislipidemias-prevencao-aterosclerose.pdf` |
| SBD 2026 – Metas | Metas de controle glicêmico (SBD, ed. 2026) | `../referencias/texto/2026-SBD-metas-controle-glicemico.md` |
| SBD 2026 – Monitorização | Monitorização da glicemia capilar, CGM e cetonemia (SBD, ed. 2026) | `../referencias/texto/2026-SBD-monitorizacao-glicemia.md` |
| PREVENT 2023 / 2024 | Khan et al., AHA Scientific Statement 2023; Development and Validation 2024 + suplemento | **a obter** (download manual) |

Versões substituídas e **não usadas**: DBHA 2020; 4ª Diretriz de MRPA 2018.

---

## 1. Minha Pressão — registro simples (§1) e alertas em camadas (§4) — C-010, aprovado 17/09/2026

### Conceito que orienta tudo
Uma medida feita em casa fora de protocolo é **automedida (AMPA)**. A DBHA 2025 (§3.7.1) afirma que não há valores de normalidade nem protocolo (número de medidas, horários, dias) validados para AMPA, e que ela serve **apenas como triagem** para solicitar MRPA ou MAPA. A Medidas 2023 (§3.1) retira o critério antigo de "7 medidas em 16–72 h". Só **MRPA e MAPA** têm limiar: **≥ 130 e/ou ≥ 80 mmHg** (DBHA 2025 Quadro 3.4; Medidas 2023 Quadro 9 e Parte 4 §4).

### Ao salvar uma medida
1. Validação de plausibilidade (Medidas 2023, Parte 4 §3 — critérios de exclusão da MRPA, aplicados como pedido de confirmação): PAD > 140 ou < 40; PAS < 70 ou > 250; PAS < PAD; pressão de pulso < 20 ou > 100 → "Confira os valores digitados" antes de salvar.
2. Contexto educativo, **sem cor de alerta**: "Em casa, as diretrizes usam 130/80 como referência para a MRPA. Uma medida isolada não confirma nem afasta hipertensão."
3. Camada 3 — **valor muito elevado (laranja)**: PAS ≥ 180 e/ou PAD ≥ 110 (DBHA 2025, cap. 11.1) → orientar repouso de 5 min e repetir; perguntar sintomas de alarme (§4: dor torácica, falta de ar importante, déficit neurológico, alteração visual importante, confusão, desmaio).
4. Camada 4 — **muito elevado com sintoma de alarme (vermelho)** → "Esses sintomas podem indicar uma condição que precisa de avaliação urgente. Procure um serviço de emergência agora." (DBHA 2025, cap. 11: emergência hipertensiva é definida pela lesão de órgão-alvo, não só pelo número.)

### Medidas casuais acumuladas
- Camada 2b — **convite para MRPA, sem cor**: ≥ 3 medidas casuais com PAS ≥ 130 e/ou PAD ≥ 80 nos últimos 7 dias → "Suas medidas em casa vêm ficando acima da referência. As diretrizes recomendam confirmar com uma MRPA. Quer iniciar uma pelo app e conversar com seu médico?" Exibido no máximo uma vez a cada 30 dias. O gatilho é de produto (a diretriz não fixa), por isso é convite, não alerta.
- O app **não** calcula "hipertensão provável" a partir de medidas casuais.

### Médias e gráficos (§1)
Média semanal/mensal, maior/menor, gráficos de PAS/PAD são **descritivos**; a única interpretação com cor vem da MRPA (seção 2).

### Camada 2 — "medidas repetidamente elevadas" (amarelo)
Disparada **somente** por uma sessão de MRPA concluída e válida (regras em C-011) com média global ≥ 130 e/ou ≥ 80 → mensagem do §4 ("Suas medidas recentes estão acima do esperado. Considere conversar com seu profissional de saúde.") + "Leve o relatório da MRPA à consulta."

### Mensagens — princípio
§25: o app mostra o **dado**, dá **interpretação educativa** que não assusta e devolve a **conduta** ao médico. Nunca escreve "você tem hipertensão".

---

## 2. MRPA — protocolo guiado, tela diária e relatório (§2–§3) — C-011, aprovado 17/09/2026

### Fonte
Diretrizes de Medidas da PA 2023, Parte 4 (GR I, NE C): §3 protocolo, §4 valores de anormalidade, §5 laudo; Quadro 19 (instruções ao paciente); Figura 8 (diário). A spec de produto §2 descrevia o protocolo de 2018 (2 medidas por ocasião, 7 dias) — **substituído**.

### Iniciar MRPA
1. Texto de abertura (§2 da spec) + instruções do Quadro 19: ambiente silencioso; 30 min sem fumar, cafeína, comida ou exercício; sentado e relaxado 3–5 min, bexiga vazia; costas apoiadas, pernas descruzadas, pés no chão; braço nu apoiado na mesa, meio do braço na altura do coração; não falar; sempre o mesmo braço (o de maior PA no consultório, se souber); não medir a PA de outras pessoas; não mudar remédios por causa das medidas; medidas altas ou baixas isoladas não devem preocupar.
2. Duração: 4, 5 ou 6 dias — padrão 6 ("idealmente 6 dias"). Se o médico pediu outra duração fora dessa faixa, o app explica que a diretriz prevê 4–6 e não aceita.
3. Opcional: "PA medida no consultório" (média das duas últimas de três) — usada só para a linha "diferença consultório × MRPA" do relatório.
4. Lembretes: manhã e noite em horários escolhidos pelo paciente (integra §22).

### Cada ocasião (manhã ou noite)
- Regras: após 5 min de repouso; antes da refeição (se comeu, aguardar 2 h); bexiga vazia; antes do anti-hipertensivo.
- O app conduz **3 medidas em sequência**, com cronômetro de **1 minuto** entre elas; cada medida grava PAS, PAD, FC, horário, `periodo` (manhã/noite) e `ordem` (1–3).
- Valores implausíveis (critérios de exclusão da diretriz) pedem confirmação; se confirmados, ficam gravados e marcados `excluida` com o motivo — entram na tabela, não na média.
- Tela diária mostra as 3 medidas de cada período e a média da manhã, da noite e do dia.

### Concluir
- Botão "Concluir" só habilita após o último dia previsto; "Cancelar" a qualquer momento (sessão marcada cancelada, medidas preservadas). Dia sem medida não estende a sessão.
- **Validade** (Parte 4 §5): mínimo de 14 medidas válidas em 4 dias, 15 em 5, 18 em 6, **e** todos os dias com pelo menos uma medida válida de manhã e uma de noite. Se não atinge: relatório marcado "não atinge o mínimo para interpretação" e a camada 2 de C-010 **não** dispara.

### Relatório (em tela agora; PDF na Fase 3, §26/§61)
Período; dias com registro; nº de medidas válidas e excluídas (com motivo); **médias total, da manhã, da noite e por dia**; resultado: "dentro da referência" (< 130 e < 80) · "acima da referência (≥ 130 e/ou ≥ 80)" · "não interpretável"; diferença consultório × MRPA quando informada; medicações em uso no período (de `medicacoes`); sintomas registrados; gráfico por dia; tabela completa. Ressalva final literal: "A MRPA, como os demais exames complementares em medicina, deve ser avaliada segundo critérios do médico assistente." + texto do §3 da spec.

### Se o resultado for ≥ 130 e/ou ≥ 80 (válido)
Camada 2 de C-010 (amarelo): "Suas medidas recentes estão acima do esperado. Considere conversar com seu profissional de saúde. Leve este relatório à consulta." Nunca "você é hipertenso".

### Banco
`mrpa_sessoes.dias_previstos` restrito a 4–6 (migração); `medidas.contexto` para tipo `pa` em sessão: `{"periodo":"manha"|"noite","ordem":1..3,"excluida":true,"motivo_exclusao":"pp_menor_20"}`; sessão guarda `pa_consultorio` opcional.

---

## 3. Minha Glicemia (§5–§8) — C-012, aprovado 17/09/2026

### Fontes
SBD 2026: Metas de controle glicêmico (R6, Tabela 1, níveis de hipoglicemia); Monitorização da glicemia capilar (R5, R8–R10); Diagnóstico de DM (R1–R2, Tabela 1); Manejo dos dias de doença no DM1 (Tabela 1); Cetoacidose diabética (sintomas).

### Registro (§5–§6)
Momento (lista do §5), valor em mg/dL, data/hora; opcionais: refeição, medicamento/insulina (dose, horário), atividade física, sintomas. Lista de sintomas ampliada: os de hipoglicemia do §6 (tremor, sudorese, tontura, fraqueza, confusão) **+** os de hiperglicemia/cetoacidose (sede intensa, náusea, vômito, dor abdominal, respiração rápida, sonolência).

### Metas ("Meu plano de glicemia", §7)
1. "Quem definiu suas metas?" — meu médico → digita jejum/pré-prandial, 2 h pós-refeição, ao deitar; opcionalmente escolhe o perfil que o médico indicou (adulto · idoso comprometido · idoso muito comprometido), que preenche a Tabela 1 da SBD.
2. Sem definição → padrão **Adultos** (jejum/pré 80–130; 2 h pós < 180; ao deitar 90–150), rótulo "meta da diretriz SBD 2026 — confirme com seu médico".
3. Sem diabetes no perfil → sem metas; o app não pinta "acima/abaixo da meta".

### Plano de monitorização (§7)
Se o médico prescreveu horários, o paciente marca. Se não, o app oferece modelos da diretriz (marcados "confirme com seu médico"): DM1 sem sensor → antes das refeições e ao deitar (≥ 5/dia); DM2 com insulina basal → jejum (+ noturna eventual); DM2 com insulina intensiva → antes das refeições e ao deitar; DM2 sem insulina → sem horários fixos. Lembretes só para os horários marcados (§22).

### Interpretação ao salvar — camadas
| Faixa | Cor | Mensagem (resumo) |
|---|---|---|
| Qualquer valor + confusão / precisou de ajuda (nível 3) | vermelho | Procure atendimento de emergência agora. |
| > 250 + sintoma de cetoacidose | vermelho | Esses sintomas com glicemia alta precisam de avaliação urgente. |
| < 54 (nível 2) | laranja | Valor muito baixo: siga agora a orientação do seu médico para hipoglicemia; se não melhorar, peça ajuda. |
| > 250 | laranja | Valor muito alto: repita a medida; se tem DM1 ou usa bomba, verifique cetonas como seu médico orientou. |
| 54–69 (nível 1) | amarelo | Abaixo de 70: siga a orientação do seu médico para hipoglicemia. |
| Fora da meta (com diabetes) | educativa (§16) | "Acima/abaixo da sua meta" — sem alerta. |
| Sem diabetes: jejum ≥ 126 ou casual ≥ 200 | convite, sem cor | Glicemia capilar não faz diagnóstico; converse com seu médico sobre um exame de laboratório. |
| Sem diabetes: jejum 100–125 | contextualização | Faixa que a diretriz chama de pré-diabetes quando confirmada em laboratório. |

O app nunca sugere dose de insulina nem "coma 15 g de carboidrato": conduta é do médico (§25).

### Relatório (§8)
Período (7/14/30/90/personalizado); médias geral, jejum, pré-prandial, 2 h pós; nº de registros; menor/maior; nº abaixo e acima da meta (só com metas); episódios < 70 e > 250 destacados; tabela e gráfico; medicações do período. Ressalva: organiza registros, não substitui a interpretação do médico.

---

## 4. Meu Risco Cardiovascular — PREVENT (§13–§18) — C-013, aprovado 17/09/2026

### Fontes
Diretriz Brasileira de Dislipidemias 2025: rec. de estratificação (p. 19/51), §4.2 (escore), §4.3 e Tabela 4.3 (agravantes), Tabela 4.1 (categorias), Tabela 4.4 (CAC), §4.8–4.9 (idosos e jovens). Khan et al. 2023 (AHA Statement) e 2024 (Circulation + suplemento com coeficientes) — **a obter por download manual**.

### Elegibilidade
- 30–79 anos, sem evento aterosclerótico prévio nem revascularização (campo novo em `perfil_saude`). Fora disso o app mostra "o escore não foi desenvolvido para a sua situação; a avaliação de risco é feita pelo seu médico" e não calcula.

### Entradas (§13) e de onde vêm
| Variável | Origem | Regra de "dado recente" |
|---|---|---|
| Idade, sexo | perfil | — |
| Colesterol total, HDL-c | `exames` laboratoriais | C-014 |
| PA sistólica | média da MRPA válida mais recente; senão média das medidas casuais recentes | C-014 |
| Anti-hipertensivo em uso, estatina em uso | `medicacoes` ativas (classe) + confirmação | — |
| Diabetes | perfil (comorbidades) | — |
| Tabagismo atual | perfil | C-014 |
| IMC | peso (`medidas`) + altura (perfil) | C-014 |
| TFG | valor de laboratório; senão CKD-EPI 2021 (sem raça) a partir da creatinina | C-014 |
| HbA1c, RAC urinária (opcionais) | `exames` | C-014 |
| SDI | **nunca** — índice de privação social por CEP dos EUA | — |

Tela "Deseja utilizar seus dados mais recentes?" (§14) lista cada valor com a data; o que estiver fora da janela aparece marcado para redigitar/atualizar.

### Cálculo
- Modelo básico do PREVENT; se HbA1c e/ou RAC disponíveis, o conjunto de coeficientes correspondente (suplemento de Khan 2024). Implementação em `src/core/regras` (TypeScript puro), com testes que reproduzem casos da calculadora oficial da AHA.
- Saída principal: **risco de evento aterosclerótico (ASCVD) em 10 anos**. Secundária: **ASCVD em 30 anos** só para 30–59 anos.

### Resultado (§15–§16)
- "Seu risco cardiovascular estimado em 10 anos: X %" + categoria pelo escore (Tabela 4.1): < 5 % baixo · 5 a < 20 % intermediário · ≥ 20 % alto — rótulo "categoria pelo escore; a estratificação final é do seu médico, que considera diabetes, LDL, exames de imagem e outros fatores".
- 30 anos (quando houver): "estimativa em 30 anos: Y %" sem categoria, com o texto da diretriz sobre conscientização.
- Frase obrigatória do §15 sobre estimativa/interpretação com o médico.
- "O que está impactando meu risco" (§16): cores educativas por fator (tabagismo, PA vs. meta, LDL vs. meta individual se houver, diabetes, IMC, atividade física) — nunca diagnóstico.
- Cada cálculo é salvo com data e todos os dados usados (para o relatório §26 e a linha do tempo §20).

### Agravantes (§17)
Checklist com os itens da Tabela 4.3 (lista no registro C-013). Qualquer item marcado → "Existem fatores adicionais que podem modificar a interpretação do seu risco calculado. Converse com seu médico." O app **não** reclassifica. Doença renal crônica e hipercolesterolemia familiar aparecem apenas no texto educativo como situações que o médico estratifica de outra forma.

### Escore de cálcio (§18)
Registro em `exames` (categoria cardiológica) com valor Agatston, percentil (opcional) e data. Se > 100 UA ou percentil > 75, ou > 300 UA → "A diretriz considera esse valor um estratificador de risco. Converse com seu médico." Aparece no histórico cardiovascular.

---

## 5. Janelas de "dado recente" — preenchimento automático (§14) e check-up (§24) — C-014, aprovado 17/09/2026

### Base
Decisão de produto (as diretrizes não fixam "validade" de dado para calculadora). Âncoras: perfil lipídico anual após meta (Dislipidemias 2025); reavaliação de FRCV/LOA pelo menos anual e PA normal repetida anualmente (DBHA 2025); medidas casuais são triagem (C-010).

### Tabela de janelas
| Dado | Usa direto | Pergunta "tem mais recente?" | Pede novo |
|---|---|---|---|
| PA sistólica | MRPA válida concluída ≤ 30 dias **ou** média de ≥ 3 medidas casuais nos últimos 7 dias | — | fora disso: medir agora (sentado, 5 min de repouso) ou iniciar MRPA |
| Peso → IMC | ≤ 30 dias | 31–90 dias | > 90 dias |
| Tabagismo | perfil, confirmação de um toque | — | — |
| CT, HDL-c | ≤ 12 meses | > 12 meses; sem exame novo calcula com aviso "dados com mais de 1 ano" + pendência §24 | nunca bloqueia |
| Creatinina / TFG | ≤ 12 meses | idem | nunca bloqueia |
| HbA1c (opcional) | ≤ 6 meses | > 6 meses; sem novo, calcula sem HbA1c | — |
| RAC urinária (opcional) | ≤ 12 meses | idem | — |
| Anti-hipertensivo, estatina | `medicacoes` ativas | confirmação na tela | — |

### Tela "Deseja utilizar seus dados mais recentes?" (§14)
Lista cada variável com valor, data e estado (atual · antigo · faltando). "Antigo" abre a pergunta; "faltando" abre o campo. Cada cálculo salvo guarda os valores e datas usados.

### Check-up "Como está minha prevenção?" (§24)
Conta "informações atualizadas: n/8" com as janelas de "usa direto": PA · peso/IMC · tabagismo · glicemia/HbA1c (quando há diabetes) · perfil lipídico · função renal · atividade física (Fase 4; até lá conta como "não registrado") · risco calculado (12 meses). Cada item faltante vira uma frase do tipo "Falta atualizar seu perfil lipídico" — sem pedir exames além dos que o próprio módulo usa.

---

## 6. Meus Exames (§9–§11), Medicações (§21), Lembretes (§22), Sinais de alerta (§23), Dashboard e linha do tempo (§19–§20)

Sem decisão clínica pendente: seguem a spec de produto e as estruturas já existentes (`exames`, `medicacoes`, `lembretes`). Detalhamento na spec técnica da Fase 2.
