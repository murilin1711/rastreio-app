# Checklist — preparação para publicação

> Revisado em 25/09/2026 contra o código atual. Rodar no aparelho e anotar o que quebrar.
> **Primeira rodada no TestFlight em 25/09** (build 2): cadastro, código por e-mail e Face ID passaram.
> Migrações aplicadas no remoto até a **0022** (conferido em 24/11 com `supabase migration list --linked`); 0023 e 0024 pendentes (D-066, D-067).

## Build 6: navegação, remédio tomado e relatório novo (D-065, D-066, D-067)

> **Cada passo abaixo só roda com o OK do Murilo**, um de cada vez, nesta ordem. Nada daqui foi feito pelo
> Claude durante o desenvolvimento: as migrações rodaram só no Supabase local e o site só foi gerado em `site/`.
> A ordem importa: o app novo grava em `tomadas_medicacao` (0023), sobe um JSON no bucket `relatorios` (0024) e
> põe no QR o endereço `https://nerosaude.com.br/r/`. Se o build sair antes, marcar remédio e gerar o QR falham.

### (a) Migrações no Supabase remoto (OK do Murilo)
- [ ] Conferir o que o remoto já tem: `npx supabase migration list` (local e remoto lado a lado). Devem faltar só a 0023 e a 0024; se faltar outra, ela sobe junto no `db push`: avisar o Murilo antes.
- [ ] **OK do Murilo** → `npx supabase db push`: aplica a **0023** (`tomadas_medicacao`, quantidades, `horarios_desde` com gatilho) e a **0024** (bucket `relatorios` aceita `application/json`).
- [ ] `migration list` mostra 0023 e 0024 no remoto. No painel: Storage → `relatorios` → tipos permitidos = PDF e JSON; tabela `tomadas_medicacao` com RLS ligada.
- [ ] O build que está nas lojas continua abrindo "Meus remédios" e os lembretes (a 0023 manteve `horarios` como lista de `'HH:MM'`).

### (b) Site: página do QR e política (OK do Murilo) — ANTES do build
- [ ] `.env.local` com o `EXPO_PUBLIC_SUPABASE_URL` **remoto** (o `gerar-site.mjs` se recusa a gerar com o local).
- [ ] `npm run site` e conferir `git diff site/`: só `privacidade/` (política de 24/11) e `r/` mudam.
- [ ] **OK do Murilo** → `npm run site:publicar`.
- [ ] https://nerosaude.com.br/r/ responde e, sem link, mostra "Este relatório não está mais disponível."
- [ ] https://nerosaude.com.br/privacidade mostra "Última atualização: 24 de novembro de 2026" e o item "Compartilhamento por QR Code" novo.

### (c) Build e envio às lojas (OK do Murilo)
- [ ] **OK do Murilo** → build iOS e Android (`eas build`) e envio (TestFlight / teste interno do Play).
- [ ] Se o Murilo também quiser atualização pelo ar (`eas update`) para quem já tem o app, ela só sai depois de (a) e (b), com o mesmo OK.

### (d) QA no aparelho (build novo, logado com Apple ou Google)

**Navegação (D-065)**
- [ ] **Folha Anotar:** nas 4 abas raiz, o ＋ (≥ 60 pt, canto direito, acima da barra) abre "O que você quer anotar?" por cima, como modal. "Fechar" fecha; arrastar para baixo fecha.
- [ ] **Itens da folha:** Pressão, Glicemia, Peso e medidas, Sono, Atividade, Água, Refeição e Resultado de exame abrem por cima da folha e, ao salvar, voltam a ela. Foto de documento fecha a folha e volta à tela de antes do ＋. Cada item a ≤ 2 toques.
- [ ] **＋ some nas telas internas** (módulos, temas, formulários): não cobre "Salvar".
- [ ] **Espaço no fim:** nas 4 abas, rolando até o fim, o ＋ não cobre o último item.
- [ ] **Início:** as 5 ações abrem a tela certa em 1 toque e a seta volta ao Início. Em "Meus cuidados", o VoiceOver lê o nome e depois a descrição.
- [ ] **Voltas:** exame cardio aberto do Histórico volta ao Histórico; links do aviso da MRPA em Levar ao médico voltam a Levar ao médico; `coracao/exames` (link antigo) leva a Meus exames.
- [ ] **Formulários** dizem "Anotar minha pressão", "Anotar noite de sono"…; seções "Minha pressão" / "Minha glicemia".
- [ ] **Letra grande** (Ajustes › Acessibilidade › Tamanho do texto, no máximo): botões a 17 pt quebram linha sem corte ("Salvar e adicionar outro da mesma data", "Encerrar compartilhamento", "Mostrar QR para o médico", "Gerar PDF e compartilhar" etc.); atenção aos botões lado a lado.
- [ ] **Exames de prevenção sem rede:** o texto de erro tem respiro.

