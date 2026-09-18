begin;
select plan(6);

select is((select count(*) from public.regras_clinicas where programa = 'bem_estar' and ativa), 12::bigint, 'semente tem as 12 regras de bem-estar');

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000004a', 'ba@teste.dev'),
  ('00000000-0000-0000-0000-00000000004b', 'bb@teste.dev');

insert into public.refeicoes (user_id, em, tipo, descricao) values ('00000000-0000-0000-0000-00000000004b', now(), 'almoco', 'arroz e feijão');
insert into public.checkins (user_id, semana, disposicao) values ('00000000-0000-0000-0000-00000000004b', '2026-09-14', 7);
insert into public.medidas (id, user_id, tipo, medido_em, valores) values ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-00000000004b', 'glicemia', now(), '{"mgdl":110}');
insert into public.metas (user_id, tipo, valor, origem) values ('00000000-0000-0000-0000-00000000004a', 'atividade_min', 150, 'app');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000004a","role":"authenticated"}';
select is((select count(*) from public.refeicoes), 0::bigint, 'A não vê refeições de B');
select throws_ok(
  $$insert into public.atividades (user_id, inicio, tipo, duracao_min, intensidade) values ('00000000-0000-0000-0000-00000000004b', now(), 'caminhada', 30, 'moderada')$$,
  '42501', null, 'A não registra atividade em nome de B');
select is((select count(*) from public.checkins), 0::bigint, 'A não vê check-ins de B');
select throws_ok(
  $$insert into public.metas (user_id, tipo, valor, origem) values ('00000000-0000-0000-0000-00000000004a', 'atividade_min', 200, 'usuario')$$,
  '23505', null, 'só uma meta ativa por tipo');
select throws_ok(
  $$insert into public.vinculos_glicemia (glicemia_id, refeicao_id) values ('00000000-0000-0000-0000-0000000000b1', (select id from public.refeicoes limit 1))$$,
  '42501', null, 'A não vincula glicemia de B');

select * from finish();
rollback;
