# Coração & Metabolismo — como cada funcionalidade funciona e em que se baseia

> Documento vivo da Fase 2. Uma seção por funcionalidade, escrita conforme cada decisão (C-010…) é aprovada. Cada regra cita a referência do acervo (`referencias/REFERENCIAS.md`) com seção/quadro. Serve de fonte para a spec técnica, para a semente de `regras_clinicas` e para revisão clínica futura.
>
> Regra de trabalho (Murilo, 17/09/2026): antes de propor um parâmetro, verificar o que a **diretriz mais recente** diz — inclusive o que ela *deixou de* recomendar. Nada de janelas ou contagens inventadas; onde a diretriz não fixa, o app convida ou pergunta, nunca alerta.

## Referências usadas nesta fase

| Sigla | Documento | Arquivo |
|---|---|---|
| DBHA 2025 | Diretriz Brasileira de Hipertensão Arterial – 2025 (SBC/SBH/SBN) | `referencias/pdf/2025-SBC-SBH-SBN-diretriz-hipertensao-arterial.pdf` |
| Medidas 2023 | Diretrizes Brasileiras de Medidas da PA Dentro e Fora do Consultório – 2023 (SBC) | `referencias/pdf/2023-SBC-medidas-pressao-arterial-dentro-fora-consultorio.pdf` |
| Dislipidemias 2025 | Diretriz Brasileira de Dislipidemias e Prevenção da Aterosclerose – 2025 (SBC) | `referencias/pdf/2025-SBC-diretriz-dislipidemias-prevencao-aterosclerose.pdf` |
| SBD 2026 – Metas | Metas de controle glicêmico (SBD, ed. 2026) | `referencias/texto/2026-SBD-metas-controle-glicemico.md` |
| SBD 2026 – Monitorização | Monitorização da glicemia capilar, CGM e cetonemia (SBD, ed. 2026) | `referencias/texto/2026-SBD-monitorizacao-glicemia.md` |
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

## 3. Minha Glicemia (§5–§8) — C-012 (em discussão)

*(preencher após a decisão)*
