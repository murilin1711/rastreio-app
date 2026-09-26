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

### D-007 · Como gerar e compartilhar os relatórios em PDF (§26, §40, §61, §62) — DECIDIDA (17/09/2026)
**Contexto:** três relatórios (cardiovascular, oncológico, geral) e "Preparar minha consulta" por especialidade; o paciente leva ou envia ao médico. O Murilo pediu também um QR code que o médico escaneie.
**Opções:** (a) gerar no aparelho com `expo-print` (HTML → PDF) e compartilhar pelo menu do sistema (`expo-sharing`); (b) Edge Function gera no servidor; (c) híbrido.
**Decisão:** **(a)**, com QR code: o PDF é gerado no aparelho; se o paciente pedir o QR, o app envia o PDF ao bucket privado `relatorios/<user_id>/…` e cria uma **URL assinada com validade de 7 dias** (recurso do Storage, sem código de servidor). O QR (na tela e no rodapé do PDF) contém essa URL; o médico abre o PDF no navegador. O paciente pode "Encerrar compartilhamento" (apaga o arquivo → link morre). Quem só compartilha por WhatsApp/e-mail não envia nada ao servidor. Tela web navegável para o médico fica para fase futura.
**Motivo:** dados de saúde não saem do aparelho para gerar o documento (LGPD); zero infraestrutura; compatível com offline futuro; QR resolvido com URL assinada expirável e revogável.
**Consequências:** dependências `expo-print`, `expo-sharing`, `react-native-qrcode-svg` (ou geração de QR em SVG puro); migração com bucket `relatorios` (políticas por pasta do usuário, como `laudos`) e tabela `compartilhamentos` (id, user_id, tipo_relatorio, caminho, expira_em, revogado_em) para listar/revogar. Layout: cabeçalho NERO (nome, nascimento, período), seções na ordem da spec, tabelas, gráficos simples em HTML, rodapé com as ressalvas literais do §26/§40.

### D-008 · Meus Documentos: anexos de laudos e imagens (§9–§10, §59) — DECIDIDA (17/09/2026)
**Contexto:** bucket privado `laudos` e coluna `exames.anexos` existem desde a Fase 0 sem uso; a spec pede anexar laudo/imagem ao exame e uma área "Meus Documentos" que inclua documentos avulsos (receita, alta, vacinação).
**Opções:** (a) tabela `documentos` própria; (b) só `exames.anexos` (jsonb).
**Decisão:** **(a)** — `documentos (id, user_id, exame_id opcional, tipo: laudo | receita | atestado | imagem | outro, nome, caminho, mime, tamanho, data_documento, observacao, created_at)`, RLS por dono. Anexo de exame = linha com `exame_id`; documento avulso = sem. Captura por câmera/galeria (`expo-image-picker`) e PDF (`expo-document-picker`); imagens comprimidas (máx. 2000 px, JPEG ~80 %); limite 10 MB. Leitura sempre por URL assinada de 1 h. `exames.anexos` fica sem uso (compatibilidade).
**Motivo:** comporta documentos sem exame, permite listar/filtrar/apagar e mantém o dado clínico estruturado separado do arquivo.

### D-009 · "Preparar minha consulta": conteúdo por especialidade (§62) — DECIDIDA (17/09/2026)
**Contexto:** decisão de produto validada pelo Murilo (médico); a spec dá só os exemplos de cardiologia e mastologia.
**Decisão:** bloco **sempre presente** (perfil: idade, sexo, comorbidades, tabagismo; medicamentos ativos com "desde quando"; documentos anexados no período; ressalva final) + prioridades por consulta:
- **Cardiologia:** MRPA e PA (médias/gráfico), glicemia (resumo), LDL/HDL/CT/TG, creatinina/TFG, ECG/eco/teste ergométrico/Holter/MAPA/CAC, último PREVENT com dados usados, agravantes.
- **Endocrinologia:** glicemia com metas e plano, HbA1c, perfil lipídico, TSH, peso/IMC, PA (resumo), PREVENT.
- **Clínica médica:** check-up n/8, PA, glicemia/HbA1c, lipídios, função renal, rastreamentos aplicáveis com status e pendências, PREVENT.
- **Ginecologia:** colo do útero (DNA-HPV/citologia/colposcopia, seguimento), mama (mamografias, BI-RADS), história familiar, menopausa, distúrbios gestacionais.
- **Mastologia:** mamografias/BI-RADS e complementares, fatores modificadores (genética, RT torácica), história familiar.
- **Urologia:** PSA (evolução e data definida pelo médico), história familiar de próstata, raça/cor.
- **Gastro/coloproctologia:** FIT, colonoscopias e achados, DII, história familiar de CCR.
- **Pneumologia:** carga tabágica (maços-ano, cessação), TCBD/Lung-RADS.
- **Oncologia:** todos os programas com histórico completo, pendências, sintomas de alarme.
- **Outra:** relatório geral.
Período padrão: medidas dos últimos 180 dias; exames e rastreamentos sem limite (últimos de cada tipo + histórico resumido).
**Motivo:** o médico recebe primeiro o que decide a consulta; o restante fica no relatório geral.

### D-010 · Central de lembretes e preferências de notificação (§63) — DECIDIDA (17/09/2026)
**Contexto:** cada módulo já agenda notificações locais e grava em `lembretes`; a spec pede central única com escolha do que receber, mantendo pendências clínicas visíveis no app.
**Decisão:** (1) tela "Meus lembretes" em Minha Saúde — próximos 30 dias de todos os módulos, agrupados por dia, com origem e atalho; histórico dos últimos 30 dias. (2) `perfil_saude.preferencias_lembretes` (jsonb) com um interruptor por tipo — exame próximo/vencido · MRPA · glicemia · medicamento · consulta · atualização clínica; desligar cancela só as **notificações do celular** daquele tipo; itens da Home e das telas nunca desligam. (3) Tipo novo **consulta**: tabela `consultas (id, user_id, especialidade, data_hora, local, observacao)`; lembrete 1 dia antes e, no dia, sugestão de "Preparar minha consulta" com a especialidade. (4) Sem horário de silêncio próprio (o sistema já tem "Não perturbe").
**Motivo:** unifica o que já existe sem reescrever os agendadores; respeita a exigência da spec de manter alertas clínicos visíveis.

### D-011 · Fase 4: medidas corporais ficam em `medidas` (tipos novos), não em tabela própria — DECIDIDA (18/09/2026)
**Contexto:** `medidas` já guarda `pa`, `glicemia` e `peso` (usado pelo PREVENT e pelo check-up) com `valores` em JSON.
**Decisão:** opção A — tipos novos `cintura`, `quadril` e `composicao` na mesma tabela (`valores`: `{ cm }`, `{ cm }`, `{ gordura_pct, massa_magra_kg, massa_muscular_kg, agua_pct, gordura_visceral, tmb_kcal, metodo }`); `peso` ganha `metodo` opcional em `valores`. `sono` também fica em `medidas` (o tipo já existia desde a Fase 0). Refeições, atividades, check-ins, metas e vínculos de glicemia têm tabelas próprias (`refeicoes`, `atividades`, `checkins`, `metas`, `vinculos_glicemia`), porque não são "medidas" e têm campos distintos.
**Motivo:** mesmo padrão dos módulos anteriores, sem migração de dados nem duplicação do peso; PREVENT e check-up continuam lendo de onde leem.

---

### D-012 · Preparação para as lojas: configuração nativa, build e limpeza de dependências — DECIDIDA (18/09/2026)
**Contexto:** `app.json` era o esqueleto do Expo (ícone placeholder, sem textos de permissão, sem `eas.json`); `expo-sensors` e `lottie-react-native` estavam instalados sem nenhum import; não havia canal Android de notificações nem handler de primeiro plano.
**Decisão (executada pelo Claude, sem dado externo):**
- `app.json`: plugins `expo-image-picker` (câmera/fotos em português, microfone bloqueado), `expo-document-picker`, `expo-notifications` (cor `#0F2D63`, canal padrão `lembretes`); `ITSAppUsesNonExemptEncryption: false` (o app só usa HTTPS); `CFBundleLocalizations: pt-BR`; `buildNumber`/`versionCode` 1; `blockedPermissions` RECORD_AUDIO e READ_MEDIA_VIDEO.
- `eas.json`: perfis `development`, `preview` (APK + iOS interno, para TestFlight/teste interno) e `production` (`autoIncrement`, submit Android na faixa `internal`). `appVersionSource: remote`.
- `src/core/lembretes/configurar.ts`: `setNotificationHandler` + canal `lembretes`; chamado em `app/_layout.tsx`; agendadores passam `channelId`.
- Removidos `expo-sensors` e `lottie-react-native`; patches do SDK 57 atualizados (`expo-doctor` 21/21).
- Rascunho da política de privacidade em `docs/nero/publicacao/politica-de-privacidade.md`, escrito a partir das tabelas e buckets reais.
**Pendente de decisão do Murilo:** bundle id / package (permanente), nome nas lojas, contas Apple/Google, hospedagem da política, exclusão de conta no app (D-013).
**Motivo:** nada disso depende de dado externo e tudo é pré-requisito de qualquer `eas build`.

---

### D-013 · Exclusão de conta dentro do app — DECIDIDA (18/09/2026)
**Contexto:** App Store (guideline 5.1.1(v)) e Play (política de exclusão de dados) exigem que o usuário consiga apagar a conta pelo próprio app. Não existia.
**Decisão:** função SQL `public.excluir_minha_conta()` (`security definer`, só `authenticated`) que apaga a linha em `auth.users` do próprio `auth.uid()`; todas as tabelas caem por `on delete cascade`. O Storage bloqueia `delete` direto em `storage.objects` (trigger `protect_delete`), então o app esvazia `laudos` e `relatorios` pela Storage API antes (`src/core/sessao/excluirConta.ts`) e a função **recusa** (`P0001`) se ainda houver arquivo — nunca fica objeto órfão. Tela `Minha Saúde → Excluir minha conta` (`app/(app)/minha-saude/excluir-conta.tsx`): lista o que será apagado, sugere gerar o PDF geral antes, exige digitar EXCLUIR + confirmação nativa, faz logout local ao terminar. Migração `0014_excluir_conta.sql`; 9 testes pgTAP (`excluir_conta.test.sql`) + 4 Jest.
**Alternativa descartada:** Edge Function com `service_role` — mais peça para manter e chave sensível fora do banco.
**Pendente:** `db push` da 0014 para a nuvem (senha do Murilo); testar no aparelho (checklist de publicação).

---

### D-014 · Nome nas lojas: "Nero Saúde" — DECIDIDA (18/09/2026)
**Decisão do Murilo.** "Nero" sozinho conflita com a Nero AG (software); "Nero Saúde" é o nome do app na App Store, no Play e sob o ícone (`expo.name`). A marca visual continua "Nero" (logo). Slug e scheme (`nero`) não mudam.
**Pendente:** bundle id / package; verificar disponibilidade do nome na App Store Connect ao criar o registro do app.

---

### D-015 · Mascote animado: clipes image-to-video → WebP animado via `expo-image` — DECIDIDA (19/09/2026)
**Contexto:** o Murilo quer o Nero vivo (piscar, acenar, comemorar). Tem o modelo 3D rigado no Meshy, mas o caminho Meshy → Blender → PNGs foi considerado difícil demais; só animação por código (flutuar/escalar) ficaria estático.
**Decisão:** gerar clipes curtos por IA a partir do PNG final, sobre o bege do app (sem transparência), converter para WebP animado e exibir com `expo-image`. Conjunto e prompts em `docs/nero/mascote/animacoes.md`. Componente `NeroAnimado` substitui `NeroImage` onde indicado.
**Motivo:** zero passo manual em software 3D, resultado com o acabamento do render, arquivos leves, mesma reprodução em iOS e Android. Rig 3D em tempo real segue como spike futuro.

### D-016 — Onde o Nero comemora (e onde não comemora) — 19/09/2026

**Contexto:** com o clipe "comemorar" pronto, era preciso decidir em quais momentos do app ele aparece.
**Decisão:** o Nero comemora apenas em conquistas de **comportamento** — meta atingida (Bem-estar → Metas, quando a distância chega a zero) e sequência de hábitos (Meus hábitos) —, além de um ponto a definir em Minha Saúde. **Não** comemora em rastreamento, resultados de exame nem na conclusão da MRPA.
**Motivo:** no Rastreando, "em dia" significa que o exame foi feito no prazo, não que o resultado veio normal; e o relatório da MRPA traz a classificação da pressão. Comemorar nesses pontos faria o usuário ler a festa como "deu tudo certo" — exatamente a confusão que o tom calmo do §66 e as ressalvas §25/§26 existem para evitar. Palavras do Murilo: "não pode confundir com nenhum resultado, por exemplo MRPA às vezes pode estar ruim e comemorar por terminar e achar que foi bom". Conquista de comportamento é o que a pessoa fez; resultado clínico é o que o corpo dela mostrou, e só o segundo pode ser mal interpretado.
**Implementado em 19/09/2026 (parte A):** marcos de **50 % e 100 %** das metas de peso e cintura. A meta passa a guardar `valor_inicial` (a medida do dia em que foi criada) e `marco_comemorado` (migração 0015). Progresso = `(inicial − atual) / (inicial − alvo)`: a mesma fórmula serve para reduzir e para ganhar peso. O marco é comemorado uma vez e **nunca é retirado** — afastar-se do alvo não gera aviso nem desfaz a conquista. Metas criadas antes da migração ficam sem ponto de partida e só têm o marco de 100 %. Atividade, sono e fortalecimento não entram: são metas de período (semana, noite) e não têm "meio caminho".
**Implementado em 19/09/2026 (parte B):** quatro conquistas pontuais de "primeira vez" — perfil concluído, primeiro registro de atividade, primeira noite de sono, primeiro check-in (tabela `conquistas`, migração 0016; chave primária `(user_id, chave)`, sem coluna de "vista" nem remoção). **"Terminar uma pendência" foi descartado pelo Murilo em 19/09:** no app, pendência é objeto do Rastreando, e resolvê-la significa que o exame foi feito, não que o resultado veio normal — o mesmo argumento que tirou a MRPA. Detecção por contagem no banco, não pela lista de 30 dias do `useHabitos` (quem tem atividade antiga ganharia uma "primeira vez" falsa). Apresentação: **modal no meio da tela** (`ModalComemoracao`), com o que aconteceu e um **incentivo para continuar** registrando, específico por conquista — o mesmo componente passou a ser usado também nos marcos de meta. "Primeira medida do corpo" foi retirada do conjunto pelo Murilo.
**Corrigido no mesmo dia, depois do teste no aparelho:** (1) a conquista do perfil disparava para todo mundo, porque `perfil_inicial_completo` é marcada no cadastro obrigatório da entrada do app (`app/perfil-inicial.tsx`) — passou a exigir também medicações e antecedentes familiares resolvidos (informados ou marcados como "não tenho"), que é o que o Murilo quis dizer com "tudo vai servir para o médico avaliar melhor"; (2) o clipe comemorar congelava no último quadro, com o Nero encolhido e de olhos fechados — o modal passou a usar `entrada="comemorar"` com volta ao repouso; (3) a comemoração aparecia só ao voltar ao módulo, e agora aparece no momento do registro (telas de registrar sono, registrar atividade e check-in), segurando a volta até o modal fechar. O hook ganhou `auto: false` para as telas de registro não avaliarem ao abrir o formulário.
**Implementado em 19/09/2026 (parte C):** sequência de dias com registro. **Conta como dia qualquer coisa que gere dado** (decisão do Murilo: atividade, refeição, medida, check-in, exame, documento, consulta, medicação, lembrete, antecedente, sessão de MRPA, meta) — as mensagens falam só de dias e nunca do que foi registrado, para não transformar "registrei minha mamografia" em conquista. **Quebrar a sequência não gera aviso nem perda:** ela recomeça em silêncio e o total de dias da vida continua. Marcos em 3, 7, 30 e 100 dias, cada um comemorado uma vez (`perfil_saude.marco_sequencia_comemorado`, nunca diminui). A sequência segue viva quando o último registro foi ontem, e só zera depois de um dia inteiro sem nada. Tabela `dias_ativos` preenchida por **gatilho no banco** (migração 0017), não pelas telas, para qualquer registro contar automaticamente — inclusive os que vierem depois. **Limite conhecido:** o gatilho fixa o fuso `America/Sao_Paulo`, então erra por um dia para quem usar o app em outro fuso; a alternativa (mandar o dia local do celular) exigiria instrumentar toda tela de registro, atual e futura. Selo na Home, ao lado da saudação, que some sozinho quando a sequência zera. **Ficou de fora:** lembrete do tipo "você vai perder sua sequência" — é o mecanismo que mais gera registro falso, e o app já tem lembretes clínicos disputando a atenção.
**Implementado em 19/09/2026 (parte D1):** módulo **Minha Água**. Registro em `medidas` (tipo `agua`), meta em `metas` (tipo `agua_ml`), migração 0018. Como o registro entra em `medidas`, beber água já conta para a sequência de dias pelo gatilho da parte C. Comemoração **diária** (decisão do Murilo): repete a cada dia em que a meta é batida, uma vez por dia (`perfil_saude.agua_meta_comemorada_em`). **Implementado em 19/09/2026 (parte D2):** lembretes de água por **janela + intervalo** (decisão do Murilo): a pessoa escolhe de que horas a que horas quer ser lembrada e de quanto em quanto tempo. **Intervalo mínimo de 1 hora** — notificação de água de 15 em 15 minutos vira ruído, a pessoa desliga tudo e junto vão os lembretes de medicação e exame, que importam de verdade. Configuração em `perfil_saude.lembretes_agua` (migração 0019), **desligada por padrão**, diferente dos outros tipos, porque exige escolher janela e intervalo antes. Água virou o sétimo interruptor da tela Minha Saúde › Lembretes › Preferências, com prefixo `agua:` no título, sem coluna nova, seguindo o desenho da D-010. Agendamento igual ao do plano de glicemia: cancela os pendentes e reagenda 7 dias. **Quem tem doença renal ou insuficiência cardíaca não recebe lembrete**, pelo mesmo motivo de não receber meta calculada.

