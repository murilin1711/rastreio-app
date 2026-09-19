# Handoff: NERO — adesão (comemorações, sequência) e módulo de água

**Data:** 19/09/2026 (segunda sessão do dia)
**Status:** em andamento — tudo implementado, testado e na nuvem; **nada foi validado no aparelho**

> Nova sessão: ler este arquivo, depois `docs/nero/publicacao/README.md` (fila das lojas), `00-ROADMAP.md` (topo) e `02-DECISOES.md` (D-012–D-017, C-021). Handoff anterior desta mesma data: `2026-09-19-publicacao-e-mascote.md` (mascote, publicação, operacional — continua válido).

## 1. Objetivo
Aumentar a adesão do paciente ao NERO: comemorações em conquistas de comportamento, sequência de dias com registro, e o módulo de ingestão de água com meta e lembretes. Tudo pedido pelo Murilo nesta sessão, depois de fechado o mascote animado.

## 2. Contexto essencial
- Branch `desenvolvimento-2`, tudo no GitHub (`murilin1711/rastreio-app`). Último commit: `e281e61`. **420 Jest, 63 pgTAP, `tsc` limpo.** Migrações **0015 a 0019 já aplicadas na nuvem**.
- **A regra que atravessa a sessão inteira (D-016):** o Nero comemora **só conquistas de comportamento**, nunca resultado clínico. Rastreamento, exames, pendências e MRPA ficam de fora de propósito — "em dia" significa que o exame foi feito, não que o resultado veio normal. Foi o Murilo quem formulou isso ("não pode confundir com nenhum resultado, por exemplo MRPA às vezes pode estar ruim e comemorar por terminar e achar que foi bom"). **Não afrouxar isso sem decisão explícita dele.**
- **Senha do banco:** `db push` pede `SUPABASE_DB_PASSWORD`. A senha foi digitada no chat em 18/09 **e de novo em 19/09** — a troca no dashboard virou prioridade antes da publicação.
- Metro em modo CI não recarrega ao salvar: depois de qualquer edição, `npm run rotas` e o Murilo fecha/reabre o app. **Rota nova exige `npm run rotas` antes do `tsc` passar** (o `router.d.ts` é gerado pelo Metro) — aconteceu com `/(app)/bem-estar/agua`.
- O IP muda quando ele troca de Wi-Fi: `ipconfig getifaddr en0`, depois regerar o QR com `node -e "require('qrcode').toFile(...)"`.

## 3. O que já foi feito

**Mascote (fechamento da parte da manhã)**
1. `70d27d6` — **mão piscando branco ao acenar, corrigida.** Causa medida, não suposta: com a mão levantada, a face inferior dela tem **a mesma cor do fundo bege do gerador** (distância de cor chega a 0,0; mediana 5–11 contra limiar 14). A máscara abria um buraco que escapava pela fresta entre mão e cabeça e sobrevivia ao `fill_holes`. Corrigido com `binary_closing` de 5 iterações (`FECHAMENTO`, padrão 2), **só acima de y=940** — embaixo o fechamento forte gruda a sombra e quebra o corte lateral do chão. Área opaca da mão: de 45 % de oscilação para 11 %.
2. `98bc2eb` — **clipe comemorar** (2,6 s, 404 KB). Exigiu dois parâmetros novos no pipeline: `Y0/Y1/CX` (o vídeo veio com o personagem 14 % menor e no pulo a cabeça passava do recorte) e `FUNDO=linha` (o gerador ignorou o pedido de fundo plano e fez cenário com linha de horizonte, deixando manchas no recorte). **Cada vídeo novo sai com escala e cenário próprios: medir antes de processar.**
3. Clipes repouso e acenar **aprovados pelo Murilo** ("ficou perfeito").

**Adesão — D-016, partes A a D**
4. `d9cf069` — **A: marcos de 50 % e 100 %** das metas de peso e cintura. `metas` ganhou `valor_inicial` e `marco_comemorado` (0015). Progresso = `(inicial − atual) / (inicial − alvo)`, fórmula que serve para reduzir e para ganhar peso. Marco comemorado uma vez e **nunca retirado**.
5. `f48f489` + `0e402c7` — **B: conquistas pontuais.** Quatro "primeiras vezes" (tabela `conquistas`, 0016). **Corrigido no mesmo dia depois do teste no aparelho:** a conquista do perfil disparava para todo mundo porque `perfil_inicial_completo` é marcada no cadastro obrigatório (`app/perfil-inicial.tsx:71`) — passou a exigir medicações e antecedentes resolvidos. Também nesse commit: o clipe comemorar congelava no último quadro (agora `entrada="comemorar"` com volta ao repouso) e a comemoração só aparecia ao voltar ao módulo (agora aparece no momento do registro).
6. `8eb725f` — **C: sequência de dias.** Conta **qualquer registro que gere dado** (escolha do Murilo), via **gatilho no banco** (0017) e não pelas telas, para qualquer registro futuro contar sozinho. Marcos em 3, 7, 30 e 100. **Quebrar não gera aviso nem perda:** o selo some em silêncio. Mensagens falam só de dias, nunca do que foi registrado.
7. `58b91a7` + `fff2219` — **D: módulo Minha Água** (0018) e **lembretes por janela + intervalo** (0019).
8. `e281e61` — **D-017: permissão de notificações com contexto.**

