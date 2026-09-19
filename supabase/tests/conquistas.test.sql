begin;
select plan(5);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'd1@teste.dev'),
  ('00000000-0000-0000-0000-0000000000d2', 'd2@teste.dev');

select has_table('public', 'conquistas', 'tabela conquistas existe');

insert into public.conquistas (user_id, chave) values ('00000000-0000-0000-0000-0000000000d1', 'primeira_atividade');
select is(
  (select count(*)::int from public.conquistas where user_id = '00000000-0000-0000-0000-0000000000d1'),
  1, 'conquista gravada');

select throws_ok(
  $$insert into public.conquistas (user_id, chave) values ('00000000-0000-0000-0000-0000000000d1', 'primeira_atividade')$$,
  '23505', null, 'a mesma conquista não pode ser gravada duas vezes');

select throws_ok(
  $$insert into public.conquistas (user_id, chave) values ('00000000-0000-0000-0000-0000000000d1', 'pendencia_resolvida')$$,
  '23514', null, 'chave fora do catálogo é recusada (nada de rastreamento)');

-- apagar o usuário leva as conquistas junto (exigência da exclusão de conta, D-013)
delete from auth.users where id = '00000000-0000-0000-0000-0000000000d1';
select is(
  (select count(*)::int from public.conquistas where user_id = '00000000-0000-0000-0000-0000000000d1'),
  0, 'conquistas somem com a conta');

select * from finish();
rollback;
