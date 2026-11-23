# Marcar remédio tomado (adesão aos remédios)

**Data:** 23/11/2026 · **Status:** design em aprovação · **Sai no mesmo build de:**
`2026-11-23-reorganizacao-navegacao-design.md` e do projeto "PDF novo" (a desenhar).

## 1. Por que

Hoje o NERO lembra o horário do remédio, mas não sabe se a pessoa tomou. O Murilo quer que o idoso **registre
cada dose** e que **o médico veja** a adesão (no check-in semanal e no PDF). Esse registro também é a base do
projeto seguinte, "Familiar e emergência", em que um familiar será avisado quando a dose ficar sem resposta.

Público: idosos. Toda decisão abaixo favorece **um toque, texto curto, nada que dependa de gesto escondido**.

## 2. Objetivos

1. Marcar a dose em **um toque a partir da notificação** (toque simples abre a tela de marcar).
2. Saber **quanto deveria tomar** em cada horário, para reconhecer erro.
3. Classificar cada dose prevista e mostrar o resumo da semana **no check-in semanal** e **no PDF**.
4. Segundo lembrete quando a dose fica sem resposta.
5. Ensinar, uma vez e com clareza, que **marcar é o controle**.

## 3. Fora do escopo

- Avisar familiar (projeto "Familiar e emergência").
- Botões de ação dentro da notificação ("✓ Tomei" ao segurar): **descartado pelo Murilo** — idoso não sabe
  segurar a notificação. Toque simples abre o app.
- Estoque de comprimidos, receita vencendo, interação entre remédios.
- O desenho final do quadro no PDF: este projeto entrega os dados e um quadro simples; o visual definitivo sai
  no projeto "PDF novo".

## 4. Anti-objetivos

- Chamar de "não tomou" quem só esqueceu de marcar (por isso existe "sem registro").
- Notificação a mais que irrite: no máximo **um** segundo lembrete por dose.
- Perder os lembretes que já funcionam ou passar do limite de 64 avisos agendados do iOS (D-048).

## 5. Abordagens consideradas

| | Abordagem | Decisão |
|---|---|---|
| A | Botões na notificação que gravam sem abrir o app (`expo-task-manager`, execução em segundo plano) | Descartada: o idoso não descobre o gesto de segurar a notificação |
| B | Toque simples na notificação abre a tela "Tomou?" já no remédio e horário certos | **Escolhida** |

Registro: **só as doses marcadas viram linha no banco**; as doses previstas são calculadas a partir dos
horários do cadastro (decisão de Claude: evita criar linhas antecipadas e não precisa de tarefa no servidor).

## 6. Design

### 6.1 Cadastro do remédio

- Cada horário ganha **"quanto tomar"**: quantidade + **unidade do remédio** (comprimido, gota, unidade de
  insulina, mL, jato/inalação). Comprimido aceita meio (passo 0,5); gota, unidade e jato vão de 1 em 1; mL de
  0,5 em 0,5. Exemplo: 08:00 → 1 comprimido, 20:00 → 2. Padrão ao migrar: 1 comprimido por horário.
- Opção **"a dose muda conforme o dia"** (ex.: insulina de correção): a quantidade é anotada ao tomar, mas
  **quantidade diferente não conta como erro** para esse remédio.
- Remédio pode ser **"se precisar"** (sem horário fixo): não tem lembrete nem percentual de adesão.
- Remédio com horário **e lembrete desligado** continua gerando doses previstas (aparece em "Para fazer hoje" e
  conta na adesão); só não recebe notificação nem segundo lembrete.
- Ao salvar o **primeiro** remédio com horário, aparece uma única vez a explicação:
  *"Sempre que tomar, marque no NERO. É assim que você e seu médico acompanham o tratamento."*
  A mesma frase fica fixa, em letra menor, no topo da tela "Meus remédios".

### 6.2 Notificações

- **Reagendar tudo uma vez** na primeira abertura depois da atualização (`sincronizarLembretesMedicacao`, já
  existe), para quem já usa o app receber o texto e a rota novos.
- **Lembrete principal** (já existe, diário): texto passa a ser
  `Hora do remédio: Losartana 50 mg · 1 comprimido` / `Toque aqui para marcar`.
  O `data.rota` passa a apontar para a tela de marcar com o remédio e o horário; a **data da dose** é a data em
  que a notificação foi entregue (`notification.date`).
- **Segundo lembrete**: 30 min depois, *"Você tomou Losartana das 8h? Toque aqui para marcar"*.
  - Não pode ser diário (um aviso diário não se cancela só num dia). É **avulso**, agendado para as doses de
    **hoje e amanhã** (janela móvel), refeita sempre que o app abre ou um remédio é salvo.
  - Marcar a dose (tomei ou não tomei) **cancela** o segundo lembrete dela.
  - Limite do iOS: com a janela de 2 dias, 3 remédios × 2 horários = 12 avisos avulsos + 6 diários. O
    construtor garante teto (ex.: se passar de 40 avulsos, reduz a janela para só hoje).
  - Se o app ficar dias sem abrir, os segundos lembretes param; o principal continua. Aceito.
- Respeita a preferência "Medicamentos" dos lembretes (já existe).

### 6.3 Tela "Tomou?" (nova)

```
 Losartana 50 mg
 Dose das 8h · 1 comprimido

 [   ✓ Tomei   ]        ← botão principal, grande
 [  Não tomei  ]

 Quantos comprimidos?  [−] 1 [+]      (pré-preenchido com o previsto; a palavra segue a unidade)
```

