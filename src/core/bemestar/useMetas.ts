import { useCallback, useEffect, useState } from 'react';
import type { Meta } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import * as repo from './metas';

export function useMetas() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [metas, setMetas] = useState<Meta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try { setMetas(await repo.listarMetas(userId)); } catch { setMetas([]); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);
  const definir = async (m: Parameters<typeof repo.definirMeta>[1]) => { if (!userId) throw new Error('Sessão indisponível'); await repo.definirMeta(userId, m); await recarregar(); };
  const desativar = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.desativarMeta(userId, id); await recarregar(); };
  const marcar = async (id: string, marco: number) => { if (!userId) return; await repo.registrarMarco(userId, id, marco); await recarregar(); };
  const porTipo = useCallback((tipo: Meta['tipo']) => metas.find((m) => m.tipo === tipo) ?? null, [metas]);
  return { metas, porTipo, carregando, definir, desativar, marcar, recarregar };
}
