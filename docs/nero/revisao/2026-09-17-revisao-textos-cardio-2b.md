# Revisão clínica — textos do Coração & Metabolismo (Fase 2b: glicemia, exames, risco, check-up)

> Para o Murilo revisar. Cada bloco indica o arquivo de origem. Anote as correções aqui (ou me diga em conversa) e eu aplico no código.
> Regra: linguagem do §25 — orienta, não assusta, não diagnostica; conduta é do médico (sem dose de insulina, sem "coma 15 g").

## Mensagens das regras — `supabase/seed.sql` (programas `glicemia` e `risco_cv`)

| Camada | Fonte | Mensagem ao paciente |
|---|---|---|
| Metas — adulto / idoso saudável | SBD 2026 Metas R6, Tabela 1 | Metas da diretriz da SBD 2026 para adultos e idosos saudáveis: jejum e antes das refeições entre 80 e 130, 2 horas após as refeições abaixo de 180, ao deitar entre 90 e 150. Confirme com seu médico. |
| Metas — idoso comprometido | Tabela 1 | Metas da diretriz da SBD 2026 para idosos com saúde comprometida: jejum e antes das refeições entre 90 e 150, 2 horas após as refeições abaixo de 180, ao deitar entre 100 e 180. Use só se seu médico indicou este enquadramento. |
| Metas — idoso muito comprometido | Tabela 1 | Metas da diretriz da SBD 2026 para idosos muito comprometidos: jejum e antes das refeições entre 100 e 180, ao deitar entre 110 e 200, sem meta após as refeições. Use só se seu médico indicou este enquadramento. |
| Hipoglicemia nível 1 (54–69) — amarelo | SBD 2026 | Sua glicemia está abaixo de 70. Siga a orientação do seu médico para hipoglicemia e meça de novo em seguida. Se tiver sintomas, trate agora. |
| Hipoglicemia nível 2 (< 54) — laranja | SBD 2026 | Sua glicemia está muito baixa (abaixo de 54). Siga agora a orientação do seu médico para hipoglicemia. Se não melhorar ou tiver confusão, peça ajuda a alguém próximo ou procure atendimento. |
| Hipoglicemia nível 3 — vermelho | SBD 2026 | Hipoglicemia com confusão ou que precisou da ajuda de outra pessoa é um evento grave. Procure atendimento de emergência agora. |
| Hiperglicemia > 250 — laranja | SBD 2026 Dias de doença | Sua glicemia está muito alta (acima de 250). Meça de novo e siga a orientação do seu médico. Se você tem diabetes tipo 1 ou usa bomba de insulina, verifique cetonas como seu médico orientou. |
| > 250 + sintoma de CAD — vermelho | SBD 2026 Cetoacidose | Glicemia muito alta com esses sintomas precisa de avaliação urgente. Procure um serviço de emergência agora. |
| Sem diabetes — contexto/convite | SBD 2026 Diagnóstico R1–R2 | Glicemia medida no dedo não faz diagnóstico. A diretriz usa exames de laboratório: jejum abaixo de 100 é normal; entre 100 e 125 é a faixa chamada de pré-diabetes; 126 ou mais, ou 200 ou mais com sintomas, é critério de diabetes. Converse com seu médico sobre fazer um exame de laboratório. |
| Categorias do PREVENT | Dislipidemias 2025 T4.1 | Categoria pelo escore: abaixo de 5% em 10 anos é risco baixo; de 5% a menos de 20% é intermediário; 20% ou mais é alto. A estratificação final é do seu médico, que considera diabetes, LDL, exames de imagem e outros fatores. |
| Elegibilidade | §4.2, §4.8–4.9 | O escore PREVENT foi desenvolvido para pessoas de 30 a 79 anos sem doença cardiovascular conhecida. Fora dessa situação, a avaliação de risco é feita pelo seu médico. |
| CAC | T4.4 | A diretriz considera esse valor de escore de cálcio um estratificador de risco cardiovascular. Converse com seu médico sobre o que ele significa para você. |
| Dados antigos | C-014 | Alguns dados usados no cálculo têm mais de um ano. O resultado é mostrado, mas vale atualizar seus exames para uma estimativa mais fiel. |

