# Levar ao médico — uma porta só para relatórios e consulta

**Data:** 23/09/2026 · **Status:** implementado em 23/09/2026 — ver D-025
**Substitui na prática:** parte de D-007 (§61) e D-009 (§62), que criaram as duas entradas separadas.

## 1. O problema

Minha Saúde tem dois itens lado a lado que produzem quase o mesmo documento:

- **Relatórios** — quatro documentos por área (cardiovascular, oncológico, Saúde & Hábitos, geral).
- **Preparar minha consulta** — dez especialidades, cada uma com um recorte próprio.

O Murilo perguntou qual era a diferença entre os dois, e especificamente entre o relatório
cardiovascular e a consulta de cardiologia. A comparação mostrou que a diferença é pequena e, onde
existe, está errada:

| | Relatório cardiovascular | Consulta de cardiologia |
|---|---|---|
| Seções | 13 | 11 |
| Faltando | — | **HbA1c, check-up cardiometabólico** |
| Período padrão | 90 dias | 180 dias |

Se nem o autor do produto distingue as duas portas de imediato, o paciente de 70 anos não vai
distinguir. A diretriz do Murilo para o redesenho: *"tudo tem que ser bastante claro para não ter
dúvidas para seu João ou dona Maria de 70 anos; o Nero não quer complicar a vida e sim facilitar."*

### Defeitos encontrados no levantamento

1. **HbA1c e check-up fora da cardiologia.** O cálculo do PREVENT implementado no app usa HbA1c nos
   modelos ampliados (`src/core/regras/cardio/prevent.ts`, Tabelas S12B/C/E do suplemento AHA 2024) e
   IMC e TFG no modelo base. Omitir HbA1c do relatório feito para o cardiologista é incoerente com o
   próprio cálculo que o relatório exibe.
2. **Água fora do relatório geral.** `SECOES_GERAL` é a união de cardio + oncológico mais um punhado
   de seções de bem-estar, e `agua` ficou de fora. O documento que promete tudo não tem tudo.
3. **Pendências abertas no rodapé, não no foco.** Corrigido durante a implementação: `montarPor` já
   tinha uma regra (§66) que anexa pendências ao **fim** de qualquer relatório quando existem. Elas
   nunca sumiam — chegavam depois de tudo. Entrar nas listas de prioridade as move para o foco.

Os três são erros de manutenção: as listas foram escritas em momentos diferentes (D-007 e D-009, ambas
de 17/09) e nenhuma acompanhou as seções que o app ganhou depois.

## 2. Decisões

### 2.1 Uma porta só

Os dois itens de Minha Saúde viram um:

> **Levar ao médico**
> Um resumo da sua saúde para a consulta — em papel, no celular ou por código

Ele abre onde hoje ficam os Relatórios. Dentro, de cima para baixo:

1. **Relatório geral NERO**, primeiro, com marca discreta de "Recomendado" e subtítulo em linguagem de
   paciente: *"Tudo o que você registrou. Serve para qualquer médico."*
2. As outras três áreas como cartões normais, com subtítulos reescritos sem jargão.
3. Separado por uma linha: **"Vou a um médico específico"** → a escolha por especialidade.
4. Abaixo, como já é hoje: período das medidas e compartilhamentos por QR ativos.

**Expectativa assumida, e confirmada pelo Murilo:** a maioria vai clicar no Geral e nunca usar a
escolha por especialidade. O trabalho das dez listas serve a uma minoria — o paciente organizado, ou
o filho que cuida dos pais. Vale o investimento por isso, não apesar disso.

**As rotas não mudam** (`relatorios` e `consulta`). A mudança é de rótulo e hierarquia; manter as
rotas mantém o diff pequeno e não quebra o que já aponta para elas.

### 2.2 Como o paciente diz para quem vai levar

- **Consulta marcada em destaque.** Havendo consulta na agenda, ela abre a tela já pronta:
  *"Sua consulta de quinta, 14h, com o cardiologista — preparar?"*
