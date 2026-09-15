-- NERO · Fase 0 · RLS em toda tabela do paciente; regras clínicas só leitura
do $$
declare t text;
begin
  foreach t in array array['perfil_saude','antecedentes_familiares','exames','pendencias','mrpa_sessoes','medidas','medicacoes','lembretes']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)',
      t || '_owner', t
    );
  end loop;
end $$;

alter table public.regras_clinicas enable row level security;
create policy regras_clinicas_leitura on public.regras_clinicas
  for select to authenticated using (ativa);
-- escrita em regras_clinicas: apenas service_role (painel/CLI); sem policy de insert/update para authenticated
