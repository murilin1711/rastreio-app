begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000003a', 'ma@teste.dev'),
  ('00000000-0000-0000-0000-00000000003b', 'mb@teste.dev');

insert into public.documentos (user_id, tipo, nome, caminho, mime, tamanho)
values ('00000000-0000-0000-0000-00000000003b', 'laudo', 'LDL.jpg', '00000000-0000-0000-0000-00000000003b/x.jpg', 'image/jpeg', 1000);
insert into public.compartilhamentos (user_id, tipo_relatorio, caminho, expira_em)
values ('00000000-0000-0000-0000-00000000003b', 'geral', '00000000-0000-0000-0000-00000000003b/r.pdf', now() + interval '7 days');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000003a","role":"authenticated"}';
select is((select count(*) from public.documentos), 0::bigint, 'A não vê documentos de B');
select is((select count(*) from public.compartilhamentos), 0::bigint, 'A não vê compartilhamentos de B');
select throws_ok(
  $$insert into public.consultas (user_id, especialidade, data_hora) values ('00000000-0000-0000-0000-00000000003b', 'cardiologia', now())$$,
  '42501', null, 'A não agenda consulta em nome de B');
select lives_ok(
  $$insert into public.lembretes (user_id, origem_tipo, agendado_para, titulo) values ('00000000-0000-0000-0000-00000000003a', 'consulta', now(), 'consulta:x:d-1')$$,
  'lembrete de consulta é aceito');
select throws_ok(
  $$insert into storage.objects (bucket_id, name, owner) values ('relatorios', '00000000-0000-0000-0000-00000000003b/r.pdf', '00000000-0000-0000-0000-00000000003a')$$,
  '42501', null, 'A não grava relatório na pasta de B');

select * from finish();
rollback;
