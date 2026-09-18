import { minutosQueContam, resumo30d, resumoSemana, semanaDe, TIPOS_FORTALECIMENTO } from '../atividade';
import { extrairParametrosBemEstar } from '../parametros';
import type { Atividade, Meta } from '../tipos';
import { regrasBemEstarTeste } from './fixtures';

const p = extrairParametrosBemEstar(regrasBemEstarTeste());
const at = (id: string, inicio: string, tipo: Atividade['tipo'], duracaoMin: number, intensidade: Atividade['intensidade']): Atividade => ({ id, inicio, tipo, duracaoMin, intensidade, distanciaKm: null, fcMedia: null, calorias: null, observacao: null });
// semana de 14/09 (segunda) a 20/09/2026 (domingo)
const semana = semanaDe('2026-09-18');
const lista = [
  at('1', '2026-09-14T07:00:00', 'caminhada', 40, 'moderada'),
  at('2', '2026-09-16T18:00:00', 'musculacao', 50, 'moderada'),
  at('3', '2026-09-18T06:30:00', 'corrida', 20, 'vigorosa'),
  at('4', '2026-09-18T20:00:00', 'yoga', 30, 'leve'),
  at('5', '2026-09-10T07:00:00', 'caminhada', 60, 'moderada'), // semana anterior
];

test('semanaDe: segunda a domingo (local)', () => {
  expect(semana).toEqual({ inicio: '2026-09-14', fim: '2026-09-20' });
  expect(semanaDe('2026-09-20')).toEqual({ inicio: '2026-09-14', fim: '2026-09-20' });
  expect(semanaDe('2026-09-21')).toEqual({ inicio: '2026-09-21', fim: '2026-09-27' });
});
test('minutos que contam: moderada + vigorosa × 2; leve não conta', () => {
  expect(minutosQueContam(lista.slice(0, 4), p)).toBe(130);
  expect(TIPOS_FORTALECIMENTO).toEqual(['musculacao', 'funcional', 'pilates']);
});
test('resumo da semana com meta sugerida', () => {
  const r = resumoSemana(lista, semana, p, 45, null);
  expect(r).toMatchObject({ totalMin: 140, leveMin: 30, moderadaMin: 90, vigorosaMin: 20, minutosQueContam: 130, diasAtivos: 3, diasFortalecimento: 1, metaMin: 150, metaAtingidaPct: 87, fortalecimentoMeta: 2, idoso: false, equilibrioDias: 0 });
  expect(r.porDia).toHaveLength(7);
  expect(r.porDia.map((d) => d.minutos)).toEqual([40, 0, 50, 0, 50, 0, 0]);
  expect(r.porDia[0].dia).toBe('2026-09-14');
});
test('meta própria substitui a sugerida; idoso ganha equilíbrio', () => {
  const meta: Meta = { id: 'm', tipo: 'atividade_min', valor: 200, origem: 'usuario', detalhe: null, ativa: true };
  const r = resumoSemana(lista, semana, p, 65, meta);
  expect(r.metaMin).toBe(200);
  expect(r.metaAtingidaPct).toBe(65);
  expect(r.idoso).toBe(true);
  expect(r.equilibrioDias).toBe(3);
});
test('resumo de 30 dias por tipo', () => {
  const r = resumo30d(lista, '2026-09-18');
  expect(r.totalMin).toBe(200);
  expect(r.porTipo.find((t) => t.tipo === 'caminhada')).toEqual({ tipo: 'caminhada', sessoes: 2, minutos: 100 });
  expect(r.porTipo[0].minutos).toBeGreaterThanOrEqual(r.porTipo[1].minutos);
});
