# NERO — Roadmap de Construção

> Documento vivo. Atualizado a cada passo concluído.
> Especificação de produto completa: [`01-ESPECIFICACAO-NERO.md`](01-ESPECIFICACAO-NERO.md)
> Registro de decisões: [`02-DECISOES.md`](02-DECISOES.md)
> Specs técnicas por fase: `docs/superpowers/specs/` · Planos de implementação: `docs/superpowers/plans/`

---

## Como usamos este documento

1. Cada **fase** vira uma spec técnica própria (`docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`) → plano de implementação → código com testes.
2. Nada é marcado como concluído sem verificação (testes rodando / tela testada).
3. Toda decisão relevante (técnica ou clínica) entra em `02-DECISOES.md` com data e motivo.
4. Regras clínicas nunca ficam só no código: cada uma tem fonte, ano, versão e data de revisão (spec §53 e §65).
5. **Como cada funcionalidade funciona** (passo a passo + referência com recomendação/quadro) fica em `docs/nero/funcionamento/<módulo>.md` — um arquivo por módulo, índice em `funcionamento/README.md`; escrito junto com a decisão, nunca depois (regra do Murilo, 17/09/2026).
6. **Toda referência usada é salva em `docs/nero/referencias/` (PDF + texto extraído) e indexada em `REFERENCIAS.md`. Antes de usar uma referência, verificar se há versão mais nova na URL oficial e substituir** (regra do Murilo, 15/09/2026).

---

## Estado de partida (14/09/2026)

**O que existe (Rastreando v1):**
- Expo SDK 51 / React Native 0.74 / TypeScript / Expo Router
- Firebase Auth + Firestore (projeto `rastreando-app-dm`)
- ~7.100 linhas, 33 telas, duplicadas por gênero (7 calculadoras + 7 telas de exame)
- Design system parcial em `constants/Theme.ts` + `components/ui/` (Poppins, paleta azul `#0f2d63`, caranguejo Lottie)
- Modelo de dados: documento único por usuário com arrays `examesAnteriores<Câncer>` e campos `proximoExame<Câncer>`; resultado de exame é só "Normal/Alterado"; cálculo de risco por soma simples de fatores
- Dois tipos de usuário: `populacao` e `saude` (profissional)
- Zero testes automatizados

**Por que o modelo atual não serve para o NERO:**
- Não existe perfil clínico compartilhado (idade, sexo, tabagismo, comorbidades…) — cada módulo teria que perguntar de novo (viola §41, §64)
- Resultados de exame não são estruturados (sem BI-RADS, Lung-RADS, FIT, HPV) — impossível alimentar árvores de decisão (§31, §42)
- Não há conceito de pendência, nível de alerta, fonte da regra (§50, §53)
- Regras clínicas estão espalhadas dentro das telas (viola §65)

---

## Decomposição proposta em fases

> STATUS: decomposição **aprovada** em 14/09/2026 (D-001 a D-006 decididas). Próximo: spec técnica da Fase 0.

### Fase 0 — Fundação
O alicerce que todos os módulos usam. Nenhuma tela de módulo é construída antes disto.
- [x] Decisões de arquitetura (D-001 a D-006)
- [x] Supabase **local** (Docker) com schema, RLS e testes pgTAP; credenciais em `.env`
- [x] Projeto Supabase **remoto** `Nero Saude APP` (ref `ycljqpwpeoonqisqdrws`, São Paulo) com as 7 migrações aplicadas; app aponta para a nuvem (`.env`); `.env.local-docker` guarda a config local
- [x] Substituir Firebase por Supabase: Auth (e-mail/senha), cliente, cadastro e login
- [x] Modelo de dados compartilhado: 9 tabelas (perfil, antecedentes, regras, exames, pendências, MRPA, medidas, medicações, lembretes)
- [x] **Motor de regras clínicas** em `src/core/regras` — hierarquia de segurança, elegibilidade (8 status), classificação; 29 testes; teste de isolamento de UI/banco
- [x] Autenticação + Perfil de Saúde único (perfil inicial em passos + Meu perfil completo + antecedentes)
- [x] Home com bloco "Hoje" + 4 módulos + abas + tela-ponte do Rastreando
- [x] Design system consolidado em `src/ui` (`docs/nero/03-DESIGN.md`)
- [x] Meus medicamentos
- [x] Checklist manual no celular — percorrido pelo Murilo em 15/09; ajustes derivados (onboarding v3, Home v2, declarações negativas) implementados

