import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { deveComemorarMeta, metaSugeridaMl, totalDoDiaMl } from '@core/regras/bemestar/agua';
import { useSessao } from '@core/sessao/SessaoProvider';
import { excluirAgua, listarAgua, marcarMetaComemorada, registrarAgua, type RegistroAgua } from './agua';
import { useCorpo } from './useCorpo';
import { useMetas } from './useMetas';
import { hojeLocalISO } from './useAtividades';

/**
 * Água do dia (C-021). A meta vem da tabela `metas` (tipo `agua_ml`) quando a pessoa ou o médico
 * definiu uma; senão o app sugere 35 ml/kg — e não sugere nada para quem tem restrição hídrica.
 * A comemoração é diária: repete a cada dia em que a meta é batida, uma vez por dia.
 */
export function useAgua() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil, recarregar: recarregarPerfil } = usePerfil();
  const { ultimos } = useCorpo();
  const metas = useMetas();
  const [registros, setRegistros] = useState<RegistroAgua[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [comemorar, setComemorar] = useState(false);
  const comemoradaEm = useRef<string | null>(null);

  const hoje = hojeLocalISO();
  const temRestricao = perfil?.temDoencaRenal === true || perfil?.temInsuficienciaCardiaca === true;
  const metaDefinida = metas.porTipo('agua_ml')?.valor ?? null;
  const metaMl = metaDefinida ?? metaSugeridaMl(ultimos.peso?.valores.kg ?? null, temRestricao);
  const totalHoje = totalDoDiaMl(registros, hoje);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
      setRegistros(await listarAgua(userId, desde));
    } catch { setRegistros([]); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  /** Registra e, se a meta do dia foi batida agora, dispara a comemoração — uma vez por dia. */
  const registrar = useCallback(async (ml: number) => {
    if (!userId) throw new Error('Sessão indisponível');
    await registrarAgua(userId, ml, new Date().toISOString());
    const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const novos = await listarAgua(userId, desde);
    setRegistros(novos);
    const jaComemorada = comemoradaEm.current ?? perfil?.aguaMetaComemoradaEm ?? null;
    if (deveComemorarMeta(totalDoDiaMl(novos, hoje), metaMl, jaComemorada, hoje)) {
      comemoradaEm.current = hoje;
      setComemorar(true);
      await marcarMetaComemorada(userId, hoje).catch(() => {});
      await recarregarPerfil().catch(() => {});
    }
  }, [userId, metaMl, hoje, perfil?.aguaMetaComemoradaEm, recarregarPerfil]);

  const excluir = useCallback(async (id: string) => {
    if (!userId) return;
    await excluirAgua(userId, id);
    await recarregar();
  }, [userId, recarregar]);

  return {
    registros, totalHoje, metaMl, temRestricao, metaDefinida, carregando,
    comemorar, dispensarComemoracao: () => setComemorar(false),
    registrar, excluir, recarregar, definirMeta: metas.definir,
  };
}
