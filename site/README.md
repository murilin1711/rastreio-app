# site/ — a página pública do NERO

**Gerado, não editado à mão.** As fontes são `docs/nero/publicacao/politica-de-privacidade.md` e `termos-de-uso.md`.

```
npm run site            # gera os arquivos aqui
npm run site:publicar   # gera e envia para o repositório que a Hostinger publica
```

| Arquivo | Endereço final |
|---|---|
| `index.html` | `https://nerosaude.com.br` (redireciona) |
| `privacidade/index.html` | `https://nerosaude.com.br/privacidade` |
| `termos/index.html` | `https://nerosaude.com.br/termos` |

A pasta com `index.html` dentro é o que faz a URL funcionar **sem `.html`**, que é a forma esperada
pelas lojas e pelo botão no app.

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
