import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
import { prostata } from '../prostata';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const base: PerfilRegras = {
  idade: 52, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null, racaCor: 'branca', imc: 25,
  tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, condicao: Record<string, unknown>, extra: Partial<RegraParametros> = {}): RegraParametros => ({
  id, versao: '2026.1', fonte: 'SBU', ano: 2023, condicao, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: null, mensagemPaciente: '', ...extra,
});
const psa = (r: Record<string, unknown>): ExameEntrada => ({ tipo: 'psa', programa: 'prostata', dataRealizacao: '2026-09-01', resultado: r });
const regras = [regra('psa-ok', { psa_fora_referencia: false }), regra('psa-alto', { psa_fora_referencia: true }, { classificacao: 'investigacao', nivelAlerta: 'laranja' })];

describe('próstata — SBU/SBOC/SBRT 2023 (C-008, opção A)', () => {
  it('só masculino', () => expect(prostata.aplicavel({ ...base, sexoNascimento: 'feminino' })).toBe(false));
  it('risco habitual: 50–75', () => expect(prostata.faixaEtaria!(base)).toEqual({ min: 50, max: 75 }));
  it('etnia negra → 40', () => expect(prostata.faixaEtaria!({ ...base, racaCor: 'preta' })).toEqual({ min: 40, max: 75 }));
  it('histórico familiar de próstata (1º grau) → 40', () => expect(prostata.faixaEtaria!({ ...base, antecedentes: [{ condicao: 'prostata', grau: 'primeiro', idadeDiagnostico: null }] })).toEqual({ min: 40, max: 75 }));
  it('mutação BRCA → 40', () => expect(prostata.faixaEtaria!({ ...base, doencasGeneticas: ['BRCA2'] })).toEqual({ min: 40, max: 75 }));
  it('obesidade NÃO antecipa (fica como fator educativo)', () => expect(prostata.faixaEtaria!({ ...base, imc: 31 })).toEqual({ min: 50, max: 75 }));
  it('sem modificadores', () => expect(prostata.fatoresModificadores(base)).toBeNull());
  it('mensagem abaixo da idade cita 50 (ou 40 para maior risco)', () => {
    expect(prostata.mensagemNaoElegivel!(base)).toMatch(/50 anos/);
    expect(prostata.mensagemNaoElegivel!({ ...base, racaCor: 'preta' })).toMatch(/40 anos/);
  });
});

describe('próstata — PSA (§49): sem ponto de corte único, compara com a referência do laboratório', () => {
  it('dentro da referência → acompanhamento; sem intervalo automático', () => {
    const r = prostata.selecionarRegra(psa({ psa_total: 1.2, referencia_max: 4 }), regras, base, ctx);
    expect(r?.id).toBe('psa-ok'); expect(r?.intervaloMeses).toBeNull();
  });
  it('data de repetição informada → intervalo em meses a partir do exame', () => {
    const r = prostata.selecionarRegra(psa({ psa_total: 1.2, referencia_max: 4, repetir_em: '2027-09-01' }), regras, base, ctx);
    expect(r?.intervaloMeses).toBe(12);
  });
  it('data de repetição anterior ao exame → ignorada', () => {
    expect(prostata.selecionarRegra(psa({ psa_total: 1.2, referencia_max: 4, repetir_em: '2026-01-01' }), regras, base, ctx)?.intervaloMeses).toBeNull();
  });
  it('acima da referência → avaliação médica recomendada', () => expect(prostata.selecionarRegra(psa({ psa_total: 5.1, referencia_max: 4 }), regras, base, ctx)?.id).toBe('psa-alto'));
  it('igual à referência → dentro', () => expect(prostata.selecionarRegra(psa({ psa_total: 4, referencia_max: 4 }), regras, base, ctx)?.id).toBe('psa-ok'));
  it('sem referência informada → null (pendente: informar a referência do laudo)', () => expect(prostata.selecionarRegra(psa({ psa_total: 3 }), regras, base, ctx)).toBeNull());
});
