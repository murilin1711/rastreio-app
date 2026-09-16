import { avaliarElegibilidade, somarMeses } from '../elegibilidade';
import type { ContextoAvaliacao, PerfilRegras, RegraParametros } from '../tipos';

const hoje = new Date('2026-09-15T12:00:00Z');
const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const perfilBase: PerfilRegras = {
  idade: 45,
  sexoNascimento: 'feminino',
  possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false, racaCor: null, imc: null,
  tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null },
  condicoes: {},
  historicoCancerPessoal: [],
  lesoesPrecursoras: [],
  doencasGeneticas: [],
  radioterapiaToracica: false,
  antecedentes: [],
};
const regraFaixa: RegraParametros = {
  id: 'r-mama-faixa', versao: '2026.1', fonte: 'Teste', ano: 2026,
  condicao: { idade_min: 40, idade_max: 74 },
  classificacao: 'normal', nivelAlerta: 'verde',
  proximaAcao: 'Realizar mamografia', intervaloMeses: 12,
  mensagemPaciente: 'Você está na faixa etária de rastreamento.',
};
const exameNormal = (data: string) => ({ id: 'e1', tipo: 'mamografia', programa: 'mama' as const, dataRealizacao: data, resultado: { birads: 1 }, classificacao: 'normal' as const });

describe('somarMeses', () => {
  it('soma meses preservando o dia', () => expect(somarMeses('2026-03-10', 12)).toBe('2027-03-10'));
  it('vira o ano', () => expect(somarMeses('2026-11-15', 3)).toBe('2027-02-15'));
});

describe('avaliarElegibilidade (§28)', () => {
  it('dentro da faixa, sem exame → indicado', () => {
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], vazio, hoje);
    expect(r.status).toBe('indicado');
    expect(r.regraId).toBe('r-mama-faixa');
  });

  it('faltam ≤ 2 anos para a faixa → próximo de iniciar', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 38 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('proximo_de_iniciar');
  });

  it('muito jovem → não indicado no momento', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 25 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('nao_indicado_no_momento');
  });

  it('acima da faixa → acompanhamento médico', () => {
    expect(avaliarElegibilidade({ ...perfilBase, idade: 80 }, 'mama', [regraFaixa], vazio, hoje).status).toBe('acompanhamento_medico');
  });

  it('sem colo do útero → não aplicável para colo_utero', () => {
    const r = avaliarElegibilidade({ ...perfilBase, possuiColoUtero: false }, 'colo_utero', [{ ...regraFaixa, id: 'r-colo', condicao: { idade_min: 25, idade_max: 64 } }], vazio, hoje);
    expect(r.status).toBe('nao_indicado_no_momento');
    expect(r.mensagem).toMatch(/não é aplicável ao seu perfil/);
  });

  it('próstata só para sexo masculino', () => {
    expect(avaliarElegibilidade(perfilBase, 'prostata', [{ ...regraFaixa, id: 'r-prost', condicao: { idade_min: 50, idade_max: 75 } }], vazio, hoje).status).toBe('nao_indicado_no_momento');
  });

  it('sintoma de alarme → acompanhamento médico com mensagem de segurança', () => {
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], { ...vazio, sintomasAlarme: ['nodulo_mamario'] }, hoje);
    expect(r.status).toBe('acompanhamento_medico');
    expect(r.mensagem).toMatch(/Não espere/);
  });

  it('exame normal recente → em dia, próxima data = data + intervalo', () => {
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], { ...vazio, historicoExames: [exameNormal('2026-03-10')] }, hoje);
    expect(r.status).toBe('em_dia');
    expect(r.proximaData).toBe('2027-03-10');
  });

  it('próxima data em ≤ 60 dias → exame próximo', () => {
    expect(avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], { ...vazio, historicoExames: [exameNormal('2025-10-01')] }, hoje).status).toBe('exame_proximo');
  });

  it('próxima data passada → exame atrasado', () => {
    expect(avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], { ...vazio, historicoExames: [exameNormal('2025-01-01')] }, hoje).status).toBe('exame_atrasado');
  });

  it('sem regra cadastrada → avaliação individualizada', () => {
    expect(avaliarElegibilidade(perfilBase, 'mama', [], vazio, hoje).status).toBe('avaliacao_individualizada');
  });

  it('handler com fator modificador → avaliação individualizada', () => {
    const handlers = { mama: { aplicavel: () => true, fatoresModificadores: () => 'Mutação BRCA: protocolo individualizado.', selecionarRegra: () => null } };
    const r = avaliarElegibilidade(perfilBase, 'mama', [regraFaixa], vazio, hoje, handlers);
    expect(r.status).toBe('avaliacao_individualizada');
    expect(r.mensagem).toMatch(/BRCA/);
  });

  it('usa faixaEtaria do handler quando existir (ex.: 45 para alto risco)', () => {
    const handlers = { prostata: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => ({ min: 45, max: 75 }) } };
    const perfilM = { ...perfilBase, sexoNascimento: 'masculino' as const, idade: 46 };
    const r = avaliarElegibilidade(perfilM, 'prostata', [{ ...regraFaixa, id: 'r-prost', condicao: { idade_min: 50, idade_max: 75 } }], vazio, hoje, handlers);
    expect(r.status).toBe('indicado');
  });

  it('faixaEtaria null → não indicado no momento com mensagem do handler', () => {
    const handlers = { pulmao: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => null, mensagemNaoElegivel: () => 'Critérios de tabagismo não atendidos.' } };
    const r = avaliarElegibilidade(perfilBase, 'pulmao', [regraFaixa], vazio, hoje, handlers);
    expect(r.status).toBe('nao_indicado_no_momento');
    expect(r.mensagem).toMatch(/tabagismo/);
  });

  it('max null → nunca "acima da faixa"', () => {
    const handlers = { colo_utero: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => null, faixaEtaria: () => ({ min: 25, max: null }) } };
    expect(avaliarElegibilidade({ ...perfilBase, idade: 70 }, 'colo_utero', [regraFaixa], vazio, hoje, handlers).status).toBe('indicado');
  });
});
