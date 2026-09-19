begin;
select plan(6);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-0000000000e1', 'e1@teste.dev');

select has_table('public', 'dias_ativos', 'tabela dias_ativos existe');

-- registrar uma atividade marca o dia
insert into public.atividades (user_id, inicio, tipo, duracao_min, intensidade)
  values ('00000000-0000-0000-0000-0000000000e1', now(), 'caminhada', 30, 'moderada');
select is(
  (select count(*)::int from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000e1'),
  1, 'registro de atividade marca o dia');

-- um segundo registro no mesmo dia não cria linha nova
insert into public.medidas (user_id, tipo, medido_em, valores)
  values ('00000000-0000-0000-0000-0000000000e1', 'peso', now(), '{"kg": 80}'::jsonb);
select is(
  (select count(*)::int from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000e1'),
  1, 'dois registros no mesmo dia continuam sendo um dia só');

-- o dia gravado é o de São Paulo, não o do UTC
select is(
  (select dia from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000e1'),
  (now() at time zone 'America/Sao_Paulo')::date, 'o dia é o do fuso de São Paulo');

-- cadastrar um exame também conta (decisão de 19/09: qualquer coisa que gere dado)
delete from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000e1';
insert into public.exames (user_id, tipo, categoria, modulo, programa, data_realizacao)
  values ('00000000-0000-0000-0000-0000000000e1', 'mamografia', 'rastreamento', 'rastreando', 'mama', current_date);
select is(
  (select count(*)::int from public.dias_ativos where user_id = '00000000-0000-0000-0000-0000000000e1'),
  1, 'cadastro de exame também marca o dia');

select throws_ok(
  $$update public.perfil_saude set marco_sequencia_comemorado = 5 where user_id = '00000000-0000-0000-0000-0000000000e1'$$,
  '23514', null, 'marco de sequência só aceita 0, 3, 7, 30 ou 100');

select * from finish();
rollback;
