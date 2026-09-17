begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000002a', 'ca@teste.dev'),
  ('00000000-0000-0000-0000-00000000002b', 'cb@teste.dev');

select throws_ok(
  $$insert into public.mrpa_sessoes (user_id, inicio, dias_previstos) values ('00000000-0000-0000-0000-00000000002a', '2026-09-17', 7)$$,
  '23514', null, 'MRPA não aceita 7 dias (Medidas PA 2023: 4 a 6)');
select lives_ok(
  $$insert into public.mrpa_sessoes (user_id, inicio) values ('00000000-0000-0000-0000-00000000002a', '2026-09-17')$$,
  'padrão de 6 dias é aceito');
select is((select dias_previstos from public.mrpa_sessoes where user_id = '00000000-0000-0000-0000-00000000002a'), 6, 'padrão é 6 dias');

insert into public.riscos_cv (user_id, modelo, entradas, ascvd_10, categoria, versao_coeficientes)
values ('00000000-0000-0000-0000-00000000002b', 'prevent_base', '{}', 4.5, 'baixo', 'teste');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000002a","role":"authenticated"}';
select is((select count(*) from public.riscos_cv), 0::bigint, 'A não vê riscos de B');
select is((select count(*) from public.regras_clinicas where programa = 'pressao' and ativa), 7::bigint, 'semente tem as 7 regras de pressão');

select * from finish();
rollback;
