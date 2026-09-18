# Minha Saúde — como cada funcionalidade funciona e em que se baseia

> Módulo transversal (§59–§63). Fase 0 entregou perfil único, antecedentes e medicamentos; a Fase 3 entrega a central de exames com filtros, documentos, linha do tempo geral, relatórios em PDF, "Preparar minha consulta" e central de lembretes.

## Referências usadas neste módulo
- Especificação NERO §26 (relatório para o médico), §40 (relatório de rastreamento), §59–§63 (Minha Saúde, linha do tempo, central de relatórios, preparar consulta, lembretes), §66 (hierarquia de segurança).
- Decisões D-007 (PDF no aparelho + QR com URL assinada), D-008 (documentos), D-009 (conteúdo por especialidade), D-010 (central de lembretes) em `docs/nero/02-DECISOES.md`.
- Sem regra clínica nova: os relatórios só organizam o que os módulos já calcularam com as diretrizes deles (Rastreando: `rastreando.md`; Coração & Metabolismo: `coracao-metabolismo.md`).

## 1. Perfil de Saúde único (§64) — Fase 0
- Cadastrado uma vez (perfil inicial em passos) e editado em "Meu perfil"; todos os módulos leem daqui e gravam de volta o que perguntam.
- Campos: dados básicos, tabagismo (com maços-ano calculado em `src/core/perfil/calculos.ts`), comorbidades, história pessoal/genética, radioterapia, antecedentes familiares, declarações negativas ("não tomo medicamentos", "sem antecedentes").

## 2. Meus medicamentos (§21) — Fase 0
- Nome, dose, horários (`src/core/medicacoes/horarios.ts` normaliza "8h / 20h30"), desde quando, prescritor, ativo/inativo. Sem qualquer sugestão de dose (§25). Lembretes por horário chegam na Fase 2a. A seção "Histórico" mostra os interrompidos com "até".

## 3. Central de exames (§59) — Fase 3
- `app/(app)/minha-saude/exames/index.tsx` lista, numa tela só, os exames do módulo cardio (`listarExamesCardio`) e os do Rastreando (`montarContexto().exames`), ordenados por data, com filtros Laboratoriais · Cardiológicos · Oncológicos. Tocar abre o detalhe no módulo de origem; o registro continua sendo feito lá (o tipo de exame define regra, classificação e lembretes).

## 4. Meus documentos (§59, D-008) — Fase 3
- Tabela `documentos` (migração 0011) + bucket privado `laudos` (já existia). Caminho sempre `<user_id>/<uuid>.<ext>`; as políticas do Storage comparam a primeira pasta com `auth.uid()`.
- Origens: câmera, galeria (`expo-image-picker`) ou PDF (`expo-document-picker`). Imagens acima de 2000 px são reduzidas e recomprimidas em JPEG 0,8 (`expo-image-manipulator`); limite 10 MB com mensagem clara. Leitura só por URL assinada de 1 h (`storage.ts`).
- Cada documento tem tipo (laudo, receita, atestado, imagem, outro), nome, data, observação e exame vinculado opcional (últimos 20 exames de qualquer módulo). O detalhe de um exame cardio e a lista de exames do Rastreando mostram os anexos e um atalho "Anexar".
- Apagar remove primeiro o arquivo e depois a linha; se o arquivo já não existir, a linha sai mesmo assim.
- Arquivos: `src/core/documentos/{tipos,mapeamento,storage,repositorio,useDocumentos}.ts`, `src/modules/minha-saude/componentes/{LinhaDocumento,BlocoDocumentos,escolherArquivo}`, `app/(app)/minha-saude/documentos/**`.

## 5. Linha do tempo geral (§60) — Fase 3
- `src/core/linhaDoTempo/geral.ts` reúne: a linha do tempo cardiovascular já agregada por mês (`cardio/linhaDoTempo.ts`), cada exame do Rastreando com resultado e nível de alerta, início e fim de cada medicamento, consultas passadas e documentos sem exame vinculado. `agrupar.ts` (puro, testado) ordena por ano.
- Na tela, o ponto de cada linha tem a cor do módulo; exames do Rastreando usam a cor do nível clínico. Tocar leva à tela de origem.

