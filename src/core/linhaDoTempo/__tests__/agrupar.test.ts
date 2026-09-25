import { semanaDe } from '@core/regras/bemestar/atividade';
import { formatarHm } from '@core/regras/bemestar/sono';
import { agruparPorAno, itensBemEstar } from '../agrupar';

test('agrupa por ano, mais recente primeiro, e ordena dentro do ano', () => {
  const g = agruparPorAno([
    { data: '2025-03-01', modulo: 'cardio', titulo: 'a', valor: '' },
    { data: '2026-09-10', modulo: 'rastreando', titulo: 'b', valor: '' },
    { data: '2026-01-05', modulo: 'medicacao', titulo: 'c', valor: '' },
  ]);
  expect(g.map((x) => x.ano)).toEqual([2026, 2025]);
  expect(g[0].itens.map((i) => i.titulo)).toEqual(['b', 'c']);
});
test('vazio → vazio', () => expect(agruparPorAno([])).toEqual([]));

test('itens do bem-estar: medidas individuais, sono e atividade por semana, check-ins', () => {
  const itens = itensBemEstar({
    corporais: [{ medidoEm: '2026-09-15T08:00:00', tipo: 'peso', valores: { kg: 82 } }, { medidoEm: '2026-09-15T08:00:00', tipo: 'cintura', valores: { cm: 96 } }],
    sonos: [{ acordouEm: '2026-09-15T06:00:00', minutos: 400 }, { acordouEm: '2026-09-16T06:00:00', minutos: 440 }],
    atividades: [{ inicio: '2026-09-14T07:00:00', duracaoMin: 40, intensidade: 'moderada' }, { inicio: '2026-09-18T07:00:00', duracaoMin: 20, intensidade: 'vigorosa' }],
    checkins: [{ semana: '2026-09-07', bemEstar: 7, energia: 6, estresse: 4 }],
    semanaDe, formatarHm,
  });
  expect(itens.map((i) => `${i.titulo}: ${i.valor}`)).toEqual([
    'Peso: 82 kg', 'Circunferência abdominal: 96 cm',
    'Sono · semana de 14/09: média 7h00 (2 noites)',
    'Atividade · semana de 14/09: 80 min que contam · 2 sessões',
    'Check-in semanal: bem-estar 7/10 · energia 6/10 · estresse 4/10',
  ]);
});
