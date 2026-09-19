# Ingestão de água — levantamento de fontes (C-021)

**Data do levantamento:** 19/09/2026. **Decisão:** usar **35 ml/kg/dia de água bebida** como meta sugerida.

> Leia isto antes de mexer no número. A escolha foi tomada com conhecimento de que **não existe diretriz que recomende "2 litros de água por dia"**, e o motivo está abaixo.

## O que as fontes dizem

| Fonte | Valor | Mede o quê | População |
|---|---|---|---|
| EFSA 2010, *Scientific Opinion on Dietary Reference Values for water*, EFSA Journal 8(3):1459 | 2,0 L/dia (mulheres) · 2,5 L/dia (homens) | **água total**: bebidas **e a água dos alimentos** | adultos, clima e atividade moderados |
| IOM/NASEM 2005, *DRI for Water, Potassium, Sodium, Chloride and Sulfate* | 2,7 L/dia (mulheres) · 3,7 L/dia (homens) | **água total**, sendo ~80 % de bebidas e ~20 % de alimentos | adultos |
| ESPEN 2019 (atualizada em 2022), *Clinical nutrition and hydration in geriatrics* | 1,6 L/dia (mulheres) · 2,0 L/dia (homens) | **bebidas** | idosos (65+) |
| Guia Alimentar para a População Brasileira (MS) | sem número fechado | — | população brasileira |
| "30–35 ml/kg/dia" | ~2,1–2,4 L para 70 kg | ambíguo na maioria das citações | regra de cálculo de nutrição clínica |

## Três coisas que este levantamento estabeleceu

1. **O IOM rejeita explicitamente a regra dos copos.** O comunicado oficial do relatório diz: *"We don't offer any rule of thumb based on how many glasses of water people should drink each day"*. A ideia dos "8 copos" não vem de diretriz.
2. **As diretrizes com número são de água total, e por isso não servem para um app de copos.** EFSA e IOM contam a água que vem dos alimentos (cerca de 20 % do total, pelo IOM). Uma meta de "2,0 L bebidos" seria mais alta que a referência da EFSA, não igual.
3. **O "35 ml/kg" não tem documento de sociedade brasileira por trás.** As menções da SBN que encontrei são material de divulgação (um vídeo de 19/04/2024 com a vice-presidente Lilian Carmo) e uma nota da regional Bahia que **atribui a fórmula à OMS** — atribuição que não foi possível confirmar em nenhum documento da OMS. A origem real do intervalo é o cálculo de necessidade hídrica usado em **nutrição clínica e parenteral** (a faixa citada na literatura é 30–40 ml/kg/dia), depois repetido até virar "recomendação de quanto beber", que não é o que ele é.

## Por que o NERO usa 35 ml/kg mesmo assim

Decisão do Murilo (médico, dono do projeto) em 19/09/2026, com o levantamento acima à vista. O argumento: **o usuário não tem como estimar a água que vem dos alimentos**, então uma meta de água total seria inaplicável na prática — a meta precisa ser do que ele bebe e consegue contar.

O app, por isso:
- chama o número de **estimativa**, nunca de recomendação, e diz na tela que é "uma regra de cálculo usada em nutrição clínica. Não é uma recomendação de diretriz: ajuste com seu médico ou nutricionista";
- deixa a meta **editável** pelo usuário ou pelo profissional, como manda o §82 para metas em geral;
- não afirma benefício clínico de beber mais (§66, §76).

## Restrição hídrica (limite de segurança)

Em **insuficiência cardíaca** e **doença renal crônica avançada**, restringir líquido é tratamento — estimular a beber mais trabalha contra a conduta. A diretriz brasileira de terapia nutricional em doença renal (ASBRAN/BRASPEN, 2021) confirma que em hemodiálise a ingestão diária de líquidos **depende do ganho de peso interdialítico**, ou seja, é individualizada, sem fórmula geral.

Por isso, quem marcou doença renal ou insuficiência cardíaca no perfil **não recebe meta calculada**: a tela explica que o volume é conduta médica e oferece apenas o registro do que foi bebido, para levar à consulta. O campo `tem_insuficiencia_cardiaca` foi criado nesta migração (0018) justamente porque o perfil não tinha como identificar esse grupo.

## Se alguém for revisar isto

O que mudaria a decisão: um documento citável de sociedade brasileira (SBN, SBAN, ASBRAN) ou do Ministério da Saúde com recomendação de **água bebida** para população geral adulta. Se aparecer, trocar o parâmetro e atualizar C-021 em `../02-DECISOES.md`.

## Fontes consultadas

- EFSA Panel on Dietetic Products, Nutrition and Allergies. *Scientific Opinion on Dietary Reference Values for water*. EFSA Journal 2010;8(3):1459. https://doi.org/10.2903/j.efsa.2010.1459
- Institute of Medicine. *Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate*, 2005. https://nap.nationalacademies.org/read/10925 — comunicado: https://www.nationalacademies.org/news/report-sets-dietary-intake-levels-for-water-salt-and-potassium-to-maintain-health-and-reduce-chronic-disease-risk
- ESPEN. *Practical guideline: Clinical nutrition and hydration in geriatrics*, 2022. https://www.espen.org/files/ESPEN-Guidelines/ESPEN_practical_guideline_Clinical_nutrition_and_hydration_in_geriatrics.pdf
- Ministério da Saúde. *Guia Alimentar para a População Brasileira*, 2ª ed. https://bvsms.saude.gov.br/bvs/publicacoes/guia_alimentar_populacao_brasileira_2ed.pdf
- ASBRAN/BRASPEN. *Diretriz de terapia nutricional no paciente com doença renal*, 2021. https://www.asbran.org.br/storage/downloads/files/2021/07/diretriz-de-terapia-nutricional-no-paciente-com-doenca-renal.pdf
- SBN. *SBN Esclarece — Qual é a quantidade de água recomendada por dia?*, 19/04/2024 (vídeo, sem números no texto). https://sbn.org.br/publico/sbn-esclarece-qual-e-a-quantidade-de-agua-recomendada-por-dia/
