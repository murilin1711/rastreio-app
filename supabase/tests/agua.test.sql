begin;
select plan(5);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000f1', 'f1@teste.dev');

insert into public.medidas (user_id, tipo, medido_em, valores)
  values ('00000000-0000-0000-0000-0000000000f1', 'agua', now(), '{"ml": 250}'::jsonb);
select is(
  (select (valores->>'ml')::int from public.medidas where user_id = '00000000-0000-0000-0000-0000000000f1' and tipo = 'agua'),
  250, 'registro de água é aceito em medidas');

-- beber água conta para a sequência de dias, pelo gatilho que já existe em medidas
select is(
  (select count(*)::int from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000f1'),
  1, 'registrar água marca o dia na sequência');

insert into public.metas (user_id, tipo, valor, origem)
  values ('00000000-0000-0000-0000-0000000000f1', 'agua_ml', 2450, 'app');
select is(
  (select valor::int from public.metas where user_id = '00000000-0000-0000-0000-0000000000f1' and tipo = 'agua_ml'),
  2450, 'meta de água em ml é aceita');

select has_column('public', 'perfil_saude', 'tem_insuficiencia_cardiaca', 'perfil tem insuficiência cardíaca');
select has_column('public', 'perfil_saude', 'agua_meta_comemorada_em', 'perfil guarda o dia da última comemoração da meta');

select * from finish();
rollback;
