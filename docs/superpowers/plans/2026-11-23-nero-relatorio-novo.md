# Relatório para o médico: PDF novo, prévia no celular e página do QR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trocar o PDF de 7 páginas por um relatório com página 1 em forma de painel (atenção, cartões com selo, gráfico da sistólica, adesão aos remédios, prevenção), detalhe sem seções vazias nem repetidas, e o mesmo conteúdo em três saídas: PDF A4, prévia nativa e página `nerosaude.com.br/r/` aberta pelo QR.

**Architecture:** `montar.ts` continua produzindo `SecaoRelatorio[]`; um módulo novo `painel.ts` calcula `PainelRelatorio` a partir do mesmo `DadosNero`. Todas as cores vêm de **um único módulo**, `selos.ts` (tabela §6.5, a ser validada pela Dra. Denise, com trava de liberação). `html.ts` desenha painel + seções num HTML só, com CSS que vira 2 colunas no A4 e 1 coluna em tela estreita: esse mesmo HTML vai para o PDF e, dentro de um JSON no bucket `relatorios`, para a página do QR, que o mostra num `iframe` sem scripts. A prévia nativa ganha `PainelRelatorioView` e reaproveita o SVG do gráfico.

**Tech Stack:** Expo SDK 57, expo-router, expo-print, react-native-svg (`SvgXml`), `qrcode`, Supabase Storage (URL assinada), Jest + react-test-renderer, pgTAP (`npm run db:test`), Node (`scripts/gerar-site.mjs`), HTML/JS estático sem dependências para o site.

**Spec:** `docs/superpowers/specs/2026-11-23-pdf-novo-design.md`

**Contrato com os planos 1 e 2:** `/private/tmp/claude-501/-Users-muriloroizpovoa-Desktop-rastreio-app/09abb440-ad3a-4f81-a04d-b6baafdff4f4/scratchpad/contrato-planos.md`. Este é o **plano 3**; roda depois de `2026-11-23-nero-navegacao.md` e `2026-11-23-nero-remedio-tomado.md`, no mesmo branch. Consome, exatamente como o contrato define:
- `src/core/medicacoes/tipos.ts`: `Medicacao` (com `horarios: HorarioDose[]`, `unidade: UnidadeDose`, `doseVariavel`, `sePrecisar`, `horariosDesde`), `Tomada`, `UnidadeDose`.
- `src/core/medicacoes/adesao.ts`: `EstadoDose`, `DoseClassificada`, `ResumoAdesao`, `resumirAdesao(medicacoes, tomadas, desde, ate, agora)`.
- `src/core/medicacoes/repositorio.ts`: `listarTomadas(userId, desde, ate)`.

Antes da Task 1, confirme que esses nomes existem (`grep -n "export function resumirAdesao\|export async function listarTomadas\|export interface Tomada" src/core/medicacoes/*.ts`). Se faltar algum, pare: o plano 2 não terminou.

## Global Constraints

- O PDF só **mostra** o que o app já calcula: nenhuma regra clínica, meta ou cálculo novo (spec §3, §6.1.3).
- Página 1 = painel, igual nas três saídas: cabeçalho (nome e idade em destaque; condições informadas; tabagismo; período; data de geração; QR no PDF) → "Para atenção nesta consulta" → cartões → gráfico da sistólica → "Remédios: últimas 2 semanas" → prevenção em uma linha → rodapé "Detalhes nas páginas seguintes" + ressalva curta.
- "Para atenção nesta consulta" (caixa vermelha) **só se houver algo**, nesta ordem: pendência de rastreamento aberta; sintoma de alerta registrado no período; média da **MRPA** acima da referência domiciliar (130/80); pressão avulsa **só** se a C-010 já marcar (≥ 180/110); glicemias fora da meta (contagem); remédio com adesão < 80 % ou doses erradas nas últimas 2 semanas. **No máximo 5 itens.**
- Selos **só** em: MRPA, glicemia capilar, risco PREVENT, IMC e prevenção (e o percentual de adesão). **Sem selo:** colesterol LDL, HbA1c (mostram valor e referência do laboratório) e pressão avulsa.
- Textos dos selos neutros ("na meta", "acima da meta", "atrasado"), nunca diagnósticos. O teste "nenhuma frase diagnóstica" de `html.test.ts` continua passando.
- Ressalvas literais `RESSALVA_CARDIO`, `RESSALVA_ONCOLOGICO`, `RESSALVA_HABITOS` intactas; fontes citadas com link nas três saídas (Apple 1.4.1).
- Adesão: 2 semanas no painel, 4 semanas no detalhe, contadas para trás a partir da data de geração.
- Gráfico só da **sistólica**, com a linha da referência domiciliar **130**, sem pontos coloridos.
- Cartões: 2 colunas no A4, 1 coluna no celular; só os que existem.
- Detalhe: mesma ordem de hoje, **sem as seções vazias**, sem barras + tabela dos mesmos dados, termos internos corrigidos ("medicacao" → "remédios", "bioimpedancia" → "bioimpedância"); fontes em letra menor, em duas colunas no A4.
- Meta: o "Resumo completo" dos dados de teste cai de 7 para **no máximo 4 páginas**.
- Página do QR: mostra o relatório inteiro (painel, detalhe, ressalvas, fontes com link) e o botão **"Baixar PDF"**; sem login; não guarda nada no navegador; `noindex` por meta tag; nenhum script de terceiros; URL assinada de **7 dias**; o que vem depois do `#` não vai a servidor nenhum; revogada ou vencida mostra **"Este relatório não está mais disponível"**; vai ao ar **antes** do build, por `npm run site:publicar`.
- **Nada vai ao ar sem a validação da tabela §6.5 pela Dra. Denise.** A tabela vive só em `src/core/relatorios/selos.ts`.
- Registrar como **D-067** em `docs/nero/02-DECISOES.md`.
- Snapshots de `html.test.ts` regravados, cada mudança de snapshot revisada.
- Regras do projeto: testes `npx jest <caminho>`; tipos `npx tsc --noEmit`; **não** rodar `expo lint`; textos de interface em português do Brasil com acentos; commits terminam com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **QR escaneado depois de revogado ou vencido (ou com o JSON apagado pela limpeza):** a página mostra "Este relatório não está mais disponível." e nenhum resto do relatório — teste `estadoDaResposta` com 400 e 404 na Task 10.
2. **QR adulterado ou truncado** (caminho de outro bucket, `../`, outro host, `t` ausente): a página não faz nenhum `fetch` e mostra a mesma mensagem de indisponível; a página nunca busca nada fora do Supabase do projeto — testes de `lerHash` na Task 10.
3. **Conta nova, sem nenhum dado:** o painel sai só com o cabeçalho, sem caixa de atenção vazia, sem cartões "—", sem gráfico; nada quebra — teste `montarPainel` com dados vazios (Task 5) e `htmlRelatorio` correspondente (Task 7).
4. **Texto digitado pelo paciente com `<`, `>`, `"`** (nome, remédio, descrição de pendência) vai para a página pública: tudo escapado no painel; e o `iframe` não roda script mesmo se algo escapar — teste de escape no painel (Task 7) e do atributo `sandbox` (Task 10).
5. **Relatório gerado à noite** (depois das 21h em Brasília, quando a data UTC já virou): a janela de 2 e 4 semanas termina na data **local** da geração, não no dia seguinte — teste de `dataLocal` (Task 1) e de `janelaAdesao` (Task 3).

---

### Task 1: Dados e tipos do relatório novo

**Files:**
- Create: `src/core/relatorios/datas.ts`
- Modify: `src/core/relatorios/tipos.ts`, `src/core/relatorios/carregar.ts`, `src/core/relatorios/montar.ts` (construtor `medicamentos`, linha ~194), `src/core/relatorios/__tests__/fixtures.ts`
- Test: `src/core/relatorios/__tests__/datas.test.ts`, `src/core/relatorios/__tests__/montar.test.ts`

**Interfaces:**
- Consumes: `Medicacao`, `Tomada`, `UnidadeDose` (`@core/medicacoes/tipos`); `EstadoDose` (`@core/medicacoes/adesao`); `listarTomadas` (`@core/medicacoes/repositorio`); `extrairParametros` (`@core/regras/cardio/parametros`) e `carregarRegrasCardio('pressao')` (`@core/cardio/regras`); `ParametrosPressao` (`@core/regras/cardio/tipos`).
- Produces:
  - `datas.ts`: `dataLocal(d: Date): string` ('AAAA-MM-DD' pelos getters locais); `somarDias(dia: string, n: number): string`.
  - `DadosNero` ganha `geradoEm: string` (ISO do momento da carga), `tomadas: Tomada[]` (das 4 semanas até a data local de geração) e `parametrosPressao: ParametrosPressao | null`.
  - Em `tipos.ts` (usados pelas Tasks 2–8):
    ```ts
    export type CorSelo = 'verde' | 'amarelo' | 'vermelho' | 'cinza';
    export interface Selo { cor: CorSelo; texto: string }
    export type TipoCartao = 'pressao' | 'hba1c' | 'ldl' | 'risco' | 'glicemia' | 'peso' | 'cintura';
    export interface CartaoNumero { tipo: TipoCartao; titulo: string; valor: string; unidade: string; data: string | null; detalhe: string | null; tendencia: 'subiu' | 'desceu' | null; selo: Selo | null }
    export interface CabecalhoPainel { nome: string; idade: number | null; sexo: string | null; condicoes: string[]; tabagismo: string }
    export type EstadoDosePainel = Exclude<EstadoDose, 'pendente'>;
    export interface LinhaAdesao { medicacaoId: string; nome: string; dose: string | null; sePrecisar: boolean; doses: EstadoDosePainel[]; tomou: number; previstas: number; errado: number; percentual: number | null; usosSePrecisar: number; selo: Selo | null }
    export interface ProgramaPainel { programa: Programa; rotulo: string; situacao: string; selo: Selo | null; proximaData: string | null; mensagem: string }
    export interface PontoPressao { data: string; pas: number }
    export interface PainelRelatorio { cabecalho: CabecalhoPainel; atencao: string[]; cartoes: CartaoNumero[]; seriePressao: PontoPressao[] | null; adesao: LinhaAdesao[] | null; prevencao: ProgramaPainel[] | null; prevencaoDetalhada: boolean }
    ```
    (`null` em `seriePressao`/`adesao`/`prevencao` = bloco não desenhado.)
  - Fixture `dadosNeroTeste()` com `geradoEm: '2026-09-18T10:30:00'`, `parametrosPressao: extrairParametros(regrasPressaoTeste())` e as tomadas abaixo.

- [ ] **Step 1: Escrever os testes que falham**

`datas.test.ts`:
```ts
test('dataLocal usa o dia local, mesmo depois das 21h', () => expect(dataLocal(new Date(2026, 8, 18, 23, 30))).toBe('2026-09-18'));
test('somarDias atravessa mês', () => { expect(somarDias('2026-09-18', -27)).toBe('2026-08-22'); expect(somarDias('2026-08-31', 1)).toBe('2026-09-01'); });
```
Em `montar.test.ts`, no `describe('montarCardio')`, trocar o teste da tabela de medicações por:
```ts
test('tabela de remédios só com os ativos, horários e "se precisar"', () => {
  const b = s.find((x) => x.chave === 'medicamentos')!.blocos[0];
  if (b.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(b.linhas.map((l) => l[0])).toEqual(['Losartana', 'Metformina', 'Dipirona']);
  expect(b.linhas[0][2]).toBe('08:00');
  expect(b.linhas[1][2]).toBe('08:00, 20:00');
  expect(b.linhas[2][2]).toBe('se precisar');
  expect(b.linhas[0][3]).toBe('01/03/2024');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/datas.test.ts src/core/relatorios/__tests__/montar.test.ts`
