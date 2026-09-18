begin;
select plan(4);
select cmp_ok((select count(*) from public.regras_clinicas where ativa), '>=', 60::bigint, 'semente carregada');
select is((select count(*) from public.regras_clinicas where fonte is null or fonte = ''), 0::bigint, 'toda regra tem fonte');
select is((select count(*) from public.regras_clinicas where programa is not null and exame_tipo is null), 5::bigint, 'uma regra de elegibilidade por programa');
select is((select count(*) from public.regras_clinicas where modulo = 'rastreando' and classificacao in ('normal','controle') and intervalo_meses is null and exame_tipo not in ('psa','colonoscopia')), 0::bigint, 'Rastreando: normal/controle têm intervalo, exceto PSA e adenomas (intervalo do laudo)');
select * from finish();
rollback;
