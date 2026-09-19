import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { type ChaveConquista, CHAVES_CONQUISTA, conquistasNovas } from '@core/regras/bemestar/conquistas';
import { useSessao } from '@core/sessao/SessaoProvider';
import { contarParaConquistas, gravarConquistas, listarConquistas } from './conquistas';

/**
 * Conquistas pontuais (D-016, parte B). Avalia na abertura do módulo e devolve, uma de cada vez,
 * a próxima conquista nova a comemorar. Quem já tem todas não dispara nenhuma consulta de contagem.
 */
export function useConquistas() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil } = usePerfil();
  const [fila, setFila] = useState<ChaveConquista[]>([]);
  const avaliando = useRef(false);

  const avaliar = useCallback(async () => {
    if (!userId || avaliando.current) return;
    avaliando.current = true;
    try {
      const obtidas = await listarConquistas(userId);
      if (obtidas.length >= CHAVES_CONQUISTA.length) return;
      const estado = await contarParaConquistas(userId, perfil?.perfilInicialCompleto ?? false);
      const novas = conquistasNovas(estado, obtidas);
      if (novas.length === 0) return;
      await gravarConquistas(userId, novas);
      setFila((f) => [...f, ...novas.filter((c) => !f.includes(c))]);
    } catch {
      // conquista é enfeite: falha aqui não pode atrapalhar o módulo
    } finally {
      avaliando.current = false;
    }
  }, [userId, perfil?.perfilInicialCompleto]);

  useEffect(() => { avaliar(); }, [avaliar]);

  return { proxima: fila[0] ?? null, dispensar: () => setFila((f) => f.slice(1)), avaliar };
}
