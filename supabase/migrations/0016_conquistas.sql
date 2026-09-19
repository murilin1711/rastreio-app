-- NERO · Bem-estar · D-016 (parte B): conquistas pontuais de comportamento.
-- Uma linha por conquista alcançada; a ausência de linha significa "ainda não". A chave primária
-- composta impede duplicata, então a conquista nunca é comemorada duas vezes. Não há coluna de
-- "vista" nem de remoção: conquistou, está conquistado.
-- As chaves são só de comportamento (cadastro e Bem-estar). Rastreamento, exames e MRPA ficam de
-- fora de propósito: "em dia" não quer dizer resultado normal.
create table public.conquistas (
  user_id uuid not null references auth.users(id) on delete cascade,
  chave text not null check (chave in ('perfil_completo','primeira_atividade','primeira_noite_sono','primeiro_checkin')),
  conquistada_em timestamptz not null default now(),
  primary key (user_id, chave)
);

-- RLS dono (padrão da 0005)
alter table public.conquistas enable row level security;
create policy conquistas_owner on public.conquistas for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