- **Linguagem comum com o termo técnico embaixo:** **Médico do coração** / Cardiologia. O paciente
  reconhece pelo primeiro e aprende o segundo, em vez de ter que traduzir "gastroenterologia /
  coloproctologia" sozinho.

Rótulos propostos (a revisar na implementação; três já são reconhecíveis e ficam como estão):

| Chave | Linguagem comum | Termo técnico abaixo |
|---|---|---|
| `cardiologia` | Médico do coração | Cardiologia |
| `endocrinologia` | Médico dos hormônios e do diabetes | Endocrinologia |
| `clinica_medica` | Clínico geral | Clínica médica |
| `ginecologia` | Ginecologista | — |
| `mastologia` | Médico da mama | Mastologia |
| `urologia` | Urologista | — |
| `gastro_coloprocto` | Médico do estômago e do intestino | Gastroenterologia / coloproctologia |
| `pneumologia` | Médico do pulmão | Pneumologia |
| `oncologia` | Oncologista | — |
| `outra` | Outro médico | — |

### 2.3 O documento: focado, com o resto ao fim

A montagem por especialidade passa a ter três partes:

1. **Sempre presente** — perfil, medicamentos ativos, documentos do período. Inalterado.
2. **O foco da especialidade** — as seções priorizadas, na ordem de quem vai ler.
3. **"Outras informações do meu histórico"** — tudo o que sobrou, sem repetir, sob um título que
   deixa claro que dali em diante é complemento.

**Seções vazias:** na parte focada continuam imprimindo "Sem registros no período" — que a MRPA não
existe é informação que o cardiologista quer ter. Na terceira parte são **omitidas**: com 20 e poucas
seções, encheriam o PDF de linhas vazias sem informar nada.

**Título do documento:** "Preparação para consulta — Cardiologia" vira **"Resumo da minha saúde —
consulta de cardiologia"**, montado mecanicamente a partir do rótulo técnico (evita concordância caso a
caso: "para o cardiologista", "para a ginecologista"). O geral continua "Relatório geral NERO".

**Os relatórios de área não ganham a terceira parte.** Quem escolheu "cardiovascular" quer o
cardiovascular; quem quer tudo clica no Geral, que está em primeiro.

**Consequência aceita:** o PDF por especialidade cresce — a mastologia sai de ~1 página para 6 ou 8. O
ganho é o paciente nunca chegar sem um dado; o custo é peso de papel. Aceitável porque o caminho
principal passou a ser o Geral, que já seria grande.

### 2.4 As dez listas de especialidade

Acréscimos sobre o que existe hoje. **Nada aqui é parâmetro clínico novo** — são seções que já
existem no app entrando em listas de prioridade; nenhum critério, valor de corte ou intervalo foi
alterado.

| Especialidade | Lista final (depois do bloco sempre presente) |
|---|---|
| **Cardiologia** | mrpa, pa, glicemia, **hba1c**, lipidios, renal, **corpo**, **tabagismo**, exames_cardio, prevent, agravantes, **checkup**, **pendencias** |
| **Endocrinologia** | glicemia, hba1c, lipidios, tsh, **renal**, corpo, **alimentacao**, atividade, **tabagismo**, pa, prevent, **pendencias** |
| **Clínica médica** | checkup, pa, glicemia, hba1c, lipidios, renal, **corpo**, **tabagismo**, rastreamentos_status, prevent, atividade, **hist_familiar**, **pendencias**, **sintomas** |
| **Ginecologia** | colo, mama, hist_familiar, **tabagismo**, **pendencias**, **sintomas** |
| **Mastologia** | mama, hist_familiar, **tabagismo**, **pendencias**, **sintomas** |
| **Urologia** | prostata, hist_familiar, **tabagismo**, **pendencias**, **sintomas** |
| **Gastro / coloproctologia** | colorretal, hist_familiar, **tabagismo**, **pendencias**, **sintomas** |
| **Pneumologia** | tabagismo, pulmao, **pendencias**, **sintomas** |
| **Oncologia** | rastreamentos_status, mama, colo, colorretal, pulmao, prostata, sintomas, hist_familiar, **tabagismo**, **pendencias** |
| **Outra** | = relatório geral (inalterado) |

