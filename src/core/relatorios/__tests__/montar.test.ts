import { SECOES_CARDIO, SECOES_ONCOLOGICO } from '../especialidades';
import { montarCardio, montarConsulta, montarGeral, montarOncologico } from '../montar';
import { SEM_REGISTROS, type SecaoRelatorio } from '../tipos';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const chaves = (s: SecaoRelatorio[]) => s.map((x) => x.chave);
const textoDe = (s: SecaoRelatorio[]) => JSON.stringify(s);

describe('montarCardio', () => {
  const s = montarCardio(dadosNeroTeste(), PERIODO_TESTE);
  test('seções na ordem do §26 (+ pendências abertas ao final)', () => expect(chaves(s)).toEqual([...SECOES_CARDIO, 'pendencias']));
  test('tabela de medicações só com as ativas e "desde quando"', () => {
    const b = s.find((x) => x.chave === 'medicamentos')!.blocos[0];
    expect(b.tipo).toBe('tabela');
    if (b.tipo === 'tabela') { expect(b.linhas.map((l) => l[0])).toEqual(['Losartana', 'Metformina']); expect(b.linhas[0][3]).toBe('01/03/2024'); }
  });
  test('PA traz média e barras; MRPA traz médias e chip acima da referência', () => {
    expect(textoDe(s)).toContain('média 130/83 mmHg');
    const mrpa = s.find((x) => x.chave === 'mrpa')!;
    expect(mrpa.blocos.some((b) => b.tipo === 'chip' && b.texto.includes('acima da referência'))).toBe(true);
  });
  test('laboratório usa o último por tipo e mostra anteriores', () => {
    const lip = s.find((x) => x.chave === 'lipidios')!.blocos[0];
    if (lip.tipo !== 'tabela') throw new Error('esperava tabela');
    const ldl = lip.linhas.find((l) => l[0].startsWith('LDL'))!;
    expect(ldl[1]).toBe('118 mg/dL');
    expect(ldl[4]).toContain('140 mg/dL (15/08/2025)');
  });
  test('pendência aberta aparece mesmo no cardio', () => expect(chaves(s)).toContain('pendencias'));
  test('parâmetro apenas: só MRPA além do bloco base', () => expect(chaves(montarCardio(dadosNeroTeste(), PERIODO_TESTE, { apenas: ['mrpa'] }))).toEqual(['perfil', 'medicamentos', 'mrpa', 'pendencias']));
});

describe('montarOncologico', () => {
  const s = montarOncologico(dadosNeroTeste(), PERIODO_TESTE);
  test('ordem do §40 (perfil, história familiar, programas…) + pendências', () => expect(chaves(s)).toEqual([...SECOES_ONCOLOGICO, 'pendencias']));
  test('programa traz situação, exames e próxima recomendação', () => {
    const mama = s.find((x) => x.chave === 'mama')!;
    expect(textoDe([mama])).toContain('Em dia');
    expect(textoDe([mama])).toContain('BI-RADS 1');
    expect(textoDe([mama])).toContain('Repetir em 12 meses (10/05/2027)');
  });
  test('pendência aberta destacada como chip no programa', () => {
    const cr = s.find((x) => x.chave === 'colorretal')!;
    expect(cr.blocos.some((b) => b.tipo === 'chip' && b.nivel === 'laranja' && b.texto.includes('colonoscopia'))).toBe(true);
  });
  test('programa sem dados → "Sem registros no período"', () => {
    const pulmao = s.find((x) => x.chave === 'pulmao')!;
    expect(pulmao.blocos).toEqual([{ tipo: 'texto', texto: SEM_REGISTROS }]);
  });
});

describe('montarGeral', () => {
  test('união sem repetir e com consultas', () => {
    const c = chaves(montarGeral(dadosNeroTeste(), PERIODO_TESTE));
    expect(new Set(c).size).toBe(c.length);
    expect(c).toEqual(expect.arrayContaining([...SECOES_CARDIO, ...SECOES_ONCOLOGICO, 'consultas']));
  });
});

describe('montarConsulta (D-009)', () => {
  test('cardiologia começa pelo bloco sempre presente e segue as prioridades', () => {
    expect(chaves(montarConsulta(dadosNeroTeste(), 'cardiologia', PERIODO_TESTE))).toEqual(['perfil', 'medicamentos', 'documentos', 'mrpa', 'pa', 'glicemia', 'lipidios', 'renal', 'exames_cardio', 'prevent', 'agravantes', 'pendencias']);
  });
  test('mastologia não traz PA nem glicemia, mas traz a pendência aberta', () => {
    const c = chaves(montarConsulta(dadosNeroTeste(), 'mastologia', PERIODO_TESTE));
    expect(c).not.toContain('pa'); expect(c).not.toContain('glicemia');
    expect(c).toEqual(['perfil', 'medicamentos', 'documentos', 'mama', 'hist_familiar', 'pendencias']);
  });
  test('outra = relatório geral', () => expect(montarConsulta(dadosNeroTeste(), 'outra', PERIODO_TESTE)).toEqual(montarGeral(dadosNeroTeste(), PERIODO_TESTE)));
  test('sem dados de PA → texto padrão', () => {
    const d = dadosNeroTeste(); d.medidasPA = [];
    expect(montarConsulta(d, 'cardiologia', PERIODO_TESTE).find((x) => x.chave === 'pa')!.blocos).toEqual([{ tipo: 'texto', texto: SEM_REGISTROS }]);
  });
});
