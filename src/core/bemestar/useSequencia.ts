import { useCallback, useEffect, useRef, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { marcoSequencia, type MarcoSequencia, resumoSequencia } from '@core/regras/bemestar/sequencia';
import { useSessao } from '@core/sessao/SessaoProvider';
import { listarDiasAtivos, registrarMarcoSequencia } from './sequencia';
import { hojeLocalISO } from './useAtividades';

/**
 * Sequência de dias com registro (D-016, parte C). Devolve o número para o selo da Home e,
 * quando a pessoa cruza um marco, a comemoração — uma vez só.
 *
 * O marco já comemorado fica também num ref: depois de gravar não dá para esperar o perfil
 * recarregar para saber disso, e depender da identidade do `recarregar` do perfil põe o efeito
 * em laço (foi o que o teste de regressão pegou).
 */
export function useSequencia() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil } = usePerfil();
  const doPerfil = perfil?.marcoSequenciaComemorado ?? 0;
  const [resumo, setResumo] = useState<{ sequencia: number; total: number }>({ sequencia: 0, total: 0 });
  const [marco, setMarco] = useState<MarcoSequencia | null>(null);
  const comemorado = useRef(0);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    try {
      const dias = await listarDiasAtivos(userId);
      const r = resumoSequencia(dias, hojeLocalISO());
      setResumo(r);
      const base = Math.max(doPerfil, comemorado.current);
      const novo = marcoSequencia(r.sequencia, base);
      if (novo != null) {
        comemorado.current = novo;
        await registrarMarcoSequencia(userId, novo);
        setMarco(novo);
      }
    } catch {
      // a sequência é enfeite: falha aqui não pode atrapalhar a Home
    }
  }, [userId, doPerfil]);

  useEffect(() => { recarregar(); }, [recarregar]);

  return { ...resumo, marco, dispensarMarco: () => setMarco(null), recarregar };
}
