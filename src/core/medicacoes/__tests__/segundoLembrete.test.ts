/**
 * Segundo lembrete (spec §6.2): 30 min depois do horário, um por dose, para as doses de hoje e amanhã,
 * com teto de 40 avulsos e nunca passando de 64 agendados no total (D-048).
 */
import { planejarSegundosLembretes, vagasSegundos } from '../segundoLembrete';
import type { Medicacao } from '../tipos';

const med = (id: string): Medicacao => ({
  id, nome: 'Losartana', dose: '50 mg', horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1 }],
  unidade: 'comprimido', doseVariavel: false, sePrecisar: false, horariosDesde: null, desde: null, ate: null,
  prescritor: null, ativa: true, lembrar: true, observacao: null,
});

const agora = new Date('2026-11-23T07:00:00');

it('3 remédios × 2 horários: 12 avulsos, hoje e amanhã, 30 min depois', () => {
  const p = planejarSegundosLembretes([med('a'), med('b'), med('c')], [], agora, 40);
  expect(p).toHaveLength(12);
  expect(p[0]).toMatchObject({ identificador: 'medicacao2:a:2026-11-23:08:00', data: '2026-11-23', hora: '08:00', rota: '/(app)/remedios/tomar?med=a&hora=08:00&data=2026-11-23' });
  expect(p[0].quando).toEqual(new Date('2026-11-23T08:30:00'));
  expect(p[0].texto.titulo).toBe('Você tomou Losartana das 8h?');
  // Ordenados pelo instante em que tocam.
  expect(p.map((s) => s.quando.getTime())).toEqual([...p.map((s) => s.quando.getTime())].sort((x, y) => x - y));
});

it('o que já passou não é agendado', () => {
  expect(planejarSegundosLembretes([med('a')], [], new Date('2026-11-23T09:00:00'), 40)).toHaveLength(3);
});

it('dose já marcada (tomei ou não tomei) não tem segundo lembrete', () => {
  const marcada = { id: 't', medicacaoId: 'a', dataPrevista: '2026-11-23', horaPrevista: '20:00', quantidadePrevista: 1, tomou: false, quantidade: null, marcadoEm: '' };
  const ids = planejarSegundosLembretes([med('a')], [marcada], agora, 40).map((s) => s.identificador);
  expect(ids).not.toContain('medicacao2:a:2026-11-23:20:00');
  expect(ids).toHaveLength(3);
});

it('a marca de outro remédio no mesmo horário não apaga o segundo lembrete deste', () => {
  const marcadaDeB = { id: 't', medicacaoId: 'b', dataPrevista: '2026-11-23', horaPrevista: '20:00', quantidadePrevista: 1, tomou: true, quantidade: 1, marcadoEm: '' };
  expect(planejarSegundosLembretes([med('a')], [marcadaDeB], agora, 40).map((s) => s.identificador)).toContain('medicacao2:a:2026-11-23:20:00');
});

it('sem lembrete, "se precisar" ou interrompido: nada', () => {
  expect(planejarSegundosLembretes([{ ...med('a'), lembrar: false }, { ...med('b'), sePrecisar: true, horarios: [] }, { ...med('c'), ativa: false }], [], agora, 40)).toEqual([]);
});

it('respeita desde e ate do remédio', () => {
  const ate = planejarSegundosLembretes([{ ...med('a'), ate: '2026-11-23' }], [], agora, 40);
  expect(ate).toHaveLength(2);
  expect(ate.every((s) => s.data === '2026-11-23')).toBe(true);
  const desde = planejarSegundosLembretes([{ ...med('a'), desde: '2026-11-24' }], [], agora, 40);
  expect(desde).toHaveLength(2);
  expect(desde.every((s) => s.data === '2026-11-24')).toBe(true);
});

it('passou do teto: a janela encolhe para só hoje', () => {
  const onze = 'abcdefghijk'.split('').map(med); // 11 × 2 × 2 = 44 > 40
  const p = planejarSegundosLembretes(onze, [], agora, 40);
  expect(p).toHaveLength(22);
  expect(p.every((s) => s.data === '2026-11-23')).toBe(true);
});

it('com poucas vagas, fica com os mais próximos', () => {
  const p = planejarSegundosLembretes('abcdefghijk'.split('').map(med), [], agora, 10);
  expect(p).toHaveLength(10);
  expect(p.every((s) => s.hora === '08:00')).toBe(true);
});

it('sem vagas, nada', () => {
  expect(planejarSegundosLembretes([med('a')], [], agora, 0)).toEqual([]);
});

it('dose das 23:45: toca 00:15 do dia seguinte, mas é a dose do dia anterior', () => {
  const p = planejarSegundosLembretes([{ ...med('a'), horarios: [{ hora: '23:45', quantidade: 1 }] }], [], agora, 40);
  expect(p[0]).toMatchObject({ data: '2026-11-23', identificador: 'medicacao2:a:2026-11-23:23:45' });
  expect(p[0].quando).toEqual(new Date('2026-11-24T00:15:00'));
});

it('vagas: 40 no máximo, e nunca passa de 64 somando os outros avisos', () => {
  expect(vagasSegundos(10)).toBe(40);
  expect(vagasSegundos(30)).toBe(30);
  expect(vagasSegundos(70)).toBe(0);
});

describe('virada do dia (R-T5-a)', () => {
  const tarde = { ...med('a'), horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '23:45', quantidade: 1 }] };
  const meiaNoite = new Date('2026-11-24T00:05:00');

  it('sincronizar às 00:05 mantém o aviso das 00:15 da dose de 23:45 de ontem', () => {
    const p = planejarSegundosLembretes([tarde], [], meiaNoite, 40);
    expect(p[0]).toMatchObject({ identificador: 'medicacao2:a:2026-11-23:23:45', data: '2026-11-23', rota: '/(app)/remedios/tomar?med=a&hora=23:45&data=2026-11-23' });
    expect(p[0].quando).toEqual(new Date('2026-11-24T00:15:00'));
    // O resto de ontem (08:00) já tocou; hoje e amanhã completos.
    expect(p.map((s) => s.identificador)).toEqual([
      'medicacao2:a:2026-11-23:23:45', 'medicacao2:a:2026-11-24:08:00', 'medicacao2:a:2026-11-24:23:45',
      'medicacao2:a:2026-11-25:08:00', 'medicacao2:a:2026-11-25:23:45',
    ]);
  });

  it('dose de ontem já marcada: sem aviso', () => {
    const marcada = { id: 't', medicacaoId: 'a', dataPrevista: '2026-11-23', horaPrevista: '23:45', quantidadePrevista: 1, tomou: true, quantidade: 1, marcadoEm: '' };
    expect(planejarSegundosLembretes([tarde], [marcada], meiaNoite, 40).map((s) => s.identificador)).not.toContain('medicacao2:a:2026-11-23:23:45');
  });

  it('passou do teto: o resto de ontem fica junto com hoje', () => {
    const p = planejarSegundosLembretes([tarde], [], meiaNoite, 3);
    expect(p.map((s) => s.data)).toEqual(['2026-11-23', '2026-11-24', '2026-11-24']);
  });
});
