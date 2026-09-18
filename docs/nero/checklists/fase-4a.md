# Checklist manual — Fase 4a (Saúde & Bem-estar: Meu Corpo, atividade, sono, hábitos, Home)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Pré-requisito: migração 0012 e semente (12 regras `bem_estar`) na nuvem — `supabase db push` + semente. Referência: `docs/nero/funcionamento/saude-bem-estar.md` §1–§4.

## A. Meu Corpo (C-015, C-016, C-019)
- [ ] Home → card "Saúde & Bem-estar" (sem "em breve") → módulo → Meu Corpo → Registrar: peso 82, altura 170, cintura 96 (H) → IMC 28,4 "Sobrepeso"; cintura "Aumentada"; RCA 0,56 "Acima de 0,5" + frase "Sua cintura está acima da metade da altura…". Sem cor de alerta.
- [ ] Perfil com 65 anos e IMC 26 → "Faixa de referência para idosos" ao lado da faixa OMS.
- [ ] Mulher, cintura 79 → "Dentro da referência"; 80 → "Aumentada"; 88 → "Muito aumentada".
- [ ] Registrar quadril 102 → aparece "Relação cintura/quadril 0,94 · Acima da referência".
- [ ] "Como medir a cintura" abre a folha com a técnica e a fonte (OMS 2011 · ABESO 2016).
- [ ] Registrar peso 60 depois de 82 → pergunta "Confirma o peso? A última medida foi 82 kg…".
- [ ] Três pesos ao longo de 3 semanas (ex.: 82 → 81 → 80,5) → "Tendência de redução" e "Evolução no período: −1,8 %". Com só 2 medidas → texto "Registre pelo menos 3 medidas…".
- [ ] Período 30 d / 3 m / 6 m / 1 a / Tudo muda os gráficos; um gráfico por indicador; "Comparar períodos" entre dois meses mostra "Peso: 82 → 80,5 kg".
- [ ] Objetivo de peso: escolher "Manutenção" salva no perfil (reabrir mantém). Depois registrar peso 5 % menor que o maior dos últimos 6 meses → Home mostra item cinza "Conversar com o médico: seu peso caiu X % sem meta de redução"; com "Redução de peso" o item some.
- [ ] Peso máximo da vida 95 com IMC ≥ 30 → "13,7 % abaixo do peso máximo · Faixa de obesidade controlada" e a mensagem da ABESO 2026; com IMC < 30 só a porcentagem.
- [ ] Composição corporal: aviso literal no topo; salvar bioimpedância com peso e gordura % → aparece no card e no gráfico "Percentual de gordura"; o peso informado também entra em Peso.
- [ ] "Entenda cada medida": 8 seções com texto e fonte.

## B. Minhas Atividades (C-017)
- [ ] Registrar caminhada 40 min moderada (seg), musculação 50 min moderada (qua), corrida 20 min intensa (sex), yoga 30 min leve → "Sua semana": 130 / 150 minutos, barra 87 %, Fortalecimento 1 de 2 dias, Atividade total 140, Moderada 90, Intensa 20, Dias ativos 3 de 7; gráfico seg→dom com barras nos dias certos.
- [ ] Perfil ≥ 60 anos → texto inclui "equilíbrio: recomendado em 3 dias".
- [ ] Meta: "Usar a meta sugerida" → "Meta atual: 150 minutos por semana (sugerida)". "Criar minha meta" 200 → progresso vira "130 / 200".
- [ ] "Últimos 30 dias" agrupa por tipo com sessões e minutos; tocar e segurar um registro apaga (com confirmação).
- [ ] Frase da OMS aparece: "Qualquer atividade é melhor do que nenhuma."

## C. Meu Sono (C-018)
- [ ] Registrar noite: dormiu 23:40, acordou 06:20 → prévia "Tempo total de sono: 6h40"; salvar. Acordou 01:00 com dormiu 23:00 → assume dia seguinte (2h00).
- [ ] Sete noites com média < 7 h → card "Média por noite 6h40" e texto neutro "…abaixo das 7 horas que a AASM recomenda…"; média ≥ 7 h → sem o texto. Média > 9 h → nenhum aviso.
- [ ] Horário médio de dormir com noites 23:40 e 00:20 → "00:00" (não "12:00").
- [ ] Gráfico por noite com a linha de 7h00; qualidade e opcionais aparecem na lista.

## D. Meus hábitos e Home
- [ ] Tela do módulo: "Seus últimos 7 dias" com Movimento (n de 150), Sono (média), Peso (com "±x kg vs. média anterior"), Cintura ("último registro há n dias"); Alimentação "Em breve".
- [ ] Home: card do módulo com "130 de 150 min esta semana · sono 6h40". No domingo, com movimento abaixo da meta, item cinza "Movimentar-se: … esta semana"; em outros dias, não.

## E. Regressão
- [ ] PREVENT › dados: o peso registrado em Meu Corpo aparece como "Atual" (mesma tabela `medidas`).
- [ ] Check-up: item "Peso" atualizado após registrar em Meu Corpo.
- [ ] `npx tsc --noEmit` e `npx jest --ci` verdes (334); `supabase test db` (30).
