# Revisão — textos de Saúde & Bem-estar (Fase 4b: alimentação, conexão com glicemia, metas, check-in, relatório)

> Para o Murilo revisar. Cada bloco indica o arquivo de origem. Anote as correções aqui (ou me diga em conversa) e eu aplico no código.
> Regra do módulo (§69, §76): mostra evolução, não julga; nada de "bom/ruim", "você comeu errado". O check-in não é instrumento diagnóstico.

## Alimentação — `src/modules/bem-estar/conteudo/alimentacao.ts` e `src/core/regras/bemestar/alimentacao.ts`
- Subtítulo: "O NERO não conta calorias nem classifica alimentos. O diário serve para você e seu médico enxergarem padrões — horários, frequência e o que acompanha cada refeição."
- Padrão (§76): "Você costuma realizar suas refeições principais em horários semelhantes." / "Nos últimos sete dias, seus horários de refeição variaram bastante." (critério: desvio ≤ 45 min em todas as principais / > 90 min em alguma).
- Vazio: "Nenhuma refeição registrada ainda. Registre a última que você fez — bastam duas palavras." · ajuda do campo: "Ex.: arroz, feijão, frango grelhado, salada e suco." · obrigatório: "Escreva o que você comeu, mesmo que em poucas palavras."
- Rótulos: Café da manhã · Lanche · Almoço · Lanche da tarde · Jantar · Ceia · Outra; quantidade Pequena · Habitual · Grande; saciedade "Ainda com fome" · "Satisfeito" · "Muito cheio"; local Casa · Trabalho / faculdade · Restaurante · Outro; fome "0 = nenhuma, 10 = muita".

## Conexão com glicemia (C-020) — `src/modules/bem-estar/componentes/VinculoGlicemia.tsx`
- "Esta glicemia está relacionada ao almoço das 12:30?" · "Foi medida após a caminhada das 18:00?" · Sim / Não · "Vinculada. Aparece junto no relatório." / "Sem vínculo."
- Relatório: coluna "Refeição / atividade vinculada" com "almoço 12:30" ou "caminhada 18:00 (40 min)".

## Metas — `app/(app)/bem-estar/metas/index.tsx`
- "Objetivos definidos por você ou junto com seu profissional. O NERO mostra a distância; não define metas de peso por conta própria."
- Vazio: "Nenhuma meta definida. Isso é normal — use o módulo só para acompanhar, se preferir."
- Peso-alvo bloqueado em manutenção/sem meta: "Você escolheu manutenção ou sem meta de peso. Para definir um peso-alvo, mude o objetivo em Meu Corpo."
- Tipos: Peso (kg) · Circunferência abdominal (cm) · Atividade (minutos por semana) · Dias ativos por semana · Fortalecimento (dias por semana) · Sono (horas por noite). Origem: "Eu" / "Meu médico ou outro profissional". Distância: "2,4 kg acima da meta" / "Na meta".

## Check-in — `src/modules/bem-estar/conteudo/checkin.ts`
- "Como foi sua semana?" · "Sete perguntas rápidas, de 0 a 10. Isso cria um histórico do que você sentiu ao lado dos números. O NERO não faz diagnóstico com essas respostas."
- Perguntas: "Como esteve sua disposição?" · "Como você avalia sua alimentação?" · "Como esteve sua atividade física?" · "Como foi seu sono?" · "Como você avalia seu nível de estresse?" · "Nível de energia" · "Bem-estar geral" · extremos "muito ruim / muito bom" (estresse: "nenhum / muito").
- "Existe algo que gostaria de registrar sobre esta semana?" · salvo: "Check-in da semana salvo. Você pode ajustar as respostas até a próxima semana." · card: "Como foi sua semana? Responder leva 1 minuto." · Home: "Fazer o check-in da semana" (cinza) · "Seus meses": "Médias das respostas do mês (0 a 10). O objetivo é só acompanhar."

## Relatório de Saúde & Hábitos — `src/core/relatorios/{montar,html}.ts`
- Título: "Relatório de Saúde & Hábitos". Ressalva extra (literal): "Registros de hábitos, alimentação e sono são autorrelatados." (junto das do §26 e §40).
- Corpo: "Peso atual 82,0 kg (15/09/2026) · IMC 28,4 — Sobrepeso" · "Circunferência abdominal 96 cm — aumentado · relação cintura/altura 0,56 (acima de 0,5)" · "Tendência do peso: redução (médias de 14 dias)" · "Peso máximo da vida 95,0 kg · 13,7 % abaixo · faixa de obesidade controlada (ABESO 2026)" · "Objetivo de peso escolhido: manutenção".
- Alimentação: "n refeições registradas no período. O diário não conta calorias nem classifica alimentos." · colunas "Semana de · Dias registrados · Café · Almoço · Jantar · Padrão".
- Atividade: "Meta em uso: 150 min/semana de atividade moderada ou equivalente (sugerida OMS/MS) + fortalecimento em 2 dias." · colunas "Semana de · Minutos que contam · Total · Dias ativos · Fortalecimento (dias)".
- Sono: "Referência para adultos: 7h00 ou mais por noite (AASM/SRS 2015). Registros manuais; sem avaliação de insônia ou apneia."
- Check-ins: "Respostas de 0 a 10 dadas pelo paciente sobre a semana. Não é instrumento diagnóstico."
- Linha do tempo: "Sono — semana de 14/09: média 7h00 (2 noites)" · "Atividade — semana de 14/09: 80 min que contam · 2 sessões" · "Check-in semanal: bem-estar 7/10 · energia 6/10 · estresse 4/10".
