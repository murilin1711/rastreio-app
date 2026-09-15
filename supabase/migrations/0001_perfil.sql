-- NERO · Fase 0 · perfil de saúde único (spec §4.1, §4.2)
create extension if not exists pgtap with schema extensions;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table public.perfil_saude (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  data_nascimento date,
  sexo_nascimento text check (sexo_nascimento in ('feminino','masculino')),
  possui_colo_utero boolean,
  histerectomia boolean,
  altura_cm numeric(5,1) check (altura_cm is null or (altura_cm between 50 and 250)),
  tabagismo_status text check (tabagismo_status in ('nunca','ex','atual')),
  cigarros_dia integer check (cigarros_dia is null or cigarros_dia >= 0),
  anos_fumando numeric(4,1) check (anos_fumando is null or anos_fumando >= 0),
  data_cessacao date,
  tem_diabetes boolean,
  tem_hipertensao boolean,
  tem_doenca_renal boolean,
  tem_imunossupressao boolean,
  tem_hiv boolean,
  tem_dii boolean,
  historico_cancer_pessoal jsonb not null default '[]',
  lesoes_precursoras jsonb not null default '[]',
  doencas_geneticas jsonb not null default '[]',
  radioterapia_toracica boolean,
  tipo_usuario text not null default 'paciente' check (tipo_usuario in ('paciente','profissional')),
  perfil_inicial_completo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.perfil_saude is 'Base clínica única (§64): cadastrado uma vez, usado por todos os módulos.';

create trigger perfil_saude_updated_at before update on public.perfil_saude
  for each row execute function public.set_updated_at();

create table public.antecedentes_familiares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parentesco text not null check (parentesco in ('mae','pai','irma_o','filha_o','avo_a','tia_o','outro')),
  grau text not null check (grau in ('primeiro','segundo','outro')),
  condicao text not null check (condicao in ('mama','ovario','colorretal','prostata','pulmao','colo_utero','dcv_prematura','outro')),
  idade_diagnostico integer check (idade_diagnostico is null or idade_diagnostico between 0 and 120),
  observacao text,
  created_at timestamptz not null default now()
);
create index antecedentes_familiares_user_condicao_idx on public.antecedentes_familiares (user_id, condicao);

-- cria o perfil automaticamente ao cadastrar (nome vem do metadata do signUp)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfil_saude (user_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
