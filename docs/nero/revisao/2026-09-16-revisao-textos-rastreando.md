# Revisão clínica — textos do Rastreando (Fase 1)

> Para o Murilo revisar. Cada bloco indica o arquivo de origem. Anote as correções diretamente aqui (ou me diga em conversa) e eu aplico no código.
> Regra: linguagem do §25 — orienta, não assusta, não diagnostica; sempre remete ao médico quando a conduta depende dele.

## Mama — `src/modules/rastreando/conteudo/mama.ts`

**Título:** Câncer de mama · **Subtítulo:** Rastreamento com mamografia

### Entenda este câncer

- O câncer de mama é o mais comum entre mulheres no Brasil, depois do câncer de pele. Descoberto cedo, as chances de tratamento com sucesso são muito altas.
- A mamografia consegue encontrar alterações antes de qualquer sintoma. Por isso é o exame usado no rastreamento de quem não tem queixas.
- As sociedades brasileiras de mastologia, radiologia e ginecologia recomendam mamografia anual dos 40 aos 74 anos para mulheres de risco habitual. A partir dos 75, a decisão é individual, com o médico.
- Quem tem risco aumentado (por exemplo, mutação genética ou forte história familiar) pode precisar começar antes e acrescentar ressonância. Nesses casos, o protocolo é definido com o mastologista.

**No SUS:** Pelo SUS, a mamografia de rastreamento é oferecida a cada dois anos dos 50 aos 74 anos. Entre 40 e 49 anos, ela pode ser feita por decisão compartilhada com o profissional de saúde (Ministério da Saúde, 2025).

### Fatores que aumentam o risco (educativos)

- Idade acima de 50 anos
- Obesidade após a menopausa
- Sedentarismo
- Consumo de bebida alcoólica
- Primeira gestação após os 30 anos ou não ter tido filhos
- Reposição hormonal por tempo prolongado
- Primeira menstruação muito cedo ou menopausa tardia

### Fatores que mudam o protocolo

- Mutação em BRCA1, BRCA2, TP53 ou outros genes de risco
- Mãe, irmã ou filha com câncer de mama, especialmente antes dos 50 anos
- Câncer de ovário na família ou câncer de mama em homem da família
- Radioterapia no tórax antes dos 30 anos
- Biópsia anterior com hiperplasia atípica ou carcinoma lobular in situ
- Câncer de mama já tratado

### Sinais de alerta

- Nódulo ou caroço na mama ou na axila
- Saída de líquido pelo mamilo, principalmente com sangue
- Pele da mama enrugada, retraída ou com aspecto de casca de laranja
- Mamilo retraído ou com ferida que não cicatriza
- Vermelhidão, inchaço ou calor na mama sem causa aparente

**Fontes exibidas:** CBR/SBM/FEBRASGO 2023 · Nota Técnica CNM 2025 · Ministério da Saúde 2025

## Colo do útero — `src/modules/rastreando/conteudo/colo_utero.ts`

**Título:** Câncer do colo do útero · **Subtítulo:** Rastreamento com teste de DNA-HPV

### Entenda este câncer

- O câncer do colo do útero é causado, na quase totalidade dos casos, por infecção persistente pelo HPV. Ele se desenvolve devagar, passando por lesões que podem ser tratadas antes de virar câncer.
- Desde 2025, o exame de rastreamento no Brasil passou a ser o teste de DNA-HPV, que detecta o vírus antes de qualquer lesão. Ele substitui gradualmente o Papanicolau.
- A recomendação é começar aos 25 anos, para quem já teve atividade sexual, e repetir a cada 5 anos quando o resultado for negativo. O rastreamento encerra quando o último teste depois dos 60 anos for negativo.
- Pessoas com HIV ou imunossupressão têm intervalo menor (3 anos) e continuam o rastreamento sem idade limite.

**No SUS:** O teste de DNA-HPV está sendo implantado no SUS desde 2025. Onde ainda não chegou, o Papanicolau continua válido: anual e, após dois resultados normais seguidos, a cada 3 anos.

### Fatores que aumentam o risco (educativos)

- Tabagismo
- Início precoce da vida sexual e múltiplos parceiros
- Uso prolongado de anticoncepcional oral
- Não ter sido vacinada contra o HPV

