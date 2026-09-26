-- NERO · D-061: login com Apple e Google. O gatilho do cadastro lia o nome só de `nome` (cadastro por
-- e-mail). O Google manda `full_name`/`name`; a Apple não manda nome no token (o app grava o nome que a
-- Apple entrega no primeiro login, e o perfil inicial pergunta se ainda faltar). Resto do corpo (0021) mantido.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfil_saude (user_id, nome)
  values (new.id, coalesce(
    nullif(new.raw_user_meta_data->>'nome', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    ''));

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
