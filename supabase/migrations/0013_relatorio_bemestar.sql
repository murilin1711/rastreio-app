-- NERO · Fase 4b · relatório de Saúde & Hábitos (§88) pode ser compartilhado por QR
alter table public.compartilhamentos drop constraint if exists compartilhamentos_tipo_relatorio_check;
alter table public.compartilhamentos add constraint compartilhamentos_tipo_relatorio_check
  check (tipo_relatorio in ('cardiovascular','oncologico','geral','consulta','bemestar'));