### Fase 1 — Rastreando v2 (oncológico) — **concluída em 16/09/2026**
Migrar o módulo que já existe para a nova base — valida o motor de regras com o domínio já conhecido.
- [x] Protocolos por câncer decididos e validados nas fontes primárias (C-001–C-009; acervo em `referencias/`)
- [x] Elegibilidade por perfil → "Seus rastreamentos" com os 8 status (§28)
- [x] Estrutura padrão por câncer: entenda / preciso rastrear? / fatores de risco / sinais de alerta / meus exames / histórico (§29)
- [x] Árvores de decisão: Mama (BI-RADS), Colo (DNA-HPV Rec. 18–25 + citologia + colposcopia), Colorretal (FIT + colonoscopia + 10 anos sem FIT), Pulmão (USPSTF + Lung-RADS), Próstata (PSA sem intervalo automático) — 62 regras em `regras_clinicas`
- [x] Pendências + vínculo "este exame resolve uma pendência anterior?" (trigger no banco) (§50–51)
- [x] Alertas de sintomas com prioridade sobre calendário (§52)
- [x] Lembretes (no app + notificação local) (§38)
- [x] Dashboard oncológico + linha do tempo + integração com a Home (§37, §39, §56)
- [ ] Revisão clínica dos textos pelo Murilo — `docs/nero/revisao/2026-09-16-revisao-textos-rastreando.md` (correções aplicadas sob demanda)
- [ ] Obter diretriz INCA 2016 (citologia) para validar 4 linhas da semente (ASC-US/LSIL/insatisfatória)
- [ ] Substituir relatório preliminar da CONITEC pela versão final quando o MS publicar

### Fase 2 — Coração & Metabolismo — **concluída em código e mesclada em 17/09/2026** (checklists manuais 2a/2b e revisão de textos pendentes)
- [x] Referências vigentes no acervo (`referencias/REFERENCIAS.md`, seção Fase 2)
- [x] Decisões clínicas C-010–C-014 aprovadas e documentadas (`02-DECISOES.md`, `funcionamento/coracao-metabolismo.md`)
- [x] Spec técnica (`docs/superpowers/specs/2026-09-17-nero-fase2-cardio-design.md`) — em revisão
- [x] PDFs e planilhas do PREVENT (Khan 2023/2024 + suplemento) no acervo (17/09/2026)
- [x] Minha Pressão (registro simples + médias/gráficos) (§1) — plano 2a
- [x] MRPA: protocolo guiado, tela diária, relatório em tela (§2–3) — plano 2a (PDF na Fase 3)
- [x] Alertas de pressão em camadas (§4) — plano 2a
- [x] Glicemia: registro com momento + contexto, plano de monitorização, relatório (§5–8) — plano 2b
- [x] Meus Exames: laboratoriais e cardiológicos com valor estruturado (§9–11) — plano 2b (anexo na Fase 3)
- [x] Risco cardiovascular PREVENT com preenchimento automático e regras de "dado recente" (§13–18) — plano 2b; coeficientes gerados da planilha oficial do suplemento de Khan 2024 e validados contra os exemplos da própria planilha
- [ ] Medicações + lembretes (§21–22)
- [ ] Dashboard cardiovascular, linha do tempo, check-up "como está minha prevenção?" (§19–20, §24)

### Fase 3 — Minha Saúde (transversal) + Relatórios — **em andamento desde 17/09/2026**
- [x] Decisões D-007 (PDF no aparelho + QR com URL assinada), D-008 (documentos), D-009 (consulta por especialidade), D-010 (central de lembretes)
- [x] Spec técnica: `docs/superpowers/specs/2026-09-17-nero-fase3-minha-saude-relatorios-design.md` — em revisão
- [x] Meu Perfil / Histórico / Exames (central única com filtros) / Medicamentos / Documentos (§59)
- [x] Linha do tempo geral (§60)
- [x] Central de relatórios em PDF: cardiovascular, oncológico, geral (§26, §40, §61)
- [x] "Preparar minha consulta" por especialidade (§62)
- [x] Central de lembretes / notificações (§63)
- [x] Nuvem (`db push` 0011) e merge em `desenvolvimento-2` (18/09/2026)
- [ ] Checklist `checklists/fase-3.md` e revisão de textos pelo Murilo; correções sob demanda

### Fase 4 — Saúde & Bem-estar — **iniciada em 18/09/2026**
- [x] Decisões clínicas C-015–C-020 aprovadas (18/09/2026)
- [x] D-011 (medidas corporais em `medidas`) · Spec técnica: `docs/superpowers/specs/2026-09-18-nero-fase4-bem-estar-design.md` — em revisão
- [x] Plano 4a: `docs/superpowers/plans/2026-09-18-nero-fase4a-corpo-atividade-sono.md` (7 tasks)
- [ ] Plano 4b (alimentação, conexão, metas, check-in, relatório, merge)
- [ ] Meu Corpo: peso, altura, IMC, cintura, cintura/altura, composição corporal (§70–73, §83–84)
- [ ] Minha Alimentação: diário simples + resumo de hábitos (§74–76)
- [ ] Minha Atividade + metas (§77–79)
- [ ] Meu Sono (§80)
- [ ] Conexão alimentação ↔ glicemia ↔ atividade (§81)
- [ ] Minhas Metas, Meus Hábitos, Check-in semanal, bem-estar (§82, §85–87)
- [ ] Relatório de Saúde & Hábitos (§88)

