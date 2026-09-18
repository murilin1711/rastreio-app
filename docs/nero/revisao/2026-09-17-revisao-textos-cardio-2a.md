# Revisão clínica — textos do Coração & Metabolismo (Fase 2a: pressão e MRPA)

> Para o Murilo revisar. Cada bloco indica o arquivo de origem. Anote as correções aqui (ou me diga em conversa) e eu aplico no código.
> Regra: linguagem do §25 — orienta, não assusta, não diagnostica; sempre remete ao médico quando a conduta depende dele. Medidas casuais nunca recebem cor abaixo de 180/110 (C-010).

## Mensagens das regras — `supabase/seed.sql` (bloco Fase 2, programa `pressao`)

| Camada | Fonte | Mensagem ao paciente |
|---|---|---|
| Valores implausíveis | Medidas 2023, Parte 4 §3 | Confira os valores digitados. Esta combinação é incomum para uma medida de pressão. Se estiver correta, você pode salvar mesmo assim. |
| Referência domiciliar (toda medida casual) | DBHA 2025 Q3.4; Medidas 2023 §3.1 | Em casa, as diretrizes usam 130/80 como referência para a MRPA. Uma medida isolada não confirma nem afasta hipertensão. |
| Convite para MRPA (≥ 3 medidas ≥ 130/80 em 7 dias) | C-010 | Suas medidas em casa vêm ficando acima da referência. As diretrizes recomendam confirmar com uma MRPA. Quer iniciar uma pelo app e conversar com seu médico? |
| Muito elevado (≥ 180 e/ou ≥ 110) — laranja | DBHA 2025 cap. 11.1 | Este valor está muito acima do habitual. Sente-se, descanse 5 minutos e meça de novo. Se você tiver algum dos sintomas a seguir, procure atendimento imediatamente. |
| Muito elevado + sintoma — vermelho | DBHA 2025 cap. 11 | Pressão muito elevada com esses sintomas pode indicar uma condição que precisa de avaliação urgente. Procure um serviço de emergência agora. |
| MRPA válida ≥ 130 e/ou ≥ 80 — amarelo | DBHA 2025 Q3.4; Medidas 2023 P4 §4 | Suas medidas recentes estão acima do esperado. Considere conversar com seu profissional de saúde. Leve este relatório à consulta. |
| MRPA inválida — cinza | Medidas 2023 P4 §5 | Esta MRPA não atingiu o número mínimo de medidas para interpretação. O relatório mostra o que foi registrado; converse com seu médico sobre repetir o protocolo. |

## Minha Pressão — `src/modules/coracao/conteudo/pressao.ts`

### Antes de medir (Quadro 19 da Medidas 2023)
- Fique em um lugar tranquilo e confortável.
- Não fume, não tome café e não faça exercício nos 30 minutos antes.
- Sente-se e relaxe por 3 a 5 minutos, com a bexiga vazia.
- Costas apoiadas, pernas descruzadas, pés no chão.
- Braço apoiado na mesa, na altura do coração, sem roupa apertando.
- Não converse durante a medida.
- Use sempre o mesmo braço.

### Entenda a referência (mostrado quando a medida casual fica ≥ 130/80)
Uma medida isolada não confirma nem afasta hipertensão. Em casa, as diretrizes usam 130/80 como referência para a MRPA, um protocolo de vários dias. Se suas medidas ficarem acima disso com frequência, o caminho é confirmar com uma MRPA e conversar com seu médico.

### Sintomas de alarme (§4) — rótulos
Dor ou aperto no peito · Falta de ar importante · Fraqueza ou formigamento de um lado do corpo, dificuldade para falar · Alteração importante da visão · Confusão mental · Desmaio

### Chips na tela de resultado
"Valor muito elevado" (laranja) · "Procure atendimento agora" (vermelho)

## MRPA — `src/modules/coracao/conteudo/pressao.ts` e telas `app/(app)/coracao/mrpa/*`

### Abertura (spec §2, literal)
Você iniciará um protocolo de monitorização residencial da pressão arterial. Procure realizar todas as medidas nas mesmas condições.

