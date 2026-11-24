import { svgSistolica } from '../grafico';

const serie = [{ data: '2026-09-01', pas: 128 }, { data: '2026-09-02', pas: 134 }, { data: '2026-09-03', pas: 186 }];

test('linha de 130 e um ponto por medida, todos da mesma cor', () => {
  const s = svgSistolica(serie, { largura: 520, altura: 150 });
  expect(s).toContain('data-ref="130"');
  expect(s.match(/<circle/g)).toHaveLength(3);
  expect([...s.matchAll(/<circle[^>]*fill="([^"]+)"/g)].map((m) => m[1])).toEqual(['#0f2d63', '#0f2d63', '#0f2d63']);
  expect(s.match(/<polyline/g)).toHaveLength(1);
});
test('menos de 2 pontos: nada', () => expect(svgSistolica(serie.slice(0, 1), { largura: 520, altura: 150 })).toBe(''));
test('referência vem de fora; rótulo, datas do primeiro e do último ponto e acessibilidade', () => {
  const s = svgSistolica(serie, { largura: 520, altura: 150, referencia: 135 });
  expect(s).toContain('data-ref="135"');
  expect(s).not.toContain('data-ref="130"');
  expect(s).toMatch(/>135<\/text>/);
  expect(s).toContain('>01/09<');
  expect(s).toContain('>03/09<');
  expect(s).not.toContain('>02/09<');
  expect(s).toContain('role="img"');
  expect(s).toContain('aria-label="Pressão sistólica no período"');
});
test('eixo Y: de min(110, menor − 10) a max(150, maior + 10); a linha de referência fica na altura certa', () => {
  const s = svgSistolica(serie, { largura: 520, altura: 150 });
  const y = Number(/<line[^>]*data-ref="130"[^>]*y1="([\d.]+)"/.exec(s)?.[1]);
  const ys = [...s.matchAll(/<circle[^>]*cy="([\d.]+)"/g)].map((m) => Number(m[1]));
  // maior valor no topo da área, a referência entre o 1º (128) e o 2º (134) ponto
  expect(ys[2]).toBeLessThan(ys[1]);
  expect(y).toBeGreaterThan(ys[1]);
  expect(y).toBeLessThan(ys[0]);
  // valores baixos: o eixo vai até 150 e a referência fica acima de todos os pontos
  const baixo = svgSistolica([{ data: '2026-09-01', pas: 118 }, { data: '2026-09-02', pas: 120 }], { largura: 520, altura: 150 });
  const yb = Number(/<line[^>]*data-ref="130"[^>]*y1="([\d.]+)"/.exec(baixo)?.[1]);
  const ysb = [...baixo.matchAll(/<circle[^>]*cy="([\d.]+)"/g)].map((m) => Number(m[1]));
  expect(Math.min(...ysb)).toBeGreaterThan(yb);
});
test('referência fora da faixa dos valores: o eixo se estende e a linha fica dentro do desenho', () => {
  const s = svgSistolica(serie.slice(0, 2), { largura: 520, altura: 150, referencia: 160 });
  const y = Number(/<line[^>]*data-ref="160"[^>]*y1="([\d.]+)"/.exec(s)?.[1]);
  expect(y).toBeGreaterThanOrEqual(8); // margem do topo
  expect(y).toBeLessThanOrEqual(150 - 18);
  expect(s).toMatch(/>170<\/text>/); // topo = ref + 10
  const baixa = svgSistolica(serie.slice(0, 2), { largura: 520, altura: 150, referencia: 100 });
  expect(baixa).toMatch(/>90<\/text>/); // base = ref − 10
});
test('título e descrição para leitor de tela', () => {
  const s = svgSistolica(serie, { largura: 520, altura: 150 });
  expect(s).toContain('<title>Pressão sistólica no período</title>');
  expect(s).toContain('<desc>3 medidas de 01/09 a 03/09; menor 128 mmHg, maior 186 mmHg; linha de referência em 130 mmHg.</desc>');
});
