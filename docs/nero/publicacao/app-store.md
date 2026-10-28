# Ficha da App Store — tudo para colar no App Store Connect

> Escrita em 27/10/2026 para a versão 1.0.0 (build 4). Base: `ficha-da-loja.md` (Play), a política de
> privacidade e as decisões de 26/09 (nome, subtítulo, categoria, classificação). Limites de caracteres
> conferidos por script. App: https://appstoreconnect.apple.com/apps/6815939474

## 1. Informações do app (App Information)

| Campo | Valor |
|---|---|
| Nome (30) | Nero Saúde |
| Subtítulo (30) | Sua saúde organizada |
| Idioma principal | Português (Brasil) |
| Categoria principal | Medicina |
| Categoria secundária | Saúde e fitness |
| Direitos de conteúdo | Não contém, mostra nem acessa conteúdo de terceiros |
| URL da política de privacidade | https://nerosaude.com.br/privacidade |

## 2. Preço e disponibilidade

- Preço: **Gratuito**.
- Disponibilidade: **somente Brasil** (o app só existe em português e segue diretrizes brasileiras).

## 3. Versão 1.0.0 (aba da versão, "Prepare for Submission")

### Texto promocional (170)

Pressão, glicemia, remédios, exames e consultas num só lugar, com o que as diretrizes médicas brasileiras recomendam ao lado de cada registro.

### Descrição (4000)

O Nero Saúde ajuda você a acompanhar a própria saúde no dia a dia, com as recomendações das diretrizes médicas brasileiras ao lado de cada registro.

CORAÇÃO E METABOLISMO
• Registre a pressão arterial, inclusive a monitorização residencial (MRPA), e a glicemia.
• Guarde seus exames de laboratório e veja a estimativa de risco cardiovascular.
• Acompanhe sinais de alarme, com a orientação de procurar atendimento quando for preciso.

REMÉDIOS E CONSULTAS
• Cadastre seus remédios e horários e receba lembretes no celular.
• Organize suas consultas e leve para o médico um relatório em PDF com tudo o que você registrou.
• Compartilhe o relatório por QR Code, com link temporário.

EXAMES DE RASTREAMENTO
• Descubra quais exames de rastreamento de câncer fazem sentido para o seu perfil.
• Registre os resultados e saiba quando repetir cada exame.

BEM-ESTAR
• Água, alimentação, atividade física, sono e medidas do corpo.
• Um check-in semanal rápido de como você se sentiu.
• Metas e sequência de dias para manter o hábito.

DOCUMENTOS
• Anexe fotos e PDFs de laudos, receitas e exames, guardados numa área privada da sua conta.

SEUS DADOS SÃO SEUS
• Sem anúncios e sem rastreadores.
• Proteja o app com o Face ID.
• Você pode excluir a conta e todos os dados a qualquer momento, direto no app.

IMPORTANTE
O Nero Saúde organiza as informações que você registra e mostra o que as diretrizes recomendam, sempre com a fonte. Ele não faz diagnóstico, não prescreve e não substitui a consulta com um profissional de saúde. Em caso de sintomas de alarme, procure atendimento.

Criado por Murilo Roiz Póvoa e Dra. Denise Padilha (CRM/AL 12430).

Para maiores de 18 anos.

### Palavras-chave (100, separadas por vírgula, sem espaço)

pressão,glicemia,remédio,lembrete,exames,diabetes,hipertensão,rastreamento,mamografia,água,relatório

> "Nero", "saúde" e "organizada" já contam por estarem no nome e no subtítulo; repetir só gasta espaço.

### URLs

| Campo | Valor |
|---|---|
| URL de suporte | https://nerosaude.com.br/privacidade (tem o e-mail de contato, seção 13) |
| URL de marketing | (deixar em branco) |

### Direitos autorais

2026 Murilo Roiz Póvoa

### Versão / novidades

Primeira versão: o campo "O que há de novo" não aparece na 1.0.

### Build

Escolher o **build 4** (1.0.0) quando terminar o processamento da Apple. O build 3 tem os logins da Apple e
do Google quebrados — **não usar**.

## 4. Capturas de tela

