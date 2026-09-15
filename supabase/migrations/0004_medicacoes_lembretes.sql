-- NERO · Fase 0 · medicações (§21) e central de lembretes (§63)
create table public.medicacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  dose text,
  horarios jsonb not null default '[]',
  desde date,
  ate date,
  prescritor text,
  ativa boolean not null default true,
  observacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index medicacoes_user_ativas_idx on public.medicacoes (user_id) where ativa;
create trigger medicacoes_updated_at before update on public.medicacoes
  for each row execute function public.set_updated_at();

create table public.lembretes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origem_tipo text not null check (origem_tipo in ('exame','medida','medicacao','perfil','sistema')),
  origem_id uuid,
  agendado_para timestamptz not null,
  titulo text not null,
  mensagem text,
  status text not null default 'pendente' check (status in ('pendente','enviado','lido','cancelado')),
  created_at timestamptz not null default now()
);
create index lembretes_user_pendentes_idx on public.lembretes (user_id, agendado_para) where status = 'pendente';
