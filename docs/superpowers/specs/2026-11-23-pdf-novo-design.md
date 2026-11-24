# Relatório para o médico: PDF novo, prévia no celular e página do QR

**Data:** 23/11/2026 · **Status:** design em aprovação · **Sai no mesmo build de:** navegação
(`2026-11-23-reorganizacao-navegacao-design.md`) e remédio tomado (`2026-11-23-remedio-tomado-design.md`).
**Esboço visto pelo Murilo:** `.superpowers/brainstorm/9406-1795471797/content/pdf-novo.html`.

## 0. Atualização de 23/11/2026 (decisão do Murilo) — vale sobre o resto deste documento

**Sem julgamento clínico novo no relatório.** Saem por completo:
- os **selos de cor** (verde/amarelo/vermelho) dos cartões, da adesão e da prevenção, e a tabela da §6.5;
- a folha de revisão para a Dra. Denise e a trava `VALIDACAO_SELOS`;
- o limite de **80 % de adesão** como gatilho.

O que fica é só o que o app **já diz hoje** por regras aprovadas: a pendência de rastreamento aberta, o sintoma de
alerta registrado, a MRPA acima da referência domiciliar (C-010/C-011, o mesmo aviso do PDF atual), as glicemias
fora da meta (metas SBD já usadas) e a **situação de cada rastreamento com o mesmo texto do app** (sem cor nova).
Remédios em "Para atenção": só **fatos** ("Losartana: 2 doses não tomadas e 1 sem registro em 14 dias"), quando
houver alguma dose não tomada, errada ou sem registro; sem limite percentual. Cartões mostram valor, unidade, data
e tendência; LDL e HbA1c com a referência do laboratório, como hoje.

## 1. Por que

O Murilo acha o PDF "muito difícil de ver, muito texto". Gerado com os dados de teste, o "Resumo completo" tem
**7 páginas** e:

- o que é urgente fica enterrado ("FIT positivo: colonoscopia indicada" só na página 4; MRPA acima da meta na 2);
- todas as seções têm o mesmo peso, sem nada que diga o que está bom ou ruim;
- informação repetida (pressão em barras e, logo abaixo, a mesma tabela);
- seções vazias ("Pulmão: sem registros"); 1,5 página só de fontes; termos internos vazando ("medicacao").

O leitor é o **médico, com pouco tempo na consulta**. Ele vê o relatório **impresso/no computador e no
celular** (o Murilo quer os dois).

## 2. Objetivos

1. **Página 1 = painel** que responde em 30 segundos: quem é, o que pede atenção, como estão os números.
2. Cada número com **selo de cor** dizendo se está na meta da diretriz já usada pelo app.
3. **Um conteúdo, três saídas:** PDF A4; **prévia no app adaptada ao celular**; **página aberta pelo QR,
   adaptada ao celular de quem lê**, com botão "Baixar PDF".
4. Adesão aos remédios visível de relance (dados do projeto "remédio tomado").
5. Menos páginas: nada vazio, nada repetido.

## 3. Fora do escopo

- Mudar cálculos clínicos, metas ou regras: o PDF só **mostra** o que o app já calcula.
- QR de emergência e acesso de familiar (projeto 4, que vai reaproveitar a página do QR).
- Novos tipos de relatório.

## 4. Anti-objetivos

- **Selo de cor que soe diagnóstico.** O teste "nenhuma frase diagnóstica" (`html.test.ts`) continua valendo; os
  selos dizem "na meta / acima da meta / alerta", nunca "hipertenso descontrolado".
- Perder as **ressalvas literais** (`RESSALVA_CARDIO`, `RESSALVA_ONCOLOGICO`, `RESSALVA_HABITOS`) ou as fontes
  citadas (exigência da revisão da Apple, 1.4.1).
- Página do QR que **exponha dados além do relatório** gerado, ou que continue funcionando depois de revogada
  ou vencida.

## 5. Abordagens consideradas

| | Abordagem | Decisão |
|---|---|---|
| A | Só o PDF A4, pensado para ler com zoom no celular | Descartada: no celular continua uma folha A4 |
| B | Um conteúdo, duas saídas: prévia do app adaptada + PDF A4; QR abre o PDF | Superada pela C |
| C | B + **o QR abre uma página adaptada ao celular** com botão "Baixar PDF" | **Escolhida pelo Murilo** |

**Um QR só** (o Murilo chegou a cogitar dois): a página tem o botão do PDF.

## 6. Design

### 6.1 Página 1 (painel), igual nas três saídas

