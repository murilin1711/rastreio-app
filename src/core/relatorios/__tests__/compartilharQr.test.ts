/**
 * Compartilhamento por QR (D-067): JSON da página /r/ ao lado do PDF; revogar e limpar apagam os dois.
 * A linha em `compartilhamentos` entra ANTES de qualquer arquivo (R3-T9-b): nada fica no bucket sem prazo.
 */
import { criarCompartilhamento, limparExpirados, revogar } from '../compartilharQr';

interface Chamada { op: string; caminho?: string; corpo?: string; opcoes?: Record<string, unknown>; quando?: number }
const mockChamadas: Chamada[] = [];
const mockRemove = jest.fn(async (_c: string[]): Promise<{ error: { message: string } | null }> => ({ error: null }));
const mockGerarPdf = jest.fn(async (_h: string) => 'file:///tmp/r.pdf');
let mockAssinaturas = 0;
const mockFalhas: { uploadJsonFinal?: boolean; uploadPdf?: boolean; insert?: boolean } = {};
const mockDelete = jest.fn(async (_filtros: [string, unknown][]): Promise<{ error: { message: string } | null }> => ({ error: null }));
const mockUpdate = jest.fn();
const UID = '00000000-0000-0000-0000-00000000003a';

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
              if (mockFalhas.uploadJsonFinal && opcoes.upsert && caminho.endsWith('.json')) return { error: { message: 'falha no upload' } };
              if (mockFalhas.uploadPdf && caminho.endsWith('.pdf')) return { error: { message: 'falha no upload do PDF' } };
              return { error: null };
            },
            createSignedUrl: async (caminho: string) => {
              mockChamadas.push({ op: `sign:${tipo(caminho)}`, caminho, quando: Date.now() });
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
          insert: (linha: Record<string, unknown>) => {
            mockChamadas.push({ op: 'insert', caminho: linha.caminho as string, opcoes: linha });
            return { select: () => ({ single: async () => (mockFalhas.insert ? { data: null, error: { message: 'falha no insert' } } : { data: { id: 'c1', created_at: '2026-09-18T10:31:00Z' }, error: null }) }) };
          },
          select: () => encadeia({
            maybeSingle: async () => ({ data: { caminho: 'u/x.pdf' }, error: null }),
            then: (ok: (v: unknown) => unknown) => ok({ data: [{ id: 'c2', caminho: 'u/y.pdf' }], error: null }),
          }),
          delete: () => {
            mockChamadas.push({ op: 'delete' });
            const filtros: [string, unknown][] = [];
            const q = { eq: (c: string, v: unknown) => { filtros.push([c, v]); return q; }, then: (ok: (v: unknown) => unknown, erro: (e: unknown) => unknown) => mockDelete(filtros).then(ok, erro) };
            return q;
          },
          update: (v: unknown) => { mockUpdate(v); return encadeia({ then: (ok: (v: unknown) => unknown) => ok({ error: null }) }); },
        };
      },
    },
  };
});

const fetchOriginal = global.fetch;
beforeEach(() => {
  mockChamadas.length = 0;
  mockAssinaturas = 0;
  mockRemove.mockReset();
  mockRemove.mockImplementation(async () => ({ error: null }));
  mockUpdate.mockClear();
  delete mockFalhas.uploadJsonFinal; delete mockFalhas.uploadPdf; delete mockFalhas.insert;
  mockDelete.mockReset();
  mockDelete.mockImplementation(async () => ({ error: null }));
  mockGerarPdf.mockClear();
  global.fetch = jest.fn(async () => ({ blob: async () => new Blob(['%PDF']) })) as unknown as typeof fetch;
});
afterAll(() => { global.fetch = fetchOriginal; });

test('ordem: linha com prazo → JSON provisório → link → PDF com o QR do link → JSON final com pdfUrl', async () => {
  const c = await criarCompartilhamento(UID, 'geral', null, { titulo: 'R', geradoEm: '2026-09-18T10:30:00', htmlWeb: '<html>web</html>', htmlPdf: (svg) => `<html>${svg}</html>` });
  expect(mockChamadas.map((x) => x.op)).toEqual(['insert', 'upload:json', 'sign:json', 'upload:pdf', 'sign:pdf', 'upload:json']);
  expect(JSON.parse(mockChamadas[1].corpo!)).toEqual({ versao: 1, preparando: true });
  expect(mockChamadas[1].opcoes).toMatchObject({ contentType: 'application/json' });
  expect(mockChamadas[1].caminho).toBe(mockChamadas[3].caminho!.replace(/\.pdf$/, '.json'));
  expect(mockChamadas[3].opcoes).toMatchObject({ contentType: 'application/pdf' });
  expect(mockGerarPdf).toHaveBeenCalledTimes(1);
  expect(mockGerarPdf).toHaveBeenCalledWith(expect.stringContaining(`data-link="https://nerosaude.com.br/r/#c=${UID}/`));
  const final = JSON.parse(mockChamadas[5].corpo!);
  expect(final).toMatchObject({ versao: 1, titulo: 'R', geradoEm: '2026-09-18T10:30:00', html: '<html>web</html>', pdfUrl: expect.stringContaining('.pdf?token=') });
  expect(final.expiraEm).toBe(c.expiraEm);
  expect(Object.keys(final).sort()).toEqual(['expiraEm', 'geradoEm', 'html', 'pdfUrl', 'titulo', 'versao']);
  expect(mockChamadas[5].opcoes).toMatchObject({ contentType: 'application/json', upsert: true });
  expect(c.url.startsWith(`https://nerosaude.com.br/r/#c=${UID}/`)).toBe(true);
  expect(c.url).toContain('.json&t=T-1');
  expect(c.qrSvg).toBe(`<svg data-link="${c.url}"/>`);
  expect(c.caminho).toBe(mockChamadas[3].caminho);
  expect(mockChamadas[0].opcoes).toMatchObject({ user_id: UID, caminho: c.caminho, expira_em: c.expiraEm });
  expect(mockDelete).not.toHaveBeenCalled();
});

