import { useCallback, useEffect, useState } from 'react';
import { avaliarElegibilidade } from '@core/regras/elegibilidade';
import { handlers } from '@core/regras/programas';
import type { PerfilRegras, Programa, ResultadoElegibilidade } from '@core/regras/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { montarContexto, type ExameRegistrado, type PendenciaAberta, type SintomaAberto } from './contexto';
import { carregarRegras } from './regras';
import { PROGRAMAS } from './tipos';

export type Avaliacoes = Record<Programa, ResultadoElegibilidade>;

/** Estado do módulo Rastreando: avaliação de cada programa + exames, pendências e sintomas do usuário. */
export function useRastreando() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [avaliacoes, setAvaliacoes] = useState<Avaliacoes | null>(null);
  const [perfil, setPerfil] = useState<PerfilRegras | null>(null);
  const [exames, setExames] = useState<ExameRegistrado[]>([]);
  const [pendencias, setPendencias] = useState<PendenciaAberta[]>([]);
  const [sintomas, setSintomas] = useState<SintomaAberto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const ctx = await montarContexto(userId);
      const pares = await Promise.all(
        PROGRAMAS.map(async (p) => [p, avaliarElegibilidade(ctx.perfil, p, await carregarRegras(p), ctx.contextoPor(p), new Date(), handlers)] as const),
      );
      setAvaliacoes(Object.fromEntries(pares) as Avaliacoes);
      setPerfil(ctx.perfil);
      setExames(ctx.exames);
      setPendencias(ctx.pendencias);
      setSintomas(ctx.sintomas);
    } catch (e) {
      setErro(e as ErroNero);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { avaliacoes, perfil, exames, pendencias, sintomas, carregando, erro, recarregar };
}
