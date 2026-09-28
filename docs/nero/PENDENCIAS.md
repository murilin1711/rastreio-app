# Pendências do NERO

> Criado em 25/09/2026, no dia do primeiro build. Reúne o que ficou para depois, com o motivo de
> cada adiamento. **Não é lista de ideias** — é o que já foi decidido que precisa ser feito, ou que
> foi deliberadamente deixado de lado e alguém precisa lembrar por quê.
>
> Ordem: o que bloqueia a publicação primeiro, o resto depois. O que está feito sai daqui.

## 1. Bloqueia a publicação

### Contas e credenciais

- [x] **Google Play Console — conta criada, paga e verificada em 27/09.** Conta de **Organização** no
      CNPJ do Murilo (o Google exige organização para "apps médicos"; o Nero cai em "Medication and
      Treatment Management" e "Diseases and Conditions Management" — fontes:
      support.google.com/googleplay/android-developer/answer/13634885 e /answer/14738291). Dona:
      `nerosaudeapp@gmail.com` (permanente). Site verificado no Search Console por TXT na Hostinger;
      e-mail do domínio passou a receber pela Hostinger (MX `mx1/mx2.hostinger.com`).
      Declarado no cadastro: "Telehealth or medical apps"; monetização "We don't know yet".
- [ ] **Política de privacidade com o CNPJ (MEI 62.043.447/0001-03) no lugar do CPF — texto trocado em
      27/09**, falta publicar junto com o próximo lote do app (`npm run site:publicar`).
- [ ] **Apple fica no CPF (decisão do Murilo, 27/09).** Risco conhecido: diretriz 5.1.1(ix) prefere pessoa
      jurídica para apps de saúde; reavaliar só se a revisão da Apple reclamar.
- [ ] **CNAE do MEI é "Cursos preparatórios para concursos"**, sem relação com software. Não impediu a
      verificação do Google; se o Nero passar a faturar, falar com um contador sobre a atividade.
- [ ] **Primeiro build Android pronto (27/09):** build `2c6d9133` (versionCode 2, `.aab`), chave de assinatura
      gerada e guardada pela Expo. Manifesto conferido: **sem `AD_ID`** (bate com "Advertising ID: No"),
      `RECORD_AUDIO` bloqueado. **Enviado e publicado no teste interno em 27/09** (Play App Signing ativo). Link de convite: https://play.google.com/apps/internaltest/4701442173001504585 . Próximos envios: `scripts/play-api.mjs` (conta de serviço `play-publisher@nero-509815`, chave em `credenciais/google-play.json`).
      App "Nero Saúde" criado no Play em 27/09 (gratuito, pt-BR); conta de organização não pede 12
      testadores/14 dias. Ficha: `publicacao/ficha-da-loja.md`. Faltam imagem de destaque e capturas.
- [x] **Login com Google no Android (feito pelo Murilo em 27/09):** criar cliente OAuth Android no Google Cloud com o SHA-1 da chave de
      assinatura do Play. **SHA-1 (chave de assinatura do Google, conferido pelo SHA-256 da API em 27/09): `53:45:34:67:D5:4A:1E:C2:16:2B:7E:EE:14:41:FF:F5:49:8F:D2:0D`**, pacote `br.com.nerosaude.app`, no mesmo projeto do cliente Web (`nero`). O código não muda (usa o `webClientId`).
- [x] **Play, feito pelo Murilo em 27/09:** conta de revisão `nerosaudeapp+revisao@gmail.com` em "Sign in
      details"; Privacy policy, Ads, Target audience (18+) e Data safety salvas; categoria na Store settings.
- [ ] **Play, falta:** testar num Android real pelo link do teste interno (Murilo procurando aparelho; plano B:
      emulador do Android Studio com imagem "Google Play", ou o Pre-launch report do próprio Play); depois a
      versão de produção (só Brasil), que passa por revisão do Google.
- [ ] **Capturas de tela das lojas — adiado a pedido do Murilo (27/09).** Senha da conta de revisão em
      `credenciais/conta-revisao.txt` (apareceu no chat; é conta fictícia e vai ao revisor). Antes de tirar:
      **trocar o nome "Teste" da conta** por um nome crível. Telas pedidas pelo Murilo: **onboarding**
      (a parte do Nero falando) e a **primeira página** (Home), além das telas com dados (pressão,
      remédios, água, relatório). Mínimo 2, ideal 4+ em 9:16 (1080 × 1920); enviar com
      `node scripts/play-ficha.mjs` (lê `assets/images/loja/captura-N.png`).
- [ ] **Revogar dois tokens da Supabase** em `supabase.com/dashboard/account/tokens`: o de 22/09 e o de
      25/09, usado para aplicar o template de recuperação. O segundo apareceu no chat e por isso deixou
      de ser secreto.
