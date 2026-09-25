# Handoff: crash corrigido, lembretes refeitos, horário na roda

**Data:** 25/09/2026 (tarde) · **Status:** em andamento — tudo no código, nada no aparelho ainda
**Anterior:** [`2026-09-25-primeiro-build-e-testflight.md`](2026-09-25-primeiro-build-e-testflight.md)

## 1. Objetivo

Deixar o build 3 pronto para submeter. A sessão começou com dois defeitos do build 2 no TestFlight
(crash em "Não uso medicamentos", "Sair da conta" que não saía) e virou uma rodada de correções e
pedidos do Murilo testando no simulador: notificações, horários, pendências.

## 2. Contexto essencial

- Expo SDK 57, RN 0.86.3, expo-router 57, Supabase. **Testes: 535 em ~75 suítes, `tsc` limpo.**
- **Teste no simulador é pelo Expo Go** (`npx expo start --ios --go --port 8082`), não por build
  Release local: os downloads grandes do `pod install` caem no roteador do iPhone (172.20.10.x).
  No Expo Go, erro de JS vira tela vermelha e aparece no log do Metro — foi assim que o crash foi achado.
- **O padrão da sessão se repetiu 4 vezes: o teste simulava um mundo mais gentil que o aparelho**
  (evento que não se esvazia, `Redirect` sem roteador, `onLayout` que nunca dispara). O simulador pegou
  o que a suíte verde não pegou. Não declarar nada "funcionando" só com teste.
- O Murilo decide uma coisa por vez, com opções e prévia (`AskUserQuestion`), e quer tudo em `.md`.

## 3. O que foi feito (D-038 a D-046, todas em `docs/nero/02-DECISOES.md`)

- **D-038 — "Sair da conta" não saía.** Ninguém reagia à sessão nula (`app/index.tsx` decide uma vez só).
  Correção final: `Stack.Protected guard={carregando || !!sessao}` no componente `Navegacao` de
  `app/_layout.tsx`. **Duas tentativas erradas antes:** `<Redirect>` em `app/(app)/_layout.tsx` (loop
  infinito: o `Redirect` faz `replace` num `useFocusEffect` que roda a cada render, e layout continua
  em foco) e depois a hipótese de `/` ambíguo (existe, mas não era a causa). **Nunca `<Redirect>` em layout.**
- **D-039 — o crash.** `SaidaConcluida` lia `e.nativeEvent.layout` dentro da função do `setState`; o
  React roda depois, com o evento já esvaziado. Só o segundo `onLayout` (cartão "Desfazer") caía na fila.
- **D-040 — "Desfazer" piscava.** `usePerfil.salvar` agora é otimista, com reversão dos campos da chamada.
- **D-041 — pendências entram de uma vez.** Esqueleto (`EsqueletoPendencias.tsx`) até todas as fontes
  responderem ou 4 s; não volta ao esqueleto depois.
- **D-042 — a pergunta dos avisos só aparecia na montagem da Home.** Passou a reavaliar no foco.
- **D-043 — decisão do Murilo:** a pergunta aparece **na hora de ligar o lembrete**, em seis telas
  (`usePedidoDeAvisos.tsx`, `await pedir()` antes de criar). "Agora não" só cala a Home (14 dias). Negada
  → modal "Seus avisos estão desligados" → `app-settings:notifications` (valor lido compilando um
  programa Swift no simulador; fallback `Linking.openSettings`).
- **D-044 — textos das notificações**, um a um com o Murilo: tabela em `docs/nero/notificacoes.md`,
  código em `src/core/lembretes/textos.ts`. Toque abre a tela (`useToqueNotificacao.ts`, rota no `data`
  via `origemDe`). Água leva a meta do dia e é refeita quando a meta ou o peso mudam (`reagendarAgua`).
- **D-045 — horário na roda do iPhone** (`CampoHorario.tsx`, `@react-native-community/datetimepicker`
  9.1.0, plugin no `app.json`). Remédio: quantas vezes por dia + primeira dose (`HorariosRemedio.tsx`,
  `horariosDoRitmo`/`ritmoDe`). Também MRPA, glicemia, consulta, água (que gravava a cada tecla).
- **D-046 — pendência resolvida sai na frente da pessoa.** A Home não recarregava ao voltar (!). Agora
  recarrega no foco, em silêncio; `useSaidaConcluida` congela fora de vista, mantém o item no lugar e
  calcula a diferença já na renderização; `SaidaConcluida` ganhou `discreto` e `atraso` (450 ms).
