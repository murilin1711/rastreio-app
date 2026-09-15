begin;
select plan(4);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@teste.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'b@teste.dev');

select is((select count(*) from public.perfil_saude), 2::bigint, 'trigger cria perfil ao inserir usuário');

insert into public.medicacoes (user_id, nome) values ('00000000-0000-0000-0000-00000000000b', 'Losartana');

set local role authenticated;
set local request.jwt.claims to '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select is((select count(*) from public.perfil_saude), 1::bigint, 'A vê só o próprio perfil');
select is((select count(*) from public.medicacoes), 0::bigint, 'A não vê medicação de B');
select throws_ok(
  $$insert into public.medicacoes (user_id, nome) values ('00000000-0000-0000-0000-00000000000b', 'Invasão')$$,
  '42501', null, 'A não insere em nome de B');

select * from finish();
rollback;
