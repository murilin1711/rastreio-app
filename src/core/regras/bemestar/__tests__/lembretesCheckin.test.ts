/** D-060: avisos do check-in — domingo 10h e, só para quem não respondeu, terça 19h. */
import { planejarLembretesCheckin } from '../lembretesCheckin';

const QUI = new Date('2026-09-24T12:00:00'); // quinta-feira

test('quatro semanas à frente: domingo 10h e terça 19h de cada uma', () => {
  const p = planejarLembretesCheckin(QUI, []);
  expect(p).toHaveLength(8);
  expect(p[0]).toMatchObject({ chave: 'checkin:2026-09-21:dom', periodo: 'domingo' });
  expect(p[0].quando.getDay()).toBe(0);
  expect(p[0].quando.getHours()).toBe(10);
  expect(p[1]).toMatchObject({ chave: 'checkin:2026-09-21:ter', periodo: 'terca' });
  expect(p[1].quando.getDay()).toBe(2);
  expect(p[1].quando.getHours()).toBe(19);
  // domingo e terça da mesma janela avaliam a mesma semana (a que começou na segunda anterior ao domingo)
  expect(p[1].quando.getDate() - p[0].quando.getDate()).toBe(2);
});

test('semana já respondida não recebe aviso nenhum', () => {
  const p = planejarLembretesCheckin(QUI, ['2026-09-21']);
  expect(p.some((x) => x.chave.startsWith('checkin:2026-09-21:'))).toBe(false);
  expect(p).toHaveLength(6);
});

test('na segunda de manhã, o domingo já passou: só a terça da janela aberta', () => {
  const p = planejarLembretesCheckin(new Date('2026-09-28T08:00:00'), []);
  expect(p[0].chave).toBe('checkin:2026-09-21:ter');
});