### C-021 — Meta de ingestão de água — 19/09/2026

**Aprovado pelo Murilo em 19/09/2026, com o levantamento de fontes à vista.** Meta sugerida = **35 ml/kg/dia de água bebida**, arredondada para 50 ml, editável pelo usuário ou pelo profissional.
**O levantamento (`referencias/agua.md`) estabeleceu que não existe diretriz recomendando "2 litros por dia":** EFSA 2010 (2,0 L ♀ / 2,5 L ♂) e IOM 2005 (2,7 L ♀ / 3,7 L ♂) são de **água total**, incluindo a água dos alimentos (~20 % pelo IOM), e o IOM rejeita explicitamente a regra dos copos. A ESPEN 2019/2022 dá 1,6 L ♀ / 2,0 L ♂ de **bebidas**, mas para idosos. O "35 ml/kg" **não tem documento de sociedade brasileira**: as menções da SBN são material de divulgação, e a atribuição à OMS não pôde ser confirmada — a origem real é o cálculo de necessidade hídrica de nutrição clínica (30–40 ml/kg/dia).
**Motivo da escolha (Murilo):** o usuário não tem como estimar a água dos alimentos, então a meta precisa ser do que ele bebe e consegue contar. O app chama o número de estimativa, nunca de recomendação, e diz na tela de onde ele vem.
**Limite de segurança:** quem marcou **doença renal** ou **insuficiência cardíaca** não recebe meta calculada — nesses casos o volume é conduta médica (ASBRAN/BRASPEN 2021: em hemodiálise depende do ganho de peso interdialítico). O campo `tem_insuficiencia_cardiaca` foi criado na 0018 porque o perfil não tinha como identificar esse grupo.


---

### D-017 — Pedir a permissão de notificações com contexto — 19/09/2026

**Contexto:** a permissão do sistema era pedida dentro de `notificacoesPermitidas()`, chamada por todos os agendadores. Na prática a caixa do iOS aparecia no meio de outra ação — ao registrar o primeiro exame, ao abrir a Home com medicação cadastrada, ao salvar o plano de glicemia —, sem o app ter explicado o que ia avisar.
**Motivo:** no iOS, negar é quase definitivo: o app não pode perguntar de novo e a pessoa precisa ir aos Ajustes do sistema. Quem nega sem entender perde os lembretes de rastreamento, que são o centro do produto.
**Decisão:** separar consultar de pedir. `permissaoConcedida()` e `podePerguntar()` apenas consultam, e são o que os agendadores usam; `pedirPermissaoNotificacoes()` passou a ser chamado só por ação explícita — o botão "Tentar ativar" em Rastreando › Lembretes e o novo `ModalAtivarAvisos`.
**O modal** explica os três avisos que importam (exame chegando na data, horário de medicamento, véspera de consulta), oferece "Ativar avisos" e "Agora não", e só aparece **quando já existe lembrete pendente** — perguntar na tela vazia do primeiro acesso seria o mesmo pedido sem contexto. "Agora não" adia 14 dias neste aparelho (AsyncStorage, porque a permissão é do aparelho e não da conta) e **não** consome a chance de perguntar.
**Detalhe que faltava:** os lembretes criados enquanto não havia permissão foram gravados sem `notif:<id>` e nunca virariam aviso. Conceder a permissão agora dispara `reagendarTudo()`, que recria as notificações de todos os tipos ligados.

---

### D-021 — Domínio, bundle id e URL da política — 22/09/2026

**Domínio registrado pelo Murilo em 22/09: `nerosaude.com.br`.** Destrava três pendências que estavam presas nele: remetente do e-mail (D-019), identificador nas lojas e hospedagem da política.

**Bundle id / package: `br.com.nerosaude.app`**, o mesmo nos dois sistemas (`app.json`, `ios.bundleIdentifier` e `android.package`). Escolhido por ser o **domínio invertido** de `nerosaude.com.br` (`com.br` → `br.com`), convenção oficial de Apple e Google. Como o Murilo controla o domínio, ninguém pode reivindicar `br.com.nerosaude.*` — o que importa num identificador **permanente**: trocá-lo depois do primeiro envio cria um app novo, perdendo avaliações, downloads e quem já instalou. O sufixo `app` deixa espaço para outros sob a mesma marca (`br.com.nerosaude.web`, `.pro`).
**Descartado `com.nerosaude.app`:** corresponde ao domínio `nerosaude.com`, que **não** é do Murilo — funcionaria, mas deixaria de ser um identificador comprovadamente seu. **Descartado `br.com.nerosaude.nero`:** "nero" repete o que "nerosaude" já diz.
**Verificado:** `expo-doctor` 21/21 depois da alteração.

**URL da política: `https://nerosaude.com.br/privacidade`**, já escrita na seção 13 do texto. Substitui a recomendação anterior de GitHub Pages: as lojas esperam a política no domínio do próprio app, e o Murilo agora tem um. Reversível — é só texto — se a hospedagem for outra.

---

### D-018 — Backup: projeto transferido para a organização que já tem Supabase Pro — 22/09/2026

**Contexto:** a política de privacidade (rascunho de 18/09) dizia "cópias de segurança do operador são sobrescritas em até 7 dias após a exclusão" — texto escrito supondo o plano **Pro**. Na verificação de 22/09 a documentação da Supabase é explícita: **o plano Free não tem backup automático nem para download**; a recomendação deles é o próprio dono exportar com `supabase db dump`. Manter aquela frase seria declarar uma cópia que não existe.

**Caminho percorrido (registrado porque as alternativas podem voltar à mesa):**
1. Primeira decisão do Murilo foi ficar no Free **sem dump**, com exclusão imediata e definitiva. Ele supôs que um dump declarado atrapalharia a aprovação nas lojas; **isso foi verificado e não procede** — nem Apple, nem Google, nem a LGPD proíbem backup declarado. O que reprova é manter cópia sem declarar.
2. Ao perguntar como receberia o backup automático no Free, ficou claro que **não existe o que receber**. As opções com paciente real eram: **(A)** Pro, **(B)** backup próprio automatizado (GitHub Actions + armazenamento gratuito, custo zero) ou **(C)** seguir sem nada.
3. **(C) foi descartada para o cenário com paciente real.** **(B) foi descartada** porque colocaria, fora da Supabase e **sob guarda do Murilo**, um acervo de prontuários de terceiros — exposição maior que a mensalidade.
4. O Murilo lembrou que **já tem uma organização com Pro**, e a assinatura é por organização.

**Decisão:** **transferir o projeto NERO para a organização que já assina o Pro.** Confirmado que a organização é **exclusivamente dele** — nenhum outro membro passa a ter acesso ao banco de prontuários, o que mantém coerência com a política (só ele responde pelos dados).

**Custo real:** **~US$ 10/mês a mais**, não US$ 25. A assinatura de US$ 25 é por organização e já é paga; o crédito de computação de US$ 10 também é por organização e já está consumido pelo projeto existente. O NERO entra como projeto adicional com servidor próprio (Micro, ~US$ 10). Fatura vai de US$ 25 para ~US$ 35. Criar organização nova só para o NERO custaria **duas assinaturas** (~US$ 50) — por isso a transferência.

**O que a transferência resolve:** backup diário com retenção de **7 dias**, fim da pausa por inatividade e nada de cópia sob guarda do Murilo. A seção 8 da política volta a declarar as cópias de 7 dias.

**Detalhes verificados:** exige ser dono da organização de origem e membro da de destino (ambas dele); **não muda a região** — continua São Paulo, como a política declara; exige **nenhuma integração GitHub ativa** no projeto; a indisponibilidade documentada é só no sentido pago → Free. Caminho: Settings › General › Transfer project.

**Obstáculo encontrado e resolvido:** a lista de destinos aparecia vazia porque a organização Pro está em **outro e-mail** do Murilo, e a transferência exige que a **mesma conta** seja dona da origem e membro do destino. Resolvido convidando a conta do NERO como **Owner** da organização Pro (Team › Invite member, convite válido por 24 h) — e **não** criando projeto novo com migração, caminho que foi considerado e descartado: projeto novo traria URL e chaves novas, exigiria migrar os usuários do Auth à mão (com risco de órfãos, já que o `user_id` carimba todos os registros) e reenviar um a um os arquivos dos buckets `laudos` e `relatorios`, que o dump não leva.

**Situação: transferência concluída pelo Murilo em 22/09.** Verificado do lado do código que **nada técnico mudou**: mesmo ref `ycljqpwpeoonqisqdrws`, mesma URL, chave anônima atual funcionando (REST e Auth responderam HTTP 200). O app não precisou de alteração.

**Pendência única:** confirmar em **Database › Backups** que os backups diários apareceram (o primeiro ciclo pode levar horas). **A política não deve ser publicada antes disso**, porque a seção 8 declara cópias de 7 dias.

**Consequência de segurança:** duas contas passam a ter acesso ao banco de prontuários. Ambas são do Murilo, então não há problema de privacidade, mas **as duas precisam de verificação em duas etapas** — a mais fraca define a segurança do conjunto.

**Limite do Free que deixa de valer após a transferência:** pausa após 7 dias de baixa atividade. O limite de **2 e-mails/hora** do Auth é do serviço embutido e continua contornado pelo Resend (D-019).

---

### D-019 — Confirmação de e-mail por código de 6 dígitos, enviado pelo Resend — 22/09/2026

**Contexto:** "reativar a confirmação de e-mail no Supabase Auth" já estava na fila de publicação. Com o Auth embutido no plano Free o limite é de **2 e-mails por hora**, o que inviabiliza cadastro real. O Murilo perguntou se a confirmação é mesmo necessária, já que **a maioria dos usuários será idosa** e é mais um passo.
**Decisão:** manter a confirmação, usando **SMTP próprio via Resend** (camada gratuita, remove o limite de 2/hora, custo zero) e **código de 6 dígitos**, não link.
**Por que confirmar, apesar do público idoso — o argumento se inverte:** a recuperação de senha só funciona por e-mail. Se a pessoa digita o e-mail errado no cadastro e ninguém confere, no dia em que esquecer a senha **perde o acesso permanente a todo o histórico de saúde** (exames, pressão, laudos), sem como provar que a conta é dela. Esquecer senha é o evento mais previsível nesse público. **O passo a mais no dia 1 é o que evita a perda total no dia 300.**
**Por que código e não link (o código é o caminho mais fácil, não o mais difícil):** o link exige sair do app, abrir o e-mail, tocar, abrir o navegador e o navegador conseguir devolver a pessoa ao app — cinco etapas, e a última falha com frequência. Com o código, **o app fica parado na tela "digite o código"**: a pessoa lê seis números no e-mail, volta e digita, sem o app ter saído do lugar, com "reenviar" ali mesmo.
**Como se implementa:** template de confirmação da Supabase usa `{{ .Token }}` no lugar de `{{ .ConfirmationURL }}`; validação com `verifyOtp({ email, token, type })`. Códigos: 1 pedido por 60 s, expiram em 1 h (configurável).
**Exigência de tela (Murilo: "tem que ser simples"):** campo grande, teclado numérico, colagem automática do código, mensagem sem jargão, botão de reenviar visível.

**Implementada no app em 22/09/2026** (falta só a configuração de painel, que depende do domínio):
- `src/core/auth/codigo.ts` (núcleo puro, 12 testes): `normalizarCodigo` aceita código colado com espaços ou com "Código:" junto — casos comuns que não deveriam virar erro; `segundosParaReenviar` arredonda **para cima**, para a tela nunca mostrar 0 com o botão ainda travado; `ehEmailNaoConfirmado` distingue o erro de confirmação pendente de senha errada.
- `app/(auth)/confirmar.tsx`: **verifica sozinha ao sexto dígito**, sem botão "confirmar" — um passo a menos. Campo grande, `number-pad`, `autoComplete="one-time-code"` (o iOS oferece o código do e-mail sozinho). Código errado mostra recado e deixa tentar de novo sem sair da tela. `verifyOtp({ type: 'signup' })`. 6 testes de regressão.
- **Buraco de UX fechado:** quem se cadastrava, não terminava e voltava para **entrar** travava num alerta sem saída. O login agora detecta o e-mail não confirmado, reenvia o código e leva para a mesma tela.
- **Compatível com o estado atual:** enquanto a confirmação estiver desligada, `signUp` devolve sessão e nada muda.
- Texto do e-mail pronto em `publicacao/email-confirmacao.md`, com o porquê de cada escolha (código em 40 px, sem jargão e **sem link nenhum** — e-mail de saúde com link treina o idoso a clicar em link de e-mail, hábito que golpistas exploram).
- **Ordem obrigatória:** ligar "Confirm email" na Supabase é o **último** passo. Antes disso o cadastro seguiria para uma confirmação que não chega.
**Configuração aplicada em 22/09/2026 e verificada no servidor** (`scripts/configurar-auth.mjs`, via Management API):
- SMTP do Resend (`smtp.resend.com:465`, usuário `resend`), remetente `nao-responda@nerosaude.com.br`, nome "Nero Saúde". Domínio `nerosaude.com.br` **verified** no Resend, região `sa-east-1` (São Paulo) — coerente com o que a política declara.
- Assunto e template com `{{ .Token }}`.
- **`mailer_otp_length` estava em 8** — o padrão da Supabase. O app pede 6 (`TAMANHO_CODIGO`), então o cadastro travaria com o e-mail mandando oito números. Corrigido para 6. **Achado pelo modo de simulação do script, antes de gravar qualquer coisa.**
- `mailer_otp_exp` 3600 (1 h) · `smtp_max_frequency` 60 s, casando com `ESPERA_REENVIO_S` da tela · `rate_limit_email_sent` de **2 para 100/hora** (2 era o limite do SMTP embutido).
- `mailer_autoconfirm: false` — a confirmação passou a ser **exigida** em 22/09. Não afeta contas já existentes.
- **Teste de ponta a ponta feito:** cadastro real pela API → log do Resend com `status=delivered`, assunto "Seu código do Nero Saúde", remetente do domínio próprio. Usuário de teste `nerosaude+teste1@gmail.com` (id `c8c75d7e-…`) **ficou no banco e deve ser apagado** em Authentication › Users.
- O script tem modo de simulação por padrão e só grava com `--aplicar`; ligar a exigência é uma flag separada (`--ligar-confirmacao`), para nunca travar cadastro antes de o envio estar provado. Os segredos entram por variável de ambiente e não são gravados em disco.

