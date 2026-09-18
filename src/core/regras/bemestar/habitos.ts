import { minutosQueContam, semanaDe } from './atividade';
import { resumo7d } from './sono';
import type { Atividade, MedidaCorporal, Meta, ParametrosBemEstar, Sono } from './tipos';

export interface Habitos7d {
  movimentoMin: number;
  metaMin: number;
  sonoMediaMin: number | null;
  refeicoes: number;
  pesoKg: number | null;
  /** Diferença entre o último peso e a média dos pesos dos 7 dias anteriores a ele (§85). */
  pesoVariacaoKg: number | null;
  cinturaCm: number | null;
  cinturaHaDias: number | null;
  checkinPendente: boolean;
}

const diaLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const diasEntre = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00`) - Date.parse(`${a}T00:00:00`)) / 86_400_000);

/** Tela "Meus hábitos" (§85): os últimos 7 dias em cinco números. Refeições e check-in chegam no plano 4b. */
export function habitos7d(e: { atividades: Atividade[]; sonos: Sono[]; pesos: MedidaCorporal[]; cinturas: MedidaCorporal[]; hoje: string; p: ParametrosBemEstar; meta: Meta | null; refeicoes?: number; checkinPendente?: boolean }): Habitos7d {
  const semana = semanaDe(e.hoje);
  const naSemana = e.atividades.filter((a) => { const d = diaLocal(a.inicio); return d >= semana.inicio && d <= semana.fim; });
  const pesos = [...e.pesos].filter((m) => m.valores.kg != null).sort((a, b) => b.medidoEm.localeCompare(a.medidoEm));
  const ultimo = pesos[0] ?? null;
  let pesoVariacaoKg: number | null = null;
  if (ultimo) {
    const dU = diaLocal(ultimo.medidoEm);
    const anteriores = pesos.filter((m) => m !== ultimo && diasEntre(diaLocal(m.medidoEm), dU) >= 1 && diasEntre(diaLocal(m.medidoEm), dU) <= 7);
    if (anteriores.length) pesoVariacaoKg = Math.round((ultimo.valores.kg! - anteriores.reduce((s, m) => s + m.valores.kg!, 0) / anteriores.length) * 10) / 10;
  }
  const cintura = [...e.cinturas].filter((m) => m.valores.cm != null).sort((a, b) => b.medidoEm.localeCompare(a.medidoEm))[0] ?? null;
  return {
    movimentoMin: minutosQueContam(naSemana, e.p),
    metaMin: e.meta?.tipo === 'atividade_min' ? e.meta.valor : e.p.atividade.moderadaMin,
    sonoMediaMin: resumo7d(e.sonos, e.hoje, e.p).mediaMin,
    refeicoes: e.refeicoes ?? 0,
    pesoKg: ultimo?.valores.kg ?? null,
    pesoVariacaoKg,
    cinturaCm: cintura?.valores.cm ?? null,
    cinturaHaDias: cintura ? diasEntre(diaLocal(cintura.medidoEm), e.hoje) : null,
    checkinPendente: e.checkinPendente ?? false,
  };
}