De cima para baixo (ver esboço):

1. **Cabeçalho:** nome e idade em destaque; condições informadas; tabagismo; período dos dados; data de geração;
   QR (no PDF).
2. **"Para atenção nesta consulta"** (caixa vermelha), **só se houver algo**. Entram, nesta ordem:
   - pendência de rastreamento aberta (ex.: exame alterado sem conduta registrada);
   - sintoma de alerta registrado no período;
   - média da **MRPA** acima da referência domiciliar (130/80); pressão avulsa **só** se a regra C-010 já
     marcar (≥ 180/110); glicemias fora da meta (contagem);
   - remédio com adesão < 80 % ou doses erradas nas últimas 2 semanas.
   No máximo 5 itens; o resto aparece nas páginas seguintes.
3. **Cartões dos números principais** (2 colunas no A4, 1 coluna no celular), **só dos que existem**:
   pressão (MRPA se houver, senão média das avulsas), glicada (HbA1c), colesterol LDL, risco cardiovascular,
   glicemia capilar, peso/IMC. Cada cartão: valor grande, unidade, data e tendência quando houver anterior
   (↑ ↓) e, **só quando já existe regra no app**, um **selo** de cor.
   **Selos só onde já existe regra (escolha do Murilo, 23/11/2026):** MRPA, glicemia capilar, risco PREVENT,
   IMC e prevenção. **Sem selo:** colesterol LDL e HbA1c (mostram valor e a referência do laboratório; a meta de
   LDL por risco fica para depois, com a Dra. Denise) e pressão avulsa (C-010: triagem, sem cor abaixo de
   180/110). Nenhuma regra clínica nova neste projeto.
4. **Gráfico da pressão sistólica** do período, com a **linha da referência domiciliar (130)**; sem pontos
   coloridos (as medidas avulsas não recebem cor, C-010).
5. **Remédios: últimas 2 semanas** (contadas para trás a partir da data de geração): uma linha por remédio
   com bolinhas por dose (tomou / não tomou / errada / sem registro), "11 de 14" e o percentual com selo.
   "Se precisar": "usou N vezes".
6. **Prevenção em uma linha:** cada programa com selo (em dia / pendente / atrasado).
7. Rodapé: "Detalhes nas páginas seguintes", ressalva curta.

**Blocos por tipo de relatório** (decisão de Claude). "Para atenção" só traz itens do escopo do tipo:

| Tipo | Cartões (3) | Gráfico (4) | Remédios (5) | Prevenção (6) |
|---|---|---|---|---|
| Resumo completo (`geral`) | todos | sim | sim | sim |
| Coração e diabetes (`cardio`) | pressão, HbA1c, LDL, risco, glicemia, peso | sim | sim | não |
| Rastreamentos (`oncologico`) | não | não | não | sim, com o detalhe dos programas logo abaixo |
| Hábitos (`bemestar`) | peso/IMC, cintura | não | não | não |
| Médico específico (`consulta`) | os das seções que a especialidade já inclui (`especialidades.ts`) | se incluir pressão | sim (toda especialidade já leva remédios) | se incluir rastreamento |

O filtro `apenas` do relatório cardio vale também para o painel.

### 6.2 Páginas seguintes (detalhe)

- As seções de hoje continuam, na mesma ordem, **sem as vazias** (some "Sem registros no período").
- **Sem repetição:** onde hoje há barras + tabela dos mesmos dados, fica só a tabela (o gráfico está na página 1).
- Termos internos corrigidos ("medicacao" → "remédios", "bioimpedancia" → "bioimpedância").
- **Remédios:** o **resumo por semana das últimas 4 semanas** (como no design do remédio tomado) e a tabela das
  doses erradas e com atraso dessas 4 semanas (data, previsto, real, quantidade). Entra em todo relatório que
  já leva a seção de remédios (geral, cardio, consulta).
- **Fontes:** só as citadas nas seções presentes (já é assim), em letra menor, em duas colunas no A4.
- Meta: o "Resumo completo" dos dados de teste cai de 7 para **no máximo 4 páginas**.

### 6.3 Três saídas do mesmo conteúdo

O conteúdo continua sendo montado uma vez (`montar.ts` → `SecaoRelatorio[]`), agora com um **resumo do painel**
(`PainelRelatorio`: atenção, cartões, série da pressão, adesão, prevenção) calculado junto.

