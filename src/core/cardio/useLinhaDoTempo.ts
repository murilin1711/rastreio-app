import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { montarLinhaDoTempo, type AnoLinhaDoTempo } from './linhaDoTempo';

export function useLinhaDoTempo() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [anos, setAnos] = useState<AnoLinhaDoTempo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try { setAnos(await montarLinhaDoTempo(userId)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);
  return { anos, carregando, recarregar };
}