- "Tomei" grava com a quantidade mostrada e a hora atual; volta para onde a pessoa estava com a confirmação
  "Marcado ✓".
- Se essa dose **já foi marcada**, a tela avisa *"Você já marcou essa dose às 8h10"* e oferece **Corrigir**
  (troca o registro) ou **Tomei de novo** (registra a segunda tomada → conta como erro "dose dobrada").
- Abre por: notificação, "Para fazer hoje", "＋ Anotar › Tomei remédio", e pela lista de doses de hoje.

### 6.4 Onde marcar sem notificação

- **Tela inicial › "Para fazer hoje"**: cada dose de hoje ainda não marcada, cujo horário já chegou, vira um
  item ("Losartana · 8h"), que abre a tela "Tomou?".
- **＋ Anotar › "Tomei remédio"**: lista as doses de hoje (marcadas e não marcadas) e os remédios "se precisar"
  ("Tomei agora").
- **Meus remédios**: cada remédio mostra as doses de hoje com o estado.
- Dose de dias anteriores pode ser marcada até **o fim do dia seguinte**; depois fica "sem registro".

### 6.5 Classificação de cada dose prevista

| Estado | Regra |
|---|---|
| ✓ Tomou | marcou "Tomei" com a quantidade do cadastro |
| ✗ Não tomou | marcou "Não tomei" |
| ⚠ Errado | quantidade diferente da prevista **ou** mais de uma tomada na mesma dose (escolha do Murilo); para remédio de "dose muda conforme o dia", só a dose dobrada conta |
| ⏱ Com atraso | tomou mais de **2 h** depois do horário (só informação, não é erro; o horário real vai ao PDF) |
| — Sem registro | nada marcado até o fim do dia seguinte |

"Com atraso" se soma a "Tomou" ou "Errado" (ex.: tomou certo, com atraso). Doses anteriores à data em que o
remédio foi cadastrado, ou fora do período `desde`/`ate`, não contam.

### 6.6 Resumo da semana: check-in semanal e PDF

Na tela do check-in semanal, acima das perguntas, um quadro só de leitura:

```
 Seus remédios nesta semana
 Losartana 50 mg    ●●●●●●●●●●●●○–   12 de 14 · 1 não tomada · 1 sem registro
 Metformina 850 mg  ●●●●●●●          7 de 7 ✓
 Dipirona (se precisar)              usou 3 vezes
```

- Percentual por remédio = tomou (incluindo com atraso) ÷ doses previstas.
- O mesmo resumo (por semana, das últimas 4 semanas) entra no PDF "Coração e diabetes" e no "Resumo completo",
  com a lista das doses erradas e atrasadas (data, horário previsto, horário real, quantidade).
- Linha do tempo (aba Histórico): não recebe cada dose (seria ruído); recebe só a semana com adesão < 80 %.

### 6.7 Dados

- Migração nova (`0023`): `medicacoes.horarios` passa a guardar `{ hora, quantidade }` (existentes →
  `quantidade: 1`); colunas `unidade text` (padrão `comprimido`), `dose_variavel boolean`, `se_precisar boolean`
  (remédios ativos **sem nenhum horário** viram `se_precisar = true` na migração) e
  `horarios_desde timestamptz` (quando os horários/quantidades mudaram pela última vez).
- **Mudança de horário ou quantidade não reescreve o passado:** cada tomada guarda **cópia** do que estava
  previsto (`hora_prevista`, `quantidade_prevista`) e é classificada por essa cópia. Doses "sem registro" de
  antes de `horarios_desde` não são calculadas com o cadastro novo: o período anterior conta só pelas tomadas
  registradas. Uma tabela de versões do cadastro seria mais exata; fica para se fizer falta.
- Tabela nova `tomadas_medicacao`: `id`, `user_id`, `medicacao_id`, `data_prevista date` (null para "se
  precisar"), `hora_prevista text` (null para "se precisar"), `quantidade_prevista numeric`, `tomou boolean`,
  `quantidade numeric`,
  `marcado_em timestamptz`, `created_at`. RLS dono, igual às outras tabelas (padrão da 0005). Exclusão de conta
  (0014) apaga junto.
- Política de privacidade: incluir "registro de tomada de remédios" na lista de dados guardados.

## 7. Restrições

- Build novo (notificações e banco mudam), no mesmo build da navegação.
- Não quebrar os lembretes atuais; quem já tem remédio cadastrado passa a ver "1 comprimido" por horário até
  editar.
- Testes: regras de classificação e de resumo em funções puras com testes; agendamento da janela de segundos
  lembretes com testes.
- Registrar como **D-066** em `docs/nero/02-DECISOES.md` (D-065 é a navegação).

## 8. Decisões tomadas por Claude (o Murilo pode mudar)

- Só as doses marcadas viram linha; previstas são calculadas.
- Segundo lembrete em janela de hoje + amanhã.
- Tolerância de atraso de 2 h; prazo para marcar até o fim do dia seguinte.
- Meio comprimido aceito; unidades além de comprimido; opção "dose muda conforme o dia".
- Remédio sem lembrete conta na adesão; remédio sem horário vira "se precisar" na migração.
- Mudança de cadastro não reescreve o passado (cópia do previsto na tomada).
- Reagendar todos os lembretes de remédio na primeira abertura após a atualização.
- Linha do tempo só mostra semanas com adesão < 80 %.
- PDF mostra as últimas 4 semanas.

## 9. Deixado para o construtor

- Componentes e organização de arquivos; nome da rota da tela "Tomou?".
- Como passar remédio/horário/data na rota da notificação.
- Ícones e microtextos de confirmação.