- [ ] **Trocar o token do Sentry** (`SENTRY_AUTH_TOKEN` na EAS). Apareceu no chat em 26/09 ao ser cadastrado.
      Risco baixo (só envia source maps, não lê erros). Criar outro em Settings › Organization Tokens e
      rodar `npx eas-cli env:update --variable-name SENTRY_AUTH_TOKEN --value NOVO --environment production --environment preview`.
- [ ] **Recriar a chave do Resend.** A atual foi colada no chat em 22/09. Trocar no painel da Supabase
      (`scripts/configurar-auth.mjs` com a chave nova, `--aplicar`).
- [x] ~~Apagar as contas de teste.~~ **Feito em 26/09** (pedido do Murilo): `nerosaude+teste1@gmail.com` e
      `teste.remoto@nero.dev`, ambas sem dados, apagadas pelo id. A primeira recebia e-mail na caixa `nerosaude@gmail.com`,
      que não é o e-mail do NERO (o certo é `nerosaudeapp@gmail.com`).
- [ ] **Verificação em duas etapas nas duas contas Supabase.** Ambas abrem o banco de prontuários.
      Passo a passo: supabase.com/dashboard/account/security → adicionar fator (app autenticador).
      **Sem códigos de recuperação:** cadastrar um segundo fator em outro aparelho.

- [ ] **Revisar os termos de uso com advogado** (D-056). Rascunho em `docs/nero/publicacao/termos-de-uso.md`:
      atenção à limitação de responsabilidade (CDC), ao "não é dispositivo médico" e ao foro. Mudou o
      texto depois de publicado? Trocar `VERSAO_TERMOS`, e todos veem o aceite de novo.

### Ficha das lojas

- [ ] **Capturas de tela** do iPhone 6.9" (1290 × 2796). Com `supportsTablet: false` desde 25/09, não
      são mais necessárias as de iPad.
- [ ] **Textos da ficha**: descrição e palavras-chave. **Decidido em 26/09:** nome "Nero Saúde", subtítulo
      "Sua saúde organizada", categoria principal **Medicina** (secundária Saúde e fitness), idioma português (Brasil).
      Classificação etária: "Medical or Treatment Information" frequente e "Health or Wellness Topics" sim; o resto não.
- [ ] **URL da política**: `https://nerosaude.com.br/privacidade` (já no ar).
- [ ] **Questionário de privacidade da App Store**, respondido a partir da política. O ponto sensível:
      dados de saúde **são** coletados e **são** vinculados à identidade, mas **não** servem a
      rastreamento nem publicidade.
- [ ] **Declarar que não é dispositivo médico.** Apps de saúde precisam disso na revisão; as ressalvas
      dos §26 e §40 já cobrem dentro do app.

### Teste no aparelho

- [ ] **Conferir no build Android 3 os três ajustes da D-064:** a fala do onboarding aparecendo palavra por
      palavra, a barra de abas branca sem o lilás (e se a altura ainda incomoda) e o ícone a 48% na tela inicial.
      Build `cc4d6af8` (versionCode 3, commit `a147786`), publicado no teste interno em 28/09 por
      `node scripts/play-enviar-aab.mjs <URL do .aab>` — os próximos envios Android saem assim, rodados pelo Murilo.

- [x] ~~Gerar o build 3.~~ **Feito em 26/09:** build 3 (1.0.0), canal `production`, commit `76d93af`, pasta `ios/`
      apagada antes (agora no `.gitignore`). Enviado ao TestFlight pela EAS (`ascAppId` no `eas.json`). É o primeiro
      com atualização pelo ar, Sentry, termos/consentimento e login Apple/Google.
- [ ] **Publicar a política junto com o próximo lote do app** (`npm run site:publicar`): o §5 passou a descrever a
      caixa única de aceite (26/09). Publicar antes deixaria a política descrevendo o que o app ainda não mostra.
- [ ] **No build 4, junto:** devolver `"ascAppId": "6815939474"` ao `submit.production.ios` do `eas.json` (sem ele
      o envio ao TestFlight pede modo interativo) e criar `.fingerprintignore` com `eas.json`, para mudanças nele não
      separarem o build das atualizações. Hoje não dá: qualquer uma das duas mudaria o runtime do build 3.
- [ ] **Conferir o onboarding novo (D-063) no aparelho:** as 7 telas, o ritmo da fala (2 s por frase é o ponto de partida),
      o teclado na tela do nome, o iPhone pequeno, o nome chegando ao cadastro e a pergunta dos avisos.
- [ ] **Conferir no build 3 o que só o aparelho mostra:** entrar com a Apple e com o Google; tela "Antes de continuar";
      um erro chegando ao Sentry com arquivo e linha legíveis; uma atualização pelo ar chegando (publicar uma
      mudança pequena com `eas update --channel production`); notificação do check-in no domingo.
