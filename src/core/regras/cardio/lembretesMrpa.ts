import { dataDoDia } from './mrpa';
import type { PeriodoMrpa, SessaoMrpa } from './tipos';

export interface LembretePlanejado { dia: number; periodo: PeriodoMrpa; quando: Date; titulo: string; texto: string }

/** §22: "08:00 — Hora de registrar sua pressão — MRPA, dia 3 de 7." Datas no fuso do aparelho. */
export function planejarLembretesMrpa(sessao: SessaoMrpa): LembretePlanejado[] {
  const out: LembretePlanejado[] = [];
  for (let dia = 1; dia <= sessao.diasPrevistos; dia++) {
    const [a, m, d] = dataDoDia(sessao, dia).split('-').map(Number);
    for (const periodo of ['manha', 'noite'] as const) {
      const [h, min] = sessao.horarios[periodo].split(':').map(Number);
      out.push({
        dia,
        periodo,
        quando: new Date(a, m - 1, d, h, min, 0),
        titulo: `mrpa:${sessao.id}:${dia}:${periodo}`,
        texto: `Hora de registrar sua pressão — MRPA, dia ${dia} de ${sessao.diasPrevistos} (${periodo === 'manha' ? 'manhã' : 'noite'}).`,
      });
    }
  }
  return out;
}
