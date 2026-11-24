/** Compartilhamento por QR (D-067): JSON da página /r/ ao lado do PDF; revogar e limpar apagam os dois. */
import { criarCompartilhamento, limparExpirados, revogar } from '../compartilharQr';

interface Chamada { op: string; caminho?: string; corpo?: string; opcoes?: Record<string, unknown> }
const mockChamadas: Chamada[] = [];
const mockRemove = jest.fn(async (_c: string[]) => ({ error: null }));
const mockGerarPdf = jest.fn(async (_h: string) => 'file:///tmp/r.pdf');
let mockAssinaturas = 0;

jest.mock('../gerarPdf', () => ({ gerarPdf: (h: string) => mockGerarPdf(h) }));
jest.mock('../qr', () => ({ qrSvg: async (t: string) => `<svg data-link="${t}"/>` }));
jest.mock('@core/supabase/client', () => {
  const tipo = (c: string) => (c.endsWith('.json') ? 'json' : 'pdf');
  const encadeia = (fim: Record<string, unknown>) => {
    const q: Record<string, unknown> = {};
    for (const m of ['select', 'eq', 'is', 'gt', 'lte', 'in', 'order']) q[m] = () => q;
    return Object.assign(q, fim);
  };
  return {
    supabase: {
      storage: {
        from: (b: string) => {
          if (b !== 'relatorios') throw new Error(`bucket ${b}`);
          return {
            upload: async (caminho: string, corpo: unknown, opcoes: Record<string, unknown>) => {
              mockChamadas.push({ op: `upload:${tipo(caminho)}`, caminho, corpo: typeof corpo === 'string' ? corpo : undefined, opcoes });
              return { error: null };
            },
            createSignedUrl: async (caminho: string) => {
              mockChamadas.push({ op: `sign:${tipo(caminho)}`, caminho });
              mockAssinaturas += 1;
              return { data: { signedUrl: `https://abc.supabase.co/storage/v1/object/sign/relatorios/${caminho}?token=T-${mockAssinaturas}` }, error: null };
            },
            remove: (c: string[]) => mockRemove(c),
          };
        },
      },
      from: (t: string) => {
        if (t !== 'compartilhamentos') throw new Error(`tabela ${t}`);
        return {
          insert: () => { mockChamadas.push({ op: 'insert' }); return { select: () => ({ single: async () => ({ data: { id: 'c1', created_at: '2026-09-18T10:31:00Z' }, error: null }) }) }; },
          select: () => encadeia({
            maybeSingle: async () => ({ data: { caminho: 'u/x.pdf' }, error: null }),
            then: (ok: (v: unknown) => unknown) => ok({ data: [{ id: 'c2', caminho: 'u/y.pdf' }], error: null }),
          }),
          update: () => encadeia({ then: (ok: (v: unknown) => unknown) => ok({ error: null }) }),
        };
      },
    },
  };
});

const fetchOriginal = global.fetch;
beforeEach(() => {
  mockChamadas.length = 0;
  mockAssinaturas = 0;
  mockRemove.mockClear();
  mockGerarPdf.mockClear();
  global.fetch = jest.fn(async () => ({ blob: async () => new Blob(['%PDF']) })) as unknown as typeof fetch;
});
afterAll(() => { global.fetch = fetchOriginal; });

test('ordem: JSON provisório → link → PDF com o QR do link → JSON final com pdfUrl', async () => {
  const c = await criarCompartilhamento('u', 'geral', null, { titulo: 'R', geradoEm: '2026-09-18T10:30:00', htmlWeb: '<html>web</html>', htmlPdf: (svg) => `<html>${svg}</html>` });
  expect(mockChamadas.map((x) => x.op)).toEqual(['upload:json', 'sign:json', 'upload:pdf', 'sign:pdf', 'upload:json', 'insert']);
  expect(JSON.parse(mockChamadas[0].corpo!)).toEqual({ versao: 1, preparando: true });
  expect(mockChamadas[0].opcoes).toMatchObject({ contentType: 'application/json' });
  expect(mockChamadas[0].caminho).toBe(mockChamadas[2].caminho!.replace(/\.pdf$/, '.json'));
  expect(mockChamadas[2].opcoes).toMatchObject({ contentType: 'application/pdf' });
  expect(mockGerarPdf).toHaveBeenCalledTimes(1);
  expect(mockGerarPdf).toHaveBeenCalledWith(expect.stringContaining('data-link="https://nerosaude.com.br/r/#c=u/'));
  const final = JSON.parse(mockChamadas[4].corpo!);
  expect(final).toMatchObject({ versao: 1, titulo: 'R', geradoEm: '2026-09-18T10:30:00', html: '<html>web</html>', pdfUrl: expect.stringContaining('.pdf?token=') });
  expect(final.expiraEm).toBe(c.expiraEm);
  expect(Object.keys(final).sort()).toEqual(['expiraEm', 'geradoEm', 'html', 'pdfUrl', 'titulo', 'versao']);
  expect(mockChamadas[4].opcoes).toMatchObject({ contentType: 'application/json', upsert: true });
  expect(c.url.startsWith('https://nerosaude.com.br/r/#c=u/')).toBe(true);
  expect(c.url).toContain('.json&t=T-1');
  expect(c.qrSvg).toBe(`<svg data-link="${c.url}"/>`);
  expect(c.caminho).toBe(mockChamadas[2].caminho);
});

test('revogar apaga PDF e JSON', async () => { await revogar('u', 'c1'); expect(mockRemove).toHaveBeenCalledWith(['u/x.pdf', 'u/x.json']); });

test('limparExpirados apaga PDF e JSON dos vencidos', async () => {
  expect(await limparExpirados('u')).toBe(1);
  expect(mockRemove).toHaveBeenCalledWith(['u/y.pdf', 'u/y.json']);
});
