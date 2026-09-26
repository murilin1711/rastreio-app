-- NERO · D-056: aceite dos termos de uso e consentimento para os dados de saúde (LGPD, art. 11, I).
-- Uma linha por aceite: tipo + versão + quando. Guardar a versão é o que permite provar a que texto a
-- pessoa disse sim, e pedir de novo quando os termos mudarem. Sem política de update/delete: o registro
-- é prova, não preferência. Some junto com a conta (cascata), que é também a forma de revogar (política §5).
create table public.consentimentos (
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('termos', 'dados_saude')),
  versao text not null check (length(versao) between 1 and 32),
  aceito_em timestamptz not null default now(),
  primary key (user_id, tipo, versao)
);

alter table public.consentimentos enable row level security;
create policy consentimentos_ler on public.consentimentos for select to authenticated
  using ((select auth.uid()) = user_id);
create policy consentimentos_registrar on public.consentimentos for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- No cadastro ainda não há sessão (a confirmação de e-mail vem depois), então o aceite viaja no
-- metadata do signUp e o gatilho que cria o perfil o registra. Corpo anterior (0001) mantido.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfil_saude (user_id, nome)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', ''));

  if coalesce(new.raw_user_meta_data->>'termos_versao', '') <> '' then
    insert into public.consentimentos (user_id, tipo, versao)
    values (new.id, 'termos', left(new.raw_user_meta_data->>'termos_versao', 32))
    on conflict do nothing;
  end if;
  if coalesce(new.raw_user_meta_data->>'dados_saude_versao', '') <> '' then
    insert into public.consentimentos (user_id, tipo, versao)
    values (new.id, 'dados_saude', left(new.raw_user_meta_data->>'dados_saude_versao', 32))
    on conflict do nothing;
  end if;
  return new;
end $$;