Expected: FAIL (`Cannot find module '../datas'`; a tabela não tem "Dipirona").

- [ ] **Step 3: Atualizar a fixture `fixtures.ts`**

Remédios no formato do plano 2 (o plano 2 já converteu `m1`–`m3` com `horariosDesde: null`; aqui troque `horariosDesde` para os valores abaixo e acrescente `m4`):
- `m1` Losartana `50 mg`, `horarios: [{ hora: '08:00', quantidade: 1 }]`, `unidade: 'comprimido'`, `doseVariavel: false`, `sePrecisar: false`, `horariosDesde: '2026-01-01'`, ativa.
- `m2` Metformina `850 mg`, `horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1 }]`, mesmo resto, ativa.
- `m3` Sinvastatina inativa (como hoje, no formato novo, `horarios: [{ hora: '22:00', quantidade: 1 }]`).
- `m4` Dipirona `500 mg`, `horarios: []`, `sePrecisar: true`, `unidade: 'comprimido'`, `horariosDesde: null`, `desde: '2025-01-01'`, ativa.

`tomadasTeste(): Tomada[]` (exportada), cobrindo `2026-08-22` a `2026-09-18`, `marcadoEm` em hora local sem `Z`:
- Losartana 08:00: `tomou: true, quantidade: 1`, marcada às 08:05 todos os dias, **exceto** 05, 06, 07 e 08/09 (`tomou: false, quantidade: null`).
- Metformina 08:00 e 20:00: tomou 1 às +5 min, **exceto** 16/09 08:00 com `quantidade: 2` (errada) e 17/09 20:00 marcada às `2026-09-17T23:00:00` (com atraso); **nenhuma** tomada em 18/09 20:00 (ainda pendente às 10:30).
- Dipirona: `dataPrevista: null, horaPrevista: null, quantidadePrevista: null`, `tomou: true, quantidade: 1` em `2026-09-10T15:00:00` e `2026-09-14T09:00:00`.

- [ ] **Step 4: Implementar**

- `datas.ts`: as duas funções.
- `tipos.ts`: campos novos de `DadosNero` e os tipos do painel acima.
- `carregar.ts`: `carregarDadosNero(userId: string, periodo: Periodo, agora: Date = new Date())`; `hoje = dataLocal(agora)`; acrescentar ao `Promise.all` `listarTomadas(userId, somarDias(hoje, -27), hoje)` e `carregarRegrasCardio('pressao')`; devolver `geradoEm: agora.toISOString()`, `tomadas`, `parametrosPressao: extrairParametros(regrasPressao)`.
- `montar.ts`, construtor `medicamentos` (o plano 2 deixou só `m.horarios.map((h) => h.hora).join(', ')`): coluna "Horários" = `m.sePrecisar ? 'se precisar' : m.horarios.map((h) => h.hora).join(', ') || '—'`.

- [ ] **Step 5: Rodar testes e tipos**

Run: `npx jest src/core/relatorios && npx tsc --noEmit`
Expected: PASS; `tsc` sem erros (o snapshot de `html.test.ts` pode falhar só pela linha da Dipirona: regravar com `npx jest src/core/relatorios/__tests__/html.test.ts -u` e conferir que a única diferença é a linha nova da tabela).

- [ ] **Step 6: Commit**