## Glicemia — `src/modules/coracao/conteudo/glicemia.ts` e telas
- Fora da meta (gerado): "Este valor está acima/abaixo da sua meta para este momento (80 a 130)." / "Dentro da sua meta para este momento (…)."
- Chips: "Glicemia baixa" (amarelo) · "Glicemia muito baixa" / "Glicemia muito alta" (laranja) · "Procure atendimento agora" (vermelho).
- "As metas ajudam a organizar seus registros e a conversa com seu médico. Elas não mudam seu tratamento: quem ajusta remédio ou insulina é o profissional que acompanha você."
- Sem diabetes: "Você não tem diabetes no seu perfil, por isso não há metas aqui. Glicemia medida no dedo não faz diagnóstico; se algum valor chamar atenção, o app sugere conversar com seu médico sobre um exame de laboratório."
- Modelos de plano (SBD 2026 Monitorização): DM1 sem sensor (R5) "Pelo menos 5 medidas por dia: antes das refeições e antes de dormir; também se suspeitar de hipoglicemia, antes de exercício e antes de dirigir." · DM2 basal (R9) "Glicemia em jejum, com medidas noturnas eventuais; também se suspeitar de hipoglicemia." · DM2 intensiva (R10) "Pelo menos antes das refeições e ao deitar; também se suspeitar de hipoglicemia e antes de dirigir." · DM2 sem insulina (R8) "A medida em casa pode ser considerada, de forma individualizada, para autoconhecimento e adesão. Sem horários fixos: combine com seu médico."
- Sintomas (rótulos): Tremor · Suor frio · Tontura · Fraqueza · Confusão mental · Precisei da ajuda de outra pessoa · Sede intensa · Náusea · Vômito · Dor na barriga · Respiração rápida · Sonolência.
- Lembrete: "Glicemia — antes do almoço."
- Relatório: ressalva "Este relatório organiza seus registros de glicemia e não substitui a interpretação realizada pelo seu médico."

## Exames — `src/core/cardio/tiposExames.ts` e telas
- Rótulos dos 25 laboratoriais e 13 cardiológicos (ver arquivo).
- "Registre o valor de cada exame para o app montar gráficos, evolução e o cálculo de risco. O laudo original pode ser anexado em breve."
- Fora da referência do laboratório: "A interpretação depende do seu histórico e dos outros exames. Converse com seu médico." (sem chip de cor)

## Risco — `src/modules/coracao/conteudo/risco.ts`, `agravantes.ts` e telas
- Entenda: "O PREVENT é a calculadora de risco adotada pela diretriz brasileira de 2025 para adultos de 30 a 79 anos sem doença cardiovascular conhecida. Ela estima a chance de um evento como infarto ou AVC nos próximos 10 anos a partir de idade, sexo, colesterol, pressão, diabetes, tabagismo, peso, função renal e remédios em uso."
- Resultado (§15, literal): "Este resultado é uma estimativa baseada em fatores clínicos e laboratoriais. Ele deve ser interpretado em conjunto com seu médico."
- 30 anos: "A estimativa em 30 anos não tem faixas de classificação na diretriz; ela serve para aumentar a consciência sobre os fatores de risco e a motivação para cuidar deles."
- Agravantes (§17, literal): "Existem fatores adicionais que podem modificar a interpretação do seu risco calculado. Converse com seu médico."
- Fatores (§16): "As cores abaixo são educativas, não um diagnóstico…" · "Fuma atualmente — é o fator que mais pesa e o que mais muda o resultado ao parar." · "Pressão sistólica X — acima da referência domiciliar de 130." · "IMC X — faixa de obesidade / sobrepeso." · "Função renal reduzida (TFG X)." · "Sedentarismo."
- Coeficientes pendentes: "O cálculo do PREVENT ainda não está disponível nesta versão: os coeficientes da equação estão sendo transcritos da publicação original (Khan et al., 2024). Seus dados já ficam organizados para quando ele for liberado."
- Inelegível: "O escore foi desenvolvido para pessoas de 30 a 79 anos." · "Quem já teve infarto, AVC ou procedimento nas artérias tem o risco avaliado de outra forma pelo médico."
- Pergunta de evento prévio: "Você já teve infarto, AVC, angioplastia, ponte de safena ou outro procedimento nas artérias?"
- Rótulos e detalhes dos 17 agravantes (Tabela 4.3): ver `src/core/regras/cardio/agravantes.ts`.

## Check-up e linha do tempo
- "Informações atualizadas: n/8" · frases: "Falta medir sua pressão nos últimos dias (ou concluir uma MRPA)." · "Falta registrar seu peso." · "Falta confirmar sua situação em relação ao cigarro." · "Falta atualizar sua hemoglobina glicada ou glicemia." / "Não se aplica: sem diabetes no perfil." · "Falta atualizar seu perfil lipídico." · "Falta atualizar sua creatinina ou TFG." · "Falta registrar sua atividade física (chega na próxima fase)." · "Falta calcular (ou atualizar) seu risco cardiovascular."
- Home: "Rever orientação: glicemia muito baixa" / "Repetir a medida: glicemia muito alta" / "Procurar atendimento: glicemia com sinais de alarme" · "Medir glicemia — antes do almoço" · "Atualizar minha prevenção: 5 de 8 em dia".
