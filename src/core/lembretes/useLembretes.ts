import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import { listarPassados, listarProximos, type LembreteCentral } from './central';

export function useLembretes(dias = 30) {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [proximos, setProximos] = useState<LembreteCentral[]>([]);
  const [passados, setPassados] = useState<LembreteCentral[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [p, h] = await Promise.all([listarProximos(userId, dias), listarPassados(userId, dias)]);
      setProximos(p); setPassados(h);
    } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId, dias]);
  useEffect(() => { recarregar(); }, [recarregar]);

  return { proximos, passados, carregando, erro, recarregar };
}
