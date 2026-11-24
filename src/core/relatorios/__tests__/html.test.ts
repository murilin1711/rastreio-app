import { LEGENDA_DOSES } from '../adesaoRelatorio';
import { RESSALVA_CARDIO, RESSALVA_CURTA_PAINEL, RESSALVA_HABITOS, RESSALVA_ONCOLOGICO, htmlRelatorio } from '../html';
import { montarBemEstar, montarCardio, montarConsulta, montarGeral, montarOncologico, tituloRelatorio } from '../montar';
import { montarPainel } from '../painel';
import type { LinhaAdesao, PainelRelatorio, TipoRelatorio } from '../tipos';
import { PERIODO_TESTE, dadosNeroTeste } from './fixtures';

const base = { paciente: { nome: 'Ana Souza', nascimento: '1975-04-10' }, periodo: PERIODO_TESTE, geradoEm: '2026-09-18T10:30:00' };
const painel = (tipo: TipoRelatorio, d = dadosNeroTeste()) => montarPainel(d, { tipo, periodo: PERIODO_TESTE });
const comPainel = (tipo: TipoRelatorio, d = dadosNeroTeste(), secoes = montarGeral(d, PERIODO_TESTE)) =>
  htmlRelatorio({ ...base, tipo, titulo: 'x', secoes, painel: montarPainel(d, { tipo, periodo: PERIODO_TESTE }) });

test('cardio traz a ressalva do §26 literal, nome e período', () => {
  const h = htmlRelatorio({ ...base, tipo: 'cardio', titulo: tituloRelatorio('cardio'), secoes: montarCardio(dadosNeroTeste(), PERIODO_TESTE) });
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
test('nenhuma frase diagnóstica, também no painel', () => {
  const corte = (h: string) => h.toLowerCase().split('class="fontes"')[0]; // títulos de diretrizes ("Diagnóstico de diabetes") não falam do paciente
  for (const h of [htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: montarConsulta(dadosNeroTeste(), 'outra', PERIODO_TESTE) }), comPainel('geral')]) {
    expect(corte(h)).not.toContain('você tem');
    expect(corte(h)).not.toContain('diagnóstico de');
  }
});
test('com qrSvg inclui o svg e a validade; escapa HTML nos textos', () => {
  const d = dadosNeroTeste(); d.medicacoes[0].nome = 'A<b>';
  const h = htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'x', secoes: montarCardio(d, PERIODO_TESTE), qrSvg: '<svg width="96"></svg>', validadeQr: '25/09/2026' });
  expect(h).toContain('<svg width="96"></svg>');
  expect(h).toContain('a este relatório até 25/09/2026');
  expect(h).toContain('A&lt;b&gt;');
});
test('snapshot do cardio', () => {
  expect(htmlRelatorio({ ...base, tipo: 'cardio', titulo: tituloRelatorio('cardio'), secoes: montarCardio(dadosNeroTeste(), PERIODO_TESTE), painel: painel('cardio') })).toMatchSnapshot();
});
test('relatório de hábitos e bem-estar traz as três ressalvas', () => {
  const h = htmlRelatorio({ ...base, tipo: 'bemestar', titulo: tituloRelatorio('bemestar'), secoes: montarBemEstar(dadosNeroTeste(), PERIODO_TESTE), painel: painel('bemestar') });
  expect(h).toContain(RESSALVA_CARDIO); expect(h).toContain(RESSALVA_ONCOLOGICO); expect(h).toContain(RESSALVA_HABITOS);
  expect(h.toLowerCase()).not.toContain('você tem');
  expect(h).toMatchSnapshot();
});

test('cita com link as fontes das seções presentes, e só delas', () => {
  const c = htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'x', secoes: montarCardio(dadosNeroTeste(), PERIODO_TESTE) });
  expect(c).toContain('<h2>Fontes</h2>');
  expect(c).toContain('href="https://abccardiol.org/article/diretriz-brasileira-de-hipertensao-arterial-2025/"');
  expect(c).not.toContain('Lung-RADS');
  const semClinica = htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: [{ chave: 'medicamentos', titulo: 'Medicamentos em uso', blocos: [] }] });
  expect(semClinica).not.toContain('<h2>Fontes</h2>');
});

