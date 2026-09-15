-- NERO · Fase 0 · medidas (PA, glicemia, peso, cintura, sono…) e sessões de MRPA (§1, §2, §5, §70)
create table public.mrpa_sessoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  inicio date not null,
  fim date,
  dias_previstos integer not null default 7 check (dias_previstos between 3 and 14),
  status text not null default 'em_andamento' check (status in ('em_andamento','concluida','cancelada')),
  created_at timestamptz not null default now()
);
create index mrpa_sessoes_user_idx on public.mrpa_sessoes (user_id);

create table public.medidas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('pa','glicemia','peso','cintura','quadril','composicao','sono','fc')),
  medido_em timestamptz not null,
  valores jsonb not null,
  contexto jsonb not null default '{}',
  sessao_id uuid references public.mrpa_sessoes(id) on delete set null,
  observacao text,
  created_at timestamptz not null default now()
);
comment on column public.medidas.valores is '{"pas":128,"pad":78,"fc":68} · {"mgdl":103} · {"kg":67.2} · {"cm":78}';
comment on column public.medidas.contexto is 'braço, posição, momento da glicemia, medicação antes/depois, sintomas…';
create index medidas_user_tipo_data_idx on public.medidas (user_id, tipo, medido_em desc);
create index medidas_sessao_idx on public.medidas (sessao_id);
