import { avaliarElegibilidade } from '../../elegibilidade';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
import { colorretal } from '../colorretal';

const hoje = new Date('2026-09-15T12:00:00Z');
const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 55, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null,
  racaCor: null, imc: 25, tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'CONITEC 2026', ano: 2026, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 24, mensagemPaciente: 'FIT bienal', ...extra,
});
const regras = [
  regra('eleg', { idade_min: 50, idade_max: 74 }),
  regra('fit-neg', { fit: 'negativo' }),
  regra('fit-pos', { fit: 'positivo' }, { classificacao: 'investigacao', nivelAlerta: 'laranja', intervaloMeses: null }),
  regra('colo-normal', { achado: 'normal', qualidade_adequada: true }, { intervaloMeses: 120 }),
  regra('colo-incompleta', { achado: 'incompleta' }, { classificacao: 'pendente', nivelAlerta: 'cinza', intervaloMeses: null }),
  regra('polipo-aguardando', { achado: 'polipos', histopatologico: 'aguardando' }, { classificacao: 'pendente', nivelAlerta: 'cinza', intervaloMeses: null }),
  regra('polipo-hiperplasico', { achado: 'polipos', histopatologico: 'hiperplasico' }, { intervaloMeses: 120 }),
  regra('polipo-adenoma', { achado: 'polipos', histopatologico: 'adenoma' }, { classificacao: 'controle', nivelAlerta: 'amarelo', intervaloMeses: null }),
  regra('massa', { achado: 'massa_suspeita' }, { classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: null }),
];
const fit = (v: string): ExameEntrada => ({ tipo: 'fit', programa: 'colorretal', dataRealizacao: '2026-09-01', resultado: { fit: v } });
const colono = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'colonoscopia', programa: 'colorretal', dataRealizacao: '2026-09-01', resultado: r });

describe('colorretal — faixa e aplicabilidade (CONITEC Rec. 5–6)', () => {
  it('aplicável a todos', () => expect(colorretal.aplicavel(base)).toBe(true));
  it('50–74 risco padrão (rastreamento encerra aos 75)', () => expect(colorretal.faixaEtaria!(base)).toEqual({ min: 50, max: 74 }));
});

describe('colorretal — modificadores (CONITEC "risco padrão" + ACG 2021 Rec. 9–12)', () => {
  it('risco padrão → null', () => expect(colorretal.fatoresModificadores(base)).toBeNull());
  it('DII → individualizada', () => expect(colorretal.fatoresModificadores({ ...base, condicoes: { dii: true } })).toMatch(/inflamat/i));
  it('Lynch/PAF → individualizada com avaliação genética', () => expect(colorretal.fatoresModificadores({ ...base, doencasGeneticas: ['Síndrome de Lynch'] })).toMatch(/gen[eé]tic/i));
  it('CCR ou adenoma prévio → seguimento individualizado', () => expect(colorretal.fatoresModificadores({ ...base, lesoesPrecursoras: ['Adenoma tubular'] })).toMatch(/seguimento/i));
  it('1º grau < 60 → colonoscopia aos 40 ou 10 anos antes; a cada 5 anos (Rec. 9)', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 42 }] });
    expect(m).toMatch(/32 anos/); expect(m).toMatch(/5 anos/);
  });
  it('≥ 2 de 1º grau em qualquer idade → Rec. 9 + avaliação genética', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [
      { condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 70 }, { condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 65 }] });
    expect(m).toMatch(/40 anos/); expect(m).toMatch(/5 anos/); expect(m).toMatch(/gen[eé]tic/i);
  });
  it('1 de 1º grau ≥ 60 → iniciar aos 40 e depois risco habitual (Rec. 11)', () => {
    const m = colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'primeiro', idadeDiagnostico: 68 }] });
    expect(m).toMatch(/40 anos/); expect(m).toMatch(/habitual/i);
  });
  it('2º grau → risco médio (Rec. 12) → null', () => {
    expect(colorretal.fatoresModificadores({ ...base, antecedentes: [{ condicao: 'colorretal', grau: 'segundo', idadeDiagnostico: 55 }] })).toBeNull();
  });
});

describe('colorretal — seleção de regra (§46–47)', () => {
  it('FIT negativo / positivo', () => {
    expect(colorretal.selecionarRegra(fit('negativo'), regras, base, ctx)?.id).toBe('fit-neg');
    expect(colorretal.selecionarRegra(fit('positivo'), regras, base, ctx)?.id).toBe('fit-pos');
  });
  it('colonoscopia normal e adequada → 120 meses', () => expect(colorretal.selecionarRegra(colono({ achado: 'normal', qualidade_adequada: true }), regras, base, ctx)?.id).toBe('colo-normal'));
  it('colonoscopia normal sem qualidade confirmada → null (pendente)', () => {
    expect(colorretal.selecionarRegra(colono({ achado: 'normal', qualidade_adequada: false }), regras, base, ctx)).toBeNull();
  });
  it('pólipos: o histopatológico aninhado decide', () => {
    expect(colorretal.selecionarRegra(colono({ achado: 'polipos', polipos: { quantidade: 1, maior_mm: 4, removidos: true, histopatologico: 'aguardando' } }), regras, base, ctx)?.id).toBe('polipo-aguardando');
    expect(colorretal.selecionarRegra(colono({ achado: 'polipos', polipos: { quantidade: 1, maior_mm: 4, removidos: true, histopatologico: 'hiperplasico' } }), regras, base, ctx)?.id).toBe('polipo-hiperplasico');
  });
  it('adenoma com intervalo do laudo → controle no intervalo do laudo', () => {
    const r = colorretal.selecionarRegra(colono({ achado: 'polipos', intervalo_laudo_meses: 36, polipos: { quantidade: 2, maior_mm: 8, removidos: true, histopatologico: 'adenoma' } }), regras, base, ctx);
    expect(r?.id).toBe('polipo-adenoma'); expect(r?.intervaloMeses).toBe(36);
  });
  it('massa suspeita → especializado', () => expect(colorretal.selecionarRegra(colono({ achado: 'massa_suspeita' }), regras, base, ctx)?.id).toBe('massa'));
});

describe('colorretal — colonoscopia adequada suprime FIT por 10 anos (CONITEC, texto da Rec. 8)', () => {
  it('colonoscopia adequada há 3 anos → em dia, próxima = colonoscopia + 120 meses', () => {
    const c: ContextoAvaliacao = { ...ctx, colonoscopiaAdequadaEm: '2023-06-01' };
    const r = avaliarElegibilidade(base, 'colorretal', regras, c, hoje, { colorretal });
    expect(r.status).toBe('em_dia'); expect(r.proximaData).toBe('2033-06-01');
  });
  it('colonoscopia adequada há 11 anos → exame atrasado', () => {
    const r = avaliarElegibilidade(base, 'colorretal', regras, { ...ctx, colonoscopiaAdequadaEm: '2015-01-01' }, hoje, { colorretal });
    expect(r.status).toBe('exame_atrasado');
  });
});
