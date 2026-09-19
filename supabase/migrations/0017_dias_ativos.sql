-- NERO · Bem-estar · D-016 (parte C): sequência de dias com registro.
-- Uma linha por dia em que a pessoa registrou alguma coisa. O gatilho fica no banco, e não nas
-- telas, para qualquer registro contar automaticamente — inclusive os de tabelas que vierem depois,
-- bastando acrescentá-las à lista abaixo.
-- Fuso: o banco guarda tudo em UTC, mas o "dia" de quem registra às 22h em Brasília já é o dia
-- seguinte em UTC. Por isso a data é convertida para America/Sao_Paulo. Erra por um dia para quem
-- usar o app em outro fuso; mandar o dia local do celular exigiria instrumentar toda tela de registro.
create table public.dias_ativos (
  user_id uuid not null references auth.users(id) on delete cascade,
  dia date not null,
  primary key (user_id, dia)
);

-- `marco_sequencia_comemorado` no perfil: o maior marco de sequência já comemorado (0, 3, 7, 30, 100).
-- Nunca diminui — quebrar a sequência não retira o que já foi conquistado.
alter table public.perfil_saude
  add column marco_sequencia_comemorado smallint not null default 0
    check (marco_sequencia_comemorado in (0, 3, 7, 30, 100));

create or replace function public.marcar_dia_ativo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.dias_ativos (user_id, dia)
  values (new.user_id, (now() at time zone 'America/Sao_Paulo')::date)
  on conflict do nothing;
  return new;
end $$;

-- Tabelas que representam "a pessoa registrou alguma coisa" (decisão do Murilo em 19/09: qualquer
-- coisa que gere dado). Ficam de fora as que o app escreve sozinho (pendencias, riscos_cv,
-- vinculos_glicemia), o catálogo clínico e a própria dias_ativos.
do $$
declare t text;
begin
  foreach t in array array['atividades','refeicoes','checkins','medidas','exames','documentos','consultas','medicacoes','lembretes','antecedentes_familiares','mrpa_sessoes','metas']
  loop
    execute format('create trigger %I after insert on public.%I for each row execute function public.marcar_dia_ativo()', t || '_dia_ativo', t);
  end loop;
end $$;

-- RLS dono (padrão da 0005). Só leitura interessa ao app; quem escreve é o gatilho.
alter table public.dias_ativos enable row level security;
create policy dias_ativos_owner on public.dias_ativos for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
