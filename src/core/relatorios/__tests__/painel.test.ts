import { DIAS_ADESAO_PAINEL, linhasAdesao } from '../adesaoRelatorio';
import { SECOES_BEMESTAR, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO } from '../especialidades';
import { condicoesInformadas, montarBemEstar, montarCardio, montarGeral, textoTabagismo } from '../montar';
import { LIMITE_ATENCAO, cartoesDoPainel, escopoDoRelatorio, itensAtencao, montarPainel, prevencaoDoPainel, seriePressao, type OpcoesPainel } from '../painel';
import type { LinhaAdesao } from '../tipos';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const adesao = (d = dadosNeroTeste()) => linhasAdesao(d);
const linha = (nome: string, doses: LinhaAdesao['doses'], x: Partial<LinhaAdesao> = {}): LinhaAdesao => ({
  medicacaoId: nome, nome, dose: null, sePrecisar: false, interrompidoEm: null, doses, tomou: 0, previstas: doses.length, errado: 0, percentual: null, usosSePrecisar: 0, ...x,
});

test('geral com os dados de teste: pendência, MRPA e os dois remédios, nessa ordem', () => {
  const d = dadosNeroTeste();
  expect(itensAtencao(d, escopoDoRelatorio({ tipo: 'geral' }), PERIODO_TESTE, adesao(d))).toEqual([
    'Intestino (colorretal): FIT positivo: colonoscopia indicada (aberta em 20/08/2026)',
    'Média da MRPA acima da referência domiciliar (130/80 mmHg): 131/83 mmHg',
    'Losartana: 4 doses não tomadas em 14 dias',
    'Metformina: 1 dose errada em 14 dias',
  ]);
});
test('oncológico e hábitos sem sintoma aberto só trazem a pendência (§66)', () => {
  for (const tipo of ['oncologico', 'bemestar'] as const) {
    expect(itensAtencao(dadosNeroTeste(), escopoDoRelatorio({ tipo }), PERIODO_TESTE, adesao())).toEqual(['Intestino (colorretal): FIT positivo: colonoscopia indicada (aberta em 20/08/2026)']);
  }
});
test('pendência entra mesmo com escopo vazio', () => {
  expect(itensAtencao(dadosNeroTeste(), [], PERIODO_TESTE, adesao())).toHaveLength(1);
});
test('pressão avulsa só a partir de 180/110 (C-010)', () => {
  const d = dadosNeroTeste();
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, []).some((x) => x.includes('medida avulsa'))).toBe(false); // 140/90 não entra
  d.medidasPA.push({ id: 'pa7', medidoEm: '2026-09-07T08:00:00.000Z', pas: 182, pad: 100, fc: 70, sessaoId: null, contexto: {} });
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, [])).toContain('1 medida avulsa com PAS ≥ 180 e/ou PAD ≥ 110 mmHg no período (maior: 182/100 em 07/09/2026)');
  d.medidasPA.push({ id: 'pa8', medidoEm: '2026-09-08T08:00:00.000Z', pas: 170, pad: 112, fc: 70, sessaoId: null, contexto: {} });
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, [])).toContain('2 medidas avulsas com PAS ≥ 180 e/ou PAD ≥ 110 mmHg no período (maior: 182/100 em 07/09/2026)');
});
test('pressão avulsa: medida excluída, de sessão MRPA ou sem parâmetros não entra', () => {
  const d = dadosNeroTeste();
  d.medidasPA.push({ id: 'pa7', medidoEm: '2026-09-07T08:00:00.000Z', pas: 190, pad: 100, fc: 70, sessaoId: null, contexto: { excluida: true } });
  d.medidasPA.push({ id: 'pa8', medidoEm: '2026-09-08T08:00:00.000Z', pas: 190, pad: 100, fc: 70, sessaoId: 's1', contexto: {} });
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, []).filter((x) => x.includes('avulsa'))).toEqual([]);
  d.medidasPA.push({ id: 'pa9', medidoEm: '2026-09-09T08:00:00.000Z', pas: 190, pad: 100, fc: 70, sessaoId: null, contexto: {} });
  d.parametrosPressao = null;
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, []).filter((x) => x.includes('avulsa'))).toEqual([]);
});
test('MRPA: vale a última sessão; inválida ou dentro da referência não entra', () => {
  const d = dadosNeroTeste();
  const s = d.sessoesMrpa[0];
  d.sessoesMrpa.push({ ...s, id: 's2', inicio: '2026-09-01', resultado: { ...s.resultado!, acimaReferencia: false } });
  expect(itensAtencao(d, ['mrpa'], PERIODO_TESTE, []).some((x) => x.includes('MRPA'))).toBe(false);
  d.sessoesMrpa = [{ ...s, resultado: { ...s.resultado!, valido: false } }];
  expect(itensAtencao(d, ['mrpa'], PERIODO_TESTE, []).some((x) => x.includes('MRPA'))).toBe(false);
});
test('glicemias fora da meta são contadas', () => {
  const d = dadosNeroTeste();
  d.glicemias.push({ id: 'g5', medidoEm: '2026-09-03T07:00:00.000Z', mgdl: 150, momento: 'jejum', contexto: {} });
  d.pendencias = [];
  expect(itensAtencao(d, ['glicemia'], PERIODO_TESTE, [])).toEqual(['1 glicemia fora da meta no período (0 abaixo, 1 acima)']);
  d.glicemias.push({ id: 'g6', medidoEm: '2026-09-04T07:00:00.000Z', mgdl: 70, momento: 'jejum', contexto: {} });
  expect(itensAtencao(d, ['glicemia'], PERIODO_TESTE, [])).toEqual(['2 glicemias fora da meta no período (1 abaixo, 1 acima)']);
  d.metasGlicemia = null;
  expect(itensAtencao(d, ['glicemia'], PERIODO_TESTE, [])).toEqual([]);
});
test('sintoma de alarme aberto entra sempre, antes das pendências, mesmo registrado antes do período (§66)', () => {
  const d = dadosNeroTeste();
  d.sintomas = [{ id: 's1', programa: 'mama', sintoma: 'nódulo palpável', registradoEm: '2026-09-02' }, { id: 's2', programa: 'mama', sintoma: 'secreção mamilar', registradoEm: '2025-01-01' }];
  for (const tipo of ['bemestar', 'cardio', 'geral'] as const) {
    expect(itensAtencao(d, escopoDoRelatorio({ tipo }), PERIODO_TESTE, []).slice(0, 3)).toEqual([
      'Sintoma de alerta registrado em 02/09/2026: nódulo palpável (Mama)',
      'Sintoma de alerta registrado em 01/01/2025: secreção mamilar (Mama)',
      'Intestino (colorretal): FIT positivo: colonoscopia indicada (aberta em 20/08/2026)',
    ]);
  }
});
test('com 5 pendências o sintoma de alarme não é cortado', () => {
  const d = dadosNeroTeste();
  d.pendencias = Array.from({ length: 5 }, (_, i) => ({ ...d.pendencias[0], id: `p${i}` }));
  d.sintomas = [{ id: 's1', programa: 'mama', sintoma: 'nódulo palpável', registradoEm: '2026-09-02' }];
  const a = itensAtencao(d, [], PERIODO_TESTE, []);
  expect(a).toHaveLength(5);
  expect(a[0]).toBe('Sintoma de alerta registrado em 02/09/2026: nódulo palpável (Mama)');
});
test('remédios: só fatos (não tomadas, sem registro, erradas), sem limite de percentual', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  const linhas = [
    linha('Losartana', ['nao_tomou', 'nao_tomou', 'sem_registro', 'tomou']),
    linha('Atenolol', ['tomou', 'tomou']),
    linha('Insulina', ['sem_registro', 'errado', 'errado']),
    linha('Dipirona', [], { sePrecisar: true, usosSePrecisar: 3 }),
    linha('Omeprazol', ['nao_tomou', 'tomou', 'tomou', 'tomou', 'tomou', 'tomou', 'tomou', 'tomou', 'tomou', 'tomou']),
  ];
  expect(itensAtencao(d, ['medicamentos'], PERIODO_TESTE, linhas)).toEqual([
    'Losartana: 2 doses não tomadas e 1 sem registro em 14 dias',
    'Insulina: 1 dose sem registro e 2 com dose errada em 14 dias',
    'Omeprazol: 1 dose não tomada em 14 dias',
  ]);
  expect(itensAtencao(d, ['medicamentos'], PERIODO_TESTE, [linha('X', ['nao_tomou', 'sem_registro', 'errado'])])).toEqual(['X: 1 dose não tomada, 1 sem registro e 1 com dose errada em 14 dias']);
  expect(itensAtencao(d, ['medicamentos'], PERIODO_TESTE, [linha('Y', ['errado', 'errado'])])).toEqual(['Y: 2 doses erradas em 14 dias']);
});
test('remédio só com doses sem registro não entra (R3-T4-a)', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  expect(itensAtencao(d, ['medicamentos'], PERIODO_TESTE, [linha('Losartana', ['sem_registro', 'sem_registro', 'tomou'])])).toEqual([]);
});
test('"em 14 dias" é a janela de linhasAdesao: dose não tomada 15 dias antes da geração não conta', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  d.tomadas = d.tomadas.map((t) => (t.medicacaoId === 'm1' && t.dataPrevista === '2026-09-04' ? { ...t, tomou: false, quantidade: null } : t));
  const l = linhasAdesao(d).find((x) => x.nome === 'Losartana')!;
  expect(DIAS_ADESAO_PAINEL).toBe(14);
  expect(l.doses).toHaveLength(DIAS_ADESAO_PAINEL);
  expect(itensAtencao(d, ['medicamentos'], PERIODO_TESTE, [l])).toEqual([`Losartana: 4 doses não tomadas em ${DIAS_ADESAO_PAINEL} dias`]);
});
test('MRPA usa a referência domiciliar dos parâmetros; sem parâmetros, 130/80', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  d.parametrosPressao = { ...d.parametrosPressao!, referenciaDomiciliar: { ...d.parametrosPressao!.referenciaDomiciliar, pas: 135, pad: 85 } };
  expect(itensAtencao(d, ['mrpa'], PERIODO_TESTE, [])).toEqual(['Média da MRPA acima da referência domiciliar (135/85 mmHg): 131/83 mmHg']);
  d.parametrosPressao = null;
  expect(itensAtencao(d, ['mrpa'], PERIODO_TESTE, [])).toEqual(['Média da MRPA acima da referência domiciliar (130/80 mmHg): 131/83 mmHg']);
});
test('remédios fora do escopo não entram', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  expect(itensAtencao(d, ['mrpa'], PERIODO_TESTE, [linha('Losartana', ['nao_tomou'])])).toEqual(['Média da MRPA acima da referência domiciliar (130/80 mmHg): 131/83 mmHg']);
});
test(`no máximo ${LIMITE_ATENCAO} itens, pendências primeiro`, () => {
  const d = dadosNeroTeste();
  d.pendencias = Array.from({ length: 6 }, (_, i) => ({ ...d.pendencias[0], id: `p${i}` }));
  const a = itensAtencao(d, escopoDoRelatorio({ tipo: 'geral' }), PERIODO_TESTE, adesao(d));
  expect(LIMITE_ATENCAO).toBe(5);
  expect(a).toHaveLength(5);
  expect(a.every((x) => x.startsWith('Intestino'))).toBe(true);
});
test('nenhum item quando não há nada', () => {
  const d = dadosNeroTeste();
  d.pendencias = []; d.sessoesMrpa = []; d.glicemias = [];
  expect(itensAtencao(d, SECOES_GERAL, PERIODO_TESTE, [])).toEqual([]);
});
test('escopo por tipo', () => {
  expect(escopoDoRelatorio({ tipo: 'geral' })).toEqual(SECOES_GERAL);
  expect(escopoDoRelatorio({ tipo: 'cardio' })).toEqual(SECOES_CARDIO);
  expect(escopoDoRelatorio({ tipo: 'oncologico' })).toEqual(SECOES_ONCOLOGICO);
  expect(escopoDoRelatorio({ tipo: 'bemestar' })).toEqual(SECOES_BEMESTAR);
  expect(escopoDoRelatorio({ tipo: 'consulta' })).toEqual(SECOES_GERAL);
});
test('escopo: cardio com apenas, consulta por especialidade, "outra" = geral', () => {
  expect(escopoDoRelatorio({ tipo: 'cardio', apenas: ['mrpa'] })).toEqual(['perfil', 'medicamentos', 'mrpa']);
  expect(escopoDoRelatorio({ tipo: 'consulta', especialidade: 'mastologia' })).toEqual(['perfil', 'medicamentos', 'documentos', 'mama', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas']);
  expect(escopoDoRelatorio({ tipo: 'consulta', especialidade: 'outra' })).toEqual(SECOES_GERAL);
});
test('cardio com apenas ["mrpa"]: o painel não traz glicemia', () => {
  const d = dadosNeroTeste();
  d.pendencias = [];
  d.glicemias.push({ id: 'g5', medidoEm: '2026-09-03T07:00:00.000Z', mgdl: 150, momento: 'jejum', contexto: {} });
  const a = itensAtencao(d, escopoDoRelatorio({ tipo: 'cardio', apenas: ['mrpa'] }), PERIODO_TESTE, adesao(d));
  expect(a.some((x) => x.includes('glicemia'))).toBe(false);
  expect(a[0]).toContain('MRPA');
});

// ——— painel completo (Task 5, sem selos: Ruling S0) ———
const geral = () => montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE });
test('cabeçalho', () => {
  expect(geral().cabecalho).toEqual({ nome: 'Ana Souza', idade: 51, sexo: 'feminino', condicoes: ['hipertensão', 'diabetes (DM2)'], tabagismo: 'ex-fumante · 20,0 maços-ano' });
  const d = dadosNeroTeste();
  expect([condicoesInformadas(d.perfil), textoTabagismo(d.perfil)]).toEqual([['hipertensão', 'diabetes (DM2)'], 'ex-fumante · 20,0 maços-ano']);
  d.perfil = { ...d.perfil, dataNascimento: null, sexoNascimento: null, tabagismoStatus: null } as typeof d.perfil;
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).cabecalho).toMatchObject({ idade: null, sexo: null, tabagismo: 'não informado' });
});
test('idade conta no dia da geração, não no relógio de quem roda', () => {
  const d = dadosNeroTeste();
  d.geradoEm = '2026-04-09T10:00:00';
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).cabecalho.idade).toBe(50);
});
test('cartões do geral, na ordem, com valor, unidade, data, detalhe e tendência (sem selo)', () => {
  const c = geral().cartoes;
  expect(c.map((x) => x.tipo)).toEqual(['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso', 'cintura']);
  expect(c[0]).toEqual({ tipo: 'pressao', titulo: 'Pressão arterial (MRPA)', valor: '131/83', unidade: 'mmHg', data: '01/08/2026', detalhe: '24 medidas válidas', tendencia: null });
  expect(c[1]).toEqual({ tipo: 'hba1c', titulo: 'Hemoglobina glicada (HbA1c)', valor: '6,8', unidade: '%', data: '15/08/2026', detalhe: null, tendencia: null });
  expect(c[2]).toEqual({ tipo: 'ldl', titulo: 'Colesterol LDL', valor: '118', unidade: 'mg/dL', data: '15/08/2026', detalhe: null, tendencia: 'desceu' });
  expect(c[3]).toEqual({ tipo: 'risco', titulo: 'Risco cardiovascular em 10 anos (PREVENT)', valor: '7,4', unidade: '%', data: '05/09/2026', detalhe: 'categoria intermediário', tendencia: null });
  expect(c[4]).toEqual({ tipo: 'glicemia', titulo: 'Glicemia capilar', valor: '130', unidade: 'mg/dL', data: '02/09/2026', detalhe: '4 medidas no período', tendencia: null });
  expect(c[5]).toEqual({ tipo: 'peso', titulo: 'Peso e IMC', valor: '82,0', unidade: 'kg', data: '15/09/2026', detalhe: 'IMC 28,4', tendencia: 'desceu' });
  expect(c[6]).toEqual({ tipo: 'cintura', titulo: 'Circunferência abdominal', valor: '96', unidade: 'cm', data: '15/09/2026', detalhe: null, tendencia: null });
  expect(c.some((x) => 'selo' in x)).toBe(false);
});
test('LDL e HbA1c mostram a referência do laboratório quando há', () => {
  const d = dadosNeroTeste();
  d.examesCardio = d.examesCardio.map((e) => (e.id === 'e1' ? { ...e, resultado: { ...e.resultado, referenciaMax: 130 } } : e.id === 'e5' ? { ...e, resultado: { ...e.resultado, referenciaMin: 4, referenciaMax: 5.6 } } : e));
  const c = cartoesDoPainel(d, 'cardio', escopoDoRelatorio({ tipo: 'cardio' }), false);
  expect(c.find((x) => x.tipo === 'ldl')!.detalhe).toBe('referência do laboratório: — a 130,0');
  expect(c.find((x) => x.tipo === 'hba1c')!.detalhe).toBe('referência do laboratório: 4,0 a 5,6');
});
test('pressão: tendência pela sessão MRPA anterior; sem MRPA, média das avulsas sem tendência', () => {
  const d = dadosNeroTeste();
  const s = d.sessoesMrpa[0];
  d.sessoesMrpa.push({ ...s, id: 's0', inicio: '2026-05-01', resultado: { ...s.resultado!, medias: { ...s.resultado!.medias, total: { pas: 128, pad: 80, n: 20 } } } });
  expect(cartoesDoPainel(d, 'cardio', escopoDoRelatorio({ tipo: 'cardio' }), false)[0]).toMatchObject({ valor: '131/83', tendencia: 'subiu' });
  d.sessoesMrpa = [];
  expect(montarPainel(d, { tipo: 'cardio', periodo: PERIODO_TESTE }).cartoes[0]).toEqual({ tipo: 'pressao', titulo: 'Pressão arterial (média das medidas avulsas)', valor: '130/83', unidade: 'mmHg', data: '06/09/2026', detalhe: '6 medidas', tendencia: null });
});
test('peso e cintura vêm da mesma fonte da seção corpo: sem bem-estar não há cartão (d.peso não entra)', () => {
  const d = dadosNeroTeste();
  d.bemEstar = undefined;
  expect(cartoesDoPainel(d, 'bemestar', escopoDoRelatorio({ tipo: 'bemestar' }), false)).toEqual([]);
  const e = dadosNeroTeste();
  e.bemEstar!.alturaCm = null;
  expect(cartoesDoPainel(e, 'bemestar', escopoDoRelatorio({ tipo: 'bemestar' }), false)[0]).toMatchObject({ valor: '82,0', detalhe: null });
});
test('número do cartão = número do detalhe: peso, IMC e cintura batem com a seção corpo', () => {
  const d = dadosNeroTeste();
  const corpo = JSON.stringify(montarBemEstar(d, PERIODO_TESTE).find((x) => x.chave === 'corpo'));
  const [peso, cintura] = cartoesDoPainel(d, 'bemestar', escopoDoRelatorio({ tipo: 'bemestar' }), false);
  expect(corpo).toContain(`Peso atual ${peso.valor} kg (${peso.data}) · ${peso.detalhe}`);
  expect(corpo).toContain(`Circunferência abdominal ${cintura.valor} cm (${cintura.data})`);
});
test('peso e cintura às 22:30 local: cartão e detalhe mostram o dia local (não o dia UTC)', () => {
  const d = dadosNeroTeste();
  const noite = new Date(2026, 8, 15, 22, 30).toISOString(); // 16/09 em UTC
  d.bemEstar!.corporais = d.bemEstar!.corporais.map((m) => (m.id === 'w1' || m.id === 'w4' ? { ...m, medidoEm: noite } : m));
  const [peso, cintura] = cartoesDoPainel(d, 'bemestar', escopoDoRelatorio({ tipo: 'bemestar' }), false);
  expect([peso.data, cintura.data]).toEqual(['15/09/2026', '15/09/2026']);
  const corpo = JSON.stringify(montarBemEstar(d, PERIODO_TESTE).find((x) => x.chave === 'corpo'));
  expect(corpo).toContain('Peso atual 82,0 kg (15/09/2026)');
  expect(corpo).toContain('Circunferência abdominal 96 cm (15/09/2026)');
  expect(corpo).toContain('["15/09/2026","82,0","28,4","96"]');
});
test('HbA1c e LDL com o mesmo formato do detalhe (fmtNum)', () => {
  const d = dadosNeroTeste();
  d.examesCardio = d.examesCardio.map((e) => (e.id === 'e5' ? { ...e, resultado: { ...e.resultado, valor: 6.85 } } : e));
  const c = cartoesDoPainel(d, 'cardio', escopoDoRelatorio({ tipo: 'cardio' }), false);
  expect(c.find((x) => x.tipo === 'hba1c')!.valor).toBe('6,85');
  expect(JSON.stringify(montarCardio(d, PERIODO_TESTE).find((x) => x.chave === 'hba1c'))).toContain('6,85 %');
});
test('medida avulsa excluída fica fora do cartão, da seção pa e da série', () => {
  const d = dadosNeroTeste();
  d.sessoesMrpa = [];
  d.medidasPA.push({ id: 'pa9', medidoEm: '2026-09-09T08:00:00.000Z', pas: 200, pad: 120, fc: 70, sessaoId: null, contexto: { excluida: true } });
  const c = cartoesDoPainel(d, 'cardio', escopoDoRelatorio({ tipo: 'cardio' }), false)[0];
  expect(c).toMatchObject({ valor: '130/83', detalhe: '6 medidas', data: '06/09/2026' });
  const pa = JSON.stringify(montarCardio(d, PERIODO_TESTE).find((x) => x.chave === 'pa'));
  expect(pa).toContain('6 medidas no período · média 130/83 mmHg');
  expect(pa).not.toContain('200/120');
  expect(seriePressao(d, PERIODO_TESTE).some((x) => x.pas === 200)).toBe(false);
});
test('série começa em periodo.desde: dia de MRPA antiga não entra', () => {
  const d = dadosNeroTeste();
  const s = d.sessoesMrpa[0];
  d.sessoesMrpa.push({ ...s, id: 's0', inicio: '2026-03-01', resultado: { ...s.resultado!, medias: { ...s.resultado!.medias, porDia: [{ dia: 1, data: '2026-03-01', manha: null, noite: null, total: { pas: 150, pad: 90, n: 4 } }] } } });
  const serie = seriePressao(d, PERIODO_TESTE);
  expect(serie).toHaveLength(8);
  expect(serie[0].data >= PERIODO_TESTE.desde).toBe(true);
});
test('idade da seção "Dados gerais" conta no dia da geração, como o cabeçalho', () => {
  const d = dadosNeroTeste();
  d.geradoEm = '2026-04-09T10:00:00';
  expect(JSON.stringify(montarGeral(d, PERIODO_TESTE).find((x) => x.chave === 'perfil'))).toContain('Ana Souza · 50 anos');
});
test('blocos por tipo', () => {
  const p = (o: Partial<OpcoesPainel>) => montarPainel(dadosNeroTeste(), { tipo: 'geral', periodo: PERIODO_TESTE, ...o });
  expect(p({ tipo: 'cardio' }).cartoes.map((x) => x.tipo)).toEqual(['pressao', 'hba1c', 'ldl', 'risco', 'glicemia']);
  expect(p({ tipo: 'cardio' }).prevencao).toBeNull();
  expect(p({ tipo: 'cardio' }).seriePressao).toHaveLength(8);
  expect(p({ tipo: 'cardio', apenas: ['mrpa'] }).cartoes.map((x) => x.tipo)).toEqual(['pressao']);
  expect(p({ tipo: 'cardio', apenas: ['glicemia'] }).seriePressao).toBeNull();
  const onco = p({ tipo: 'oncologico' });
  expect([onco.cartoes, onco.seriePressao, onco.adesao, onco.prevencaoDetalhada, onco.prevencao!.length]).toEqual([[], null, null, true, 2]);
  const bem = p({ tipo: 'bemestar' });
  expect([bem.cartoes.map((x) => x.tipo), bem.seriePressao, bem.adesao, bem.prevencao]).toEqual([['peso', 'cintura'], null, null, null]);
  const masto = p({ tipo: 'consulta', especialidade: 'mastologia' });
  expect([masto.cartoes, masto.seriePressao, masto.adesao !== null, masto.prevencao!.map((x) => x.programa), masto.prevencaoDetalhada]).toEqual([[], null, true, ['mama'], false]);
  expect(p({ tipo: 'consulta', especialidade: 'gastro_coloprocto' }).prevencao!.map((x) => x.programa)).toEqual(['colorretal']);
  expect(p({ tipo: 'consulta', especialidade: 'clinica_medica' }).prevencao!.map((x) => x.programa)).toEqual(['mama', 'colorretal']);
  const cardiologia = p({ tipo: 'consulta', especialidade: 'cardiologia' });
  expect([cardiologia.cartoes.map((x) => x.tipo), cardiologia.seriePressao !== null, cardiologia.prevencao]).toEqual([['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso', 'cintura'], true, null]);
  expect(p({}).atencao).toEqual(itensAtencao(dadosNeroTeste(), escopoDoRelatorio({ tipo: 'geral' }), PERIODO_TESTE, linhasAdesao(dadosNeroTeste())));
});
test('série da sistólica junta avulsas e dias da MRPA, por data', () => {
  const s = seriePressao(dadosNeroTeste(), PERIODO_TESTE);
  expect(s).toHaveLength(8);
  expect(s[0]).toEqual({ data: '2026-08-02', pas: 130 });
  expect(s.map((x) => x.data)).toEqual([...s.map((x) => x.data)].sort());
});
test('série: menos de 2 pontos não desenha o gráfico', () => {
  const d = dadosNeroTeste();
  d.sessoesMrpa = []; d.medidasPA = d.medidasPA.slice(0, 1);
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).seriePressao).toBeNull();
});
test('linha de referência do gráfico: a domiciliar dos parâmetros; sem parâmetros, 130', () => {
  const d = dadosNeroTeste();
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).referenciaSistolica).toBe(130);
  d.parametrosPressao = { ...d.parametrosPressao!, referenciaDomiciliar: { ...d.parametrosPressao!.referenciaDomiciliar, pas: 135 } };
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).referenciaSistolica).toBe(135);
  d.parametrosPressao = null;
  expect(montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }).referenciaSistolica).toBe(130);
});
test('prevenção: texto de situação do app, sem cor; programa não aplicável sai', () => {
  expect(geral().prevencao).toEqual([
    { programa: 'mama', rotulo: 'Mama', situacao: 'Em dia', proximaData: '2027-05-10', mensagem: 'Mamografia em dia.' },
    { programa: 'colorretal', rotulo: 'Intestino (colorretal)', situacao: 'Exame atrasado', proximaData: null, mensagem: 'Há uma pendência aberta.' },
  ]);
  const d = dadosNeroTeste();
  d.avaliacoes.pulmao = { programa: 'pulmao', status: 'nao_indicado_no_momento', mensagem: 'x', regraId: 'r', regraVersao: '1', proximaData: null, naoAplicavel: true };
  expect(prevencaoDoPainel(d, escopoDoRelatorio({ tipo: 'geral' })).map((x) => x.programa)).toEqual(['mama', 'colorretal']);
});
test('conta sem dados: só o cabeçalho', () => {
  const d = dadosNeroTeste();
  Object.assign(d, { medidasPA: [], sessoesMrpa: [], glicemias: [], examesCardio: [], riscos: [], peso: null, bemEstar: undefined, medicacoes: [], tomadas: [], pendencias: [], sintomas: [], avaliacoes: {}, parametrosPressao: null });
  const p = montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE });
  expect([p.atencao, p.cartoes, p.seriePressao, p.adesao, p.prevencao]).toEqual([[], [], null, [], []]);
});