- **A confirmar no aparelho:** `type: 'signup'` é o que o template "Confirm signup" emite (`EmailOtpType` nos tipos instalados aceita também `'email'`). Se o código for recusado no teste real, é o primeiro lugar a olhar.

---

### D-020 — Relatório de Saúde & Hábitos passa a incluir água; sequência fica de fora — 22/09/2026

**Contexto:** pergunta deixada em aberto no handoff de 19/09. O relatório de hábitos não incluía nem a ingestão de água nem a sequência de dias.
**Decisão do Murilo:** **água entra; sequência não.**
**Motivo:** o relatório é o documento que vai para o médico, e nele entra **o que a pessoa registrou** — água é dado de saúde, comparável a sono e atividade, e útil na consulta. A sequência de dias seguidos é **métrica de adesão ao app**, não achado clínico: não diz nada sobre o paciente que o médico precise ler, e ainda arrisca ser lida como desempenho. Coerente com a D-016, que mantém comemoração e conteúdo clínico em trilhos separados.
**Implementada em 22/09/2026.** Seção `agua` em `SECOES_BEMESTAR`, entre alimentação e atividade; regra pura `resumoAguaSemana` em `src/core/regras/bemestar/agua.ts`. **A média divide pelos dias com registro, não por sete** — dia sem anotação não é dia sem beber, e lançar zero faria o médico ler ausência de registro como ingestão insuficiente. Teste de regressão garante que a **sequência não apareça** no relatório. Detalhes em `funcionamento/saude-bem-estar.md` §8.1.

**Achado durante a implementação:** `useAgua.test.tsx` **nunca havia rodado** — estourava na importação e o Jest contava a suíte como 0 testes, por isso os "420 testes" do handoff de 19/09 não a incluíam. Corrigido; os 2 testes passam. Total real agora: **430**.

---

---

---

### D-022 — Redesign da Home e do navbottom: tab bar nativa e blocos de cor — 22/09/2026
**Contexto:** o Murilo não gostou do dashboard da home nem do navbottom, e pediu inspiração nas HIG da Apple (iOS 26 / Liquid Glass).
**Decidido:** (1) trocar `Tabs` JS por `expo-router/unstable-native-tabs` — Liquid Glass, ícone ativo em `.fill` e acessibilidade vêm do sistema; (2) quatro abas, todas de telas existentes: **Início · Agenda · Histórico · Minha Saúde**, promovendo `minha-saude/lembretes` e `minha-saude/linha-do-tempo`, que já são cross-módulo; (3) os módulos **não** entram na barra — continuam na grade 2×2 da home, agora em **blocos de cor cheia com só cor e nome**, sem número nem descrição; (4) a logo do NERO fica na home (decisão do Murilo, contra a recomendação da HIG) e o avatar vira item da barra superior; (5) cor e tipografia ficam como estão.
**Estrutura:** as abas vão para o grupo `app/(app)/(tabs)/` — `hidden` nas abas nativas torna a rota inalcançável (`types.d.ts:473`), então esconder Rastreando/Coração/Bem-estar da barra não é opção. Grupo é invisível na URL: os caminhos existentes continuam válidos.
**Em aberto:** a composição do topo (duas finalistas calibradas pelo Murilo). **Descartados:** botão central elevado (não existe na HIG) e aba "Registrar" (tela ainda não existe).
**Detalhes:** `docs/nero/design/2026-09-22-redesign-home-navbottom.md`

---

### D-023 — O Nero pensando é a espera das operações longas — 23/09/2026
**Contexto:** o quarto clipe do mascote (pensando, em loop) ficou pronto. Os três pontos onde ele estava previsto — gerar PDF, calcular risco e enviar documento — mostravam a espera como spinner **dentro do botão**, e o mascote não cabe ali: em ≤44 px ele vira mancha azul.
**Decidido:** componente `EsperaNero` (`src/ui/components/EsperaNero.tsx`) — modal com véu, cartão branco no centro, Nero pensando, uma linha do que está acontecendo e uma segunda do tempo esperado, com **Cancelar**. O botão que dispara passa a `disabled` em vez de `loading`, para não haver dois indicadores de espera na tela.
**Números**, calibrados pelo Murilo no painel interativo (mesma forma que resolveu o topo da home em D-022): mascote **152 px**, véu **45 %** (`rgba(15,45,99,0.45)`), Cancelar **sim**, segunda linha **sim**, texto `"Gerando seu relatório…" / "Isso leva alguns segundos."`.
**Formas descartadas:** bloco de tela cheia trocando o conteúdo (perde de vista o relatório, que é longo) e manter o spinner onde a espera é curta (dois padrões de espera no mesmo app confundem mais do que a demora incomoda).
**O que "Cancelar" significa em cada ponto** — nenhuma das três operações aborta de verdade no meio, então o cancelamento age no resultado: no **PDF** descarta o arquivo gerado (é temporário, do cache) e não abre o compartilhamento; no **risco** só não navega ao resultado — o cálculo fica guardado e quem voltar a calcular não perde nada; no **documento** o upload já entregou o arquivo ao bucket, então a tela **apaga o órfão** (`apagarArquivo`) e não grava o registro. Este último é o único com efeito colateral real e está coberto por teste (`src/core/documentos/__tests__/telaNovoDocumento.test.tsx`).
**Piso de 2 s** (23/09/2026, pedido do Murilo depois de ver no aparelho): as três operações terminam em menos de um segundo, e a espera aparecia e sumia num piscar — no PDF a folha de compartilhamento chegava a abrir por cima da animação. `completarPiso(inicio)` segura a espera até completar `PISO_ESPERA_MS = 2000` a partir do instante em que ela apareceu; quando a operação demora mais que isso, não acrescenta nada. No PDF, a espera **fecha antes** de compartilhar, com `aguardarTrocaDeModal()` (350 ms) no meio: no iOS uma folha apresentada enquanto o modal anterior ainda faz o fade simplesmente não aparece. Coberto por `src/core/relatorios/__tests__/telaPreviaPdf.test.tsx`, com relógio simulado.
**Detalhes do clipe:** `docs/nero/mascote/animacoes.md` → Clipe 4.

---

### D-024 — Barra sempre inteira, saída verde das pendências e o mascote maior — 23/09/2026
**Barra de abas:** `minimizeBehavior="never"`. O padrão do iOS 26 encolhe a barra para a esquerda ao rolar, deixando só o ícone da aba atual; o Murilo não quis. Nada mais do comportamento nativo muda.
**Saída verde (`SaidaConcluida` + `useSaidaConcluida`):** a pendência resolvida desaparecia da lista sem aviso quando o exame relacionado era registrado. Agora ela se pinta de verde pastel com um tique, o subtítulo vira "Pendência concluída", segura, e só então encolhe — 1,2 s no total (260 ms para o verde, 620 de pausa, 320 para sumir). Vale na lista do Rastreando e na tela dedicada de Pendências.
**Duas decisões dentro dela:** (1) com **Reduce Motion** ligado o item sai direto, sem animação — é o que o sistema pede; (2) a comparação fica **congelada enquanto a lista carrega**, senão qualquer recarga que esvazie a lista por um instante pintaria tudo de verde como se tivesse sido resolvido. Coberto por `src/ui/components/__tests__/saidaConcluida.test.tsx`.
**Mascote**, calibrado pelo Murilo no painel: na **Home** vai de 84 para **135** e perde o `translateY: -6` (com o tamanho novo ele não precisa mais ser puxado para cima); em **Minha Saúde** continua em 96, na borda direita como já estava, mas com **30 de margem** para sair da beirada e **`translateY: -11`** para alinhar com a linha do nome.
**Observação para depois:** em Minha Saúde o mascote tem quase o dobro da altura do bloco de texto ao lado ("Minha Saúde" + nome). Se o cabeçalho voltar a incomodar, o caminho não é distância nem tamanho — é a estrutura do cabeçalho.

---

### D-025 — "Levar ao médico": uma porta só para relatório e consulta — 23/09/2026
**Contexto:** o Murilo perguntou qual era a diferença entre "Relatórios" e "Preparar minha consulta", e entre o relatório cardiovascular e a consulta de cardiologia. A comparação mostrou que são quase o mesmo documento e que a diferença que existia estava errada. Diretriz dele: *"tudo tem que ser bastante claro para não ter dúvidas para seu João ou dona Maria de 70 anos; o Nero não quer complicar a vida e sim facilitar."*
**Decidido:** (1) os dois itens de Minha Saúde viram **um só, "Levar ao médico"**, que abre onde ficavam os Relatórios; (2) dentro, o **Resumo completo vem primeiro, marcado "Recomendado"**, seguido dos três recortes por assunto, e abaixo de todos a entrada "Vou a um médico específico"; (3) o documento por especialidade passa a ser **focado com o resto ao fim** — o que não é da especialidade sai da frente mas não some, sob "Outras informações do meu histórico"; (4) a escolha do médico abre com a **consulta já marcada** e lista as especialidades em **linguagem comum** ("Médico do coração") com o termo técnico menor embaixo.
**Correções clínicas:** HbA1c, IMC, tabagismo, check-up e pendências entram na cardiologia (o PREVENT que o app calcula usa HbA1c, IMC e TFG como entradas); função renal e alimentação na endocrinologia; **tabagismo nas dez especialidades**, a pedido do Murilo — *"o tabagismo é muito importante"*; pendências e sintomas nas listas curtas. **Nenhum parâmetro clínico foi criado ou alterado** — são seções que já existiam entrando em listas de prioridade.
**Defeitos corrigidos:** `agua` estava fora do `SECOES_GERAL` — o documento que promete tudo não tinha tudo; e montar o complemento duplicava a seção de pendências, por reaplicar a regra §66.
**Descartado:** sair sempre completo (perde o foco de quem lê) e manter as duas portas com nomes melhores (continuariam parecendo duas coisas parecidas).
**Consequência aceita:** o PDF por especialidade cresce — a mastologia sai de ~1 página para 6 ou 8. Aceitável porque o caminho principal passou a ser o Resumo completo, que já seria grande.
**Detalhes:** `docs/nero/design/2026-09-23-levar-ao-medico.md`

---

### D-026 — Rastreamento que não se aplica ao perfil sai do relatório; a folha de compartilhar espera o modal sair — 23/09/2026
Dois acertos pedidos pelo Murilo depois de usar o app.

**1. "Não é aplicável ao seu perfil" não vai para o papel.** Mama num perfil masculino, próstata num feminino: a seção saía impressa só para dizer que não se aplica. Agora é omitida — tanto a seção quanto a linha na tabela de rastreamentos.
**O que tornou isso possível sem perder informação:** `nao_indicado_no_momento` cobria **dois** casos no mesmo status — "não se aplica ao seu perfil" (definitivo) e "você ainda não chegou na faixa etária" (temporário). `ResultadoElegibilidade` ganhou o campo `naoAplicavel`, marcado só no primeiro. O segundo continua aparecendo: saber que a colonoscopia começa aos 45 é informação útil na consulta.
**Exceção:** havendo exame ou pendência registrada no programa, a seção fica mesmo não sendo aplicável — o dado existe e precisa chegar ao médico.

**2. Gerar PDF não compartilhava.** Regressão de D-023, no mesmo dia. A animação rodava, terminava, e nada acontecia: nem folha de compartilhamento, nem erro.
**Raiz:** no iOS a folha é um view controller, e apresentá-la enquanto o modal da espera ainda faz o dismiss faz o sistema **descartá-la em silêncio**. O `aguardarTrocaDeModal()` de 350 ms não resolvia porque o contador começava antes de o dismiss iniciar — esconder o modal só agenda um re-render. O mesmo explica por que nenhum alerta de erro aparecia: um `Alert` nessa janela sumiria igual.
**Correção:** esperar a condição, não o relógio. `useFechamentoDaEspera()` resolve no `onDismiss` do próprio `Modal`, com limite de 900 ms para o Android (onde `onDismiss` não dispara) e para o caso de o evento se perder. `aguardarTrocaDeModal` e `MS_TROCA_DE_MODAL` foram removidos.
**Coberto por:** `src/core/relatorios/__tests__/telaPreviaPdf.test.tsx` (a folha só abre após o aviso de fechamento; e abre assim mesmo se o aviso nunca vier) e `montar.test.ts` (quatro casos da omissão por perfil).

---

### D-027 — O "nada pendente" não pisca mais, e o conteúdo não fica sob a barra de abas — 23/09/2026
**1. Verde falso na abertura.** Ao abrir o app, a home mostrava por um instante "Nada pendente" (verde) e depois o substituía pelas pendências reais. Não era animação nem renderização: `montarItensHoje` emite esse item sempre que a lista sai vazia, e nos primeiros frames ela sai vazia porque o perfil já chegou mas rastreamento, cardio, consultas e hábitos ainda não. O "tudo em dia" era uma afirmação sobre dados que não existiam ainda.
**Correção:** `montarItensHoje` ganhou `pronto`; sem ele o item verde não é emitido. Os outros itens continuam saindo — um perfil incompleto é fato assim que o perfil chega, não precisa esperar o resto. A home calcula `pronto` das cinco fontes.
**Efeito colateral corrigido junto:** `useResumoCardio` não expunha `carregando`, e seu `catch` engolia a falha em silêncio. Agora expõe, e fecha no `finally` — sem isso, um erro no resumo do cardio deixaria a home esperando para sempre e o verde nunca voltaria.

**2. Cards embaixo da barra de abas.** A barra flutuante do iOS 26 fica **sobre** o conteúdo e o sistema não desconta esse espaço do scroll, então o último card da home encostava nela. `useEspacoAbas()` soma altura da barra (58) + folga (24) + área segura do aparelho ao `paddingBottom`, e as **quatro** telas de aba passaram a usá-lo — o defeito era de todas, não só da home.
**Coberto por:** quatro casos em `src/modules/home/__tests__/montarItensHoje.test.ts`.

---

### D-028 — Declaração negativa com "Desfazer" de 15 s — 24/09/2026
**Contexto:** o Murilo pediu de volta a pendência de medicamentos na conta dele. Investigando: ele havia tocado em "Não uso medicamentos" na Home, o que grava `sem_medicacoes` no perfil — e **não havia como desfazer pela interface**. O único caminho de volta era cadastrar um medicamento de verdade (`medicamentos.tsx:52`). O mesmo valia para "Não há casos na família".
**Decidido:** ao declarar, o item **fica no lugar**, pintado de verde, com **"Desfazer"** e uma linha de 2 px escoando na base por **15 segundos**; ao fim, sai com o mesmo fade da saída concluída. Reaproveita `SaidaConcluida` (D-024), que ganhou a prop `aoDesfazer`.
**Como se marca:** tocando na **bolinha** do item, que antes era só decorativa. Ela só fica tocável onde a declaração é possível — medicamentos e antecedentes; nas outras pendências resolver exige registrar algo de verdade.
**O alerta de confirmação fica.** Eu havia tirado, no raciocínio de que "tem certeza?" + "desfazer" é pedir a mesma coisa duas vezes; o Murilo pediu de volta com um argumento melhor: **o alerta é a única hora em que a pessoa aprende onde completar aquela informação depois** ("adicione em Minha Saúde › Meus medicamentos"). O desfazer cobre o arrependimento, não a desinformação — são coisas diferentes.
**Forma do desfazer:** um **cartão próprio, colado na base do item e da mesma largura**, com o fio do tempo escoando nele. A primeira versão punha o botão sobreposto à direita, disputando espaço com o texto e a seta; ficou confuso e foi refeita. Enquanto o tempo corre, a bolinha do item aparece marcada com o tique verde, e o card **não** se pinta de verde inteiro — o verde vive na bolinha e no cartão.
**Detalhes de comportamento:** a gravação acontece na hora (não fica pendurada nos 15 s), e desfazer grava o valor de volta — assim nada se perde se o app fechar no meio. O índice do item é guardado para ele não pular para o fim da lista ao sair da fonte. Falha ao salvar devolve o item ao estado normal e avisa.
**Reduce Motion:** aqui a espera é respeitada mesmo com o movimento reduzido — sem ela não haveria como voltar atrás. Só as transições de cor e de saída ficam instantâneas.
**Coberto por:** três casos em `src/ui/components/__tests__/saidaConcluida.test.tsx`.
**Em aberto:** as telas de Meus medicamentos e Antecedentes familiares continuam sem um botão para reverter a declaração depois que os 15 s passaram — quem perder a janela ainda precisa cadastrar um item de verdade.

