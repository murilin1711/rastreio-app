import { RESSALVA_CARDIO, RESSALVA_HABITOS, RESSALVA_ONCOLOGICO, htmlRelatorio } from '../html';
import { montarBemEstar, montarCardio, montarConsulta, montarOncologico } from '../montar';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const base = { paciente: { nome: 'Ana Souza', nascimento: '1975-04-10' }, periodo: PERIODO_TESTE, geradoEm: '2026-09-18T10:30:00' };

test('cardio traz a ressalva do §26 literal, nome e período', () => {
  const h = htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'Relatório cardiovascular e metabólico', secoes: montarCardio(dadosNeroTeste(), PERIODO_TESTE) });
  expect(h).toContain(RESSALVA_CARDIO);
  expect(h).not.toContain(RESSALVA_ONCOLOGICO);
  expect(h).toContain('Ana Souza');
  expect(h).toContain('últimos 90 dias');
  expect(h).toContain('20/06/2026 a 18/09/2026');
});
test('oncológico traz a ressalva do §40; consulta e geral trazem as duas', () => {
  const o = htmlRelatorio({ ...base, tipo: 'oncologico', titulo: 'x', secoes: montarOncologico(dadosNeroTeste(), PERIODO_TESTE) });
  expect(o).toContain(RESSALVA_ONCOLOGICO); expect(o).not.toContain(RESSALVA_CARDIO);
  const c = htmlRelatorio({ ...base, tipo: 'consulta', titulo: 'x', secoes: montarConsulta(dadosNeroTeste(), 'cardiologia', PERIODO_TESTE) });
  expect(c).toContain(RESSALVA_CARDIO); expect(c).toContain(RESSALVA_ONCOLOGICO);
});
test('nenhuma frase diagnóstica', () => {
  const h = htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: montarConsulta(dadosNeroTeste(), 'outra', PERIODO_TESTE) }).toLowerCase();
  expect(h).not.toContain('você tem');
  expect(h).not.toContain('diagnóstico de');
});
test('com qrSvg inclui o svg e a validade; escapa HTML nos textos', () => {
  const d = dadosNeroTeste(); d.medicacoes[0].nome = 'A<b>';
  const h = htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'x', secoes: montarCardio(d, PERIODO_TESTE), qrSvg: '<svg width="96"></svg>', validadeQr: '25/09/2026' });
  expect(h).toContain('<svg width="96"></svg>');
  expect(h).toContain('até 25/09/2026');
  expect(h).toContain('A&lt;b&gt;');
});
test('snapshot do cardio', () => {
  expect(htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'Relatório cardiovascular e metabólico', secoes: montarCardio(dadosNeroTeste(), PERIODO_TESTE) })).toMatchSnapshot();
});
test('relatório de Saúde & Hábitos traz as três ressalvas', () => {
  const h = htmlRelatorio({ ...base, tipo: 'bemestar', titulo: 'Relatório de Saúde & Hábitos', secoes: montarBemEstar(dadosNeroTeste(), PERIODO_TESTE) });
  expect(h).toContain(RESSALVA_CARDIO); expect(h).toContain(RESSALVA_ONCOLOGICO); expect(h).toContain(RESSALVA_HABITOS);
  expect(h.toLowerCase()).not.toContain('você tem');
  expect(h).toMatchSnapshot();
});