**Tabagismo em todas as dez**, decisão do Murilo: *"o tabagismo é muito importante"*. A seção detalhada
entra mesmo com o bloco de perfil já trazendo status e maços-ano na primeira página — a redundância é
o preço aceito pela visibilidade.

**Ordem dentro de cada lista:** medidas → laboratório → fatores de risco → exames → cálculo de risco →
check-up → pendências. As entradas do PREVENT (corpo/IMC, tabagismo, renal, HbA1c) vêm antes da seção
do PREVENT, para o médico ler o resultado depois de ver de onde ele saiu.

**Fora da tabela:** `agua` entra em `SECOES_GERAL`.

## 3. O que muda no código

| Arquivo | Mudança |
|---|---|
| `app/(app)/(tabs)/minha-saude/index.tsx` | Dois `ListItem` viram um: "Levar ao médico" → `/relatorios` |
| `app/(app)/(tabs)/minha-saude/relatorios/index.tsx` | Geral em primeiro com marca "Recomendado"; subtítulos sem jargão; entrada "Vou a um médico específico" → `/consulta` |
| `app/(app)/(tabs)/minha-saude/consulta/index.tsx` | Consulta marcada em destaque; lista em linguagem comum com termo técnico abaixo |
| `src/core/relatorios/especialidades.ts` | `PRIORIDADES` conforme §2.4; `agua` em `SECOES_GERAL`; rótulos em linguagem comum |
| `src/core/relatorios/montar.ts` | `montarConsulta` acrescenta a terceira parte, omitindo seções vazias; `tituloRelatorio` reescrito |

## 4. Testes

- `montarConsulta` para cada especialidade: as seções priorizadas vêm primeiro, na ordem da tabela, e
  nenhuma seção se repete entre as três partes.
- A terceira parte omite seções sem registro e mantém as que têm.
- A parte focada continua imprimindo "Sem registros no período".
- `SECOES_GERAL` contém todas as chaves de `ChaveSecao` — teste que trava a regressão de 2026-09-23
  (água fora do geral) e que quebra sozinho quando uma seção nova for criada sem entrar no geral.
- Tela: um só item em Minha Saúde; o Geral é o primeiro cartão.

## 5. O que a implementação mudou neste design

- **Pendências (§1.3)** eram menos graves do que o levantamento sugeria: já chegavam ao médico, só que
  no fim. Texto corrigido acima.
- **Bug encontrado e corrigido no caminho:** montar o complemento reaplicava a regra §66 e a seção de
  pendências saía **duas vezes** no mesmo documento. `montarPor` ganhou o parâmetro
  `garantirPendencias`, desligado só na montagem do complemento.
- **`peso` é um construtor órfão.** Não está em nenhuma lista e nunca esteve; a seção `corpo` da Fase 4
  traz peso, IMC, cintura e tendência por inteiro. Ficou de fora do geral de propósito — incluí-lo
  duplicaria a informação. Candidato a remoção numa limpeza futura, não neste escopo.
- **`pendencias` também fica fora de `SECOES_GERAL`** por desenho: quem a insere é a regra §66, não a
  lista. O teste de cobertura do geral documenta as duas exceções.

## 6. Riscos

- **O PDF por especialidade cresce muito.** Mitigado pela omissão de seções vazias na terceira parte;
  medir o tamanho real da mastologia depois de implementar.
- **Renomear pode desorientar quem já usa.** O app não está publicado; risco aceito.
- **As listas voltarem a envelhecer.** O teste de cobertura de `SECOES_GERAL` cobre o geral, mas não as
  dez listas — uma seção nova continua podendo nascer fora delas. Aceito conscientemente: obrigar cada
  seção nova a entrar nas dez seria pior que o problema.
