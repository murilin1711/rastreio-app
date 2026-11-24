-- NERO · D-066: marcar remédio tomado.
-- A quantidade de cada horário vai numa coluna à parte (`quantidades`, {"08:00": 1, "20:00": 2}) em vez de
-- virar objeto dentro de `horarios`: o build que está nas lojas lê `horarios` como lista de textos 'HH:MM'
-- (formatarHorarios, lembretes fazem h.split(':')) e trocar o formato derrubaria a tela e os lembretes de
-- quem ainda não atualizou. Hora sem entrada em `quantidades` vale 1. O check "quantidade > 0" não cabe
-- num jsonb livre: fica no app.
alter table public.medicacoes
  add column quantidades jsonb not null default '{}',
  add column unidade text not null default 'comprimido'
    check (unidade in ('comprimido', 'gota', 'unidade', 'ml', 'jato')),
  add column dose_variavel boolean not null default false,
  add column se_precisar boolean not null default false,
  add column horarios_desde timestamptz;

-- (id, user_id) único para a FK composta de tomadas_medicacao: a tomada só aponta para remédio do mesmo dono.
alter table public.medicacoes add constraint medicacoes_id_user_key unique (id, user_id);

-- Dados existentes: remédio ativo sem horário passa a ser "se precisar"; quem tem horário começa a contar
-- agora (quantidades fica {} = 1 por horário). Em função para o pgTAP conseguir exercitar o mesmo código;
-- roda uma vez aqui e não é chamável pelo app (execute só para o dono do banco). Idempotente: só mexe em linhas
-- ainda sem horarios_desde. Guarda de tipo: `horarios` que não seja lista não aborta a migração (o case garante
-- que jsonb_array_length só roda em array; num AND o Postgres não promete a ordem de avaliação).
create or replace function public.remedio_tomado_preencher_existentes()
returns void
language sql
set search_path = ''
as $$
  update public.medicacoes set se_precisar = true
    where ativa and horarios_desde is null
      and case when jsonb_typeof(horarios) = 'array' then jsonb_array_length(horarios) = 0 else false end;
  update public.medicacoes set horarios_desde = now()
    where horarios_desde is null
      and case when jsonb_typeof(horarios) = 'array' then jsonb_array_length(horarios) > 0 else false end;
$$;
comment on function public.remedio_tomado_preencher_existentes() is
  'Migração 0023 (D-066): preenche se_precisar e horarios_desde dos remédios cadastrados antes dela. Idempotente; não é para o app.';
revoke execute on function public.remedio_tomado_preencher_existentes() from public, anon, authenticated, service_role;
select public.remedio_tomado_preencher_existentes();

-- horarios_desde = desde quando valem os horários atuais (a adesão não cobra doses de antes disso).
-- Mantido pelo banco para valer também nas edições feitas pelo build antigo.
create or replace function public.medicacoes_horarios_desde()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT'
     or new.horarios is distinct from old.horarios
     or new.quantidades is distinct from old.quantidades then
    -- guarda de tipo: `horarios` que não seja lista não pode quebrar o update do build antigo
    new.horarios_desde := case
      when jsonb_typeof(new.horarios) <> 'array' then null
      when jsonb_array_length(new.horarios) > 0 then now()
      else null
    end;
  end if;
  return new;
end;
$$;

create trigger medicacoes_horarios_desde before insert or update on public.medicacoes
  for each row execute function public.medicacoes_horarios_desde();

-- Uma linha por marcação. Dose prevista: data_prevista + hora_prevista; remédio "se precisar": as duas nulas.
create table public.tomadas_medicacao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  medicacao_id uuid not null,
  data_prevista date,
  hora_prevista text check (hora_prevista ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  quantidade_prevista numeric check (quantidade_prevista is null or quantidade_prevista > 0),
  tomou boolean not null,
  quantidade numeric check (quantidade is null or quantidade > 0),
  marcado_em timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check ((data_prevista is null) = (hora_prevista is null)),
  check (not tomou or quantidade is not null),
  -- FK composta: a tomada só aponta para remédio do mesmo user_id (FK ignora RLS; sem isso dava para gravar,
  -- com o próprio user_id, uma tomada no remédio de outra pessoa).
  foreign key (medicacao_id, user_id) references public.medicacoes (id, user_id) on delete cascade
);
create index tomadas_medicacao_medicacao_idx on public.tomadas_medicacao (medicacao_id, user_id);
create index tomadas_medicacao_user_data_idx on public.tomadas_medicacao (user_id, data_prevista);
create index tomadas_medicacao_user_avulsas_idx on public.tomadas_medicacao (user_id, marcado_em)
  where data_prevista is null;

-- RLS de dono, igual à 0005. A exclusão de conta (0014) apaga auth.users e a cascata leva esta tabela.
alter table public.tomadas_medicacao enable row level security;
create policy tomadas_medicacao_owner on public.tomadas_medicacao for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
