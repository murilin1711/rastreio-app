import { LEGENDA_DOSES, SIMBOLO_DOSE, blocosAdesaoDetalhe, janelaAdesao, linhasAdesao } from '../adesaoRelatorio';
import { dadosNeroTeste } from './fixtures';

test('símbolos e legenda das doses', () => {
  expect(SIMBOLO_DOSE).toEqual({ tomou: '●', nao_tomou: '○', errado: '◆', sem_registro: '–' });
  expect(LEGENDA_DOSES).toBe('● tomou · ○ não tomou · ◆ errada · – sem registro');
});
test('janela termina no dia de geração', () => {
  expect(janelaAdesao('2026-09-18', 14)).toEqual({ desde: '2026-09-05', ate: '2026-09-18' });
  expect(janelaAdesao('2026-09-18', 28).desde).toBe('2026-08-22');
});
test('Losartana: 10 de 14 nas últimas 2 semanas, 71 %', () => {
  const l = linhasAdesao(dadosNeroTeste()).find((x) => x.nome === 'Losartana')!;
  expect([l.tomou, l.previstas, l.percentual]).toEqual([10, 14, 71]);
  expect(l.doses).toHaveLength(14);
  expect(l.doses.slice(0, 4)).toEqual(['nao_tomou', 'nao_tomou', 'nao_tomou', 'nao_tomou']);
});
test('Metformina: dose de hoje à noite (pendente) não entra; 1 errada', () => {
  const l = linhasAdesao(dadosNeroTeste()).find((x) => x.nome === 'Metformina')!;
  expect(l.doses).not.toContain('pendente');
  expect(l.doses).toHaveLength(27);
  expect(l.errado).toBe(1);
});
test('só ativos, na ordem do cadastro', () => {
  expect(linhasAdesao(dadosNeroTeste()).map((l) => l.nome)).toEqual(['Losartana', 'Metformina', 'Dipirona']);
});
test('"se precisar": sem percentual, com usos', () => {
  const l = linhasAdesao(dadosNeroTeste()).find((x) => x.nome === 'Dipirona')!;
  expect([l.sePrecisar, l.percentual, l.usosSePrecisar, l.dose]).toEqual([true, null, 2, '500 mg']);
});
test('remédio recém-cadastrado, sem dose prevista ainda: linha zerada, percentual null (X1)', () => {
  const d = dadosNeroTeste();
  d.medicacoes = [{ ...d.medicacoes[0], horariosDesde: '2026-09-19' }];
  d.tomadas = [];
  expect(linhasAdesao(d)).toEqual([
    { medicacaoId: 'm1', nome: 'Losartana', dose: '50 mg', sePrecisar: false, doses: [], tomou: 0, previstas: 0, errado: 0, percentual: null, usosSePrecisar: 0 },
  ]);
});
test('detalhe: texto de abertura', () => {
  expect(blocosAdesaoDetalhe(dadosNeroTeste())[0]).toEqual({ tipo: 'texto', texto: 'Adesão aos remédios nas últimas 4 semanas, pelo que o paciente marcou no app.' });
});
test('detalhe: tabela por semana', () => {
  const t = blocosAdesaoDetalhe(dadosNeroTeste()).filter((b) => b.tipo === 'tabela')[0];
  if (t.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(t.colunas).toEqual(['Remédio', 'Semana de 22/08', 'Semana de 29/08', 'Semana de 05/09', 'Semana de 12/09']);
  expect(t.linhas.find((l) => l[0] === 'Losartana 50 mg')).toEqual(['Losartana 50 mg', '7 de 7', '7 de 7', '3 de 7', '7 de 7']);
  expect(t.linhas.find((l) => l[0] === 'Metformina 850 mg')).toEqual(['Metformina 850 mg', '14 de 14', '14 de 14', '14 de 14', '12 de 13']);
  expect(t.linhas.find((l) => l[0] === 'Dipirona 500 mg')).toEqual(['Dipirona 500 mg', '—', '—', 'usou 1 vez', 'usou 1 vez']);
});
test('detalhe: "usou N vezes" e remédio sem dose, sem rótulo de dose', () => {
  const d = dadosNeroTeste();
  d.medicacoes = [{ ...d.medicacoes[3], dose: null }, { ...d.medicacoes[0], horariosDesde: '2026-09-19' }];
  d.tomadas = d.tomadas.filter((x) => x.medicacaoId !== 'm1');
  const t = blocosAdesaoDetalhe(d).filter((b) => b.tipo === 'tabela')[0];
  if (t.tipo !== 'tabela') throw new Error('esperava tabela');
  d.tomadas.push({ ...d.tomadas.find((x) => x.medicacaoId === 'm4')!, id: 'extra', marcadoEm: '2026-09-15T09:00:00' });
  const t2 = blocosAdesaoDetalhe(d).filter((b) => b.tipo === 'tabela')[0];
  if (t2.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(t.linhas[1]).toEqual(['Losartana 50 mg', '—', '—', '—', '—']);
  expect(t2.linhas[0]).toEqual(['Dipirona', '—', '—', 'usou 1 vez', 'usou 2 vezes']);
});
test('detalhe: doses erradas e com atraso, coluna "Marcado às" (X10)', () => {
  const t = blocosAdesaoDetalhe(dadosNeroTeste()).filter((b) => b.tipo === 'tabela')[1];
  if (t.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(t.colunas).toEqual(['Data', 'Remédio', 'Previsto', 'Marcado às', 'Quantidade', 'Situação']);
  expect(t.linhas).toEqual([
    ['16/09/2026', 'Metformina', '08:00 · 1 comprimido', '08:05', '2 comprimidos', 'errada'],
    ['17/09/2026', 'Metformina', '20:00 · 1 comprimido', '23:00', '1 comprimido', 'com atraso'],
  ]);
});
test('detalhe: dose errada e com atraso juntas; sem tomada a tabela de doses some', () => {
  const d = dadosNeroTeste();
  const t16 = d.tomadas.find((x) => x.medicacaoId === 'm2' && x.dataPrevista === '2026-09-16' && x.horaPrevista === '08:00')!;
  t16.marcadoEm = '2026-09-16T11:00:00';
  const t = blocosAdesaoDetalhe(d).filter((b) => b.tipo === 'tabela')[1];
  if (t.tipo !== 'tabela') throw new Error('esperava tabela');
  expect(t.linhas[0]).toEqual(['16/09/2026', 'Metformina', '08:00 · 1 comprimido', '11:00', '2 comprimidos', 'errada, com atraso']);
  d.tomadas = [];
  expect(blocosAdesaoDetalhe(d).filter((b) => b.tipo === 'tabela')).toHaveLength(1);
});
test('sem remédio ativo, sem detalhe', () => {
  const d = dadosNeroTeste();
  d.medicacoes = d.medicacoes.map((m) => ({ ...m, ativa: false }));
  expect(blocosAdesaoDetalhe(d)).toEqual([]);
  expect(linhasAdesao(d)).toEqual([]);
});
