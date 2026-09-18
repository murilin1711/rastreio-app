# NERO Fase 3 — Minha Saúde (transversal) + Relatórios — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Central "Minha Saúde" com exames de todos os módulos, documentos anexados, linha do tempo geral, relatórios em PDF com QR para o médico, "Preparar minha consulta" e central de lembretes com preferências e consultas.

**Architecture:** Núcleo puro em `src/core/relatorios/` (montagem de seções por tipo/especialidade + HTML + QR), camada Expo/Supabase fina (`gerarPdf`, `compartilharQr`, `documentos/storage`), reuso dos serviços existentes (`montarContexto`, `src/core/cardio/*`). Telas em `app/(app)/minha-saude/**`.

**Tech Stack:** Expo SDK 57 · expo-print · expo-sharing · expo-document-picker · expo-image-picker (já instalado) · expo-image-manipulator · expo-web-browser · Supabase Storage (buckets `laudos`, `relatorios`) · Jest · pgTAP.

**Spec:** `docs/superpowers/specs/2026-09-17-nero-fase3-minha-saude-relatorios-design.md` · Decisões D-007–D-010 (`docs/nero/02-DECISOES.md`).

## Global Constraints

- Dados só saem do aparelho ao pedir o QR (D-007). Relatório organiza, não interpreta: ressalvas literais do §26 e §40 em todo PDF; nenhuma frase diagnóstica.
- Preferências desligam notificações do celular, nunca itens da Home/telas (D-010).
- Português com acentos; rodapé de commit `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` + `Claude-Session: https://claude.ai/code/session_017fpxyXrMg4YipMK24dgtDY`.
- Antes das telas, reler `docs/nero/03-DESIGN.md` (skill `frontend-design`).
- Branch `nero-fase3-minha-saude` a partir de `desenvolvimento-2`. Nuvem (`db push` 0011) só na Task 8, com a senha fornecida na hora.
- `npx tsc --noEmit && npx jest --ci` verdes antes de cada commit; rotas novas → `npm run rotas`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/0011_minha_saude.sql` · `supabase/tests/minha_saude.test.sql` | documentos, compartilhamentos + bucket relatorios, consultas, preferências, origem consulta |
| `src/core/documentos/{tipos,mapeamento,storage,repositorio,useDocumentos}.ts` | anexos |
| `src/core/relatorios/{tipos,especialidades,montar,html,qr,carregar,gerarPdf,compartilharQr}.ts` | relatórios |
| `src/core/lembretes/{central,preferencias,consultas,useLembretes,useConsultas}.ts` | central de lembretes |
| `src/core/linhaDoTempo/geral.ts` | linha do tempo geral |
| `src/modules/minha-saude/conteudo/relatorios.ts` | textos |
| `src/modules/minha-saude/componentes/{SecaoRelatorioView,LinhaDocumento,LinhaLembrete}.tsx` | componentes |
| `app/(app)/minha-saude/**` | rotas novas (exames, documentos, linha-do-tempo, relatorios, consulta, lembretes) |
| `app/(app)/coracao/mrpa/relatorio.tsx` · `coracao/glicemia/relatorio.tsx` · `rastreando/index.tsx` · `coracao/exames/[id].tsx` · `rastreando/[programa]/exames.tsx` | botões de PDF e anexos |
| `src/core/rastreando/lembretes.ts` · `src/core/cardio/lembretesCardio.ts` | respeitar preferências |
| `src/modules/home/montarItensHoje.ts` · `app/(app)/index.tsx` | consulta amanhã/hoje |

---

## Task 1: Branch, migração 0011, dependências, pgTAP

- [ ] `git checkout desenvolvimento-2 && git pull && git checkout -b nero-fase3-minha-saude`
- [ ] `npx expo install expo-print expo-sharing expo-document-picker expo-image-manipulator expo-web-browser`
- [ ] Migração `0011_minha_saude.sql` exatamente como a spec §4 (documentos, bucket `relatorios` + 3 políticas, compartilhamentos, consultas, `perfil_saude.preferencias_lembretes`, check de `lembretes.origem_tipo` com `consulta`), RLS dono para as 3 tabelas.
- [ ] `supabase/tests/minha_saude.test.sql` (plan 5): A não vê documentos de B; A não insere consulta em nome de B; A não vê compartilhamentos de B; `insert into lembretes (origem_tipo='consulta')` vive; `storage.objects` insert em `relatorios/<B>/x.pdf` como A lança 42501.
- [ ] `supabase db reset && supabase test db` (24) · `npm run db:types` · `PerfilSaude.preferenciasLembretes: PreferenciasLembretes` + mapeamento + fixtures dos testes · `npx tsc --noEmit && npx jest --ci` · commit `feat(minha-saude): migração 0011 (documentos, compartilhamentos, consultas, preferências) + dependências`.

## Task 2: Documentos (núcleo + telas + anexos nos detalhes)

- [ ] `src/core/documentos/tipos.ts`: `TipoDocumento`, `Documento { id, exameId, tipo, nome, caminho, mime, tamanho, dataDocumento, observacao, criadoEm }`, `ROTULO_TIPO_DOCUMENTO`.
- [ ] `mapeamento.ts` (puro, com teste): linha ↔ domínio; `nomeArquivo(userId, ext)` → `<uid>/<uuid>.<ext>`; `extensaoDe(mime)`.
- [ ] `storage.ts`: `escolherImagem(origem: 'camera'|'galeria')` (permissões; `ImagePicker.launchCameraAsync/launchImageLibraryAsync`, `quality: 0.8`) · `escolherPdf()` (`DocumentPicker.getDocumentAsync({ type: 'application/pdf' })`) · `comprimirImagem(uri)` (`ImageManipulator.manipulateAsync(uri, [{ resize: { width: 2000 } }], { compress: 0.8, format: JPEG })`, só se largura > 2000) · `enviar(userId, { uri, mime, nome }) → { caminho, tamanho }` (limite 10 MB → erro "Arquivo maior que 10 MB"; upload via `fetch(uri).blob()` → `supabase.storage.from('laudos').upload`) · `urlAssinada(caminho, 3600)` · `apagar(caminho)`.
- [ ] `repositorio.ts`: `listar(userId, { tipo?, exameId? })`, `inserir`, `excluir(id)` (apaga Storage + linha). `useDocumentos(filtro)`.
- [ ] Telas: `minha-saude/documentos/index.tsx` (filtro por tipo, lista `LinhaDocumento` com ícone por mime, nome, data, exame vinculado; FAB/botão "Adicionar documento" → `ActionSheet`/`Alert` com Câmera · Galeria · Arquivo PDF → formulário tipo/nome/data/observação/exame (Select com os últimos 20 exames de qualquer módulo) → salvar) · `documentos/[id].tsx` (imagem `Image` com URL assinada; PDF → `WebBrowser.openBrowserAsync(url)`; apagar com confirmação).
- [ ] Anexos nos detalhes: `coracao/exames/[id].tsx` e `rastreando/[programa]/exames.tsx` (lista de exames) ganham bloco "Documentos" (miniaturas/nomes + "Anexar" → abre o formulário com `exameId` pré-preenchido).
- [ ] `npm run rotas`, checks, commit `feat(minha-saude): Meus Documentos — anexos de laudos e imagens (D-008)`.

## Task 3: Relatórios — núcleo puro (TDD)

- [ ] `src/core/relatorios/tipos.ts` conforme spec §5.1 (`DadosNero`, `SecaoRelatorio`, `Bloco`, `Especialidade`, `TipoRelatorio`, `Periodo { desde, ate, rotulo }`).
- [ ] `especialidades.ts`: `ESPECIALIDADES: { id, rotulo }[]` (10) e `PRIORIDADES: Record<Especialidade, ChaveSecao[]>` com D-009; `ChaveSecao = 'perfil'|'medicamentos'|'documentos'|'pa'|'mrpa'|'glicemia'|'hba1c'|'lipidios'|'renal'|'tsh'|'peso'|'exames_cardio'|'prevent'|'agravantes'|'checkup'|'rastreamentos_status'|'mama'|'colo'|'colorretal'|'pulmao'|'prostata'|'pendencias'|'sintomas'|'hist_familiar'|'tabagismo'|'consultas'`.
- [ ] Testes `__tests__/montar.test.ts` com fixture `dadosNeroTeste()` (perfil, 2 medicações, 6 PA, 1 MRPA válida, 4 glicemias, exames LDL/HDL/CT/creatinina/HbA1c/CAC, mamografia BI-RADS 1 e FIT positivo com pendência, 1 risco, 1 agravante, 1 documento, 1 consulta): `montarCardio` traz seções na ordem §26 e tabela de medicações; `montarOncologico` traz perfil de rastreamento, história familiar, um bloco por programa aplicável com "próxima recomendação" e pendência aberta destacada; `montarGeral` = união; `montarConsulta('cardiologia')` começa por perfil/medicamentos/documentos e depois `mrpa, pa, glicemia, lipidios, renal, exames_cardio, prevent, agravantes`; `montarConsulta('mastologia')` não traz PA/glicemia; sem dados → bloco texto "Sem registros no período"; pendência aberta nunca é omitida (aparece em qualquer tipo).
- [ ] Testes `html.test.ts`: contém ressalva §26 (cardio), §40 (oncológico), ambas (geral/consulta); contém nome e período; não contém "você tem"/"diagnóstico de"; com `qrSvg` inclui `<svg`; snapshot.
- [ ] Teste `qr.test.ts`: `qrSvg('https://x.supabase.co/storage/v1/object/sign/…(200 chars)', 200)` retorna string começando com `<svg` e com módulos `<rect`.
- [ ] Implementar `montar.ts`, `html.ts` (CSS A4, `page-break-inside: avoid` por seção, tabelas zebradas leves, barras `div` com largura %; cabeçalho "NERO — <título>", paciente, nascimento, período, "gerado em"; rodapé ressalvas), `qr.ts` (implementação própria de QR versão automática 1–10, ECC M, saída SVG — ~250 linhas; **ou** dependência `qrcode` (npm, JS puro, `toString(text, { type: 'svg' })`) — preferir a dependência `qrcode` por confiabilidade; ela roda em RN sem módulo nativo).
- [ ] Verde; commit `feat(relatorios): montagem por tipo/especialidade (D-009), HTML com ressalvas literais e QR`.

## Task 4: Relatórios — carregador, PDF, QR e telas

- [ ] `carregar.ts`: `carregarDadosNero(userId, periodo)` — `Promise.all` de `montarContexto` (+ `avaliarElegibilidade` por programa com regras e handlers, como em `useRastreando`), `listarPA`, `listarSessoes`, `listarGlicemia`, `listarExamesCardio`, `ultimoRisco`, `perfil` (metas/plano/agravantes/preferências), medicações (todas), documentos do período, consultas futuras.
- [ ] `gerarPdf.ts`: `gerarPdf(html, nome) → uri` (`Print.printToFileAsync({ html, base64: false })` e renomear com `FileSystem` opcional) · `compartilharArquivo(uri)` (`Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' })`).
- [ ] `compartilharQr.ts`: `criarCompartilhamento(userId, tipo, especialidade, htmlSemQr, montarHtmlComQr: (url) => string)` → caminho `<uid>/<uuid>.pdf` → upload do PDF sem QR → `createSignedUrl(caminho, 7*24*3600)` → gerar PDF com QR da URL → upload `upsert: true` → insert `compartilhamentos` → `{ id, url, expiraEm }` (teste manual: URL continua válida após upsert; se não, deixar QR só na tela e registrar no funcionamento) · `revogar(id)` · `listarAtivos(userId)` · `limparExpirados(userId)`.
- [ ] Telas: `minha-saude/relatorios/index.tsx` (3 cartões + período 30/90/180 + lista de compartilhamentos ativos com validade e "Encerrar") · `relatorios/previa.tsx?tipo=&periodo=&especialidade=` (renderiza `SecaoRelatorio[]` nativamente com `SecaoRelatorioView`; botões "Gerar PDF e compartilhar" e "Mostrar QR para o médico" → modal com QR (`react-native-qrcode-svg` para a tela **ou** `SvgXml` do `qrcode` svg), validade, "Encerrar compartilhamento").
- [ ] Botões existentes: `coracao/mrpa/relatorio.tsx` e `coracao/glicemia/relatorio.tsx` → "Compartilhar em PDF" ativo (gera cardio filtrado: `montarCardio` com `apenas: ['mrpa']`/`['glicemia']` — acrescentar parâmetro `apenas?: ChaveSecao[]`); `rastreando/index.tsx` → `ListItem` "Relatório de rastreamento".
- [ ] `npm run rotas`, checks, commit `feat(relatorios): PDF no aparelho, QR com URL assinada de 7 dias e telas (D-007)`.

## Task 5: Preparar minha consulta

- [ ] `minha-saude/consulta/index.tsx?especialidade=&consultaId=`: `Opcoes` com as 10 especialidades (pré-selecionada se vier por parâmetro), período (padrão 180 dias), texto "O NERO seleciona o que mais importa para esta consulta; o restante fica no relatório geral." → "Ver prévia" → `relatorios/previa?tipo=consulta&especialidade=…`.
- [ ] Commit `feat(minha-saude): Preparar minha consulta por especialidade (D-009)`.

## Task 6: Central de lembretes, preferências, consultas e Home

- [ ] `src/core/lembretes/central.ts`: `listarProximos(userId, dias)` / `listarPassados` de `lembretes` (status pendente/enviado) com `origem` derivada do título (`mrpa:`, `glicemia:`, `medicacao:`, `consulta:`, `origem_tipo='exame'`) e `rota` de destino; teste da derivação (puro em `origem.ts`).
- [ ] `preferencias.ts`: `PreferenciasLembretes` (6 chaves) · `lerPreferencias(userId)` · `salvarPreferencias(userId, p)` + `aplicarPreferencias(userId, p)`: para cada tipo desligado, cancelar `scheduleNotification` dos pendentes (regex `notif:`), manter linha e acrescentar ` silenciado` à mensagem; para tipo religado, reagendar chamando os agendadores existentes (`sincronizarLembretesMedicacao`, `agendarLembretesMrpa` da sessão ativa, `agendarLembretesGlicemia` do plano, `agendarLembretesConsulta` das futuras; exames do Rastreando: reagendar a partir de `data_proxima_acao` via `agendarLembretes`). Teste puro: `tiposParaCancelar(prefsAntes, prefsDepois)` e `prefixoDoTipo`.
- [ ] Agendadores existentes passam a receber/ler preferências: `rastreando/lembretes.ts` e `cardio/lembretesCardio.ts` chamam `lerPreferencias` uma vez e pulam `scheduleNotificationAsync` quando o tipo está desligado (gravam a linha com ` silenciado`).
- [ ] `consultas.ts`: CRUD + `agendarLembretesConsulta(userId, consulta)` (D-1 09:00 "Amanhã: consulta de cardiologia às 14:00. Quer preparar o relatório?"; dia 07:00) · `cancelarLembretesConsulta`. `useLembretes()`, `useConsultas()`.
- [ ] Telas: `minha-saude/lembretes/index.tsx` (próximos 30 dias agrupados por dia — `LinhaLembrete` com origem, hora, atalho; seção "Últimos 30 dias"; botões "Preferências", "Minhas consultas") · `lembretes/preferencias.tsx` (6 `Switch` + texto D-010) · `lembretes/consultas.tsx` (lista futuras/passadas; formulário especialidade/data/hora/local/profissional; item → "Preparar esta consulta").
- [ ] Home: `montarItensHoje` recebe `consultas: { proxima: { id, especialidade, dataHora } | null }` → `consulta_hoje` (amarelo, "Hoje: consulta de cardiologia às 14:00 — preparar") / `consulta_amanha` (amarelo); testes. Card "Minha Saúde": "n documentos · próximo lembrete …".
- [ ] `npm run rotas`, checks, commit `feat(minha-saude): central de lembretes, preferências, consultas e Home (D-010)`.

## Task 7: Central de exames, linha do tempo geral e índice de Minha Saúde

- [ ] `minha-saude/exames/index.tsx`: filtros Laboratoriais · Cardiológicos · Oncológicos · Imagem · Outros; carrega cardio (`listarExamesCardio`) + rastreando (`montarContexto().exames`); `LinhaExame` para cardio, `CartaoExame` para rastreando; toque abre `coracao/exames/[id]` ou `rastreando/[programa]/exames`.
- [ ] `src/core/linhaDoTempo/geral.ts` (+ teste de agrupamento): itens da cardio + exames do Rastreando ("Mamografia — BI-RADS 1", nível) + medicações (início/fim) + consultas passadas + documentos avulsos; `minha-saude/linha-do-tempo.tsx`.
- [ ] `minha-saude/index.tsx` reorganizado (9 entradas, contadores).
- [ ] Medicamentos: seção "Histórico" (inativas com `ate`).
- [ ] Checks, commit `feat(minha-saude): central de exames, linha do tempo geral e índice reorganizado (§59–§60)`.

## Task 8: Conteúdo, docs, nuvem e merge

- [ ] `src/modules/minha-saude/conteudo/relatorios.ts` (ressalvas literais, rótulos, textos do QR e das preferências) → `docs/nero/revisao/2026-09-XX-revisao-textos-minha-saude.md`.
- [ ] `docs/nero/funcionamento/minha-saude.md` §3–§7 preenchidos (arquivos, fluxo do QR em duas passagens, preferências).
- [ ] `docs/nero/checklists/fase-3.md` com o critério de pronto da spec.
- [ ] Nuvem: `supabase db push` (0011 cria bucket e políticas) — senha na hora.
- [ ] Checklist do Murilo → correções → merge `--no-ff` em `desenvolvimento-2` → push → roadmap.

## Autorrevisão
- Cobertura: §59 (T2, T7), §60 (T7), §61 (T3–T4), §62 (T5), §63 (T6), §26/§40 (T3–T4), D-007 (T4), D-008 (T2), D-009 (T3, T5), D-010 (T6).
- Nomes consistentes: `carregarDadosNero`, `montarCardio/Oncologico/Geral/Consulta`, `htmlRelatorio`, `qrSvg`, `gerarPdf`, `compartilharArquivo`, `criarCompartilhamento`, `revogar`, `listarAtivos`, `lerPreferencias`, `salvarPreferencias`, `aplicarPreferencias`, `agendarLembretesConsulta`, `montarLinhaDoTempoGeral`.
