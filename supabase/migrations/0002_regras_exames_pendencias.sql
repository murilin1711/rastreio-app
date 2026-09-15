-- NERO · Fase 0 · base de regras clínicas (§65), exames (§53) e pendências (§50)
create table public.regras_clinicas (
  id uuid primary key default gen_random_uuid(),
  modulo text not null check (modulo in ('rastreando','cardio','bem_estar','geral')),
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  exame_tipo text,
  condicao jsonb not null default '{}',
  classificacao text check (classificacao in ('normal','controle','complementar','investigacao','especializado','pendente')),
  nivel_alerta text check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  proxima_acao text,
  intervalo_meses integer check (intervalo_meses is null or intervalo_meses > 0),
  mensagem_paciente text,
  mensagem_profissional text,
  fonte text not null,
  ano integer not null,
  versao text not null,
  revisada_em date not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.regras_clinicas is 'Parâmetros das regras clínicas, separados dos dados do paciente (§65). Lógica em src/core/regras.';
create index regras_clinicas_busca_idx on public.regras_clinicas (modulo, programa, exame_tipo) where ativa;

create table public.exames (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null,
  categoria text not null check (categoria in ('rastreamento','laboratorial','cardiologico','imagem','outro')),
  modulo text not null check (modulo in ('rastreando','cardio','bem_estar','geral')),
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  data_realizacao date not null,
  resultado jsonb not null default '{}',
  laudo_texto text,
  instituicao text,
  solicitante text,
  observacoes text,
  anexos jsonb not null default '[]',
  classificacao text check (classificacao in ('normal','controle','complementar','investigacao','especializado','pendente')),
  nivel_alerta text check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  proxima_acao text,
  data_proxima_acao date,
  abre_pendencia boolean not null default false,
  regra_id uuid references public.regras_clinicas(id),
  regra_versao text,
  resolve_exame_id uuid references public.exames(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on column public.exames.resultado is 'Resultado estruturado por tipo: {"birads":3}, {"hpv":"16"}, {"valor":87,"unidade":"mg/dL"}';
comment on column public.exames.resolve_exame_id is 'Exame anterior cuja pendência este resolve (§51).';
create index exames_user_data_idx on public.exames (user_id, data_realizacao desc);
create index exames_user_programa_idx on public.exames (user_id, programa);
create index exames_resolve_idx on public.exames (resolve_exame_id);
create index exames_regra_idx on public.exames (regra_id);
create trigger exames_updated_at before update on public.exames
  for each row execute function public.set_updated_at();

create table public.pendencias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exame_origem_id uuid not null references public.exames(id) on delete cascade,
  programa text check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  descricao text not null,
  nivel_alerta text not null check (nivel_alerta in ('verde','amarelo','laranja','vermelho','cinza')),
  status text not null default 'aberta' check (status in ('aberta','resolvida','cancelada')),
  exame_resolucao_id uuid references public.exames(id),
  aberta_em timestamptz not null default now(),
  resolvida_em timestamptz
);
create index pendencias_user_abertas_idx on public.pendencias (user_id) where status = 'aberta';
create index pendencias_origem_idx on public.pendencias (exame_origem_id);
create index pendencias_resolucao_idx on public.pendencias (exame_resolucao_id);
