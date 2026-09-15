# NERO — Registro de Decisões

> Cada decisão tem: contexto, opções consideradas, decisão, motivo, data.
> Status: **em aberto** ou **decidida** (com data).
> Decisões **clínicas** (protocolos, intervalos, pontos de corte) ficam na seção própria e sempre citam a fonte.

---

## Decisões técnicas / de produto

### D-001 · Reescrever do zero ou evoluir o código atual? — DECIDIDA (14/09/2026)
**Contexto:** o app atual (Expo 51, telas duplicadas por gênero, modelo de dados plano) não sustenta a base clínica compartilhada nem o motor de regras. O design system (`Theme.ts`, `components/ui`, Lottie do caranguejo) é reaproveitável.
**Opções:** (a) novo projeto Expo com SDK atual, reaproveitando design system e assets; (b) refatorar in-place; (c) híbrido — novo `app/` e novo modelo dentro do mesmo repositório, migrando telas aos poucos.
**Decisão:** (b) evoluir o código atual. O Rastreando existente **vira o módulo Rastreando do NERO**, mantendo aparência e fluxo parecidos, com as melhorias do documento. O que se constrói agora é a **camada anterior**: Home/dashboard do NERO com os módulos, perfil de saúde único e os demais módulos.
**Motivo:** o Murilo quer continuidade com o que já foi construído; o Rastreando é o módulo mais maduro.
**Consequência registrada:** as telas do Rastreando podem manter a cara, mas o **modelo de dados por baixo muda** — resultado de exame deixa de ser "Normal/Alterado" e passa a ser estruturado (BI-RADS, Lung-RADS, FIT, HPV, citologia, PSA), e o perfil (sexo, idade, tabagismo…) passa a vir do Perfil de Saúde compartilhado. Migração das telas do Rastreando para o novo modelo acontece na Fase 1.

### D-002 · Backend: continuar no Firebase ou migrar para Supabase (Postgres)? — DECIDIDA (14/09/2026)
**Contexto:** o NERO precisa de dados relacionais (exame ↔ pendência ↔ regra ↔ lembrete), agregações por período (médias de PA/glicemia, relatórios), versionamento de regras, e trata dados sensíveis de saúde (LGPD). O Firestore atual usa um documento por usuário com arrays.
**Opções:** (a) Firestore com modelagem em subcoleções; (b) Supabase/Postgres com RLS; (c) local-first (SQLite no aparelho) com sincronização.
**Decisão:** (b) **migração total para Supabase** — Auth, Postgres (com RLS por usuário), Storage para laudos. Firebase é removido do projeto. Banco começa limpo: não há dados reais no Firebase, só testes. O Murilo cria uma conta/projeto novo no Supabase (região São Paulo).
**Motivo:** (1) dados do NERO são relacionais (exame ↔ pendência ↔ regra ↔ lembrete) e agregações por período são consultas SQL; (2) custo previsível — Firestore cobra por leitura de documento, e um app longitudinal lê muitos documentos por tela; Supabase é preço fixo; (3) RLS auditável para dados sensíveis (LGPD) e região no Brasil; (4) `pg_cron` para lembretes, Edge Functions para PDF, tabela de regras clínicas versionadas (§65); (5) o Murilo conhece melhor o Supabase.
**Risco assumido:** offline não é nativo como no Firestore. Registro sem internet fica para depois (fila local + sincronização), não bloqueia a v1.

