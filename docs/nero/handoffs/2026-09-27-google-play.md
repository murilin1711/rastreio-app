# Handoff: Google Play — conta, teste interno e API

**Data:** 27/09/2026 · **Status:** em andamento. App no **teste interno** do Play; faltam teste em Android real, capturas de tela e a versão de produção.

## 1. Objetivo
Publicar o Nero Saúde (`br.com.nerosaude.app`) no Google Play. Esta sessão criou a conta de desenvolvedor, montou a ficha e as declarações, gerou o primeiro build Android e o publicou no teste interno, e deixou a API do Play configurada para os próximos envios saírem do terminal.

## 2. Contexto essencial
- **Conta Play = Organização, no CNPJ (MEI) 62.043.447/0001-03** ("62.043.447 MURILO ROIZ POVOA", Goiânia). Motivo: o Google exige conta de organização para "apps médicos", e o Nero cai em "Medication and Treatment Management" e "Diseases and Conditions Management" (support.google.com/googleplay/android-developer/answer/13634885 e /answer/14738291). Conta de organização **não** tem a regra de 12 testadores × 14 dias.
- **Apple continua no CPF** (decisão do Murilo). Risco conhecido: diretriz 5.1.1(ix); só reavaliar se a revisão da Apple reclamar.
- CNAE do MEI é "Cursos preparatórios para concursos" — não travou o Google; falar com contador se o Nero faturar.
- Dona da conta Play (permanente): `nerosaudeapp@gmail.com`. E-mail do domínio `contato@nerosaude.com.br` recebe pela Hostinger (MX `mx1/mx2.hostinger.com`). Resend usa o subdomínio `send.` — não mexer.
- **Publicar em lotes** (memória `nero-publicar-em-lotes`): build/atualização pelo ar só quando o Murilo pedir. O build Android desta sessão foi pedido por ele.

## 3. O que já foi feito
1. Conta Play de organização criada, paga, verificada; site verificado no Search Console (TXT na Hostinger).
2. Cadastro: "Telehealth or medical apps"; monetização "We don't know yet".
3. App "Nero Saúde" criado (gratuito, pt-BR). Declarações preenchidas pelo Murilo com as respostas desta sessão: Content rating (Livre/3+), Target audience **18+**, Advertising ID **No**, Government **No**, Financial **nenhum**, Health apps (Activity, Nutrition/Weight, Sleep, Stress; Diseases and Conditions, Disease Prevention, Medication and Treatment), Data safety (tudo *Collected*, nada *Shared*), Privacy policy, Ads **No**, categoria, Sign in details com a conta de revisão.
4. Ficha da loja **enviada por API**: nome, descrição curta/completa (`docs/nero/publicacao/ficha-da-loja.md`), ícone, imagem de destaque (mascote + nome sobre o gradiente do onboarding), contato `contato@nerosaude.com.br` e site `https://nerosaude.com.br`.
5. Build Android `2c6d9133` (versionCode 2, `.aab`), keystore gerado e guardado pela Expo. Manifesto conferido: **sem `AD_ID`**, `RECORD_AUDIO` bloqueado. `expo-doctor` 21/21.
6. `.aab` enviado à mão pelo Murilo em Internal testing (Play App Signing ativo) e publicado. Link: https://play.google.com/apps/internaltest/4701442173001504585
7. SHA-1 da chave de assinatura do Google extraído via API (APK gerado, conferido pelo SHA-256): `53:45:34:67:D5:4A:1E:C2:16:2B:7E:EE:14:41:FF:F5:49:8F:D2:0D`. Murilo criou o cliente OAuth Android no projeto `nero` do Google Cloud.
8. Política de privacidade: CPF trocado por "microempreendedor individual inscrito no CNPJ 62.043.447/0001-03" e removido o "(D-013)" do texto público — **editado, não publicado**.
9. Conta de revisão `nerosaudeapp+revisao@gmail.com` criada pelo Murilo (nome "Teste"; senha em `credenciais/conta-revisao.txt`).

## 4. Estado atual
- App no teste interno; **nunca rodou num Android**. Login com Google no Android configurado mas não testado.
- Capturas de tela: **nenhuma** (o Play exige ≥ 2). Adiadas a pedido do Murilo.
- Política nova só no repositório.
- Tudo commitado e enviado ao GitHub (`desenvolvimento-2`), exceto `credenciais/`, que fica fora do Git.

## 5. Próximos passos
1. Murilo testa num Android pelo link do teste interno: login e-mail, login Google, lembrete de remédio, foto de laudo, notificações. Sem aparelho: instalar Android Studio + emulador com imagem **"Google Play"** e instalar pelo mesmo link. Ver também **Testing › Pre-launch report** no Play.
2. Capturas de tela: primeiro trocar o nome "Teste" da conta de revisão por um nome crível; depois tirar no simulador (Expo Go na 8082) o **onboarding com o Nero falando**, a **Home** e telas com dados (pressão, remédios, água, relatório); gerar `assets/images/loja/captura-1..8.png` em 1080 × 1920 e rodar `node scripts/play-ficha.mjs`.
3. Publicar a política (`npm run site:publicar`) junto com o próximo lote, como já previsto.
4. Produção: Murilo cria a release em **Production** reaproveitando a versão 2, **só Brasil**, e envia para revisão (dias a ~1 semana).

## 6. Perguntas em aberto
- A conta de revisão pode ser excluída por um revisor (há "Excluir conta" no app); se sumir, recriar e atualizar "Sign in details".

## 7. Artefatos relevantes
- `docs/nero/PENDENCIAS.md` — seção "Contas e credenciais" tem todo o estado do Play.
- `scripts/play-api.mjs` — cliente da API do Play sem dependências; `node scripts/play-api.mjs` testa o acesso.
- `scripts/play-ficha.mjs` — envia ficha + ícone + destaque + capturas (pula as que não existem).
- `scripts/gerar-destaque-play.py` — gera `assets/images/loja/destaque-play-1024x500.png`.
- `credenciais/google-play.json` (conta de serviço `play-publisher@nero-509815.iam.gserviceaccount.com`, projeto Cloud `nero-509815`) e `credenciais/conta-revisao.txt` — pasta no `.gitignore`, **nunca versionar nem colar no chat**.
- Permissões da conta de serviço no Play: ficha, testes, envio para testes, declarações. **Sem** "Release to production".
- Próximos builds Android: `npx eas-cli build --platform android --profile production --non-interactive --no-wait`; envio pela API (não precisa mais ser manual) — ainda falta um script de envio de `.aab` ou configurar `serviceAccountKeyPath` no `submit.production.android` do `eas.json` para usar `eas submit`.

## 8. Instruções pra próxima sessão
- Uma decisão por vez; registrar tudo em `.md` (PENDENCIAS, DECISOES).
- Não gerar build nem `eas update` sem o Murilo pedir.
- Não publicar para produção pela API (a conta de serviço nem tem essa permissão, de propósito).
- O Murilo cola telas do Play Console em inglês; responder com o que marcar em cada campo, conferindo no código antes de afirmar o que o app faz.
