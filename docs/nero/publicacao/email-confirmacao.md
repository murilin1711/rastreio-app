# Template do e-mail de confirmação (D-019)

> Cole em **Supabase › Authentication › Email Templates › Confirm signup**.
> O que faz o código aparecer é o `{{ .Token }}`. **Não usar `{{ .ConfirmationURL }}`** — o link é
> justamente o caminho que a D-019 descartou.

**Assunto:** `Seu código do Nero Saúde`

## Corpo (HTML)

```html
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 18px; color: #0f2d63; line-height: 1.6; max-width: 480px;">
  <p>Olá!</p>

  <p>Para terminar seu cadastro no <strong>Nero Saúde</strong>, digite este código no aplicativo:</p>

  <p style="font-size: 40px; font-weight: bold; letter-spacing: 8px; text-align: center; margin: 28px 0; color: #0f2d63;">
    {{ .Token }}
  </p>

  <p>O código vale por 1 hora.</p>

  <p style="font-size: 16px; color: #4A5C7A;">
    Pedimos esse código para ter certeza de que este e-mail é seu. É por ele que você recupera sua
    senha, caso um dia esqueça.
  </p>

  <p style="font-size: 16px; color: #4A5C7A;">
    Se não foi você quem criou a conta, pode ignorar esta mensagem.
  </p>
</div>
```

## Por que o texto é assim

- **Uma ideia por parágrafo, frases curtas.** O público é majoritariamente idoso.
- **O código é a maior coisa da tela** (40 px, espaçado), porque é a única coisa que a pessoa
  precisa fazer. Ela vai ler no celular, muitas vezes sem óculos.
- **Explica por que o código existe** ("é por ele que você recupera sua senha"). Sem isso, o passo
  parece burocracia e a pessoa abandona.
- **Sem jargão**: nada de "verificação", "autenticação", "token", "OTP".
- **Sem link nenhum**, de propósito: e-mail de saúde com link treina a pessoa a clicar em links de
  e-mail, que é exatamente o hábito que golpistas exploram nesse público.

## Enquanto o domínio não verifica

O SMTP do Resend exige domínio verificado, então esse e-mail **só sai depois** de o domínio ficar
*Verified* no Resend. Antes disso a confirmação continua desligada e o cadastro funciona direto,
como hoje.