```bash
git add src/core/relatorios
git commit -m "feat(relatório): dados de adesão, parâmetros de pressão e tipos do painel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `selos.ts` — a tabela §6.5 num lugar só, com trava de liberação

**Files:**
- Create: `src/core/relatorios/selos.ts`
- Test: `src/core/relatorios/__tests__/selos.test.ts`

**Interfaces:**
- Consumes: `Selo`, `CorSelo` (Task 1); `FaixaIMC` (`@core/regras/bemestar/corpo`); `StatusRastreamento` (`@core/regras/tipos`); `ResumoGlicemia` (`@core/regras/cardio/tiposGlicemia`).
- Produces:
  ```ts
  export const LIMIAR_ADESAO = 80;
  export const VALIDACAO_SELOS: { validadoPor: string | null; validadoEm: string | null } = { validadoPor: null, validadoEm: null };
  export function selosLiberados(v = VALIDACAO_SELOS, dev: boolean = __DEV__): boolean   // v.validadoEm != null || dev
  export function seloMrpa(acimaReferencia: boolean): Selo
  export function seloGlicemia(r: Pick<ResumoGlicemia, 'abaixoDaMeta' | 'acimaDaMeta' | 'episodiosBaixos'>): Selo
  export function seloRisco(c: 'baixo' | 'intermediario' | 'alto'): Selo
  export function seloImc(f: FaixaIMC): Selo
  export function seloRastreamento(status: StatusRastreamento, temPendencia: boolean): Selo
  export function seloAdesao(percentual: number): Selo
  ```
  Comentário no topo do arquivo: "Proposta de cores da spec §6.5, a validar pela Dra. Denise. Qualquer mudança de cor ou texto de selo é feita **só aqui** e atualizada na folha `docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md`."

Tabela que os testes fixam (é a proposta da §6.5; textos neutros):

| Função | Entrada → selo |
|---|---|
| `seloMrpa` | `false` → verde "na meta" · `true` → amarelo "acima da meta" |
| `seloGlicemia` | `episodiosBaixos > 0` → vermelho "hipoglicemia registrada" · `abaixo + acima > 0` → amarelo "fora da meta" · senão verde "na meta" |
| `seloRisco` | baixo → verde "risco baixo" · intermediario → amarelo "risco intermediário" · alto → vermelho "risco alto" |
| `seloImc` | referencia → verde "faixa de referência" · baixo_peso → amarelo "baixo peso" · sobrepeso → amarelo "sobrepeso" · obesidade_1/2/3 → vermelho "obesidade grau I/II/III" |
| `seloRastreamento` | `temPendencia` → vermelho "pendência aberta" (vence o status) · em_dia → verde "em dia" · exame_proximo → amarelo "exame próximo" · indicado → amarelo "indicado" · proximo_de_iniciar → amarelo "próximo de iniciar" · exame_atrasado → vermelho "atrasado" · nao_indicado_no_momento / avaliacao_individualizada / acompanhamento_medico → cinza "não indicado no momento" / "avaliação individualizada" / "acompanhamento médico" |
| `seloAdesao` | `≥ 80` → verde "`N` %" · `< 80` → amarelo "`N` %" |

- [ ] **Step 1: Escrever os testes que falham**

```ts
test('MRPA', () => { expect(seloMrpa(false)).toEqual({ cor: 'verde', texto: 'na meta' }); expect(seloMrpa(true)).toEqual({ cor: 'amarelo', texto: 'acima da meta' }); });
test('glicemia: hipoglicemia vence fora da meta', () => {
  expect(seloGlicemia({ abaixoDaMeta: 0, acimaDaMeta: 0, episodiosBaixos: 0 })).toEqual({ cor: 'verde', texto: 'na meta' });
  expect(seloGlicemia({ abaixoDaMeta: 0, acimaDaMeta: 2, episodiosBaixos: 0 })).toEqual({ cor: 'amarelo', texto: 'fora da meta' });
  expect(seloGlicemia({ abaixoDaMeta: 1, acimaDaMeta: 2, episodiosBaixos: 1 })).toEqual({ cor: 'vermelho', texto: 'hipoglicemia registrada' });
});
test('risco PREVENT', () => expect(['baixo', 'intermediario', 'alto'].map((c) => seloRisco(c as never).cor)).toEqual(['verde', 'amarelo', 'vermelho']));
test('IMC pelas faixas do app', () => {
  expect(seloImc('referencia').cor).toBe('verde'); expect(seloImc('baixo_peso').cor).toBe('amarelo'); expect(seloImc('sobrepeso')).toEqual({ cor: 'amarelo', texto: 'sobrepeso' });
  expect(seloImc('obesidade_1')).toEqual({ cor: 'vermelho', texto: 'obesidade grau I' });
});
test('rastreamento: pendência aberta vence o status', () => {
  expect(seloRastreamento('em_dia', false)).toEqual({ cor: 'verde', texto: 'em dia' });
  expect(seloRastreamento('exame_atrasado', false)).toEqual({ cor: 'vermelho', texto: 'atrasado' });
  expect(seloRastreamento('em_dia', true)).toEqual({ cor: 'vermelho', texto: 'pendência aberta' });
  expect(seloRastreamento('acompanhamento_medico', false).cor).toBe('cinza');
});
test('adesão com limiar de 80 %', () => { expect(seloAdesao(80)).toEqual({ cor: 'verde', texto: '80 %' }); expect(seloAdesao(71)).toEqual({ cor: 'amarelo', texto: '71 %' }); });
test('nenhum texto de selo é diagnóstico', () => {
  const todos = [seloMrpa(true), seloMrpa(false), seloRisco('alto'), ...(['referencia','baixo_peso','sobrepeso','obesidade_1','obesidade_2','obesidade_3'] as const).map(seloImc), ...(['indicado','proximo_de_iniciar','nao_indicado_no_momento','avaliacao_individualizada','acompanhamento_medico','em_dia','exame_proximo','exame_atrasado'] as const).map((s) => seloRastreamento(s, false))].map((s) => s.texto.toLowerCase()).join(' | ');
  expect(todos).not.toMatch(/você tem|diagnóstico|hipertens|diabétic|descontrol/);
});
test('trava: fora do modo dev, selos só depois da validação', () => {
  expect(selosLiberados({ validadoPor: null, validadoEm: null }, false)).toBe(false);
  expect(selosLiberados({ validadoPor: 'Dra. Denise', validadoEm: '2026-12-01' }, false)).toBe(true);
  expect(selosLiberados({ validadoPor: null, validadoEm: null }, true)).toBe(true);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/selos.test.ts`
Expected: FAIL (`Cannot find module '../selos'`).

- [ ] **Step 3: Implementar `selos.ts`** com as assinaturas e a tabela acima (um `Record` por função; nenhum texto de selo fora deste arquivo).

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios/__tests__/selos.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios/selos.ts src/core/relatorios/__tests__/selos.test.ts
git commit -m "feat(relatório): selos de cor num módulo único, travados até a validação clínica

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Adesão no relatório (painel de 2 semanas e detalhe de 4)

**Files:**
- Create: `src/core/relatorios/adesaoRelatorio.ts`
- Modify: `src/core/relatorios/montar.ts` (construtor `medicamentos`)
- Test: `src/core/relatorios/__tests__/adesaoRelatorio.test.ts`, `src/core/relatorios/__tests__/montar.test.ts`

**Interfaces:**
- Consumes: `resumirAdesao` (plano 2); `dataLocal`, `somarDias` (Task 1); `seloAdesao`, `LIMIAR_ADESAO` (Task 2); `LinhaAdesao`, `Bloco`, `DadosNero` (Task 1).
- Produces:
  ```ts
  export const SIMBOLO_DOSE: Record<EstadoDosePainel, string> = { tomou: '●', nao_tomou: '○', errado: '◆', sem_registro: '–' };
  export const LEGENDA_DOSES = '● tomou · ○ não tomou · ◆ errada · – sem registro';
  export function janelaAdesao(hoje: string, dias: 14 | 28): { desde: string; ate: string }   // desde = somarDias(hoje, -(dias - 1))
  export function linhasAdesao(d: DadosNero, selos: boolean): LinhaAdesao[]
  export function blocosAdesaoDetalhe(d: DadosNero): Bloco[]
  export function quantidadeComUnidade(q: number, u: UnidadeDose): string   // 1 comprimido · 2 comprimidos · 3 gotas · 5 ml · 2 jatos · 1 unidade
  ```
  Regras: `hoje = dataLocal(new Date(d.geradoEm))`; só remédios **ativos**, na ordem do cadastro; `resumirAdesao(ativos, d.tomadas, desde, ate, new Date(d.geradoEm))`. Em `LinhaAdesao`: `doses` = estados das `DoseClassificada` sem as `pendente`, em ordem de data e hora; `percentual = r.percentual` (o plano 2 já entrega inteiro 0–100, `Math.round(100 * tomou / previstas)`, e `null` para "se precisar" ou sem dose prevista); `selo = selos && percentual != null ? seloAdesao(percentual) : null`.
  Detalhe (anexado ao fim dos blocos da seção `medicamentos`, só quando há remédio ativo):
  1. texto `Adesão aos remédios nas últimas 4 semanas, pelo que o paciente marcou no app.`
  2. tabela `['Remédio', 'Semana de DD/MM' ×4]`, semanas de 7 dias terminando na data de geração (a mais antiga primeiro); célula `"T de P"`; remédio "se precisar": `"usou 1 vez"` / `"usou N vezes"`, `'—'` quando 0; remédio sem dose prevista na semana: `'—'`. Rótulo da linha: `nome` + `' ' + dose` se houver.
  3. tabela `['Data', 'Remédio', 'Previsto', 'Real', 'Quantidade', 'Situação']` com as doses das 4 semanas em estado `errado` ou com `comAtraso`; "Previsto" = `HH:MM · quantidadeComUnidade(prevista)`; "Real" = horas locais de `marcadoEm` das tomadas (`', '`), `'—'` sem tomada; "Quantidade" = quantidades das tomadas unidas por `' + '`; "Situação" = `'errada'`, `'com atraso'` ou `'errada, com atraso'`. Omitida se não houver linhas.

- [ ] **Step 1: Escrever os testes que falham**

`adesaoRelatorio.test.ts` (fixture da Task 1):
```ts
test('janela termina no dia de geração', () => { expect(janelaAdesao('2026-09-18', 14)).toEqual({ desde: '2026-09-05', ate: '2026-09-18' }); expect(janelaAdesao('2026-09-18', 28).desde).toBe('2026-08-22'); });
test('Losartana: 10 de 14 nas últimas 2 semanas, 71 % amarelo', () => {
  const l = linhasAdesao(dadosNeroTeste(), true).find((x) => x.nome === 'Losartana')!;
  expect([l.tomou, l.previstas, l.percentual]).toEqual([10, 14, 71]);
  expect(l.doses.slice(0, 4)).toEqual(['nao_tomou', 'nao_tomou', 'nao_tomou', 'nao_tomou']);
  expect(l.selo).toEqual({ cor: 'amarelo', texto: '71 %' });
});
test('Metformina: dose de hoje à noite (pendente) não entra; 1 errada', () => {
  const l = linhasAdesao(dadosNeroTeste(), true).find((x) => x.nome === 'Metformina')!;
  expect(l.doses).not.toContain('pendente'); expect(l.errado).toBe(1);
});
test('"se precisar": sem percentual nem selo, com usos', () => {
  const l = linhasAdesao(dadosNeroTeste(), true).find((x) => x.nome === 'Dipirona')!;
  expect([l.sePrecisar, l.percentual, l.selo, l.usosSePrecisar]).toEqual([true, null, null, 2]);
});
test('selos desligados → selo null', () => expect(linhasAdesao(dadosNeroTeste(), false).every((l) => l.selo === null)).toBe(true));
test('remédio recém-cadastrado, sem dose prevista ainda: percentual null, sem selo', () => {
  const d = dadosNeroTeste(); d.medicacoes = [{ ...d.medicacoes[0], horariosDesde: '2026-09-19' }]; d.tomadas = [];
  expect(linhasAdesao(d, true)[0]).toMatchObject({ previstas: 0, percentual: null, selo: null });
});
test('detalhe: tabela por semana', () => {
  const t = blocosAdesaoDetalhe(dadosNeroTeste()).filter((b) => b.tipo === 'tabela')[0];
  if (t.tipo !== 'tabela') throw new Error();
  expect(t.colunas).toEqual(['Remédio', 'Semana de 22/08', 'Semana de 29/08', 'Semana de 05/09', 'Semana de 12/09']);
  expect(t.linhas.find((l) => l[0] === 'Losartana 50 mg')).toEqual(['Losartana 50 mg', '7 de 7', '7 de 7', '3 de 7', '7 de 7']);
  expect(t.linhas.find((l) => l[0] === 'Dipirona 500 mg')).toEqual(['Dipirona 500 mg', '—', '—', 'usou 1 vez', 'usou 1 vez']);
});
test('detalhe: doses erradas e com atraso', () => {
  const t = blocosAdesaoDetalhe(dadosNeroTeste()).filter((b) => b.tipo === 'tabela')[1];
  if (t.tipo !== 'tabela') throw new Error();
  expect(t.linhas).toEqual([
    ['16/09/2026', 'Metformina', '08:00 · 1 comprimido', '08:05', '2 comprimidos', 'errada'],
    ['17/09/2026', 'Metformina', '20:00 · 1 comprimido', '23:00', '1 comprimido', 'com atraso'],
  ]);
});
test('sem remédio ativo, sem detalhe', () => { const d = dadosNeroTeste(); d.medicacoes = []; expect(blocosAdesaoDetalhe(d)).toEqual([]); });
```
Em `montar.test.ts` (`describe('montarCardio')`):
```ts
test('seção de remédios traz o resumo de 4 semanas', () => expect(textoDe([s.find((x) => x.chave === 'medicamentos')!])).toContain('Semana de 12/09'));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/adesaoRelatorio.test.ts src/core/relatorios/__tests__/montar.test.ts`
Expected: FAIL (`Cannot find module '../adesaoRelatorio'`).

- [ ] **Step 3: Implementar `adesaoRelatorio.ts`** e, em `montar.ts`, anexar `...blocosAdesaoDetalhe(d)` aos blocos da seção `medicamentos` quando houver ativos.

Se um número da fixture divergir por causa de uma regra do plano 2 (ex.: dose errada também contada em `tomou`), **não** mude a regra: ajuste a asserção ao que `resumirAdesao` devolve e anote no commit. As de Losartana não dependem disso.

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios && npx tsc --noEmit`
Expected: PASS (snapshot de `html.test.ts` muda pela tabela de adesão: regravar com `-u` e conferir que só entraram as duas tabelas e o texto novo).

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios
git commit -m "feat(relatório): adesão aos remédios — 2 semanas no painel, 4 semanas no detalhe

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Escopo por tipo e "Para atenção nesta consulta"

**Files:**
- Create: `src/core/relatorios/painel.ts`
- Test: `src/core/relatorios/__tests__/painel.test.ts`

**Interfaces:**
- Consumes: `SECOES_*`, `SEMPRE_PRESENTE`, `PRIORIDADES` (`especialidades.ts`); `avaliarMedidaCasual` (`@core/regras/cardio/pressao`); `resumoGlicemia` (`@core/regras/cardio/glicemia`); `ROTULO_PROGRAMA` (`@core/rastreando/tipos`); `dataBr` (`montar.ts`); `LinhaAdesao`, `LIMIAR_ADESAO`.
- Produces:
  ```ts
  export interface OpcoesPainel { tipo: TipoRelatorio; especialidade?: Especialidade; apenas?: ChaveSecao[]; periodo: Periodo; selos?: boolean }  // selos padrão: selosLiberados()
  export const LIMITE_ATENCAO = 5;
  export function escopoDoRelatorio(o: Pick<OpcoesPainel, 'tipo' | 'especialidade' | 'apenas'>): ChaveSecao[]
  export function itensAtencao(d: DadosNero, escopo: ChaveSecao[], periodo: Periodo, adesao: LinhaAdesao[]): string[]
  ```
  `escopoDoRelatorio`: geral → `SECOES_GERAL`; cardio → `apenas ? ['perfil', 'medicamentos', ...apenas] : SECOES_CARDIO`; oncologico → `SECOES_ONCOLOGICO`; bemestar → `SECOES_BEMESTAR`; consulta → `especialidade` ausente ou `'outra'` → `SECOES_GERAL`, senão `[...SEMPRE_PRESENTE, ...PRIORIDADES[especialidade]]`.
  `itensAtencao`, na ordem, cortando em `LIMITE_ATENCAO`. Pendências entram em **todo** tipo (§66: pendência aberta nunca é omitida); o resto só se a chave estiver no escopo:

  | Item | Chave | Texto exato |
  |---|---|---|
  | cada pendência | sempre | `${ROTULO_PROGRAMA[p.programa]}: ${p.descricao} (aberta em ${dataBr(p.abertaEm)})` |
  | cada sintoma com `registradoEm ≥ periodo.desde` | `sintomas` | `Sintoma de alerta registrado em ${data}: ${s.sintoma} (${ROTULO_PROGRAMA[s.programa]})` |
  | última sessão MRPA (por `inicio`) válida com `acimaReferencia === true` | `mrpa` | `Média da MRPA acima da referência domiciliar (130/80 mmHg): ${pas}/${pad} mmHg` |
  | medidas avulsas cuja `avaliarMedidaCasual(m, m.contexto.sintomas ?? [], d.parametrosPressao).camada !== 'contexto'` (só com `parametrosPressao`) | `pa` | `1 medida avulsa` / `${n} medidas avulsas` + ` a partir de ${p.muitoElevado.pas}/${p.muitoElevado.pad} mmHg no período (maior: ${pas}/${pad} em ${data})` |
  | `resumoGlicemia` com metas e `abaixo + acima > 0` | `glicemia` | `1 glicemia` / `${n} glicemias` + ` fora da meta no período (${abaixo} abaixo, ${acima} acima)` |
  | cada linha de adesão não "se precisar" com `percentual < LIMIAR_ADESAO` e/ou `errado > 0` | `medicamentos` | `${nome}: ` + partes unidas por `' · '` (`${tomou} de ${previstas} doses marcadas como tomadas (${pct} %)`; `1 dose errada` / `${n} doses erradas`) + ` nas últimas 2 semanas` |

- [ ] **Step 1: Escrever os testes que falham**

```ts
const adesao = (d = dadosNeroTeste()) => linhasAdesao(d, true);
test('geral com os dados de teste: pendência, MRPA e os dois remédios, nessa ordem', () => {
  const d = dadosNeroTeste();
  const a = itensAtencao(d, escopoDoRelatorio({ tipo: 'geral' }), PERIODO_TESTE, adesao(d));
  expect(a).toHaveLength(4);
  expect(a[0]).toBe('Intestino (colorretal): FIT positivo: colonoscopia indicada (aberta em 20/08/2026)');
  expect(a[1]).toBe('Média da MRPA acima da referência domiciliar (130/80 mmHg): 131/83 mmHg');
  expect(a[2]).toBe('Losartana: 10 de 14 doses marcadas como tomadas (71 %) nas últimas 2 semanas');
  expect(a[3]).toContain('Metformina: 1 dose errada nas últimas 2 semanas');
});
test('oncológico e hábitos só trazem a pendência', () => {
  for (const tipo of ['oncologico', 'bemestar'] as const) expect(itensAtencao(dadosNeroTeste(), escopoDoRelatorio({ tipo }), PERIODO_TESTE, adesao())).toHaveLength(1);
});
test('pressão avulsa só a partir de 180/110 (C-010)', () => {
  const d = dadosNeroTeste();
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, []).some((x) => x.includes('medida avulsa'))).toBe(false); // 140/90 não entra
  d.medidasPA.push({ id: 'pa7', medidoEm: '2026-09-07T08:00:00.000Z', pas: 182, pad: 100, fc: 70, sessaoId: null, contexto: {} });
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, [])).toContain('1 medida avulsa a partir de 180/110 mmHg no período (maior: 182/100 em 07/09/2026)');
});
test('glicemias fora da meta são contadas', () => {
  const d = dadosNeroTeste(); d.glicemias.push({ id: 'g5', medidoEm: '2026-09-03T07:00:00.000Z', mgdl: 150, momento: 'jejum', contexto: {} });
  expect(itensAtencao(d, ['glicemia'], PERIODO_TESTE, [])).toEqual(['1 glicemia fora da meta no período (0 abaixo, 1 acima)']);
});
test('sintoma fora do período não entra', () => {
  const d = dadosNeroTeste();
  d.sintomas = [{ id: 's1', programa: 'mama', sintoma: 'nódulo palpável', registradoEm: '2026-09-02' }, { id: 's2', programa: 'mama', sintoma: 'antigo', registradoEm: '2025-01-01' }];
  expect(itensAtencao(d, ['sintomas'], PERIODO_TESTE, []).filter((x) => x.startsWith('Sintoma'))).toEqual(['Sintoma de alerta registrado em 02/09/2026: nódulo palpável (Mama)']);
});
test('no máximo 5 itens, pendências primeiro', () => {
  const d = dadosNeroTeste(); d.pendencias = Array.from({ length: 6 }, (_, i) => ({ ...d.pendencias[0], id: `p${i}` }));
  const a = itensAtencao(d, escopoDoRelatorio({ tipo: 'geral' }), PERIODO_TESTE, adesao(d));
  expect(a).toHaveLength(5); expect(a.every((x) => x.startsWith('Intestino'))).toBe(true);
});
test('escopo: cardio com apenas, consulta por especialidade, "outra" = geral', () => {
  expect(escopoDoRelatorio({ tipo: 'cardio', apenas: ['mrpa'] })).toEqual(['perfil', 'medicamentos', 'mrpa']);
  expect(escopoDoRelatorio({ tipo: 'consulta', especialidade: 'mastologia' })).toEqual(['perfil', 'medicamentos', 'documentos', 'mama', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas']);
  expect(escopoDoRelatorio({ tipo: 'consulta', especialidade: 'outra' })).toEqual(SECOES_GERAL);
});
```
(Ajuste o rótulo "Mama"/"Intestino (colorretal)" ao valor real de `ROTULO_PROGRAMA` se divergir.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/painel.test.ts`
Expected: FAIL (`Cannot find module '../painel'`).

- [ ] **Step 3: Implementar** `escopoDoRelatorio`, `itensAtencao`, `OpcoesPainel` e `LIMITE_ATENCAO` em `painel.ts`.

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios/__tests__/painel.test.ts && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios/painel.ts src/core/relatorios/__tests__/painel.test.ts
git commit -m "feat(relatório): escopo por tipo e itens de \"Para atenção nesta consulta\"

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Cartões, série da pressão, prevenção e `montarPainel`

**Files:**
- Modify: `src/core/relatorios/painel.ts`, `src/core/relatorios/montar.ts` (exportar `num`, `condicoesInformadas`, `textoTabagismo` extraídos do construtor `perfil`, sem mudar o texto dele)
- Test: `src/core/relatorios/__tests__/painel.test.ts`

**Interfaces:**
- Consumes: Tasks 1–4; `faixaIMC` (`@core/regras/bemestar/corpo`); `calcularIdade(dn, hoje)` (`@core/perfil/calculos`); `ROTULO_STATUS` (exportar de `montar.ts`); `PROGRAMAS` (`@core/rastreando/tipos`).
- Produces:
  ```ts
  export function condicoesInformadas(p: PerfilSaude): string[]      // montar.ts
  export function textoTabagismo(p: PerfilSaude): string             // montar.ts — 'ex-fumante · 20,0 maços-ano'
  export function cartoesDoPainel(d: DadosNero, tipo: TipoRelatorio, escopo: ChaveSecao[], filtrar: boolean, selos: boolean): CartaoNumero[]
  export function seriePressao(d: DadosNero): PontoPressao[]
  export function prevencaoDoPainel(d: DadosNero, selos: boolean): ProgramaPainel[]
  export function montarPainel(d: DadosNero, o: OpcoesPainel): PainelRelatorio
  ```
  Cartões candidatos (nesta ordem): geral → os 7; cardio → `pressao, hba1c, ldl, risco, glicemia, peso`; oncologico → nenhum; bemestar → `peso, cintura`; consulta → os 7. `filtrar` (verdadeiro para consulta e para cardio com `apenas`) mantém só o cartão cujas chaves cruzam o escopo: `pressao: ['mrpa','pa']`, `hba1c: ['hba1c']`, `ldl: ['lipidios']`, `risco: ['prevent']`, `glicemia: ['glicemia']`, `peso: ['corpo','peso']`, `cintura: ['corpo']`. Cartão sem dado não entra.

  | Cartão | Fonte | `titulo` / `valor` / `unidade` / `detalhe` / selo |
  |---|---|---|
  | pressao | última sessão MRPA com `medias.total` | "Pressão arterial (MRPA)" / `131/83` / mmHg / `24 medidas válidas` / `seloMrpa(acimaReferencia)` só se `valido`; tendência pela PAS da sessão anterior |
  | pressao (sem MRPA) | média das avulsas | "Pressão arterial (média das medidas avulsas)" / `130/83` / mmHg / `6 medidas` / **sem selo** |
  | hba1c, ldl | último exame `hba1c` / `ldl` | "Hemoglobina glicada (HbA1c)" / "Colesterol LDL"; valor `num(v, inteiro ? 0 : 1)`; unidade do resultado; detalhe `referência do laboratório: X a Y` ou null; **sem selo**; tendência pelo exame anterior |
  | risco | `d.riscos[0]` | "Risco cardiovascular em 10 anos (PREVENT)" / `7,4` / % / null / `seloRisco(categoria)` |
  | glicemia | `resumoGlicemia` | "Glicemia capilar" / média `num(media)` / mg/dL / `${n} medidas no período` / `seloGlicemia(r)` só com metas |
  | peso | último peso em `bemEstar.corporais`, senão `d.peso` | "Peso e IMC" / `82,0` / kg / `IMC 28,4` / `seloImc(faixaIMC(imc, bemEstar.parametros).faixa)` só com altura e parâmetros; tendência pelo peso anterior |
  | cintura | última cintura em `bemEstar.corporais` | "Circunferência abdominal" / `96` / cm / null / **sem selo** |

  `data` em `DD/MM/AAAA`; `tendencia` `'subiu'`/`'desceu'`, `null` se igual ou sem anterior.
  `seriePressao`: avulsas (`sessaoId` nulo) + `medias.porDia[].total.pas` das sessões MRPA, por data crescente.
  `prevencaoDoPainel`: um item por `PROGRAMAS` com avaliação e sem `naoAplicavel`; `situacao = ROTULO_STATUS[status]`; `selo = selos ? seloRastreamento(status, pendências do programa > 0) : null`.
  `montarPainel`: `selos = o.selos ?? selosLiberados()`; cabeçalho com `calcularIdade(dataNascimento, new Date(d.geradoEm))`; `seriePressao` só para geral/cardio/consulta com `pa` ou `mrpa` no escopo **e** ≥ 2 pontos, senão `null`; `adesao` = `linhasAdesao` para geral/cardio/consulta, senão `null`; `prevencao` para geral, oncologico e consulta com alguma de `rastreamentos_status, mama, colo, colorretal, pulmao, prostata` no escopo, senão `null`; `prevencaoDetalhada = tipo === 'oncologico'`.

- [ ] **Step 1: Escrever os testes que falham** (em `painel.test.ts`)

```ts
const geral = () => montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE, selos: true });
test('cabeçalho', () => expect(geral().cabecalho).toEqual({ nome: 'Ana Souza', idade: 51, sexo: 'feminino', condicoes: ['hipertensão', 'diabetes (DM2)'], tabagismo: 'ex-fumante · 20,0 maços-ano' }));
test('cartões do geral, na ordem, com selo só onde há regra', () => {
  const c = geral().cartoes;
  expect(c.map((x) => x.tipo)).toEqual(['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso', 'cintura']);
  expect(c[0]).toMatchObject({ titulo: 'Pressão arterial (MRPA)', valor: '131/83', unidade: 'mmHg', data: '01/08/2026', selo: { cor: 'amarelo', texto: 'acima da meta' } });
  expect(c[1]).toMatchObject({ valor: '6,8', unidade: '%', selo: null });
  expect(c[2]).toMatchObject({ valor: '118', tendencia: 'desceu', selo: null });
  expect(c[3]).toMatchObject({ valor: '7,4', selo: { cor: 'amarelo', texto: 'risco intermediário' } });
  expect(c[4].selo).toEqual({ cor: 'verde', texto: 'na meta' });
  expect(c[5]).toMatchObject({ valor: '82,0', detalhe: 'IMC 28,4', tendencia: 'desceu', selo: { cor: 'amarelo', texto: 'sobrepeso' } });
  expect(c[6]).toMatchObject({ valor: '96', selo: null });
});
test('sem MRPA, pressão é a média das avulsas, sem selo', () => {
  const d = dadosNeroTeste(); d.sessoesMrpa = [];
  expect(montarPainel(d, { tipo: 'cardio', periodo: PERIODO_TESTE, selos: true }).cartoes[0]).toMatchObject({ valor: '130/83', selo: null });
});
test('blocos por tipo', () => {
  const p = (o: Partial<OpcoesPainel>) => montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE, selos: true, ...o });
  expect(p({ tipo: 'cardio' }).cartoes.map((x) => x.tipo)).toEqual(['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso']);
  expect(p({ tipo: 'cardio' }).prevencao).toBeNull();
  expect(p({ tipo: 'cardio', apenas: ['mrpa'] }).cartoes.map((x) => x.tipo)).toEqual(['pressao']);
  const onco = p({ tipo: 'oncologico' });
  expect([onco.cartoes, onco.seriePressao, onco.adesao, onco.prevencaoDetalhada]).toEqual([[], null, null, true]);
  expect(p({ tipo: 'bemestar' }).cartoes.map((x) => x.tipo)).toEqual(['peso', 'cintura']);
  const masto = p({ tipo: 'consulta', especialidade: 'mastologia' });
  expect([masto.cartoes, masto.seriePressao, masto.adesao !== null, masto.prevencao !== null]).toEqual([[], null, true, true]);
});
test('série da sistólica junta avulsas e dias da MRPA, por data', () => {
  const s = seriePressao(dadosNeroTeste());
  expect(s).toHaveLength(8); expect(s[0]).toEqual({ data: '2026-08-02', pas: 130 });
});
test('prevenção: pendência aberta vence o status', () => {
  expect(geral().prevencao!.map((x) => [x.programa, x.selo?.texto])).toEqual([['mama', 'em dia'], ['colorretal', 'pendência aberta']]);
});
test('selos desligados (antes da validação): nenhum selo em lugar nenhum', () => {
  const p = montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE, selos: false });
  expect([...p.cartoes.map((c) => c.selo), ...p.adesao!.map((l) => l.selo), ...p.prevencao!.map((x) => x.selo)].every((x) => x === null)).toBe(true);
});
test('conta sem dados: só o cabeçalho', () => {
  const d = dadosNeroTeste();
  Object.assign(d, { medidasPA: [], sessoesMrpa: [], glicemias: [], examesCardio: [], riscos: [], peso: null, bemEstar: undefined, medicacoes: [], tomadas: [], pendencias: [], sintomas: [], avaliacoes: {} });
  const p = montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE, selos: true });
  expect([p.atencao, p.cartoes, p.seriePressao, p.adesao, p.prevencao]).toEqual([[], [], null, [], []]);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/painel.test.ts`
Expected: FAIL (`montarPainel is not a function`).

- [ ] **Step 3: Implementar** os exports de `montar.ts` (o construtor `perfil` passa a usar `condicoesInformadas`/`textoTabagismo`, mesmo texto) e as funções de `painel.ts`.

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios && npx tsc --noEmit`
Expected: PASS (nenhum snapshot muda nesta task).

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios
git commit -m "feat(relatório): cartões, série da sistólica, prevenção e montarPainel

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Detalhe mais curto — sem seções vazias, sem repetição, termos e títulos corrigidos

