import * as Notifications from 'expo-notifications';
import { obterPerfil } from '@core/perfil/repositorio';
import type { PreferenciasLembretes } from '@core/perfil/tipos';
import type { TipoLembrete } from './origem';

/**
 * PEDE a permissão ao sistema. Só a tela de aviso (`ModalAtivarAvisos`) chama isto, nunca um
 * agendador: no iOS, negar é quase definitivo — o app não pode perguntar de novo e a pessoa teria
 * que ir nos Ajustes. Perguntar no meio de outra ação faz a pessoa negar sem entender, e aí ela
 * perde os lembretes de rastreamento, que são o centro do produto.
 */
export async function pedirPermissaoNotificacoes(): Promise<boolean> {
  try {
    const atual = await Notifications.getPermissionsAsync();
    if (atual.status === 'granted') return true;
    const r = await Notifications.requestPermissionsAsync();
    return r.status === 'granted';
  } catch {
    return false;
  }
}

/** Apenas CONSULTA o status, sem abrir caixa nenhuma. */
export async function permissaoConcedida(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).status === 'granted';
  } catch {
    return false;
  }
}

/** Se ainda dá para perguntar: no iOS, `undetermined` é a única situação em que a caixa aparece. */
export async function podePerguntar(): Promise<boolean> {
  try {
    const p = await Notifications.getPermissionsAsync();
    return p.status !== 'granted' && (p.canAskAgain ?? true);
  } catch {
    return false;
  }
}

export async function lerPreferencias(userId: string): Promise<PreferenciasLembretes> {
  return (await obterPerfil(userId)).preferenciasLembretes;
}

/**
 * Os agendadores chamam isto uma vez por lote (D-010): a notificação do celular só é criada se o
 * sistema já permitir E o tipo estiver ligado nas preferências. A linha em `lembretes` é gravada de
 * qualquer forma, então a lista dentro do app fica completa mesmo com tudo silenciado.
 */
export async function notificacoesPermitidas(userId: string, tipo: TipoLembrete): Promise<boolean> {
  const [permissao, prefs] = await Promise.all([permissaoConcedida(), lerPreferencias(userId)]);
  return permissao && prefs[tipo];
}