**Prontas (28/10):** `assets/images/loja/app-store/envio/` (cópia em `~/Desktop/nero-capturas/`), 10 imagens
de 1320 × 2868 (iPhone 6.9"), já numeradas na ordem de envio:

1. Onboarding: "Oi, eu sou o Nero!"
2. Home da Maria (sequência de 7 dias, módulos)
3. Coração & Metabolismo (pressão, glicemia, HbA1c, LDL, peso)
4. Rastreamentos indicados para o perfil
5. Relatório geral (PDF e QR para o médico)
6. Onboarding: os quatro lembretes na tela de bloqueio
7. Minha Pressão (média, gráfico, medidas)
8. Como está minha prevenção? (6 de 8 em dia)
9. Onboarding: relatório e QR
10. Levar ao médico

As 3 primeiras aparecem na busca. Tiradas no simulador do iPhone 17 Pro Max com o Expo Go, na conta de
demonstração (dados fictícios). Cabeçalho: `cabecalho-3840x1646.png`.

## 5. Revisão do app (App Review Information)

### Login

- **Login exigido:** sim.
- Usuário: `nerosaudeapp+demo@gmail.com` (Maria Oliveira, 58 anos, hipertensa, dados fictícios criados em 28/10)
- Senha: a de `credenciais/conta-demo.txt`.
- A conta já tem aceite dos termos, perfil completo, uma semana de pressão, glicemia, peso, exames de
  laboratório, dois remédios e uma consulta marcada.
- O Google Play ainda usa `nerosaudeapp+revisao@gmail.com`; vale trocar lá pela mesma conta.

### Contato

Murilo Roiz Póvoa · nerosaudeapp@gmail.com · telefone do Murilo (+55 …)

### Notas (em inglês: é o idioma do revisor)

```
Nero Saúde is a personal health organizer for adults in Brazil (Portuguese only).

DEMO ACCOUNT
Use the credentials above. The account already has sample records (blood pressure, glucose, medications, appointments) so every screen has content. Sign in with Apple and Google sign-in are also available on the login screen.

WHAT THE APP DOES
Users manually enter their own data: blood pressure, blood glucose, medications and schedules, lab results, cancer screening exams, water intake, sleep, body measurements and appointments. Next to each record the app shows what the Brazilian medical society guidelines recommend, always citing the source. Users can generate a PDF report to bring to their doctor and optionally share it through a QR code link that expires after 7 days and can be revoked.

NOT A MEDICAL DEVICE (Guideline 1.4.1)
The app does not measure anything with the device's sensors or camera, does not diagnose, does not prescribe and does not replace a physician. All values are typed in by the user. This disclaimer is shown inside the app and in the store description. When the user marks an alarm symptom, the app only advises seeking medical care. Clinical content was written with Dr. Denise Padilha, a licensed physician (CRM/AL 12430, Brazil).

ACCOUNT DELETION (Guideline 5.1.1(v))
Minha Saúde tab > Excluir minha conta. It deletes the account and all records and files immediately.

PERMISSIONS
- Notifications: local reminders only (medications, appointments, water). No push server.
- Camera / Photos: optional, to attach photos of lab reports in "Meus Documentos".
- Face ID: optional app lock, so only the owner sees their health data on this device.

PRIVACY
No ads, no analytics, no tracking. Health data is stored in Brazil (Supabase, São Paulo) and is only accessible by the account owner. Crash reports (Sentry) contain no health data and no account identifier.
```

## 6. Privacidade do app (App Privacy — "nutrition label")

Pergunta inicial: **"Sim, coletamos dados deste app."** Nenhum dado é usado para **rastreamento**.

| Tipo de dado (Apple) | Coletado | Finalidade | Vinculado à identidade | Rastreamento |
|---|---|---|---|---|
| Informações de contato › Nome | Sim | Funcionalidade do app | Sim | Não |
| Informações de contato › E-mail | Sim | Funcionalidade do app | Sim | Não |
| Saúde e condicionamento › Saúde | Sim | Funcionalidade do app | Sim | Não |
| Saúde e condicionamento › Condicionamento físico | Sim | Funcionalidade do app | Sim | Não |
| Conteúdo do usuário › Fotos ou vídeos | Sim | Funcionalidade do app | Sim | Não |
| Conteúdo do usuário › Outro conteúdo do usuário | Sim | Funcionalidade do app | Sim | Não |
| Identificadores › ID do usuário | Sim | Funcionalidade do app | Sim | Não |
| Diagnóstico › Dados de falhas | Sim | Funcionalidade do app | **Não** | Não |

Não marcar: localização, contatos, histórico de navegação, histórico de pesquisa, dados financeiros,
compras, identificador de publicidade, dados de desempenho (`tracesSampleRate: 0`), áudio, dados de uso.

- "Saúde" cobre: perfil (nascimento, sexo, condições, antecedentes), pressão, glicemia, exames, remédios, sintomas.
- "Condicionamento físico" cobre: atividade física, água, sono, medidas do corpo.
- "Fotos" e "outro conteúdo": laudos anexados (imagem e PDF) e anotações das consultas.
- Dados de falha **não vinculados**: o `beforeSend` em `src/core/erros/relatorio.ts` remove a identificação
  da conta e o `sendDefaultPii` está desligado.

## 7. Classificação etária

Decidido em 26/09: **"Informações médicas ou de tratamento": frequente**; **"Tópicos de saúde ou bem-estar":
sim**; todo o resto "nenhum"/"não" (sem violência, conteúdo sexual, jogos de azar, compras, chat entre
usuários, navegador da web). Se a Apple perguntar pela idade mínima do próprio app, informar **18+**,
como nos termos e na política.

## 8. Antes de tocar em "Enviar para revisão"

- [ ] Build 4 testado pelo TestFlight: logins da Apple e do Google, "Antes de continuar", onboarding inteiro.
- [x] Política nova publicada (`npm run site:publicar`): CNPJ e caixa única de aceite.
- [x] Conta de revisão com nome crível, aceite feito e dados de exemplo (Maria Oliveira, 28/10).
- [ ] Capturas de tela enviadas.
- [ ] Liberação da versão: **"Liberar manualmente"**, para escolher o dia depois da aprovação.