### Fatores que mudam o protocolo

- HIV ou outra condição de imunossupressão
- Lesão de alto grau (NIC 2, NIC 3 ou AIS) já tratada
- Histerectomia por lesão precursora ou câncer do colo

### Sinais de alerta

- Sangramento fora do período menstrual ou após a menopausa
- Sangramento durante ou após a relação sexual
- Corrimento persistente, com odor forte ou com sangue
- Dor pélvica persistente sem causa conhecida

**Fontes exibidas:** INCA 2025 · Portaria SAES/SECTICS 13/2025

## Colorretal — `src/modules/rastreando/conteudo/colorretal.ts`

**Título:** Câncer colorretal · **Subtítulo:** Rastreamento do intestino com teste de fezes

### Entenda este câncer

- O câncer colorretal (intestino grosso e reto) é um dos mais frequentes no Brasil. Ele costuma começar como pólipos, que levam anos para se transformar e podem ser removidos antes disso.
- O teste imunoquímico fecal (FIT) procura sangue invisível nas fezes. É simples, feito em casa, e não exige preparo.
- A diretriz brasileira recomenda o FIT a cada 2 anos, dos 50 aos 74 anos, para quem não tem sintomas nem fatores de risco especiais.
- Um FIT positivo não significa câncer: significa que é preciso olhar o intestino com colonoscopia. Se a colonoscopia for completa e normal, não é preciso repetir nem fazer FIT por 10 anos.

**No SUS:** O rastreamento organizado com FIT foi aprovado para o SUS em 2026 e está em fase de implantação.

### Fatores que aumentam o risco (educativos)

- Idade acima de 50 anos
- Alimentação pobre em fibras e rica em carnes processadas
- Obesidade e sedentarismo
- Tabagismo e consumo de álcool

### Fatores que mudam o protocolo

- Pai, mãe, irmão ou filho com câncer colorretal, especialmente antes dos 60 anos
- Dois ou mais parentes de primeiro grau com câncer colorretal
- Doença de Crohn ou retocolite ulcerativa
- Síndrome de Lynch, polipose adenomatosa familiar ou outra síndrome hereditária
- Pólipo adenomatoso ou câncer colorretal já tratados

### Sinais de alerta

- Sangue nas fezes ou no papel higiênico
- Mudança persistente no hábito intestinal (diarreia ou constipação por semanas)
- Emagrecimento sem causa aparente
- Anemia sem explicação
- Dor ou desconforto abdominal persistente

**Fontes exibidas:** CONITEC 2026 · ACG 2021 (história familiar)

## Pulmão — `src/modules/rastreando/conteudo/pulmao.ts`

**Título:** Câncer de pulmão · **Subtítulo:** Rastreamento com tomografia de baixa dose

### Entenda este câncer

- O câncer de pulmão é o que mais mata no mundo, e o tabagismo é responsável pela grande maioria dos casos. Descoberto em fase inicial, o tratamento tem muito mais chance de cura.
- A tomografia de baixa dose consegue ver nódulos pequenos que o raio-X não mostra. Ela é indicada apenas para quem tem alto risco pela carga de tabagismo — para os demais, os riscos superam os benefícios.
- Os critérios adotados: 50 a 80 anos, ter fumado pelo menos 20 maços-ano (por exemplo, 1 maço por dia durante 20 anos) e ainda fumar ou ter parado há até 15 anos. O exame é anual.
- Parar de fumar continua sendo a medida mais eficaz, em qualquer idade.

### Fatores que aumentam o risco (educativos)

- Exposição à fumaça de outras pessoas (fumo passivo)
- Exposição ocupacional a amianto, sílica, arsênio ou radônio
- Doença pulmonar obstrutiva crônica (DPOC)
- História familiar de câncer de pulmão

### Fatores que mudam o protocolo

- Carga tabágica de 20 maços-ano ou mais
- Fumar atualmente ou ter parado há até 15 anos

### Sinais de alerta

- Tosse persistente por mais de 3 semanas ou mudança no padrão de uma tosse antiga
- Escarro com sangue
- Falta de ar nova ou que piora
- Dor no peito persistente
- Rouquidão por mais de 3 semanas
- Emagrecimento sem causa aparente

