# NERO — Fase 3: Minha Saúde (transversal) + Relatórios — Spec Técnica

**Data:** 17/09/2026 · **Status:** em revisão pelo Murilo
**Base:** `docs/nero/01-ESPECIFICACAO-NERO.md` §26, §40, §59–§63 · Decisões **D-007 a D-010** em `docs/nero/02-DECISOES.md` (aprovadas em 17/09/2026) · Funcionamento: `docs/nero/funcionamento/minha-saude.md` (a preencher junto com a execução) · Fases anteriores: `2026-09-14-nero-fundacao-design.md`, `2026-09-15-nero-fase1-rastreando-design.md`, `2026-09-17-nero-fase2-cardio-design.md`.
**Entrega:** um plano, um checklist, um merge.

---

## 1. Objetivo

Transformar "Minha Saúde" na central transversal do NERO: exames de todos os módulos com filtros, documentos anexados (laudos, receitas, imagens), linha do tempo geral, central de relatórios em PDF com QR code para o médico, "Preparar minha consulta" por especialidade e central de lembretes com preferências e consultas agendadas.

**Critério de pronto:** o paciente anexa a foto de um laudo ao LDL registrado e a vê em Meus Documentos e no detalhe do exame; abre Relatórios → "Cardiovascular" → vê a prévia, gera o PDF e compartilha pelo WhatsApp; toca "Mostrar QR" → o QR aparece na tela e no rodapé do PDF; abre o QR em outro celular e o PDF carrega; "Encerrar compartilhamento" faz o link parar de funcionar; cadastra uma consulta de cardiologia para amanhã → a Home mostra "Consulta amanhã: preparar" → "Preparar minha consulta" já vem em cardiologia com MRPA, PA, LDL, TFG, PREVENT e medicamentos; em Meus lembretes desliga "medicamento" → as notificações de medicamento somem do celular, mas o item da Home continua; a linha do tempo geral mostra mamografia BI-RADS 1, LDL, MRPA concluída e início de losartana em ordem.

## 2. Fora de escopo

Página web navegável para o médico (o QR abre o PDF) · e-mail automático · OCR/leitura automática de laudos · horário de silêncio próprio · edição do PDF pelo paciente · Saúde & Bem-estar (Fase 4) · lado profissional.

## 3. Princípios

1. **Dados de saúde saem do aparelho só por decisão explícita do paciente** (D-007): gerar PDF é local; o upload acontece apenas ao pedir o QR, com URL assinada de 7 dias e revogação.
2. **Relatório organiza, não interpreta** (§25): as ressalvas literais do §26 e do §40 aparecem em todo PDF; nenhum texto novo com diagnóstico; classificações vêm das regras já existentes (`nivel_alerta`, mensagens de `regras_clinicas`).
3. **Reutilizar, não duplicar:** os dados do relatório vêm dos mesmos serviços das telas (`useRastreando`/`montarContexto`, `src/core/cardio/*`); um único carregador `carregarDadosNero(userId)` alimenta os quatro relatórios.
4. **Montagem e HTML são funções puras** testáveis sem Expo; só `gerarPdf.ts`, `compartilharQr.ts` e `documentos/storage.ts` tocam Expo/Supabase.
5. **Pendências clínicas nunca somem** (§63): preferências desligam notificações do celular, não itens da Home.
6. Antes das telas, reler `03-DESIGN.md` (skill `frontend-design`). O PDF tem identidade própria (papel branco, Poppins não disponível no HTML → usar `-apple-system, Helvetica`; marca "NERO" em texto; tabelas com linhas finas; sem cores de alerta chamativas — chips discretos).

## 4. Modelo de dados — migração `0011_minha_saude.sql`

### 4.1 `documentos` (D-008)
```sql
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exame_id uuid references public.exames(id) on delete set null,
  tipo text not null check (tipo in ('laudo','receita','atestado','imagem','outro')),
  nome text not null,
  caminho text not null,          -- <user_id>/<uuid>.<ext> no bucket 'laudos'
  mime text not null,
  tamanho integer not null check (tamanho > 0),
  data_documento date,
  observacao text,
  created_at timestamptz not null default now()
);
create index documentos_user_data_idx on public.documentos (user_id, coalesce(data_documento, created_at::date) desc);
create index documentos_exame_idx on public.documentos (exame_id);
```
RLS dono (padrão 0005). Políticas do bucket `laudos` já existem (0006).