**Correções do mesmo dia, depois de ver funcionando:**
- **A bolinha voltou a não ser tocável.** Cheguei a torná-la clicável a pedido, mas ela e a linha "Não uso medicamentos" faziam exatamente a mesma coisa. O Murilo perguntou qual era a diferença — não havia — e escolheu ficar só com a linha escrita, que é a que se anuncia.
- **A bolinha marca só o que o app não sabe sozinho.** Ficou o critério: declarações ("não uso medicamentos", "não há casos na família") são fato que só o paciente conhece; "atualizar minha prevenção" é **calculado** (3 de 8), e deixar marcar criaria contradição com o relatório e o item voltaria sozinho na abertura seguinte. O mesmo vale para exame atrasado e MRPA.
- **O cartão de desfazer virou irmão do item:** mesma borda de 1 px, mesmo raio, mesma largura, mesmo padding — só o verde o distingue. A primeira versão era uma faixa sem borda e destoava do card de cima.
- **Desfazer deixou de piscar.** O cartão recolhe em altura junto com o verde, em 220 ms, e só então o callback dispara. Antes o componente sumia no mesmo frame do toque.

---

### D-029 — O foguinho da sequência explica o que conta — 24/09/2026
**Contexto:** o selo de dias seguidos usa um foguinho, símbolo emprestado de app de hábito. Quem nunca usou um não tem como adivinhar o que o número conta — e o público do NERO não é o de quem usa app de hábito.
**Decidido:** o selo passa a ser tocável e abre um balão discreto embaixo, com uma frase: *"Dias seguidos em que você registrou alguma coisa no NERO. Some sozinho se você ficar um dia sem registrar — e nada acontece se isso ocorrer."* Um ícone de informação de 13 px, em cinza, avisa que há algo a tocar.
**Forma:** balão, não modal — explicar não deve interromper. Ele entra em fade de 180 ms, fica 6 s e sai sozinho; tocar de novo fecha antes. Centralizado no selo, senão os 260 px de largura transbordariam a tela.
**A segunda frase é deliberada:** *"nada mais muda"*. A sequência existe para incentivar, não para cobrar, e é a mesma razão pela qual o selo some em silêncio quando zera (D-016, 19/09).

**Segunda versão da frase, depois de o Murilo ler a primeira.** Ela dizia *"dias seguidos em que você registrou alguma coisa"*, e o problema apontado foi de incentivo: **convida a inventar dado** para manter o foguinho aceso. *"Vou registrar aqui uma pressão e dane-se."* A frase em uso agora:

> São os dias seguidos em que você anotou alguma coisa do seu dia: água, uma caminhada, o que comeu, uma medida de pressão. Serve para você acompanhar sua constância, então só vale o que aconteceu de verdade. Ficando um dia sem registrar o número volta a zero, e nada mais muda.

Ela nomeia o que é do dia a dia, diz que o número é da pessoa e não do app, e pede dado real. O gatilho no banco (`0017_dias_ativos.sql`) continua contando **qualquer** inserção em atividades, refeições, check-ins, medidas, exames, documentos, consultas, medicações, lembretes, antecedentes, MRPA ou metas — a frase orienta, não restringe.

---

### D-033 — Onboarding, login e a recuperação de senha que não existia — 24/09/2026
**Contexto:** o Murilo pediu para melhorar o onboarding e o login. *"Não sei o que me incomoda, só sei que não gostei do onboarding, achei pouco profissional e muito difícil de entender, e a página de login está ruim."*

**O que a investigação achou antes de qualquer desenho:** **não existia recuperação de senha.** Nenhum `resetPasswordForEmail`, nenhuma tela. Quem esquecesse a senha perdia o prontuário, sem saída pelo app. Com D-032 isso piorou: a senha virou também a saída de quem não consegue usar a biometria.

**Diagnóstico do onboarding, item a item:**
- O slide 2 era um **diagrama** (tronco e galhos ligando o perfil a três destinos). Diagrama exige interpretar uma metáfora antes de entender a mensagem.
- Os textos explicavam **o mecanismo**, não o ganho: *"o que você informa alimenta todos os módulos"*. E **"módulos" é palavra nossa**.
- O slide 3 se definia **pela negação** ("Orientação, não diagnóstico") e usava como exemplo, na última tela antes de entrar, **um resultado alterado de câncer colorretal**.
- Os cartões ficavam **tortos em ângulos irregulares** (−2°, +1,5°), o que lê como desalinho e não como pilha. Provável origem do "pouco profissional".

**Decidido:** três slides, **fundo claro**, mascote em cada um, exemplos em linhas legíveis (rótulo pequeno em cima, dado em destaque embaixo). Textos reescritos para o ganho: *Tudo num lugar só · Você conta uma vez só · O NERO avisa a hora* — o terceiro mantém a ressalva, mas no fim da frase.
**Login sem o mascote**, a pedido do Murilo: *"no login não precisa não, vamos deixar mais minimalista, senão fica muito repetitivo"*. Campos de 56 px e "Esqueci minha senha" alinhado à direita, abaixo da senha.
**Recuperação de senha:** tela nova, **código de seis dígitos** igual ao do cadastro. Link obrigaria a sair do app e voltar. E-mail que não existe devolve sucesso de propósito: dizer "esta conta não existe" contaria a um estranho quem tem conta. O template de recuperação foi adicionado ao `scripts/configurar-auth.mjs` — sem ele o Supabase mandaria o padrão dele, com link e em inglês.

**Método, que é a parte que interessa para a próxima vez.** Mandei **duas propostas prontas e as duas foram rejeitadas**, repetindo o padrão de D-022 (seis rejeições antes do painel resolver). Só na terceira voltei ao que funciona com ele: **painel interativo em tamanho real**, com controles de fundo, tamanho do mascote, conteúdo e espaçamento, e a instrução de que eu não proporia mais nada. Ele devolveu os números numa rodada. **Para composição visual, painel primeiro; conceito pronto só depois que a direção estiver fechada.**

**Dois erros meus, pegos antes de virarem bug:** ao reescrever o onboarding troquei a chave do `AsyncStorage` (`nero_onboarding_visto_v3`) e o destino do botão final (`/(auth)/login`). A primeira faria o onboarding reaparecer para quem já viu; a segunda mudaria o fluxo sem ninguém pedir. Ambas restauradas.

---

### D-032 — Bloqueio por biometria ao abrir o app — 24/09/2026
**Contexto:** ao validar D-031 no aparelho, o Murilo notou que o app abre direto na conta. É o comportamento normal de sessão salva, mas significa que **quem pegar o celular desbloqueado abre o prontuário**. Ele pediu Face ID.
**Decidido:** biometria **opcional, desligada por padrão**, com interruptor em Minha Saúde › Segurança. Pede ao abrir e ao voltar do segundo plano depois de **5 minutos**.
**Por que opcional:** parte do público tem dificuldade com biometria, e trancar alguém do lado de fora do próprio prontuário é pior do que o risco evitado. Quem quiser, liga.
**Por que 5 minutos e não sempre:** trocar para o WhatsApp e voltar em trinta segundos não pode pedir de novo. Pedir demais faz a pessoa desligar o recurso, e aí não protege ninguém.

**Quatro decisões de detalhe, todas para não trancar ninguém para fora:**
- **A biometria é pedida ANTES de ligar** o interruptor. Se o rosto não for reconhecido agora, ligar deixaria a pessoa sem acesso na próxima abertura.
- **`disableDeviceFallback: false`**: quando o rosto falha (máscara, pouca luz, óculos escuros), cai na senha do aparelho. Sem isso a única saída seria desinstalar o app.
- **Falha do próprio sistema biométrico pede a senha da conta**, em vez de liberar. Eu tinha feito liberar, argumentando que um erro de hardware não pode bloquear o prontuário; o Murilo corrigiu, e com razão: liberar sem nada abre o prontuário para quem estiver com o aparelho, e a pessoa tem uma credencial que ela mesma cadastrou. `pedirBiometria` passou a distinguir **negado** (rosto não bateu ou cancelou, dá para tentar de novo) de **erro** (o sistema não respondeu, tentar não adianta), e só o segundo leva ao campo de senha.
- **A preferência mora no cofre do aparelho, não no banco.** É escolha daquele aparelho: a mesma pessoa pode querer biometria no celular que leva na rua e não no tablet de casa.

**A tela de bloqueio não mostra dado nenhum** — só a marca. Nem nome, nem pendência, nem o número da sequência: ela existe justamente para que quem pegou o celular de outra pessoa não veja nada. E enquanto a preferência está sendo lida, a tela fica vazia, porque um piscar do conteúdo mostraria o que o bloqueio esconde.
**`NSFaceIDUsageDescription`** declarado no `app.json`: sem isso a Apple recusa na revisão.
**Coberto por:** 8 casos em `src/core/sessao/__tests__/useBloqueio.test.tsx`, incluindo o da troca rápida de app que **não** deve pedir de novo e os três do caminho da senha.

---

### D-031 — Endurecimento de segurança antes da publicação — 24/09/2026
**Contexto:** o Murilo trouxe uma lista de 22 itens de um vídeo sobre lançamento de app e pediu conferência item a item. Metade já estava resolvida; quatro valiam trabalho. O que foi feito e o que foi deliberadamente deixado de fora:

**1. Sessão fora do texto simples (feito).** O token vivia em `AsyncStorage`, legível em aparelho com jailbreak, backup não criptografado ou análise forense — e a sessão abre um prontuário. Foi para o Keychain/Keystore via `expo-secure-store`.
**Duas armadilhas resolvidas no adapter** (`src/core/supabase/armazenamentoSeguro.ts`): (a) o Keychain recusa item acima de **2048 bytes**, e a sessão do Supabase (JWT + refresh + user) passa disso, então o valor é dividido em pedaços de 1800; sem isso a gravação falharia calada e a pessoa não conseguiria entrar; (b) quem já estava logado seria deslogado pela atualização, então a primeira leitura migra o valor do `AsyncStorage` e apaga de lá. Coberto por 5 testes.

**2. Limite de upload no servidor (feito, migração `0020_limites_buckets.sql`).** O teto de 10 MB e a lista de tipos existiam só no app; quem tivesse um token subia qualquer coisa direto na API. Agora `laudos` aceita imagem e PDF e `relatorios` só PDF, ambos até 10 MB, **no bucket**. Verificado contra a nuvem: executável recusado com 415, PDF aceito.

**3. Rate limit (não alterado, pendente no painel).** Seis senhas erradas seguidas não foram bloqueadas. O limite existe em Authentication → Rate Limits, mas não foi conferido nem ajustado — é configuração de painel, não de código. **Mais eficaz que mexer nele:** ligar a proteção contra senha vazada (HaveIBeenPwned) e o tamanho mínimo de senha, na mesma tela.

**4. Vulnerabilidades de dependência (decidido NÃO corrigir).** São 15 moderadas, todas indiretas, vindas de **duas** origens: `decode-uri-component` (ReDoS) via `query-string` via `expo-router`, e `uuid` (bounds check) via `expo-sharing`. **`npm audit fix --force` rebaixaria o Expo do SDK 57 para o 46** — onze versões maiores para trás, o que destruiria o app. E o `npm audit fix` simples não resolve nenhuma, porque todas exigem major.
**Avaliação:** o `query-string` parseia rotas internas do app, não entrada de atacante; o `uuid` é usado em build e compartilhamento. Risco real próximo de zero contra um estrago garantido. Reavaliar quando o Expo atualizar as dependências dele.

**Itens da lista que não se aplicam:** consentimento de IA (o app não usa IA — passa a valer com o portal do médico), cookies (app nativo não tem), login Apple/Google (só é exigido se houver login social de terceiros, e não há). **Itens rejeitados por custo maior que o ganho:** criptografia por coluna (quebra busca e filtro, com RLS correto o ganho é baixo), bloqueio de mass assignment (o RLS já limita cada um à própria linha), trim de respostas (é performance, não segurança), SEO e cache (o site tem uma página).

**Verificação que vale registrar:** as **21 tabelas** foram testadas sem autenticação, com a chave pública. Todas devolveram vazio, e a tentativa de inserção foi recusada com `violates row-level security policy`. O RLS está íntegro.

---

### D-030 — Sem travessões nos textos do app — 24/09/2026
**Decidido pelo Murilo:** tirar o travessão (—) de todos os textos de interface.
**O que foi feito:** 70 ocorrências, tratadas em dois grupos.

| Uso | Exemplo antes | Depois |
|---|---|---|
| Rótulo + qualificador (46) | `Pressão arterial — medidas avulsas` | `Pressão arterial: medidas avulsas` |
| Rótulo que já tinha dois pontos | `Hoje: consulta às 14h — preparar` | `Hoje: consulta às 14h · preparar` |
| Travessão no meio da frase (24) | `Conta só o que você bebe — a água dos alimentos não entra.` | `Conta só o que você bebe. A água dos alimentos não entra.` |

**O que ficou:** o `—` sozinho, em 53 lugares, como notação de "sem valor" em tabelas e listas de relatório. Não é travessão de frase; é o símbolo de célula vazia.
**Texto clínico foi reescrito um a um**, sem mexer em parâmetro, prazo ou condição: as frases de mama (BRCA1, mamografia anual pós-tratamento), pulmão (tomografia de baixa dose) e água (restrição renal/cardíaca) mudaram só de pontuação.
**Resíduo corrigido junto:** a notificação de consulta e o onboarding ainda mandavam a pessoa para "Minha Saúde › Preparar minha consulta", nome que deixou de existir em D-025. Agora dizem "Levar ao médico".
**Testes:** nove afirmavam os textos antigos e foram atualizados, mais dois snapshots de HTML de relatório.

---

### D-034 — Lançar só para iPhone, e um documento para as pendências — 25/09/2026
**Contexto:** o primeiro build foi enviado ao App Store Connect e a Apple avisou que um app com `supportsTablet: true` precisa de capturas de iPad (2048 × 2732) para ser publicado. O Murilo perguntou se valia a pena e decidiu: *"desligar o suporte, mas colocar em algum lugar um documento de pendências para fazer"*.

**Por que desligar e não gerar as capturas:** capturas de iPad seriam honestas apenas se o app estivesse desenhado para tela larga, e ele não está. Os únicos `maxWidth` do código estão em modais; toda tela estica o conteúdo até a borda. No iPad, um cartão de pressão viraria uma faixa de 1000 px com um número no meio, e a barra de abas ficaria perdida na base de uma tela enorme. Publicar assim entregaria em iPad uma versão pior do app, com a mesma nota na loja.

**O que muda para quem tem iPad:** nada de imediato. O app continua instalável e roda em janela de iPhone, do mesmo jeito que rodaria hoje — só deixa de ser anunciado como app de iPad. Ligar de volta é uma linha no `app.json`, mas exige antes limitar a largura do conteúdo, repensar a grade de módulos e os formulários.

**A segunda metade do pedido virou `docs/nero/PENDENCIAS.md`**, com o que falta em quatro camadas: o que bloqueia a publicação, a configuração fora do código, os buracos funcionais conhecidos e as decisões adiadas **com o motivo do adiamento**. Sem o motivo, uma pendência antiga vira ou trabalho refeito ou uma decisão revertida sem querer — o iPad é exatamente o caso: daqui a três meses "por que não tem iPad?" precisa de uma resposta melhor que "não sei".

---

