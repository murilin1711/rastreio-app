import { type ChaveConquista, conquistasNovas, type EstadoConquistas } from '../conquistas';

const vazio: EstadoConquistas = { perfilCompleto: false, totalAtividades: 0, totalSono: 0, totalCheckins: 0 };

test('sem nada feito, nenhuma conquista', () => {
  expect(conquistasNovas(vazio, [])).toEqual([]);
});
test('perfil concluído dá a conquista do perfil', () => {
  expect(conquistasNovas({ ...vazio, perfilCompleto: true }, [])).toEqual<ChaveConquista[]>(['perfil_completo']);
});
test('um registro de cada tipo dá a conquista correspondente', () => {
  expect(conquistasNovas({ ...vazio, totalAtividades: 1 }, [])).toEqual<ChaveConquista[]>(['primeira_atividade']);
  expect(conquistasNovas({ ...vazio, totalSono: 1 }, [])).toEqual<ChaveConquista[]>(['primeira_noite_sono']);
  expect(conquistasNovas({ ...vazio, totalCheckins: 1 }, [])).toEqual<ChaveConquista[]>(['primeiro_checkin']);
});
test('conquista já obtida não volta', () => {
  expect(conquistasNovas({ ...vazio, perfilCompleto: true }, ['perfil_completo'])).toEqual([]);
});
test('várias de uma vez saem na ordem do catálogo', () => {
  const estado = { perfilCompleto: true, totalAtividades: 3, totalSono: 2, totalCheckins: 1 };
  expect(conquistasNovas(estado, [])).toEqual<ChaveConquista[]>(['perfil_completo', 'primeira_atividade', 'primeira_noite_sono', 'primeiro_checkin']);
});
test('muitos registros não dão conquista extra: é só a primeira vez', () => {
  expect(conquistasNovas({ ...vazio, totalAtividades: 50 }, ['primeira_atividade'])).toEqual([]);
});
