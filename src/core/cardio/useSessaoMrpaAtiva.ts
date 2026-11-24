import { useEffect, useState } from 'react';
import type { SessaoMrpa } from '@core/regras/cardio/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { sessaoAtiva } from './sessoesMrpa';

/**
 * Só a sessão de MRPA em andamento (ou `null`), sem regras nem medidas — o que a folha Anotar precisa
 * para mostrar "Medida do MRPA de agora". Se a consulta falhar, fica sem sessão: a folha segue útil.
 */
export function useSessaoMrpaAtiva(): { sessao: SessaoMrpa | null; carregando: boolean } {
  const { sessao: auth } = useSessao();
  const userId = auth?.user.id;
  const [sessao, setSessao] = useState<SessaoMrpa | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!userId) { setCarregando(false); return undefined; }
    let ativo = true;
    sessaoAtiva(userId)
      .then((s) => { if (ativo) setSessao(s); })
      .catch(() => { if (ativo) setSessao(null); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [userId]);

  return { sessao, carregando };
}
