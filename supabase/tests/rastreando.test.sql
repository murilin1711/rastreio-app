begin;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000001a', 'ra@teste.dev'),
  ('00000000-0000-0000-0000-00000000001b', 'rb@teste.dev');

-- A tem FIT positivo com pendência aberta
insert into public.exames (id, user_id, tipo, categoria, modulo, programa, data_realizacao, resultado, classificacao, nivel_alerta, abre_pendencia)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000001a', 'fit', 'rastreamento', 'rastreando', 'colorretal', '2026-08-01', '{"fit":"positivo"}', 'investigacao', 'laranja', true);
insert into public.pendencias (user_id, exame_origem_id, programa, descricao, nivel_alerta)
values ('00000000-0000-0000-0000-00000000001a', '10000000-0000-0000-0000-000000000001', 'colorretal', 'Colonoscopia ainda não registrada', 'laranja');

-- registra a colonoscopia ligada ao FIT
insert into public.exames (user_id, tipo, categoria, modulo, programa, data_realizacao, resultado, classificacao, nivel_alerta, resolve_exame_id)
values ('00000000-0000-0000-0000-00000000001a', 'colonoscopia', 'rastreamento', 'rastreando', 'colorretal', '2026-09-10', '{"achado":"normal","qualidade_adequada":true}', 'normal', 'verde', '10000000-0000-0000-0000-000000000001');

select is((select status from public.pendencias where exame_origem_id = '10000000-0000-0000-0000-000000000001'), 'resolvida', 'trigger fecha a pendência ao registrar exame relacionado');
select isnt((select exame_resolucao_id from public.pendencias where exame_origem_id = '10000000-0000-0000-0000-000000000001'), null, 'pendência aponta para o exame que a resolveu');

insert into public.sintomas_alarme (user_id, programa, sintoma) values ('00000000-0000-0000-0000-00000000001b', 'mama', 'nodulo_mamario');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000001a","role":"authenticated"}';
select is((select count(*) from public.sintomas_alarme), 0::bigint, 'A não vê sintomas de B');
select throws_ok(
  $$insert into public.sintomas_alarme (user_id, programa, sintoma) values ('00000000-0000-0000-0000-00000000001b', 'mama', 'x')$$,
  '42501', null, 'A não registra sintoma em nome de B');

select * from finish();
rollback;
