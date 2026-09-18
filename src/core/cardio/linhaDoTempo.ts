import { media } from '@core/regras/cardio/pressao';
import { rotuloExame } from './tiposExames';
import { listarExamesCardio } from './examesCardio';
import { listarGlicemia } from './glicemia';
import * as medidasRepo from './medidas';
import * as sessoesRepo from './sessoesMrpa';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export interface ItemLinhaDoTempo { data: string; tipo: 'exame' | 'pa' | 'glicemia' | 'risco' | 'mrpa' | 'peso'; titulo: string; valor: string }
export interface AnoLinhaDoTempo { ano: number; itens: ItemLinhaDoTempo[] }

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const fmt = (n: number) => String(n).replace('.', ',');

/** Linha do tempo cardiovascular (§20): PA e glicemia agregadas por mês; exames, riscos, MRPAs e pesos individuais. */
export async function montarLinhaDoTempo(userId: string): Promise<AnoLinhaDoTempo[]> {
  const [exames, pa, gli, sessoes, riscos, pesos] = await Promise.all([
    listarExamesCardio(userId),
    medidasRepo.listarPA(userId, { sessaoId: null }),
    listarGlicemia(userId),
    sessoesRepo.listarSessoes(userId),
    supabase.from('riscos_cv').select('calculado_em, ascvd_10, categoria').eq('user_id', userId).order('calculado_em', { ascending: false }),
    supabase.from('medidas').select('medido_em, valores').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }),
  ]);
  if (riscos.error) throw traduzirErro(riscos.error);
  if (pesos.error) throw traduzirErro(pesos.error);

  const itens: ItemLinhaDoTempo[] = [];
  for (const e of exames) {
    const r = e.resultado;
    const valor = r.valor != null ? `${fmt(r.valor)} ${r.unidade ?? ''}`.trim() : r.agatston != null ? `${r.agatston} Agatston` : r.conclusao ? r.conclusao.slice(0, 60) : '';
    itens.push({ data: e.dataRealizacao, tipo: 'exame', titulo: rotuloExame(e.tipo), valor });
  }
  const porMes = <T extends { medidoEm: string }>(lista: T[]) => {
    const m = new Map<string, T[]>();
    for (const x of lista) { const k = x.medidoEm.slice(0, 7); m.set(k, [...(m.get(k) ?? []), x]); }
    return m;
  };
  for (const [mes, ms] of porMes(pa.filter((m) => !m.contexto.excluida))) {
    const md = media(ms)!;
    itens.push({ data: `${mes}-01`, tipo: 'pa', titulo: `PA média de ${MESES[Number(mes.slice(5, 7)) - 1]}`, valor: `${md.pas}/${md.pad} (${md.n} medidas)` });
  }
  for (const [mes, ms] of porMes(gli)) {
    const md = Math.round(ms.reduce((a, g) => a + g.mgdl, 0) / ms.length);
    itens.push({ data: `${mes}-01`, tipo: 'glicemia', titulo: `Glicemia média de ${MESES[Number(mes.slice(5, 7)) - 1]}`, valor: `${md} mg/dL (${ms.length} medidas)` });
  }
  for (const s of sessoes) if (s.status === 'concluida' && s.resultado?.medias.total) itens.push({ data: s.concluidaEm?.slice(0, 10) ?? s.inicio, tipo: 'mrpa', titulo: 'MRPA concluída', valor: `média ${s.resultado.medias.total.pas}/${s.resultado.medias.total.pad}${s.resultado.valido ? '' : ' (não interpretável)'}` });
  for (const r of riscos.data) itens.push({ data: r.calculado_em.slice(0, 10), tipo: 'risco', titulo: 'Risco cardiovascular (PREVENT)', valor: `${fmt(Number(r.ascvd_10))} % em 10 anos` });
  for (const p of pesos.data) itens.push({ data: p.medido_em.slice(0, 10), tipo: 'peso', titulo: 'Peso', valor: `${fmt((p.valores as { kg: number }).kg)} kg` });

  itens.sort((a, b) => b.data.localeCompare(a.data));
  const anos = new Map<number, ItemLinhaDoTempo[]>();
  for (const i of itens) { const a = Number(i.data.slice(0, 4)); anos.set(a, [...(anos.get(a) ?? []), i]); }
  return [...anos.entries()].sort(([a], [b]) => b - a).map(([ano, its]) => ({ ano, itens: its }));
}
