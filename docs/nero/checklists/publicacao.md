# Checklist — preparação para publicação (D-012, D-013, D-019)

> Rodar no aparelho depois do `db push` da migração 0014. Marcar e anotar o que quebrou.

## Confirmação de e-mail por código (D-019) — configurada em 22/09, **não testada no aparelho**

> O servidor já foi validado: domínio verificado no Resend, SMTP gravado e conferido, e um cadastro
> real de teste saiu com `status=delivered`. **O que falta é a tela.** Fazer com um e-mail de verdade
> a que você tenha acesso (pode ser `nerosaude+algo@gmail.com` — o Gmail entrega na mesma caixa).

- [ ] Criar conta pelo app: depois de "Criar conta", o app vai para a tela "Confirme seu e-mail" mostrando o endereço digitado (e **não** para o login).
- [ ] O e-mail chega com remetente **Nero Saúde `<nao-responda@nerosaude.com.br>`** e assunto **"Seu código do Nero Saúde"**.
- [ ] O código tem **6 números** (se vierem 8, `mailer_otp_length` voltou ao padrão — rodar `scripts/configurar-auth.mjs` de novo).
- [ ] Digitar os 6 números: o app entra sozinho, **sem botão de confirmar**.
- [ ] iOS: o teclado oferece o código automaticamente acima das teclas (`autoComplete="one-time-code"`).
- [ ] Digitar um código errado: aparece "O código não conferiu…", a pessoa **continua na tela** e consegue digitar outro.
- [ ] O botão "Enviar outro código" começa travado com a contagem e destrava em 60 s; ao tocar, chega outro e-mail.
- [ ] **Beco sem saída:** cadastrar, fechar o app sem confirmar, reabrir e tentar **entrar** pelo login → deve reenviar o código e cair na tela de confirmação (e não num alerta de erro).
- [ ] Ler o e-mail no celular como um paciente idoso leria: o código é grande o bastante? O texto é claro?

**Se o e-mail chegar mas a tela recusar o código:** é quase certo o `type` do `verifyOtp`. Está em
`app/(auth)/confirmar.tsx` como `'signup'`; a alternativa é `'email'`. Está registrado na D-019.

**Duas pendências que sobraram da configuração:**
- [ ] Apagar o usuário de teste `nerosaude+teste1@gmail.com` (id `c8c75d7e-e0cc-41d8-b901-6acef5bdf703`) em Authentication › Users.
- [ ] Revogar o token da Supabase criado em 22/09 para a configuração (`supabase.com/dashboard/account/tokens`).

## Backup (D-018)
- [ ] Em **Database › Backups**, confirmar que aparecem os backups diários (o projeto foi para o Pro em 22/09; o primeiro ciclo pode levar horas).
- [ ] Ligar **verificação em duas etapas nas duas contas** Supabase — ambas abrem o banco de prontuários.
- [ ] **A política de privacidade não pode ser publicada antes** deste item: a seção 8 promete cópias de 7 dias.

## Ingestão de água no relatório (D-020)
- [ ] Registrar água alguns dias, gerar o **Relatório de Saúde & Hábitos** e conferir a seção "Ingestão de água".
- [ ] A média por dia considera só os dias com registro (um dia sem anotar **não** derruba a média).
- [ ] A **sequência de dias seguidos não aparece** em lugar nenhum do relatório — é de propósito (D-020).

## Notificações (canal Android)
- [ ] Android: ao abrir o app pela primeira vez após atualizar, em Configurações → Apps → NERO → Notificações aparece o canal "Lembretes".
- [ ] Agendar um lembrete de medida para daqui a 2 minutos e deixar o app **aberto**: a notificação aparece como banner.
- [ ] Mesmo teste com o app **fechado**: a notificação aparece.

## Exclusão de conta
- [ ] Criar uma conta de teste, anexar 1 documento e gerar 1 relatório com QR.
- [ ] Minha Saúde → "Excluir minha conta": o botão só habilita depois de digitar EXCLUIR.
- [ ] Confirmar: volta para a tela de login.
- [ ] Tentar entrar com o mesmo e-mail/senha: "credenciais inválidas".
- [ ] No dashboard do Supabase: Storage → `laudos` e `relatorios` sem a pasta do usuário; Authentication sem o usuário.
- [ ] Abrir o link do QR gerado antes: não abre mais.
- [ ] Em modo avião, o botão fica desabilitado com a mensagem de sem conexão.

## Permissões (textos em português)
- [ ] iOS: ao anexar por câmera e por galeria, o pedido de permissão mostra o texto do NERO (não o padrão em inglês).
- [ ] Android: não aparece pedido de microfone em nenhum fluxo.