**Remédio tomado (D-066)**
- [ ] **Cadastro:** remédio "Teste" com 1 horário daqui a 2 min, 1 comprimido, lembrete ligado → aparece uma vez "Sempre que tomar, marque no NERO…", que fica fixa no topo de "Meus remédios". As 5 unidades cabem em tela de 320 pt.
- [ ] **Notificação:** `Hora do remédio: Teste · 1 comprimido 💊` / `Toque aqui para marcar`.
- [ ] **Toque abre "Tomou?"** (app fechado e aberto) na dose e data certas, com "Quantos comprimidos?" em 1. Conferir a ordem botões × seletor.
- [ ] **2º aviso em 30 min** sem marcar: `Você tomou Teste das <h>? 💊`; tocar abre a mesma dose.
- [ ] **Marcar cancela o 2º** ("✓ Tomei" e também "Não tomei").
- [ ] **Já marcado:** "Você já marcou essa dose às …" com "Corrigir" e "Tomei de novo".
- [ ] **"De ontem"** em ＋ Anotar › Tomei remédio; no outro dia some (vira "sem registro").
- [ ] **Para fazer hoje** mostra a dose passada não marcada ("Teste · 8h") e abre "Tomou?".
- [ ] **Check-in semanal:** quadro "Seus remédios nesta semana" com símbolos e "3 de 4 · 1 não tomada", sem cor; "se precisar" mostra "usou N vezes".
- [ ] **Interromper/reativar:** lembretes param e as doses somem; ao reativar, o período parado não vira "sem registro".
- [ ] **Preferência "Medicamentos" desligada:** nem o principal nem o 2º chegam.
- [ ] **Virada do dia:** dose às 23:45 sem marcar → aviso das 00:15 chega mesmo abrindo o app logo após a meia-noite.
- [ ] Android: anúncio do leitor de tela não repete duas vezes ao marcar.

**Relatório e QR (D-067)**
- [ ] **Prévia:** Levar ao médico → "Resumo completo": painel em 1 coluna antes das seções, "Gerado em …", gráfico na largura da tela e nada cortado num iPhone SE.
- [ ] **PDF** (iOS e Android): página 1 é o painel inteiro; "Para atenção nesta consulta" só quando há algo; cartões em 2 colunas; remédios com ● ○ ◆ –; no detalhe, a coluna "Marcado às". Sem nenhuma cor de julgamento. "Resumo completo" da conta de teste com **5 páginas** (o expo-print pode paginar diferente do Chrome).
- [ ] **Gerar o QR:** o alerta de envio aparece; o QR e "Compartilhamentos ativos" mostram a validade de 7 dias.
- [ ] **QR do PDF impresso** lido por câmera de iPhone e de Android abre https://nerosaude.com.br/r/ com o relatório inteiro.
- [ ] **Página no Safari do iOS:** relatório em 1 coluna dentro do iframe, altura certa (sem rolagem dupla nem corte), "Baixar PDF" abre o PDF, links das fontes abrem em aba nova. Também no Chrome do Android.
- [ ] A barra de endereço fica `nerosaude.com.br/r/` (sem o `#…`); recarregar mostra "não está mais disponível" (esperado: ler o QR de novo).
- [ ] **Encerrar** o compartilhamento (prévia ou Compartilhamentos ativos) → o mesmo QR mostra "Este relatório não está mais disponível."; no painel da Supabase, o PDF e o `.json` sumiram de `relatorios/<usuário>/`.
- [ ] **Exclusão de conta** com QR ativo: a pasta do usuário some de `relatorios` e o QR não abre mais.

## Entrada no app (D-033) — nunca testado, tudo novo