test('painel antes do detalhe, fechando a página 1', () => {
  const h = comPainel('geral');
  expect(h.indexOf('class="painel"')).toBeGreaterThan(-1);
  expect(h.indexOf('class="painel"')).toBeLessThan(h.indexOf('<h2>Dados gerais</h2>'));
  expect(h).toContain('Detalhes nas páginas seguintes.'); expect(h).toContain(RESSALVA_CURTA_PAINEL);
  expect(h).toMatch(/\.painel\s*{[^}]*page-break-after:\s*always/);
  expect(h).toContain('<meta name="viewport" content="width=device-width, initial-scale=1">');
});
test('cabeçalho do painel: nome e idade em destaque, condições, tabagismo, período e geração', () => {
  const h = comPainel('geral');
  expect(h).toMatch(/<p class="paciente"><strong>Ana Souza<\/strong>, \d+ anos<\/p>/);
  expect(h).toContain('Condições informadas:');
  expect(h).toContain('Tabagismo:');
  expect(h).toContain('20/06/2026 a 18/09/2026');
  expect(h).toContain('Gerado em 18/09/2026');
});
test('caixa de atenção com os itens', () => {
  const h = comPainel('geral');
  expect(h).toContain('<h2>Para atenção nesta consulta</h2>');
  expect(h).toContain('FIT positivo: colonoscopia indicada');
});
test('sem selo de cor nos cartões, na adesão nem na prevenção (Ruling S0)', () => {
  const h = comPainel('geral');
  const p = h.slice(h.indexOf('<section class="painel">'), h.indexOf('</section>', h.indexOf('<section class="painel">')));
  expect(p).toContain('class="cartao"');
  expect(p).not.toMatch(/class="[^"]*selo/);
  expect(p).not.toContain('chip');
  expect(p).not.toMatch(/style="[^"]*(background|color)/);
  expect(h).not.toMatch(/\.selo/);
  // estados das doses só por símbolo e com o mesmo estilo
  expect(h).not.toMatch(/\.dose-[a-z_]+\s*{/);
});
test('2 colunas no A4, 1 no celular; fontes em 2 colunas', () => {
  const h = comPainel('geral');
  expect(h).toMatch(/\.cartoes\s*{[^}]*grid-template-columns:\s*1fr 1fr/);
  expect(h).toMatch(/@media screen and \(max-width: 640px\)\s*{[^@]*\.cartoes\s*{\s*grid-template-columns:\s*1fr;/);
  expect(h).toMatch(/\.fontes ol\s*{[^}]*columns:\s*2/);
});
test('gráfico e remédios no painel', () => {
  const h = comPainel('geral');
  expect(h).toContain('data-ref="130"');
  expect(h).toContain('<h3>Pressão sistólica no período</h3>');
  expect(h).toContain('10 de 14'); expect(h).toContain('usou 2 vezes'); expect(h).toContain(LEGENDA_DOSES);
  expect(h).toContain('<span class="dose" title="errada">◆</span>');
});
test('linha do gráfico segue a referência domiciliar do painel', () => {
  const d = dadosNeroTeste();
  const p = { ...montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }), referenciaSistolica: 135 };
  const h = htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: montarGeral(d, PERIODO_TESTE), painel: p });
  expect(h).toContain('data-ref="135"');
  expect(h).toContain('referência domiciliar de 135 mmHg');
});
test('prevenção: uma linha no geral, lista com próxima data no oncológico', () => {
  const g = comPainel('geral');
  expect(g).toMatch(/<div class="prevencao"><h3>Prevenção<\/h3><p>/);
  const o = comPainel('oncologico', dadosNeroTeste(), montarOncologico(dadosNeroTeste(), PERIODO_TESTE));
  expect(o).toMatch(/<div class="prevencao"><h3>Prevenção<\/h3><ul>/);
  expect(o).not.toContain('class="remedios"');
  expect(o).not.toContain('class="cartoes"');
});
test('escapa o que o paciente digitou, também no painel', () => {
  const d = dadosNeroTeste(); d.perfil = { ...d.perfil, nome: 'A<b>' }; d.pendencias[0].descricao = '<img src=x onerror=alert(1)>';
  d.medicacoes[0].nome = '<i>Losartana';
  const h = comPainel('geral', d);
  expect(h).toContain('A&lt;b&gt;'); expect(h).not.toContain('<img src=x'); expect(h).not.toContain('<b>'); expect(h).not.toContain('<i>Losartana');
});
test('conta sem dados: sem caixa de atenção, sem cartões, sem gráfico, sem remédios nem prevenção', () => {
  const d = dadosNeroTeste();
  Object.assign(d, { medidasPA: [], sessoesMrpa: [], glicemias: [], examesCardio: [], riscos: [], peso: null, bemEstar: undefined, medicacoes: [], tomadas: [], pendencias: [], sintomas: [], avaliacoes: {} });
  const h = comPainel('geral', d, []);
  expect(h).toContain('class="painel"');
  expect(h).not.toContain('Para atenção'); expect(h).not.toContain('class="cartao"'); expect(h).not.toContain('<svg');
  expect(h).not.toContain('class="remedios"'); expect(h).not.toContain('class="prevencao"');
});
test('sem painel o cabeçalho antigo continua', () => {
  const h = htmlRelatorio({ ...base, tipo: 'cardio', titulo: 'x', secoes: [] });
  expect(h).not.toContain('class="painel"');
  expect(h).toContain('Ana Souza · nascimento 10/04/1975');
});

