import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
import { colo } from '../colo';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 35, sexoNascimento: 'feminino', possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false,
  racaCor: null, imc: 24, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'INCA 2025', ano: 2025, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 60, mensagemPaciente: '', ...extra,
});
const hpv = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'dna_hpv', programa: 'colo_utero', dataRealizacao: '2026-09-01', resultado: r });
const regras = [
  regra('neg', { hpv: 'negativo', imunossuprimida: false }, { intervaloMeses: 60 }),
  regra('neg-imuno', { hpv: 'negativo', imunossuprimida: true }, { intervaloMeses: 36 }),
  regra('1618', { hpv: '16_18' }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('outros-imuno', { hpv: 'outros_oncogenicos', imunossuprimida: true }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('outros-reflexa-neg', { hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa', imunossuprimida: false }, { classificacao: 'controle', nivelAlerta: 'amarelo', intervaloMeses: 12 }),
  regra('outros-reflexa-hsil', { hpv: 'outros_oncogenicos', citologia_reflexa: 'hsil', imunossuprimida: false }, { classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: null }),
];

describe('colo — aplicabilidade (INCA 2025 Rec. 34, 36)', () => {
  it('sem colo do útero → não aplicável', () => expect(colo.aplicavel({ ...base, possuiColoUtero: false })).toBe(false));
  it('sem atividade sexual → não aplicável', () => expect(colo.aplicavel({ ...base, jaTeveAtividadeSexual: false })).toBe(false));
  it('atividade sexual desconhecida → aplicável (pergunta depois)', () => expect(colo.aplicavel({ ...base, jaTeveAtividadeSexual: null })).toBe(true));
});

describe('colo — faixa etária (Rec. 1, 12, 13, 37, 38)', () => {
  it('risco padrão: 25 a 64', () => expect(colo.faixaEtaria!(base)).toEqual({ min: 25, max: 64 }));
  it('HIV/imunossupressão: começa com a atividade sexual e não encerra', () => {
    expect(colo.faixaEtaria!({ ...base, idade: 20, condicoes: { hiv: true } })).toEqual({ min: 0, max: null });
  });
});

describe('colo — modificadores (Rec. 14, 35)', () => {
  it('NIC 2/3 ou AIS tratada → manter 25 anos após o tratamento', () => {
    expect(colo.fatoresModificadores({ ...base, lesoesPrecursoras: ['NIC 3'] })).toMatch(/25 anos/);
  });
  it('histerectomia por lesão/câncer do colo → coleta vaginal', () => {
    expect(colo.fatoresModificadores({ ...base, possuiColoUtero: false, histerectomia: true, historicoCancerPessoal: ['Câncer do colo do útero'] })).toMatch(/coleta vaginal/i);
  });
  it('HIV não é modificador (muda intervalo e conduta no fluxo normal)', () => {
    expect(colo.fatoresModificadores({ ...base, condicoes: { hiv: true } })).toBeNull();
  });
});

describe('colo — seleção de regra (Rec. 18, 39, 40; §45)', () => {
  it('negativo, risco padrão → 60 meses', () => expect(colo.selecionarRegra(hpv({ hpv: 'negativo' }), regras, base, ctx)?.id).toBe('neg'));
  it('negativo, imunossuprimida → 36 meses (Rec. 39)', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'negativo' }), regras, { ...base, condicoes: { imunossupressao: true } }, ctx)?.id).toBe('neg-imuno');
  });
  it('16/18 → colposcopia', () => expect(colo.selecionarRegra(hpv({ hpv: '16_18' }), regras, base, ctx)?.id).toBe('1618'));
  it('outros oncogênicos + imunossuprimida → colposcopia independentemente da reflexa (Rec. 40)', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa' }), regras, { ...base, condicoes: { hiv: true } }, ctx)?.id).toBe('outros-imuno');
  });
  it('outros oncogênicos sem citologia reflexa → null (pendente, §45.3)', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos' }), regras, base, ctx)).toBeNull();
  });
  it('outros oncogênicos + reflexa negativa → controle 12 meses', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'negativa' }), regras, base, ctx)?.id).toBe('outros-reflexa-neg');
  });
  it('outros oncogênicos + reflexa HSIL → especializado', () => {
    expect(colo.selecionarRegra(hpv({ hpv: 'outros_oncogenicos', citologia_reflexa: 'hsil' }), regras, base, ctx)?.id).toBe('outros-reflexa-hsil');
  });
});