- [ ] **Onboarding:** para vê-lo de novo, apagar os dados do app ou reinstalar. Três slides de fundo claro, o Nero em cada um, exemplos em linhas. Nenhum diagrama.
- [ ] Rolar os três e tocar em "Começar": vai para o login e **não volta a aparecer** nas próximas aberturas.
- [ ] "Pular" no primeiro slide faz o mesmo.
- [ ] **Login:** campos grandes, sem mascote, "Esqueci minha senha" à direita abaixo da senha.

### Recuperação de senha (D-033) — fluxo inteiro novo

> O template foi aplicado na Supabase em 24/09 e conferido na resposta do servidor. Falta a tela.

- [ ] "Esqueci minha senha" → digitar o e-mail → "Enviar código".
- [ ] O e-mail chega com assunto **"Sua nova senha do Nero Saúde"**, em português, com **código de 6 números** (se vier link em inglês, o template voltou ao padrão: rodar `scripts/configurar-auth.mjs --aplicar`).
- [ ] Digitar o código: vai para a **tela seguinte**, só então pedindo a senha.
- [ ] Código errado: avisa e deixa tentar de novo, sem sair da tela.
- [ ] Senhas diferentes nos dois campos: avisa "as senhas não são iguais".
- [ ] Senha com menos de 8 caracteres: avisa.
- [ ] Senha nova salva: entra direto no app.
- [ ] Sair e entrar de novo com a senha nova.
- [ ] **E-mail que não existe:** a tela avança igual, sem dizer que a conta não existe. É de propósito.

## Confirmação de e-mail por código (D-019) — configurada e validada em 22/09

- [x] Servidor validado: domínio no Resend, SMTP gravado, cadastro real com `status=delivered`.
- [x] Criar conta pelo app: vai para "Confirme seu e-mail" mostrando o endereço (e **não** para o login).
- [x] Remetente **Nero Saúde `<nao-responda@nerosaude.com.br>`**, assunto **"Seu código do Nero Saúde"**.
- [x] O código tem **6 números** (se vierem 8, `mailer_otp_length` voltou ao padrão).
- [x] Digitar os 6 números: entra sozinho, **sem botão de confirmar**.
- [ ] iOS: o teclado oferece o código acima das teclas (`autoComplete="one-time-code"`).
- [ ] Código errado: continua na tela e deixa digitar outro.
- [ ] "Enviar outro código" destrava em 60 s e faz chegar outro e-mail.
- [ ] **Beco sem saída:** cadastrar, fechar sem confirmar, reabrir e tentar entrar → reenvia o código e cai na confirmação.
- [ ] Ler o e-mail como um paciente idoso leria: o código é grande o bastante?

**Se o e-mail chegar mas a tela recusar o código:** é quase certo o `type` do `verifyOtp`, em
`app/(auth)/confirmar.tsx` (`'signup'`; a alternativa é `'email'`). Registrado na D-019.

## Segurança (D-031, D-032)

- [ ] **Sessão migrada:** quem já estava logado continua logado depois de atualizar. Se pedir login de novo, a migração do `AsyncStorage` para o Keychain falhou.
- [x] **Face ID:** Minha Saúde → Segurança. A seção só aparece em aparelho com biometria cadastrada.
- [x] Ligar: pede o rosto **na hora**. Recusando, não liga.
- [x] Fechar o app por completo e abrir: pede o rosto, e a tela de bloqueio **não mostra nome nem dado nenhum**.
- [x] Trocar para outro app e voltar em menos de 5 minutos: **não** pede de novo.
- [ ] Voltar depois de mais de 5 minutos: pede. **Nunca funcionou até 25/09 (D-037); testar de novo no build 3.**
- [ ] Desligar o Face ID nos Ajustes do iPhone e abrir o app: deve pedir **a senha da conta**, não liberar.
- [ ] **Upload:** tentar anexar um arquivo maior que 10 MB. O app recusa; o servidor também (limite no bucket desde a 0020).

## Ícone e splash (D-026) — só aparecem em build nativo

> Nada disso muda no Expo Go: o ícone da tela inicial é o do próprio Expo Go.

- [ ] Depois do primeiro build: o ícone na tela inicial é **branco**, com a marca maior que antes.
- [ ] O splash abre **branco**, não bege.
- [ ] Android: o ícone cabe inteiro no recorte, seja círculo, squircle ou quadrado.

## Home e navegação (D-022, D-024, D-027, D-028)

