-- chave natural para a semente ser idempotente
create unique index regras_clinicas_chave_idx
  on public.regras_clinicas (modulo, coalesce(programa, ''), coalesce(exame_tipo, ''), condicao)
  where ativa;
