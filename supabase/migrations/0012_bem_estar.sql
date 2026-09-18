-- NERO · Fase 4 · Saúde & Bem-estar (§69–§88) · decisões C-015–C-020 e D-011
-- Medidas corporais e sono continuam em `medidas` (tipos peso, cintura, quadril, composicao, sono).
-- Tabelas próprias para refeições, atividades, check-ins, metas e vínculos de glicemia.

-- (a) programa 'bem_estar' em regras_clinicas
alter table public.regras_clinicas drop constraint if exists regras_clinicas_programa_check;
alter table public.regras_clinicas add constraint regras_clinicas_programa_check
  check (programa in ('mama','colo_utero','colorretal','pulmao','prostata','pressao','glicemia','risco_cv','bem_estar'));

-- (b) perfil: peso máximo atingido na vida (ABESO 2026 R8) e objetivo de peso (§82 — nunca imposto pelo app)
alter table public.perfil_saude
  add column peso_maximo_vida_kg numeric(5,1) check (peso_maximo_vida_kg is null or peso_maximo_vida_kg between 20 and 400),
  add column objetivo_peso text check (objetivo_peso in ('reducao','manutencao','aumento','sem_meta'));

-- (c) tabelas novas
create table public.refeicoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  em timestamptz not null,
  tipo text not null check (tipo in ('cafe','lanche','almoco','lanche_tarde','jantar','ceia','outra')),
  descricao text not null,
  quantidade text check (quantidade in ('pequena','habitual','grande')),
  fome_antes smallint check (fome_antes between 0 and 10),
  saciedade text check (saciedade in ('com_fome','satisfeito','muito_cheio')),
  local text check (local in ('casa','trabalho','restaurante','outro')),
  observacao text,
  documento_id uuid references public.documentos(id) on delete set null,
  created_at timestamptz not null default now()
);
create index refeicoes_user_em_idx on public.refeicoes (user_id, em desc);

create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio timestamptz not null,
  tipo text not null check (tipo in ('caminhada','corrida','ciclismo','musculacao','natacao','esporte_coletivo','danca','funcional','pilates','yoga','outra')),
  duracao_min integer not null check (duracao_min between 1 and 720),
  intensidade text not null check (intensidade in ('leve','moderada','vigorosa')),
  distancia_km numeric(6,2),
  fc_media integer check (fc_media is null or fc_media between 30 and 250),
  calorias integer,
  observacao text,
  created_at timestamptz not null default now()
);
create index atividades_user_inicio_idx on public.atividades (user_id, inicio desc);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semana date not null,
  disposicao smallint check (disposicao between 0 and 10),
  alimentacao smallint check (alimentacao between 0 and 10),
  atividade smallint check (atividade between 0 and 10),
  sono smallint check (sono between 0 and 10),
  estresse smallint check (estresse between 0 and 10),
  energia smallint check (energia between 0 and 10),
  bem_estar smallint check (bem_estar between 0 and 10),
  observacao text,
  created_at timestamptz not null default now(),
  unique (user_id, semana)
);
comment on column public.checkins.semana is 'Segunda-feira da semana do check-in (§86).';

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('peso','cintura','atividade_min','atividade_dias','fortalecimento_dias','sono_min','pressao')),
  valor numeric not null,
  origem text not null check (origem in ('app','usuario','profissional')),
  detalhe text,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
create index metas_user_ativas_idx on public.metas (user_id) where ativa;
create unique index metas_ativa_unica_idx on public.metas (user_id, tipo) where ativa;

create table public.vinculos_glicemia (
  glicemia_id uuid primary key references public.medidas(id) on delete cascade,
  refeicao_id uuid references public.refeicoes(id) on delete cascade,
  atividade_id uuid references public.atividades(id) on delete cascade,
  created_at timestamptz not null default now(),
  check (refeicao_id is not null or atividade_id is not null)
);

-- RLS dono (padrão da 0005)
do $$
declare t text;
begin
  foreach t in array array['refeicoes','atividades','checkins','metas']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_owner', t);
  end loop;
end $$;

alter table public.vinculos_glicemia enable row level security;
create policy vinculos_glicemia_owner on public.vinculos_glicemia for all to authenticated
  using (exists (select 1 from public.medidas m where m.id = glicemia_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from public.medidas m where m.id = glicemia_id and m.user_id = (select auth.uid())));

-- (e) formatos dos valores de medidas usados pela Fase 4
comment on column public.medidas.valores is
  '{"pas":128,"pad":78,"fc":68} · {"mgdl":103} · {"kg":67.2,"metodo":"balanca"} · {"cm":78} (cintura/quadril) · composicao: {"gordura_pct":27,"massa_gordura_kg":18.2,"massa_magra_kg":49.1,"massa_muscular_kg":24,"agua_pct":55,"gordura_visceral":8,"tmb_kcal":1450,"metodo":"bioimpedancia"} · sono: {"dormiu_em":"…","acordou_em":"…","minutos":400,"qualidade":4}';
