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
>
> **Princípio (Murilo, 15/09/2026):** os parâmetros seguem **integralmente a diretriz brasileira vigente e as referências listadas na especificação** (§27: sociedades brasileiras → MS/INCA/CONITEC → internacionais só onde as nacionais não detalham). Sem simplificações de implementação. Antes de escrever cada regra, o texto-fonte é consultado; o Murilo só é acionado quando a diretriz deixa margem ou quando fontes brasileiras divergem.

| ID | Tema | Decisão | Fonte | Ano | Revisado em |
|----|------|---------|-------|-----|-------------|
| C-001 | Mama: risco habitual **e alto risco** | **Validado no texto completo (Urban et al. 2023, PDF do CBR).** Risco habitual: MG anual 40–74; ≥ 75 continuar se expectativa de vida ≥ 7 anos → "acompanhamento médico". **Alto risco (→ "avaliação individualizada", com a regra citada na mensagem):** (a) mutação BRCA1 ou 1º grau portadora não testada → MG anual desde o diagnóstico da mutação, não antes de 35 (RM não antes de 25); (b) TP53 → MG não antes de 30 (RM não antes de 20); (c) BRCA2/outros genes de moderado-alto risco → MG e RM não antes de 30; (d) risco ≥ 20% ao longo da vida por modelo matemático baseado em história familiar → MG e RM anuais **10 anos antes do parente mais jovem, não antes de 30**; (e) radioterapia torácica antes dos 30 → MG anual a partir do **8º ano** após o tratamento (não antes de 30), RM não antes de 25; (f) HLA/CLIS/HDA → estimar risco por modelo; < 20% MG anual aos 40, ≥ 20% desde o diagnóstico (não antes de 30); (g) história pessoal de câncer de mama tratado → MG anual (conservadora: 6 meses após RT; mastectomia: contralateral 1 ano após) → "acompanhamento especializado"; (h) mamas densas → MG anual 40–74 + US anual adjunta pode ser considerada. O app não calcula modelos de risco (Tyrer-Cuzick etc.): forte história familiar → orienta estimativa com o médico. **Verificação 15/09/2026:** Nota Técnica da CNM (27/01/2025) reafirma a recomendação de 2023 — vigente. **Texto educativo sobre o SUS atualizado:** desde set/2025 o MS oferece mamografia **bienal dos 50 aos 74** e, **dos 40 aos 49, sob decisão compartilhada** com o profissional (antes: 50–69). | Urban LABD et al., CBR/SBM/FEBRASGO, *Radiol Bras* 2023;56(4):207-14 · Nota Técnica CNM 2025 · MS set/2025 (notícia FEBRASGO; ato normativo a localizar) | 2023 / 2025 | 15/09/2026 ✔ |
| C-002 | Colo do útero: DNA-HPV | **Validado na diretriz INCA 2025 (texto completo).** Início aos 25 anos (Rec. 1); negativo → repetir em 5 anos (Rec. 18); **encerrar quando o último teste acima dos 60 anos for negativo** (Rec. 12); >60 sem teste prévio → fazer o teste, negativo encerra (Rec. 13) → status "acompanhamento médico"; NIC 2/3 ou AIS tratadas → manter até 25 anos após o tratamento (Rec. 14); histerectomia total benigna com exames prévios normais → excluída (Rec. 34); histerectomia por lesão precursora/câncer → coleta vaginal ≥ 25 anos (Rec. 35); sem história de atividade sexual → não rastrear (Rec. 36). **HIV/imunossupressão:** iniciar após início da atividade sexual (Rec. 37), não encerrar (Rec. 38), intervalo **3 anos** após negativo (Rec. 39), qualquer HPV positivo → colposcopia (Rec. 40). **Condutas pós-teste (Rec. 18–25, lidas no texto):** 16/18 → colposcopia (Rec. 19); outros tipos → citologia reflexa; reflexa alterada (≥ ASC-US) **ou insatisfatória** → colposcopia (Rec. 20); teste inválido → nova coleta (Rec. 21); reflexa negativa → repetir DNA-HPV em 12 meses (Rec. 22); novo teste negativo → 5 anos (Rec. 23); novo 16/18 → colposcopia (Rec. 24); **outros persistente com reflexa negativa → mais 12 meses; positivo aos 24 meses → colposcopia independentemente da reflexa (Rec. 25)**. Citologia só onde o DNA-HPV não chegou: trienal após dois anuais negativos (Rec. 28). | INCA, *Diretrizes para o Rastreamento do Câncer do Colo do Útero*, 3. ed., 2025 (PDF completo) · Portaria SAES/SECTICS 13/2025 | 2025 | 15/09/2026 ✔ |
| C-003 | Colo do útero: citologia (transição) | **Validado (INCA).** 25–64 anos com atividade sexual; anual; após dois exames anuais normais consecutivos → a cada 3 anos; encerrar após 64 com histórico regular normal. Citologia só onde o DNA-HPV ainda não está implantado (Rec. 30 da diretriz 2025: interromper citologia onde a transição ocorreu). | INCA — Detecção precoce do câncer do colo do útero (2016/2025) | 2016 | 15/09/2026 ✔ |
| C-004 | Colorretal: FIT | **Validado no relatório CONITEC 2026 (Rec. 5–8; aprovado pela Conitec em 23/06/2026, publicação pelo MS pendente).** Início aos 50; "final do rastreamento aos 75 anos" (Rec. 6) → **faixa codificada 50–74** (último FIT aos 74, como na divulgação oficial "50 a 74 anos"); FIT bienal, risco padrão; FIT positivo → colonoscopia (pendência). **Regras adicionais do texto:** colonoscopia completa e de qualidade → repetir só em **10 anos** e **sem FIT nesse intervalo**; "risco padrão" exclui CCR/pólipos adenomatosos prévios, DII e Lynch/PAF (pessoal ou familiar) → esses viram "avaliação individualizada"; sintomáticos investigam independentemente do calendário (§52). | CONITEC, Diretrizes Brasileiras do Rastreamento do Câncer de Cólon e Reto, relatório preliminar CP 20 | 2026 | 15/09/2026 ✔ |
| C-005 | Colorretal: história familiar | **Validado (ACG 2021, Rec. 9–12, texto literal).** CCR ou pólipo avançado em **1 parente de 1º grau < 60 anos** ou em **≥ 2 parentes de 1º grau** em qualquer idade → colonoscopia a partir dos **40 anos ou 10 anos antes do parente mais jovem** (o que vier primeiro), repetida **a cada 5 anos** → status "avaliação individualizada" com a idade calculada na mensagem + orientar avaliação genética se carga familiar alta (Rec. 10). **1 parente de 1º grau ≥ 60** → iniciar aos 40 (ou 10 anos antes) e depois seguir risco médio (Rec. 11). **Parente de 2º grau** → risco médio (Rec. 12). Usada porque a CONITEC define "risco padrão" sem detalhar história familiar não sindrômica. | Shaukat A et al., ACG Clinical Guidelines: CRC Screening 2021 (PDF no acervo) | 2021 | 15/09/2026 ✔ |
| C-006 | Pulmão: critérios TCBD | **Validado (USPSTF 2021, texto literal).** 50–80 anos, ≥ 20 maços-ano, fumante atual ou cessação ≤ 15 anos; TCBD anual; interromper ao completar 15 anos sem fumar ou se condição limita expectativa de vida/cirurgia. | USPSTF, Lung Cancer: Screening (Grau B), endossada pela SBPT | 2021 | 15/09/2026 ✔ |
| C-007 | Lung-RADS | **Validado na tabela oficial ACR v2022.** 1 e 2 → LDCT em 12 meses (verde) · 3 → 6 meses (amarelo, controle) · 4A → 3 meses, PET/CT opcional (laranja, investigação) · 4B/4X → TC diagnóstica/PET/biópsia/encaminhamento (vermelho, especializado) · 0 → comparação com prévio ou LDCT 1–3 meses (cinza, complementação) · modificador S não altera categoria. Nota 2: intervalo conta **a partir da data do exame**. Nota 16: câncer diagnosticado → sai do rastreamento. | ACR Lung-RADS v2022 | 2022 | 15/09/2026 ✔ |
| C-008 | Próstata: decisão compartilhada | **Decidido pelo Murilo em 15/09/2026 (opção A): seguir o Posicionamento formal SBU/SBOC/SBRT (nov/2023).** Discussão individual sobre rastreamento com PSA para homens **acima de 50 anos com expectativa de vida > 10 anos**; e para **homens entre 40 e 50 anos com histórico familiar de câncer de próstata, etnia negra ou mutação patogênica em BRCA** → conversa a partir dos **40**. Acima de 75 → "acompanhamento médico" (só com expectativa > 10 anos — notas SBU 2018/2020). Obesidade/síndrome metabólica: apenas fator de risco educativo (a campanha Novembro Azul 2025, que cita 45 anos e obesidade, é fonte secundária e diverge do posicionamento formal). **Periodicidade: sem intervalo automático** — a SBU fala em "avaliações periódicas"; o app pergunta a data que o médico definiu (§49). PSA acima da referência do laboratório → "avaliação médica recomendada"; nunca ponto de corte único. Texto educativo apresenta a posição do INCA/MS (não rastreamento populacional). | SBU/SBOC/SBRT Posicionamento 2023 · SBU Nota Oficial 2018 · Aconselhamento 2020 · INCA/MS Nota Técnica 2023 | 2023 | 15/09/2026 ✔ |
| C-009 | BI-RADS 3: intervalo padrão quando o laudo não especifica | 6 meses (controle, amarelo). *(aprovado 15/09; a validar)* | ACR BI-RADS | — | 15/09/2026 |
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
