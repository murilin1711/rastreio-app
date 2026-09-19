begin;
select plan(6);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000c1', 'c1@teste.dev');

select has_column('public', 'metas', 'valor_inicial', 'metas tem valor_inicial');
select has_column('public', 'metas', 'marco_comemorado', 'metas tem marco_comemorado');
select col_is_null('public', 'metas', 'valor_inicial', 'valor_inicial aceita nulo (meta antiga ou sem medida)');

insert into public.metas (user_id, tipo, valor, origem, valor_inicial)
  values ('00000000-0000-0000-0000-0000000000c1', 'peso', 80, 'usuario', 90);

select is(
  (select marco_comemorado from public.metas where user_id = '00000000-0000-0000-0000-0000000000c1'),
  0::smallint, 'meta nova começa sem marco comemorado');
select is(
  (select valor_inicial from public.metas where user_id = '00000000-0000-0000-0000-0000000000c1'),
  90::numeric, 'valor_inicial guarda o ponto de partida');

select throws_ok(
  $$update public.metas set marco_comemorado = 75 where user_id = '00000000-0000-0000-0000-0000000000c1'$$,
  '23514', null, 'marco_comemorado só aceita 0, 50 ou 100');

select * from finish();
rollback;