- **Pendências novas registradas** (seção 4 de `PENDENCIAS.md`): preço de remédios, disponibilidade no
  SUS, tutoriais de remédios, lembrete do check-in semanal.

## 4. Estado atual

- **Aprovado pelo Murilo no simulador:** D-038, D-039, a pergunta dos avisos e a notificação do remédio.
- **Implementado, não visto por ele:** D-040, D-041 (visto parcialmente), D-044 completo, D-045, D-046.
- **Só o aparelho confirma:** "Abrir Ajustes" cair direto na página de notificações do NERO (no Expo Go
  abre os ajustes do app, sem prova); roda no Android; toque em notificação com o app fechado.
- **Build 2 continua no TestFlight; build 3 ainda não gerado.**
- **A pasta `ios/` existe** (sobra da tentativa de build Release local). **Com ela, o EAS ignora o `app.json`.**

## 5. Próximos passos

1. Ouvir o resultado do Murilo nos testes pendentes do simulador: roda no remédio (editar Losartana →
   "Outro"; "2 vezes"; primeira dose 07:00 → 07:00/19:00) e saída verde (cadastrar antecedente, voltar à Home).
2. **Apagar `ios/`** antes do build: `rm -rf "/Users/muriloroizpovoa/Desktop/App de Rastreio/app-de-rastreio/ios"` (confirmar com ele).
3. Terminar `checklists/publicacao.md` e gerar o **build 3** (`eas build`), que junta D-034 a D-046.
4. No build 3, percorrer os itens "Conferir no aparelho" de `PENDENCIAS.md` (D-038 a D-046).
5. Depois: desenhar o **lembrete do check-in semanal** (dia/hora, repetir na terça, chave nas
   preferências) e pôr o texto dele em `notificacoes.md` antes do código.

## 6. Perguntas em aberto

- Cartão do remédio mostra "16h03: desde 12/12/2025" (dois-pontos no lugar de separador) — defeito
  antigo, oferecido para corrigir, sem resposta.
- Rastreando oferecer lembrete para exame **pendente** (hoje só exame registrado gera lembrete; quem só
  vê "Mamografia pendente" nunca é perguntado sobre avisos) — oferecido como pedido novo, sem resposta.
- O agendamento engole erro do iOS (`.catch(() => null)` em `lembretesCardio.ts` e `rastreando/lembretes.ts`).
- Lembretes agendados antes da D-044 têm o texto antigo até serem refeitos.
- Teste de rota real exigiria `@testing-library/react-native` (não instalado); os testes de navegação simulam o roteador.

## 7. Artefatos relevantes

- Decisões: `docs/nero/02-DECISOES.md` (D-038…D-046) · pendências: `docs/nero/PENDENCIAS.md` · textos: `docs/nero/notificacoes.md`
- Novos: `src/core/lembretes/{textos.ts,usePedidoDeAvisos.tsx,useToqueNotificacao.ts}`,
  `src/ui/components/CampoHorario.tsx`, `src/modules/minha-saude/HorariosRemedio.tsx`, `src/modules/home/EsqueletoPendencias.tsx`
- Subir o simulador: `cd app-de-rastreio && npx expo start --ios --go --port 8082` (a 8081 estava ocupada)
- Reabrir o app do zero e ler erros: `xcrun simctl terminate booted host.exp.Exponent; xcrun simctl openurl booted exp://127.0.0.1:8082` e `grep ERROR` no log do Metro
- Abrir uma tela direto: `xcrun simctl openurl booted "exp://127.0.0.1:8082/--/minha-saude/medicamentos"`
- Crash do build 2: `~/Downloads/testflight_feedback/crashlog.crash` (só `RCTFatal`, sem mensagem)
- Processos em segundo plano desta sessão (Metro na 8082, `log stream`) podem ter ficado rodando.

## 8. Instruções pra próxima sessão

- Tudo que vale do handoff anterior continua valendo: **nunca** `supabase config push`, **nunca** `npm audit fix --force`.
- Ao ver "Maximum update depth exceeded", conferir se não é tela antiga que não recarregou: reiniciar o
  Expo Go do zero antes de concluir. O Metro mostra o arquivo **atual** do disco no code frame, não o que rodou.
- Não ler o `nativeEvent` dentro de função de `setState` (D-039), e não usar `<Redirect>` em layout (D-038).
- Texto de notificação novo entra primeiro em `notificacoes.md`, decidido com o Murilo.
- Corrigir afirmação errada na hora: nesta sessão foi dito que a segunda linha da notificação some com as
  pré-visualizações escondidas — falso (o iOS esconde as duas); foi corrigido no documento.