- [ ] A barra de abas **não encolhe** ao rolar: fica inteira o tempo todo.
- [ ] Os cards de módulo não ficam embaixo da barra em nenhuma das quatro abas.
- [ ] Ao abrir o app, **não pisca** "Nada pendente" antes das pendências reais aparecerem.
- [ ] Tocar em "Não uso medicamentos": alerta explicando onde completar depois → confirmar → a bolinha fica verde e aparece o cartão de **Desfazer** com a linha do tempo correndo 15 s.
- [ ] Tocar em Desfazer: o cartão recolhe suavemente e a pendência volta. **Sem piscar.**
- [ ] Deixar os 15 s passarem: a pendência sai sozinha.
- [ ] O **foguinho** da sequência abre o pop-up de explicação, por cima de tudo, e fecha tocando fora.

## Levar ao médico (D-025)

> Era "Relatórios" + "Preparar minha consulta", hoje é um item só.

- [ ] Minha Saúde tem **um** item "Levar ao médico" (e não os dois antigos).
- [ ] Dentro: "Resumo completo" em primeiro, marcado como recomendado; depois as três áreas; embaixo "Vou a um médico específico".
- [ ] Escolher uma especialidade: a lista mostra o nome comum ("Médico do coração") com o técnico abaixo.
- [ ] Havendo consulta marcada, ela aparece pronta no topo.
- [ ] O PDF por especialidade traz o foco primeiro e **"Outras informações do meu histórico"** depois.
- [ ] Rastreamento que não se aplica ao perfil (mama em perfil masculino) **não aparece** no relatório.
- [ ] **Gerar PDF e compartilhar:** o Nero pensa por 2 s, a espera **sai da tela**, e só então abre a folha de compartilhamento.
- [ ] Cancelar durante a espera: nada é compartilhado.

## Backup (D-018)

- [x] **Backups diários confirmados em 24/09** (oito cópias no painel, de 17 a 24/09).
- [ ] Ligar **verificação em duas etapas nas duas contas** Supabase — ambas abrem o banco de prontuários.

## Pendências de credencial

- [ ] Apagar o usuário de teste `nerosaude+teste1@gmail.com` (id `c8c75d7e-e0cc-41d8-b901-6acef5bdf703`) em Authentication › Users. **Confirmado em 24/09 que ainda existe.**
- [ ] Apagar também `teste.remoto@nero.dev`, se não for mais usado.
- [ ] Revogar os tokens da Supabase: o de 22/09 e o de 24/09 (este apareceu no chat).
- [ ] Recriar a chave do Resend: a atual foi colada no chat em 22/09.

## Ingestão de água (D-020)

- [ ] Registrar água alguns dias, gerar **"Peso, alimentação e sono"** e conferir a seção "Ingestão de água".
- [ ] A média por dia considera só os dias com registro (um dia sem anotar **não** derruba a média).
- [ ] A sequência de dias seguidos **não aparece** no relatório. É de propósito (D-020).

## Notificações

- [ ] Android: o canal "Lembretes" aparece em Configurações → Apps → NERO → Notificações.
- [ ] Agendar um lembrete para daqui a 2 minutos com o app **aberto**: aparece como banner.
- [ ] Mesmo teste com o app **fechado**: aparece.
- [ ] **Medicação:** cadastrar um remédio com horário poucos minutos à frente, **ativo e com o interruptor de lembrete ligado**. A notificação chega no horário.

## Exclusão de conta

- [ ] Criar conta de teste, anexar 1 documento e gerar 1 relatório com QR.
- [ ] Minha Saúde → "Excluir minha conta": o botão só habilita depois de digitar EXCLUIR.
- [ ] Confirmar: volta para o login.
- [ ] Tentar entrar com o mesmo e-mail e senha: "credenciais inválidas".
- [ ] No dashboard: Storage → `laudos` e `relatorios` sem a pasta do usuário; Authentication sem o usuário.
- [ ] O link do QR gerado antes não abre mais.
- [ ] Em modo avião, o botão fica desabilitado com a mensagem de sem conexão.

## Permissões (textos em português)

- [ ] iOS: ao anexar por câmera e por galeria, o pedido mostra o texto do NERO, não o padrão em inglês.
- [ ] iOS: ao ligar o Face ID, o pedido mostra o texto do NERO (`NSFaceIDUsageDescription`).
- [ ] Android: não aparece pedido de microfone em nenhum fluxo.
