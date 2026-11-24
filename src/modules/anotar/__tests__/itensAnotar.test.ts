/** Itens da folha Anotar: cada um precisa levar a uma tela que existe — rota errada só apareceria no aparelho. */
import { existe } from '../../../testes/rotas';

jest.mock('@expo/vector-icons', () => ({ Ionicons: { glyphMap: {} } }));
const { ITENS_ANOTAR } = require('../itensAnotar');

it('começa por Pressão e Glicemia e tem os nove itens da spec', () => {
  const rotulos = ITENS_ANOTAR.map((i: { rotulo: string }) => i.rotulo);
  expect(rotulos.slice(0, 2)).toEqual(['Pressão', 'Glicemia']);
  expect(rotulos).toEqual(expect.arrayContaining(['Peso e medidas', 'Sono', 'Atividade', 'Água', 'Refeição', 'Resultado de exame', 'Foto de documento']));
  expect(rotulos).toHaveLength(9);
});

it('não tem "Tomei remédio" (vem do plano do remédio)', () => {
  expect(ITENS_ANOTAR.some((i: { chave: string }) => i.chave === 'remedio')).toBe(false);
});

it('chaves não se repetem', () => {
  const chaves = ITENS_ANOTAR.map((i: { chave: string }) => i.chave);
  expect(new Set(chaves).size).toBe(chaves.length);
});

it.each(ITENS_ANOTAR.map((i: { rotulo: string; rota: string }) => [i.rotulo, i.rota]) as [string, string][])('%s leva a uma tela que existe (%s)', (_r: string, rota: string) => {
  expect(existe(rota)).toBe(true);
});
