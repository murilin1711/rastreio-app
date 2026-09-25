# Handoff — 25/09/2026: o primeiro build, e o que o aparelho mostrou

> **O NERO está no App Store Connect.** App ID `6815939474`, versão 1.0.0, build 2, no TestFlight.
> Esta foi a primeira vez que o app rodou fora do Expo Go — e quatro coisas só apareceram aí.

## Onde a coisa está

| | |
|---|---|
| iOS | Build 2 no TestFlight, testado no iPhone do Murilo |
| Android | Nada. A conta do Google Play ainda não existe |
| Bundle | `br.com.nerosaude.app` — permanente, não dá para trocar |
| Site | `nerosaude.com.br/privacidade` no ar (Vercel + registro A) |
| Testes | 488 em 65 suítes, `tsc` limpo, `expo-doctor` 21/21 |

**O build 2 não serve para submeter.** Ele foi compilado às 00:56, doze minutos antes de o
`supportsTablet: false` entrar no `app.json`, então ainda declara iPad e a Apple cobraria as
capturas de 2048 × 2732. Para testar no iPhone ele vale: fora essa linha, é idêntico ao código de
hoje. **Tudo o que foi corrigido depois das 01:00 está esperando o build 3.**

## O susto do começo, e por que vale reler

O Murilo não conseguiu entrar, e o "Esqueci minha senha" não mandou e-mail nenhum. Parecia
infraestrutura quebrada. Não era: **não existia conta com aquele e-mail.** Uma causa só explicava os
dois sintomas, porque `resetPasswordForEmail` devolve sucesso e não envia nada quando o e-mail não
tem conta.

O que ficou verificado no caminho, e não precisa ser verificado de novo:

- A URL e a chave publicável **estão** no binário. O primeiro `grep` disse que não estavam —
  **era falso negativo**: o bundle é bytecode Hermes, e só `strings` com `LC_ALL=C` acha as strings.
  Se essa dúvida voltar, o comando está na D-035.
- O servidor de auth responde em 0,48 s; o SMTP do Resend está gravado, com remetente e senha.
- As variáveis do EAS existem no ambiente `production` e entraram no build.

**A lição que virou código:** a tela de recuperação avança mesmo sem conta, de propósito (não
contar a estranhos quem tem conta no app), e isso deixava a pessoa esperando para sempre um código
que não vinha. Se custou meia hora a quem escreveu o código, dona Maria não sai de lá. A linha nova
nomeia as duas causas sem confirmar nenhuma.

## O que foi feito hoje (tudo pendente de aparelho)

**D-034 — iPad desligado.** Nenhuma tela adapta para tela larga; os únicos `maxWidth` do código
estão em modais. Publicar em iPad entregaria uma versão pior do app com a mesma nota na loja.

**D-035 — O piscar, parte 1.** Eram duas causas. A borda do campo trocava de cor no mesmo frame, e
ao passar de um campo para outro **duas** bordas mudavam de uma vez — agora a cor atravessa em
160 ms, e vale para os 32 arquivos que usam o campo. E as três etapas da recuperação trocavam de
conteúdo sem sinal de avanço — agora deslizam 16 px no sentido da navegação.

**D-036 — O piscar, parte 2, e a causa raiz de verdade.** O `Protegido` fazia
`if (travado) return <TelaBloqueada/>`: enquanto travado, **o `<Stack>` não existia**. Passar o
rosto não revelava o app, montava o app inteiro do zero. Agora a cobertura fica por cima, o app
carrega atrás da tela de bloqueio, e o tempo do Face ID deixou de ser tempo perdido.

**D-037 — A tolerância de 5 minutos nunca funcionou.** O iOS passa por `inactive` nas duas pontas,
e o `inactive` da volta apagava a hora da saída: a conta dava sempre zero, e o app não pedia
biometria ao voltar do segundo plano nem depois de horas. O celular na mesa com o NERO aberto atrás
abria o prontuário para quem o pegasse. **Os testes passavam porque simulavam
`background → active`, sequência que o iPhone nunca emite.** Agora há um bloco com os estados
reais, e os dois primeiros testes dele falhavam antes da correção.

> O padrão de D-036 e D-037 se repete: **o que o aparelho mostra não é o que o teste simula.** Os
> dois defeitos estavam no código desde 24/09, com a suíte verde.

## O que o Murilo validou no aparelho

Cadastro, remetente, código de 6 números, entrada sem botão de confirmar. Face ID: a seção aparece,
ligar pede o rosto na hora, fechar o app e reabrir pede e não mostra dado nenhum, voltar rápido não
pede. Marcados em `checklists/publicacao.md`.

**Não testado ainda, e é o que importa:** voltar depois de **mais** de 5 minutos (nunca funcionou
até hoje — deixar o app de lado uns 6 minutos de propósito) e desligar o Face ID nos Ajustes do
iPhone para ver se o app pede **a senha da conta** em vez de liberar. Esse último é a decisão que o
Murilo corrigiu em 24/09 e é o que separa biometria de porta destrancada.

## Próximo passo

1. Terminar `checklists/publicacao.md` no build 2 — são 70 itens, 8 marcados.
2. Gerar o **build 3** com o acumulado (D-034 a D-037) mais o que os testes acharem.
3. Só então a ficha da App Store.

**Não gerar o build 3 antes de terminar os testes.** Cada build é uma revisão e uma espera.

## Antes de mexer em qualquer coisa

- **Nunca** `supabase config push` — o `config.toml` do repo está velho e derrubaria o cadastro e o
  SMTP de uma vez.
- **Nunca** `npm audit fix --force` — rebaixaria o Expo do SDK 57 para o 46.
- As pendências vivem em [`../PENDENCIAS.md`](../PENDENCIAS.md), inclusive as credenciais a revogar
  (dois tokens Supabase e a chave do Resend apareceram no chat) e o Google Play, cujo relógio de
  12 testadores × 14 dias só começa quando a conta existir.
