# Funcionalidades futuras (lista do Murilo, 28/10/2026)

**Registrada em:** 28/10/2026, véspera do congresso · **Status:** ideias, nada decidido nem desenhado.
Usadas no roteiro de apresentação para médicos como "o que vem por aí". Nada disso existe no app hoje;
cada uma passa por especificação e decisão antes de virar código.

## Lista

1. **Site do médico** — já detalhado em [`portal-do-medico.md`](portal-do-medico.md). O médico registra plano,
   diagnóstico e orientações, e isso cai no app do paciente. O "Levar ao médico" passa a mostrar lado a lado o
   que o paciente registrou e o que o médico colocou. Inclui **metas definidas pelo médico** (ex.: 150 min de
   atividade por semana) chegando em Saúde & Bem-estar — hoje as metas são definidas pelo paciente.
2. **Retorno e preparo da consulta** — o paciente marca o retorno no app, cadastra a consulta e tem espaço para
   dúvidas e observações para levar.
3. **Tutoriais de medicamentos** — o paciente cadastra o remédio receitado (caneta de insulina, bombinha de asma…)
   e, se houver tutorial, ele aparece.
4. **Preço médio dos medicamentos** e se está **disponível no SUS**.
5. **Pedido de exame para a prefeitura** — o paciente coloca o pedido no app e ele vai para o WhatsApp da
   prefeitura para agendar.
6. **Carteira de vacina digital**.
7. **Alertas de vacina** (campanhas, vacinas novas) — depende de venda para governo/prefeitura.
8. **Módulo de diabetes** — como aplicar insulina, manual da diabetes, controle de glicemia, correção de insulina.
9. **Ficha de emergência** — alergias, tipo sanguíneo, remédios em uso, doenças e contato de emergência, que um
   familiar autorizado (ou a equipe do hospital, por QR/PDF) consegue ver numa emergência.
   - Hoje o app **não guarda alergias nem tipo sanguíneo** (conferido em 28/10) e o PDF/QR só sai do celular do
     próprio paciente desbloqueado. Precisa de: campos novos no perfil, acesso de familiar autorizado e/ou QR de
     emergência que funcione sem desbloquear o celular.

## Pontos de atenção antes de construir

- **Correção de insulina** e **ficha de emergência** mexem com decisão clínica e acesso de terceiros a dado
  sensível: revisão clínica (Dra. Denise), atualização da política de privacidade e do consentimento (LGPD art. 11).
- **Venda para prefeituras/governo** é o modelo de receita citado no pitch; os itens 5 e 7 dependem dele.
- O que for prometido no congresso deve ser dito no futuro: nada disso está no app que o médico baixa.