- [ ] **Conferir no aparelho D-038 a D-041** no build 3. D-038 e D-039 já passaram no simulador em
      25/09 (Expo Go); falta o build de produção. "Sair da conta" volta ao login; "Não uso
      medicamentos" → Confirmar mostra o verde com "Desfazer" sem fechar o app; "Desfazer" devolve a
      pendência sem piscar; ao abrir, esqueleto e depois a lista inteira de uma vez.
- [ ] **Conferir no aparelho a saída das pendências (D-046)** no build 3: resolver uma pendência em outra
      tela e voltar — a bolinha fica verde e o item sai no lugar dele, sem pular nem piscar.
- [ ] **Conferir no aparelho a roda de horários (D-045)** no build 3: remédio (quantas vezes + primeira
      dose), MRPA, glicemia, consulta e água. No Android, conferir o relógio do sistema, que o
      simulador de iPhone não mostra.
- [ ] **Conferir no aparelho D-043 e D-044** no build 3: a pergunta dos avisos aparece ao ligar
      "Lembrar" num remédio; com as notificações desligadas nos Ajustes, "Abrir Ajustes" cai **direto**
      na página de notificações do NERO (no Expo Go só dá para ver a do Expo Go); os títulos novos;
      e tocar na notificação abre a tela do lembrete, com o app aberto e com ele fechado.
- [ ] **Percorrer `checklists/publicacao.md`** com o build do TestFlight. Só agora dá para testar
      ícone, splash e Face ID — nada disso existe no Expo Go.
- [ ] Os outros seis checklists (`fase-0`, `2a`, `2b`, `3`, `4a`, `4b`): **148 itens, nenhum marcado** (mais os 70 de `publicacao.md`).
      É a maior massa de trabalho restante e a única sem substituto.
- [ ] As seis revisões de texto em `docs/nero/revisao/`, também intocadas.

## 2. Configuração que não é código

- [x] ~~Proteção contra senha vazada.~~ **O Murilo decidiu não ligar (26/09).** Se mudar de ideia: Authentication ›
      Providers › Email › "Prevent use of leaked passwords" (plano Pro); o app já tem a mensagem (D-055).
- [ ] **Authentication → Rate Limits:** seis senhas erradas seguidas não foram bloqueadas no teste de
      24/09. Sugerido em D-031: manter login em 30/hora (o limite é por IP, e rede compartilhada faz
      várias pessoas dividirem um) e baixar a **verificação de código para 10/hora**.

## 3. Buracos funcionais conhecidos

- [ ] **Desfazer a declaração negativa depois dos 15 segundos.** Quem perde a janela do "Desfazer"
      (D-028) ainda precisa cadastrar um medicamento de verdade para a pendência voltar. As telas de
      Meus medicamentos e Antecedentes familiares não têm botão para reverter.
- [ ] **Duplicação em Minha Saúde.** "Linha do tempo" e "Meus lembretes" continuam na lista apontando
      para as abas Histórico e Agenda (D-022). Foi deliberado — a barra é o atalho de quem sabe onde
      vai, a lista é o mapa de quem procura — mas é uma linha para remover cada, se incomodar.
- [ ] **`peso` é um construtor órfão** em `relatorios/montar.ts`: não está em nenhuma lista e nunca
      esteve. A seção `corpo` da Fase 4 já traz peso, IMC, cintura e tendência. Candidato a remoção.

## 4. Pedidos do Murilo ainda não desenhados

- [ ] **Atalhos na home: próximos candidatos** (a faixa entrou em 25/09, D-053). O Murilo quer, quando
      existirem, os **planos que o médico passar** (depende do portal do médico) e a **próxima consulta**.
- [ ] **Preço dos medicamentos** (pedido em 25/09). Mostrar quanto custa cada remédio cadastrado.
      **A definir:** a fonte — a candidata natural é a tabela da CMED/Anvisa, que é pública, mas
      traz o **preço máximo** (PMC), não o de balcão; mostrar como "preço" enganaria. Também: por
      apresentação (dose × quantidade), como atualizar (a tabela muda todo ano, e às vezes no meio
      dele) e se o app mostra genérico e similar ao lado do de referência.
- [ ] **Disponibilidade no SUS** (pedido em 25/09). Indicar se o medicamento sai de graça ou com
      desconto na rede pública. **A definir:** as fontes são diferentes e não se somam — RENAME
      (lista nacional, mas cada município tem a sua REMUME), Farmácia Popular (gratuito ou com
      copagamento, lista própria) e Componente Especializado (alto custo, exige processo e laudo).
      Dizer "tem no SUS" sem distinguir os três seria prometer à pessoa algo que o posto dela pode
      não ter. Seguir o método das regras clínicas: versão mais recente de cada lista, com data e
      referência no documento.
