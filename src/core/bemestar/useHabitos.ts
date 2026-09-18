import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { perdaNaoIntencional } from '@core/regras/bemestar/corpo';
import { habitos7d, type Habitos7d } from '@core/regras/bemestar/habitos';
import { extrairParametrosBemEstar } from '@core/regras/bemestar/parametros';
import type { Atividade, MedidaCorporal, Meta, ParametrosBemEstar, Sono } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { listarAtividades } from './atividades';
import { listarCorporais } from './medidasCorporais';
import { listarMetas } from './metas';
import { carregarRegrasBemEstar } from './regras';
import { listarSono } from './sono';
import { hojeLocalISO } from './useAtividades';

/** "Meus hábitos" (§85) e resumo para a Home: uma carga só de tudo que o módulo tem nos últimos meses. */
export function useHabitos() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil } = usePerfil();
  const [dados, setDados] = useState<{ atividades: Atividade[]; sonos: Sono[]; corporais: MedidaCorporal[]; metas: Meta[]; p: ParametrosBemEstar } | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
      const [atividades, sonos, corporais, metas, regras] = await Promise.all([listarAtividades(userId, { desde }), listarSono(userId, { desde }), listarCorporais(userId), listarMetas(userId), carregarRegrasBemEstar()]);
      setDados({ atividades, sonos, corporais, metas, p: extrairParametrosBemEstar(regras) });
    } catch { setDados(null); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const habitos: Habitos7d | null = useMemo(() => {
    if (!dados) return null;
    return habitos7d({ hoje: hojeLocalISO(), p: dados.p, meta: dados.metas.find((m) => m.tipo === 'atividade_min') ?? null, atividades: dados.atividades, sonos: dados.sonos, pesos: dados.corporais.filter((m) => m.tipo === 'peso'), cinturas: dados.corporais.filter((m) => m.tipo === 'cintura') });
  }, [dados]);

  const perda = useMemo(() => {
    if (!dados) return null;
    const pesos = dados.corporais.filter((m) => m.tipo === 'peso' && m.valores.kg != null).map((m) => ({ medidoEm: m.medidoEm, kg: m.valores.kg! }));
    const r = perdaNaoIntencional(pesos, perfil?.objetivoPeso ?? null, hojeLocalISO(), dados.p);
    return r ? { pct: r.pct, desde: r.desde } : null;
  }, [dados, perfil?.objetivoPeso]);

  return { habitos, perdaNaoIntencional: perda, parametros: dados?.p ?? null, carregando, recarregar };
}
