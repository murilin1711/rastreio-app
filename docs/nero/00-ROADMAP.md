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
- [ ] Decisões de arquitetura (D-001 ✅, D-002 ✅, D-003 ✅, D-004 ✅, D-005 ✅, D-006 ✅)
- [ ] Projeto Supabase criado (conta nova, região São Paulo) e credenciais em `.env` (nunca no código — corrige a chave exposta do Firebase)
- [ ] Substituir Firebase por Supabase: Auth (e-mail/senha), cliente, cadastro e login
- [ ] Modelo de dados compartilhado: Perfil de Saúde, Exame (com resultado estruturado), Medicação, Pendência, Lembrete, Documento anexado
- [ ] **Motor de regras clínicas**: funções puras `classificar(exame, perfil) → {classificação, nível de alerta, próxima ação, data, pendência, fonte/versão}` — 100% testado, sem dependência de UI (§31, §42, §43, §53, §65, §66)
- [ ] Hierarquia de segurança implementada no motor (§66): sintoma de alarme > pendência > acompanhamento especializado > rastreamento habitual
- [ ] Autenticação + cadastro do Perfil de Saúde único (§28, §59, §64)
- [ ] Shell de navegação com os 4 módulos + Home com "o que precisa de atenção" (§55, §56, §89)
- [ ] Design system consolidado (aproveitar `Theme.ts` e `components/ui`)

### Fase 1 — Rastreando v2 (oncológico)
Migrar o módulo que já existe para a nova base — valida o motor de regras com o domínio já conhecido.
- [ ] Definição dos protocolos adotados por câncer (idade início/fim, intervalo, exame) — decisão clínica do Murilo, com fonte
- [ ] Elegibilidade por perfil → "Seus rastreamentos" com os 8 status (§28)
- [ ] Estrutura padrão por câncer: entenda / preciso rastrear? / fatores de risco / sinais de alerta / meus exames (§29)
- [ ] Árvores de decisão: Mama (BI-RADS §44), Colo (HPV-DNA + citologia §45), Colorretal (FIT + colonoscopia §46–47), Pulmão (maços-ano + Lung-RADS §48), Próstata (PSA longitudinal §49)
- [ ] Pendências + vínculo "este exame resolve uma pendência anterior?" (§50–51)
- [ ] Alertas de sintomas com prioridade sobre calendário (§52)
- [ ] Dashboard oncológico + linha do tempo (§37, §39)

### Fase 2 — Coração & Metabolismo
- [ ] Minha Pressão (registro simples + médias/gráficos) (§1)
- [ ] MRPA: protocolo guiado, tela diária, relatório automático (§2–3)
- [ ] Alertas de pressão em camadas (§4)
- [ ] Glicemia: registro com momento + contexto, plano de monitorização, relatório (§5–8)
- [ ] Meus Exames: laboratoriais e cardiológicos com valor estruturado + anexo (§9–11)
- [ ] Risco cardiovascular PREVENT com preenchimento automático e regras de "dado recente" (§13–18)
- [ ] Medicações + lembretes (§21–22)
- [ ] Dashboard cardiovascular, linha do tempo, check-up "como está minha prevenção?" (§19–20, §24)

### Fase 3 — Minha Saúde (transversal) + Relatórios
- [ ] Meu Perfil / Histórico / Exames (central única com filtros) / Medicamentos / Documentos (§59)
- [ ] Linha do tempo geral (§60)
- [ ] Central de relatórios em PDF: cardiovascular, oncológico, geral (§26, §40, §61)
- [ ] "Preparar minha consulta" por especialidade (§62)
- [ ] Central de lembretes / notificações (§63)

### Fase 4 — Saúde & Bem-estar
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
| 14/09/2026 | — | Documento NERO importado e estruturado em `docs/nero/`. Roadmap e registro de decisões criados. Início da discussão de arquitetura. |
| 14/09/2026 | 0 | D-001 decidida: evoluir o código atual — Rastreando vira módulo, construímos a camada anterior (Home com módulos + perfil único). |
| 15/09/2026 | 0 | Spec da Fundação aprovada pelo Murilo. Plano de implementação escrito: `docs/superpowers/plans/2026-09-15-nero-fundacao.md` (12 tarefas). |
| 14/09/2026 | 0 | D-006 decidida: mascote Nero (PNG por módulo agora; GLB 3D como spike futuro). Todas as decisões técnicas iniciais fechadas. |
| 14/09/2026 | 0 | D-005 decidida: Fundação entrega dashboard com 4 módulos (3 "em breve") → Rastreando é o 1º módulo completo. |
| 14/09/2026 | 0 | D-003 (regras: parâmetros em tabela + lógica TS testada) e D-004 (remover lado profissional) decididas. |
| 14/09/2026 | 0 | D-002 decidida: migração total para Supabase (Auth + Postgres/RLS + Storage). Firebase sai. Banco novo, sem migração de dados. |
