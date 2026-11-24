import { SECOES_BEMESTAR, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO } from '../especialidades';
import { montarBemEstar, montarCardio, montarConsulta, montarGeral, montarOncologico, tituloRelatorio } from '../montar';
import { type ChaveSecao, type SecaoRelatorio } from '../tipos';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const chaves = (s: SecaoRelatorio[]) => s.map((x) => x.chave);
const textoDe = (s: SecaoRelatorio[]) => JSON.stringify(s);

describe('montarCardio', () => {
  const s = montarCardio(dadosNeroTeste(), PERIODO_TESTE);
  test('seções na ordem do §26 (+ pendências abertas ao final)', () => expect(chaves(s)).toEqual([...SECOES_CARDIO, 'pendencias']));
  test('tabela de remédios só com os ativos, horários e "se precisar"', () => {
    const b = s.find((x) => x.chave === 'medicamentos')!.blocos[0];
    if (b.tipo !== 'tabela') throw new Error('esperava tabela');
    expect(b.linhas.map((l) => l[0])).toEqual(['Losartana', 'Metformina', 'Dipirona']);
    expect(b.linhas[0][2]).toBe('08:00');
    expect(b.linhas[1][2]).toBe('08:00, 20:00');
    expect(b.linhas[2][2]).toBe('se precisar');
    expect(b.linhas[0][3]).toBe('01/03/2024');
  });
  test('seção de remédios traz o resumo de 4 semanas', () => expect(textoDe([s.find((x) => x.chave === 'medicamentos')!])).toContain('Semana de 12/09'));
  test('PA traz média; MRPA traz médias e chip acima da referência', () => {
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
  test('ordem do §40 (perfil, história familiar, programas…) + pendências', () => expect(chaves(s)).toEqual(SECOES_ONCOLOGICO.filter((c) => !['colo', 'pulmao', 'prostata'].includes(c)).concat('pendencias')));
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
  test('seções sem registro não entram', () => expect(chaves(s)).toEqual(['perfil', 'hist_familiar', 'tabagismo', 'rastreamentos_status', 'mama', 'colorretal', 'sintomas', 'documentos', 'pendencias']));
});

describe('montarGeral', () => {
  test('união sem repetir e com consultas', () => {
    const c = chaves(montarGeral(dadosNeroTeste(), PERIODO_TESTE));
    expect(new Set(c).size).toBe(c.length);
    // Sem registro (D-067), colo, pulmão e próstata não entram com os dados de teste.
    expect(c).toEqual(expect.arrayContaining([...SECOES_CARDIO, ...SECOES_ONCOLOGICO, 'consultas'].filter((x) => !['colo', 'pulmao', 'prostata'].includes(x))));
  });
  /**
   * O geral é o documento que promete tudo. `agua` tinha ficado de fora dele até 23/09/2026 (D-025).
   * Este teste quebra sozinho quando uma seção nova nascer sem entrar no geral.
   */
  test('contém todas as seções que o app sabe montar', () => {
    // Duas ficam de fora de propósito: `peso`, construtor órfão de antes da Fase 4 cuja informação a
    // seção `corpo` já traz por inteiro; e `pendencias`, que não entra por lista nenhuma — `montarPor`
    // a anexa a qualquer relatório quando há pendência aberta (§66).
    const todas: ChaveSecao[] = [...SECOES_CARDIO, ...SECOES_ONCOLOGICO, ...SECOES_BEMESTAR, 'consultas'];
    expect(SECOES_GERAL).toEqual(expect.arrayContaining(Array.from(new Set(todas))));
  });
});

describe('rastreamento que não se aplica ao perfil (D-026)', () => {
  /** Próstata num perfil feminino: a regra devolve `naoAplicavel`. Papel em branco não ajuda ninguém. */
  const comNaoAplicavel = () => {
    const d = dadosNeroTeste();
    d.avaliacoes.prostata = { programa: 'prostata', status: 'nao_indicado_no_momento', mensagem: 'Este rastreamento não é aplicável ao seu perfil atual.', regraId: null, regraVersao: null, proximaData: null, naoAplicavel: true };
    return d;
  };

  test('a seção do programa não entra no relatório', () => {
    expect(chaves(montarOncologico(comNaoAplicavel(), PERIODO_TESTE))).not.toContain('prostata');
  });

  test('e some também da tabela de rastreamentos', () => {
    const t = montarOncologico(comNaoAplicavel(), PERIODO_TESTE).find((x) => x.chave === 'rastreamentos_status')!.blocos[0];
    expect(t.tipo).toBe('tabela');
    if (t.tipo === 'tabela') expect(JSON.stringify(t.linhas)).not.toContain('róstata');
  });

  test('mas "fora da faixa etária" continua aparecendo — é informação, não ruído', () => {
    const d = dadosNeroTeste();
    d.avaliacoes.prostata = { programa: 'prostata', status: 'nao_indicado_no_momento', mensagem: 'Você ainda não está na faixa etária habitual de rastreamento.', regraId: null, regraVersao: null, proximaData: null };
    expect(chaves(montarOncologico(d, PERIODO_TESTE))).toContain('prostata');
  });

  test('se houver exame registrado, a seção fica mesmo não sendo aplicável', () => {
    const d = comNaoAplicavel();
    d.examesRastreamento = [...d.examesRastreamento, { id: 'e9', programa: 'prostata', tipo: 'psa', dataRealizacao: '2026-01-10', classificacao: 'normal', resultado: {}, proximaAcao: null, dataProximaAcao: null } as never];
    expect(chaves(montarOncologico(d, PERIODO_TESTE))).toContain('prostata');
  });
});

describe('montarConsulta (D-009, revista em D-025)', () => {
  test('cardiologia: bloco sempre presente, prioridades na ordem, e o resto atrás', () => {
    const c = chaves(montarConsulta(dadosNeroTeste(), 'cardiologia', PERIODO_TESTE));
    expect(c.slice(0, 16)).toEqual(['perfil', 'medicamentos', 'documentos', 'mrpa', 'pa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'corpo', 'tabagismo', 'exames_cardio', 'prevent', 'agravantes', 'checkup', 'pendencias']);
    expect(new Set(c).size).toBe(c.length);
  });
  test('mastologia começa curta, mas o que ficou de fora vem no complemento', () => {
    const s = montarConsulta(dadosNeroTeste(), 'mastologia', PERIODO_TESTE);
    const c = chaves(s);
    expect(c.slice(0, 8)).toEqual(['perfil', 'medicamentos', 'documentos', 'mama', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas']);
    // O que não é da mastologia sai da frente, mas não some do documento (D-025).
    expect(c).toContain('pa');
    expect(new Set(c).size).toBe(c.length);
  });
  test('a primeira seção do complemento é a única marcada, e vem depois do foco', () => {
    const s = montarConsulta(dadosNeroTeste(), 'mastologia', PERIODO_TESTE);
    const marcadas = s.filter((x) => x.abreComplemento);
    expect(marcadas).toHaveLength(1);
    expect(s.indexOf(marcadas[0])).toBeGreaterThan(s.findIndex((x) => x.chave === 'mama'));
  });
  test('sem medidas de PA, a seção some também do foco da cardiologia', () => { const d = dadosNeroTeste(); d.medidasPA = []; expect(chaves(montarConsulta(d, 'cardiologia', PERIODO_TESTE))).not.toContain('pa'); });
  test('"Nenhum sintoma…" não é seção vazia: fica', () => { const d = dadosNeroTeste(); d.sintomas = []; expect(montarConsulta(d, 'mastologia', PERIODO_TESTE).find((x) => x.chave === 'sintomas')!.blocos).toEqual([{ tipo: 'texto', texto: 'Nenhum sintoma de alerta registrado.' }]); });
  test('outra = relatório geral', () => expect(montarConsulta(dadosNeroTeste(), 'outra', PERIODO_TESTE)).toEqual(montarGeral(dadosNeroTeste(), PERIODO_TESTE)));
});

describe('montarBemEstar (§88) e integrações da Fase 4', () => {
  const s = montarBemEstar(dadosNeroTeste(), PERIODO_TESTE);
  test('seções na ordem + pendências', () => expect(chaves(s)).toEqual([...SECOES_BEMESTAR, 'pendencias']));
  test('água entra no relatório de hábitos, com média por dia registrado e dias que bateram a meta (D-020)', () => {
    const agua = s.find((x) => x.chave === 'agua');
    expect(agua).toBeDefined();
    const t = textoDe([agua!]);
    expect(t).toContain('1.983 ml');  // 5950 / 3 dias registrados, não / 7
    expect(t).toContain('2 de 3');     // dias que bateram a meta de 2450 ml
  });
  test('a sequência de dias seguidos NÃO entra no relatório (D-020): é adesão ao app, não achado clínico', () => {
    expect(textoDe(s)).not.toMatch(/sequência|dias seguidos/i);
  });
  test('corpo: IMC com faixa, cintura com RCA, tendência e tabela', () => {
    const t = textoDe([s.find((x) => x.chave === 'corpo')!]);
    expect(t).toContain('Peso atual 82,0 kg');
    expect(t).toContain('IMC 28,4: Sobrepeso');
    expect(t).toContain('relação cintura/altura 0,56 (acima de 0,5)');
    expect(t).toContain('Tendência do peso: redução');
  });
  test('atividade: semana com minutos que contam e meta', () => {
    const t = textoDe([s.find((x) => x.chave === 'atividade')!]);
    expect(t).toContain('90 / 150');
    expect(t).toContain('Musculação');
  });
  test('sono, alimentação e check-ins presentes; vazio quando não há dados', () => {
    expect(textoDe([s.find((x) => x.chave === 'sono')!])).toContain('6h40');
    expect(textoDe([s.find((x) => x.chave === 'alimentacao')!])).toContain('arroz, feijão e frango');
    expect(textoDe([s.find((x) => x.chave === 'checkins')!])).toContain('semana corrida');
    const d = dadosNeroTeste(); d.bemEstar!.sonos = [];
    expect(chaves(montarBemEstar(d, PERIODO_TESTE))).not.toContain('sono');
  });
  test('glicemia mostra a refeição vinculada (C-020)', () => {
    const g = montarCardio(dadosNeroTeste(), PERIODO_TESTE).find((x) => x.chave === 'glicemia')!;
    const tabela = g.blocos.find((b) => b.tipo === 'tabela');
    expect(tabela && tabela.tipo === 'tabela' ? tabela.linhas.find((l) => l[1] === '168')?.[4] : null).toBe('almoço 12:30');
  });
  test('consulta de endocrinologia inclui corpo e atividade', () => {
    const c = chaves(montarConsulta(dadosNeroTeste(), 'endocrinologia', PERIODO_TESTE));
    expect(c).toContain('corpo'); expect(c).toContain('atividade');
  });
});

describe('detalhe mais curto (D-067)', () => {
  test('títulos com os nomes novos da navegação', () => {
    expect(tituloRelatorio('cardio')).toBe('Relatório de pressão, coração e diabetes');
    expect(tituloRelatorio('oncologico')).toBe('Relatório de exames de prevenção');
    expect(tituloRelatorio('bemestar')).toBe('Relatório de hábitos e bem-estar');
  });
  test('seção de status da prevenção com o nome novo (X3)', () => {
    expect(montarOncologico(dadosNeroTeste(), PERIODO_TESTE).find((x) => x.chave === 'rastreamentos_status')!.titulo).toBe('Exames de prevenção aplicáveis');
  });
  test('sem barras repetindo tabela em PA, água e atividade', () => {
    const g = montarGeral(dadosNeroTeste(), PERIODO_TESTE);
    for (const c of ['pa', 'agua', 'atividade'] as const) expect(g.find((x) => x.chave === c)!.blocos.some((b) => b.tipo === 'barras')).toBe(false);
  });
  test('MRPA mantém as barras por dia', () => {
    expect(montarGeral(dadosNeroTeste(), PERIODO_TESTE).find((x) => x.chave === 'mrpa')!.blocos.some((b) => b.tipo === 'barras')).toBe(true);
  });
  test('sem termos internos', () => {
    const t = textoDe(montarGeral(dadosNeroTeste(), PERIODO_TESTE));
    expect(t).not.toMatch(/"medicacao"|bioimpedancia/); expect(t).toContain('bioimpedância'); expect(t).toContain('remédios');
  });
});

test('"Medicamentos em uso" só com ativos; interrompido nas 4 semanas fica na adesão, também sem nenhum ativo (I3)', () => {
  const d = dadosNeroTeste();
  d.medicacoes = d.medicacoes.map((m) => (m.id === 'm3' ? { ...m, ate: '2026-09-10', horariosDesde: '2026-01-01' } : m));
  const sec = montarGeral(d, PERIODO_TESTE).find((x) => x.chave === 'medicamentos')!;
  const uso = sec.blocos[0];
  if (uso.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(uso.linhas.map((l) => l[0])).toEqual(['Losartana', 'Metformina', 'Dipirona']);
  expect(textoDe([sec])).toContain('Sinvastatina 20 mg (interrompido em 10/09)');
  d.medicacoes = d.medicacoes.filter((m) => m.id === 'm3');
  const so = montarGeral(d, PERIODO_TESTE).find((x) => x.chave === 'medicamentos')!;
  expect(so.blocos[0]).toEqual({ tipo: 'texto', texto: 'Nenhum medicamento cadastrado.' });
  expect(textoDe([so])).toContain('Sinvastatina 20 mg (interrompido em 10/09)');
});
