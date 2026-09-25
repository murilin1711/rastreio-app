import { useCallback, useEffect, useRef, useState } from 'react';
import { type ChaveConquista, CHAVES_CONQUISTA, conquistasNovas } from '@core/regras/bemestar/conquistas';
import { useSessao } from '@core/sessao/SessaoProvider';
import { contarParaConquistas, gravarConquistas, listarConquistas } from './conquistas';

interface Opcoes {
  /** `false` nas telas de registro: lá a avaliação acontece depois de salvar, não ao abrir o formulário. */
  auto?: boolean;
  /** Quais conquistas esta tela pode comemorar. Cada uma sai onde acontece: na tela errada, parece sem motivo. */
  chaves?: ChaveConquista[];
}

/**
 * Conquistas pontuais (D-016, parte B). Devolve, uma de cada vez, a próxima conquista a comemorar.
 * Quem já tem todas não dispara nenhuma consulta de contagem.
 */
export function useConquistas({ auto = true, chaves = CHAVES_CONQUISTA }: Opcoes = {}) {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [fila, setFila] = useState<ChaveConquista[]>([]);
  const avaliando = useRef(false);

  /** Avalia e enfileira o que for novo; devolve quantas conquistas entraram na fila. */
  const avaliar = useCallback(async (): Promise<number> => {
    if (!userId || avaliando.current) return 0;
    avaliando.current = true;
    try {
      const obtidas = await listarConquistas(userId);
      if (chaves.every((c) => obtidas.includes(c))) return 0;
      const estado = await contarParaConquistas(userId);
      const novas = conquistasNovas(estado, obtidas).filter((c) => chaves.includes(c));
      if (novas.length === 0) return 0;
      await gravarConquistas(userId, novas);
      setFila((f) => [...f, ...novas.filter((c) => !f.includes(c))]);
      return novas.length;
    } catch {
      return 0; // conquista é enfeite: falha aqui não pode atrapalhar o registro
    } finally {
      avaliando.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, chaves.join()]);

  useEffect(() => { if (auto) avaliar(); }, [auto, avaliar]);

  /** Fecha a comemoração da vez. Devolve `true` se ainda resta alguma na fila. */
  const dispensar = useCallback(() => {
    let resta = false;
    setFila((f) => { resta = f.length > 1; return f.slice(1); });
    return resta;
  }, []);

  return { proxima: fila[0] ?? null, dispensar, avaliar };
}
