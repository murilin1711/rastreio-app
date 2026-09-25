import { planejarLembretesMrpa } from '../lembretesMrpa';
import type { SessaoMrpa } from '../tipos';

const s: SessaoMrpa = { id: 's1', inicio: '2026-09-10', diasPrevistos: 4, status: 'em_andamento', horarios: { manha: '07:30', noite: '20:00' }, paConsultorio: null };

test('um lembrete por período por dia, no horário escolhido, com título rastreável', () => {
  const l = planejarLembretesMrpa(s);
  expect(l).toHaveLength(8);
  expect(l[0]).toMatchObject({ dia: 1, periodo: 'manha', titulo: 'mrpa:s1:1:manha' });
  expect(l[0].quando.getHours()).toBe(7);
  expect(l[0].quando.getMinutes()).toBe(30);
  expect(l[0].quando.getDate()).toBe(10);
  expect(l[7]).toMatchObject({ dia: 4, periodo: 'noite' });
  expect(l[7].quando.getDate()).toBe(13);
});