**Files:**
- Modify: `src/core/relatorios/montar.ts`, `src/core/relatorios/especialidades.ts:66` (comentário "Relatório de hábitos e bem-estar (§88)"), `src/core/relatorios/__tests__/html.test.ts` (títulos literais passados nos testes)
- Test: `src/core/relatorios/__tests__/montar.test.ts`

**Interfaces:**
- Produces: `tituloRelatorio` com os nomes novos da navegação (pendência cruzada do plano 1; spec de navegação §6.4): cardio → `'Relatório de pressão, coração e diabetes'`; oncologico → `'Relatório de exames de prevenção'`; bemestar → `'Relatório de hábitos e bem-estar'`; geral e consulta sem mudança. Mesmo `SecaoRelatorio[]`, agora: (a) `montarPor` sempre filtra com `temRegistro` (foco e complemento; o comentário de D-025 sobre "no foco elas ficam" é substituído por uma referência a D-067); (b) seções `pa`, `agua` e `atividade` sem o bloco `barras` (a tabela dos mesmos dados fica; o gráfico está na página 1); a MRPA mantém as barras por dia (dado que a tabela de médias não traz); (c) `ROTULO_ORIGEM = { perfil: 'perfil', medida: 'medida', exame: 'exame', medicacao: 'remédios', digitado: 'digitado' }` na coluna "Origem" do PREVENT; `ROTULO_METODO_COMPOSICAO = { bioimpedancia: 'bioimpedância' }` (demais valores passam como vêm) na tabela de composição.