### 4.2 `compartilhamentos` + bucket `relatorios` (D-007)
```sql
insert into storage.buckets (id, name, public) values ('relatorios', 'relatorios', false) on conflict (id) do nothing;
-- políticas select/insert/delete por pasta do usuário, iguais às de 'laudos'
create table public.compartilhamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo_relatorio text not null check (tipo_relatorio in ('cardiovascular','oncologico','geral','consulta')),
  especialidade text,
  caminho text not null,          -- <user_id>/<uuid>.pdf no bucket 'relatorios'
  expira_em timestamptz not null,
  revogado_em timestamptz,
  created_at timestamptz not null default now()
);
create index compartilhamentos_user_ativos_idx on public.compartilhamentos (user_id, expira_em desc) where revogado_em is null;
```
Limpeza: ao listar, o app apaga do Storage os expirados há > 1 dia (não há cron nesta fase).

### 4.3 `consultas` (D-010)
```sql
create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  especialidade text not null check (especialidade in ('cardiologia','endocrinologia','clinica_medica','ginecologia','mastologia','urologia','gastro_coloprocto','pneumologia','oncologia','outra')),
  data_hora timestamptz not null,
  local text,
  profissional text,
  observacao text,
  created_at timestamptz not null default now()
);
create index consultas_user_data_idx on public.consultas (user_id, data_hora);
```

### 4.4 Alterações
- `perfil_saude.preferencias_lembretes jsonb not null default '{"exame":true,"mrpa":true,"glicemia":true,"medicacao":true,"consulta":true,"atualizacao":true}'`.
- `lembretes.origem_tipo` check ganha `'consulta'`. Convenção de título: `consulta:<id>:d-1` e `consulta:<id>:dia`.
- pgTAP (`minha_saude.test.sql`): RLS de `documentos`, `compartilhamentos`, `consultas`; `origem_tipo='consulta'` aceito; política de insert do bucket `relatorios` rejeita pasta de outro usuário.

## 5. Núcleo

### 5.1 `src/core/relatorios/` (puro, exceto os dois últimos)
| arquivo | responsabilidade |
|---|---|
| `tipos.ts` | `DadosNero` (perfil, antecedentes, medicações ativas/históricas, medidas PA/glicemia do período, sessões MRPA, exames cardio por tipo, exames do Rastreando por programa com classificação/mensagem, pendências, sintomas, avaliações de elegibilidade, riscos_cv, agravantes, documentos do período, consultas), `Periodo`, `TipoRelatorio`, `Especialidade`, `SecaoRelatorio { titulo, blocos: Bloco[] }` com `Bloco = { tipo: 'texto' | 'tabela' | 'barras' | 'lista' | 'chip', ... }` |
| `montar.ts` | `montarCardio(d, periodo)`, `montarOncologico(d)`, `montarGeral(d, periodo)`, `montarConsulta(d, especialidade, periodo)` → `SecaoRelatorio[]`; `montarConsulta` aplica a matriz de **D-009** (`PRIORIDADES_POR_ESPECIALIDADE` em `especialidades.ts`) sobre as seções; bloco "sempre presente" primeiro |
| `especialidades.ts` | lista das 10 especialidades com rótulo e as seções priorizadas (D-009) |
| `html.ts` | `htmlRelatorio({ titulo, paciente, periodo, secoes, qrSvg?, geradoEm })` → string HTML com CSS embutido (A4, margens, quebras de página por seção, tabelas, barras em `div`s, chips discretos); rodapé com **ressalvas literais**: §26 "Este relatório organiza suas aferições…" (cardio/geral/consulta) e §40 "As informações apresentadas foram registradas pelo usuário e organizadas pelo NERO… O relatório não substitui avaliação médica." (oncológico/geral/consulta); "Gerado pelo NERO em <data> · dados registrados pelo paciente" |
| `qr.ts` | `qrSvg(texto, tamanho)` — gerador de QR em SVG puro (módulo local, sem dependência nativa, para poder embutir no HTML do PDF) **ou** `react-native-qrcode-svg` para a tela + `toDataURL` para o PDF; escolha na Task correspondente (preferir SVG puro se a lib não exportar imagem sem componente) |
| `carregar.ts` | `carregarDadosNero(userId, periodo)` — único ponto que lê o banco (reutiliza `montarContexto`, `avaliarElegibilidade`, `src/core/cardio/*`, `documentos`, `consultas`) |
| `gerarPdf.ts` | `gerarPdf(html, nomeArquivo) → uri` (expo-print `printToFileAsync`) · `compartilharArquivo(uri)` (expo-sharing) |
| `compartilharQr.ts` | `criarCompartilhamento(userId, tipo, especialidade, uriPdf)` → upload em `relatorios/<uid>/<uuid>.pdf`, `createSignedUrl(7 dias)`, insert em `compartilhamentos`, devolve `{ url, expiraEm, id }` · `revogar(id)` (remove do Storage + `revogado_em`) · `listarAtivos(userId)` · `limparExpirados(userId)` |

