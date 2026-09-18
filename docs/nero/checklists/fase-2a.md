# Checklist manual — Fase 2a (Minha Pressão, MRPA, alertas, lembretes, dashboard)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Servidor: Supabase nuvem (`.env`) · Metro: `CI=1 nohup npx expo start` · Expo Go, projeto em Development servers
> Referência clínica de cada item: `docs/nero/funcionamento/coracao-metabolismo.md` §1–§2

## A. Home e módulo
- [ ] Home: card "Coração & Metabolismo" ativo (sem "em breve"); abre o dashboard.
- [ ] Aba "Coração" na barra inferior abre o dashboard.
- [ ] Dashboard: cards Pressão e MRPA; Glicemia/HbA1c/LDL/Risco com "Chega no próximo passo"; "Sinais de alerta" abre a lista do §23.

## B. Minha Pressão (C-010)
- [ ] Registrar 128/78: tela de resultado **sem chip de cor**, texto da referência 130/80.
- [ ] Registrar 142/88: sem chip de cor; aparece o texto "Entenda a referência".
- [ ] Registrar 185/95: chip laranja "Valor muito elevado" + mensagem de repouso; marcar "Dor ou aperto no peito" → chip vermelho "Procure atendimento agora".
- [ ] Registrar 100/85: alerta "Confira os valores" com o motivo; "Corrigir" volta; "Salvar assim mesmo" grava.
- [ ] Lista mostra data/hora, leitura, chips de contexto (braço, remédio); FC ao lado.
- [ ] Após 3 medidas ≥ 130/80 em dias diferentes na última semana: convite para MRPA aparece; "Agora não" some e não volta ao reabrir.
- [ ] Resumo dos 7 dias (média, maior, menor) e gráfico dos últimos 14 dias com a linha "130/80 — referência da MRPA".
- [ ] Home: após 185/95, item laranja "Repetir a medida: pressão muito elevada" no topo.

## C. MRPA (C-011)
- [ ] Iniciar: textos de abertura e regras; duração 6 (Recomendado) por padrão; horários; PA do consultório opcional; "Começar a MRPA" abre a tela do dia.
- [ ] Notificações: permissão pedida; lembretes de manhã e noite agendados para os dias da sessão (aparecem no horário).
- [ ] Tela do dia: "Dia 1 de 6", blocos Manhã e Noite, botão "Fazer as 3 medidas da manhã".
- [ ] Medição guiada: preparo → medida 1 → cronômetro de 1 min → medida 2 → cronômetro → medida 3 → resumo com média do período → volta ao dia com as 3 medidas listadas.
- [ ] Valor 100/85 na medição: pede confirmação; se salvar, aparece "excluída do cálculo".
- [ ] Valor 185/95 na medição: alerta laranja de repouso (a MRPA continua).
- [ ] "Concluir MRPA" desabilitado antes do último dia, com "Disponível a partir do dia 6".
- [ ] Dashboard e Home mostram "MRPA — dia X de 6"; Home mostra "Fazer as medidas da noite" quando falta.
- [ ] (Teste rápido) Sessão de 4 dias iniciada e concluída após o dia 4: relatório com período, qualidade, médias total/manhã/noite, por dia, gráfico, medicamentos, tabela, ressalvas.
- [ ] Relatório de sessão completa com médias ≥ 130/80: chip amarelo + mensagem; Home mostra "Levar o relatório da MRPA ao médico" até abrir o relatório.
- [ ] Sessão com um dia sem noite: chip cinza "Não atinge o mínimo para interpretação" e motivo; sem item amarelo na Home.
- [ ] Cancelar MRPA: confirmação; volta para Minha Pressão; lembretes somem.

## D. Medicamentos (§21)
- [ ] Novo medicamento com horários e "Lembrar nos horários" ligado: notificação chega no horário; desligar cancela.
- [ ] Relatório da MRPA lista os medicamentos ativos com horários.

## E. Regressão
- [ ] Rastreando e Minha Saúde continuam funcionando (Home com itens dos dois módulos).
