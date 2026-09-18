import type { ExameRegistrado } from './contexto';

export const CLASSIFICACAO: Record<string, string> = {
  normal: 'Rastreamento em dia', controle: 'Controle em curto intervalo', complementar: 'Exame complementar pendente',
  investigacao: 'Investigação necessária', especializado: 'Acompanhamento especializado', pendente: 'Resultado pendente',
};

/** Resumo legível do resultado estruturado (usado nas telas e no relatório). */
export function resumoResultado(e: ExameRegistrado): string {
  const r = e.resultado;
  switch (e.tipo) {
    case 'mamografia': return `BI-RADS ${r.birads}`;
    case 'dna_hpv': return r.hpv === 'negativo' ? 'HPV negativo' : r.hpv === '16_18' ? 'HPV 16/18' : r.hpv === 'invalido' ? 'Inválido' : `HPV outros${r.citologia_reflexa ? ` · citologia ${String(r.citologia_reflexa).toUpperCase().replace('_', '-')}` : ''}`;
    case 'citologia': return `Citologia ${String(r.citologia).toUpperCase().replace('_', '-')}`;
    case 'colposcopia': return `Colposcopia: ${String(r.achado).toUpperCase()}`;
    case 'fit': return `FIT ${r.fit}`;
    case 'colonoscopia': return r.achado === 'polipos' ? `Pólipos · ${String((r.polipos as { histopatologico?: string })?.histopatologico ?? '').replace('_', ' ')}` : `Colonoscopia: ${r.achado}`;
    case 'tcbd': return `Lung-RADS ${r.lungrads}`;
    case 'psa': return `PSA ${r.psa_total} ng/mL${r.referencia_max ? ` (ref. até ${r.referencia_max})` : ''}`;
    default: return e.tipo;
  }
}
