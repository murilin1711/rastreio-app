# Checklist — preparação para publicação

> Revisado em 25/09/2026 contra o código atual. Rodar no aparelho e anotar o que quebrar.
> **Primeira rodada no TestFlight em 25/09** (build 2): cadastro, código por e-mail e Face ID passaram.
> Migrações aplicadas até a **0020**.

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
