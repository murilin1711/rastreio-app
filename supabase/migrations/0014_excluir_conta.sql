-- NERO · Publicação · D-013: exclusão da própria conta pelo usuário (exigência App Store / Play).
-- Todas as tabelas públicas referenciam auth.users com `on delete cascade`, então apagar o usuário
-- derruba perfil, medidas, exames, documentos, relatórios, compartilhamentos etc. de uma vez.
-- Arquivos dos buckets só podem ser removidos pela Storage API (trigger storage.protect_delete);
-- o app faz isso antes de chamar aqui, e a função recusa enquanto restar algum, para não deixar órfão.

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  restantes integer;
begin
  if uid is null then
    raise exception 'não autenticado' using errcode = '42501';
  end if;

  select count(*) into restantes
    from storage.objects
   where bucket_id in ('laudos', 'relatorios')
     and (storage.foldername(name))[1] = uid::text;
  if restantes > 0 then
    raise exception 'ainda há % arquivo(s) nos buckets; remova pela Storage API antes', restantes
      using errcode = 'P0001';
  end if;

  delete from auth.users where id = uid;
end;
$$;

comment on function public.excluir_minha_conta() is
  'D-013: apaga a conta do usuário autenticado e, por cascata, todos os seus dados. Irreversível. Exige buckets já esvaziados.';

revoke all on function public.excluir_minha_conta() from public;
revoke all on function public.excluir_minha_conta() from anon;
grant execute on function public.excluir_minha_conta() to authenticated;