### D-035 — O piscar entre campos e etapas, e a saída do beco sem saída — 25/09/2026
**Contexto:** primeiro teste real no TestFlight. Antes de qualquer coisa de interface, um susto: o Murilo não conseguiu entrar, e o "Esqueci minha senha" não mandou e-mail nenhum.

**O diagnóstico, porque a conclusão foi contraintuitiva.** Verificado um a um: a URL e a chave publicável **estão** no binário (o primeiro `grep` falhou por encoding do bytecode Hermes, não por ausência — `strings` com `LC_ALL=C` achou as duas); o servidor de auth responde em 0,48 s; o SMTP do Resend está gravado, com remetente e senha. Nada quebrado. A causa era que **não existia conta com aquele e-mail** — e isso explica os dois sintomas de uma vez, porque `resetPasswordForEmail` devolve sucesso e não envia nada quando o e-mail não tem conta.

**O achado de produto veio do próprio diagnóstico.** A tela de recuperação avança para "Digite o código" mesmo sem conta, de propósito (D-033): dizer "esta conta não existe" contaria a um estranho quem tem conta no app. O preço é alguém esperando para sempre um código que não vem, sem nada na tela explicando. Se o diagnóstico custou meia hora a quem escreveu o código, quem errar uma letra no e-mail não sai de lá sozinho. **A linha nova nomeia as duas causas reais sem confirmar nenhuma:** *"Não chegou? Veja no spam. Se não estiver lá, confira se o e-mail está escrito certo e tente de novo."* O sigilo continua inteiro — a frase não afirma que a conta não existe.

**O piscar, duas causas distintas.** (1) **A borda do campo** trocava de `#DCE2EE` para `#0f2d63` no mesmo frame; ao passar de um campo para o outro, duas bordas mudavam de cor simultaneamente, uma apagando e outra acendendo. Agora a cor atravessa em 160 ms, com `useNativeDriver: false` (cor não é interpolada pela thread nativa). A espessura segue fixa em 1,5, então nada se mexe em volta — a correção é só de cor. Vale para os **32 arquivos** que usam o campo. (2) **As três etapas da recuperação** trocavam de conteúdo no mesmo frame, dentro da mesma tela, sem sinal de que a pessoa avançou. Agora o bloco entra deslizando 16 px no sentido da navegação, em 220 ms; o cabeçalho fica parado de propósito, porque é ele que diz que a tarefa é a mesma.

**Registrado junto:** o servidor aceita senha de 6 caracteres (`password_min_length`) enquanto o app exige 8. Alinhar no painel, em PENDENCIAS.

---

### D-036 — A tela de bloqueio cobre o app em vez de substituí-lo — 25/09/2026
**Contexto:** o Murilo, testando o Face ID no TestFlight: *"deixar mais clean a aparição da tela após colocar a senha. O jeito que carrega as informações, a página home, é meio piscando. Aparecem as informações primeiro, depois aparecem outras."*

**Causa raiz, no `app/_layout.tsx`.** O `Protegido` fazia `if (travado) return <TelaBloqueada/>` — ou seja, enquanto travado, o `<Stack>` **não existia**. Passar o rosto não revelava o app: montava o app inteiro do zero, com os oito hooks de dados da home começando a carregar naquele instante. O que parecia lentidão de rede era, na verdade, a árvore inteira nascendo depois da biometria.

**Correção:** a cobertura passa a ficar **por cima**, em `StyleSheet.absoluteFill`, com o `<Stack>` montado embaixo desde o início. Três consequências: o app carrega **enquanto** a pessoa se identifica, então o tempo do Face ID deixa de ser tempo perdido; a home já está pronta quando a cobertura sai; e a saída é um fade de 260 ms em vez de uma troca de tela num frame.

**Por que isso não abre o prontuário:** a `TelaBloqueada` é opaca (`backgroundColor` sólido) e ocupa a tela inteira, e `travado` e a cobertura mudam no mesmo commit do React — não há frame intermediário em que o conteúdo apareça.

**Fica de fora, e é diferente deste problema:** quem **não** liga o bloqueio (o padrão) continua vendo a home chegar aos pedaços no primeiro carregamento, porque cada fonte de dado se resolve na sua hora. Isso é carregamento progressivo, não desmontagem, e ainda não foi decidido.

---

### D-037 — A tolerância de 5 minutos nunca funcionou — 25/09/2026
**Contexto:** ao testar o Face ID no TestFlight, o Murilo relatou que o app só pede o rosto quando ele fecha o app de vez; saindo e voltando, não pede. Ele deu por bom (*"pode deixar do jeito que está"*), acreditando que a regra dos 5 minutos estava funcionando. **Não estava** — e a metade que faltava era a que protege.

**O defeito.** O iOS não alterna só entre `active` e `background`: passa por `inactive` nas duas pontas — `active → inactive → background` ao sair, e `background → inactive → active` ao voltar. O código tratava `inactive` como "saiu agora", então **o `inactive` da volta sobrescrevia a hora real da saída** e a conta do tempo dava sempre zero. Consequência: o app não pedia a biometria ao voltar do segundo plano, nem depois de cinco minutos, nem depois de três horas. O celular na mesa com o NERO aberto atrás abria o prontuário para quem o pegasse. O único caminho que ainda pedia era o relançamento do zero, que é o que o Murilo observou.

**O mesmo defeito na direção oposta:** `inactive` sozinho, sem `background`, é a central de controle, uma chamada chegando ou o próprio prompt do Face ID cobrindo a tela. Nada disso é sair do app, mas o código contava o tempo a partir dali e podia travar quem nunca saiu.

**Correção:** só `background` conta como saída. Uma linha.

**Por que os testes não pegaram:** eles simulavam `background → active`, uma sequência que o iPhone nunca emite. Passavam enquanto o app real não travava nunca. Agora há um bloco que usa a sequência de estados real, incluindo o caso da central de controle — três testes, e os dois primeiros falhavam antes da correção.

**Decisão do Murilo (25/09), depois de saber do defeito:** corrigir e manter os 5 minutos, como a D-032 tinha definido.

### D-038 — "Sair da conta" não saía — 25/09/2026
**Contexto:** no build 2 do TestFlight o Murilo relatou que o botão "Sair da conta" não funcionava.

**O defeito.** O `signOut()` funcionava: a sessão era apagada. O que faltava era alguém reagir a isso. Quem manda para o login é só `app/index.tsx`, e ele decide uma vez, na abertura, e sai da pilha com o `Redirect` para as abas. Depois disso nenhuma tela olhava a sessão, e a pessoa ficava dentro do app sem conta. A exclusão de conta (D-013) termina em logout e tinha o mesmo defeito: apagava tudo e deixava a pessoa na tela.

**Correção:** `Stack.Protected` no layout raiz (`app/_layout.tsx`, componente `Navegacao`). Com `guard` falso o roteador tira as telas de `(app)` e volta para `app/index.tsx`, que manda ao login. Vale para qualquer tela e qualquer fim de sessão, inclusive token expirado. Enquanto a sessão carrega, a guarda fica aberta, para quem toca num lembrete com o app fechado não cair no login antes de a sessão chegar.

**Duas tentativas erradas antes, no mesmo dia — registradas para ninguém repetir:**
1. `<Redirect href="/" />` em `app/(app)/_layout.tsx`. Entrou em loop infinito no simulador ("Maximum update depth exceeded").
2. Achei que a causa era `/` ser ambíguo (grupos não entram no endereço, então `/` é também `(app)/(tabs)/index.tsx`) e troquei para `/(auth)/login`. **O loop continuou.** A ambiguidade existe, mas não era a causa.

**A causa real**, lida no código do `expo-router` 57: o `Redirect` chama `router.replace` dentro de um `useFocusEffect` com função nova a cada renderização. Numa tela isso roda uma vez, porque a tela sai de foco. Num **layout**, o `replace` muda o estado de navegação, o layout renderiza de novo ainda em foco, e dispara outro `replace`. **Nunca usar `<Redirect>` em layout.**

**Teste:** `src/core/sessao/__tests__/guardaSessao.test.tsx` — guarda aberta com sessão, fechada sem sessão, aberta durante o carregamento, e `(app)/_layout` sem `Redirect`. Os quatro falhavam antes. O teste simula o roteador; quem provou que o loop acabou foi o simulador.

### D-039 — O crash do "Não uso medicamentos" — 25/09/2026
**Contexto:** no build 2 do TestFlight o app fechava ao confirmar "Não uso medicamentos" nas Pendências. O relatório de crash dizia só "erro de JavaScript" (`RCTFatal`); a mensagem apareceu rodando o app no Expo Go do simulador: `TypeError: Cannot read property 'layout' of null`, em `SaidaConcluida.tsx`.

**O defeito.** O componente mede a própria altura para animar a saída e fazia `onLayout={(e) => setAltura((a) => a ?? e.nativeEvent.layout.height)}`. O evento era lido **dentro da função de atualização**, e o React só roda essa função na renderização seguinte — quando o React Native já esvaziou o evento. O primeiro `onLayout` escapava por acaso (o React calcula na hora quando a fila está vazia); o segundo, o do cartão "Desfazer", caía na fila e quebrava. Por isso só a saída **com desfazer** (D-028) derrubava o app, e a saída simples das pendências do Rastreando nunca quebrou.

**Correção:** ler a altura no próprio handler e passar o número ao `setState`. Nenhum outro lugar do código tem o padrão.

**Por que os testes não pegaram:** o `onLayout` nunca dispara no Jest, e quando o teste o disparava entregava um evento que nunca se esvazia. O teste da Home (`src/modules/home/__tests__/telaHomeDeclaracao.test.tsx`) agora esvazia o evento depois do handler, como o React Native faz, e falhava com a mesma mensagem antes da correção. É o terceiro caso do mesmo padrão de D-036 e D-037: o teste simulava um mundo mais gentil que o aparelho.

### D-040 — O "Desfazer" piscava — 25/09/2026
**Contexto:** com o crash resolvido (D-039), o Murilo testou no simulador: *"ao apertar desfazer ele só pisca a tela e volta a pendência"*.

**O defeito.** O desfazer tirava o item da lista de saída na hora, mas o perfil só voltava a `semMedicacoes: false` quando o servidor respondia. Nesse intervalo a pendência não estava em lugar nenhum e sumia; quando a resposta chegava, reaparecia. No 4G, bem visível.

**Correção:** `usePerfil.salvar` muda a tela primeiro e grava depois. Se a gravação falha, devolve só os campos daquela chamada ao valor anterior e repassa o erro, que a tela já mostrava. Vale para as 18 telas que usam o hook. Os valores anteriores são lidos do perfil atual, e não dentro da função do `setState` (o padrão da D-039).

**Teste:** `src/core/perfil/__tests__/usePerfil.test.tsx` — muda antes do servidor responder; volta atrás se falhar. Os dois falhavam antes.

### D-041 — As pendências entram de uma vez — 25/09/2026
**Contexto:** o Murilo, no simulador: *"as pendências aparecer uma depois da outra fica estranho"*. Cada fonte (perfil, Rastreando, Coração, consultas, Bem-estar) responde num tempo, e cada pendência entrava quando a sua chegava. A D-027 só tinha segurado o "Nada pendente".

**Decisão do Murilo (25/09), entre três opções** (esqueleto; Nero esperando; espaço vazio): **esqueleto, depois tudo junto.**

**Como funciona:** duas linhas no desenho do `ItemHoje` (caixa, anel, duas barras), paradas, sem brilho correndo. Quando todas as fontes respondem, a lista inteira entra num fade de 200 ms (sem fade com Reduzir Movimento). **Limite de 4 s:** passou disso, mostra o que já chegou — sinal ruim não pode prender a pessoa no esqueleto. **Depois de liberada, não volta:** puxar para atualizar mantém a lista na tela. O contador de pendências só aparece com a lista.

**Arquivos:** `src/modules/home/EsqueletoPendencias.tsx`, `app/(app)/(tabs)/index.tsx`. **Teste:** `src/modules/home/__tests__/telaHomeCarregamento.test.tsx` (quatro casos).

### D-042 — A pergunta dos avisos não voltava depois do primeiro lembrete — 25/09/2026
**Contexto:** o Murilo cadastrou um remédio com lembrete no simulador e a notificação não apareceu, nem com o app aberto nem fora dele. O Expo Go nem constava na lista de notificações do sistema: a permissão **nunca tinha sido pedida**.

**O defeito.** A permissão só é pedida pela tela "Ativar avisos" (D-010: nunca no meio de um registro), e a Home decidia se mostrava essa tela **uma vez, ao montar** — e só se já houvesse lembrete pendente. Quem abre o app sem lembrete nenhum, cadastra o primeiro remédio e volta à Home não é perguntado: as abas continuam montadas. O lembrete é gravado como "silenciado" e os avisos daquele dia se perdem sem a pessoa saber, até ela fechar e reabrir o app.

**Correção:** a Home reavalia a cada foco (`useFocusEffect`). A regra da D-010 fica intacta: a pergunta aparece ao voltar para a Home, depois do registro, nunca no meio dele.

**Ainda não resolvido:** o agendamento engole qualquer erro (`.catch(() => null)` em `lembretesCardio.ts` e `rastreando/lembretes.ts`). Se o iOS recusar uma notificação, nada avisa.

**Teste:** `src/modules/home/__tests__/telaHomeAvisos.test.tsx` — falhava antes.

### D-043 — A pergunta dos avisos aparece na hora em que o lembrete é ligado — 25/09/2026
**Decisão do Murilo (25/09), revendo a D-010 e a D-042:** a tela "Ativar avisos" aparece **na própria tela, no momento em que a pessoa liga um lembrete** — por exemplo, ao ligar "Lembrar" num medicamento —, e não só ao voltar para a Home.

**As três regras:**
1. **No momento de ligar.** Onde o lembrete nasce (medicamento, consulta, plano de glicemia, MRPA, água, exame do Rastreando), a pergunta aparece ali, se o app ainda não tem permissão.
2. **"Agora não" não cala por 14 dias.** O intervalo de 14 dias continua valendo só para a Home; cada novo lembrete ligado pergunta de novo.
3. **Quem negou na caixa do iOS** vê, ao ligar um novo lembrete, um aviso de que as notificações estão desligadas nos Ajustes, com um botão que leva direto para lá.

**O que muda em relação à D-010:** a D-010 proibia perguntar no meio de um registro, com medo de a pessoa negar sem entender. O Murilo inverteu: o momento em que a pessoa liga um lembrete é o momento em que ela mais entende por que o app quer avisar.

**Ajustes, direto na página de notificações:** a constante do iOS (`UIApplication.openNotificationSettingsURLString`, iOS 16+) não é exposta pelo React Native nem pelo Expo. Seu valor foi lido compilando um programa para o simulador em 25/09: **`app-settings:notifications`**. O app abre essa URL; se falhar, cai em `Linking.openSettings()` (a página do app, a um toque). No Expo Go abre os ajustes do Expo Go — o teste real é no build.

**Implementado em 25/09:** `src/core/lembretes/usePedidoDeAvisos.tsx` (a tela chama `await pedir()` **antes** de criar o lembrete: a promessa só resolve quando a pessoa responde, então quem aceita já tem o lembrete novo agendado e a tela pode fechar depois), `estadoPermissao()` em `permissao.ts`, modo `ajustes` em `ModalAtivarAvisos`, `marcarAdiado()` em `useAvisos.ts`. Ligado em seis telas: Meus medicamentos (ao ligar "Lembrar"), Consultas (ao salvar), Plano de glicemia (ao salvar com horários), Iniciar MRPA, Minha Água (ao ligar ou ajustar os avisos) e Registrar exame (antes de gravar). **Teste:** `src/core/lembretes/__tests__/usePedidoDeAvisos.test.tsx` (cinco casos).

### D-044 — Textos novos das notificações, e o toque abre a tela — 25/09/2026
**Decisão do Murilo (25/09), notificação por notificação:** título diz o que fazer, em tom de conversa, com emoji no fim; o detalhe vai embaixo; sem "NERO:" e sem nome de módulo. A tabela completa está em `docs/nero/notificacoes.md`. Motivo: a notificação do remédio chegava como "NERO: Coração & Metabolismo", e a da água também — módulo errado, e nenhum dos dois diz à pessoa o que fazer. Os exames diziam "seu mamografia".

