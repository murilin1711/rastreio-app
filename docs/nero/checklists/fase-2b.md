# Checklist manual — Fase 2b (glicemia, exames, risco, check-up, linha do tempo)

> Executado em: ____/____/2026 · Aparelho: __________________ · Executor: Murilo
> Pré-requisito: regras de glicemia (9) e risco (4) semeadas na nuvem. Referência: `docs/nero/funcionamento/coracao-metabolismo.md` §3–§6.

## A. Glicemia (C-012)
- [ ] Perfil **com** diabetes e sem metas: Minha Glicemia mostra metas 80–130 / < 180 / 90–150 com "Meta da diretriz SBD 2026 — confirme com seu médico".
- [ ] Meu plano: "Meu médico" → digitar metas → salvam e aparecem como "Definidas pelo seu médico".
- [ ] Meu plano: "Ainda não tenho plano" → modelos da SBD conforme tipo/insulina; escolher um preenche horários; salvar agenda lembretes ("Glicemia — antes do almoço").
- [ ] Registrar 104 em jejum: "Dentro da sua meta…", sem chip. 140 antes do almoço: "acima da sua meta", sem chip.
- [ ] Registrar 48: chip laranja "Glicemia muito baixa" + "siga agora a orientação do seu médico…". 60 + "Confusão mental": vermelho.
- [ ] Registrar 260: laranja "muito alta"; 260 + "Vômito": vermelho.
- [ ] Perfil **sem** diabetes: sem bloco de metas; 126 em jejum → texto de convite ao exame de laboratório, sem chip; 92 → nada.
- [ ] Relatório: período 7/14/30/90, médias, tabela, gráfico com faixa da meta, medicamentos.
- [ ] Home: glicemia 48 nas últimas 24 h → item laranja; horário do plano vencido sem medida → "Medir glicemia — …".

## B. Meus Exames (§9–§11)
- [ ] Adicionar LDL 87 mg/dL em 13/09 com referência 0–130; lista mostra valor e data; detalhe sem chip.
- [ ] "Salvar e adicionar outro da mesma data" mantém a data; adicionar colesterol total 185, HDL 57, creatinina 0,8, HbA1c 5,7.
- [ ] Segundo LDL em outra data → detalhe mostra "Evolução" com gráfico.
- [ ] Escore de cálcio 150 Agatston → detalhe com chip amarelo e mensagem da diretriz; 50 → sem chip.
- [ ] Filtro Laboratoriais / Cardiológicos.

## C. Meu Risco (C-013, C-014)
- [ ] Primeira abertura pergunta sobre evento prévio; "Sim" → tela explica que o escore não se aplica (com opção de corrigir).
- [ ] Idade fora de 30–79 (perfil de teste) → mensagem de elegibilidade.
- [ ] "Calcular agora" → tela de dados: PA (média das medidas dos últimos 7 dias ou MRPA) "Atual"; CT/HDL/creatinina "Atual" (exames deste mês); HbA1c preenchida; peso pede valor se não houver; remédios e tabagismo para confirmar.
- [ ] Exame com mais de 12 meses aparece "Antigo — tem mais recente?" com as duas opções.
- [ ] "Calcular meu risco" → **nesta versão** mostra "Ainda não disponível" (coeficientes pendentes). Após a Task 4: resultado com %, categoria pelo escore, 30 anos (30–59), fatores educativos, aviso de dados antigos.
- [ ] Agravantes: marcar "Infarto… precoce na família" → salva; frase do §17 aparece; CAC registrado aparece com a regra.

## D. Check-up, linha do tempo, dashboard
- [ ] Check-up mostra n/8 e frases; tocar num item faltante leva à tela certa; sem diabetes, "Glicemia / HbA1c" conta como "não se aplica".
- [ ] Linha do tempo agrupa por ano: exames, PA média do mês, glicemia média do mês, MRPA concluída, peso.
- [ ] Dashboard: cards Pressão, MRPA, Glicemia, HbA1c, LDL, Risco, Peso preenchidos quando há dado; "Como está minha prevenção?" com n/8.
- [ ] Home: item cinza "Atualizar minha prevenção: n de 8 em dia" com a primeira frase faltante.

## E. Regressão
- [ ] Fluxos da Fase 2a (pressão, MRPA) e do Rastreando seguem funcionando.
