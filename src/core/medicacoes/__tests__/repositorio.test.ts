jest.mock('@core/supabase/client', () => ({ supabase: { from: jest.fn() } }));
import { supabase } from '@core/supabase/client';
import { listarTomadas, paraLinhaMedicacao, paraMedicacao, substituirTomadas } from '../repositorio';

const linha = {
  id: 'm1', nome: 'Losartana', dose: '50 mg', horarios: ['08:00', '20:00'], quantidades: { '08:00': 2 },
  unidade: 'comprimido', dose_variavel: false, se_precisar: false, horarios_desde: '2026-11-20T12:00:00.000Z',
  desde: null, ate: null, prescritor: null, ativa: true, lembrar: true, observacao: null,
};

it('hora sem quantidade gravada (build antigo) vale 1', () => {
  expect(paraMedicacao(linha).horarios).toEqual([{ hora: '08:00', quantidade: 2 }, { hora: '20:00', quantidade: 1 }]);
});

it('mapeia os campos novos', () => {
  const m = paraMedicacao(linha);
  expect(m.unidade).toBe('comprimido');
  expect(m.doseVariavel).toBe(false);
  expect(m.sePrecisar).toBe(false);
  expect(m.horariosDesde).toBe('2026-11-20T12:00:00.000Z');
});

it('remédio sem horário é "se precisar"', () => {
  expect(paraMedicacao({ ...linha, horarios: [], se_precisar: false }).sePrecisar).toBe(true);
});

it('grava horarios como textos e a quantidade à parte', () => {
  const l = paraLinhaMedicacao('u1', { ...paraMedicacao(linha) });
  expect(l.horarios).toEqual(['08:00', '20:00']);
  expect(l.quantidades).toEqual({ '08:00': 2, '20:00': 1 });
  expect(l).not.toHaveProperty('horarios_desde');
});

it('unidade desconhecida vira comprimido', () => {
  expect(paraMedicacao({ ...linha, unidade: 'toString' }).unidade).toBe('comprimido');
});

/** Consulta falsa: guarda as chamadas encadeadas e, ao ser aguardada, responde conforme elas. */
function consulta(resposta: { data?: unknown; error?: unknown } | ((chamadas: [string, ...unknown[]][]) => { data?: unknown; error?: unknown })) {
  const chamadas: [string, ...unknown[]][] = [];
  const q: Record<string, unknown> = {};
  for (const nome of ['select', 'insert', 'delete', 'eq', 'is', 'gte', 'lte', 'lt', 'order', 'range']) {
    q[nome] = (...args: unknown[]) => { chamadas.push([nome, ...args]); return q; };
  }
  q.then = (ok: (v: unknown) => unknown, erro: (e: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null, ...(typeof resposta === 'function' ? resposta(chamadas) : resposta) }).then(ok, erro);
  return { q, chamadas };
}

const tomada = (id: string, marcado: string, data: string | null) => ({
  id, user_id: 'u1', medicacao_id: 'm1', data_prevista: data, hora_prevista: data ? '08:00' : null,
  quantidade_prevista: data ? 1 : null, tomou: true, quantidade: 1, marcado_em: marcado, created_at: marcado,
});

const ehAvulsa = (ch: [string, ...unknown[]][]) => ch.some((c) => c[0] === 'is');
const inicioDaPagina = (ch: [string, ...unknown[]][]) => ch.find((c) => c[0] === 'range')?.[1];

