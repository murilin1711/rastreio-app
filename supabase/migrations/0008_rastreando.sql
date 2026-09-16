-- NERO · Fase 1 · campos exigidos pelas diretrizes, sintomas de alarme e fechamento de pendências
alter table public.perfil_saude
  add column ja_teve_atividade_sexual boolean,                 -- INCA 2025 Rec. 36
  add column raca_cor text check (raca_cor in ('branca','preta','parda','amarela','indigena','nao_informar')), -- SBU: 45 anos
  add column menopausa boolean;                                 -- INCA 2025 Rec. 32–33 (informativo)

create table public.sintomas_alarme (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  programa text not null check (programa in ('mama','colo_utero','colorretal','pulmao','prostata')),
  sintoma text not null,
  observacao text,
  registrado_em timestamptz not null default now(),
  resolvido_em timestamptz
);
comment on table public.sintomas_alarme is 'Sinais de alerta informados pelo paciente (§52). Enquanto abertos, sobrepõem o calendário de rastreamento (§66).';
create index sintomas_alarme_user_abertos_idx on public.sintomas_alarme (user_id, programa) where resolvido_em is null;
alter table public.sintomas_alarme enable row level security;
create policy sintomas_alarme_owner on public.sintomas_alarme for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- §51: ao registrar o exame que investiga uma pendência, a pendência fecha
create or replace function public.exames_fecha_pendencia()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.resolve_exame_id is not null then
    update public.pendencias
       set status = 'resolvida', exame_resolucao_id = new.id, resolvida_em = now()
     where exame_origem_id = new.resolve_exame_id
       and user_id = new.user_id
       and status = 'aberta';
  end if;
  return new;
end $$;
create trigger exames_fecha_pendencia after insert on public.exames
  for each row execute function public.exames_fecha_pendencia();
