/**
 * Agenda (pedido do Murilo, 25/09): o que se repete todo dia vira um card de rotina no topo; a agenda
 * fica só com o que é pontual (consulta, exame). Sem isso, um remédio 2×/dia enchia a lista com 14 linhas.
 */
import { separarRotina } from '../rotina';

const linha = (titulo: string, quando: string, texto: string, extra: Partial<{ silenciado: boolean; rota: string; tipo: any; rotulo: string }> = {}) => ({
  id: `${titulo}@${quando}`, chave: titulo, quando, texto, status: 'pendente', silenciado: false,
  tipo: (titulo.split(':')[0] || 'exame') as any, rotulo: '', rota: '/r', ...extra,
});

test('remédio: uma linha por medicamento, com os horários do dia, e fora da agenda', () => {
  const { rotina, pontuais } = separarRotina([
    linha('medicacao:m1:08:00', '2026-09-26T08:00:00', 'Hora de tomar seu remédio · Losartana 50 mg'),
    linha('medicacao:m1:20:00', '2026-09-25T20:00:00', 'Hora de tomar seu remédio · Losartana 50 mg'),
    linha('medicacao:m1:08:00', '2026-09-27T08:00:00', 'Hora de tomar seu remédio · Losartana 50 mg'),
    linha('consulta:c1:dia', '2026-09-30T09:00:00', 'Sua consulta é hoje · Cardiologia às 14:00', { tipo: 'consulta' }),
  ]);
  expect(rotina).toEqual([expect.objectContaining({ chave: 'medicacao:m1', nome: 'Losartana 50 mg', horarios: '08:00 e 20:00' })]);
  expect(pontuais.map((p) => p.chave)).toEqual(['consulta:c1:dia']);
});

test('água em intervalo regular vira "das … às …, a cada …"', () => {
  const horas = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
  const { rotina } = separarRotina(horas.map((h) => linha(`agua:${h}`, `2026-09-26T${h}:00`, 'Hora de beber água · Sua meta de hoje: 2 L.', { tipo: 'agua' })));
  expect(rotina).toEqual([expect.objectContaining({ chave: 'agua', nome: 'Beber água', horarios: 'das 08:00 às 20:00, a cada 2 h' })]);
});

test('glicemia junta os horários do plano numa linha só', () => {
  const { rotina } = separarRotina([
    linha('glicemia:jejum:07:00', '2026-09-26T07:00:00', 'Hora de medir a glicemia · Em jejum', { tipo: 'glicemia' }),
    linha('glicemia:pos_almoco_2h:14:00', '2026-09-26T14:00:00', 'Hora de medir a glicemia · 2 h após o almoço', { tipo: 'glicemia' }),
  ]);
  expect(rotina).toEqual([expect.objectContaining({ chave: 'glicemia', nome: 'Medir a glicemia', horarios: '07:00 e 14:00' })]);
});

test('MRPA entra na rotina com a data do fim da sessão', () => {
  const { rotina, pontuais } = separarRotina([
    linha('mrpa:s1:1:manha', '2026-09-26T07:00:00', 'Hora de medir a pressão · Dia 1 de 7 · manhã', { tipo: 'mrpa' }),
    linha('mrpa:s1:1:noite', '2026-09-26T19:00:00', 'Hora de medir a pressão · Dia 1 de 7 · noite', { tipo: 'mrpa' }),
    linha('mrpa:s1:7:noite', '2026-10-02T19:00:00', 'Hora de medir a pressão · Dia 7 de 7 · noite', { tipo: 'mrpa' }),
  ]);
  expect(pontuais).toEqual([]);
  expect(rotina).toEqual([expect.objectContaining({ chave: 'mrpa:s1', nome: 'Medir a pressão (MRPA)', horarios: '07:00 e 19:00', ate: '02/10' })]);
});

test('silenciado: a linha avisa que o celular não vai tocar', () => {
  const { rotina } = separarRotina([linha('medicacao:m1:08:00', '2026-09-26T08:00:00', 'Hora de tomar seu remédio · X', { silenciado: true })]);
  expect(rotina[0].silenciado).toBe(true);
});

test('check-in semanal entra na rotina como "toda semana", não na agenda', () => {
  const { rotina, pontuais } = separarRotina([
    linha('checkin:2026-09-21:dom', '2026-09-27T10:00:00', 'Como foi sua semana? · Responda o check-in: leva um minuto.', { tipo: 'checkin' }),
    linha('checkin:2026-09-21:ter', '2026-09-29T19:00:00', 'Último dia do check-in · Conte como foi sua semana antes que ela feche.', { tipo: 'checkin' }),
    linha('checkin:2026-09-28:dom', '2026-10-04T10:00:00', 'Como foi sua semana? · Responda o check-in: leva um minuto.', { tipo: 'checkin' }),
  ]);
  expect(pontuais).toEqual([]);
  expect(rotina).toEqual([expect.objectContaining({ chave: 'checkin', nome: 'Check-in semanal', frequencia: 'semana', horarios: 'domingo às 10:00 e terça às 19:00, se ainda não respondeu' })]);
});

test('os diários são "todo dia"', () => {
  const { rotina } = separarRotina([linha('medicacao:m1:08:00', '2026-09-26T08:00:00', 'Hora de tomar seu remédio · X')]);
  expect(rotina[0].frequencia).toBe('dia');
});