**Fontes exibidas:** USPSTF 2021 (SBPT) · ACR Lung-RADS v2022

## Próstata — `src/modules/rastreando/conteudo/prostata.ts`

**Título:** Câncer de próstata · **Subtítulo:** Decisão compartilhada sobre o rastreamento

### Entenda este câncer

- O câncer de próstata é o mais comum entre homens no Brasil, depois do câncer de pele. Muitos casos crescem devagar e nunca causariam problemas; outros são agressivos.
- Por isso, o rastreamento com PSA não é uma regra para todos: as sociedades brasileiras de urologia, oncologia e radioterapia recomendam que cada homem converse com um profissional sobre riscos e benefícios e decida junto.
- Essa conversa é recomendada a partir dos 50 anos para quem tem expectativa de vida superior a 10 anos, e a partir dos 40 para quem tem histórico familiar, é negro ou tem mutação em BRCA. Acima dos 75 anos, só com expectativa de vida acima de 10 anos.
- O PSA é interpretado no contexto: idade, tamanho da próstata, exame clínico e história. Um valor isolado não define diagnóstico.

**No SUS:** O Ministério da Saúde e o INCA não recomendam o rastreamento populacional do câncer de próstata (nota técnica de 2023), pelo risco de diagnósticos e tratamentos desnecessários. Por isso a decisão é individual, com o médico.

### Fatores que aumentam o risco (educativos)

- Idade acima de 50 anos
- Obesidade e síndrome metabólica
- Exposição ocupacional a agentes químicos

### Fatores que mudam o protocolo

- Pai ou irmão com câncer de próstata
- Etnia negra
- Mutação em BRCA1 ou BRCA2

### Sinais de alerta

- Dificuldade para urinar ou jato fraco
- Vontade frequente de urinar, principalmente à noite
- Sangue na urina ou no sêmen
- Dor óssea persistente, principalmente na coluna ou quadril

**Fontes exibidas:** SBU/SBOC/SBRT 2023 · INCA/MS 2023

## Mensagens dos fatores modificadores — `src/core/regras/programas/*.ts`

Aparecem em 'Preciso fazer rastreamento?' e em 'Fatores de risco' quando o perfil tem o fator.

### mama

- Você já teve câncer de mama. Após o tratamento, a recomendação é mamografia anual — 6 meses após a radioterapia na cirurgia conservadora, ou 1 ano após o tratamento na mastectomia (mama contralateral). O seguimento é definido pela sua equipe. ([…])
- Mutação em BRCA1: mamografia anual a partir do diagnóstico da mutação, não antes dos 35 anos, e ressonância anual não antes dos 25. Seu protocolo é individualizado — converse com mastologista. ([…])
- Mutação em TP53: mamografia anual não antes dos 30 anos e ressonância anual não antes dos 20. Protocolo individualizado com mastologista. ([…])
- Mutação em gene de risco moderado a alto para câncer de mama: mamografia e ressonância anuais a partir do diagnóstico, não antes dos 30 anos. Protocolo individualizado com mastologista. ([…])
- Radioterapia no tórax antes dos 30 anos: mamografia anual a partir do 8º ano após o tratamento (não antes dos 30) e ressonância anual (não antes dos 25). Converse com mastologista. ([…])
- Lesão como hiperplasia atípica ou carcinoma lobular in situ pede uma estimativa do seu risco por um modelo matemático, feita pelo médico: abaixo de 20%, mamografia anual a partir dos 40; a partir de 20%, mamografia e ressonância anuais desde o diagnóstico (não antes dos 30). ([…])
- Sua história familiar pode indicar risco aumentado. Peça ao seu médico uma estimativa do seu risco ao longo da vida por um modelo matemático.[…] ([…])
- A mamografia de rastreamento começa aos 40 anos para mulheres de risco habitual. Mantenha seu perfil atualizado para o NERO avisar quando chegar o momento.

### colo

