begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.dev'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.dev');

insert into public.medicacoes (id, user_id, nome, horarios) values
  ('00000000-0000-0000-0000-00000000da01', '00000000-0000-0000-0000-0000000000d1', 'Losartana', '["08:00"]'),
  ('00000000-0000-0000-0000-00000000da02', '00000000-0000-0000-0000-0000000000d1', 'Dipirona', '[]');

-- gatilho de horarios_desde
select isnt((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), null,
  'cadastrar com horário marca horarios_desde');
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da02'), null,
  'sem horário não marca horarios_desde');

update public.medicacoes set horarios_desde = '2020-01-01' where id = '00000000-0000-0000-0000-00000000da01';
update public.medicacoes set observacao = 'x' where id = '00000000-0000-0000-0000-00000000da01';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), '2020-01-01'::timestamptz,
  'mudar observação não mexe em horarios_desde');

update public.medicacoes set quantidades = '{"08:00": 2}' where id = '00000000-0000-0000-0000-00000000da01';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), now(),
  'mudar quantidade marca horarios_desde');

select is((select unidade from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), 'comprimido',
  'unidade padrão é comprimido');
select is(jsonb_typeof((select horarios->0 from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01')), 'string',
  'horarios continua lista de textos (build antigo)');

-- restrições
select throws_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, data_prevista, hora_prevista, tomou, quantidade)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000da01', '2026-11-23', null, true, 1)$$,
  '23514', null, 'data sem hora é recusada');
select throws_ok($$update public.medicacoes set unidade = 'colher' where id = '00000000-0000-0000-0000-00000000da01'$$,
  '23514', null, 'unidade fora da lista é recusada');

-- RLS de dono
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000d1","role":"authenticated"}';

select lives_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, data_prevista, hora_prevista, quantidade_prevista, tomou, quantidade)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000da01', '2026-11-23', '08:00', 2, true, 2)$$,
  'dono registra a própria tomada');
select throws_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, tomou)
  values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-00000000da01', false)$$,
  '42501', null, 'ninguém registra tomada em nome de outro');

set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000d2","role":"authenticated"}';
select is((select count(*) from public.tomadas_medicacao), 0::bigint, 'D2 não vê as tomadas de D1');

-- cascata
reset role;
delete from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01';
select is((select count(*) from public.tomadas_medicacao where medicacao_id = '00000000-0000-0000-0000-00000000da01'), 0::bigint,
  'apagar o remédio apaga as tomadas');

select * from finish();
rollback;
