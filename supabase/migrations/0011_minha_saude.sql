-- NERO · Fase 3 · Minha Saúde transversal e relatórios (D-007 a D-010).

-- Documentos anexados (D-008): laudos, receitas, imagens; com ou sem exame vinculado. Arquivos no bucket privado 'laudos'.
create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exame_id uuid references public.exames(id) on delete set null,
  tipo text not null check (tipo in ('laudo','receita','atestado','imagem','outro')),
  nome text not null,
  caminho text not null,
  mime text not null,
  tamanho integer not null check (tamanho > 0),
  data_documento date,
  observacao text,
  created_at timestamptz not null default now()
);
create index documentos_user_idx on public.documentos (user_id, created_at desc);
create index documentos_exame_idx on public.documentos (exame_id);

-- Compartilhamento de relatórios por QR (D-007): PDF no bucket privado 'relatorios', URL assinada de 7 dias, revogável.
insert into storage.buckets (id, name, public) values ('relatorios', 'relatorios', false) on conflict (id) do nothing;
create policy relatorios_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy relatorios_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'relatorios' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy relatorios_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy relatorios_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'relatorios' and (storage.foldername(name))[1] = (select auth.uid())::text);

create table public.compartilhamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo_relatorio text not null check (tipo_relatorio in ('cardiovascular','oncologico','geral','consulta')),
  especialidade text,
  caminho text not null,
  expira_em timestamptz not null,
  revogado_em timestamptz,
  created_at timestamptz not null default now()
);
create index compartilhamentos_user_ativos_idx on public.compartilhamentos (user_id, expira_em desc) where revogado_em is null;

-- Consultas agendadas (D-010): lembrete D-1 e no dia, com atalho para "Preparar minha consulta".
create table public.consultas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  especialidade text not null check (especialidade in ('cardiologia','endocrinologia','clinica_medica','ginecologia','mastologia','urologia','gastro_coloprocto','pneumologia','oncologia','outra')),
  data_hora timestamptz not null,
  local text,
  profissional text,
  observacao text,
  created_at timestamptz not null default now()
);
create index consultas_user_data_idx on public.consultas (user_id, data_hora);

-- RLS dono (padrão da 0005)
do $$
declare t text;
begin
  foreach t in array array['documentos','compartilhamentos','consultas']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t || '_owner', t);
  end loop;
end $$;

-- Preferências de notificação (D-010): desligar um tipo cancela só as notificações do celular; itens do app permanecem.
alter table public.perfil_saude
  add column preferencias_lembretes jsonb not null default '{"exame":true,"mrpa":true,"glicemia":true,"medicacao":true,"consulta":true,"atualizacao":true}';

alter table public.lembretes drop constraint if exists lembretes_origem_tipo_check;
alter table public.lembretes add constraint lembretes_origem_tipo_check
  check (origem_tipo in ('exame','medida','medicacao','perfil','sistema','consulta'));