**Implementado em 25/09:**
- `src/core/lembretes/textos.ts` — todos os textos num lugar só; `agendar()` recebe o texto pronto em vez de montar o título pelo `origemTipo`. O planejador da MRPA (`regras/`) ficou só com o calendário. Teste: `textos.test.ts` (14 casos, espelho da tabela).
- **Água com a meta do dia** ("Sua meta de hoje: 2 L"): a meta é lida na hora de agendar, e os avisos são refeitos quando a meta de água muda ou um peso é registrado ou apagado (`reagendarAgua`).
- **O toque abre a tela certa** (`src/core/lembretes/useToqueNotificacao.ts`, montado no layout raiz): a rota vai no `data` de cada notificação, derivada de `origemDe`. Com o app fechado, espera a navegação e a sessão. A véspera da consulta abre "Levar ao médico", que é o que o texto promete. Teste: quatro casos.

**Limite conhecido:** os avisos já agendados antes desta versão continuam com o texto antigo até serem reagendados (abrir o app reagenda os remédios; os outros tipos, ao editar ou ao aceitar a permissão).

### D-045 — Horário se escolhe na roda, não se digita — 25/09/2026
**Contexto:** o Murilo pediu para facilitar o cadastro de horários dos remédios e dos outros lugares com horário. Levantamento: **os cinco lugares pedem o horário digitado** — remédio (um campo só, "08:00, 20h30" separados por vírgula), MRPA (manhã e noite), glicemia (um por momento), consulta ("HH:MM") e água (início e fim). O app não tem seletor de horário. Para o público 60+, digitar dois-pontos no teclado do celular é das tarefas mais difíceis que se pode pedir.

**Defeito achado no caminho:** a Minha Água grava **a cada tecla** — apagar "08:00" para digitar outro dispara "Confira os horários" no meio da digitação, e desde a D-043 também a pergunta dos avisos. A roda resolve, porque só grava o horário escolhido.

**Decisão do Murilo (25/09), entre três opções** (roda do iPhone; grade de horários comuns; botões − e +): **a roda do iPhone**, a mesma do Despertador — sem digitar, sem horário inválido. Minutos de 5 em 5. **Onde há mais de um horário, um botão para adicionar mais** (observação do Murilo).

**Remédio — decisão do Murilo (25/09), entre três opções** (quantas vezes + primeiro horário; só a lista; momentos do dia): **quantas vezes por dia e o horário da primeira dose.** Opções: 1 vez, 2 vezes (12 em 12 h), 3 vezes (8 em 8 h), 4 vezes (6 em 6 h) e Outro (lista livre). O app preenche os horários a partir da primeira dose; cada um continua editável na roda, e dá para adicionar ou tirar. Mudar a primeira dose recalcula os outros; mexer num horário do meio só muda aquele, e o ritmo passa a "Outro" — o app não sobrescreve o que a pessoa ajustou à mão.

**Os outros lugares, com a mesma roda:**
- **MRPA:** manhã e noite, uma roda cada (a MRPA tem sempre os dois períodos, então não há "adicionar").
- **Glicemia:** cada momento do plano mantém o horário padrão atual e ganha a roda para ajustar.
- **Consulta:** uma roda só, junto da data.
- **Água:** início e fim na roda; o intervalo já é escolhido por botões. Grava só quando a roda fecha — resolve o defeito da gravação a cada tecla.

**Implementado em 25/09:**
- `src/ui/components/CampoHorario.tsx` — no iPhone, a roda sobe numa folha com "Pronto" e só grava ao confirmar; no Android, o relógio do sistema. Biblioteca `@react-native-community/datetimepicker` 9.1.0 (lista oficial do Expo SDK 57, já presente no Expo Go); o `expo install` registrou o plugin dela no `app.json`.
- `horariosDoRitmo()` e `ritmoDe()` em `src/core/medicacoes/horarios.ts` — repartir o dia a partir da primeira dose, e reconhecer o ritmo ao abrir um remédio já cadastrado.
- `src/modules/minha-saude/HorariosRemedio.tsx` — o bloco do remédio. Substituiu o campo "08:00, 20:00" e o alerta de formato inválido.
- Roda também em Iniciar MRPA, Plano de glicemia, Consultas e Minha Água (que agora grava só ao confirmar a roda).
- Testes: `horarios.test.ts` (ritmo) e `horariosRemedio.test.tsx` (cinco casos: preencher, recalcular, ajuste à mão vira "Outro", tirar e adicionar, reconhecer ao abrir).

### D-046 — A pendência resolvida sai na frente da pessoa — 25/09/2026
**Pedido do Murilo (25/09):** *"ela some sem a pessoa ver, eu quero que ela veja ficando com a bolinha da pendência verde e vendo a pendência sair dali quando tiver realizado a pendência."*

**O que o código fazia.** Três defeitos juntos:
1. **A Home não recarregava ao voltar.** As abas continuam montadas, e a Home só buscava os dados ao abrir o app e ao puxar a lista. A pendência resolvida em outra tela ficava ali até reabrir o app.
2. **A Home não usava a saída verde da D-024**, só a do "Não uso medicamentos" (D-028). Quando a pendência saía da lista, sumia de um quadro para o outro.
3. **Mesmo onde havia saída verde** (Rastreando), a comparação rodava com a tela fora de vista, e a animação podia acontecer escondida. E o item que saía pulava para o fim da lista.

**Correção:**
- `useSaidaConcluida` (`src/ui/components/SaidaConcluida.tsx`): o item que sai fica **no lugar em que estava**; com `ativo` falso (tela fora de vista, carregando) a lista **congela**; a diferença é calculada já na renderização, para o item aparecer concluído no primeiro quadro, sem sumir e reaparecer. Vale também para as duas telas do Rastreando que já usavam o hook.
- `SaidaConcluida` ganhou `discreto` (só a bolinha fica verde, sem fundo nem segundo tique — o que o Murilo descreveu) e `atraso` (espera a transição de volta terminar: 450 ms, `MS_ATRASO_AO_VOLTAR`).
- Home: recarrega a cada volta, em silêncio (o giro do "puxar para atualizar" agora é só de quem puxou); compara só com a Home à vista e os dados prontos; o "Nada pendente" e a declaração negativa ficam fora dessa saída.

**Testes:** `saidaConcluida.test.tsx` (no lugar; congela fora de vista) e `telaHomeSaida.test.tsx` (resolvida fora da Home sai verde ao voltar; voltar recarrega). Os dois falhavam antes.

### D-047 — Lembrete que o sistema recusou aparece como silenciado — 25/09/2026
**Pedido do Murilo (25/09):** corrigir o agendamento que engolia o erro do iOS (pergunta em aberto do handoff de 25/09).

**O que o código fazia.** Em `src/core/cardio/lembretesCardio.ts` (remédio, MRPA, glicemia, consulta) e `src/core/rastreando/lembretes.ts` (exames), `scheduleNotificationAsync(...).catch(() => null)`: se o sistema recusasse, a linha em `lembretes` era gravada **sem** `notif:` e **sem** ` silenciado`. Na central, o lembrete parecia ativo, mas nada ia tocar, e nenhum registro ficava.

**Correção:** a marca ` silenciado` passa a depender de ter havido agendamento (`notifId`), não só da permissão. Sem permissão ou com recusa do sistema, a linha fica silenciada (a lista já sabe mostrar isso) e a recusa vai para o log (`console.warn('[lembretes] ...')`).

**Limite que isso não cobre:** o iOS guarda no máximo **64 notificações agendadas por app** e, acima disso, descarta as mais distantes **sem erro**. Um remédio 2×/dia por 7 dias já ocupa 14. O `catch` não enxerga esse descarte; fica registrado em `PENDENCIAS.md` §6.

**Teste:** `lembretesMedicacao.test.ts` ("iOS recusa o agendamento: a linha fica silenciada"), que falhava antes.

### D-048 — Remédio, glicemia e água viram um aviso diário, não sete — 25/09/2026
**Pedido do Murilo (25/09):** *"eu queria que alertasse realmente todos os remédios"*, sem mudar nada para a pessoa, só a configuração por trás.

**Problema.** O iOS guarda no máximo 64 notificações agendadas por app e descarta as mais distantes sem erro. O app agendava um aviso por dia durante 7 dias para cada horário: três remédios 2×/dia = 42; com água e glicemia, passava de 64, e lembretes sumiam calados — justamente para quem mais depende deles.

**Decisão.** O que se repete todo dia pede ao sistema **um aviso diário por horário** (`SchedulableTriggerInputTypes.DAILY`), em `agendarDiario` (`src/core/cardio/lembretesCardio.ts`). Três remédios 2×/dia passam a ocupar 6 vagas. Para a pessoa nada muda: mesmo horário, mesmo texto, mesmas telas. De quebra, o aviso não acaba mais depois de 7 dias sem abrir o app.
- As linhas da lista (`lembretes`) continuam cobrindo 7 dias, todas com o id do mesmo aviso, então a lista e o cancelamento funcionam como antes. A Home renova remédio (já fazia), glicemia e água a cada abertura (`renovarAvisosDiarios`).
- **MRPA, consultas e exames continuam com data certa** (poucos avisos, datas específicas).
- **Sair da conta e excluir a conta passam a apagar todos os avisos do aparelho** (`src/core/sessao/sair.ts`). Antes não apagavam — defeito antigo, que com avisos diários faria o celular tocar para sempre para quem saiu.

**Limite.** Um caso extremo (uns 10 remédios com 3 horários, água de hora em hora, glicemia e MRPA juntos) ainda passa de 64. Raro; não tratado.

**Não existe ainda:** remédio em dias da semana ("toda terça"). A tela só oferece "vezes por dia". O sistema aceita aviso semanal (`WEEKLY`), então dá para fazer, mas é opção nova na tela — a decidir com o Murilo.

**Testes:** `lembretesMedicacao.test.ts` (um aviso diário por horário; repete sem acabar) e `sessao/__tests__/sair.test.ts` (cancela antes de sair). **Conferir no aparelho:** o aviso do remédio chega todo dia no horário, inclusive depois de 7 dias sem abrir o app.


### D-049 — Agenda separa a rotina do pontual; ações do relatório no topo — 25/09/2026
**Pedido do Murilo (25/09):** *"as coisas que são todo dia e seguem um padrão tem que aparecer diferente […] em um card em cima […] e deixar na agenda só as coisas pontuais, igual uma consulta, um agendamento de exame."* E: *"os botões de gerar PDF, compartilhar e QR code tem que estar embaixo do título, senão a pessoa tem que rolar tudo para baixo."*

**Agenda.** Um remédio 2×/dia enchia a lista com 14 linhas. Agora:
- Card **"Todo dia"** no topo, uma linha por rotina com os horários: cada remédio ("Losartana 50 mg · 08:00 e 20:00"), glicemia (uma linha para o plano), água (em intervalo regular vira "das 08:00 às 20:00, a cada 2 h") e a **MRPA enquanto dura** ("07:00 e 19:00 · até 02/10" — escolha minha, por ser diária durante a sessão). Tocar abre a tela de origem. Linha sem aviso no celular diz "Sem aviso no celular".
- "Próximos 30 dias" e "Últimos 30 dias" ficam só com consulta e exame.
- Lógica pura em `src/core/lembretes/rotina.ts` (`separarRotina`), testada em `__tests__/rotina.test.ts`; card em `src/modules/minha-saude/componentes/CardRotina.tsx`. `LembreteCentral` ganhou `chave` (o `titulo` da linha).

**Relatórios.** "Gerar PDF e compartilhar", "Mostrar QR para o médico" e a nota sobem para logo abaixo do título na prévia (vale para todos os relatórios, que passam por `relatorios/previa.tsx`). "Compartilhar em PDF" dos relatórios de glicemia e MRPA também subiu.

**Visto no simulador em 25/09:** Agenda e prévia do relatório geral, sem erro no Metro.

### D-050 — Tabela da prévia do relatório não quebra palavra no meio — 25/09/2026
**Pedido do Murilo (25/09):** arrumar a tabela de medicamentos da prévia, que mostrava "Medicam/ento" e "12/12/202/5".

**Causa.** Na prévia dentro do app (`SecaoRelatorioView.tsx`), as colunas tinham a mesma largura. Cinco colunas num iPhone deixam cada uma estreita demais para "Medicamento". O PDF não tem o problema (tabela HTML se ajusta ao conteúdo).

**Correção.** Cada coluna cabe a maior palavra dela (`larguraTabela.ts`). Se a tabela cabe na tela, as colunas esticam na proporção. Se **não cabe**, cada linha vira um bloco ("Losartana" / "Dose: 50" / "Horários: …" / "Desde: …"), e célula vazia ("—") não aparece. Rolar para o lado foi testado e descartado: a última coluna ficava escondida, e o público 60+ não percebe que dá para rolar.

**Visto no simulador em 25/09:** a tabela de medicamentos do relatório geral aparece em bloco, sem palavra quebrada.

### D-051 — O módulo Rastreando passa a se chamar "Rastreamentos" — 25/09/2026
**Pedido do Murilo (25/09).** Muda só o que a pessoa lê: cartão da Home, marca no topo do módulo ("RASTREAMENTOS"), rótulo das telas internas e o botão "Voltar aos Rastreamentos". Rotas (`/(app)/rastreando`), pastas e nomes no código continuam `rastreando`, para não quebrar links de notificação já agendados. De quebra, o cartão do remédio trocou "16h03: desde 12/12/2025" por "16h03 · desde 12/12/2025" (pergunta em aberto do handoff de 25/09).

**Complemento (26/09, pedido do Murilo):** em Levar ao médico, o cartão "Exames de prevenção" passou a se chamar **"Rastreamentos"** (descrição igual). Ele abre o "Relatório de rastreamento oncológico", o mesmo do módulo, e o Murilo não o achou com o nome antigo.

### D-052 — "Perfil completo" é comemorado onde o perfil se completa — 25/09/2026
**Relato do Murilo (25/09):** registrou um copo de água, apagou, saiu da tela e apareceu "Seu perfil de saúde está completo".

**Causa.** A água não tem relação. As conquistas só eram avaliadas nas telas de Saúde & Bem-estar, e a principal as avalia **toda vez que ganha foco**. O perfil dele tinha ficado completo antes, em Minha Saúde (antecedente cadastrado no teste da D-046), onde nada avaliava. A comemoração ficou pendente até a próxima visita a Bem-estar: a volta da tela da Água.

**Correção.** `useConquistas` recebe `chaves`, as conquistas que aquela tela pode comemorar. Bem-estar só comemora as suas (`CONQUISTAS_BEM_ESTAR`). "Perfil completo" (`CONQUISTA_PERFIL`) sai ao salvar um antecedente ou um medicamento, e na Home quando a declaração "Não uso medicamentos"/"não tenho antecedentes" se confirma (fim dos 15 s do "Desfazer", para não comemorar algo que a pessoa ainda pode desfazer). As contagens passaram a ler o perfil do banco (`contarParaConquistas`), porque logo depois da declaração o estado de outra instância de `usePerfil` ainda não sabe da mudança.

**Teste:** `telaBemEstar.test.tsx` (Bem-estar não concede mais "perfil completo"), que falhava antes. **Não visto no simulador:** a comemoração no momento certo (a conta do Murilo já tem a conquista gravada; exige conta nova).

### D-053 — Atalhos na Home, numa faixa que rola para o lado — 25/09/2026
**Pedido do Murilo (25/09):** atalhos abaixo dos módulos para o que precisa de acesso fácil, começando por "Relatório para o médico".

**O que entra** (escolha dele, 25/09): Relatório (abre Levar ao médico), Medir pressão, Medir glicemia, Remédios (Meus medicamentos) e Consultas (Minhas consultas). Ficaram de fora água, peso, guardar exame e anotar sintoma.

**Formato:** faixa de círculos com rótulo curto, que rola para o lado, escolhida numa prévia no navegador contra a lista com ícone. A faixa vai de borda a borda da tela, e o primeiro item alinha com o texto. Código em `src/modules/home/FaixaAtalhos.tsx`; o teste `faixaAtalhos.test.ts` confere que cada atalho leva a uma tela que existe.

