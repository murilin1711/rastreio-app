import { extrairParametros } from '../parametros';
import { avaliarMedidaCasual, deveConvidarMrpa, resumoCasual, validarPlausibilidade } from '../pressao';
import type { MedidaPA } from '../tipos';
import { regrasPressaoTeste } from './fixtures';

const p = extrairParametros(regrasPressaoTeste());
const m = (pas: number, pad: number, dia: string, extra: Partial<MedidaPA> = {}): MedidaPA =>
  ({ id: `${pas}-${pad}-${dia}`, medidoEm: `${dia}T08:00:00.000Z`, pas, pad, fc: null, sessaoId: null, contexto: {}, ...extra });

describe('plausibilidade (Medidas 2023, Parte 4 §3)', () => {
  test.each([
    [120, 141, 'pad_maior_140'], [120, 39, 'pad_menor_40'], [69, 50, 'pas_menor_70'], [251, 90, 'pas_maior_250'],
    [80, 90, 'pas_menor_pad'], [100, 85, 'pp_menor_20'], [200, 90, 'pp_maior_100'],
  ])('%i/%i → %s', (pas, pad, motivo) => expect(validarPlausibilidade({ pas, pad }, p)).toBe(motivo));
  test('128/78 é plausível', () => expect(validarPlausibilidade({ pas: 128, pad: 78 }, p)).toBeNull());
});

describe('camadas de uma medida casual (C-010)', () => {
  test('128/78: só contexto, sem cor, dentro da referência', () => {
    const a = avaliarMedidaCasual({ pas: 128, pad: 78 }, [], p);
    expect(a).toMatchObject({ camada: 'contexto', nivel: null, acimaReferenciaDomiciliar: false });
    expect(a.mensagem).toContain('130/80');
  });
  test('142/88: contexto, sem cor, acima da referência (AMPA não classifica)', () => {
    expect(avaliarMedidaCasual({ pas: 142, pad: 88 }, [], p)).toMatchObject({ camada: 'contexto', nivel: null, acimaReferenciaDomiciliar: true });
  });
  test('179/109 continua sem cor; 180/x e x/110 viram laranja', () => {
    expect(avaliarMedidaCasual({ pas: 179, pad: 109 }, [], p).nivel).toBeNull();
    expect(avaliarMedidaCasual({ pas: 180, pad: 70 }, [], p)).toMatchObject({ camada: 'muito_elevado', nivel: 'laranja', regraId: 'r-alto' });
    expect(avaliarMedidaCasual({ pas: 150, pad: 110 }, [], p).camada).toBe('muito_elevado');
  });
  test('muito elevado + sintoma de alarme → vermelho', () => {
    expect(avaliarMedidaCasual({ pas: 185, pad: 95 }, ['dor_toracica'], p)).toMatchObject({ camada: 'muito_elevado_sintoma', nivel: 'vermelho', regraId: 'r-alto-sint' });
  });
  test('sintoma sem valor muito elevado não muda a camada (sintomas são tratados na tela de sinais)', () => {
    expect(avaliarMedidaCasual({ pas: 140, pad: 90 }, ['dor_toracica'], p).camada).toBe('contexto');
  });
});

describe('convite para MRPA (C-010, camada 2b)', () => {
  const hoje = '2026-09-17';
  test('2 medidas ≥ 130/80 em 7 dias → não', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-15'), m(131, 70, '2026-09-16')], null, hoje, p)).toBe(false);
  });
  test('3 medidas ≥ 130 e/ou ≥ 80 em 7 dias → sim', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-12'), m(120, 80, '2026-09-14'), m(131, 70, '2026-09-16')], null, hoje, p)).toBe(true);
  });
  test('medida fora da janela de 7 dias não conta', () => {
    expect(deveConvidarMrpa([m(135, 85, '2026-09-09'), m(135, 85, '2026-09-14'), m(135, 85, '2026-09-16')], null, hoje, p)).toBe(false);
  });
  test('convite mostrado há menos de 30 dias → não repete', () => {
    const ms = [m(135, 85, '2026-09-12'), m(135, 85, '2026-09-14'), m(135, 85, '2026-09-16')];
    expect(deveConvidarMrpa(ms, '2026-09-01', hoje, p)).toBe(false);
    expect(deveConvidarMrpa(ms, '2026-08-10', hoje, p)).toBe(true);
  });
  test('medidas de sessão MRPA não contam como casuais', () => {
    const ms = [m(135, 85, '2026-09-12', { sessaoId: 's1' }), m(135, 85, '2026-09-14', { sessaoId: 's1' }), m(135, 85, '2026-09-16', { sessaoId: 's1' })];
    expect(deveConvidarMrpa(ms, null, hoje, p)).toBe(false);
  });
});

test('resumo casual: média arredondada, maior e menor por PAS', () => {
  const r = resumoCasual([m(120, 80, '2026-09-10'), m(130, 70, '2026-09-11'), m(125, 75, '2026-09-12')]);
  expect(r.media).toEqual({ pas: 125, pad: 75, n: 3 });
  expect(r.maior?.pas).toBe(130);
  expect(r.menor?.pas).toBe(120);
  expect(resumoCasual([]).media).toBeNull();
});