- [ ] **Step 1: Ajustar os testes (os que hoje fixam o comportamento antigo) e escrever os novos**

Trocar:
- `'programa sem dados → "Sem registros no período"'` por
  ```ts
  test('seções sem registro não entram', () => expect(chaves(s)).toEqual(['perfil', 'hist_familiar', 'tabagismo', 'rastreamentos_status', 'mama', 'colorretal', 'sintomas', 'documentos', 'pendencias']));
  ```
  e o `'ordem do §40…'` por `expect(chaves(s)).toEqual(SECOES_ONCOLOGICO.filter((c) => !['colo', 'pulmao', 'prostata'].includes(c)).concat('pendencias'))`.
- `'o complemento omite seções sem registro; o foco as mantém'` e `'sem dados de PA → texto padrão'` por
  ```ts
  test('sem medidas de PA, a seção some também do foco da cardiologia', () => { const d = dadosNeroTeste(); d.medidasPA = []; expect(chaves(montarConsulta(d, 'cardiologia', PERIODO_TESTE))).not.toContain('pa'); });
  test('"Nenhum sintoma…" não é seção vazia: fica', () => { const d = dadosNeroTeste(); d.sintomas = []; expect(montarConsulta(d, 'mastologia', PERIODO_TESTE).find((x) => x.chave === 'sintomas')!.blocos).toEqual([{ tipo: 'texto', texto: 'Nenhum sintoma de alerta registrado.' }]); });
  ```
- No teste de sono: `expect(chaves(montarBemEstar(d, PERIODO_TESTE))).not.toContain('sono')` no lugar do `SEM_REGISTROS`.
- Renomear `'PA traz média e barras; …'` para `'PA traz média; MRPA traz médias e chip acima da referência'`.

Novos:
```ts
test('títulos com os nomes novos da navegação', () => {
  expect(tituloRelatorio('cardio')).toBe('Relatório de pressão, coração e diabetes');
  expect(tituloRelatorio('oncologico')).toBe('Relatório de exames de prevenção');
  expect(tituloRelatorio('bemestar')).toBe('Relatório de hábitos e bem-estar');
});
test('sem barras repetindo tabela em PA, água e atividade', () => {
  const g = montarGeral(dadosNeroTeste(), PERIODO_TESTE);
  for (const c of ['pa', 'agua', 'atividade'] as const) expect(g.find((x) => x.chave === c)!.blocos.some((b) => b.tipo === 'barras')).toBe(false);
});
test('sem termos internos', () => {
  const t = textoDe(montarGeral(dadosNeroTeste(), PERIODO_TESTE));
  expect(t).not.toMatch(/"medicacao"|bioimpedancia/); expect(t).toContain('bioimpedância'); expect(t).toContain('remédios');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/montar.test.ts`
Expected: FAIL nos testes novos/ajustados.

- [ ] **Step 3: Implementar** as três mudanças e os títulos em `montar.ts`; nos testes de `html.test.ts`, trocar os títulos literais `'Relatório cardiovascular e metabólico'` e `'Relatório de Saúde & Hábitos'` por `tituloRelatorio('cardio')` e `tituloRelatorio('bemestar')`.

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios/__tests__/montar.test.ts src/core/relatorios/__tests__/painel.test.ts && npx tsc --noEmit`
Expected: PASS (o snapshot de `html.test.ts` é regravado na Task 7).

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios/montar.ts src/core/relatorios/especialidades.ts src/core/relatorios/__tests__/montar.test.ts src/core/relatorios/__tests__/html.test.ts
git commit -m "feat(relatório): detalhe sem seções vazias, sem barras repetidas, sem termos internos e com os nomes novos

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Gráfico SVG e painel no HTML (PDF A4 e página do celular)

**Files:**
- Create: `src/core/relatorios/grafico.ts`
- Modify: `src/core/relatorios/html.ts`
- Test: `src/core/relatorios/__tests__/grafico.test.ts`, `src/core/relatorios/__tests__/html.test.ts`, `src/core/relatorios/__tests__/__snapshots__/html.test.ts.snap` (regravado)

**Interfaces:**
- Consumes: `PainelRelatorio` e afins (Task 1); `SIMBOLO_DOSE`, `LEGENDA_DOSES` (Task 3); `montarPainel` (Task 5, nos testes).
- Produces:
  - `grafico.ts`: `svgSistolica(serie: PontoPressao[], o: { largura: number; altura: number; referencia?: number }): string` — `''` com menos de 2 pontos; `referencia` padrão `130`; uma `polyline` e um `circle` por ponto, **todos** em `#0f2d63`; linha tracejada horizontal com `data-ref="130"` e rótulo "130"; eixo Y de `min(110, menor − 10)` a `max(150, maior + 10)`; X espaçado pelo índice; datas do primeiro e do último ponto em `DD/MM`; `role="img"` e `aria-label="Pressão sistólica no período"`.
  - `html.ts`: `EntradaHtml` ganha `painel?: PainelRelatorio | null`; `export const RESSALVA_CURTA_PAINEL = 'Dados registrados pelo paciente e organizados pelo NERO; não substituem a avaliação médica.'`. Com `painel`, o `<header>` vira o cabeçalho do painel (marca, título, **nome, idade** em destaque, sexo, "Condições informadas: …", "Tabagismo: …", período, "Gerado em …", QR) dentro de `<section class="painel">`, seguido de: `<div class="atencao"><h2>Para atenção nesta consulta</h2><ul>` (só com itens); `<div class="cartoes">` com `.cartao` (título, valor grande + unidade, seta `↑`/`↓`, data e detalhe, `<span class="selo selo-{cor}">texto</span>`); `<div class="grafico"><h3>Pressão sistólica no período</h3>{svg}<p class="legenda">Linha tracejada: referência domiciliar de 130 mmHg.</p></div>`; `<div class="remedios"><h3>Remédios: últimas 2 semanas</h3>` uma linha por remédio (nome e dose, `<span class="dose dose-{estado}">{símbolo}</span>` por dose, `T de P`, selo; "se precisar": `usou N vezes`; sem dose prevista: `sem doses previstas no período`) + `LEGENDA_DOSES`; `<div class="prevencao"><h3>Prevenção</h3>` em uma linha (rótulo + selo, ou `situacao` sem cor quando `selo` é null) ou, com `prevencaoDetalhada`, uma `<ul>` com próxima data e mensagem; `<p class="painel-rodape">Detalhes nas páginas seguintes. {RESSALVA_CURTA_PAINEL}</p>`. A seção `.painel` tem `break-after: page; page-break-after: always`.
  - CSS: `<meta name="viewport" content="width=device-width, initial-scale=1">` no `<head>`; `.cartoes { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }`; `.fontes { font-size: 7.5pt }` e `.fontes ol { columns: 2; column-gap: 18px; }`; `@media screen and (max-width: 640px) { .cartoes { grid-template-columns: 1fr; } .fontes ol { columns: 1; } header { flex-direction: column; } body { padding: 16px; } }`; `.atencao` com borda e fundo vermelhos de `COR_CHIP.vermelho`; `.selo-*` com as cores de `COR_CHIP`.
  - Rodapé: "O código QR dá acesso a este **relatório** até {data}." (era "a este PDF").

- [ ] **Step 1: Escrever os testes que falham**

