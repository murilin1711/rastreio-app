import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { estaSilenciado, origemDe, textoLimpo, type OrigemLembrete } from './origem';

export interface LembreteCentral extends OrigemLembrete { id: string; quando: string; texto: string; status: string; silenciado: boolean }

type Linha = { id: string; origem_tipo: string; origem_id: string | null; agendado_para: string; titulo: string; mensagem: string | null; status: string };
const paraCentral = (l: Linha): LembreteCentral => ({ id: l.id, quando: l.agendado_para, texto: textoLimpo(l.mensagem), status: l.status, silenciado: estaSilenciado(l.mensagem), ...origemDe({ origemTipo: l.origem_tipo, titulo: l.titulo, origemId: l.origem_id }) });

const CAMPOS = 'id, origem_tipo, origem_id, agendado_para, titulo, mensagem, status';

/** Próximos `dias` dias, de todos os módulos (D-010). */
export async function listarProximos(userId: string, dias = 30): Promise<LembreteCentral[]> {
  const agora = new Date();
  const ate = new Date(agora.getTime() + dias * 86_400_000);
  const { data, error } = await supabase.from('lembretes').select(CAMPOS).eq('user_id', userId).in('status', ['pendente', 'enviado']).gte('agendado_para', agora.toISOString()).lte('agendado_para', ate.toISOString()).order('agendado_para');
  if (error) throw traduzirErro(error);
  return data.map(paraCentral);
}

/** Últimos `dias` dias (o que já passou, exceto cancelados). */
export async function listarPassados(userId: string, dias = 30): Promise<LembreteCentral[]> {
  const agora = new Date();
  const desde = new Date(agora.getTime() - dias * 86_400_000);
  const { data, error } = await supabase.from('lembretes').select(CAMPOS).eq('user_id', userId).neq('status', 'cancelado').gte('agendado_para', desde.toISOString()).lt('agendado_para', agora.toISOString()).order('agendado_para', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map(paraCentral);
}
