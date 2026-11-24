/** Ações do topo do Início (spec de navegação §6.3, D-065): no máximo cinco, e cada uma leva a uma tela que existe. */
import { existe } from '../../../testes/rotas';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { acoesInicio } = require('../acoesInicio');

it('com diabetes no perfil: pressão, remédios, glicemia, médico + consultas', () => {
  const { grade, largo } = acoesInicio(true);
  expect(grade.map((a: { rotulo: string }) => a.rotulo)).toEqual(['Anotar minha pressão', 'Meus remédios', 'Anotar minha glicemia', 'Levar ao médico']);
  expect(grade[2]).toMatchObject({ chave: 'glicemia', icone: 'eyedrop-outline', rota: '/(app)/coracao/glicemia/registrar' });
  expect(largo).toEqual({ chave: 'consultas', icone: 'calendar-outline', rotulo: 'Minhas consultas', rota: '/(app)/(tabs)/agenda/consultas' });
});

it('as outras ações, com ícone e rota da tabela', () => {
  expect(acoesInicio(true).grade).toEqual([
    { chave: 'pressao', icone: 'pulse-outline', rotulo: 'Anotar minha pressão', rota: '/(app)/coracao/pressao/registrar' },
    { chave: 'remedios', icone: 'medkit-outline', rotulo: 'Meus remédios', rota: '/(app)/(tabs)/minha-saude/medicamentos' },
    { chave: 'glicemia', icone: 'eyedrop-outline', rotulo: 'Anotar minha glicemia', rota: '/(app)/coracao/glicemia/registrar' },
    { chave: 'medico', icone: 'document-text-outline', rotulo: 'Levar ao médico', rota: '/(app)/(tabs)/minha-saude/relatorios' },
  ]);
});

it.each([false, null, undefined])('sem diabetes confirmado (%s), o terceiro é "Meus exames"', (t) => {
  expect(acoesInicio(t).grade[2]).toEqual({ chave: 'exames', icone: 'flask-outline', rotulo: 'Meus exames', rota: '/(app)/(tabs)/minha-saude/exames' });
});

it('no máximo cinco ações', () => {
  for (const t of [true, false]) {
    const { grade } = acoesInicio(t);
    expect(grade.length + 1).toBeLessThanOrEqual(5);
  }
});

const ROTAS = [...new Set([true, false].flatMap((t) => { const { grade, largo } = acoesInicio(t); return [...grade, largo].map((a: { rota: string }) => a.rota); }))];

it.each(ROTAS)('%s leva a uma tela que existe', (rota) => {
  expect(existe(rota as string)).toBe(true);
});