- Você já tratou uma lesão de alto grau do colo do útero (NIC 2, NIC 3 ou AIS). A diretriz recomenda manter o rastreamento por até 25 anos após o tratamento, mesmo depois dos 60 anos. Converse com seu ginecologista. ([…], Rec. 14)
- Histerectomia por lesão precursora ou câncer do colo do útero: a diretriz recomenda coleta vaginal por pelo menos 25 anos ou indefinidamente. Converse com seu ginecologista. ([…], Rec. 35)
- O rastreamento do colo do útero começa aos 25 anos para quem já teve atividade sexual. Mantenha seu perfil atualizado para o NERO avisar quando chegar o momento.

### colorretal

- Síndrome genética associada ao câncer colorretal: o rastreamento é individualizado e começa mais cedo. Procure acompanhamento com gastroenterologista ou coloproctologista e avaliação genética. ([…])
- Doença inflamatória intestinal (Crohn ou retocolite) muda o protocolo: a vigilância é feita por colonoscopia em intervalos definidos pelo seu gastroenterologista, não pelo FIT. ([…])
- Você já teve câncer colorretal ou pólipo adenomatoso. O seguimento é individualizado por colonoscopia, conforme seu médico. ([…])
- História familiar de câncer colorretal ([…]): a recomendação é começar com colonoscopia aos […] anos (40 anos ou 10 anos antes do parente mais jovem, o que vier primeiro) e repetir a cada 5 anos.[…] Converse com gastroenterologista ou coloproctologista. ([…], Rec. 9[…])
- Um parente de primeiro grau com câncer colorretal diagnosticado aos 60 anos ou mais: a recomendação é começar o rastreamento aos […] anos e, depois, seguir o calendário de risco habitual. Converse com seu médico. ([…], Rec. 11)
- O rastreamento colorretal de risco padrão começa aos 50 anos, com FIT a cada 2 anos. Mantenha seu perfil atualizado.

### pulmao

- Você parou de fumar há mais de 15 anos: a diretriz não recomenda tomografia de rastreamento nesse caso. ([…])
- A tomografia de baixa dose é recomendada entre 50 e 80 anos para quem fumou pelo menos 20 maços-ano e ainda fuma ou parou há até 15 anos. Você não atende a esses critérios no momento. ([…])

### prostata


## Devolutivas por resultado — `supabase/seed.sql`

