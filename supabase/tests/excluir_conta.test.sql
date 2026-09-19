begin;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'a1@teste.dev'),
  ('00000000-0000-0000-0000-0000000000b1', 'b1@teste.dev');

insert into public.medicacoes (user_id, nome) values
  ('00000000-0000-0000-0000-0000000000a1', 'Losartana'),
  ('00000000-0000-0000-0000-0000000000b1', 'Metformina');

insert into storage.objects (bucket_id, name, owner_id) values
  ('laudos', '00000000-0000-0000-0000-0000000000a1/laudo-a.pdf', '00000000-0000-0000-0000-0000000000a1'),
  ('relatorios', '00000000-0000-0000-0000-0000000000a1/rel-a.pdf', '00000000-0000-0000-0000-0000000000a1'),
  ('laudos', '00000000-0000-0000-0000-0000000000b1/laudo-b.pdf', '00000000-0000-0000-0000-0000000000b1');

-- anônimo não pode chamar
set local role anon;
select throws_ok('select public.excluir_minha_conta()', '42501', null, 'anon não executa a função');

-- A com arquivos nos buckets: recusa (o app precisa esvaziar pela Storage API antes)
set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select throws_ok('select public.excluir_minha_conta()', 'P0001', null, 'recusa enquanto restam arquivos de A');

-- simula a remoção pela Storage API
reset role;
set local storage.allow_delete_query to 'true';
delete from storage.objects where (storage.foldername(name))[1] = '00000000-0000-0000-0000-0000000000a1';
set local storage.allow_delete_query to 'false';

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok('select public.excluir_minha_conta()', 'A exclui a própria conta com buckets vazios');

reset role;
select is((select count(*) from auth.users where id = '00000000-0000-0000-0000-0000000000a1'), 0::bigint, 'usuário A removido de auth.users');
select is((select count(*) from public.perfil_saude where user_id = '00000000-0000-0000-0000-0000000000a1'), 0::bigint, 'perfil de A removido por cascata');
select is((select count(*) from public.medicacoes where user_id = '00000000-0000-0000-0000-0000000000a1'), 0::bigint, 'medicações de A removidas por cascata');

-- B continua intacto
select is((select count(*) from auth.users where id = '00000000-0000-0000-0000-0000000000b1'), 1::bigint, 'usuário B preservado');
select is((select count(*) from public.medicacoes where user_id = '00000000-0000-0000-0000-0000000000b1'), 1::bigint, 'medicação de B preservada');
select is((select count(*) from storage.objects where (storage.foldername(name))[1] = '00000000-0000-0000-0000-0000000000b1'), 1::bigint, 'arquivo de B preservado');

select * from finish();
rollback;
