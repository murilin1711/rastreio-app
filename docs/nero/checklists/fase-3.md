# Checklist manual — Fase 3 (Minha Saúde: exames, documentos, linha do tempo, relatórios, QR, consulta, lembretes)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Pré-requisito: migração 0011 aplicada na nuvem (`supabase db push`) — cria `documentos`, `compartilhamentos`, `consultas`, bucket `relatorios` e as políticas. Referência: `docs/nero/funcionamento/minha-saude.md` §3–§8.

## A. Meus documentos (D-008)
- [ ] Minha Saúde › Meus documentos › Adicionar › Tirar foto: pede permissão; foto salva como "Laudo de exame"; aparece na lista com data e tamanho.
- [ ] Adicionar › Arquivo PDF: escolher um PDF; detalhe abre "Abrir PDF" no navegador do sistema.
- [ ] Vincular a um exame (Select mostra "Mamografia — 10/05/2026" e exames do cardio); o detalhe do exame cardio mostra o bloco "Documentos"; a lista de exames do Rastreando mostra o anexo abaixo do cartão e o atalho "Anexar".
- [ ] Filtro por tipo funciona; apagar pede confirmação e remove da lista.
- [ ] Foto grande (> 10 MB) → mensagem "Arquivo maior que 10 MB…" (ou é reduzida automaticamente e salva).

## B. Central de exames e linha do tempo (§59–§60)
- [ ] Meus exames lista cardio + rastreamento juntos, mais recentes primeiro; filtros Laboratoriais / Cardiológicos / Oncológicos; toque abre o detalhe correto.
- [ ] Linha do tempo: itens de PA/glicemia agregados por mês, exames com cor do nível, "Início: Losartana", consulta passada, documento avulso; toque leva à origem.

## C. Relatórios (D-007, §26, §40, §61)
- [ ] Relatórios › período 90 › Relatório cardiovascular: prévia com seções na ordem (dados gerais, medicamentos, PA, MRPA, glicemia, HbA1c, lipídios, renal, exames cardiológicos, PREVENT, agravantes, check-up, documentos) e "Pendências abertas" ao final se houver.
- [ ] "Gerar PDF e compartilhar" abre a folha do sistema; o PDF tem cabeçalho NERO, tabelas, barras e a ressalva do §26 no rodapé. Sem "você tem"/"diagnóstico de".
- [ ] Relatório oncológico: um bloco por programa com situação, tabela de exames e pendência em chip; ressalva do §40.
- [ ] Relatório geral: as duas ressalvas.
- [ ] "Mostrar QR para o médico" → confirmação → QR na tela com validade de 7 dias. Ler o QR com outro celular abre o PDF **com o QR impresso** no cabeçalho.
- [ ] "Encerrar compartilhamento" → o link passa a dar erro; a central não lista mais o compartilhamento.
- [ ] Botão "Compartilhar em PDF" na MRPA abre a prévia só com MRPA (+ perfil e medicamentos); na glicemia, só glicemia/HbA1c. "Relatório de rastreamento" no Rastreando abre o oncológico.

## D. Preparar minha consulta (D-009)
- [ ] Cardiologia: começa por dados gerais, medicamentos, documentos; depois MRPA, PA, glicemia, lipídios, renal, exames cardiológicos, PREVENT, agravantes.
- [ ] Mastologia: sem PA/glicemia; traz mama e história familiar; pendência aberta (se houver) continua aparecendo.
- [ ] "Outra" = relatório geral.

## E. Lembretes, preferências e consultas (D-010)
- [ ] Meus lembretes: próximos 30 dias agrupados por dia (medicamentos, glicemia, MRPA, exames, consultas) com origem e atalho; "Últimos 30 dias".
- [ ] Preferências › desligar "Medicamentos": as notificações do celular deixam de chegar; a linha continua na central com "sem aviso no celular"; a Home continua igual. Religar volta a agendar.
- [ ] Minhas consultas › marcar cardiologia amanhã 14:00: Home mostra "Amanhã: consulta de cardiologia às 14:00" (amarelo); notificação na véspera às 09:00 e no dia às 07:00; "Preparar esta consulta" abre a tela já com cardiologia.
- [ ] Índice de Minha Saúde: contadores (exames, documentos), próxima consulta e próximo lembrete.

## F. Regressão
- [ ] Home, Rastreando e Coração continuam iguais (itens de hoje, cards, relatórios internos).
- [ ] `npx tsc --noEmit` e `npx jest --ci` verdes (304 testes); `supabase test db` (24) no banco local.
