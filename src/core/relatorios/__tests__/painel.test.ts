import { linhasAdesao } from '../adesaoRelatorio';
import { SECOES_BEMESTAR, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO } from '../especialidades';
import { LIMITE_ATENCAO, escopoDoRelatorio, itensAtencao } from '../painel';
import type { LinhaAdesao } from '../tipos';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const adesao = (d = dadosNeroTeste()) => linhasAdesao(d);
const linha = (nome: string, doses: LinhaAdesao['doses'], x: Partial<LinhaAdesao> = {}): LinhaAdesao => ({
  medicacaoId: nome, nome, dose: null, sePrecisar: false, doses, tomou: 0, previstas: doses.length, errado: 0, percentual: null, usosSePrecisar: 0, ...x,
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
test('oncológico e hábitos só trazem a pendência (§66: pendência aberta nunca é omitida)', () => {
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
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, [])).toContain('1 medida avulsa a partir de 180/110 mmHg no período (maior: 182/100 em 07/09/2026)');
  d.medidasPA.push({ id: 'pa8', medidoEm: '2026-09-08T08:00:00.000Z', pas: 170, pad: 112, fc: 70, sessaoId: null, contexto: {} });
  expect(itensAtencao(d, ['pa'], PERIODO_TESTE, [])).toContain('2 medidas avulsas a partir de 180/110 mmHg no período (maior: 182/100 em 07/09/2026)');
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
test('sintoma fora do período não entra', () => {
  const d = dadosNeroTeste();
  d.sintomas = [{ id: 's1', programa: 'mama', sintoma: 'nódulo palpável', registradoEm: '2026-09-02' }, { id: 's2', programa: 'mama', sintoma: 'antigo', registradoEm: '2025-01-01' }];
  expect(itensAtencao(d, ['sintomas'], PERIODO_TESTE, []).filter((x) => x.startsWith('Sintoma'))).toEqual(['Sintoma de alerta registrado em 02/09/2026: nódulo palpável (Mama)']);
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
