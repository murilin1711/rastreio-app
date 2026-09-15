import { classificarExame, regraCasa } from '../classificar';
import type { ContextoAvaliacao, ExameEntrada, PerfilRegras, RegraParametros } from '../tipos';

const vazio: ContextoAvaliacao = { sintomasAlarme: [], pendenciasAbertas: [], emAcompanhamentoEspecializado: [], historicoExames: [], colonoscopiaAdequadaEm: null };
const perfil: PerfilRegras = {
  idade: 52, sexoNascimento: 'feminino', possuiColoUtero: true, jaTeveAtividadeSexual: true, histerectomia: false, racaCor: null, imc: null,
  tabagismo: { status: 'nunca', macosAno: null, anosDesdeCessacao: null },
  condicoes: {}, historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, antecedentes: [],
};
const regraB1: RegraParametros = { id: 'b1', versao: '1', fonte: 'T', ano: 2026, condicao: { birads: 1 }, classificacao: 'normal', nivelAlerta: 'verde', proximaAcao: 'Nova mamografia', intervaloMeses: 12, mensagemPaciente: 'Sem achados suspeitos.' };
const regraB4: RegraParametros = { id: 'b4', versao: '1', fonte: 'T', ano: 2026, condicao: { birads: 4 }, classificacao: 'investigacao', nivelAlerta: 'laranja', proximaAcao: 'Avaliação médica', intervaloMeses: null, mensagemPaciente: 'Achado que necessita investigação.' };
const mamo = (birads: number): ExameEntrada => ({ tipo: 'mamografia', programa: 'mama', dataRealizacao: '2026-09-01', resultado: { birads } });

describe('regraCasa', () => {
  it('casa quando todos os campos da condição são iguais no resultado', () => {
    expect(regraCasa(regraB1, mamo(1))).toBe(true);
    expect(regraCasa(regraB1, mamo(2))).toBe(false);
  });
  it('ignora chaves de faixa etária e não casa condição vazia', () => {
    expect(regraCasa({ ...regraB1, condicao: { idade_min: 40 } }, mamo(1))).toBe(false);
  });
});

describe('classificarExame (§42/§53)', () => {
  it('BI-RADS 1 → normal, verde, próxima data +12 meses, sem pendência', () => {
    const r = classificarExame(mamo(1), perfil, vazio, [regraB1, regraB4]);
    expect(r).toMatchObject({ classificacao: 'normal', nivelAlerta: 'verde', dataProximaAcao: '2027-09-01', abrePendencia: false, regraId: 'b1', regraVersao: '1' });
  });

  it('BI-RADS 4 → investigação, laranja, abre pendência, sem data automática', () => {
    const r = classificarExame(mamo(4), perfil, vazio, [regraB1, regraB4]);
    expect(r).toMatchObject({ classificacao: 'investigacao', nivelAlerta: 'laranja', dataProximaAcao: null, abrePendencia: true, regraId: 'b4' });
  });

  it('sem regra para o resultado → pendente, cinza, abre pendência (§43.5)', () => {
    const r = classificarExame(mamo(9), perfil, vazio, [regraB1]);
    expect(r).toMatchObject({ classificacao: 'pendente', nivelAlerta: 'cinza', abrePendencia: true, regraId: null });
  });

  it('sintoma de alarme sobrepõe regra normal (§52)', () => {
    const r = classificarExame(mamo(1), perfil, { ...vazio, sintomasAlarme: ['nodulo_mamario'] }, [regraB1]);
    expect(r.motivoSeguranca).toBe('sintoma_alarme');
    expect(r.nivelAlerta).toBe('vermelho');
    expect(r.dataProximaAcao).toBeNull();
  });

  it('classificação especializada abre pendência e não calcula data mesmo com intervalo', () => {
    const regraB6: RegraParametros = { ...regraB4, id: 'b6', condicao: { birads: 6 }, classificacao: 'especializado', nivelAlerta: 'vermelho', intervaloMeses: 12 };
    const r = classificarExame(mamo(6), perfil, vazio, [regraB6]);
    expect(r).toMatchObject({ classificacao: 'especializado', dataProximaAcao: null, abrePendencia: true });
  });

  it('classificação controle calcula data (ex.: BI-RADS 3 em 6 meses)', () => {
    const regraB3: RegraParametros = { ...regraB1, id: 'b3', condicao: { birads: 3 }, classificacao: 'controle', nivelAlerta: 'amarelo', intervaloMeses: 6 };
    const r = classificarExame(mamo(3), perfil, vazio, [regraB3]);
    expect(r).toMatchObject({ classificacao: 'controle', dataProximaAcao: '2027-03-01', abrePendencia: false });
  });

  it('usa o handler do programa para selecionar a regra quando existir', () => {
    const handlers = { mama: { aplicavel: () => true, fatoresModificadores: () => null, selecionarRegra: () => regraB4 } };
    expect(classificarExame(mamo(1), perfil, vazio, [regraB1, regraB4], handlers).regraId).toBe('b4');
  });
});