| Saída | Como |
|---|---|
| **PDF A4** | `html.ts` com CSS de impressão (`@page A4`), painel em 2 colunas |
| **Prévia no app** | componentes nativos (como hoje, `SecaoRelatorioView`) + componentes novos do painel, em 1 coluna |
| **Página do QR** | página do site (`nerosaude.com.br`: repositório `nerosaude-site` publicado pela Hostinger, via `scripts/gerar-site.mjs`) que lê os dados do relatório e desenha o mesmo painel em HTML responsivo; botão **"Baixar PDF"** |

### 6.4 Página do QR: acesso e segurança

- **A página mostra o relatório inteiro**, igual ao PDF: painel, detalhe, ressalvas literais e fontes com link
  (exigência 1.4.1 da Apple). O JSON leva as seções já montadas, e o site só desenha.
- **Ordem de lançamento:** a página `/r/` vai ao ar **antes** do build do app chegar às pessoas.
- Ao compartilhar, além do PDF, o app sobe **o conteúdo do relatório em JSON** no mesmo bucket `relatorios`,
  ao lado do PDF, com **URL assinada de 7 dias** (igual ao PDF hoje).
- O QR aponta para `https://nerosaude.com.br/r/#<token>`, em que o `<token>` leva as duas URLs assinadas (JSON e
  PDF). O que vem depois do `#` **não é enviado a servidor nenhum** (nem ao GitHub Pages); a página busca os
  arquivos direto no Supabase.
- **Revogar** apaga o JSON e o PDF (como hoje apaga o PDF): a página passa a mostrar "Este relatório não está
  mais disponível".
- A página não usa login, não guarda nada no navegador, tem `noindex` (meta tag, já que a Hostinger serve arquivos estáticos) e não carrega scripts de terceiros.
- Sugestão de caminho, que o construtor pode trocar se achar outro mais simples e igualmente seguro
  (ex.: função no servidor). Ela evita servidor novo: o Supabase Storage entrega arquivos, não páginas.
- Política de privacidade: descrever a página do QR (hoje descreve o link do PDF).

### 6.5 Tradução das situações atuais em cores (proposta para a Dra. Denise validar)

| Origem | Verde | Amarelo | Vermelho | Cinza (sem cor) |
|---|---|---|---|---|
| MRPA | média < 130/80 | média ≥ 130/80 | — (o app não alerta pela MRPA) | — |
| Glicemia capilar | 0 fora da meta | alguma acima/abaixo da meta | episódio de hipoglicemia registrado | — |
| Risco PREVENT | baixo | intermediário | alto | — |
| IMC | 18,5–24,9 | < 18,5 ou 25–29,9 | ≥ 30 | — |
| Rastreamentos | `em_dia` | `exame_proximo`, `indicado`, `proximo_de_iniciar` | `exame_atrasado`, pendência aberta | `nao_indicado_no_momento`, `avaliacao_individualizada`, `acompanhamento_medico`, `cancelado` |

Os textos dos selos são neutros ("na meta", "acima da meta", "atrasado"), nunca diagnósticos. **Nada vai ao ar
sem a validação desta tabela pela Dra. Denise.**

## 7. Restrições

- Ressalvas literais intactas; teste "nenhuma frase diagnóstica" continua passando.
- Os snapshots de `html.test.ts` serão regravados; cada mudança de snapshot revisada.
- A página do QR publica pelo fluxo atual do site (`npm run site:publicar`).
- Registrar como **D-067** em `docs/nero/02-DECISOES.md`.
- Mudanças de texto clínico nos selos passam pela Dra. Denise antes de publicar.

## 8. Decisões tomadas por Claude (o Murilo pode mudar)

- Ordem e limite (5) dos itens de "Para atenção".
- Blocos do painel por tipo de relatório (tabela da §6.1); `apenas` vale para o painel.
- Página do QR mostra o relatório inteiro; vai ao ar antes do build.
- Adesão: 2 semanas no painel, 4 semanas no detalhe, contadas a partir da geração.
- Adesão < 80 % como gatilho de atenção.
- Gráfico só da sistólica na página 1 (diastólica fica na tabela), com a linha de 130.
- Proposta de cores da §6.5 (a validar pela Dra. Denise).
- Meta de no máximo 4 páginas para o resumo completo dos dados de teste.
- Caminho da página do QR via JSON + URL assinada + site estático.

## 9. Deixado para o construtor

- Componentes, nomes de tipos e organização dos arquivos.
- Biblioteca (ou SVG à mão) do gráfico; formato exato do JSON e do token.
- Visual fino (cores dentro da paleta do app, espaçamentos).