**Decisões descartadas (para não repetir)**
- "Terminar uma pendência" como conquista: descartado pelo Murilo — pendência é objeto do Rastreando.
- Comemorar conclusão da MRPA: descartado pelo Murilo, mesmo motivo.
- Verificador automático de buracos no WebP: duas calibrações falharam (na resolução de entrega o buraco encolhe até o tamanho das concavidades legítimas). A verificação que funciona é comparar mapas de alpha frame a frame.
- Meta de água pela EFSA/IOM: descartada pelo Murilo — são de **água total** e o paciente não tem como calcular a água dos alimentos.

## 4. Estado atual
- **Nada foi testado no aparelho.** Todo o trabalho desta parte da sessão foi para o repositório sem validação visual.
- `git status` limpo, local e remoto em `e281e61`, migrações 0001–0019 na nuvem.
- Três bugs de laço infinito (`Maximum update depth`) foram **pegos pelos testes de tela antes de chegar ao aparelho** — o padrão `telaCardio.test.tsx` já rendeu quatro capturas. **Toda tela nova com efeito que grava e recarrega deve ganhar um desses.**
- A conquista `perfil_completo` já está gravada no banco do Murilo de quando a regra estava errada; ela não vai reaparecer. Para testar do zero, apagar a linha em `conquistas`.

## 5. Próximos passos
1. **Testar no aparelho, nesta ordem:** selo da sequência na Home (deve estar em 1 dia) · registrar água e ver a comemoração ao bater a meta · ligar lembretes de água e conferir se a notificação chega · o modal de permissão (para vê-lo é preciso resetar as permissões de notificação do Expo Go).
2. Rodar os checklists `docs/nero/checklists/` (2a, 2b, 3, 4a, 4b, publicacao) — **nenhum foi rodado até hoje**; esperar bugs do tipo do Cardio ao abrir telas pela primeira vez.
3. **Trocar a senha do banco** no dashboard (digitada no chat duas vezes).
4. Política de privacidade: preencher os `[[ ]]`, escolher hospedagem. **Precisa mencionar as notificações e os dados de água.**
5. Contas Apple Developer e Google Play Console; **bundle id** (recomendação `com.nerosaude.app`, permanente).
6. `eas init` → `eas build --profile preview` → TestFlight.
7. Reativar confirmação de e-mail no Supabase Auth; revogar token antigo do CLI.
8. Clipe **pensando** (último do conjunto; prompt em `mascote/animacoes.md`) — medir enquadramento antes de processar.

## 6. Perguntas em aberto
- Bundle id: tem domínio próprio?
- Plano do Supabase (Free ou Pro) — define o texto de backup na política.
- O relatório de Saúde & Hábitos deve passar a incluir água e sequência? Hoje não inclui.
- A conquista de água ("bateu a meta") é diária por decisão do Murilo; observar no uso se cansa.

## 7. Artefatos relevantes
- Decisões: `docs/nero/02-DECISOES.md` — **D-016** (onde comemora), **D-017** (permissão), **C-021** (meta de água).
- **`docs/nero/referencias/agua.md`** — levantamento completo: não existe diretriz de "2 litros"; EFSA e IOM são de água total; o IOM rejeita a regra dos copos; o "35 ml/kg" **não tem documento de sociedade brasileira** e a atribuição à OMS não se confirma. Ler antes de mexer no número.
- Núcleo puro novo: `src/core/regras/bemestar/{metas,conquistas,sequencia,agua,lembretesAgua}.ts`.
- Testes de tela (padrão contra laço): `src/core/bemestar/__tests__/{telaMetas,telaBemEstar,useSequencia,useAgua}.test.tsx`, `src/core/lembretes/__tests__/useAvisos.test.tsx`.
- Comandos: `npx tsc --noEmit && npx jest --ci` · `npx supabase db reset && npx supabase test db` (Docker aberto) · `npm run rotas` · `npm run db:types` (depois de toda migração) · `SUPABASE_DB_PASSWORD='<senha>' npx supabase db push`.
- Pipeline do mascote: `FUNDO=linha FECHAMENTO=5 Y0=<> Y1=<> CX=<> python3 scripts/processar-clipe-nero.py <frames> <saida.webp> <ini> <fim> <loop>`.

## 8. Instruções para a próxima sessão
- Português com acentos; **uma decisão por vez, com recomendação**; registrar em `02-DECISOES.md` antes de executar. Commits com `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`, sempre depois de `tsc` + Jest.
- **Regras clínicas só com fonte real, atual, preferindo sociedade brasileira.** Se a fonte não existir, dizer isso ao Murilo em vez de usar um número que "todo mundo usa" — foi o que aconteceu com os 35 ml/kg, e ele decidiu com a informação correta na mão.
- **Não comemorar nada ligado a resultado clínico** (D-016). Vale para qualquer coisa nova.
- Tela nova com efeito que grava e recarrega: escrever o teste de regressão **e conferir que ele falha sem a proteção** — três laços foram pegos assim hoje.
- Depois de editar: `npm run rotas` e pedir para ele reabrir o app, senão ele avalia código velho.
- No mascote, não mexer no pipeline sem comparar com a versão aprovada; se algo piscar, perguntar *onde* e *quando* antes.