### D-003 · Onde vive o motor de regras clínicas? — DECIDIDA (14/09/2026)
**Contexto:** §65 exige base de regras separada dos dados do paciente, com fonte/versão/data de revisão. Precisa ser testável e atualizável sem redeploy de telas.
**Opções:** (a) TypeScript puro no app, regras como dados (tabelas) + funções puras, cobertas por testes; (b) regras no banco, interpretadas em runtime; (c) backend/edge function que classifica.
**Decisão:** híbrido (a)+(b): **parâmetros das regras como dados** na tabela `regras_clinicas` do Supabase (módulo, exame, resultado, classificação, nível de alerta, intervalo, mensagem ao paciente, fonte, ano, versão, data de revisão — §53/§65) e **lógica de classificação em TypeScript puro**, sem dependência de UI, com teste automatizado para cada caminho (BI-RADS 0–6, FIT ±, HPV 16/18/outros, citologia, Lung-RADS, PSA, hierarquia de segurança §66).
**Motivo:** mudar um intervalo quando a diretriz mudar = atualizar uma linha, sem redeploy; a lógica testada garante que nenhuma combinação de resultado fica sem conduta definida.

### D-004 · Manter o perfil "profissional de saúde"? — DECIDIDA (14/09/2026)
**Contexto:** o app atual tem dois tipos de usuário (`populacao` / `saude`). O documento NERO não menciona o lado profissional em nenhuma seção (só "mensagem para profissional, futuramente" em §65).
**Opções:** (a) remover por enquanto e focar no paciente; (b) manter como está; (c) manter só o conceito no modelo de dados para o futuro.
**Decisão:** (a) **remover o lado profissional** nesta versão. Telas `Home/TelaDeHomeProfissional*`, `RastrearMeuPaciente/*` saem do app. O banco mantém a coluna `tipo_usuario` (default `paciente`) para reativação futura.
**Motivo:** o documento NERO é 100% na voz do paciente; um painel profissional é outro produto e o escopo já é grande.

### D-005 · Ordem das fases: Rastreando primeiro ou Cardio primeiro? — DECIDIDA (14/09/2026)
**Contexto:** o documento apresenta Cardio primeiro, mas o Rastreando já existe e é o domínio mais consolidado; migrá-lo primeiro valida o motor de regras com menos incógnitas.
**Opções:** (a) Fundação → Rastreando → Cardio → Minha Saúde → Bem-estar; (b) Fundação → Cardio → Rastreando → …
**Decisão:** (a). A Fundação já entrega o **dashboard do paciente com os 4 módulos visíveis** (Rastreando ativo; os demais como cards "em breve"), e o primeiro módulo completo é o **Rastreando**, já encaixado como módulo.
**Motivo:** domínio conhecido, motor de regras mais exigido ali; as telas antigas precisam ser religadas ao novo banco de qualquer forma.

### D-006 · Nome e identidade: mascote e logo — DECIDIDA (14/09/2026)
**Contexto:** o caranguejo é símbolo do câncer e faz sentido no Rastreando; o NERO é mais amplo (cardio, hábitos).
**Opções:** (a) manter o caranguejo como mascote do módulo Rastreando e criar identidade neutra para o NERO; (b) manter em tudo; (c) decidir depois, no design.
**Decisão:** o Murilo já tem **logo do NERO** e um **mascote chamado Nero**. O mesmo personagem aparece em todos os módulos, com aspecto adaptado a cada um (ex.: coração no Coração & Metabolismo, lupa no Rastreando). O caranguejo sai.
- **Fundação:** logo + PNGs do Nero (uma variante por módulo) em `assets/images/nero/`.
- **Spike futuro (não bloqueia nada):** GLB rigado exportado do Meshy com 3–4 animações embutidas; protótipo com `expo-gl` + `three.js` para medir peso/desempenho no celular. Se rodar bem, 3D entra só em momentos-herói (onboarding, login, cabeçalho da Home); o restante fica em PNG/Lottie.
**Motivo:** identidade própria já criada; 3D em RN é viável mas pesado — decide-se com medição, não com suposição. Animações expressivas são geradas no Meshy/Mixamo e orquestradas em código; procedural só para gestos simples (olhar, inclinar, respirar).

---

## Decisões clínicas (protocolos adotados)

> Preencher na Fase 1/2. Cada linha precisa de fonte, ano e data de revisão. O documento diz "intervalo definido pelo protocolo vigente" em vários pontos — estas são as lacunas a fechar.