Fluxo de geração com QR: montar seções → gerar QR **antes** do PDF? Não há URL antes do upload. Solução: (1) gerar PDF sem QR e compartilhar (caminho comum); (2) ao pedir QR: cria o registro (`id`) → a URL assinada é criada **após** o upload, então o PDF com QR embutido é gerado em duas passagens: sobe um PDF provisório? Simplificar: o QR aponta para uma URL assinada do **caminho** decidido antes do upload (`<uid>/<uuid>.pdf`) — o Supabase permite criar a URL assinada só de objeto existente. Portanto: (a) gerar PDF sem QR → upload → URL assinada → (b) regenerar o PDF **com o QR** dessa URL → **sobrescrever** o mesmo objeto (`upsert: true`). A URL assinada continua válida (assina o caminho, não o conteúdo). Duas gerações locais, um objeto no Storage. Documentar no funcionamento.

### 5.2 `src/core/documentos/`
`tipos.ts` · `mapeamento.ts` (puro) · `storage.ts` (`escolherImagem()` câmera/galeria com `expo-image-picker`, `escolherPdf()` com `expo-document-picker`, `comprimirImagem(uri)` com `expo-image-manipulator` (largura ≤ 2000, JPEG 0,8), `enviar(userId, arquivo) → caminho`, `urlAssinada(caminho, 3600)`, `apagar(caminho)`) · `repositorio.ts` (CRUD em `documentos`) · `useDocumentos(filtro)`.

### 5.3 `src/core/lembretes/`
`central.ts` (`listarProximos(userId, dias=30)`, `listarPassados(userId, dias=30)` a partir de `lembretes` + rótulo de origem) · `preferencias.ts` (ler/gravar `preferencias_lembretes`; `aplicarPreferencias(userId, prefs)` cancela notificações locais dos tipos desligados percorrendo `lembretes` pendentes por prefixo de título — `mrpa:`, `glicemia:`, `medicacao:`, `consulta:`, e `origem_tipo='exame'` — e **mantém as linhas** com status `pendente` marcadas `mensagem += ' silenciado'`; religar reagenda via as funções já existentes) · `consultas.ts` (CRUD + `agendarLembretesConsulta` D-1 09:00 e no dia 07:00; título `consulta:<id>:d-1|dia`) · `useLembretes()`, `useConsultas()`.
Os agendadores existentes (`rastreando/lembretes.ts`, `cardio/lembretesCardio.ts`) passam a consultar `preferencias_lembretes` antes de chamar `scheduleNotificationAsync` (grava a linha, pula a notificação se o tipo está desligado).

### 5.4 `src/core/linhaDoTempo/geral.ts`
`montarLinhaDoTempoGeral(userId)` = itens da cardio (`montarLinhaDoTempo`) + exames do Rastreando (`"Mamografia — BI-RADS 1"` com data e nível) + medicações (início/fim) + consultas realizadas + documentos avulsos; agrupado por ano/mês.

## 6. Telas — `app/(app)/minha-saude/**`