**Para depois:** os planos que o médico passar (quando existir o portal do médico) e a próxima consulta.

**Visto no simulador em 25/09.**

### D-054 — A seta de voltar leva de onde a pessoa veio, com a barra de baixo visível — 25/09/2026
**Relato do Murilo (25/09):** pelos atalhos Relatório ou Remédios, a seta de voltar levava ao "Relatório de rastreamento oncológico", nos dois casos. Pediu: manter a barra de baixo e voltar sempre para a última área em que estava.

**Causa.** Cada aba guarda a própria pilha de telas. Relatórios e Meus medicamentos são da aba Minha Saúde. O relatório de rastreamento, aberto antes pelo módulo Rastreamentos, tinha ficado nessa pilha, e o atalho empilhava a tela por cima dele. O mesmo padrão aparecia em 12 lugares (pendências da Home, módulos, Agenda, Histórico). Abrir o relatório pelo Rastreamentos também fechava o módulo, e o voltar não retornava para ele.

**Correção** (`src/core/navegacao/`):
- `comVolta` (regra pura, testada): quando o destino é de **outra aba**, a tela leva o parâmetro `voltarPara` com o caminho de origem. Mesma aba ou módulo: nada muda.
- `useAbrir` substitui `router.push` nos lugares que cruzam de aba.
- `useVoltar`, usado pela seta do `InternalHeader`: com `voltarPara`, vai para a origem e devolve a aba à tela inicial, para não reaparecer lá na próxima visita. Se a origem é um módulo, a aba de baixo volta a Início antes de reabri-lo. O arrastar do iOS fica desligado nessas telas (desempilharia para a tela esquecida), e o voltar do Android segue a mesma regra da seta.
- `jest.setup.js` devolve os dois ganchos ao comportamento simples nos testes de tela, que simulam o roteador só pela metade.

**Visto no simulador em 25/09:** atalho Relatório → voltar → Home, e a aba Minha Saúde abre na tela inicial; Rastreamentos → Relatório de rastreamento → voltar → Rastreamentos → sair do módulo → Home; atalho Remédios → voltar → Home. **Não coberto:** toque em notificação (não há origem para voltar) e o botão voltar do Android (só no aparelho).

### D-055 — Depois do onboarding, "Criar conta"; mensagem para senha vazada — 26/09/2026
**Pedido do Murilo (26/09):** depois do onboarding, a pessoa tem que ir para criar conta, não para entrar.

**Mudança.** O onboarding termina em `/(auth)/cadastro`. O cadastro virou tela de entrada (sem seta de voltar) e ganhou no rodapé "Já tem conta? **Entrar**". Login e cadastro trocam um pelo outro (`replace`), sem empilhar. Quem já viu o onboarding e saiu da conta continua indo ao login (`app/index.tsx`), porque essa pessoa já tem conta.

**Senha vazada.** Com a proteção contra senha vazada ligada no painel (Authentication › Providers › Email, plano Pro), a Supabase devolve `weak_password` com `reasons: ['pwned']`, e o app mostraria "A senha precisa ter pelo menos 8 caracteres". Agora mostra: "Essa senha já apareceu em vazamentos de dados na internet e pode ser descoberta. Escolha outra." (`traduzirErro`, testado).

### D-056 — Termos de uso e consentimento para os dados de saúde — 26/09/2026
**Pedido do Murilo (26/09):** colocar consentimento e termos de uso. Formato escolhido por ele: **duas caixas separadas** no cadastro, uma para os termos + a política e outra só para os dados de saúde. A LGPD pede consentimento "específico e destacado" para dado sensível (art. 11, I), e a política (§5) já dizia que ele é dado na criação da conta.

**Como funciona.**
- **Cadastro:** as duas caixas ficam antes de "Criar conta", com links para os documentos. O botão continua ativo e, faltando alguma caixa, avisa o que falta (botão apagado não explica nada para quem tem 60+). O aceite viaja no metadata do `signUp` (`metadataDoAceite`). Como no cadastro ainda não há sessão, é o gatilho `handle_new_user` que o grava.
- **Registro:** tabela `consentimentos` (migração 0021), uma linha por tipo (`termos`, `dados_saude`) + versão + data. A pessoa só lê e grava os próprios registros e não há update/delete: o registro é prova. Some junto com a conta, que é também como se revoga.
- **Contas antigas e versões novas:** `app/index.tsx` confere o aceite na versão atual (`VERSAO_TERMOS`, `VERSAO_CONSENTIMENTO_SAUDE` em `src/core/publicacao.ts`). Faltando, abre `app/consentimento.tsx` ("Antes de continuar", com as mesmas caixas e a opção "Sair da conta"). Se a consulta falhar por rede, o app segue, para não trancar a pessoa fora; o aceite é pedido de novo na próxima abertura.
- **Termos:** `docs/nero/publicacao/termos-de-uso.md`, **rascunho a revisar com advogado** (responsabilidade diante do CDC, "não é dispositivo médico", foro). O gerador do site (`scripts/gerar-site.mjs`) publica também `nerosaude.com.br/termos`.

**Testes:** `consentimento.test.ts` (versão atual dos dois aceites) e `supabase/tests/consentimentos.test.sql` (gatilho, RLS, conta antiga), com os 69 pgTAP passando no banco local.

**No ar em 26/09:** 0021 aplicada na nuvem e `nerosaude.com.br/termos` publicado (com autorização do Murilo, ainda como rascunho, antes da revisão jurídica). Visto no simulador: a conta do Murilo, sem aceite, abre em "Antes de continuar".

**Proteção contra senha vazada:** o Murilo decidiu **não ligar** (26/09). A mensagem própria da D-055 fica no código, sem efeito até alguém ligar a opção no painel.

### D-057 — "Fale com o NERO" em Minha Saúde — 26/09/2026
**Motivo:** o e-mail de contato existia no código (`EMAIL_CONTATO`), mas em nenhuma tela; quem tivesse dúvida ou problema não tinha a quem recorrer. Aprovado pelo Murilo em 26/09.

**Como ficou:** seção **Ajuda** em Minha Saúde, antes de "Sair da conta", com a linha "Fale com o NERO" e o endereço visível. O toque abre o e-mail com assunto e a versão do app e do sistema (`urlEmailContato`, testado). O corpo pede para não mandar resultado de exame: a política promete que dado de saúde não trafega por e-mail. Sem app de e-mail configurado, aparece o endereço para anotar. Junto entrou "Termos de uso" ao lado de "Política de privacidade". **Visto no simulador.**

### D-058 — Relatório de erros com Sentry, sem dado de saúde — 26/09/2026
**Motivo:** não havia nenhum. O crash do build 2 chegou só como `RCTFatal`, sem mensagem; com pacientes reais, não saberíamos o que quebrou. Aprovado pelo Murilo em 26/09.

**Como ficou:** `@sentry/react-native` (integração oficial do Expo). `iniciarRelatorioDeErros` só liga com `EXPO_PUBLIC_SENTRY_DSN` e fora do modo de desenvolvimento; `Sentry.wrap` na raiz registra também erro de renderização. **Privacidade** (`src/core/erros/limpeza.ts`, testado): sem captura de tela nem estrutura da tela, `sendDefaultPii: false`, sem usuário/requisição/extras no evento; rastros de toque e de console descartados (podem ter o texto da tela, como o nome de um remédio); endereços sem parâmetros (e-mail, filtros do banco). Chega o que serve para consertar: mensagem, pilha, aparelho, versão.

**Conta criada pelo Murilo em 26/09:** organização `nero-saude`, projeto `react-native`, região **UE (Alemanha)** (`ingest.de.sentry.io`). A DSN, que não é segredo, vai no `env` dos perfis `preview` e `production` do `eas.json`; o plugin no `app.json` já tem organização, projeto e `https://de.sentry.io/`. O teste de 14 dias é das funções pagas; depois a conta fica no plano gratuito (5.000 ocorrências/mês, 1 usuário), sem cartão. Contra um defeito que se repete e gasta a cota, o mesmo erro vai até 5 vezes por abertura do app (`limitarRepeticao`, testado). O repositório **não** foi conectado ao Sentry.

**Source maps** (o erro aparece com o nome do arquivo e a linha legíveis): ligados em 26/09. O token `SENTRY_AUTH_TOKEN` está na EAS como secreto (`production` e `preview`), e o `SENTRY_DISABLE_AUTO_UPLOAD` saiu do `eas.json`. O token apareceu no chat ao ser cadastrado: trocar junto com os outros (PENDENCIAS §1).

**Política de privacidade** atualizada em 26/09: Sentry (UE) e Expo (atualizações) como operadores, o que o relatório de erro leva e o que não leva, base legal (legítimo interesse, art. 7º, IX) e transferência internacional (art. 33). Vale a mesma revisão jurídica dos termos.

### D-059 — Atualização pelo ar (expo-updates) — 26/09/2026
**Motivo:** sem ela, qualquer correção, até um texto errado, exigia build novo e a revisão da Apple. Aprovado pelo Murilo em 26/09, depois da explicação do que muda.

**Como ficou:** `expo-updates` com `runtimeVersion: { policy: "fingerprint" }` (a atualização só chega a builds com o mesmo código nativo; isso é calculado sozinho). O app confere ao abrir e aplica na abertura seguinte (`checkAutomatically: ON_LOAD`, `fallbackToCacheTimeout: 0`), sem tela de espera. Canais no `eas.json`: `development`, `preview`, `production`. O build 3, pelo perfil `production`, recebe o que for publicado em `production`. **O build 2 nunca vai receber**, porque não tem o pacote.

**Publicar uma correção:** `eas update --channel production --message "…"`. Desfazer: `eas update:rollback`. Plano gratuito da Expo: 1.000 usuários ativos/mês, sem cobrança além (o serviço para de entregar acima disso). Continua exigindo build: permissões novas, biblioteca nativa nova, atualização do Expo, ícone e splash.

### D-060 — Lembrete do check-in semanal — 26/09/2026
**Pedido do Murilo (25/09); decisões dele em 26/09:** aviso no **domingo às 10h** e, **só para quem ainda não respondeu**, outro na **terça às 19h**, último dia da janela (domingo a terça). Texto "pergunta direta": "Como foi sua semana? 💬 / Responda o check-in: leva um minuto." e "Último dia do check-in 💬 / Conte como foi sua semana antes que ela feche." (tabela em `notificacoes.md`).

**Como funciona.**
- Domingo e terça avaliam a **mesma semana** (`semanaDoCheckin`), então a chave do lembrete leva a semana (`checkin:<segunda>:dom|ter`). Responder o check-in cancela o que sobrou dela (`aoResponderCheckin`, chamado em `useCheckin.salvar`).
- Avisos com data (não repetição semanal), porque o de terça depende de ter respondido: 4 semanas à frente, 8 das 64 vagas do iOS, renovados a cada abertura da Home (`renovarAvisosDiarios`). Semana já respondida não é agendada. Planejamento puro em `src/core/regras/bemestar/lembretesCheckin.ts` (testado).
- Nova preferência `checkin`, **ligada por padrão** (o check-in já aparece como pendência para todos), com chave em Agenda › Preferências. Sem migração: o mapeamento completa a chave com o padrão. Origem `sistema` em `lembretes`, identificada pelo prefixo `checkin:`.
- Na Agenda, o card de rotina ganhou a parte **"Toda semana"** abaixo de "Todo dia": "Check-in semanal · domingo às 10:00 e terça às 19:00, se ainda não respondeu". Não entra na lista de pontuais.

**Visto no simulador (26/09):** o plano de 8 avisos com a permissão concedida, e a Agenda com "Toda semana". Durante o teste, a chave da conta do Murilo ficou **desligada**; ele religa em Agenda › Preferências. **Não visto:** a notificação tocando no domingo (só no aparelho).

Junto: `envolverRaiz` só aplica o `Sentry.wrap` quando o Sentry foi iniciado, o que tira o aviso "wrap antes de init" do Metro no modo de desenvolvimento.

### D-061 — Entrar com a Apple e com o Google — 26/09/2026
**Pedido do Murilo (26/09).** Para quem tem 60+, esquecer a senha é a maior causa de abandono.

**Como ficou.** Login nativo: o sistema entrega um token e a Supabase abre ou cria a conta (`signInWithIdToken`, `src/core/auth/social.ts`). Os botões "Continuar com a Apple" (componente oficial, exigido pela Apple) e "Continuar com o Google" ficam acima do e-mail, no login e no cadastro (`BotoesSociais`).
- **Apple:** `expo-apple-authentication`, `ios.usesAppleSignIn`, nonce (hash para a Apple, valor bruto para a Supabase). A Apple entrega o nome só no primeiro login e fora do token: o app o grava no perfil se ainda estiver vazio.
- **Google:** `@react-native-google-signin/google-signin`; IDs de cliente Web e iOS no código (não são segredo); `iosUrlScheme` = ID do iOS invertido no plugin. No Expo Go o botão não aparece (não há o módulo nativo). O cliente Android fica para quando existir a conta do Play (precisa do SHA-1 do primeiro build Android).
- **Nome:** migração **0022**: o gatilho do cadastro usa `nome`, senão `full_name`/`name` (Google). Se ainda faltar (Apple sem nome), o primeiro passo do perfil inicial pergunta "Como você quer ser chamado?".
- **Consentimento:** quem entra por Apple/Google não passa pelas caixas do cadastro; o `app/index.tsx` leva à tela de aceite (D-056).
- Painéis (feitos pelo Murilo): "Sign In with Apple" no App ID; provedor Apple na Supabase com Client ID `br.com.nerosaude.app`; projeto NERO no Google Cloud com tela de consentimento e clientes Web e iOS; provedor Google na Supabase com os dois IDs (Web primeiro) e "Skip nonce check".