`grafico.test.ts`:
```ts
const serie = [{ data: '2026-09-01', pas: 128 }, { data: '2026-09-02', pas: 134 }, { data: '2026-09-03', pas: 186 }];
test('linha de 130 e um ponto por medida, todos da mesma cor', () => {
  const s = svgSistolica(serie, { largura: 520, altura: 150 });
  expect(s).toContain('data-ref="130"');
  expect(s.match(/<circle/g)).toHaveLength(3);
  expect([...s.matchAll(/<circle[^>]*fill="([^"]+)"/g)].map((m) => m[1])).toEqual(['#0f2d63', '#0f2d63', '#0f2d63']);
});
test('menos de 2 pontos: nada', () => expect(svgSistolica(serie.slice(0, 1), { largura: 520, altura: 150 })).toBe(''));
```
`html.test.ts` — `base` passa a levar `painel` conforme o tipo; testes novos:
```ts
const comPainel = (tipo: TipoRelatorio, d = dadosNeroTeste(), secoes = montarGeral(d, PERIODO_TESTE)) =>
  htmlRelatorio({ ...base, tipo, titulo: 'x', secoes, painel: montarPainel(d, { tipo, periodo: PERIODO_TESTE, selos: true }) });
test('painel antes do detalhe, fechando a página 1', () => {
  const h = comPainel('geral');
  expect(h.indexOf('class="painel"')).toBeLessThan(h.indexOf('<h2>Dados gerais</h2>'));
  expect(h).toContain('Detalhes nas páginas seguintes.'); expect(h).toContain(RESSALVA_CURTA_PAINEL);
  expect(h).toMatch(/\.painel\s*{[^}]*page-break-after:\s*always/);
});
test('caixa de atenção com os itens', () => { const h = comPainel('geral'); expect(h).toContain('<h2>Para atenção nesta consulta</h2>'); expect(h).toContain('FIT positivo: colonoscopia indicada'); });
test('selo neutro com cor', () => expect(comPainel('geral')).toContain('<span class="selo selo-amarelo">acima da meta</span>'));
test('2 colunas no A4, 1 no celular; fontes em 2 colunas', () => {
  const h = comPainel('geral');
  expect(h).toMatch(/\.cartoes\s*{[^}]*grid-template-columns:\s*1fr 1fr/);
  expect(h).toMatch(/@media screen and \(max-width: 640px\)\s*{[^@]*\.cartoes\s*{\s*grid-template-columns:\s*1fr;/);
  expect(h).toMatch(/\.fontes ol\s*{[^}]*columns:\s*2/);
});
test('gráfico e remédios no painel', () => { const h = comPainel('geral'); expect(h).toContain('data-ref="130"'); expect(h).toContain('10 de 14'); expect(h).toContain('usou 2 vezes'); expect(h).toContain(LEGENDA_DOSES); });
test('escapa o que o paciente digitou, também no painel', () => {
  const d = dadosNeroTeste(); d.perfil = { ...d.perfil, nome: 'A<b>' }; d.pendencias[0].descricao = '<img src=x onerror=alert(1)>';
  const h = comPainel('geral', d);
  expect(h).toContain('A&lt;b&gt;'); expect(h).not.toContain('<img src=x'); expect(h).not.toContain('<b>');
});
test('conta sem dados: sem caixa de atenção, sem cartões, sem gráfico', () => {
  const d = dadosNeroTeste();
  Object.assign(d, { medidasPA: [], sessoesMrpa: [], glicemias: [], examesCardio: [], riscos: [], peso: null, bemEstar: undefined, medicacoes: [], tomadas: [], pendencias: [], sintomas: [], avaliacoes: {} });
  const h = comPainel('geral', d, []);
  expect(h).not.toContain('Para atenção'); expect(h).not.toContain('class="cartao"'); expect(h).not.toContain('<svg');
});
```
E ampliar `'nenhuma frase diagnóstica'` para usar `comPainel('geral')` (mesmo corte em `class="fontes"`). Trocar no teste do QR `'até 25/09/2026'` por `'a este relatório até 25/09/2026'`.

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/grafico.test.ts src/core/relatorios/__tests__/html.test.ts`
Expected: FAIL (módulo `grafico` inexistente; HTML sem painel).

- [ ] **Step 3: Implementar** `grafico.ts` e o painel/CSS em `html.ts` (todo texto passa por `escapar`; o SVG é gerado por nós e entra cru).

- [ ] **Step 4: Regravar e revisar os snapshots**

Run: `npx jest src/core/relatorios/__tests__/html.test.ts -u && git diff --stat src/core/relatorios/__tests__/__snapshots__/`
Depois `git diff src/core/relatorios/__tests__/__snapshots__/html.test.ts.snap` e conferir, mudança por mudança: só entram o CSS novo, o `viewport`, a frase do QR e (nos snapshots que passam `painel`) o painel; das seções saem só as vazias e as barras de PA/água/atividade; "medicacao"/"bioimpedancia" viraram "remédios"/"bioimpedância"; as três ressalvas literais continuam idênticas. Qualquer outra diferença é bug.

- [ ] **Step 5: Rodar tudo**

Run: `npx jest src/core/relatorios && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/relatorios
git commit -m "feat(relatório): página 1 em painel no PDF, com gráfico da sistólica e CSS para A4 e celular

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Prévia no app com o painel

**Files:**
- Create: `src/modules/minha-saude/componentes/PainelRelatorioView.tsx`
- Modify: `src/core/relatorios/useRelatorio.ts`, `app/(app)/(tabs)/minha-saude/relatorios/previa.tsx`, `src/core/relatorios/__tests__/telaPreviaPdf.test.tsx` (mock de `useRelatorio` ganha `painel: null, geradoEm: '2026-09-18T10:30:00'`)
- Test: `src/modules/minha-saude/componentes/__tests__/PainelRelatorioView.test.tsx`

**Interfaces:**
- Consumes: `montarPainel`, `escopoDoRelatorio` (Tasks 4–5); `svgSistolica` (Task 7); `SIMBOLO_DOSE`, `LEGENDA_DOSES` (Task 3); `StatusBadge` (`@ui/index`, `nivel={selo.cor}`).
- Produces:
  - `useRelatorio(p)` devolve também `painel: PainelRelatorio | null` e `geradoEm: string` (`dados.geradoEm`); `html(qrSvg?, validadeQr?)` passa `painel` e usa `geradoEm` em vez de `new Date()`.
  - `PainelRelatorioView({ painel }: { painel: PainelRelatorio }): JSX.Element` — 1 coluna: caixa "Para atenção nesta consulta" (fundo `Alerta.vermelho`) só com itens; um cartão por linha (título, valor grande + unidade + seta, data · detalhe, `StatusBadge` quando há selo); gráfico com `<SvgXml xml={svgSistolica(serie, { largura, altura: 140 })} />`, `largura` medida por `onLayout`; "Remédios: últimas 2 semanas" com símbolos, "T de P", selo, "usou N vezes", legenda; "Prevenção" (rótulo + selo ou situação). Na `previa.tsx`, renderizado logo depois das ações e antes das seções.

- [ ] **Step 1: Escrever o teste que falha**

```tsx
const painel = montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE, selos: true });
const texto = (a: ReactTestRenderer) => JSON.stringify(a.toJSON());
test('mostra atenção, cartões com selo, adesão e prevenção', () => {
  const t = texto(create(<PainelRelatorioView painel={painel} />));
  for (const s of ['Para atenção nesta consulta', 'FIT positivo: colonoscopia indicada', 'Pressão arterial (MRPA)', 'acima da meta', 'Remédios: últimas 2 semanas', '10 de 14', 'usou 2 vezes', 'Prevenção', 'em dia']) expect(t).toContain(s);
});
test('sem itens de atenção, sem a caixa', () => expect(texto(create(<PainelRelatorioView painel={{ ...painel, atencao: [] }} />))).not.toContain('Para atenção'));
```
(`StatusBadge` pode deixar o texto em caixa alta por estilo; o `label` continua sendo o texto do selo.)

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/modules/minha-saude/componentes/__tests__/PainelRelatorioView.test.tsx`
Expected: FAIL (componente inexistente).

- [ ] **Step 3: Implementar** o componente, o `useRelatorio` (painel com `montarPainel(dados, { tipo, especialidade, apenas, periodo })`) e a inserção na `previa.tsx`.

- [ ] **Step 4: Rodar**

Run: `npx jest src/modules/minha-saude src/core/relatorios && npx tsc --noEmit`
Expected: PASS, incluindo `telaPreviaPdf.test.tsx`.

- [ ] **Step 5: Conferir no simulador**

Abrir Minha Saúde → Relatórios → "Resumo completo": o painel aparece em 1 coluna antes das seções, o gráfico ocupa a largura e nada é cortado num iPhone SE.

- [ ] **Step 6: Commit**

```bash
git add src/modules/minha-saude/componentes src/core/relatorios "app/(app)/(tabs)/minha-saude/relatorios/previa.tsx"
git commit -m "feat(relatório): painel na prévia do app, em uma coluna

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: QR para a página `/r/` — JSON ao lado do PDF, link sem URL no servidor

**Files:**
- Create: `src/core/relatorios/linkQr.ts`, `supabase/migrations/0024_relatorios_json.sql` (use o número seguinte ao último em `supabase/migrations/`; depois dos planos 1 e 2 deve ser `0024`), `supabase/tests/relatorios_json.test.sql`
- Modify: `src/core/relatorios/compartilharQr.ts`, `app/(app)/(tabs)/minha-saude/relatorios/previa.tsx` (`mostrarQr`), `src/modules/minha-saude/conteudo/relatorios.ts` (`TEXTO_QR`)
- Test: `src/core/relatorios/__tests__/linkQr.test.ts`, `src/core/relatorios/__tests__/compartilharQr.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // linkQr.ts
  export const ENDERECO_PAGINA_QR = 'https://nerosaude.com.br/r/';
  export interface ConteudoQr { versao: 1; titulo: string; geradoEm: string; expiraEm: string; html: string; pdfUrl: string }
  export function caminhoJson(caminhoPdf: string): string            // 'u/x.pdf' → 'u/x.json'
  export function linkDaPagina(urlAssinadaJson: string): string      // → `${ENDERECO_PAGINA_QR}#c=${caminho}&t=${token}`; lança Error se a URL não for '/storage/v1/object/sign/relatorios/...?token=...'
  // compartilharQr.ts
  export async function criarCompartilhamento(userId: string, tipo: TipoRelatorio, especialidade: Especialidade | null, conteudo: { titulo: string; geradoEm: string; htmlWeb: string; htmlPdf: (qrSvg: string, validade: string) => string }): Promise<Compartilhamento & { url: string; qrSvg: string }>   // url = link da página
  ```
  **Decisão (spec §9 deixa o formato ao construtor):** o token leva **uma** URL assinada, a do JSON; o JSON leva a URL assinada do PDF (`pdfUrl`). Assim o QR fica do mesmo tamanho de hoje (96 px no PDF continua legível) e a segurança é a mesma: as duas URLs valem 7 dias e revogar apaga os dois arquivos.
  Ordem em `criarCompartilhamento` (substitui as duas passagens do PDF): (1) `caminho = ${userId}/${uuid}.pdf`; sobe `caminhoJson(caminho)` com `JSON.stringify({ versao: 1, preparando: true })`, `contentType: 'application/json'`; (2) `createSignedUrl(json, VALIDADE_QR_SEGUNDOS)` → `link = linkDaPagina(...)`; (3) `qrSvg(link, 96)` → `gerarPdf(htmlPdf(svg, dataBr(expiraEm)))` → sobe o PDF; (4) `createSignedUrl(pdf, VALIDADE_QR_SEGUNDOS)`; (5) sobe o JSON final `ConteudoQr` com `upsert: true` (`html = htmlWeb`); (6) `insert` em `compartilhamentos` (como hoje, `caminho` = PDF); devolve `url: link`, `qrSvg: await qrSvg(link, 240)`.
  `revogar` e `limparExpirados` removem `[caminho, caminhoJson(caminho)]`.
  Migração: `update storage.buckets set allowed_mime_types = array['application/pdf','application/json'] where id = 'relatorios';` com comentário citando D-067 e a 0020.
  `TEXTO_QR`: `confirmacao: 'Para o médico abrir pelo celular dele, o relatório fica na nuvem por 7 dias, em um endereço privado que só quem tem o código consegue abrir. Você pode encerrar antes, a qualquer momento.'`; `aberto: 'O médico aponta a câmera do celular, vê o relatório na tela dele e pode baixar o PDF.'`; `nota` igual.
  `previa.tsx`: `criarCompartilhamento(uid, tipo, esp, { titulo: rel.titulo, geradoEm: rel.geradoEm, htmlWeb: rel.html(), htmlPdf: (svg, validade) => rel.html(svg, validade) })`.

- [ ] **Step 1: Escrever os testes que falham**

`linkQr.test.ts`:
```ts
const UID = '00000000-0000-0000-0000-00000000003a';
test('link da página leva caminho e token no fragmento', () =>
  expect(linkDaPagina(`https://abc.supabase.co/storage/v1/object/sign/relatorios/${UID}/mabc-1x2y.json?token=eyJ.a.b`))
    .toBe(`https://nerosaude.com.br/r/#c=${UID}/mabc-1x2y.json&t=eyJ.a.b`));
