import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
import { mama } from '../mama';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 45, sexoNascimento: 'feminino', possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false,
  racaCor: null, imc: 24, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'T', ano: 2023, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 12, mensagemPaciente: '', ...extra,
});
const mamo = (birads: number, extra: Record<string, unknown> = {}): ExameEntrada => ({ tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-09-01', resultado: { birads, ...extra } });

describe('mama — aplicabilidade e faixa (CBR/SBM/FEBRASGO 2023, reafirmada pela CNM 2025)', () => {
  it('só sexo feminino', () => expect(mama.aplicavel({ ...base, sexoNascimento: 'masculino' })).toBe(false));
  it('faixa habitual 40–74', () => expect(mama.faixaEtaria!(base)).toEqual({ min: 40, max: 74 }));
});

describe('mama — fatores modificadores', () => {
  it('risco habitual → null', () => expect(mama.fatoresModificadores(base)).toBeNull());
  it('câncer de mama tratado → mensagem cita mamografia anual pós-tratamento', () => {
    expect(mama.fatoresModificadores({ ...base, historicoCancerPessoal: ['Câncer de mama'] })).toMatch(/mamografia anual/i);
  });
  it('BRCA1 → não antes de 35', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['BRCA1'] })).toMatch(/35 anos/));
  it('TP53 → não antes de 30', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['TP53'] })).toMatch(/30 anos/));
  it('BRCA2 ou PALB2 → não antes de 30', () => expect(mama.fatoresModificadores({ ...base, doencasGeneticas: ['PALB2'] })).toMatch(/30 anos/));
  it('radioterapia torácica antes dos 30 → 8º ano após o tratamento', () => expect(mama.fatoresModificadores({ ...base, radioterapiaToracica: true })).toMatch(/8º ano/));
  it('HLA/CLIS/HDA → estimativa de risco com o médico', () => expect(mama.fatoresModificadores({ ...base, lesoesPrecursoras: ['Hiperplasia ductal atípica'] })).toMatch(/modelo/i));
  it('1º grau com mama aos 42 → se ≥20%, começar aos 32 (10 anos antes, não antes de 30)', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'mama', grau: 'primeiro', idadeDiagnostico: 42 }] })).toMatch(/32 anos/);
  });
  it('1º grau com mama aos 36 → não antes de 30', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'mama', grau: 'primeiro', idadeDiagnostico: 36 }] })).toMatch(/30 anos/);
  });
  it('ovário na família → forte história familiar', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'ovario', grau: 'primeiro', idadeDiagnostico: null }] })).toMatch(/hist[oó]ria familiar/i);
  });
  it('2º grau isolado → não é modificador', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'mama', grau: 'segundo', idadeDiagnostico: 70 }] })).toBeNull();
  });
  it('dois parentes de 2º grau → forte história familiar', () => {
    expect(mama.fatoresModificadores({ ...base, antecedentes: [
      { condicao: 'mama', grau: 'segundo', idadeDiagnostico: 70 }, { condicao: 'mama', grau: 'segundo', idadeDiagnostico: 65 }] })).toMatch(/hist[oó]ria familiar/i);
  });
});

describe('mama — seleção de regra por BI-RADS', () => {
  const regras = [regra('b1', { birads: 1 }), regra('b3', { birads: 3 }, { classificacao: 'controle', intervaloMeses: 6 })];
  it('casa pelo birads', () => expect(mama.selecionarRegra(mamo(1), regras, base, ctx)?.id).toBe('b1'));
  it('BI-RADS 3 com intervalo do laudo usa o laudo (C-009)', () => {
    expect(mama.selecionarRegra(mamo(3, { intervalo_laudo_meses: 4 }), regras, base, ctx)?.intervaloMeses).toBe(4);
  });
  it('BI-RADS 3 sem intervalo do laudo → padrão 6 meses', () => {
    expect(mama.selecionarRegra(mamo(3), regras, base, ctx)?.intervaloMeses).toBe(6);
  });
  it('densidade no resultado não atrapalha o casamento', () => expect(mama.selecionarRegra(mamo(1, { densidade: 'c' }), regras, base, ctx)?.id).toBe('b1'));
  it('sem regra → null', () => expect(mama.selecionarRegra(mamo(9), regras, base, ctx)).toBeNull());
});