**Testes:** pgTAP (nome vindo do Google; perfil com nome vazio na Apple) no banco local. **Não visto:** os dois logins funcionando, só no build 3. **Pendente:** aplicar a 0022 na nuvem.
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
| C-010 | PA: alertas em camadas (§4) — limiares e o que medidas casuais podem disparar | **Aprovado pelo Murilo em 17/09/2026, após verificação na diretriz vigente.** (1) **Medida casual isolada = AMPA, só triagem** (DBHA 2025 §3.7.1: "não há evidências […] para a determinação de valores de normalidade para esse método, nem a adoção de protocolos específicos (número de medidas, horários e dias)"; Medidas 2023 §3.1 retira o critério de 7 medidas/16–72 h da DBHA 2020). O app contextualiza sem cor: referência domiciliar 130/80 é a da MRPA; medidas avulsas não confirmam nem afastam HA. Valores implausíveis pedem confirmação antes de salvar: PAD > 140 ou < 40, PAS < 70 ou > 250, PAS < PAD, pressão de pulso < 20 ou > 100 (Medidas 2023, Parte 4 §3). (2) **"Repetidamente elevadas" (amarelo) só pela MRPA**: sessão concluída e válida (C-011) com média ≥ 130 e/ou ≥ 80 mmHg (DBHA 2025 Quadro 3.4; Medidas 2023 Parte 4 §4) → mensagem do §4 + levar relatório ao médico. (2b) **Convite para MRPA, sem cor de alerta**: ≥ 3 medidas casuais ≥ 130/80 nos últimos 7 dias → sugerir iniciar MRPA pelo app e conversar com o médico; no máximo uma vez a cada 30 dias (gatilho de produto, por isso é convite e não alerta). (3) **Valor muito elevado (laranja)**: qualquer medida com PAS ≥ 180 e/ou PAD ≥ 110 (DBHA 2025 cap. 11.1) → repouso 5 min, repetir, perguntar os sintomas de alarme do §4. (4) **Muito elevado + sintoma de alarme (vermelho)** → orientar avaliação imediata em emergência (emergência hipertensiva = elevação + lesão de órgão-alvo, definida clinicamente). Descartadas: janelas de "N medidas em X dias" para alerta amarelo com medidas casuais (sem respaldo na diretriz). | DBHA 2025 (§3.7.1, Quadro 3.2, Quadro 3.4, cap. 11.1) · Diretrizes de Medidas da PA 2023 (§3.1, Quadro 9, Parte 4 §3–4) | 2025 / 2023 | 17/09/2026 ✔ |
| C-011 | MRPA: protocolo, duração e critérios de validade (§2–§3) | **Aprovado pelo Murilo em 17/09/2026.** Protocolo da Diretriz de Medidas 2023 (Parte 4 §3, GR I NE C), que substitui o "2 medidas × 7 dias" da 4ª Diretriz de 2018 citado na spec: **3 medidas pela manhã + 3 à noite**, após 5 min de repouso, antes das refeições (se comeu, aguardar 2 h), bexiga vazia, antes do anti-hipertensivo; **intervalo de 1 min** entre as 3 (Figura 8). Duração **4, 5 ou 6 dias, padrão 6** ("idealmente 6"); fora de 4–6 o app não aceita. Sem dia 0 obrigatório (o app começa no dia 1); campo opcional "PA no consultório" só para o relatório mostrar a diferença consultório × MRPA. **Validade ao concluir** (Parte 4 §5): ≥ 14 medidas em 4 dias, ≥ 15 em 5, ≥ 18 em 6, com todos os dias tendo pelo menos uma medida de manhã e uma de noite; se não atinge, relatório é gerado marcado "não atinge o mínimo para interpretação" e a camada 2 de C-010 não dispara. **Exclusão automática** do cálculo (mantidas na tabela, marcadas): PAD > 140 ou < 40, PAS < 70 ou > 250, PAS < PAD, pressão de pulso < 20 ou > 100. Conclusão só após o último dia previsto; cancelar a qualquer momento; dia sem medida não estende a sessão. Relatório em tela (PDF na Fase 3): período, nº válidas/excluídas, médias total/manhã/noite/diárias, resultado (dentro da referência · ≥ 130 e/ou ≥ 80 · não interpretável), medicações, sintomas, ressalva literal "A MRPA, como os demais exames complementares em medicina, deve ser avaliada segundo critérios do médico assistente". Banco: `mrpa_sessoes.dias_previstos` 4–6; `medidas.contexto` com `periodo`, `ordem`, `excluida`+motivo. | Diretrizes de Medidas da PA 2023 (Parte 4 §3–§5, Quadro 19, Figura 8) · DBHA 2025 (Quadro 3.4) | 2023 / 2025 | 17/09/2026 ✔ |
| C-012 | Glicemia: metas padrão, limiares de hipo/hiperglicemia e plano de monitorização (§5–§8) | **Aprovado pelo Murilo em 17/09/2026.** (1) **Metas** (SBD 2026 Metas, R6 e Tabela 1): se o médico definiu, o paciente digita (jejum/pré, 2 h pós, ao deitar); senão, padrão = coluna "Adultos" para todos com diabetes — jejum/pré 80–130, 2 h pós < 180, ao deitar 90–150 — rotulada "meta da diretriz SBD 2026 — confirme com seu médico"; perfis "idoso comprometido" (90–150 / < 180 / 100–180) e "muito comprometido" (100–180 / — / 110–200) só quando o paciente indica que o médico enquadrou. (2) **Hipoglicemia** (SBD 2026 Metas, níveis 1–3), para qualquer usuário: 54–69 → amarelo; < 54 → laranja ("intervenção imediata"); qualquer valor + confusão/incapaz de se tratar sozinho (nível 3) → vermelho. Texto de conduta: **"siga a orientação do seu médico para hipoglicemia"** (o app não prescreve a regra dos 15 g). (3) **Hiperglicemia** (SBD 2026 Dias de doença, Tabela 1; Cetoacidose): > 250 → laranja (repetir; DM1/bomba: verificar cetonas conforme o médico orientou); > 250 + sintoma de CAD (náusea, vômito, dor abdominal, respiração rápida, sonolência/confusão) → vermelho. Fora da meta sem esses limiares → só cor educativa do §16. (4) **Sem diabetes no perfil** (SBD 2026 Diagnóstico, R1–R2, Tabela 1): sem metas; contextualização com jejum < 100 / 100–125 / ≥ 126 e casual ≥ 200 com sintomas, sempre com "glicemia capilar não faz diagnóstico"; jejum ≥ 126 ou casual ≥ 200 → convite sem cor a conversar com o médico sobre exame de laboratório. (5) **Plano de monitorização** (SBD 2026 Monitorização, R5/R9/R10/R8) sem prescrição: 4 modelos sugeridos, marcados "confirme com seu médico"; DM2 sem insulina = sem horários fixos. | SBD 2026: Metas de controle glicêmico · Monitorização · Diagnóstico · Dias de doença no DM1 · Cetoacidose | 2026 | 17/09/2026 ✔ |
| C-013 | PREVENT: desfecho, horizonte, variáveis, categorias, agravantes e CAC (§13–§18) | **Aprovado pelo Murilo em 17/09/2026.** (1) Resultado principal = **PREVENT-ASCVD em 10 anos** (Dislipidemias 2025, rec. FORTE/ALTA para 30–79 anos sem DCV; §4.2: "risco aterosclerótico em 10 anos […] para definir a necessidade de terapia hipolipemiante"), categoria da **Tabela 4.1**: < 5 % baixo · 5 a < 20 % intermediário · ≥ 20 % alto, rotulada "categoria pelo escore — a estratificação final é do seu médico". IC/DCV total não entram na v1. (2) **30 anos** só para 30–59 anos, sem categoria, com o texto do §4.9 ("não existem limiares definidos […] aumentar a conscientização"). (3) Equação: modelo básico; com HbA1c e/ou RAC urinária usa o conjunto de coeficientes correspondente (Khan 2024, suplemento); **SDI nunca** (não se aplica ao Brasil). (4) TFG: valor de laboratório se houver; senão CKD-EPI 2021 sem raça a partir da creatinina. (5) **Não se aplica** (explica e remete ao médico): < 30 ou ≥ 80 anos (§4.8–4.9); evento aterosclerótico prévio/revascularização (campo novo no perfil). (6) **Agravantes** (§17) = Tabela 4.3 literal (história familiar prematura 1º grau H < 55/M < 65; síndrome metabólica; esteatose hepática; artrite reumatoide; psoríase; lúpus; DII; HIV; transplante; menarca ≤ 12 ou ≥ 17; distúrbios hipertensivos/diabetes na gestação; parto prematuro; RCIU; ≥ 3 abortos; menopausa < 40; Lp(a) ≥ 50 mg/dL; PCR-us ≥ 2,0 mg/L) → mensagem do §17 sem reclassificar; DRC e HF saem da lista (são estratificação clínica, texto educativo). (7) **CAC** (§18, Tabela 4.4): Agatston + data; > 100 ou percentil > 75 e > 300 → "a diretriz considera esse valor um estratificador; converse com seu médico". (8) Pré-requisito: coeficientes do suplemento de Khan 2024 (download manual pelo Murilo) e validação contra a calculadora oficial da AHA com casos de teste. | Diretriz Brasileira de Dislipidemias 2025 (§4.2, §4.3, §4.8–4.9, Tabelas 4.1, 4.3, 4.4) · Khan 2023 (Statement) · Khan 2024 (Circulation + suplemento) | 2025 / 2023–2024 | 17/09/2026 ✔ |
| C-014 | Janelas de "dado recente" para preenchimento automático do PREVENT (§14) e check-up (§24) | **Aprovado pelo Murilo em 17/09/2026. Decisão de produto** ancorada no ciclo anual de reavaliação das diretrizes (Dislipidemias 2025: perfil lipídico anual após meta; DBHA 2025: FRCV/LOA "pelo menos anualmente", PA normal repetir anualmente). Três estados: usa direto · pergunta se há mais recente · pede novo. **PA sistólica:** MRPA válida ≤ 30 dias ou média de ≥ 3 medidas casuais nos últimos 7 dias; fora disso pede medir agora ou iniciar MRPA. **Peso/IMC:** ≤ 30 dias direto; 31–90 pergunta; > 90 pede. **Tabagismo:** perfil, confirmação de um toque. **CT, HDL-c, creatinina/TFG:** ≤ 12 meses direto; > 12 meses pergunta; sem exame novo calcula com aviso "dados com mais de 1 ano" e gera pendência do §24; nunca bloqueia. **HbA1c:** ≤ 6 meses; > 6 pergunta; sem novo, calcula sem HbA1c. **RAC urinária:** ≤ 12 meses, idem. **Medicações:** ativas em `medicacoes` com confirmação. **Check-up §24:** mesmas janelas de "usa direto" para contar "informações atualizadas n/8"; risco calculado vale 12 meses. | Dislipidemias 2025 · DBHA 2025 · §14 e §24 da spec | 2025 | 17/09/2026 ✔ |
| C-015 | IMC: cálculo, faixas exibidas e idosos (§71) | **Aprovado pelo Murilo em 18/09/2026.** Verificado antes: nenhuma sociedade brasileira adotou a Comissão Lancet 2025 com cortes próprios (ver REFERENCIAS.md). Calcular sempre (peso/altura²), mostrar o valor com uma casa e a **faixa da Tabela 4 da ABESO 2016 (OMS)** como informação educativa, nunca como diagnóstico: < 18,5 baixo peso · 18,5–24,9 faixa de referência · 25–29,9 sobrepeso · 30–34,9 obesidade grau I · 35–39,9 grau II · ≥ 40 grau III. **≥ 60 anos:** mostrar também a faixa do MS para idosos (22–27 = referência; > 27 excesso de peso; < 22 baixo peso — ABESO 2016 e Rec. 1C "acima dos 60 anos, considerar > 27"). Texto fixo do §71 ("deve ser interpretado em conjunto…"). Sem cor de alerta (§43 é para condutas clínicas, e o IMC isolado não define conduta). Asiáticos (23/27,5) não implementado: o perfil não pergunta ascendência. | ABESO 2016 (Tabela 4, Rec. 1C–1E) · ABESO 2026 (R4: IMC ≥ 27 já pode ter indicação com complicações — usado só no texto educativo) · Diretriz conjunta 2025 (ABC) | 2016 / 2026 / 2025 | 18/09/2026 ✔ |
| C-016 | Circunferência abdominal, relação cintura/altura e cintura/quadril (§72, §84) | **Aprovado pelo Murilo em 18/09/2026** (após correção para o corte sul-americano). Técnica ensinada na tela = OMS 2008/ABESO: em pé, fita não elástica, **ponto médio entre a última costela palpável e a crista ilíaca**, ao final de uma expiração normal, sem comprimir a pele. **Relação cintura/altura (RCA):** calcular sempre; referência **< 0,5** ("a cintura deve ser menor que a metade da altura" — ABESO 2016 Rec. 1F, Grau A; ABESO 2026 R5: elevada quando > 0,5). **Cintura em cm:** mostrar o valor e informar as duas faixas — **≥ 90 (H) / ≥ 80 (M)** risco aumentado (IDF: "sul-americanos usam as referências dos sul-asiáticos" — ABESO 2016 Tabela 5; ABESO 2026 R5 manda seguir o critério de síndrome metabólica; material da professora do Murilo, IDF 2009, confirma) e ≥ 102 (H) / ≥ 88 (M) muito aumentado (NCEP/ATP III, citado pela DBHA 2025). *Correção 18/09/2026: a proposta inicial usava 94/80 (europídeos); corrigido para o corte sul-americano.* Mensagem: RCA é o indicador principal (Grau A), a cintura absoluta complementa. **Cintura/quadril:** calcular só quando houver quadril; referência OMS ≥ 0,90 (H) / ≥ 0,85 (M). Tudo sem cor de alerta; convite a "conversar com seu médico" quando RCA ≥ 0,5. | ABESO 2016 (cap. Diagnóstico, Tabela 5, Rec. 1B, 1F, 1G) · ABESO 2026 (R5) · IDF 2009 (via Guia TdC) · OMS 2011 (técnica) · DBHA 2025 (102/88) | 2016 / 2026 / 2011 | 18/09/2026 ✔ |
| C-017 | Meta sugerida de atividade física (§79) e resumo semanal (§78) | **Aprovado pelo Murilo em 18/09/2026.** Meta sugerida pelo app = OMS 2020 / Guia MS 2021: **150 a 300 min/semana de intensidade moderada, ou 75 a 150 de vigorosa, ou combinação equivalente** (1 min vigoroso = 2 min moderados para somar), **mais fortalecimento muscular em ≥ 2 dias/semana**; ≥ 60 anos: também equilíbrio/multicomponente em ≥ 3 dias. O contador semanal soma moderada + vigorosa ("minutos que contam"); leve aparece separada e não conta para a meta. Frase obrigatória da OMS: "qualquer atividade é melhor do que nenhuma". Usuário pode trocar por meta própria (§79) — o app só registra, sem julgar. Mapeamento intensidade percebida → OMS: leve / moderada / intensa (vigorosa). Musculação, funcional e pilates contam como fortalecimento. | OMS 2020 (adultos e idosos, recomendação forte) · Guia MS 2021 (mesmos números; completo pendente de download manual) | 2020 / 2021 | 18/09/2026 ✔ |
| C-018 | Sono: referência de duração e o que o app mostra (§80) | **Aprovado pelo Murilo em 18/09/2026.** Média dos últimos 7 dias e horários médios, como na spec. Referência educativa única: **adultos devem dormir 7 h ou mais por noite regularmente** (AASM/SRS 2015). Abaixo de 7 h de média em 7 dias → texto neutro ("sua média ficou abaixo das 7 horas que a AASM recomenda para adultos; se isso for frequente, vale conversar com seu médico"), sem cor. Acima de 9 h → sem alerta (o consenso considera incerto). Nenhum rastreio de insônia/apneia nesta versão (spec §80). | AASM/SRS 2015 (Watson et al.) | 2015 | 18/09/2026 ✔ |
| C-019 | Tendência de peso e evolução percentual (§84); peso máximo da vida (PMAV) | **Aprovado pelo Murilo em 18/09/2026, incluindo o item (4) de perda não intencional (decisão de produto, sem diretriz específica).** (1) **Tendência:** só com ≥ 3 medidas em ≥ 14 dias; comparar a média das medidas dos últimos 14 dias com a média dos 14 dias anteriores: diferença ≥ 1 % = "tendência de aumento/redução", senão "estável" (regra de produto, evita oscilação diária). (2) **Evolução percentual:** (atual − inicial)/inicial, com o "inicial" escolhido pelo usuário (primeira medida do período ou uma medida marcada como referência). (3) **Peso máximo atingido na vida (PMAV):** campo opcional no perfil (ABESO 2026 R8, e-book 2023); quando informado e IMC ≥ 30, mostrar a perda em relação ao PMAV e os marcos da diretriz — **5–10 % obesidade reduzida, ≥ 10 % controlada (IMC 30–39,9); 10–15 % reduzida, > 15 % controlada (IMC 40–50)** — como informação para levar ao médico, sem cor. (4) **Perda não intencional:** se o usuário não tem meta de redução e o peso caiu ≥ 5 % em ≤ 6 meses, item cinza na Home "converse com seu médico" (sinal clínico clássico; sem fonte de diretriz específica — decisão de produto a confirmar). | ABESO 2026 (R8) · e-book ABESO/SBEM 2023 | 2026 / 2023 | 18/09/2026 ✔ |
| C-020 | Conexão alimentação ↔ glicemia ↔ atividade (§81): janelas de associação | **Aprovado pelo Murilo em 18/09/2026 (decisão de produto).** Ao registrar uma glicemia, sugerir vínculo com a refeição registrada nas **últimas 3 h** (pós-prandial 1 h/2 h da SBD cabe nessa janela) e com a atividade encerrada nas **últimas 3 h**; o usuário confirma (Sim/Não). Ao registrar uma refeição com momento "pós" já medido, não sugerir retroativamente (simplicidade). Vínculo aparece no relatório como na spec (12:30 almoço → 14:35 glicemia 2 h pós-prandial). Sem interpretação automática (§76: sem "bom/ruim"). | SBD 2026 (momentos pós-prandiais 1 h e 2 h já usados em C-012) · spec §81 | 2026 | 18/09/2026 ✔ |

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