```
index.tsx                 Central (§59): Meu perfil · Antecedentes · Meus exames · Meus medicamentos · Meus documentos · Minha linha do tempo · Relatórios · Preparar minha consulta · Meus lembretes
exames/index.tsx          central única: filtros Laboratoriais · Cardiológicos · Oncológicos · Imagem · Outros; lista (LinhaExame para cardio, CartaoExame para rastreando); toque abre o detalhe já existente do módulo
documentos/index.tsx      lista com filtro por tipo; "Adicionar documento" (câmera / galeria / PDF) → tipo, nome, data, exame vinculado (opcional), observação
documentos/[id].tsx       visualizador (imagem em tela; PDF via WebView/`expo-web-browser` com URL assinada 1 h); apagar
linha-do-tempo.tsx        geral (§60)
relatorios/index.tsx      três cartões (Cardiovascular · Oncológico · Geral) com período (30/90/180 dias) → prévia; lista "Compartilhamentos ativos" com validade e "Encerrar"
relatorios/previa.tsx     prévia em tela (mesmas seções do PDF, renderizadas nativamente) + "Gerar PDF e compartilhar" + "Mostrar QR para o médico" (gera, sobe, mostra QR grande + validade + "Encerrar")
consulta/index.tsx        "Preparar minha consulta" (§62): especialidade (ou vinda de uma consulta cadastrada) → prévia → PDF/QR
lembretes/index.tsx       próximos 30 dias por dia (origem + atalho), histórico, botão "Preferências", "Minhas consultas"
lembretes/preferencias.tsx 6 interruptores (D-010) + texto "pendências clínicas continuam visíveis no app"
lembretes/consultas.tsx   lista + cadastro (especialidade, data/hora, local, profissional); do item: "Preparar esta consulta"
```
- Botões "Compartilhar em PDF" já existentes (MRPA, glicemia) passam a chamar `gerarPdf` com o relatório cardiovascular filtrado (MRPA → seção MRPA daquela sessão; glicemia → seção glicemia do período), removendo o `EmBreveBadge`.
- Rastreando: botão "Relatório de rastreamento" em `rastreando/index.tsx` → `relatorios/previa?tipo=oncologico`.
- Detalhe de exame (cardio `[id].tsx` e o do Rastreando): bloco "Documentos" com miniaturas + "Anexar".
- Home: item `consulta_amanha` (amarelo) "Preparar consulta de cardiologia — amanhã 14:00" → `consulta?especialidade=…`; item `consulta_hoje` (amarelo, no dia). Card "Minha Saúde" com "n documentos · próximo lembrete: …".

## 7. Conteúdo
`src/modules/minha-saude/conteudo/relatorios.ts`: títulos das seções, rótulos das especialidades, ressalvas literais (§26, §40), texto do QR ("Aponte a câmera para abrir o relatório. Válido até <data>."), textos de preferências. Revisão do Murilo antes do merge.

## 8. Testes
- `montar.ts`: para um `DadosNero` fixture completo, cada tipo produz as seções esperadas; `montarConsulta` para as 10 especialidades traz primeiro o bloco "sempre presente" e depois as prioridades de D-009 (teste tabela-dirigido); sem dados de um bloco → seção com "Sem registros no período" (nunca omite silenciosamente uma pendência aberta).
- `html.ts`: contém as ressalvas literais; contém nome e período; não contém frases proibidas ("você tem", "diagnóstico de"); snapshot por tipo.
- `qr.ts`: SVG válido para uma URL de 200 caracteres.
- `preferencias.ts`: desligar `medicacao` cancela só títulos `medicacao:*`; religar reagenda.
- `geral.ts`: ordenação e agrupamento com itens de três módulos.
- pgTAP: 5 testes (RLS ×3, origem consulta, bucket).
- Manual: `docs/nero/checklists/fase-3.md`.

## 9. Ordem de implementação (base do plano)
1. Migração 0011 + tipos + pgTAP + dependências (`expo-print`, `expo-sharing`, `expo-document-picker`, `expo-image-manipulator`, `expo-web-browser`).
2. `documentos/` (núcleo + telas + anexos nos detalhes de exame).
3. `relatorios/` puro: tipos, especialidades (D-009), `montar.ts`, `html.ts`, `qr.ts` com testes.
4. `carregar.ts`, `gerarPdf.ts`, `compartilharQr.ts`; telas de Relatórios e prévia; botões nos módulos.
5. Preparar minha consulta.
6. `lembretes/` (central, preferências, consultas) + agendadores respeitando preferências + Home.
7. Central de exames e linha do tempo geral; `index` de Minha Saúde reorganizado.
8. Conteúdo → revisão → `funcionamento/minha-saude.md` → checklist → nuvem (0011 + buckets) → merge.

## 10. Riscos
- **Tamanho do HTML/PDF** com muitos registros: limitar tabelas a 200 linhas por seção com nota "e mais N registros no app".
- **`expo-print` em Android** com fontes: usar fontes do sistema; testar quebra de página.
- **URL assinada e sobrescrita:** confirmar no Supabase local que a URL assinada permanece válida após `upsert` do mesmo caminho (teste manual na Task 4; se não valer, gerar a URL após a segunda subida — o QR fica só na tela, não no PDF).
- **Permissões de câmera/arquivos** negadas: mensagem clara com caminho para as configurações.
