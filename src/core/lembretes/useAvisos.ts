import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { supabase } from '@core/supabase/client';
import { pedirPermissaoNotificacoes, podePerguntar } from './permissao';
import { reagendarTudo } from './preferencias';

/** Marca, neste aparelho, que a pessoa disse "agora não". A permissão é do aparelho, não da conta. */
const CHAVE_ADIADO = 'nero:avisos-adiados-em';
const DIAS_PARA_PERGUNTAR_DE_NOVO = 14;

/**
 * Decide se a tela de aviso deve aparecer. O pedido ao sistema só acontece a partir dela — nunca
 * no meio de um registro de exame ou de medicação.
 */
export function useAvisos() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [precisa, setPrecisa] = useState(false);

  const avaliar = useCallback(async () => {
    if (!userId || !(await podePerguntar())) { setPrecisa(false); return; }
    const adiadoEm = await AsyncStorage.getItem(CHAVE_ADIADO).catch(() => null);
    if (adiadoEm) {
      const dias = (Date.now() - Number(adiadoEm)) / 86_400_000;
      if (dias < DIAS_PARA_PERGUNTAR_DE_NOVO) { setPrecisa(false); return; }
    }
    // Só oferece quando já existe algo a avisar: perguntar na tela vazia do primeiro acesso é
    // exatamente o pedido sem contexto que esta tela veio evitar.
    const { count } = await supabase.from('lembretes').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('status', 'pendente').gte('agendado_para', new Date().toISOString());
    setPrecisa((count ?? 0) > 0);
  }, [userId]);

  useEffect(() => { avaliar(); }, [avaliar]);

  /** Pede ao sistema e, se a pessoa aceitar, recria as notificações dos lembretes que já existiam. */
  const ativar = useCallback(async () => {
    setPrecisa(false);
    const concedida = await pedirPermissaoNotificacoes();
    if (concedida && userId) await reagendarTudo(userId).catch(() => {});
    return concedida;
  }, [userId]);

  const adiar = useCallback(async () => {
    setPrecisa(false);
    await AsyncStorage.setItem(CHAVE_ADIADO, String(Date.now())).catch(() => {});
  }, []);

  return { precisa, ativar, adiar, avaliar };
}
