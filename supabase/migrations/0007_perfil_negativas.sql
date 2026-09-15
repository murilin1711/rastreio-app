-- Declarações negativas são dado clínico: "não uso medicamentos" e "não há casos na família".
alter table public.perfil_saude
  add column sem_medicacoes boolean not null default false,
  add column sem_antecedentes_familiares boolean not null default false;
