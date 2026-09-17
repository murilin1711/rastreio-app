-- NERO · Fase 2 · Coração & Metabolismo (C-010–C-014). Uma migração para os planos 2a e 2b.

-- MRPA: protocolo da Diretriz de Medidas da PA 2023, Parte 4 §3 — 4 a 6 dias, idealmente 6 (C-011)
alter table public.mrpa_sessoes drop constraint if exists mrpa_sessoes_dias_previstos_check;
alter table public.mrpa_sessoes
  alter column dias_previstos set default 6,
  add constraint mrpa_sessoes_dias_previstos_check check (dias_previstos between 4 and 6),
  add column pa_consultorio jsonb,                 -- {"pas":n,"pad":n,"medido_em":"AAAA-MM-DD"} opcional
  add column horarios jsonb not null default '{}', -- {"manha":"HH:MM","noite":"HH:MM"}
  add column resultado jsonb,                      -- gravado ao concluir (RelatorioMrpa)
  add column concluida_em timestamptz;
comment on column public.mrpa_sessoes.resultado is 'RelatorioMrpa: médias total/manhã/noite/por dia, válidas/excluídas, valido, acimaReferencia (≥ 130 e/ou ≥ 80 — DBHA 2025 Quadro 3.4).';

-- Medicações: lembrete por horário (§21)
alter table public.medicacoes add column lembrar boolean not null default false;

-- Perfil: campos da Fase 2 (glicemia C-012, PREVENT C-013)
alter table public.perfil_saude
  add column tipo_diabetes text check (tipo_diabetes in ('dm1','dm2','gestacional','outro')),
  add column usa_insulina text check (usa_insulina in ('nao','basal','intensiva')),
  add column evento_cv_previo boolean,
  add column perfil_meta_glicemica text not null default 'adulto' check (perfil_meta_glicemica in ('adulto','idoso_comprometido','idoso_muito_comprometido')),
  add column metas_glicemia jsonb,
  add column plano_glicemia jsonb,
  add column agravantes_cv jsonb not null default '{"itens":[]}',
  add column atividade_fisica_regular boolean;

-- Risco cardiovascular (PREVENT) — Diretriz de Dislipidemias 2025 (C-013)
create table public.riscos_cv (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  calculado_em timestamptz not null default now(),
  modelo text not null check (modelo in ('prevent_base','prevent_hba1c','prevent_rac','prevent_hba1c_rac')),
  entradas jsonb not null,
  ascvd_10 numeric(5,2) not null,
  ascvd_30 numeric(5,2),
  categoria text not null check (categoria in ('baixo','intermediario','alto')),
  agravantes_presentes text[] not null default '{}',
  versao_coeficientes text not null,
  created_at timestamptz not null default now()
);
create index riscos_cv_user_data_idx on public.riscos_cv (user_id, calculado_em desc);
alter table public.riscos_cv enable row level security;
create policy riscos_cv_owner on public.riscos_cv for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Regras clínicas do módulo cardio
alter table public.regras_clinicas drop constraint if exists regras_clinicas_programa_check;
alter table public.regras_clinicas add constraint regras_clinicas_programa_check
  check (programa in ('mama','colo_utero','colorretal','pulmao','prostata','pressao','glicemia','risco_cv'));
