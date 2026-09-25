import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ResumoCardio } from '@modules/home/montarItensHoje';
import { montarResumoCardio } from './resumoHome';

export function useResumoCardio() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [resumo, setResumo] = useState<ResumoCardio | undefined>(undefined);
  // `carregando` fecha mesmo quando a busca falha: a Home espera por ele para decidir se já pode
  // dizer "nada pendente" (D-027), e um erro aqui não pode deixá-la esperando para sempre.
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    try {
      setResumo(await montarResumoCardio(userId));
    } catch {
      // a Home segue funcionando sem o resumo do módulo
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { resumo, carregando, recarregar };
}