| Programa | Exame | Condição | Classificação | Alerta | Intervalo | Mensagem ao paciente | Fonte |
|---|---|---|---|---|---|---|---|
| mama | elegibilidade | `{"idade_min": 40, "idade_max": 74}` | normal | verde | 12 | Você está na faixa etária de rastreamento: mamografia anual dos 40 aos 74 anos. | CBR/SBM/FEBRASGO 2023 (Urban et al.) · Nota Técnica CNM 2025 |
| mama | mamografia | `{"birads": 0}` | pendente | cinza | — | Sua mamografia precisa de complementação (BI-RADS 0) antes de um resultado final. Procure o serviço que realizou o exame. | ACR BI-RADS · §44 |
| mama | mamografia | `{"birads": 1}` | normal | verde | 12 | Sua mamografia não apresentou achados suspeitos (BI-RADS 1). Seu próximo rastreamento foi programado. Consulte seu médico para orientações. | ACR BI-RADS · CBR/SBM/FEBRASGO 2023 (Urban et al.) · Nota Técnica CNM 2025 |
| mama | mamografia | `{"birads": 2}` | normal | verde | 12 | Sua mamografia mostrou achados benignos (BI-RADS 2). Seu próximo rastreamento foi programado. | ACR BI-RADS · CBR/SBM/FEBRASGO 2023 (Urban et al.) · Nota Técnica CNM 2025 |
| mama | mamografia | `{"birads": 3}` | controle | amarelo | 6 | Achado provavelmente benigno (BI-RADS 3): a recomendação habitual é controle em 6 meses, ou no intervalo indicado no seu laudo. Consulte seu médico. | ACR BI-RADS (categoria 3) · C-009 |
| mama | mamografia | `{"birads": 4}` | investigacao | laranja | — | Seu exame apresentou um achado que necessita investigação complementar (BI-RADS 4). Procure o profissional responsável para definir a próxima etapa. | ACR BI-RADS · §44 |
| mama | mamografia | `{"birads": 5}` | especializado | vermelho | — | Seu exame apresentou um achado que merece avaliação especializada prioritária (BI-RADS 5). Entre em contato com o profissional responsável ou serviço de referência. | ACR BI-RADS · §44 |
| mama | mamografia | `{"birads": 6}` | especializado | vermelho | — | Este exame indica acompanhamento especializado (BI-RADS 6). As próximas etapas são definidas pela sua equipe de tratamento. | ACR BI-RADS · §44 |
| colo_utero | elegibilidade | `{"idade_min": 25, "idade_max": 64}` | normal | verde | 60 | Você está na faixa de rastreamento do colo do útero: teste de DNA-HPV a partir dos 25 anos, repetido a cada 5 anos quando negativo. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 1, 12, 18 |
| colo_utero | dna_hpv | `{"hpv": "negativo", "imunossuprimida": false}` | normal | verde | 60 | Não foi detectado HPV oncogênico. Seu próximo rastreamento foi programado para daqui a 5 anos. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 18/23 |
| colo_utero | dna_hpv | `{"hpv": "negativo", "imunossuprimida": true}` | normal | verde | 36 | Não foi detectado HPV oncogênico. Em situação de imunossupressão, o intervalo recomendado é de 3 anos. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 39 |
| colo_utero | dna_hpv | `{"hpv": "invalido"}` | pendente | cinza | — | O teste não pôde ser lido (resultado inválido). É necessária nova coleta com o profissional de saúde. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 21 |
| colo_utero | dna_hpv | `{"hpv": "16_18"}` | investigacao | laranja | — | Foi detectado um tipo de HPV associado a maior risco de lesões do colo do útero (16 ou 18). Procure seu médico para a avaliação complementar (colposcopia). | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 19 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "imunossuprimida": true}` | investigacao | laranja | — | Foi detectado HPV oncogênico. Em situação de imunossupressão, a diretriz recomenda colposcopia independentemente da citologia. Procure seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 40 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "negativa", "imunossuprimida": false}` | controle | amarelo | 12 | HPV oncogênico (não 16/18) com citologia normal: a diretriz recomenda repetir o teste de DNA-HPV em 12 meses. Consulte seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 22 |
| colo_utero | dna_hpv | `{"hpv": "persistente_24m"}` | investigacao | laranja | — | O HPV oncogênico persiste após 24 meses de acompanhamento. A diretriz recomenda colposcopia, independentemente da citologia. Procure seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 25 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "insatisfatoria", "imunossuprimida": false}` | investigacao | laranja | — | A citologia reflexa não pôde ser avaliada (amostra insatisfatória): a diretriz recomenda colposcopia. Procure seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "asc_us", "imunossuprimida": false}` | investigacao | laranja | — | HPV oncogênico com alteração na citologia: a diretriz recomenda colposcopia. Procure seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "lsil", "imunossuprimida": false}` | investigacao | laranja | — | HPV oncogênico com alteração na citologia: a diretriz recomenda colposcopia. Procure seu médico. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "asc_h", "imunossuprimida": false}` | especializado | vermelho | — | Seu exame apresentou um achado que necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "hsil", "imunossuprimida": false}` | especializado | vermelho | — | Seu exame apresentou um achado que necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "agc", "imunossuprimida": false}` | especializado | vermelho | — | Seu exame apresentou um achado que necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "ais", "imunossuprimida": false}` | especializado | vermelho | — | Seu exame apresentou um achado que necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | dna_hpv | `{"hpv": "outros_oncogenicos", "citologia_reflexa": "suspeita_malignidade", "imunossuprimida": false}` | especializado | vermelho | — | Seu exame apresentou um achado que necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 20 |
| colo_utero | citologia | `{"citologia": "negativa"}` | normal | verde | 12 | Citologia sem alterações. Onde o DNA-HPV ainda não está disponível, repete-se anualmente e, após dois exames normais seguidos, a cada 3 anos. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 28 · C-003 |
| colo_utero | citologia | `{"citologia": "insatisfatoria"}` | pendente | cinza | — | A amostra não permitiu avaliação adequada. Repita o exame conforme orientação do profissional. | INCA 2016 — Diretrizes rastreamento (citologia) · transição: INCA 2025 Rec. 26–28 [validar no texto de 2016 — a obter] |
| colo_utero | citologia | `{"citologia": "asc_us"}` | controle | amarelo | 6 | Alteração de significado indeterminado (ASC-US): em geral repete-se a citologia em 6 meses (12 meses antes dos 30 anos). Consulte seu médico. | INCA 2016 — Diretrizes rastreamento (citologia) · transição: INCA 2025 Rec. 26–28 [validar no texto de 2016 — a obter] |
| colo_utero | citologia | `{"citologia": "lsil"}` | controle | amarelo | 6 | Lesão de baixo grau (LSIL): em geral repete-se a citologia em 6 meses (12 meses antes dos 25 anos). Consulte seu médico. | INCA 2016 — Diretrizes rastreamento (citologia) · transição: INCA 2025 Rec. 26–28 [validar no texto de 2016 — a obter] |
| colo_utero | citologia | `{"citologia": "asc_h"}` | especializado | vermelho | — | Seu exame necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 26 · §45.7 |
| colo_utero | citologia | `{"citologia": "hsil"}` | especializado | vermelho | — | Seu exame necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 26 · §45.7 |
| colo_utero | citologia | `{"citologia": "agc"}` | especializado | vermelho | — | Seu exame necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 26 · §45.7 |
| colo_utero | citologia | `{"citologia": "ais"}` | especializado | vermelho | — | Seu exame necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 26 · §45.7 |
| colo_utero | citologia | `{"citologia": "suspeita_malignidade"}` | especializado | vermelho | — | Seu exame necessita avaliação profissional com prioridade (colposcopia). Procure o responsável para definir a próxima etapa. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. Rec. 26 · §45.7 |
| colo_utero | colposcopia | `{"achado": "normal"}` | controle | amarelo | 12 | Colposcopia sem alterações. O seguimento é definido pelo seu médico conforme o teste que motivou o exame. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "nic1"}` | controle | amarelo | 12 | Lesão de baixo grau (NIC 1): geralmente acompanhada, não tratada. Seu médico define o intervalo. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "nic2"}` | especializado | vermelho | — | As próximas etapas são definidas pela sua equipe. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "nic3"}` | especializado | vermelho | — | As próximas etapas são definidas pela sua equipe. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "ais"}` | especializado | vermelho | — | As próximas etapas são definidas pela sua equipe. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "carcinoma"}` | especializado | vermelho | — | As próximas etapas são definidas pela sua equipe. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colo_utero | colposcopia | `{"achado": "inconclusiva"}` | pendente | cinza | — | A colposcopia foi inconclusiva. Procure o profissional para complementar a avaliação. | INCA 2025 — Diretrizes Rastreamento Colo do Útero, 3. ed. |
| colorretal | elegibilidade | `{"idade_min": 50, "idade_max": 74}` | normal | verde | 24 | Você está na faixa de rastreamento colorretal: teste imunoquímico fecal (FIT) a cada 2 anos, dos 50 aos 74 anos. | CONITEC 2026 — Diretrizes Rastreamento Cólon e Reto (aprovada 23/06/2026) Rec. 5, 6, 7 |
| colorretal | fit | `{"fit": "negativo"}` | normal | verde | 24 | Seu teste não identificou sangue oculto nas fezes. Seu próximo rastreamento foi programado. | CONITEC 2026 — Diretrizes Rastreamento Cólon e Reto (aprovada 23/06/2026) Rec. 7 |
| colorretal | fit | `{"fit": "positivo"}` | investigacao | laranja | — | Seu teste deu positivo. Isso não significa câncer, mas é necessária investigação com colonoscopia. Procure seu médico. | CONITEC 2026 — Diretrizes Rastreamento Cólon e Reto (aprovada 23/06/2026) Rec. 8 |
| colorretal | colonoscopia | `{"achado": "normal", "qualidade_adequada": true}` | normal | verde | 120 | Colonoscopia completa e sem alterações: a recomendação é repetir só em 10 anos, sem necessidade de FIT nesse intervalo, se você seguir sem sintomas. | CONITEC 2026 — Diretrizes Rastreamento Cólon e Reto (aprovada 23/06/2026) texto da Rec. 8 |
| colorretal | colonoscopia | `{"achado": "incompleta"}` | pendente | cinza | — | A colonoscopia foi incompleta. Procure o profissional para completar a avaliação. | §47 |
| colorretal | colonoscopia | `{"achado": "polipos", "histopatologico": "aguardando"}` | pendente | cinza | — | Foram removidos pólipos. Registre o resultado do histopatológico quando disponível para o NERO definir o seguimento. | §47 |
| colorretal | colonoscopia | `{"achado": "polipos", "histopatologico": "hiperplasico"}` | normal | verde | 120 | Pólipo hiperplásico não aumenta o risco. O seguimento segue o habitual. | §47 · ACG 2021 |
| colorretal | colonoscopia | `{"achado": "polipos", "histopatologico": "adenoma"}` | controle | amarelo | — | Adenoma removido: o intervalo de controle depende do número e tamanho dos pólipos e é definido pelo seu médico. Registre o intervalo indicado no laudo. | §47 |
| colorretal | colonoscopia | `{"achado": "polipos", "histopatologico": "adenoma_avancado"}` | controle | amarelo | — | Adenoma avançado removido: o controle costuma ser mais próximo e é definido pelo seu médico. Registre o intervalo indicado no laudo. | §47 |
| colorretal | colonoscopia | `{"achado": "polipos", "histopatologico": "carcinoma"}` | especializado | vermelho | — | As próximas etapas são definidas pela sua equipe. | §47 |
| colorretal | colonoscopia | `{"achado": "massa_suspeita"}` | especializado | vermelho | — | Foi identificada uma lesão que precisa de avaliação especializada prioritária. Entre em contato com o profissional responsável. | §47 |
| pulmao | elegibilidade | `{"idade_min": 50, "idade_max": 80}` | normal | verde | 12 | Você atende aos critérios de rastreamento de câncer de pulmão: tomografia de baixa dose anual. | USPSTF 2021 (Grau B), endossada pela SBPT |
| pulmao | tcbd | `{"lungrads": "0"}` | pendente | cinza | — | O exame precisa de complementação (Lung-RADS 0). Siga a orientação do laudo e do profissional. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "1"}` | normal | verde | 12 | Resultado negativo (Lung-RADS 1). Próxima tomografia em 12 meses. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "2"}` | normal | verde | 12 | Achado de comportamento benigno (Lung-RADS 2). Próxima tomografia em 12 meses. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "3"}` | controle | amarelo | 6 | Achado provavelmente benigno (Lung-RADS 3). Controle em 6 meses. Consulte seu médico. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "4A"}` | investigacao | laranja | 3 | Foi identificado um achado que necessita avaliação mais próxima (Lung-RADS 4A). Siga a recomendação do laudo e do profissional. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "4B"}` | especializado | vermelho | — | Este resultado merece avaliação especializada prioritária. Entre em contato com o profissional responsável. | ACR Lung-RADS v2022 |
| pulmao | tcbd | `{"lungrads": "4X"}` | especializado | vermelho | — | Este resultado merece avaliação especializada prioritária. Entre em contato com o profissional responsável. | ACR Lung-RADS v2022 |
| prostata | elegibilidade | `{"idade_min": 50, "idade_max": 75}` | normal | verde | — | Você está na faixa em que as sociedades brasileiras recomendam conversar com um profissional sobre riscos e benefícios do rastreamento (decisão compartilhada). | Posicionamento SBU/SBOC/SBRT 2023 · Notas SBU 2018/2020 |
| prostata | psa | `{"psa_fora_referencia": false}` | normal | verde | — | Seu PSA está dentro da referência do laboratório. A periodicidade da repetição é definida pelo seu médico. | Posicionamento SBU/SBOC/SBRT 2023 · Notas SBU 2018/2020 (avaliações periódicas, sem intervalo fixo) · §49 |
| prostata | psa | `{"psa_fora_referencia": true}` | investigacao | laranja | — | Seu resultado está fora da faixa de referência informada pelo laboratório. A interpretação do PSA depende de idade, histórico, exame clínico e outros fatores. Converse com seu médico. | §49 · Posicionamento SBU/SBOC/SBRT 2023 · Notas SBU 2018/2020 |

---

## Suas anotações

- 
- 