## 6. Relatórios em PDF e código QR (§26, §40, §61, D-007) — Fase 3
- **Montagem pura** em `src/core/relatorios/montar.ts`: 26 seções possíveis (`ChaveSecao`), cada uma construída a partir de um único objeto `DadosNero`. Ordens: cardiovascular (§26: dados gerais, medicamentos, PA avulsa, MRPA, glicemia, HbA1c, lipídios, função renal, exames cardiológicos, PREVENT, agravantes, check-up, documentos), oncológico (§40: perfil, história familiar, tabagismo, situação dos rastreamentos, um bloco por programa, sintomas, documentos), geral (união + consultas). **Pendência aberta nunca é omitida** (§66): entra ao final de qualquer relatório.
- Período (30/90/180 dias) limita medidas de PA, MRPA, glicemia e documentos; exames e rastreamentos entram sem limite (último por tipo + anteriores).
- **Sem interpretação nova**: o relatório repete rótulos, médias, classificações e mensagens que os módulos já produziram; laboratório aparece com a referência do próprio laudo. Os testes garantem que o HTML não contém "você tem" nem "diagnóstico de".
- **HTML/PDF** (`html.ts`): A4, quebra de página por seção, tabelas zebradas, barras em `div`, chips com as cores do §43. Rodapé com as ressalvas **literais**: §26 nos relatórios cardio/geral/consulta e §40 nos oncológico/geral/consulta. PDF gerado no aparelho por `expo-print`; compartilhado pela folha do sistema (`expo-sharing`).
- **QR (D-007)** em `compartilharQr.ts`, duas passagens: (1) sobe o PDF sem QR em `relatorios/<uid>/<uuid>.pdf`; (2) cria URL assinada de 7 dias; (3) regenera o PDF com o QR dessa URL e sobrescreve o mesmo objeto (`upsert: true`) — a assinatura é do caminho, não do conteúdo, então a URL segue válida. Registro em `compartilhamentos`. "Encerrar" apaga o objeto (a URL passa a devolver 404) e grava `revogado_em`; vencidos são limpos ao abrir a central. QR gerado pela biblioteca `qrcode` em SVG puro (mesmo desenho na tela e no PDF).
- **Ponto único de leitura**: `carregar.ts` (`carregarDadosNero`) reúne perfil, antecedentes, medicações, medidas, sessões, glicemias + metas (SBD 2026 pelo perfil), exames, avaliações de elegibilidade, último PREVENT, check-up, peso, documentos e consultas futuras.
- Botões "Compartilhar em PDF" da MRPA e da glicemia abrem a prévia do relatório cardio filtrado (`apenas`); "Relatório de rastreamento" no Rastreando abre o oncológico.

## 7. Preparar minha consulta (§62, D-009) — Fase 3
- `montarConsulta(dados, especialidade, periodo)`: bloco sempre presente (perfil, medicamentos, documentos do período) e depois as seções priorizadas da matriz `PRIORIDADES` em `especialidades.ts` (D-009). "Outra" = relatório geral. Período padrão 180 dias.
- A prévia é a mesma tela dos relatórios; a consulta marcada leva à tela já com a especialidade escolhida.

## 8. Central de lembretes e preferências (§63, D-010) — Fase 3
- Não há coluna nova em `lembretes`: a origem é derivada do título (`mrpa:`, `glicemia:`, `medicacao:`, `consulta:`) ou de `origem_tipo = 'exame'` (`src/core/lembretes/origem.ts`, puro e testado). A central lista os próximos 30 dias agrupados por dia e os últimos 30.
- Preferências em `perfil_saude.preferencias_lembretes` (seis interruptores). **Desligar** cancela as notificações locais pendentes daquele tipo, mantém as linhas e acrescenta ` silenciado` à mensagem (o item continua visível na Home e na central, com "sem aviso no celular"). **Religar** chama os agendadores existentes (medicação, MRPA da sessão ativa, plano de glicemia, consultas futuras, próxima data de cada programa do Rastreando).
- Todos os agendadores passaram a consultar `notificacoesPermitidas(userId, tipo)` uma vez por lote: a notificação do celular só é criada com permissão do sistema **e** tipo ligado; a linha em `lembretes` é gravada de qualquer forma.
- Consultas (`consultas.ts`): especialidade, data/hora, local, profissional. Lembrete na véspera às 09:00 ("Quer preparar o relatório?") e no dia às 07:00. Home mostra "Hoje/Amanhã: consulta de … — preparar" em amarelo.
