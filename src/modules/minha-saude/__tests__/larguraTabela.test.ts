/**
 * Prévia do relatório (25/09): com colunas iguais, a tabela de medicamentos quebrava palavras no meio
 * ("Medicam/ento", "12/12/202/5"). Cada coluna precisa caber a maior palavra dela.
 */
import { larguraColunas, PX_POR_CARACTERE } from '../componentes/larguraTabela';

const cabe = (largura: number, palavra: string) => largura >= palavra.length * PX_POR_CARACTERE;

test('nenhuma coluna fica mais estreita que a maior palavra', () => {
  const l = larguraColunas(['Medicamento', 'Dose', 'Horários', 'Desde', 'Prescritor'], [['Losartana', '50', '08:00, 15:19, 15:20', '12/12/2025', '—']]);
  expect(cabe(l[0], 'Medicamento')).toBe(true);
  expect(cabe(l[3], '12/12/2025')).toBe(true);
  expect(cabe(l[4], 'Prescritor')).toBe(true);
});

test('texto longo pode quebrar entre palavras, mas a coluna tem teto', () => {
  const l = larguraColunas(['Horários'], [['08:00, 15:19, 15:20, 15:30, 16:03, 18:00, 20:00, 22:00']]);
  expect(l[0]).toBeLessThanOrEqual(110);
  expect(cabe(l[0], 'Horários')).toBe(true);
});
