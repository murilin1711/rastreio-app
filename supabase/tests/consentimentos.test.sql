begin;
select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000c1', 'c1@teste.dev', '{"nome":"C1","termos_versao":"2026-09-26","dados_saude_versao":"2026-09-26"}'),
  ('00000000-0000-0000-0000-0000000000c2', 'c2@teste.dev', '{"nome":"C2"}'),
  ('00000000-0000-0000-0000-0000000000c3', 'c3@teste.dev', '{"full_name":"Maria Google","name":"Maria"}'),
  ('00000000-0000-0000-0000-0000000000c4', 'c4@teste.dev', '{}');

select is((select count(*) from public.consentimentos where user_id = '00000000-0000-0000-0000-0000000000c1'), 2::bigint,
  'cadastro com os dois aceites no metadata grava os dois');
select is((select count(*) from public.consentimentos where user_id = '00000000-0000-0000-0000-0000000000c2'), 0::bigint,
  'cadastro sem aceite (conta antiga) não grava nada');
select is((select count(*) from public.perfil_saude where user_id = '00000000-0000-0000-0000-0000000000c1'), 1::bigint,
  'o gatilho continua criando o perfil');
select is((select nome from public.perfil_saude where user_id = '00000000-0000-0000-0000-0000000000c3'), 'Maria Google',
  'login com Google: o nome vem de full_name (D-061)');
select is((select nome from public.perfil_saude where user_id = '00000000-0000-0000-0000-0000000000c4'), '',
  'login com Apple (sem nome no token): perfil criado com nome vazio');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}';

select lives_ok($$insert into public.consentimentos (user_id, tipo, versao) values ('00000000-0000-0000-0000-0000000000c2', 'termos', '2026-09-26')$$,
  'conta antiga registra o próprio aceite pela tela de consentimento');
select is((select count(*) from public.consentimentos), 1::bigint, 'C2 vê só os próprios aceites');
select throws_ok($$insert into public.consentimentos (user_id, tipo, versao) values ('00000000-0000-0000-0000-0000000000c1', 'termos', 'falso')$$,
  '42501', null, 'ninguém registra aceite em nome de outro');

select * from finish();
rollback;