test('recusa URL de outro bucket', () => expect(() => linkDaPagina('https://abc.supabase.co/storage/v1/object/sign/laudos/x.json?token=t')).toThrow());
test('caminhoJson', () => expect(caminhoJson(`${UID}/x.pdf`)).toBe(`${UID}/x.json`));
```
`compartilharQr.test.ts` — `jest.mock('@core/supabase/client')` com `storage.from('relatorios')` gravando chamadas (`upload`, `createSignedUrl` devolvendo `https://abc.supabase.co/storage/v1/object/sign/relatorios/<caminho>?token=T-<n>`, `remove`) e `from('compartilhamentos')` (`insert…single` → `{ id: 'c1', created_at: '...' }`; `select…maybeSingle` → `{ caminho: 'u/x.pdf' }`; `update` ok); `jest.mock('../gerarPdf')` e `jest.mock('../qr', () => ({ qrSvg: async (t: string) => `<svg data-link="${t}"/>` }))`:
```ts
test('ordem: JSON provisório → link → PDF com o QR do link → JSON final com pdfUrl', async () => {
  const c = await criarCompartilhamento('u', 'geral', null, { titulo: 'R', geradoEm: '2026-09-18T10:30:00', htmlWeb: '<html>web</html>', htmlPdf: (svg) => `<html>${svg}</html>` });
  expect(chamadas.map((x) => x.op)).toEqual(['upload:json', 'sign:json', 'upload:pdf', 'sign:pdf', 'upload:json', 'insert']);
  expect(mockGerarPdf).toHaveBeenCalledWith(expect.stringContaining('data-link="https://nerosaude.com.br/r/#c=u/'));
  const final = JSON.parse(chamadas[4].corpo);
  expect(final).toMatchObject({ versao: 1, titulo: 'R', html: '<html>web</html>', pdfUrl: expect.stringContaining('.pdf?token=') });
  expect(chamadas[4].opcoes).toMatchObject({ contentType: 'application/json', upsert: true });
  expect(c.url.startsWith('https://nerosaude.com.br/r/#c=u/')).toBe(true);
});
test('revogar apaga PDF e JSON', async () => { await revogar('u', 'c1'); expect(mockRemove).toHaveBeenCalledWith(['u/x.pdf', 'u/x.json']); });
```
`supabase/tests/relatorios_json.test.sql`:
```sql
begin;
select plan(1);
select ok((select 'application/json' = any(allowed_mime_types) and 'application/pdf' = any(allowed_mime_types) from storage.buckets where id = 'relatorios'), 'bucket relatorios aceita o JSON da página do QR, além do PDF');
select * from finish();
rollback;
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/linkQr.test.ts src/core/relatorios/__tests__/compartilharQr.test.ts && npm run db:test`
Expected: FAIL (módulo `linkQr` inexistente; ordem antiga; pgTAP falha no `ok`).

- [ ] **Step 3: Implementar** `linkQr.ts`, a migração, o novo `criarCompartilhamento`/`revogar`/`limparExpirados`, `TEXTO_QR` e a chamada na `previa.tsx`.

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios src/modules/minha-saude && npx tsc --noEmit && npm run db:test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/relatorios src/modules/minha-saude/conteudo/relatorios.ts "app/(app)/(tabs)/minha-saude/relatorios/previa.tsx" supabase/migrations supabase/tests/relatorios_json.test.sql
git commit -m "feat(relatório): QR abre a página do relatório; JSON ao lado do PDF, revogação apaga os dois

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Página `nerosaude.com.br/r/`

**Files:**
- Create: `scripts/site/r/index.html`, `scripts/site/r/relatorio.js`, `scripts/site/r/__tests__/relatorio.test.js`
- Modify: `scripts/gerar-site.mjs`, `site/README.md` (linha `r/index.html` → `https://nerosaude.com.br/r/` na tabela e um parágrafo "Página do QR"); gerado: `site/r/index.html`, `site/r/relatorio.js`

**Interfaces:**
- Consumes: formato do link e de `ConteudoQr` (Task 9).
- Produces (`relatorio.js`, ES module, sem dependências):
  ```js
  export function lerHash(hash)   // '#c=<uuid>/<arquivo>.json&t=<jwt>' → { caminho, token } | null
                                  // caminho: /^[0-9a-f-]{36}\/[a-z0-9-]+\.json$/ ; token: /^[A-Za-z0-9_.-]+$/
  export function urlDoJson(supabaseUrl, { caminho, token })   // `${supabaseUrl}/storage/v1/object/sign/relatorios/${caminho}?token=${token}`
  export function estadoDaResposta(status, corpo, supabaseUrl) // 'ok' só com status 200, corpo.versao === 1, typeof corpo.html === 'string' e corpo.pdfUrl começando por `${supabaseUrl}/storage/v1/object/sign/relatorios/`; senão 'indisponivel'
  export function iniciar(doc, win, supabaseUrl)               // liga a página; sem teste unitário (conferida no navegador)
  ```
  `iniciar`: lê `win.location.hash`; sem `lerHash` válido → indisponível **sem** `fetch`; senão `fetch(urlDoJson(...), { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })`; erro de rede também → indisponível. Com `'ok'`: põe `corpo.html` (com `<base target="_blank">` inserido após `<head>`) em `iframe.srcdoc` de um `<iframe sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" title="Relatório">` — **sem** `allow-scripts` — e ajusta a altura pelo `scrollHeight` no `load`; mostra o botão `<a id="baixar" href=pdfUrl target="_blank" rel="noopener">Baixar PDF</a>`.
  Textos: carregando `Abrindo o relatório…`; indisponível `Este relatório não está mais disponível.` + `O link vale por 7 dias e pode ser encerrado pelo paciente a qualquer momento.`
  `index.html`: `lang="pt-BR"`, `viewport`, `<meta name="robots" content="noindex, nofollow">`, `<meta name="referrer" content="no-referrer">`, CSP por meta `default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src __SUPABASE_URL__; img-src data:; base-uri 'none'; form-action 'none'`; nenhum script inline (o CSP o bloquearia): só `<script type="module" src="relatorio.js" data-supabase="__SUPABASE_URL__"></script>`, e no fim de `relatorio.js` `const tag = typeof document !== 'undefined' && document.querySelector('script[data-supabase]'); if (tag) iniciar(document, window, tag.dataset.supabase);` (no Jest não há a tag, então nada roda) (`document.currentScript` é nulo em módulo). Visual na paleta do site (`--marinho:#0f2d63`), sem fontes externas.
  `gerar-site.mjs`: `lerSupabaseUrl()` = `process.env.EXPO_PUBLIC_SUPABASE_URL` ou a linha `EXPO_PUBLIC_SUPABASE_URL=` de `.env.local` e depois `.env`; aborta (`process.exit(1)`) se faltar ou se não casar `/^https:\/\/[a-z0-9]+\.supabase\.co$/` (impede publicar com o Supabase local); copia `scripts/site/r/index.html` e `relatorio.js` para `site/r/` trocando `__SUPABASE_URL__`; aborta se sobrar `__SUPABASE_URL__`; na publicação copia também `site/r`; mensagem do commit do site: `Atualiza o site (política, termos e página do QR)`.

- [ ] **Step 1: Escrever os testes que falham**

`scripts/site/r/__tests__/relatorio.test.js`:
```js
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { estadoDaResposta, lerHash, urlDoJson } from '../relatorio';
const UID = '00000000-0000-0000-0000-00000000003a';
const SB = 'https://abc.supabase.co';
test('lê o link gerado pelo app (mesmo literal de linkQr.test.ts)', () =>
  expect(lerHash(`#c=${UID}/mabc-1x2y.json&t=eyJ.a.b`)).toEqual({ caminho: `${UID}/mabc-1x2y.json`, token: 'eyJ.a.b' }));
