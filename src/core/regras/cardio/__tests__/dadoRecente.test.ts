import { estadoDoDado, montarEntradasPrevent } from '../dadoRecente';
import { extrairParametrosRisco } from '../parametrosRisco';
import type { FontesPrevent } from '../tiposRisco';
import { regrasRiscoTeste } from './fixturesRisco';

const p = extrairParametrosRisco(regrasRiscoTeste());
const hoje = '2026-09-17';
const dias = (n: number) => new Date(Date.parse(hoje) - n * 86_400_000).toISOString().slice(0, 10);

describe('janelas (C-014)', () => {
  test('lipídios: 364 dias atual, 366 antigo, sem data faltando', () => {
    expect(estadoDoDado('lipidios', dias(364), hoje, p)).toBe('atual');
    expect(estadoDoDado('lipidios', dias(366), hoje, p)).toBe('antigo');
    expect(estadoDoDado('lipidios', null, hoje, p)).toBe('faltando');
  });
  test('peso: 30 atual, 31 antigo (pergunta), 91 faltando (pede novo)', () => {
    expect(estadoDoDado('peso', dias(30), hoje, p)).toBe('atual');
    expect(estadoDoDado('peso', dias(31), hoje, p)).toBe('antigo');
    expect(estadoDoDado('peso', dias(91), hoje, p)).toBe('faltando');
  });
  test('MRPA: 30 atual, 31 faltando (pede medir)', () => {
    expect(estadoDoDado('pa_mrpa', dias(30), hoje, p)).toBe('atual');
    expect(estadoDoDado('pa_mrpa', dias(31), hoje, p)).toBe('faltando');
  });
  test('PA casual: precisa de ≥ 3 medidas em 7 dias', () => {
    expect(estadoDoDado('pa_casual', dias(2), hoje, p, 3)).toBe('atual');
    expect(estadoDoDado('pa_casual', dias(2), hoje, p, 2)).toBe('faltando');
  });
  test('HbA1c 6 meses; RAC e renal 12 meses; risco 12 meses', () => {
    expect(estadoDoDado('hba1c', dias(182), hoje, p)).toBe('atual');
    expect(estadoDoDado('hba1c', dias(184), hoje, p)).toBe('antigo');
    expect(estadoDoDado('renal', dias(360), hoje, p)).toBe('atual');
    expect(estadoDoDado('risco', dias(366), hoje, p)).toBe('antigo');
  });
});

describe('entradas do PREVENT (§14)', () => {
  const fontes: FontesPrevent = {
    idade: 52, sexo: 'feminino',
    colesterolTotal: { valor: 185, data: dias(100), origem: 'exame' }, hdl: { valor: 57, data: dias(100), origem: 'exame' },
    paMrpa: null, paCasual: { media: 128, n: 4, dataMaisRecente: dias(1) },
    antiHipertensivo: { valor: false, data: null, origem: 'medicacao' }, estatina: { valor: false, data: null, origem: 'medicacao' },
    diabetes: false, tabagismoAtual: false,
    peso: { valor: 67, data: dias(10), origem: 'medida' }, alturaCm: 165,
    tfg: null, creatinina: { valor: 0.8, data: dias(400), origem: 'exame' },
    hba1c: null, rac: null,
  };
  test('monta uma entrada por variável com estado', () => {
    const e = montarEntradasPrevent(fontes, hoje, p);
    const por = Object.fromEntries(e.map((x) => [x.chave, x]));
    expect(por.pas).toMatchObject({ valor: 128, estado: 'atual', origem: 'medida' });
    expect(por.colesterolTotal).toMatchObject({ valor: 185, estado: 'atual' });
    expect(por.imc).toMatchObject({ valor: 24.6, estado: 'atual' });
    expect(por.tfg).toMatchObject({ estado: 'antigo', origem: 'exame' }); // calculada da creatinina antiga
    expect(por.tfg.valor).toBeCloseTo(88.6, 1);
    expect(por.hba1c).toMatchObject({ estado: 'faltando', obrigatoria: false });
    expect(por.idade).toMatchObject({ valor: 52, estado: 'atual' });
  });
  test('MRPA válida recente prevalece sobre casuais', () => {
    const por = Object.fromEntries(montarEntradasPrevent({ ...fontes, paMrpa: { valor: 131, data: dias(5), origem: 'medida' } }, hoje, p).map((x) => [x.chave, x]));
    expect(por.pas.valor).toBe(131);
  });
  test('sem PA suficiente → faltando', () => {
    const por = Object.fromEntries(montarEntradasPrevent({ ...fontes, paCasual: { media: 128, n: 2, dataMaisRecente: dias(1) } }, hoje, p).map((x) => [x.chave, x]));
    expect(por.pas.estado).toBe('faltando');
  });
});