- [ ] **Tutoriais de uso de alguns medicamentos** (pedido em 25/09). Passo a passo para os que têm
      técnica e onde o erro é comum. **A definir:** quais entram (candidatos: caneta de insulina,
      bombinha e espaçador, colírio, anticoagulante injetável, adesivo transdérmico), o formato
      (texto com ilustração, vídeo, animação) e a fonte de cada passo — bula, manual do fabricante
      ou material do Ministério da Saúde, sem instrução inventada. Serve ao público 60+ tanto quanto
      o lembrete; letra grande e um passo por tela.

## 5. Decisões adiadas, com o motivo

- [ ] **Layout para iPad.** `supportsTablet` foi desligado em 25/09 porque nenhuma tela adapta para
      tela larga: os únicos `maxWidth` do código estão em modais. O app ainda roda em iPad, em janela
      de iPhone. Ligar de novo exige limitar largura de conteúdo, repensar a grade de módulos e os
      formulários — e só então gerar capturas de 2048 × 2732.
- [ ] **Login com Apple e Google.** Não é obrigatório: a regra da Apple só exige "Entrar com a Apple"
      se o app oferecer outro login social, e hoje só existe e-mail e senha. Para público de 60+
      eliminaria a senha esquecida, que é a maior causa de abandono. Custo: configuração nas duas
      plataformas e mudança no fluxo de conta.
- [ ] **Atualização pelo ar (`expo-updates`).** Não instalado. Sem ele, toda correção de JavaScript
      exige build novo e revisão da loja. Com ele, correções chegam em minutos. Os `channel` foram
      removidos do `eas.json` em 25/09 justamente porque eram ignorados sem o pacote.
- [ ] **Variante monocromática vazada do ícone.** Montada, mostrada em contexto e **recusada** pelo
      Murilo em 24/09 ("a vazada está horrível"). Fica a silhueta cheia. Registrado em D-026 para
      ninguém propor de novo.
- [ ] **15 vulnerabilidades moderadas** nas dependências, todas indiretas, de duas origens
      (`decode-uri-component` via expo-router, `uuid` via expo-sharing). **Não corrigir:**
      `npm audit fix --force` rebaixaria o Expo do SDK 57 para o 46. Reavaliar quando o Expo atualizar.
- [ ] **Cor do splash.** Está `#FFFFFF`, igual ao ícone, mas o app abre em `#F5F7FB`. Há um salto sutil
      de cor no instante em que a primeira tela aparece. Usar `#F5F7FB` no splash resolveria, ao custo
      de não bater com o ícone.

## 6. Riscos conhecidos, sem ação definida

- **Os arquivos não têm backup.** Os backups diários da Supabase cobrem o banco, mas **não o Storage**,
  onde vivem laudos, fotos de exame e PDFs (confirmado no painel em 24/09). Isso é bom para privacidade
  — quem exclui a conta some na hora, sem cópia — e ruim para durabilidade: arquivo perdido não volta.
  Aceitável hoje porque o documento original está com o paciente. **Se o NERO um dia for o único lugar
  onde aquele laudo existe, a conta muda.**
- **Nunca use `supabase config push`.** O `config.toml` do repositório está desatualizado em relação ao
  servidor: nele a confirmação de e-mail aparece desligada e o SMTP do Resend não existe. Um push
  derrubaria o cadastro e o envio de e-mails de uma vez. Verificado em 24/09.
- **O bundle `br.com.nerosaude.app` é permanente.** Registrado na conta Apple em 25/09. Mudar significa
  app novo na loja, sem histórico e sem os usuários.
- **Teto de 64 notificações agendadas no iOS** (D-047/D-048). Resolvido para o uso comum em 25/09: remédio,
  glicemia e água viraram um aviso diário por horário. Só um caso extremo (uns 10 remédios × 3 horários,
  água de hora em hora, glicemia e MRPA juntos) ainda passaria de 64.

## 7. Ideias registradas, nada decidido

- **Portal do médico** (`docs/nero/ideias/portal-do-medico.md`): o médico entra pelo site, informa o CPF
  do paciente, cola o prontuário e o conteúdo vai para a conta dele. A pergunta que precisa de resposta
  antes de qualquer código: **como o paciente autoriza?** CPF não é segredo, e escrever no prontuário de
  alguém sabendo só o CPF não pode existir.
  - **Lembrete de exame pendente depende do portal** (decisão do Murilo em 25/09). Hoje o Rastreando só
    avisa sobre exame já registrado; quem vê "Mamografia pendente" não recebe aviso nenhum. O app não vai
    avisar para marcar um exame por conta própria: o aviso nasce quando o médico lançar o plano no
    prontuário pelo portal e o exame pedido chegar ao app. Até lá, fica como está.
