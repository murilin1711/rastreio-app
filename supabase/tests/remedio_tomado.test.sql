begin;
select plan(29);

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

update public.medicacoes set horarios_desde = '2020-01-01' where id = '00000000-0000-0000-0000-00000000da01';
update public.medicacoes set horarios = '["08:00", "20:00"]' where id = '00000000-0000-0000-0000-00000000da01';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), now(),
  'mudar horários marca horarios_desde');

update public.medicacoes set horarios = '[]' where id = '00000000-0000-0000-0000-00000000da02';
update public.medicacoes set horarios = '["09:00"]' where id = '00000000-0000-0000-0000-00000000da02';
update public.medicacoes set horarios = '[]' where id = '00000000-0000-0000-0000-00000000da02';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da02'), null,
  'tirar todos os horários limpa horarios_desde');

-- reativação pelo build antigo (só muda ativa): o tempo parado não vira "sem registro" (D-066, M2)
update public.medicacoes set horarios_desde = '2020-01-01' where id = '00000000-0000-0000-0000-00000000da01';
update public.medicacoes set ativa = false where id = '00000000-0000-0000-0000-00000000da01';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), '2020-01-01'::timestamptz,
  'interromper não mexe em horarios_desde');
update public.medicacoes set ativa = true where id = '00000000-0000-0000-0000-00000000da01';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), now(),
  'reativar (só ativa = true, como o build antigo) marca horarios_desde = agora');
update public.medicacoes set ativa = false where id = '00000000-0000-0000-0000-00000000da02';
update public.medicacoes set ativa = true where id = '00000000-0000-0000-0000-00000000da02';
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da02'), null,
  'reativar remédio sem horário não marca horarios_desde');

select lives_ok($$insert into public.medicacoes (id, user_id, nome, horarios) values
  ('00000000-0000-0000-0000-00000000da03', '00000000-0000-0000-0000-0000000000d1', 'Formato estranho', '"08:00"')$$,
  'horarios que não é lista não quebra o gatilho');
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000da03'), null,
  'horarios que não é lista não marca horarios_desde');

select is((select unidade from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01'), 'comprimido',
  'unidade padrão é comprimido');
select is(jsonb_typeof((select horarios->0 from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01')), 'string',
  'horarios continua lista de textos (build antigo)');

-- restrições
select throws_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, data_prevista, hora_prevista, tomou, quantidade)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000da01', '2026-11-23', null, true, 1)$$,
  '23514', null, 'data sem hora é recusada');
select throws_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, data_prevista, hora_prevista, tomou, quantidade)
  values ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-00000000da01', '2026-11-23', '24:00', true, 1)$$,
  '23514', null, 'hora 24:00 é recusada');
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
select throws_ok($$insert into public.tomadas_medicacao (user_id, medicacao_id, tomou)
  values ('00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-00000000da01', false)$$,
  '23503', null, 'ninguém registra tomada no remédio de outra pessoa');
select throws_ok('select public.remedio_tomado_preencher_existentes()', '42501', null,
  'o app não chama o preenchimento dos remédios existentes');

-- cascata
reset role;
delete from public.medicacoes where id = '00000000-0000-0000-0000-00000000da01';
select is((select count(*) from public.tomadas_medicacao where medicacao_id = '00000000-0000-0000-0000-00000000da01'), 0::bigint,
  'apagar o remédio apaga as tomadas');

-- preenchimento dos remédios existentes (mesma função que a migração rodou): linhas no estado de antes da 0023
insert into public.medicacoes (id, user_id, nome, horarios, ativa) values
  ('00000000-0000-0000-0000-00000000db01', '00000000-0000-0000-0000-0000000000d2', 'Ativo sem horário', '[]', true),
  ('00000000-0000-0000-0000-00000000db02', '00000000-0000-0000-0000-0000000000d2', 'Inativo sem horário', '[]', false),
  ('00000000-0000-0000-0000-00000000db03', '00000000-0000-0000-0000-0000000000d2', 'Com horário', '["08:00", "20:00"]', true);
update public.medicacoes set se_precisar = false, horarios_desde = null
  where id in ('00000000-0000-0000-0000-00000000db01', '00000000-0000-0000-0000-00000000db02', '00000000-0000-0000-0000-00000000db03');
select lives_ok('select public.remedio_tomado_preencher_existentes()',
  'preenchimento não aborta com horarios que não é lista');

select is((select se_precisar from public.medicacoes where id = '00000000-0000-0000-0000-00000000db01'), true,
  'existente ativo sem horário vira se precisar');
select is((select se_precisar from public.medicacoes where id = '00000000-0000-0000-0000-00000000db02'), false,
  'existente inativo sem horário não vira se precisar');
select is((select se_precisar from public.medicacoes where id = '00000000-0000-0000-0000-00000000db03'), false,
  'existente com horário não vira se precisar');
select isnt((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000db03'), null,
  'existente com horário ganha horarios_desde');
select is((select quantidades from public.medicacoes where id = '00000000-0000-0000-0000-00000000db03'), '{}'::jsonb,
  'existente fica com quantidades vazio (1 por horário)');

update public.medicacoes set horarios_desde = '2020-01-01' where id = '00000000-0000-0000-0000-00000000db03';
select public.remedio_tomado_preencher_existentes();
select is((select horarios_desde from public.medicacoes where id = '00000000-0000-0000-0000-00000000db03'), '2020-01-01'::timestamptz,
  'rodar o preenchimento de novo não mexe em horarios_desde já preenchido');

select * from finish();
rollback;
