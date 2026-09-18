import { extrairParametrosBemEstar } from '../parametros';
import { formatarHm, mediaCircularHora, minutosDeSono, resumo7d } from '../sono';
import type { Sono } from '../tipos';
import { regrasBemEstarTeste } from './fixtures';

const p = extrairParametrosBemEstar(regrasBemEstarTeste());
const noite = (id: string, dormiu: string, acordou: string, qualidade: Sono['qualidade'] = 4): Sono => ({ id, dormiuEm: dormiu, acordouEm: acordou, minutos: minutosDeSono(dormiu, acordou), qualidade, contexto: {} });

test('minutos de sono e formatação', () => {
  expect(minutosDeSono('2026-09-17T23:40:00', '2026-09-18T06:20:00')).toBe(400);
  expect(formatarHm(400)).toBe('6h40');
  expect(formatarHm(432)).toBe('7h12');
  expect(() => minutosDeSono('2026-09-18T06:20:00', '2026-09-18T06:00:00')).toThrow();
  expect(() => minutosDeSono('2026-09-17T06:00:00', '2026-09-18T06:00:00')).toThrow();
});
test('média circular de horários (meia-noite não vira meio-dia)', () => {
  expect(mediaCircularHora([{ h: 23, m: 40 }, { h: 0, m: 20 }])).toEqual({ h: 0, m: 0 });
  expect(mediaCircularHora([{ h: 22, m: 0 }, { h: 23, m: 0 }])).toEqual({ h: 22, m: 30 });
  expect(mediaCircularHora([{ h: 6, m: 30 }, { h: 7, m: 30 }, { h: 7, m: 0 }])).toEqual({ h: 7, m: 0 });
});
test('resumo de 7 dias: média, horários e referência AASM', () => {
  const noites = [
    noite('1', '2026-09-11T23:30:00', '2026-09-12T06:10:00'), noite('2', '2026-09-12T23:50:00', '2026-09-13T06:50:00'),
    noite('3', '2026-09-13T23:40:00', '2026-09-14T07:10:00'), noite('4', '2026-09-14T23:55:00', '2026-09-15T06:15:00'),
    noite('5', '2026-09-15T23:30:00', '2026-09-16T07:20:00'), noite('6', '2026-09-16T23:45:00', '2026-09-17T06:55:00'),
    noite('7', '2026-09-17T23:40:00', '2026-09-18T06:30:00'),
    noite('8', '2026-09-01T23:00:00', '2026-09-02T07:00:00'), // fora dos 7 dias
  ];
  const r = resumo7d(noites, '2026-09-18', p);
  expect(r.noites).toBe(7);
  expect(r.mediaMin).toBe(423);
  expect(r.abaixoDaReferencia).toBe(false);
  expect(r.horarioDormir).toBe('23:41');
  expect(r.horarioAcordar).toBe('06:44');
  expect(r.porNoite.map((n) => n.data)).toEqual(['2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18']);
  expect(r.regra.id).toBe('b-sono');
});
test('abaixo de 7 h → abaixoDaReferencia; sem noites → nulos', () => {
  const curtas = [noite('1', '2026-09-16T00:30:00', '2026-09-16T06:00:00'), noite('2', '2026-09-17T00:40:00', '2026-09-17T06:10:00')];
  const r = resumo7d(curtas, '2026-09-18', p);
  expect(r.mediaMin).toBe(330);
  expect(r.abaixoDaReferencia).toBe(true);
  expect(resumo7d([], '2026-09-18', p)).toMatchObject({ noites: 0, mediaMin: null, horarioDormir: null, horarioAcordar: null, abaixoDaReferencia: false });
});
