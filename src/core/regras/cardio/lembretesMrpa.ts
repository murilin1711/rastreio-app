import { dataDoDia } from './mrpa';
import type { PeriodoMrpa, SessaoMrpa } from './tipos';

/** O calendário da sessão. O texto da notificação sai de `core/lembretes/textos.ts` (D-044). */
export interface LembretePlanejado { dia: number; periodo: PeriodoMrpa; quando: Date; titulo: string }

/** §22: um lembrete por período por dia da sessão, no horário escolhido. Datas no fuso do aparelho. */
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
      });
    }
  }
  return out;
}
