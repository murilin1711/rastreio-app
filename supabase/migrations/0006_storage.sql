-- NERO · Fase 0 · bucket privado de laudos; cada usuário só acessa a pasta com o próprio id
insert into storage.buckets (id, name, public) values ('laudos', 'laudos', false)
on conflict (id) do nothing;

create policy laudos_owner_select on storage.objects for select to authenticated
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy laudos_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy laudos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'laudos' and (storage.foldername(name))[1] = (select auth.uid())::text);
