# Checklist manual — Fase 4b (alimentação, conexão com glicemia, metas, check-in, relatório de hábitos)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Pré-requisito: migrações 0012 e 0013 e as 12 regras `bem_estar` na nuvem. Referência: `docs/nero/funcionamento/saude-bem-estar.md` §5–§8. Faça antes o `checklists/fase-4a.md`.

## A. Minha Alimentação (§74–§76)
- [ ] Registrar almoço 12:30 "arroz, feijão, frango" (só os obrigatórios) → aparece em "Últimos 7 dias" com hora e descrição.
- [ ] "Adicionar detalhes" mostra quantidade, fome 0–10, saciedade, local e observação; salvar com todos preenchidos.
- [ ] Após 3 dias com café ~07:40 e almoço ~12:50: "Sua semana" mostra "n de 7 dias", horários médios e a frase "Você costuma realizar suas refeições principais em horários semelhantes." Com jantares 19:00 / 23:00 / 20:00: frase "variaram bastante". Nenhum texto de "bom/ruim".
- [ ] Toque e segure um registro → apaga com confirmação.

## B. Conexão glicemia ↔ refeição ↔ atividade (C-020)
- [ ] Registrar almoço 12:30 → Coração › Glicemia › registrar 142 mg/dL 2 h pós-almoço às 14:35 → tela pós-registro pergunta "Esta glicemia está relacionada ao almoço das 12:30?" → Sim → "Vinculada."
- [ ] Registrar caminhada 18:00 (40 min) → glicemia às 19:30 → pergunta "Foi medida após a caminhada das 18:00?"; glicemia às 23:00 → não pergunta (fora das 3 h).
- [ ] Relatório cardiovascular › tabela de glicemia tem a coluna "Refeição / atividade vinculada" com "almoço 12:30".

## C. Minhas Metas (§82)
- [ ] Objetivo de peso "Manutenção" → tentar meta de Peso → aviso para mudar o objetivo. Objetivo "Redução" → meta 78 kg salva; card mostra "Atual: 82 kg · 4 kg acima da meta".
- [ ] Meta de atividade 200 min ("Meu médico") → Minhas Atividades mostra "x / 200" e "definida com profissional". Sono 7,5 h → card mostra "Atual: 6h40 por noite".
- [ ] "Encerrar meta" some da lista; nova meta do mesmo tipo substitui a anterior.

## D. Check-in semanal (§86–§87)
- [ ] Na segunda-feira: módulo mostra o card "Como foi sua semana? Responder leva 1 minuto." e a Home o item cinza "Fazer o check-in da semana". Na quarta, sem responder, nenhum dos dois aparece.
- [ ] Responder 7 escalas + texto → "Check-in da semana salvo"; reabrir mostra as respostas e permite ajustar (mesma semana). Card e item somem.
- [ ] "Seus meses" com médias de energia/estresse/bem-estar após 2+ check-ins.
- [ ] Meus hábitos: "Alimentação: n refeições" e demais cards; nada em "Em breve".

## E. Relatório de Saúde & Hábitos (§88) e linha do tempo
- [ ] Minha Saúde › Relatórios › "Relatório de Saúde & Hábitos" (ou atalho no módulo): seções Dados gerais, Evolução corporal (IMC + faixa, cintura + RCA, tendência, PMAV, tabela), Alimentação (por semana + refeições), Atividade (por semana + barras + tabela), Sono (por semana + noites), Check-ins (tabela + médias), Documentos; pendências abertas ao final se houver.
- [ ] PDF gerado com as três ressalvas no rodapé (§26, §40 e "autorrelatados"); QR funciona e o compartilhamento aparece na central como "Relatório de Saúde & Hábitos".
- [ ] Preparar minha consulta › Endocrinologia inclui "Evolução corporal" e "Atividade física".
- [ ] Linha do tempo (Minha Saúde): cintura, composição, "Sono — semana de …", "Atividade — semana de …", "Check-in semanal" com ponto verde; toque leva ao módulo.

## F. Regressão
- [ ] Registrar glicemia sem refeição/atividade recente → tela pós-registro igual à da Fase 2 (sem perguntas).
- [ ] Relatórios cardio, oncológico, geral e consultas continuam iguais (o geral ganha as seções de hábitos).
- [ ] `npx tsc --noEmit` e `npx jest --ci` verdes (350); `supabase test db` (30).
