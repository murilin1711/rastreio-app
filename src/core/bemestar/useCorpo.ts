import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import type { ObjetivoPeso } from '@core/perfil/tipos';
import { extrairParametrosBemEstar } from '@core/regras/bemestar/parametros';
import type { MedidaCorporal, ParametrosBemEstar } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import * as repo from './medidasCorporais';
import { carregarRegrasBemEstar } from './regras';

export interface LoteMedidas { medidoEm: string; pesoKg?: number; cinturaCm?: number; quadrilCm?: number; alturaCm?: number; metodo?: string }

/** Meu Corpo (§70–§73): medidas corporais + parâmetros das regras + PMAV/objetivo do perfil. */
export function useCorpo() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil, salvar: salvarPerfil, recarregar: recarregarPerfil } = usePerfil();
  const [medidas, setMedidas] = useState<MedidaCorporal[]>([]);
  const [parametros, setParametros] = useState<ParametrosBemEstar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [ms, regras] = await Promise.all([repo.listarCorporais(userId), carregarRegrasBemEstar()]);
      setMedidas(ms);
      setParametros(extrairParametrosBemEstar(regras));
    } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const ultimos = useMemo(() => {
    const out = { peso: null, cintura: null, quadril: null, composicao: null } as Record<MedidaCorporal['tipo'], MedidaCorporal | null>;
    for (const m of medidas) if (!out[m.tipo]) out[m.tipo] = m;
    return out;
  }, [medidas]);

  /** Grava uma linha por indicador informado, todas com o mesmo `medidoEm`; altura diferente atualiza o perfil. */
  const registrar = async (l: LoteMedidas) => {
    if (!userId) throw new Error('Sessão indisponível');
    if (l.pesoKg != null) await repo.inserirCorporal(userId, { tipo: 'peso', medidoEm: l.medidoEm, valores: { kg: l.pesoKg, ...(l.metodo ? { metodo: l.metodo } : {}) } });
    if (l.cinturaCm != null) await repo.inserirCorporal(userId, { tipo: 'cintura', medidoEm: l.medidoEm, valores: { cm: l.cinturaCm } });
    if (l.quadrilCm != null) await repo.inserirCorporal(userId, { tipo: 'quadril', medidoEm: l.medidoEm, valores: { cm: l.quadrilCm } });
    if (l.alturaCm != null && l.alturaCm !== perfil?.alturaCm) await salvarPerfil({ alturaCm: l.alturaCm });
    await recarregar();
  };

  const salvarComposicao = async (medidoEm: string, valores: MedidaCorporal['valores']) => {
    if (!userId) throw new Error('Sessão indisponível');
    await repo.inserirCorporal(userId, { tipo: 'composicao', medidoEm, valores });
    if (valores.kg != null) await repo.inserirCorporal(userId, { tipo: 'peso', medidoEm, valores: { kg: valores.kg, metodo: valores.metodo } });
    await recarregar();
  };

  const excluir = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.excluirCorporal(userId, id); await recarregar(); };
  const salvarPMAV = async (kg: number | null) => { await salvarPerfil({ pesoMaximoVidaKg: kg }); await recarregarPerfil(); };
  const salvarObjetivo = async (objetivo: ObjetivoPeso) => { await salvarPerfil({ objetivoPeso: objetivo }); await recarregarPerfil(); };

  return { medidas, ultimos, parametros, perfil, carregando, erro, registrar, salvarComposicao, excluir, salvarPMAV, salvarObjetivo, recarregar };
}
