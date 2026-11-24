import type { PontoPressao } from './tipos';

/** Mesma cor para a linha e para todos os pontos: a cor nunca diz se o valor está bom ou ruim (C-010, Ruling S0). */
const COR = '#0f2d63';
const COR_TEXTO = '#4A5C7A';
const COR_REF = '#5B8DB8';

const MARGEM = { esq: 30, dir: 8, topo: 8, base: 18 };

const r1 = (n: number) => String(Math.round(n * 10) / 10);
const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;

/**
 * Sistólica do período em SVG (página 1 do relatório, D-067). Gerado só a partir de números e datas, sem texto
 * do paciente. Eixo Y de min(110, menor − 10) a max(150, maior + 10); X pelo índice da medida; linha tracejada
 * na referência domiciliar (`referencia`, padrão 130). Menos de 2 pontos: '' (não há o que ligar).
 */
export function svgSistolica(serie: PontoPressao[], o: { largura: number; altura: number; referencia?: number }): string {
  if (serie.length < 2) return '';
  const ref = o.referencia ?? 130;
  const valores = serie.map((p) => p.pas);
  const lo = Math.min(110, Math.min(...valores) - 10);
  const hi = Math.max(150, Math.max(...valores) + 10);
  const larguraUtil = o.largura - MARGEM.esq - MARGEM.dir;
  const alturaUtil = o.altura - MARGEM.topo - MARGEM.base;
  const x = (i: number) => MARGEM.esq + (i * larguraUtil) / (serie.length - 1);
  const y = (v: number) => MARGEM.topo + ((hi - v) * alturaUtil) / (hi - lo);
  const pontos = serie.map((p, i) => ({ cx: r1(x(i)), cy: r1(y(p.pas)) }));
  const yRef = r1(y(ref));
  const base = r1(o.altura - MARGEM.base);
  const yData = r1(o.altura - 4);
  const texto = (px: string | number, py: string | number, t: string, ancora: 'start' | 'end' = 'start', extra = '') =>
    `<text x="${px}" y="${py}" font-size="9" fill="${COR_TEXTO}" text-anchor="${ancora}"${extra}>${t}</text>`;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${o.largura} ${o.altura}" width="${o.largura}" height="${o.altura}" role="img" aria-label="Pressão sistólica no período">`,
    `<line x1="${MARGEM.esq}" y1="${base}" x2="${o.largura - MARGEM.dir}" y2="${base}" stroke="#DCE2EE" stroke-width="1"/>`,
    texto(MARGEM.esq - 4, r1(MARGEM.topo + 3), String(hi), 'end'),
    texto(MARGEM.esq - 4, base, String(lo), 'end'),
    `<line data-ref="${ref}" x1="${MARGEM.esq}" y1="${yRef}" x2="${o.largura - MARGEM.dir}" y2="${yRef}" stroke="${COR_REF}" stroke-width="1" stroke-dasharray="4 3"/>`,
    texto(MARGEM.esq - 4, r1(y(ref) + 3), String(ref), 'end', ' font-weight="700"'),
    `<polyline points="${pontos.map((p) => `${p.cx},${p.cy}`).join(' ')}" fill="none" stroke="${COR}" stroke-width="1.5"/>`,
    ...pontos.map((p) => `<circle cx="${p.cx}" cy="${p.cy}" r="2.5" fill="${COR}"/>`),
    texto(MARGEM.esq, yData, diaMes(serie[0].data)),
    texto(o.largura - MARGEM.dir, yData, diaMes(serie[serie.length - 1].data), 'end'),
    '</svg>',
  ].join('');
}
