import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { traduzirErro } from '@core/supabase/erros';
import * as repo from './repositorio';
import type { Documento } from './tipos';

export function useDocumentos(filtro: repo.FiltroDocumentos = {}) {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);
  const { tipo, exameId } = filtro;

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      setDocumentos(await repo.listar(userId, { tipo, exameId }));
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }, [userId, tipo, exameId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const excluir = async (id: string) => {
    if (!userId) throw new Error('Sessão indisponível');
    await repo.excluir(userId, id);
    await recarregar();
  };

  return { documentos, carregando, erro, excluir, recarregar };
}