const comAdesao = (adesao: LinhaAdesao[]) => {
  const d = dadosNeroTeste();
  const p: PainelRelatorio = { ...montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }), adesao };
  return htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: [], painel: p });
};
const linhaAd = (x: Partial<LinhaAdesao>): LinhaAdesao => ({ medicacaoId: 'm', nome: 'Remédio', dose: null, sePrecisar: false, doses: [], tomou: 0, previstas: 0, errado: 0, percentual: null, usosSePrecisar: 0, ...x });
test('contagem do remédio: não usou, usou 1 vez, sem doses previstas', () => {
  expect(comAdesao([linhaAd({ sePrecisar: true })])).toContain('<span class="conta">não usou</span>');
  expect(comAdesao([linhaAd({ sePrecisar: true, usosSePrecisar: 1 })])).toContain('<span class="conta">usou 1 vez</span>');
  expect(comAdesao([linhaAd({})])).toContain('<span class="conta">sem doses previstas no período</span>');
});
test('bolinhas com rótulo da contagem por estado', () => {
  const h = comAdesao([linhaAd({ doses: ['tomou', 'tomou', 'nao_tomou', 'errado', 'sem_registro'], tomou: 2, previstas: 5 })]);
  expect(h).toContain('<span class="doses" aria-label="2 tomou, 1 não tomou, 1 errada, 1 sem registro">');
  expect(comAdesao([linhaAd({ sePrecisar: true, usosSePrecisar: 2 })])).toContain('<span class="doses"></span>');
});
test('linha de doses quebra em vez de transbordar no celular', () => {
  expect(comPainel('geral')).toMatch(/\.remedio \.doses\s*{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*min-width:\s*0/);
});
test('estilos só de tela dependem da classe "tela", que o PDF nunca leva', () => {
  const pdf = comPainel('geral');
  expect(pdf).not.toContain('class="tela"');
  expect(pdf).toMatch(/<html lang="pt-BR">/);
  expect(pdf).not.toMatch(/@media screen\s*{/);
  expect(pdf).toMatch(/html\.tela body\s*{[^}]*max-width/);
  const d = dadosNeroTeste();
  const tela = htmlRelatorio({ ...base, tipo: 'geral', titulo: 'x', secoes: [], painel: montarPainel(d, { tipo: 'geral', periodo: PERIODO_TESTE }), tela: true });
  expect(tela).toContain('<html lang="pt-BR" class="tela">');
});