---

## Log de progresso

| Data | Fase | O que foi feito |
|------|------|-----------------|
| 18/09/2026 | 4 | D-011 decidida (opção A). **Spec técnica da Fase 4 escrita** (dois planos: 4a corpo/atividade/sono; 4b alimentação/conexão/metas/check-in/relatório). |
| 18/09/2026 | 4 | **C-015–C-020 aprovadas** uma a uma. C-016 corrigida para o corte sul-americano de cintura (≥ 90/≥ 80) com base no material da professora do Murilo (IDF 2009) = ABESO 2016 Tabela 5. Verificado: nenhuma sociedade brasileira adotou a Lancet 2025 com cortes próprios; diretriz conjunta 2025 (ABC) no acervo. Próximo: spec técnica da Fase 4. |
| 18/09/2026 | 4 | **Fase 4 iniciada.** Acervo verificado e baixado: ABESO 2016 (4ª ed., diagnóstico), ABESO 2026 (farmacológica, 5ª ed. — não substitui as tabelas de 2016), e-book Obesidade Controlada 2023, OMS cintura 2011, OMS atividade física 2020, Guia MS 2021 (gestores + suplementar; completo pendente de download manual), AASM/SRS 2015 (sono). Propostas C-015–C-020 registradas em `02-DECISOES.md`, em aberto. |
| 18/09/2026 | 3 | **Merge da Fase 3 em `desenvolvimento-2`** (`a736e7e`, no GitHub). Nuvem migrada (0011: documentos, compartilhamentos + bucket `relatorios`, consultas, preferências). Pendente: checklist e revisão de textos pelo Murilo; `supabase test db` local quando o Docker estiver ligado. |
| 18/09/2026 | 3 | **Plano da Fase 3 implementado** (branch `nero-fase3-minha-saude`, Tasks 1–8 exceto nuvem/merge): migração 0011, Meus Documentos (câmera/galeria/PDF, anexos nos exames), núcleo puro de relatórios (26 seções, D-009, HTML com ressalvas literais, QR), PDF no aparelho + QR com URL assinada de 7 dias, Preparar minha consulta, central de lembretes + preferências + consultas + Home, central de exames, linha do tempo geral, índice reorganizado. 304 Jest. Docs: `funcionamento/minha-saude.md` §3–§8, `revisao/2026-09-18-*`, `checklists/fase-3.md`. **Pendente:** `supabase db push` (senha), checklist e revisão pelo Murilo, teste do `qrcode`/`expo-print` no aparelho, merge. Projeto saiu do iCloud (estava lento) e voltou a `~/Desktop`. |
| 17/09/2026 | 3 | **Fase 3 iniciada.** D-007–D-010 aprovadas (sem decisão clínica nova: fase de integração e documentos). Spec técnica escrita. |
| 17/09/2026 | 2 | **Merge da Fase 2 em `desenvolvimento-2`** (`nero-fase2b-glicemia-risco`, que contém a 2a). 270 Jest + 19 pgTAP. Nuvem migrada (0010) e semeada (pressão 7, glicemia 9, risco 4). Pendências: checklists 2a/2b e revisão de textos pelo Murilo; correções sob demanda. |
| 17/09/2026 | 2b | **Task 4 concluída:** Murilo baixou artigo, statement e material suplementar do PREVENT; coeficientes gerados por script da planilha oficial (Tabelas S12); equação com idade² (30 anos), HbA1c (5,3), ln(RAC) e SDI ausente; 5 exemplos oficiais reproduzidos nos testes. Cálculo de risco ativo no app. |
| 17/09/2026 | 2b | **Plano 2b implementado** (branch `nero-fase2b-glicemia-risco`, Tasks 1–3 e 5–9): 13 regras novas semeadas (glicemia 9, risco 4), motor de glicemia, dado recente, check-up, agravantes, CKD-EPI, estrutura do PREVENT (Task 4 — coeficientes — pendente dos PDFs), serviços, telas de glicemia (4), exames (3), risco (4), check-up, linha do tempo, dashboard completo e Home. 262 Jest + 19 pgTAP. Pendente: semente na nuvem, checklists 2a e 2b do Murilo, merge. |
| 17/09/2026 | 2a | **Plano 2a implementado** (branch `nero-fase2a-pressao`, 9 tasks): migração 0010, 7 regras de pressão, motor `regras/cardio` (pressão, MRPA, lembretes), serviços, telas de Minha Pressão, MRPA guiada e relatório, dashboard, sinais de alerta, Home e lembretes de medicação. 201 Jest + 17 pgTAP. Pendente: checklist do Murilo, `db push` e merge. |
| 17/09/2026 | 2 | **Fase 2 iniciada.** Acervo verificado e baixado (DBHA 2025 substitui 2020; Medidas PA 2023 substitui MRPA 2018; Dislipidemias 2025; SBD 2026 × 5 capítulos). C-010–C-014 aprovadas pelo Murilo, cada uma validada no texto da diretriz vigente. Funcionamento por funcionalidade em `funcionamento/coracao-metabolismo.md`. Spec técnica escrita: `docs/superpowers/specs/2026-09-17-nero-fase2-cardio-design.md` (entrega em dois planos, 2a e 2b). Pendente: download manual dos PDFs do PREVENT (Khan 2023/2024 + suplemento). |
| 14/09/2026 | — | Documento NERO importado e estruturado em `docs/nero/`. Roadmap e registro de decisões criados. Início da discussão de arquitetura. |
| 14/09/2026 | 0 | D-001 decidida: evoluir o código atual — Rastreando vira módulo, construímos a camada anterior (Home com módulos + perfil único). |
| 16/09/2026 | 1 | **Fase 1 implementada** (13 tarefas): 5 handlers, 62 regras semeadas, telas completas do Rastreando, Home integrada. 160 testes Jest + 12 pgTAP. Banco na nuvem migrado (0008, 0009) e semeado. Documento de revisão clínica gerado. **Merge em `desenvolvimento-2`.** |
| 15/09/2026 | 1 | C-001, C-005 e C-008 validados em fontes primárias (CBR 2023 PDF, ACG 2021 PDF, notas SBU). Acervo `docs/nero/referencias/` criado. Plano da Fase 1 escrito: `docs/superpowers/plans/2026-09-15-nero-fase1-rastreando.md` (13 tarefas). |
| 15/09/2026 | 1 | Decisões clínicas C-001–C-009 aprovadas; 6 validadas nos textos-fonte (INCA 2025 PDF, CONITEC 2026 PDF, USPSTF, ACR Lung-RADS, SBU). Spec da Fase 1 escrita: `docs/superpowers/specs/2026-09-15-nero-fase1-rastreando-design.md`. |
| 15/09/2026 | 0 | **Fase 0 encerrada.** Push para `github.com/murilin1711/rastreio-app` (`origin`; remoto antigo `app-de-rastreio` não existia mais e foi removido). Próximo: Fase 1 — decisões clínicas C-001..C-009. |
| 15/09/2026 | 0 | Supabase remoto criado e migrado (`db push`); RLS validado na nuvem; app apontando para produção. Home v2 (pendências como tarefas, galeria 2×2) e declarações negativas ("não uso medicamentos"). |
| 15/09/2026 | 0 | Onboarding v3 aprovado no aparelho pelo Murilo (gradiente marinho + miniaturas do produto). Fundo interno branco frio. **Merge de `nero-fundacao` em `desenvolvimento-2`** (`b9de3c1`). Teste pgTAP corrigido para não depender do estado do banco. |
| 15/09/2026 | 0 | Tasks 1–11 do plano implementadas na branch `nero-fundacao`: Expo 57, Supabase local, auth, motor de regras, perfil, Minha Saúde, medicamentos, Home. 59 testes Jest + 4 pgTAP verdes. Falta: checklist manual e projeto Supabase remoto. |
| 15/09/2026 | 0 | Spec da Fundação aprovada pelo Murilo. Plano de implementação escrito: `docs/superpowers/plans/2026-09-15-nero-fundacao.md` (12 tarefas). |
| 14/09/2026 | 0 | D-006 decidida: mascote Nero (PNG por módulo agora; GLB 3D como spike futuro). Todas as decisões técnicas iniciais fechadas. |
| 14/09/2026 | 0 | D-005 decidida: Fundação entrega dashboard com 4 módulos (3 "em breve") → Rastreando é o 1º módulo completo. |
| 14/09/2026 | 0 | D-003 (regras: parâmetros em tabela + lógica TS testada) e D-004 (remover lado profissional) decididas. |
| 14/09/2026 | 0 | D-002 decidida: migração total para Supabase (Auth + Postgres/RLS + Storage). Firebase sai. Banco novo, sem migração de dados. |
