# site/ — a página pública do NERO

**Gerado, não editado à mão.** As fontes são `docs/nero/publicacao/politica-de-privacidade.md` e `termos-de-uso.md`,
e, para a página do QR, `scripts/site/r/`.

```
npm run site            # gera os arquivos aqui
npm run site:publicar   # gera e envia para o repositório que a Hostinger publica
```

| Arquivo | Endereço final |
|---|---|
| `index.html` | `https://nerosaude.com.br` (redireciona) |
| `privacidade/index.html` | `https://nerosaude.com.br/privacidade` |
| `termos/index.html` | `https://nerosaude.com.br/termos` |
| `r/index.html` | `https://nerosaude.com.br/r/` |

A pasta com `index.html` dentro é o que faz a URL funcionar **sem `.html`**, que é a forma esperada
pelas lojas e pelo botão no app.

## Página do QR

`r/` é a página que o QR do relatório abre no celular do médico (D-067). O link é
`https://nerosaude.com.br/r/#c=<caminho do JSON>&t=<token>`: tudo depois do `#` fica no navegador, não vai a
servidor nenhum. A página confere `c` e `t` com as mesmas regras de `src/core/relatorios/linkQr.ts`, apaga o
fragmento da barra de endereço, busca o JSON assinado **só** no Supabase do projeto e mostra o relatório num iframe
sem permissão de rodar código, com o botão "Baixar PDF". Revogado, vencido ou ainda em preparo: "Este relatório não
está mais disponível." Não guarda nada no navegador, tem `noindex` e CSP restritiva, sem scripts de terceiros.

Apagar o fragmento **não** faz o link sumir por completo: o navegador de quem leu o QR pode tê-lo guardado no
histórico e no autocompletar. A proteção real é o prazo de 7 dias da URL assinada e o encerramento pelo app (que
apaga o PDF e o JSON). Recarregar a página depois de aberta mostra "não está mais disponível": basta ler o QR de novo.

O endereço do Supabase entra no build: `gerar-site.mjs` lê `EXPO_PUBLIC_SUPABASE_URL` (ambiente, `.env.local` ou
`.env`) e **se recusa a gerar** se não for `https://<projeto>.supabase.co` — assim o Supabase local nunca vai ao ar.

## Como o site chega no ar

1. `npm run site:publicar` envia o HTML para **github.com/murilin1711/nerosaude-site** (público).
2. A Hostinger observa a branch `main` desse repositório e republica sozinha.

**Por que um repositório separado:** o Git da Hostinger clona o repositório inteiro dentro de
`public_html`. Apontar o repositório do aplicativo deixaria o código, as migrações com o schema do
banco e os documentos internos acessíveis em `nerosaude.com.br/...`. Nenhum segredo vazaria (o
`.env` não é versionado), mas publicar o schema e as regras de acesso de um banco de prontuários é
entregar o mapa a quem procura brecha.

## Configuração na Hostinger, uma vez só

hPanel → **Avançado → Git** → criar implantação:

| Campo | Valor |
|---|---|
| Repositório | `https://github.com/murilin1711/nerosaude-site.git` |
| Branch | `main` |
| Diretório | `public_html` |

Depois, em **Implantação automática**, copiar o webhook e colar em Settings → Webhooks do
repositório no GitHub. A partir daí cada `npm run site:publicar` aparece no ar sozinho.

## Antes de deixar a página pública

Confirmar no painel da Supabase que os **backups diários** começaram. A seção 8 da política promete
cópias de 7 dias, e a promessa não pode ir ao ar antes do fato.
