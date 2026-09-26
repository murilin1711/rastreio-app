import { VERSAO_CONSENTIMENTO_SAUDE, VERSAO_TERMOS } from '@core/publicacao';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

type Aceite = { tipo: string; versao: string };

/** Os dois aceites (termos e dados de saúde) precisam estar na versão atual (D-056). */
export function aceitesEmDia(aceites: Aceite[], versaoTermos = VERSAO_TERMOS, versaoSaude = VERSAO_CONSENTIMENTO_SAUDE): boolean {
  const tem = (tipo: string, versao: string) => aceites.some((a) => a.tipo === tipo && a.versao === versao);
  return tem('termos', versaoTermos) && tem('dados_saude', versaoSaude);
}

export async function consentimentoEmDia(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from('consentimentos').select('tipo, versao').eq('user_id', userId);
  if (error) throw traduzirErro(error);
  return aceitesEmDia(data ?? []);
}

/** Tela de aceite de quem já tinha conta, ou depois de uma versão nova dos termos. */
export async function registrarConsentimento(userId: string): Promise<void> {
  const { error } = await supabase.from('consentimentos').upsert(
    [
      { user_id: userId, tipo: 'termos', versao: VERSAO_TERMOS },
      { user_id: userId, tipo: 'dados_saude', versao: VERSAO_CONSENTIMENTO_SAUDE },
    ],
    { onConflict: 'user_id,tipo,versao', ignoreDuplicates: true },
  );
  if (error) throw traduzirErro(error);
}

/** Vai no metadata do signUp; o gatilho `handle_new_user` grava os aceites (a conta ainda não tem sessão). */
export const metadataDoAceite = () => ({ termos_versao: VERSAO_TERMOS, dados_saude_versao: VERSAO_CONSENTIMENTO_SAUDE });
