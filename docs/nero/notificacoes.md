# Notificações do NERO

> Criado em 25/09/2026. Título e texto de cada notificação que o app agenda, decididos um a um com o
> Murilo. **Estado: implementado em 25/09 (D-044); check-in semanal decidido em 26/09 (D-060).** Quando implementar, o código
> deve bater com esta tabela, e qualquer texto novo entra aqui antes de entrar no código.

## Princípios

- **O título diz o que fazer**, no tom de conversa (público 60+), terminando com um emoji que
  identifica o tipo. O texto embaixo traz só o detalhe.
- **Sem nome de módulo e sem "NERO:"** no título. O ícone já diz que é o NERO, e "Coração &
  Metabolismo" não diz à pessoa o que ela tem que fazer.
- Curto: a tela bloqueada corta o que passa de uma linha.
- **O título dos exames diz "exame", e o nome vai embaixo.** Resolve o gênero ("seu mamografia" saía
  da frase montada com o nome) e o tamanho (o FIT não cabe numa linha). **Não é proteção de
  privacidade:** com as pré-visualizações escondidas o iOS esconde título e texto juntos ("NERO ·
  Notificação"); com elas visíveis, mostra os dois. Quem decide o que aparece na tela bloqueada é o
  ajuste do iPhone da pessoa, não a linha em que o dado está.

## Decididas

| Lembrete | Título | Texto | Decidido |
|---|---|---|---|
| Medicamento | Hora de tomar seu remédio 💊 | `<nome> <dose>` — ex.: "Losartana 50 mg". Sem dose cadastrada, só o nome. | 25/09 |
| Água | Hora de beber água 💧 | "Sua meta de hoje: 2 L." Meta = a definida pela pessoa, senão a sugerida pelo peso; em litros com vírgula ("1,8 L"). Sem meta nenhuma: "Um copo agora já ajuda." | 25/09 |
| Glicemia | Hora de medir a glicemia 🩸 | O momento do plano, com inicial maiúscula — ex.: "2 h após o almoço", "Em jejum", "Antes de dormir" (rótulos de `ROTULO_MOMENTO`). | 25/09 |
| MRPA | Hora de medir a pressão 🩺 | "Dia 2 de 7 · manhã" (ou "· noite"). Sem a sigla MRPA. | 25/09 |
| Consulta, véspera (9h) | Sua consulta é amanhã 📅 | "Cardiologia às 14:30. Toque para preparar o relatório." | 25/09 |
| Consulta, no dia (7h) | Sua consulta é hoje 📅 | "Cardiologia às 14:30 · Clínica Vida" (sem local: só especialidade e hora). | 25/09 |
| Exame, 60/30/7 dias antes (9h) | Seu exame está chegando 🔎 | "Mamografia · daqui a 30 dias" | 25/09 |
| Exame, no dia (9h) | Hoje é a data do seu exame 🔎 | "Mamografia" | 25/09 |
| Exame, 7 dias depois (9h) | Já fez seu exame? 🔎 | "Mamografia · registre o resultado para seguir em dia" | 25/09 |
| Check-in, domingo (10h) | Como foi sua semana? 💬 | "Responda o check-in: leva um minuto." | 26/09 |
| Check-in, terça (19h), só se não respondeu | Último dia do check-in 💬 | "Conte como foi sua semana antes que ela feche." | 26/09 |

## A discutir

| Lembrete | Título hoje | Texto hoje | Problema |
|---|---|---|---|

## Detalhes para a implementação

- **Água:** os avisos são agendados 7 dias à frente com o número da meta do momento. Quando a meta
  muda (meta definida pela pessoa ou peso novo que muda a sugerida), reagendar os avisos de água.

- **Toque na notificação abre a tela certa.** Hoje o app não trata o toque (nenhum
  `addNotificationResponseReceivedListener`): tocar só abre o app onde estava. "Toque para preparar o
  relatório" **depende disso** — não pode ir para o celular antes. Cada notificação leva a rota no
  `content.data` e o app navega ao receber o toque, inclusive com o app fechado (a guarda de sessão
  da D-038 já espera a sessão carregar). Destinos: remédio → Meus medicamentos; água → Água;
  glicemia → registrar glicemia; MRPA → medir; consulta véspera → Levar ao médico; consulta no dia →
  a consulta; exame → o programa no Rastreando.

## Onde vivem no código

- Medicamento, glicemia, água, MRPA, consultas: `agendar()` em `src/core/cardio/lembretesCardio.ts`
  (o título hoje sai de `origemTipo`, por isso água aparece como Coração & Metabolismo).
- Textos do MRPA: `src/core/regras/cardio/lembretesMrpa.ts`. Água: `src/core/bemestar/lembretesAgua.ts`.
  Consultas: `src/core/lembretes/consultas.ts`. Exames: `textoLembrete()` em `src/core/rastreando/lembretes.ts`.
