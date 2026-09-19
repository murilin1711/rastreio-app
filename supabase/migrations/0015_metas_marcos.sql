-- NERO · Bem-estar · D-016: marcos de 50% e 100% das metas de peso e cintura.
-- `valor_inicial` é o peso/cintura do dia em que a meta foi criada: sem ele não existe "metade do
-- caminho", já que a meta guarda só o alvo. Fica nulo nas metas criadas antes desta migração e
-- quando a pessoa define a meta sem ter nenhuma medida registrada — nesses casos só há o marco de 100%.
-- `marco_comemorado` impede que o mascote comemore de novo a cada vez que a tela abre. Nunca diminui:
-- afastar-se do alvo não retira a conquista nem gera aviso.
alter table public.metas
  add column valor_inicial numeric,
  add column marco_comemorado smallint not null default 0
    check (marco_comemorado in (0, 50, 100));
