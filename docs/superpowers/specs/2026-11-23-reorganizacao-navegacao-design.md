# Reorganização da navegação do NERO: caminho fácil para cada função

**Data:** 23/11/2026 · **Status:** design em aprovação · **Protótipo visto pelo Murilo:**
`.superpowers/brainstorm/9406-1795471797/content/reorganizacao.html` (não versionado; abrir no navegador)

## 1. Por que

O Murilo, que conhece o app, não acha funções ao mostrar o NERO para outras pessoas (exemplo: "onde está o
MRPA?"). O público é majoritariamente idoso. O problema não é falta de informação: é o **caminho** até cada
função. Telas com muitos botões e muito texto explicativo pioram.

Causas encontradas no app (versão 1.0.0, publicada na App Store):

- O app é organizado **por área médica** ("Coração & Metabolismo", "Saúde & Bem-estar"); o idoso pensa **pela
  ação** ("anotar minha pressão"). Para achar o MRPA é preciso saber que pressão mora em "Metabolismo".
- **Duplicações:** "Minha Saúde" é aba e módulo; "Meus exames" está em Coração e em Minha Saúde; linha do tempo
  em 3 lugares (aba Histórico, Coração, Minha Saúde → que já leva à aba Histórico); "Peso" em Coração e
  Bem-estar; o relatório tem 3 nomes ("Relatório", "Levar ao médico", "Relatório de Saúde & Hábitos").
- Cada módulo abre com 5–7 cartões de números (com siglas: MRPA, HbA1c, LDL) e só depois a lista de ações.
- As ações mais usadas (faixa "Atalhos": Medir pressão, Medir glicemia, Remédios, Consultas, Relatório) ficam
  **no fim** da tela inicial, com rótulo de 12 pt, rolando de lado.
- Anotar algo tem um caminho diferente para cada coisa (8 caminhos).

Pesquisa (detalhes na conversa de 23/11): registrar pressão é a função mais comum em apps de hipertensão;
estudos com idosos mostram que estruturas **rasas** funcionam melhor que profundas (mais níveis = mais
desorientação). Uso real no banco ainda é pequeno demais para decidir; o que existe aponta medidas de
pressão/glicemia, exames e remédios como o mais usado.

## 2. Objetivos

1. **A entrada de cada função a no máximo 2 toques** da tela inicial (contando o toque na aba como 1). "Função"
   = cada item das listas da §6.5 e da tela Anotar. Telas internas (prévia de um relatório, composição
   corporal, preferências da Agenda) podem ficar mais fundo.
2. As 5 ações do dia a dia **no topo da tela inicial**, em botões grandes.
3. **Um lugar só para anotar qualquer coisa** (botão "Anotar").
4. Todo módulo com o **mesmo molde**: primeiro "O que você quer fazer?", depois os números.
5. **Cada função mora num lugar só**; em outros lugares aparece no máximo como atalho com o mesmo nome e ícone.
6. **Nomes do dia a dia, com verbo**; siglas só entre parênteses depois do nome comum.

## 3. Fora do escopo (não-objetivos)

- Mudar o conteúdo clínico, cálculos, regras de rastreamento ou textos médicos das telas de detalhe.
- Mudar o visual (cores, fontes, Liquid Glass) além do necessário para tamanho de letra e ordem.
- Busca dentro do app.
- Mudanças no banco de dados. Nada desta reorganização exige migração.
- Android tem o mesmo código; nada específico de plataforma além da barra de abas.

## 4. O que faria isto falhar mesmo "funcionando" (anti-objetivos)

- Quem já usa o app **perder o caminho** de algo que fazia: todo lugar antigo deve continuar levando à função
  (rotas antigas não podem quebrar; notificações e links que apontam para rotas existentes continuam valendo).
- Tela inicial que vira **outra parede de botões**: o topo tem no máximo 5 ações.
- Trocar texto explicativo por nada: explicação longa vira link "Entenda", não some.
- Quebrar as pendências, o selo de sequência, as conquistas e a comemoração da tela inicial.

## 5. Abordagens consideradas

| | Abordagem | Troca | Decisão |
|---|---|---|---|
| A | Manter módulos, ações no topo, molde único nos módulos, sem duplicações, nomes claros | Custo médio; estrutura conhecida fica | **Escolhida** |
| B | Botão "＋ Anotar" sempre visível, abrindo uma lista grande do que dá para anotar | Um lugar só para anotar | **Escolhida, junto com A**, como círculo flutuante (§6.1) |
| C | Refazer por ação, sem módulos ("Hoje / Anotar / Acompanhar / Médico") | Mais simples para novatos, mas apaga a organização clínica e é quase um app novo | Descartada: o Murilo quer manter os módulos |

**O Murilo escolheu A+B juntos** (23/11/2026), em vez da recomendação A→B.

## 6. Design

### 6.1 Barra de abas e o botão "＋ Anotar"

A barra nativa (`NativeTabs`, Liquid Glass, D-022) **continua com as 4 abas de hoje**:
`Início · Agenda · Histórico · Minha Saúde`.

O "Anotar" é um **círculo flutuante** (escolha do Murilo, 23/11/2026, entre três opções):

- Botão redondo grande (≥ 60 pt), cor `primary`, ícone "+" e rótulo acessível "Anotar", **logo acima da barra,
  no canto direito**, sempre visível nas 4 abas.
- Fica **fora das telas internas** dos módulos e dos formulários (aparece só nas telas raiz das abas), para não
  cobrir botões de salvar.
- Toque abre a tela "O que você quer anotar?" (6.2) como **folha que sobe de baixo** (modal), fechável por
  "Fechar" e pelo gesto de arrastar.
- Cada tela raiz de aba ganha espaço livre no fim da rolagem para o círculo não cobrir o último item
  (o projeto já tem `useEspacoAbas`; somar a altura do círculo).
- Descartadas: refazer a barra inteira com círculo saltado no meio (perde Liquid Glass e os ajustes automáticos
  de acessibilidade; contraria D-022) e uma 5ª aba comum "＋" (pouco destaque).

### 6.2 Folha "Anotar" (nova)

Título "O que você quer anotar?". Grade 2 colunas de botões grandes (mesmo componente das ações da tela
inicial), cada um levando **direto à tela de registro** existente:

| Botão | Rota existente |
|---|---|
| Pressão | `/(app)/coracao/pressao/registrar` |
| Glicemia | `/(app)/coracao/glicemia/registrar` |
| Peso e medidas | `/(app)/bem-estar/corpo/registrar` |
| Sono | `/(app)/bem-estar/sono/registrar` |
| Atividade | `/(app)/bem-estar/atividade/registrar` |
| Água | `/(app)/bem-estar/agua` |
| Refeição | `/(app)/bem-estar/alimentacao/registrar` |
| Resultado de exame | `/(app)/coracao/exames/registrar` (ver 6.6 sobre exames) |
| Foto de documento | `/(app)/(tabs)/minha-saude/documentos/novo` |

Se uma MRPA está em andamento, aparece no topo da tela um botão destacado "Medida do MRPA de agora".
Ao salvar um registro aberto a partir de "Anotar", a pessoa volta para "Anotar". Documentos vivem na pilha da
aba Minha Saúde; como "Anotar" é uma folha (modal), ao salvar a pessoa volta para onde estava antes de tocar no ＋. O construtor garante isso também para remédios e documentos (`voltarPara`, D-054).

**Não há "Tomei remédio":** o app não marca dose tomada (a tela de remédios só cadastra e ativa/desativa).
Marcar a tomada seria função nova, com mudança no banco; fica fora deste projeto (ver §9).

### 6.3 Tela inicial

Ordem, de cima para baixo:

1. Saudação + selo de sequência (como hoje; some a pergunta "Como está sua saúde hoje?" para ganhar espaço).
2. **"O que você quer fazer?"**: grade 2×2 + 1 botão largo:
   - Anotar minha pressão → registrar pressão
   - Meus remédios → medicamentos
   - **Anotar minha glicemia** → registrar glicemia, **só para quem tem diabetes no perfil** (`perfil.temDiabetes === true`);
     para os demais, o lugar vira **"Meus exames"**
   - Levar ao médico → relatórios
   - (largo) Minhas consultas → `/(app)/(tabs)/agenda/consultas`
3. **"Para fazer hoje"**: as pendências atuais, mesmo comportamento (renomeada de "Pendências").
4. **"Meus cuidados"**: os 3 módulos, em cartões de largura total, cada um com nome novo e uma linha listando o
   que tem dentro. "Minha Saúde" sai da grade (é aba).
5. Rodapé e "Fontes" como hoje. A faixa "Atalhos" **sai** (substituída pelo item 2).

### 6.4 Nomes novos

| Hoje | Novo |
|---|---|
| Coração & Metabolismo | **Pressão, coração e diabetes** |
| Rastreamentos | **Exames de prevenção** |
| Saúde & Bem-estar | **Hábitos e bem-estar** |
| MRPA (cartão) | **Medir a pressão por alguns dias (MRPA)** |
| HbA1c / LDL | **Glicada (HbA1c)** / **Colesterol LDL** |
| Relatório / Relatório de Saúde & Hábitos | **Levar ao médico** (tipos escolhidos lá dentro) |
| Pendências | **Para fazer hoje** |
| Sinais de alerta | **Quando procurar o pronto-socorro** |

Os nomes valem em todo lugar onde aparecem (cabeçalhos `sectionLabel`, títulos, notificações que citam o
módulo, PDF, textos do onboarding que citam módulos). Os nomes dos módulos foram propostos por Claude e
aceitos pelo Murilo ao aprovar o protótipo.

### 6.5 Molde único dos módulos

Toda tela de entrada de módulo (`coracao/index`, `rastreando/index`, `bem-estar/index`) e a aba Minha Saúde:

1. Cabeçalho com o nome novo.
2. **"O que você quer fazer?"**: lista de ações, uma por linha, verbo + nome comum, ícone à esquerda, letra
   ≥ 17 pt; subtítulo curto só quando ajuda a decidir (ex.: "MRPA · quando o médico pedir").
3. **"Seus últimos números"**: cartões compactos **só dos que a pessoa já tem**. Cartões vazios ("Registre
   para começar") somem; a ação equivalente já está na lista acima.

Listas de ações por módulo:

**Regra dos itens de tema:** nos módulos, o item de um tema (pressão, glicemia, sono, peso, atividade…) abre a
**tela do tema** (histórico, gráfico, plano, relatório próprio), e essa tela tem como **primeiro e maior botão**
o "Anotar". Assim nenhuma tela interna perde a entrada quando os cartões vazios somem. O atalho direto para o
formulário fica na tela inicial e no ＋ Anotar. Nome do item: "Minha pressão", com subtítulo "anotar e ver
como está".

- **Pressão, coração e diabetes:** Minha pressão · Medir a pressão por alguns dias (MRPA) (se houver MRPA em
  andamento: "Continuar o MRPA — dia X de N") · Minha glicemia (inclui plano e relatório da glicemia) · Ver meus
  exames · Calcular o risco do meu coração · Como está minha prevenção? · Quando procurar o pronto-socorro.
- **Exames de prevenção:** mantém as pendências e a lista "Para o seu perfil" (já são ações por programa);
  sobem para o topo "Ver meus lembretes" e "Levar ao médico (relatório de prevenção)" como itens de lista,
  não botões soltos.
- **Hábitos e bem-estar:** Meu peso e medidas (inclui composição corporal e "Entenda") · Meu sono · Minhas
  atividades · Minha água · Minha alimentação · Minhas metas · Check-in da semana. O "Relatório de Saúde & Hábitos" sai daqui
  e passa a ser um tipo dentro de "Levar ao médico".
- **Minha Saúde (aba):** Meus remédios · Meus exames · Meus documentos · Levar ao médico · Meus lembretes ·
  Meu perfil · Antecedentes familiares; depois ajuda (Fontes, Fale com o NERO) e conta (excluir) como hoje.

### 6.6 Onde mora cada coisa

| Função | Casa única | Em outros lugares |
|---|---|---|
| Minha Saúde | aba | sai da grade da tela inicial |
| Meus exames | Minha Saúde › Meus exames (todos os módulos) | Coração: item "Ver meus exames" que abre a mesma lista; a tela `coracao/exames` vira só redirecionamento ou é unificada (decisão do construtor, desde que a pessoa veja uma lista só) |
| Linha do tempo | aba Histórico | sai da lista de Coração e de Minha Saúde. A rota `coracao/linha-do-tempo` continua existindo (sem entrada); filtro por módulo no Histórico só se fizer falta depois |
| Peso | Hábitos e bem-estar | Coração só mostra o número em "Seus últimos números" |
| Remédios | Minha Saúde | botão na tela inicial e em "Anotar" |
| Relatórios gerais | Minha Saúde › Levar ao médico (os tipos que já existem: geral, coração e diabetes, prevenção, hábitos, médico específico); os títulos dos cartões passam a usar os nomes novos | botão na tela inicial |
| Relatório da MRPA e da glicemia | continuam na tela da MRPA e em "Minha glicemia" (dependem de uma sessão / formato próprio) | "Levar ao médico" ganha um aviso curto apontando para eles quando houver MRPA concluída |

### 6.7 Regras para o app todo (valem para as telas tocadas e para telas novas)

1. Qualquer função a no máximo 2 toques da tela inicial.
2. Nomes com verbo e palavras do dia a dia; sigla só entre parênteses.
3. Toda tela começa por "o que dá para fazer aqui"; números e explicações depois.
4. Um botão principal por tela, grande e sempre na mesma posição.
5. Explicação longa vira link "Entenda"; não some.
6. Letra mínima de 17 pt em botões e itens de lista.
7. Cada coisa mora num lugar só.

## 7. Restrições

- **Rotas antigas não quebram.** Notificações (`lembretesCardio`, pendências), `linhaDoTempo/geral.ts` e
  links salvos apontam para rotas atuais. Rota que deixar de ser entrada continua existindo ou redireciona.
- A navegação em si não exige módulo nativo novo (a barra não muda; o círculo é componente nosso). Mas este
  projeto **sai no mesmo build novo** do projeto "Marcar remédio tomado" (§9), que mexe em notificações e banco.
- Acessibilidade: cada botão com `accessibilityLabel` igual ao texto; manter suporte a letra grande do sistema.
- Testes existentes (627) continuam passando; telas alteradas ganham ou ajustam testes de renderização.
- Registrar a decisão como **D-065** em `docs/nero/02-DECISOES.md`.

## 8. Decisões tomadas por Claude na revisão (o Murilo pode mudar)

- "Tomei remédio" fica fora desta folha até o projeto do remédio existir (§9).
- Itens de tema nos módulos abrem a tela do tema, com "Anotar" como primeiro botão (§6.5).
- A regra dos 2 toques vale para a entrada de cada função, não para telas internas (§2).
- Relatórios da MRPA e da glicemia ficam onde estão; "Levar ao médico" aponta para eles (§6.6).
- A linha do tempo só do coração perde a entrada; a aba Histórico cobre (§6.6).

## 9. Ideias que ficaram fora

- **Marcar remédio tomado** (pela notificação: tomei / não tomei / quantos comprimidos; resumo no check-in
  semanal): **pedido pelo Murilo em 23/11/2026**, desenhado em documento próprio e entregue **no mesmo build**
  deste projeto. Quando existir, a folha "Anotar" ganha o botão "Tomei remédio".
- Filtro por módulo na aba Histórico.

## 10. Deixado para o construtor

- Componentes: reaproveitar `CardModulo`, `ListItem`, `CardResumo` ou criar um `BotaoAcao` grande; organização
  dos arquivos.
- Como unificar `coracao/exames` com `minha-saude/exames` (redirecionar ou filtrar), desde que haja uma lista só.
- Ordem exata de implementação e divisão em commits.
- Ícones exatos (dentro de Ionicons / SF Symbols já usados).
