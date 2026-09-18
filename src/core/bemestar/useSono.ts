import { useCallback, useEffect, useMemo, useState } from 'react';
import { extrairParametrosBemEstar } from '@core/regras/bemestar/parametros';
import { resumo7d } from '@core/regras/bemestar/sono';
import type { ParametrosBemEstar, Sono } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import { carregarRegrasBemEstar } from './regras';
import * as repo from './sono';
import { hojeLocalISO } from './useAtividades';

/** Meu Sono (§80): últimos 90 dias + média de 7 dias. */
export function useSono() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [sonos, setSonos] = useState<Sono[]>([]);
  const [parametros, setParametros] = useState<ParametrosBemEstar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [ss, regras] = await Promise.all([repo.listarSono(userId, { desde: new Date(Date.now() - 90 * 86_400_000).toISOString() }), carregarRegrasBemEstar()]);
      setSonos(ss); setParametros(extrairParametrosBemEstar(regras));
    } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const resumo = useMemo(() => (parametros ? resumo7d(sonos, hojeLocalISO(), parametros) : null), [sonos, parametros]);
  const inserir = async (s: Parameters<typeof repo.inserirSono>[1]) => { if (!userId) throw new Error('Sessão indisponível'); await repo.inserirSono(userId, s); await recarregar(); };
  const excluir = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.excluirSono(userId, id); await recarregar(); };

  return { sonos, resumo, parametros, carregando, erro, inserir, excluir, recarregar };
}
