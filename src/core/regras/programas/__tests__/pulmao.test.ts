import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../../tipos';
import { pulmao } from '../pulmao';

const ctx: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const fumante: PerfilRegras = {
  idade: 60, sexoNascimento: 'masculino', possuiColoUtero: false, jaTeveAtividadeSexual: true, histerectomia: null, racaCor: null, imc: 26,
  tabagismo: { status: 'atual', macosAno: 30, anosDesdeCessacao: null }, condicoes: {},
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regra = (id: string, lungrads: string): RegraParametros => ({
  id, versao: '2026.1', fonte: 'ACR v2022', ano: 2022, condicao: { lungrads }, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: '', intervaloMeses: 12, mensagemPaciente: '',
});
const tc = (lungrads: string, extra: Record<string, unknown> = {}): ExameEntrada => ({ tipo: 'tcbd', programa: 'pulmao', dataRealizacao: '2026-09-01', resultado: { lungrads, ...extra } });

describe('pulmão — elegibilidade USPSTF 2021', () => {
  it('fumante atual, 30 maços-ano → 50–80', () => expect(pulmao.faixaEtaria!(fumante)).toEqual({ min: 50, max: 80 }));
  it('ex-fumante que parou há 10 anos → elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'ex', macosAno: 25, anosDesdeCessacao: 10 } })).toEqual({ min: 50, max: 80 }));
  it('parou há exatamente 15 anos → ainda elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'ex', macosAno: 25, anosDesdeCessacao: 15 } })).toEqual({ min: 50, max: 80 }));
  it('parou há 16 anos → não elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'ex', macosAno: 25, anosDesdeCessacao: 16 } })).toBeNull());
  it('15 maços-ano → não elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'atual', macosAno: 15, anosDesdeCessacao: null } })).toBeNull());
  it('exatamente 20 maços-ano → elegível', () => expect(pulmao.faixaEtaria!({ ...fumante, tabagismo: { status: 'atual', macosAno: 20, anosDesdeCessacao: null } })).toEqual({ min: 50, max: 80 }));
  it('nunca fumou → não elegível, mensagem explica os critérios', () => {
    const p = { ...fumante, tabagismo: { status: 'nunca' as const, macosAno: null, anosDesdeCessacao: null } };
    expect(pulmao.faixaEtaria!(p)).toBeNull();
    expect(pulmao.mensagemNaoElegivel!(p)).toMatch(/20 maços-ano/);
  });
  it('maços-ano desconhecido em fumante → pede o dado', () => {
    const p = { ...fumante, tabagismo: { status: 'atual' as const, macosAno: null, anosDesdeCessacao: null } };
    expect(pulmao.faixaEtaria!(p)).toBeNull();
    expect(pulmao.mensagemNaoElegivel!(p)).toMatch(/cigarros por dia/);
  });
  it('ex-fumante sem data de cessação → pede o dado', () => {
    const p = { ...fumante, tabagismo: { status: 'ex' as const, macosAno: 30, anosDesdeCessacao: null } };
    expect(pulmao.faixaEtaria!(p)).toBeNull();
    expect(pulmao.mensagemNaoElegivel!(p)).toMatch(/quando parou/i);
  });
});

describe('pulmão — Lung-RADS v2022', () => {
  const regras = ['0', '1', '2', '3', '4A', '4B', '4X'].map((c) => regra(`lr${c}`, c));
  it('casa pela categoria', () => expect(pulmao.selecionarRegra(tc('4A'), regras, fumante, ctx)?.id).toBe('lr4A'));
  it('modificador S não altera a categoria', () => expect(pulmao.selecionarRegra(tc('2', { modificador_s: true }), regras, fumante, ctx)?.id).toBe('lr2'));
  it('categoria desconhecida → null', () => expect(pulmao.selecionarRegra(tc('5'), regras, fumante, ctx)).toBeNull());
});
