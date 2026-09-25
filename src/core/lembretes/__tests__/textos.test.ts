/**
 * Textos das notificações, decididos um a um com o Murilo em 25/09/2026 (`docs/nero/notificacoes.md`).
 * Se um destes testes quebrar, o documento e o código divergiram — atualizar os dois juntos.
 */
import { litros, textoAgua, textoConsultaDia, textoConsultaVespera, textoExameAntes, textoExameDepois, textoExameDia, textoGlicemia, textoMrpa, textoRemedio, tituloCompleto, mensagemDaLista } from '../textos';

describe('remédio', () => {
  it('nome e dose embaixo', () => {
    expect(textoRemedio('Losartana', '50 mg')).toEqual({ titulo: 'Hora de tomar seu remédio', emoji: '💊', corpo: 'Losartana 50 mg' });
  });
  it('sem dose, só o nome', () => {
    expect(textoRemedio('Losartana', null).corpo).toBe('Losartana');
    expect(textoRemedio('Losartana', '  ').corpo).toBe('Losartana');
  });
});

describe('água', () => {
  it('com meta, em litros com vírgula', () => {
    expect(textoAgua(2000)).toEqual({ titulo: 'Hora de beber água', emoji: '💧', corpo: 'Sua meta de hoje: 2 L.' });
    expect(textoAgua(1800).corpo).toBe('Sua meta de hoje: 1,8 L.');
  });
  it('sem meta, um convite', () => {
    expect(textoAgua(null).corpo).toBe('Um copo agora já ajuda.');
  });
  it('litros arredonda a uma casa e tira o ",0"', () => {
    expect(litros(2250)).toBe('2,3 L');
    expect(litros(3000)).toBe('3 L');
  });
});

it('glicemia: o momento com inicial maiúscula', () => {
  expect(textoGlicemia('2 h após o almoço')).toEqual({ titulo: 'Hora de medir a glicemia', emoji: '🩸', corpo: '2 h após o almoço' });
  expect(textoGlicemia('em jejum').corpo).toBe('Em jejum');
});

it('MRPA: dia e período, sem a sigla', () => {
  expect(textoMrpa(2, 7, 'manha')).toEqual({ titulo: 'Hora de medir a pressão', emoji: '🩺', corpo: 'Dia 2 de 7 · manhã' });
  expect(textoMrpa(5, 7, 'noite').corpo).toBe('Dia 5 de 7 · noite');
});

describe('consulta', () => {
  it('véspera oferece o relatório', () => {
    expect(textoConsultaVespera('Cardiologia', '14:30')).toEqual({ titulo: 'Sua consulta é amanhã', emoji: '📅', corpo: 'Cardiologia às 14:30. Toque para preparar o relatório.' });
  });
  it('no dia, com e sem local', () => {
    expect(textoConsultaDia('Cardiologia', '14:30', 'Clínica Vida')).toEqual({ titulo: 'Sua consulta é hoje', emoji: '📅', corpo: 'Cardiologia às 14:30 · Clínica Vida' });
    expect(textoConsultaDia('Cardiologia', '14:30', null).corpo).toBe('Cardiologia às 14:30');
  });
});

describe('exames: "exame" no título resolve o gênero', () => {
  it('antes', () => {
    expect(textoExameAntes('Mamografia', 30)).toEqual({ titulo: 'Seu exame está chegando', emoji: '🔎', corpo: 'Mamografia · daqui a 30 dias' });
  });
  it('no dia', () => {
    expect(textoExameDia('Mamografia')).toEqual({ titulo: 'Hoje é a data do seu exame', emoji: '🔎', corpo: 'Mamografia' });
  });
  it('depois', () => {
    expect(textoExameDepois('Mamografia')).toEqual({ titulo: 'Já fez seu exame?', emoji: '🔎', corpo: 'Mamografia · registre o resultado para seguir em dia' });
  });
  it('nenhum título carrega o nome do exame', () => {
    for (const t of [textoExameAntes('Colonoscopia', 7), textoExameDia('Colonoscopia'), textoExameDepois('Colonoscopia')]) expect(t.titulo).not.toMatch(/Colonoscopia/);
  });
});

it('o título da notificação termina com o emoji; a lista do app guarda título e texto sem emoji', () => {
  const t = textoRemedio('Losartana', '50 mg');
  expect(tituloCompleto(t)).toBe('Hora de tomar seu remédio 💊');
  expect(mensagemDaLista(t)).toBe('Hora de tomar seu remédio · Losartana 50 mg');
});
