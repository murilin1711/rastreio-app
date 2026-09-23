import { PREFERENCIAS_PADRAO } from '@core/perfil/tipos';
import { agruparPorDia, estaSilenciado, origemDe, textoLimpo, tiposParaCancelar, tiposParaReligar } from '../origem';

test('origem derivada do título e do origem_tipo', () => {
  expect(origemDe({ origemTipo: 'medida', titulo: 'mrpa:s1:2:manha', origemId: 's1' })).toMatchObject({ tipo: 'mrpa', rota: '/(app)/coracao/mrpa/s1' });
  expect(origemDe({ origemTipo: 'medida', titulo: 'glicemia:jejum:07:00', origemId: null })).toMatchObject({ tipo: 'glicemia' });
  expect(origemDe({ origemTipo: 'medicacao', titulo: 'medicacao:m1:08:00', origemId: 'm1' })).toMatchObject({ tipo: 'medicacao', rota: '/(app)/(tabs)/minha-saude/medicamentos' });
  expect(origemDe({ origemTipo: 'consulta', titulo: 'consulta:c1:d-1', origemId: 'c1' })).toMatchObject({ tipo: 'consulta' });
  expect(origemDe({ origemTipo: 'exame', titulo: 'mama:Mamografia', origemId: 'x1' })).toMatchObject({ tipo: 'exame', rota: '/(app)/rastreando/mama' });
  expect(origemDe({ origemTipo: 'sistema', titulo: 'qualquer', origemId: null }).tipo).toBe('atualizacao');
});
test('texto limpo e marca de silenciado', () => {
  expect(textoLimpo('Hora do seu medicamento: Losartana. notif:abc-123 silenciado')).toBe('Hora do seu medicamento: Losartana.');
  expect(estaSilenciado('x notif:1 silenciado')).toBe(true);
  expect(estaSilenciado('x notif:1')).toBe(false);
});
test('diferença de preferências', () => {
  const depois = { ...PREFERENCIAS_PADRAO, mrpa: false, medicacao: false };
  expect(tiposParaCancelar(PREFERENCIAS_PADRAO, depois)).toEqual(['mrpa', 'medicacao']);
  expect(tiposParaReligar(depois, PREFERENCIAS_PADRAO)).toEqual(['mrpa', 'medicacao']);
  expect(tiposParaCancelar(depois, depois)).toEqual([]);
});
test('agrupar por dia em ordem', () => {
  const g = agruparPorDia([{ quando: '2026-09-20T12:00:00' }, { quando: '2026-09-19T08:00:00' }, { quando: '2026-09-19T20:00:00' }]);
  expect(g.map((x) => x.dia)).toEqual(['2026-09-19', '2026-09-20']);
  expect(g[0].itens.map((i) => i.quando)).toEqual(['2026-09-19T08:00:00', '2026-09-19T20:00:00']);
});
