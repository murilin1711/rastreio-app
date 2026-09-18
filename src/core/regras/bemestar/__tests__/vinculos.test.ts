import { extrairParametrosBemEstar } from '../parametros';
import type { Atividade, Refeicao } from '../tipos';
import { candidatosVinculo } from '../vinculos';
import { regrasBemEstarTeste } from './fixtures';

const p = extrairParametrosBemEstar(regrasBemEstarTeste());
const ref = (id: string, em: string): Refeicao => ({ id, em, tipo: 'almoco', descricao: 'x', quantidade: null, fomeAntes: null, saciedade: null, local: null, observacao: null });
const at = (id: string, inicio: string, duracaoMin: number): Atividade => ({ id, inicio, tipo: 'caminhada', duracaoMin, intensidade: 'moderada', distanciaKm: null, fcMedia: null, calorias: null, observacao: null });
const g = { medidoEm: '2026-09-18T14:35:00' };

test('refeição nas últimas 3 h → candidata; mais antiga → não; a mais recente vence', () => {
  expect(candidatosVinculo(g, [ref('a', '2026-09-18T12:30:00')], [], p).refeicao?.id).toBe('a');
  expect(candidatosVinculo(g, [ref('a', '2026-09-18T09:00:00')], [], p).refeicao).toBeNull();
  expect(candidatosVinculo(g, [ref('a', '2026-09-18T12:30:00'), ref('b', '2026-09-18T13:10:00')], [], p).refeicao?.id).toBe('b');
  expect(candidatosVinculo(g, [ref('c', '2026-09-18T15:00:00')], [], p).refeicao).toBeNull();
});
test('atividade encerrada nas últimas 3 h → candidata; encerrada há mais tempo ou iniciada depois → não', () => {
  const g2 = { medidoEm: '2026-09-18T19:30:00' };
  expect(candidatosVinculo(g2, [], [at('x', '2026-09-18T18:00:00', 40)], p).atividade?.id).toBe('x');
  expect(candidatosVinculo(g2, [], [at('x', '2026-09-18T15:00:00', 30)], p).atividade).toBeNull();
  expect(candidatosVinculo(g, [], [at('x', '2026-09-18T14:40:00', 40)], p).atividade).toBeNull();
  expect(candidatosVinculo(g, [], [at('x', '2026-09-18T14:00:00', 60)], p).atividade).toBeNull(); // ainda em andamento
});