describe('listarTomadas', () => {
  const from = supabase.from as jest.Mock;
  beforeEach(() => from.mockReset());

  it('junta as de dose prevista e as avulsas do período (fuso local) e ordena por marcadoEm', async () => {
    const consultas: ReturnType<typeof consulta>[] = [];
    from.mockImplementation(() => {
      const c = consulta((ch) => ({
        data: ehAvulsa(ch)
          ? [tomada('t1', '2026-11-20T15:00:00.000Z', null)]
          : [tomada('t2', '2026-11-21T11:10:00.000Z', '2026-11-21')],
      }));
      consultas.push(c);
      return c.q;
    });
    const r = await listarTomadas('u1', '2026-11-20', '2026-11-21');
    expect(r.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(r[0]).toEqual({
      id: 't1', medicacaoId: 'm1', dataPrevista: null, horaPrevista: null, quantidadePrevista: null,
      tomou: true, quantidade: 1, marcadoEm: '2026-11-20T15:00:00.000Z',
    });
    expect(from).toHaveBeenCalledWith('tomadas_medicacao');
    const [a, b] = [consultas.find((c) => !ehAvulsa(c.chamadas))!, consultas.find((c) => ehAvulsa(c.chamadas))!];
    expect(consultas).toHaveLength(2);
    expect(a.chamadas).toEqual([
      ['select', '*'], ['eq', 'user_id', 'u1'], ['gte', 'data_prevista', '2026-11-20'], ['lte', 'data_prevista', '2026-11-21'],
      ['order', 'marcado_em'], ['order', 'id'], ['range', 0, 999],
    ]);
    expect(b.chamadas).toEqual([
      ['select', '*'], ['eq', 'user_id', 'u1'], ['is', 'data_prevista', null],
      ['gte', 'marcado_em', new Date(2026, 10, 20).toISOString()],
      ['lt', 'marcado_em', new Date(2026, 10, 22).toISOString()],
      ['order', 'marcado_em'], ['order', 'id'], ['range', 0, 999],
    ]);
  });

  it('pagina além do teto de 1000 linhas do PostgREST e junta tudo', async () => {
    const consultas: ReturnType<typeof consulta>[] = [];
    const muitas = (de: number, n: number) =>
      Array.from({ length: n }, (_, i) => tomada(`p${de + i}`, new Date(Date.UTC(2026, 10, 20, 0, 0, de + i)).toISOString(), '2026-11-20'));
    from.mockImplementation(() => {
      const c = consulta((ch) => {
        if (ehAvulsa(ch)) return { data: [] };
        return { data: inicioDaPagina(ch) === 0 ? muitas(0, 1000) : muitas(1000, 5) };
      });
      consultas.push(c);
      return c.q;
    });
    const r = await listarTomadas('u1', '2026-11-20', '2026-11-21');
    expect(r).toHaveLength(1005);
    expect(r[1004].id).toBe('p1004');
    const paginas = consultas.filter((c) => !ehAvulsa(c.chamadas)).map((c) => c.chamadas.find((x) => x[0] === 'range'));
    expect(paginas).toEqual([['range', 0, 999], ['range', 1000, 1999]]);
  });

  it('erro do banco vira a mensagem traduzida', async () => {
    from.mockImplementation(() =>
      consulta((ch) => (ehAvulsa(ch) ? { error: { message: 'Network request failed' } } : { data: [] })).q,
    );
    await expect(listarTomadas('u1', '2026-11-20', '2026-11-21')).rejects.toThrow(
      'Sem conexão com a internet. Verifique sua rede e tente novamente.',
    );
  });
});

it('substituirTomadas apaga as marcas da dose e grava a nova', async () => {
  const from = supabase.from as jest.Mock;
  from.mockReset();
  const apagar = consulta({});
  const gravar = consulta({});
  from.mockReturnValueOnce(apagar.q).mockReturnValueOnce(gravar.q);
  await substituirTomadas(
    'u1',
    { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00' },
    { medicacaoId: 'm1', dataPrevista: '2026-11-23', horaPrevista: '08:00', quantidadePrevista: 1, tomou: false, quantidade: null },
  );
  expect(apagar.chamadas).toEqual([
    ['delete'], ['eq', 'user_id', 'u1'], ['eq', 'medicacao_id', 'm1'], ['eq', 'data_prevista', '2026-11-23'], ['eq', 'hora_prevista', '08:00'],
  ]);
  expect(gravar.chamadas).toEqual([[
    'insert',
    { user_id: 'u1', medicacao_id: 'm1', data_prevista: '2026-11-23', hora_prevista: '08:00', quantidade_prevista: 1, tomou: false, quantidade: null },
  ]]);
});
