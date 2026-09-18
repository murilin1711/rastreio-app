import { diaDaSessao, dataDoDia } from '@core/regras/cardio/mrpa';
import { extrairParametros } from '@core/regras/cardio/parametros';
import { avaliarMedidaCasual } from '@core/regras/cardio/pressao';
import type { ResumoCardio } from '@modules/home/montarItensHoje';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import * as medidasRepo from './medidas';
import { carregarRegrasCardio } from './regras';
import * as sessoesRepo from './sessoesMrpa';

const DIA_MS = 86_400_000;

/** Marca o relatório de uma sessão como lido (some da Home). Evento de sistema em `lembretes`, já lido. */
export async function marcarRelatorioLido(userId: string, sessaoId: string): Promise<void> {
  const { data } = await supabase.from('lembretes').select('id').eq('user_id', userId).eq('titulo', `mrpa_lida:${sessaoId}`).limit(1).maybeSingle();
  if (data) return;
  const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: 'sistema', origem_id: sessaoId, agendado_para: new Date().toISOString(), titulo: `mrpa_lida:${sessaoId}`, mensagem: 'Relatório da MRPA aberto', status: 'lido' });
  if (error) throw traduzirErro(error);
}

/** Dados do módulo cardio para `montarItensHoje` (Fase 2a). */
export async function montarResumoCardio(userId: string, hoje = new Date().toISOString().slice(0, 10)): Promise<ResumoCardio> {
  const [regras, ultimas, ativa, sessoes] = await Promise.all([
    carregarRegrasCardio('pressao'),
    medidasRepo.listarPA(userId, { sessaoId: null, limite: 1 }),
    sessoesRepo.sessaoAtiva(userId),
    sessoesRepo.listarSessoes(userId),
  ]);
  const p = extrairParametros(regras);

  const u = ultimas[0];
  const ultimaPA = u
    ? (() => {
        const av = avaliarMedidaCasual(u, u.contexto.sintomas ?? [], p);
        return { pas: u.pas, pad: u.pad, medidoEm: u.medidoEm, nivel: av.nivel === 'laranja' || av.nivel === 'vermelho' ? av.nivel : null };
      })()
    : null;

  let mrpaAtiva: ResumoCardio['mrpaAtiva'] = null;
  if (ativa) {
    const dia = diaDaSessao(ativa, hoje);
    const doDia = dia >= 1 && dia <= ativa.diasPrevistos ? await medidasRepo.listarPA(userId, { sessaoId: ativa.id, desde: `${dataDoDia(ativa, dia)}T00:00:00` }) : [];
    const conta = (periodo: 'manha' | 'noite') => doDia.filter((m) => m.medidoEm.slice(0, 10) === dataDoDia(ativa, dia) && m.contexto.periodo === periodo).length;
    const faltaHoje = (['manha', 'noite'] as const).filter((per) => conta(per) < 3);
    mrpaAtiva = { id: ativa.id, dia, diasPrevistos: ativa.diasPrevistos, faltaHoje };
  }

  let mrpaAcimaSemLeitura: ResumoCardio['mrpaAcimaSemLeitura'] = null;
  const recente = sessoes.find((s) => s.status === 'concluida' && s.resultado?.valido && s.resultado.acimaReferencia && s.concluidaEm && Date.now() - Date.parse(s.concluidaEm) < 30 * DIA_MS);
  if (recente?.concluidaEm) {
    const { data } = await supabase.from('lembretes').select('id').eq('user_id', userId).eq('titulo', `mrpa_lida:${recente.id}`).limit(1).maybeSingle();
    if (!data) mrpaAcimaSemLeitura = { id: recente.id, concluidaEm: recente.concluidaEm };
  }

  return { ultimaPA, mrpaAtiva, mrpaAcimaSemLeitura };
}
