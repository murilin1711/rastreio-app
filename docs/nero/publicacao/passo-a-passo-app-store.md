# Passo a passo: lançar o Nero Saúde na App Store

> Escrito em 28/10/2026. Os textos para colar estão em [`app-store.md`](app-store.md) (o número da seção vai
> entre parênteses). Os arquivos estão no Mac em `~/Desktop/nero-capturas/` e `~/Desktop/nero-header/`.
> Painel: https://appstoreconnect.apple.com → **Apps** → **Nero Saúde**.

## 0. Antes de começar

1. **Atualização pelo ar com as correções de 28/10** (comemoração repetida, nomes dos rastreamentos,
   atividade física no check-up). No terminal do projeto:
   `npx eas-cli update --channel production --environment production --platform ios --message "Correções de 28/10"`
   A impressão digital já foi conferida: bate com o build 4.
2. **Teste rápido do build 4 no iPhone** (TestFlight): entrar com a Apple, entrar com o Google, criar conta
   por e-mail (o código precisa chegar). Feche e abra o app duas vezes para a atualização do item 1 aplicar.

## 1. Informações do app (menu lateral → "Informações do app")

| Campo | O que pôr |
|---|---|
| Nome | `Nero Saúde` |
| Subtítulo | `Sua saúde organizada` |
| Categoria principal / secundária | Medicina / Saúde e fitness |
| Direitos de conteúdo | "Não contém, mostra nem acessa conteúdo de terceiros" |
| Classificação etária | "Editar" → responder como na seção 7 de `app-store.md` |
| Dispositivo médico regulado (se perguntar) | **Não** |

Salve no canto superior direito.

## 2. Preço e disponibilidade

- Preço: **Gratuito (R$ 0)**.
- Disponibilidade: desmarque todos e marque só **Brasil**.

## 3. Privacidade do app

1. **URL da política de privacidade**: `https://nerosaude.com.br/privacidade`
2. **"Começar"** no questionário → "Sim, coletamos dados" → marque os tipos da tabela da seção 6 de
   `app-store.md`. Para cada um: finalidade **Funcionalidade do app**; vinculado à identidade **Sim**
   (exceto Dados de falhas: **Não**); rastreamento **Não**.
3. **Publicar** o questionário (botão no topo da página de privacidade).

## 4. Versão 1.0 (menu lateral → "iOS App" → "1.0 Preparar para envio")

### 4.1 Pré-visualizações e capturas de tela
- Aba **iPhone 6.9"**: arraste as 10 imagens de `~/Desktop/nero-capturas/` **na ordem dos números**
  (01 a 10). As outras telas de iPhone usam essas automaticamente. iPad não aparece (app só para iPhone).

### 4.2 Cabeçalho (aba "Header and Search Results", se aparecer)
- Product page header: `~/Desktop/nero-header/cabecalho-nero.png` (se recusar, `cabecalho-nero.jpeg`).
- É opcional e só aparece no iOS 27 ou mais novo. Se der trabalho, pule: não impede o lançamento.

### 4.3 Textos
| Campo | Onde está o texto |
|---|---|
| Texto promocional | `app-store.md` §3 |
| Descrição | `app-store.md` §3 (copie do "O Nero Saúde ajuda…" até "Para maiores de 18 anos.") |
| Palavras-chave | `pressão,glicemia,remédio,lembrete,exames,diabetes,hipertensão,rastreamento,mamografia,água,relatório` |
| URL de suporte | `https://nerosaude.com.br/privacidade` |
| URL de marketing | em branco |
| Versão | `1.0.0` (já vem do build) |
| Direitos autorais | `2026 Murilo Roiz Póvoa` |

### 4.4 Build
- Seção **"Build"** → **"+"** → escolha o **build 4 (1.0.0)**. Nunca o 3.
- Se perguntar sobre criptografia, não deve perguntar (`ITSAppUsesNonExemptEncryption = false`). Se
  perguntar: "Nenhum dos algoritmos acima" / usa só criptografia padrão do sistema.

### 4.5 Ícone
- **Não há campo para enviar.** O ícone (1024 × 1024, sem transparência, conferido) vai dentro do build e
  aparece sozinho na página da loja quando o build é escolhido.

### 4.6 Informações para a revisão do app
| Campo | O que pôr |
|---|---|
| Login necessário | marcado |
| Usuário | `nerosaudeapp+demo@gmail.com` |
| Senha | a de `credenciais/conta-demo.txt` (abra com `open credenciais/conta-demo.txt`) |
| Nome / sobrenome | Murilo / Roiz Póvoa |
| Telefone | o seu, com +55 |
| E-mail | `nerosaudeapp@gmail.com` |
| Notas | o bloco em inglês da seção 5 de `app-store.md` |
| Anexo | nenhum |

### 4.7 Liberação da versão
- Marque **"Liberar esta versão manualmente"**: depois da aprovação você escolhe o dia e aperta "Liberar".

Salve no canto superior direito.

## 5. Enviar

1. Botão **"Adicionar para revisão"** (topo da página da versão). Se faltar algo, a Apple lista em vermelho.
2. **"Enviar para revisão"**. Estado vira "Aguardando revisão". Prazo típico: 1 a 3 dias.
3. Chegou e-mail "Pending Developer Release": entrar na versão → **"Liberar esta versão"**. Em algumas horas
   o app aparece na busca da App Store no Brasil.

## Se a Apple recusar

- Responda pela **Central de resoluções** (no próprio App Store Connect), no mesmo fio da mensagem.
- Motivos mais prováveis num app de saúde, e a resposta pronta:
  - **1.4.1 (dados de saúde / dispositivo médico):** já explicado nas notas; reforçar que tudo é digitado
    pela pessoa e que o conteúdo clínico tem médica responsável.
  - **5.1.1(ix) (app de saúde em conta de pessoa física):** a conta Apple está no CPF. Caminho: migrar a conta
    para o CNPJ do MEI (Membership → "Convert to organization"; precisa do número D-U-N-S).
  - **2.1 (não conseguiram entrar):** conferir se a senha da conta de demonstração está certa nas notas.