test.each([['#c=../x.json&t=a'], [`#c=${UID}/x.pdf&t=a`], [`#c=${UID}/x.json`], ['#c=https://mal.com/x.json&t=a'], [''], [`#c=${UID}/x.json&t=a b`]])('recusa %s', (h) => expect(lerHash(h)).toBeNull());
test('busca só no Supabase do projeto', () => expect(urlDoJson(SB, { caminho: `${UID}/x.json`, token: 't' })).toBe(`${SB}/storage/v1/object/sign/relatorios/${UID}/x.json?token=t`));
test('revogado (404) ou vencido (400): indisponível', () => { expect(estadoDaResposta(404, null, SB)).toBe('indisponivel'); expect(estadoDaResposta(400, { error: 'InvalidJWT' }, SB)).toBe('indisponivel'); });
test('JSON ainda preparando ou com pdfUrl de fora: indisponível', () => {
  expect(estadoDaResposta(200, { versao: 1, preparando: true }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: 'https://mal.com/x.pdf' }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: `${SB}/storage/v1/object/sign/relatorios/${UID}/x.pdf?token=t` }, SB)).toBe('ok');
});
test('página sem rastros: noindex, sem scripts de fora, sem armazenamento, iframe sem scripts', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const js = readFileSync(join(__dirname, '..', 'relatorio.js'), 'utf8');
  expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  expect(html).not.toMatch(/<script[^>]+src="https?:/);
  expect(js).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  expect(js).toContain('sandbox');
  expect(js).not.toContain('allow-scripts');
  expect(js).toContain('Este relatório não está mais disponível.');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest scripts/site/r`
Expected: FAIL (arquivos inexistentes).

- [ ] **Step 3: Implementar** `index.html`, `relatorio.js` e as mudanças em `gerar-site.mjs` e `site/README.md`.

- [ ] **Step 4: Rodar testes e gerar o site**

Run: `npx jest scripts/site/r && npm run site && grep -c "supabase.co" site/r/index.html && ! grep -r "__SUPABASE_URL__" site/r`
Expected: PASS; `site/r/index.html` e `site/r/relatorio.js` gerados, com a URL do projeto e sem o marcador.

- [ ] **Step 5: Conferir no navegador (local)**

Com um compartilhamento real criado no simulador (Task 9), servir `site/` (`npx serve site` ou `python3 -m http.server -d site 8080`) e abrir `http://localhost:8080/r/#c=…&t=…` (copiar do link mostrado no QR). Conferir: relatório inteiro em 1 coluna a 390 px de largura, fontes com link abrindo em aba nova, "Baixar PDF" abre o PDF, console sem erro de CSP; "Encerrar compartilhamento" no app → recarregar → "Este relatório não está mais disponível." Conferir CORS do Storage: `curl -sI -H "Origin: https://nerosaude.com.br" "<url assinada do JSON>" | grep -i access-control-allow-origin` deve responder `*` ou a origem. (Para o teste local, `connect-src` do CSP aceita o Supabase; a origem `localhost` também recebe `*`.)

- [ ] **Step 6: Commit**

```bash
git add scripts/site scripts/gerar-site.mjs site/r site/README.md
git commit -m "feat(site): página /r/ do relatório aberto pelo QR, com Baixar PDF

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Política de privacidade, D-067 e checklist de publicação

**Files:**
- Modify: `docs/nero/publicacao/politica-de-privacidade.md` (linhas ~49 e ~73), `docs/nero/02-DECISOES.md` (D-067 depois da D-066, antes de `## Decisões clínicas`), `docs/nero/checklists/publicacao.md`, gerados `site/privacidade/index.html`

**Interfaces:** nenhuma de código.

- [ ] **Step 1: Política** — linha "Relatórios" (§3): `PDFs gerados a partir dos seus registros. Se você escolher compartilhar por QR Code, o PDF e o conteúdo do relatório são guardados em área privada e um link temporário é criado (ver seção 6).` Item "Compartilhamento por QR Code" (§6): `**Compartilhamento por QR Code:** quando você gera um relatório com QR, o PDF e o conteúdo daquele relatório ficam guardados em área privada por **7 dias**. O QR abre a página https://nerosaude.com.br/r/, que mostra esse relatório adaptado à tela de quem lê e tem o botão para baixar o PDF. O endereço de acesso fica na parte do link depois do "#", que o navegador não envia ao servidor do site: a página busca o relatório direto no nosso armazenamento, não pede login, não guarda nada no navegador, não usa scripts de terceiros e não aparece em buscadores. Quem tiver o QR (por exemplo, seu médico) consegue abrir aquele relatório nesse período. Você pode encerrar antes do prazo na tela do relatório; encerrado ou vencido, a página informa que o relatório não está mais disponível.` Atualizar a data da política, se houver linha de data.

- [ ] **Step 2: D-067** em `02-DECISOES.md`: título `### D-067 — Relatório novo: painel na página 1, prévia no celular e página do QR — 23/11/2026`; resumo das decisões da spec §8 (ordem e limite 5 de "Para atenção"; blocos por tipo; `apenas` vale para o painel; adesão 2/4 semanas a partir da geração; < 80 % como gatilho; só a sistólica com a linha de 130; seções vazias somem também do foco, revendo D-025; QR → JSON + URL assinada + site estático, **token com a URL do JSON e o JSON com a do PDF**; página vai ao ar antes do build); "Selos: proposta §6.5 em `src/core/relatorios/selos.ts`, travada por `VALIDACAO_SELOS` até a validação da Dra. Denise"; pendências entram na atenção de todo tipo (§66); arquivos principais.

- [ ] **Step 3: Checklist** — em `publicacao.md`, nova seção `## Relatório novo (D-067)` com: `- [ ] Dra. Denise validou a folha docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md e VALIDACAO_SELOS está preenchido`; `- [ ] npm run site:publicar feito ANTES do build/OTA; https://nerosaude.com.br/r/ responde`; `- [ ] QR do PDF impresso lido por câmera de iPhone e de Android`; `- [ ] QR revogado mostra "Este relatório não está mais disponível."`; `- [ ] "Resumo completo" da conta de teste com no máximo 4 páginas`; `- [ ] Migração 0024 aplicada no Supabase remoto`.

- [ ] **Step 4: Gerar o site e verificar**

Run: `npm run site && grep -c "nerosaude.com.br/r/" site/privacidade/index.html`
Expected: `1` ou mais.

- [ ] **Step 5: Commit**

```bash
git add docs/nero/publicacao/politica-de-privacidade.md docs/nero/02-DECISOES.md docs/nero/checklists/publicacao.md site/privacidade
git commit -m "docs: política descreve a página do QR; D-067; checklist do relatório novo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Folha de revisão para a Dra. Denise

**Files:**
- Create: `docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md`
- Test: `src/core/relatorios/__tests__/folhaSelos.test.ts`

**Interfaces:**
- Consumes: todas as funções de `selos.ts`, `LIMIAR_ADESAO`, `RESSALVA_CURTA_PAINEL`, `LEGENDA_DOSES`.

Conteúdo da folha (formato das outras folhas em `docs/nero/revisao/`): cabeçalho "Para a Dra. Denise validar. Nada vai ao ar sem esta validação (spec §6.5)."; uma tabela por origem (MRPA, glicemia capilar, risco PREVENT, IMC, rastreamentos, **adesão aos remédios — proposta nova, fora da tabela §6.5 da spec**), com colunas `Situação no app | Cor proposta | Texto do selo | De acordo? | Correção`; os gatilhos e textos de "Para atenção nesta consulta" (Task 4) com os exemplos da fixture; a ressalva curta do painel e a legenda das doses; as perguntas em aberto: (1) MRPA usa "na meta"/"acima da meta" para uma **referência** domiciliar (130/80), não uma meta individual — manter ou trocar por "dentro/acima da referência"? (2) amarelo para "indicado" e "próximo de iniciar"; (3) vermelho para IMC ≥ 30 com o texto "obesidade grau I/II/III"; (4) limiar de 80 % e só verde/amarelo para adesão; (5) "hipoglicemia registrada" para qualquer medida < 70 mg/dL; (6) o status `cancelado` da §6.5 não existe no app hoje — fica sem uso. Rodapé: "Como registrar a validação" → preencher `VALIDACAO_SELOS` em `src/core/relatorios/selos.ts` com nome e data; correções de cor/texto só nesse arquivo.

- [ ] **Step 1: Escrever o teste que falha**

```ts
import { readFileSync } from 'node:fs';
const folha = readFileSync('docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md', 'utf8');
test('a folha traz todo texto de selo que o app pode mostrar', () => {
  const textos = [seloMrpa(true), seloMrpa(false), seloGlicemia({ abaixoDaMeta: 0, acimaDaMeta: 0, episodiosBaixos: 0 }), seloGlicemia({ abaixoDaMeta: 1, acimaDaMeta: 0, episodiosBaixos: 0 }), seloGlicemia({ abaixoDaMeta: 1, acimaDaMeta: 0, episodiosBaixos: 1 }),
    ...(['baixo', 'intermediario', 'alto'] as const).map(seloRisco),
    ...(['referencia', 'baixo_peso', 'sobrepeso', 'obesidade_1', 'obesidade_2', 'obesidade_3'] as const).map(seloImc),
    ...(['indicado', 'proximo_de_iniciar', 'nao_indicado_no_momento', 'avaliacao_individualizada', 'acompanhamento_medico', 'em_dia', 'exame_proximo', 'exame_atrasado'] as const).map((s) => seloRastreamento(s, false)), seloRastreamento('em_dia', true)].map((s) => s.texto);
  for (const t of textos) expect(folha).toContain(`"${t}"`);
  for (const t of [RESSALVA_CURTA_PAINEL, LEGENDA_DOSES, 'Média da MRPA acima da referência domiciliar (130/80 mmHg)', 'fora da meta no período', 'doses marcadas como tomadas', `${LIMIAR_ADESAO} %`]) expect(folha).toContain(t);
});
test('enquanto não validado, a folha continua pendente', () => {
  if (VALIDACAO_SELOS.validadoEm == null) expect(folha).toContain('Nada vai ao ar sem esta validação');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest src/core/relatorios/__tests__/folhaSelos.test.ts`
Expected: FAIL (`ENOENT`).

- [ ] **Step 3: Escrever a folha** com o conteúdo acima (textos entre aspas retas, como o teste espera).

- [ ] **Step 4: Rodar**

Run: `npx jest src/core/relatorios && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md src/core/relatorios/__tests__/folhaSelos.test.ts
git commit -m "docs(revisão): folha dos selos do relatório para a Dra. Denise

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Liberação — só depois da validação da Dra. Denise

**Files:**
- Modify: `src/core/relatorios/selos.ts` (`VALIDACAO_SELOS` e, se houver, as correções dela), `docs/nero/revisao/2026-11-23-revisao-selos-relatorio.md` (respostas), `docs/nero/02-DECISOES.md` (D-067: "Validado pela Dra. Denise em …"), `docs/nero/checklists/publicacao.md` (marcar itens)

**Pré-condição (trava):** a folha da Task 12 voltou com a validação. Sem ela, **parar aqui**: o código pode ficar no branch (em build de produção os selos não aparecem, porque `selosLiberados()` é falso fora do modo dev), mas não se publica site nem build com o relatório novo.

- [ ] **Step 1: Aplicar as correções da Dra. Denise** só em `selos.ts` (e nos testes de `selos.test.ts`/`painel.test.ts` que fixam as cores e textos alterados) e preencher `VALIDACAO_SELOS = { validadoPor: 'Dra. Denise …', validadoEm: 'AAAA-MM-DD' }`. Registrar as respostas na folha.

- [ ] **Step 2: Rodar tudo**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 3: Medir as páginas** — no simulador iOS, com a conta de teste, gerar o "Resumo completo" (90 dias) e abrir o PDF: **no máximo 4 páginas**; página 1 só com o painel; QR legível pela câmera do celular a partir da tela e do papel. Se passar de 4, reduzir no CSS (`font-size`, margens de `@page`), nunca cortando seção com registro.

- [ ] **Step 4: Aplicar a migração no remoto** — `npx supabase db push` (projeto remoto) e conferir no painel que o bucket `relatorios` aceita `application/json`.

- [ ] **Step 5: Publicar a página `/r/` antes do build**

Run: `npm run site:publicar`
Expected: "Publicado." Depois abrir `https://nerosaude.com.br/r/` (sem `#`): mostra "Este relatório não está mais disponível."; com um QR real criado num build de desenvolvimento apontando para o remoto: relatório completo, "Baixar PDF" funcionando; ver no DevTools que o pedido ao `nerosaude.com.br` não leva o fragmento.

- [ ] **Step 6: Commit e liberar o build**

```bash
git add src/core/relatorios/selos.ts src/core/relatorios/__tests__ docs/nero
git commit -m "chore(relatório): selos validados pela Dra. Denise; liberação do relatório novo

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Marcar os itens de `## Relatório novo (D-067)` em `publicacao.md`. Só então seguir com o build/OTA do lote (navegação + remédio tomado + relatório).