### Como será (Medidas 2023, Parte 4 §3)
- 3 medidas de manhã e 3 à noite, com 1 minuto entre elas.
- Antes do café da manhã e antes do jantar. Se já comeu, espere 2 horas.
- Antes de tomar o remédio de pressão, se você usa.
- Depois de 5 minutos de repouso, sentado, com a bexiga vazia.
- Não meça a pressão de outras pessoas com o aparelho durante o protocolo.
- Não mude seus remédios por causa das medidas. Valores altos ou baixos isolados não devem preocupar.

### Duração
"A diretriz recomenda de 4 a 6 dias; o ideal são 6. Se seu médico pediu outra duração, use a mais próxima dentro dessa faixa." Opções: 6 dias (Recomendado) · 5 dias · 4 dias (Mínimo da diretriz).

### PA do consultório (opcional)
"Se seu médico mediu sua pressão recentemente, o relatório mostra a diferença entre o consultório e a sua casa."

### Tela diária
"Nenhuma interpretação é feita antes do fim do protocolo. Valores altos ou baixos isolados não devem preocupar; não mude seus remédios por causa deles." · Botão "Concluir MRPA" com "Disponível a partir do dia N" · "Cancelar a MRPA? As medidas já feitas ficam guardadas, mas não haverá relatório."

### Medição guiada
"Já descansei 5 minutos — começar" · "Aguarde 1 minuto para a próxima medida. Continue sentado, sem falar." · "Pular espera" · Após as 3: "Nenhuma interpretação é feita antes do fim do protocolo. Siga com as próximas medidas nos horários combinados."
Valor ≥ 180/110 durante a MRPA: alerta com a mesma mensagem laranja da regra.
Valor implausível: "… Se salvar, ela fica registrada mas não entra no cálculo."

### Relatório
- Chip amarelo: "Acima da referência (≥ 130 e/ou ≥ 80)" + mensagem da regra.
- Sem chip: "Dentro da referência da MRPA (< 130 e < 80)" + "Suas medidas em casa ficaram dentro da referência usada pelas diretrizes. Leve o relatório à consulta para o seu médico avaliar junto com os demais dados."
- Chip cinza: "Não atinge o mínimo para interpretação" + motivo (Faltaram medidas para o mínimo da diretriz · Um ou mais dias ficaram sem medidas de manhã ou de noite · Nenhuma medida registrada) + mensagem da regra.
- Ressalvas literais: "A MRPA, como os demais exames complementares em medicina, deve ser avaliada segundo critérios do médico assistente." · "Este relatório organiza suas aferições domiciliares e não substitui a interpretação realizada pelo seu médico."

### Lembretes (§22)
"Hora de registrar sua pressão — MRPA, dia 3 de 6 (manhã)." · Medicação: "Hora do seu medicamento: Losartana."

## Sinais de alerta — `src/modules/coracao/conteudo/sinais.ts` (§23)
- Dor ou pressão intensa no peito
- Falta de ar importante
- Desmaio
- Fraqueza ou formigamento súbito de um lado do corpo
- Dificuldade para falar ou boca torta
- Palpitações com mal-estar, tontura ou suor frio
- Pressão muito alta (180/110 ou mais) junto com qualquer sintoma acima
- Glicemia muito baixa com confusão, ou muito alta com vômitos e sonolência

"Esses sintomas podem representar uma condição que necessita avaliação urgente. Não espere: procure um serviço de emergência ou ligue 192 (SAMU)."

## Home — `src/modules/home/montarItensHoje.ts`
- Laranja: "Repetir a medida: pressão muito elevada" / Vermelho: "Procurar atendimento: pressão muito elevada com sintomas" — "Última medida 185/95. Descanse 5 minutos e meça de novo."
- Amarelo: "Fazer as medidas da noite — MRPA, dia 3 de 6" — "3 medidas com 1 minuto de intervalo."
- Amarelo: "Levar o relatório da MRPA ao médico" — "Suas medidas ficaram acima da referência. Converse com seu profissional de saúde."