test('revogar apaga PDF e JSON', async () => { await revogar('u', 'c1'); expect(mockRemove).toHaveBeenCalledWith(['u/x.pdf', 'u/x.json']); });

test('limparExpirados apaga PDF e JSON dos vencidos e marca revogado_em', async () => {
  expect(await limparExpirados('u')).toBe(1);
  expect(mockRemove).toHaveBeenCalledWith(['u/y.pdf', 'u/y.json']);
  expect(mockUpdate).toHaveBeenCalledWith({ revogado_em: expect.any(String) });
});

test('limparExpirados: se o Storage falhar, NÃO marca revogado_em (tenta de novo na próxima vez)', async () => {
  mockRemove.mockImplementation(async () => ({ error: { message: 'fora do ar' } }));
  expect(await limparExpirados('u')).toBe(0);
  expect(mockUpdate).not.toHaveBeenCalled();
});

const CONTEUDO = { titulo: 'R', geradoEm: '2026-09-18T10:30:00', htmlWeb: '<html>web</html>', htmlPdf: (svg: string) => `<html>${svg}</html>` };

test('insert falha: nenhum arquivo sobe e o erro chega a quem chamou', async () => {
  mockFalhas.insert = true;
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toBeTruthy();
  expect(mockChamadas.map((x) => x.op)).toEqual(['insert']);
  expect(mockRemove).not.toHaveBeenCalled();
});

const apagouTudo = () => {
  const pdf = mockChamadas.find((x) => x.op === 'insert')!.caminho!;
  expect(mockRemove).toHaveBeenCalledWith([pdf, pdf.replace(/\.pdf$/, '.json')]);
  expect(mockDelete).toHaveBeenCalledWith(expect.arrayContaining([['id', 'c1'], ['user_id', UID]]));
};

test('upload do PDF falha: apaga arquivos e a linha e relança', async () => {
  mockFalhas.uploadPdf = true;
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toBeTruthy();
  apagouTudo();
});

test('upload do JSON final falha: apaga arquivos e a linha e relança', async () => {
  mockFalhas.uploadJsonFinal = true;
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toBeTruthy();
  apagouTudo();
});

test('arquivos não saíram (rede): a linha FICA, com prazo, para limparExpirados; o erro original chega', async () => {
  mockGerarPdf.mockRejectedValueOnce(new Error('PDF quebrou'));
  mockRemove.mockImplementation(async () => { throw new Error('rede'); });
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toThrow(/^PDF quebrou$/);
  expect(mockRemove).toHaveBeenCalled();
  expect(mockDelete).not.toHaveBeenCalled();
});

test('Storage recusa apagar (erro devolvido): a linha também fica', async () => {
  mockGerarPdf.mockRejectedValueOnce(new Error('PDF quebrou'));
  mockRemove.mockImplementation(async () => ({ error: { message: 'negado' } }));
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toThrow(/^PDF quebrou$/);
  expect(mockDelete).not.toHaveBeenCalled();
});

test('falha ao apagar a linha não esconde o erro original', async () => {
  mockGerarPdf.mockRejectedValueOnce(new Error('PDF quebrou'));
  mockDelete.mockImplementation(async () => { throw new Error('rede de novo'); });
  await expect(criarCompartilhamento(UID, 'geral', null, CONTEUDO)).rejects.toThrow(/^PDF quebrou$/);
  expect(mockRemove).toHaveBeenCalled();
  expect(mockDelete).toHaveBeenCalled();
});

test('a validade é calculada antes de assinar o JSON (a data mostrada nunca passa da assinatura)', async () => {
  let t = Date.parse('2026-09-18T10:30:00Z');
  const relogio = jest.spyOn(Date, 'now').mockImplementation(() => (t += 1000));
  try {
    const c = await criarCompartilhamento(UID, 'geral', null, CONTEUDO);
    const assinou = mockChamadas.find((x) => x.op === 'sign:json')!.quando!;
    expect(new Date(c.expiraEm).getTime()).toBeLessThan(assinou + 7 * 24 * 3600 * 1000);
  } finally { relogio.mockRestore(); }
});

test('a validade mostrada no PDF é o dia local do vencimento (22:30 não vira o dia seguinte)', async () => {
  const agora = new Date(2026, 8, 18, 22, 30).getTime(); // 18/09 22:30 local; +7 dias = 25/09 22:30 local
  const spy = jest.spyOn(Date, 'now').mockReturnValue(agora);
  let validade = '';
  try {
    await criarCompartilhamento(UID, 'geral', null, { titulo: 'R', geradoEm: '2026-09-18T22:30:00', htmlWeb: '<html/>', htmlPdf: (svg, v) => { validade = v; return `<html>${svg}</html>`; } });
  } finally { spy.mockRestore(); }
  expect(validade).toBe('25/09/2026');
});
