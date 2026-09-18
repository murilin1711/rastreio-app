import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ResumoCardio } from '@modules/home/montarItensHoje';
import { montarResumoCardio } from './resumoHome';

export function useResumoCardio() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [resumo, setResumo] = useState<ResumoCardio | undefined>(undefined);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    try {
      setResumo(await montarResumoCardio(userId));
    } catch {
      // a Home segue funcionando sem o resumo do módulo
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { resumo, recarregar };
}
