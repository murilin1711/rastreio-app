import { FONTES_POR_TEMA, GRUPOS_FONTES, REFERENCIAS, fontesDoTema, type IdReferencia } from '../catalogo';

describe('catálogo de fontes (diretriz 1.4.1)', () => {
  const ids = Object.keys(REFERENCIAS) as IdReferencia[];

  it('toda referência tem link https, título, emissor e ano', () => {
    for (const id of ids) {
      const r = REFERENCIAS[id];
      expect(r.url).toMatch(/^https:\/\//);
      expect(r.titulo.length).toBeGreaterThan(5);
      expect(r.emissor.length).toBeGreaterThan(2);
      expect(r.ano).toBeGreaterThanOrEqual(2005);
    }
  });

  it('todo tema tem ao menos uma fonte e todas existem', () => {
    for (const tema of Object.keys(FONTES_POR_TEMA) as (keyof typeof FONTES_POR_TEMA)[]) {
      const fontes = fontesDoTema(tema);
      expect(fontes.length).toBeGreaterThan(0);
      fontes.forEach((f) => expect(f.url).toBeTruthy());
    }
  });

  it('a tela "Fontes científicas" lista cada referência exatamente uma vez', () => {
    const listadas = GRUPOS_FONTES.flatMap((g) => g.ids);
    expect(new Set(listadas).size).toBe(listadas.length);
    expect([...listadas].sort()).toEqual([...ids].sort());
  });

  it('os cinco programas de rastreamento têm tema próprio', () => {
    for (const p of ['mama', 'colo_utero', 'colorretal', 'pulmao', 'prostata'] as const) expect(FONTES_POR_TEMA[p]).toBeDefined();
  });
});
