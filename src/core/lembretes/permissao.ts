import * as Notifications from 'expo-notifications';
import { obterPerfil } from '@core/perfil/repositorio';
import type { PreferenciasLembretes } from '@core/perfil/tipos';
import type { TipoLembrete } from './origem';

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

export async function lerPreferencias(userId: string): Promise<PreferenciasLembretes> {
  return (await obterPerfil(userId)).preferenciasLembretes;
}

/**
 * Os agendadores chamam isto uma vez por lote (D-010): a notificação do celular só é criada se o sistema
 * permitir E o tipo estiver ligado nas preferências. A linha em `lembretes` é gravada de qualquer forma.
 */
export async function notificacoesPermitidas(userId: string, tipo: TipoLembrete): Promise<boolean> {
  const [permissao, prefs] = await Promise.all([pedirPermissaoNotificacoes(), lerPreferencias(userId)]);
  return permissao && prefs[tipo];
}
