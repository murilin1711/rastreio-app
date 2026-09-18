import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { traduzirErro } from '@core/supabase/erros';
import * as repo from './examesCardio';
import type { ExameCardio } from './mapeamento';

export function useExamesCardio(filtro: { categoria?: 'laboratorial' | 'cardiologico'; tipo?: string } = {}) {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [exames, setExames] = useState<ExameCardio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);
  const { categoria, tipo } = filtro;

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      setExames(await repo.listarExamesCardio(userId, { categoria, tipo }));
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }, [userId, categoria, tipo]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const inserir = async (e: Parameters<typeof repo.inserirExame>[1]) => {
    if (!userId) throw new Error('Sessão indisponível');
    const id = await repo.inserirExame(userId, e);
    await recarregar();
    return id;
  };

  return { exames, carregando, erro, inserir, recarregar };
}
