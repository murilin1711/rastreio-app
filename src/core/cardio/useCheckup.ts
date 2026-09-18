import { useCallback, useEffect, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { avaliarCheckup } from '@core/regras/cardio/checkup';
import { extrairParametrosRisco } from '@core/regras/cardio/parametrosRisco';
import type { ItemCheckup } from '@core/regras/cardio/tiposRisco';
import { useSessao } from '@core/sessao/SessaoProvider';
import { montarFontesCheckup } from './resumoHome';
import { carregarRegrasCardio } from './regras';
import { hojeISO } from './usePressao';

export function useCheckup() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil } = usePerfil();
  const [resultado, setResultado] = useState<{ itens: ItemCheckup[]; total: number; atualizados: number } | null>(null);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId || !perfil) return;
    setCarregando(true);
    try {
      const [regras, fontes] = await Promise.all([carregarRegrasCardio('risco_cv'), montarFontesCheckup(userId, perfil)]);
      setResultado(avaliarCheckup(fontes, { temDiabetes: perfil.temDiabetes }, hojeISO(), extrairParametrosRisco(regras)));
    } finally {
      setCarregando(false);
    }
  }, [userId, perfil]);
  useEffect(() => { recarregar(); }, [recarregar]);

  return { resultado, carregando, recarregar };
}