| ID | Tema | Decisão | Fonte | Ano | Revisado em |
|----|------|---------|-------|-----|-------------|
| C-001 | Mamografia risco habitual: idade início / fim / intervalo | **Anual, 40 a 74 anos** (além de 74 se expectativa de vida > 7 anos). Texto educativo menciona que o SUS/INCA segue 50–69 bienal. | Urban LA et al., CBR/SBM/FEBRASGO, *Radiol Bras* 2023;56(4):207-14 | 2023 | 15/09/2026 |
| C-002 | Colo do útero: DNA-HPV — faixa etária e intervalo | — | INCA 2025 / Portaria SAES 13/2025 | — | — |
| C-003 | Colo do útero: citologia — faixa e intervalo (transição) | — | INCA | — | — |
| C-004 | Colorretal: FIT — faixa (50–75) e intervalo (bienal) | — | CONITEC 2026 | — | — |
| C-005 | Colorretal: regra de história familiar (X anos antes do caso índice) | — | ACG 2021 | — | — |
| C-006 | Pulmão: critérios TCBD (idade, maços-ano, anos desde cessação) | — | USPSTF 2021 / SBPT | — | — |
| C-007 | Lung-RADS: intervalo por categoria | — | ACR Lung-RADS v2022 | — | — |
| C-008 | Próstata: idade para iniciar decisão compartilhada (habitual / alto risco) | — | SBU / INCA 2023 | — | — |
| C-009 | BI-RADS 3: intervalo padrão quando laudo não especifica | — | ACR BI-RADS | — | — |
| C-010 | PA: limiares para "medidas repetidamente elevadas" e "valor muito elevado" | — | DBHA 2020 / Medidas PA 2023 | — | — |
| C-011 | MRPA: nº de dias do protocolo e critérios de validade | — | 4ª Diretriz MRPA 2018 / 2023 | — | — |
| C-012 | Glicemia: metas padrão (quando médico não definiu) e limiares de hipo/hiper com sintomas | — | SBD 2026 | — | — |
| C-013 | PREVENT: versão das equações (base vs. full) e horizonte (10 / 30 anos) | — | Khan 2024 / Diretriz Dislipidemias 2025 | — | — |
| C-014 | Janela de "dado recente" para preenchimento automático (PA: x dias; lipídios: y meses…) | — | §14 | — | — |

---

## Identidade visual (referência)

- **Mascote Nero** — render 3D (personagem branco perolado com listras azul-aço, olhos azul-cobalto, expressão serena). Referência em `assets/images/nero/nero-referencia.jpeg` (14/09/2026). Pendente: versão PNG com fundo transparente, sem texto, e variantes por módulo.
- **Logo NERO** — pendente de envio.
- **Paleta derivada do mascote:** azul-aço `~#5B8DB8`, azul-marinho `~#1C3A5E` (compatível com o `#0f2d63` atual), fundo bege claro `~#E8E4DD`, branco perolado.
- **Caminho 3D:** por ser render 3D, o GLB rigado do Meshy é o caminho natural para o spike futuro (D-006).


## Infraestrutura (referência)

- **Supabase remoto:** projeto `Nero Saude APP`, ref `ycljqpwpeoonqisqdrws`, região South America (São Paulo), criado em 15/09/2026. URL `https://ycljqpwpeoonqisqdrws.supabase.co`. Chave publicável no `.env` (não versionado). Confirmação de e-mail **desativada** durante o desenvolvimento — reativar antes de publicar nas lojas.
- **Local:** `supabase start` (Docker) para testes pgTAP; `.env.local-docker` guarda a configuração local.
- **Segredos:** token de acesso do CLI e senha do banco foram usados uma vez para `link`/`db push` e não ficam em nenhum arquivo do projeto. O CLI mantém o vínculo em `supabase/.temp/` (ignorado pelo git). Recomendação: revogar o token `nero-cli` em supabase.com/dashboard/account/tokens e gerar outro quando precisar.
