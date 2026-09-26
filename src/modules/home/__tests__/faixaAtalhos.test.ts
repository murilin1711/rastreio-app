/** Atalhos da Home (D-053): cada um precisa levar a uma tela que existe — rota errada só apareceria no aparelho. */
import { existsSync } from 'fs';
import { join } from 'path';

jest.mock('@expo/vector-icons', () => ({ Ionicons: { glyphMap: {} } }));
const { ATALHOS } = require('../FaixaAtalhos');

const RAIZ = join(__dirname, '../../../../app');
const existe = (rota: string) => ['.tsx', '/index.tsx'].some((fim) => existsSync(join(RAIZ, rota.replace(/^\//, '') + fim)));

it('os cinco atalhos escolhidos, na ordem', () => {
  expect(ATALHOS.map((a: { rotulo: string }) => a.rotulo)).toEqual(['Relatório', 'Medir pressão', 'Medir glicemia', 'Remédios', 'Consultas']);
});

it.each(ATALHOS.map((a: { rotulo: string; rota: string }) => [a.rotulo, a.rota]) as [string, string][])('%s leva a uma tela que existe (%s)', (_r: string, rota: string) => {
  expect(existe(rota)).toBe(true);
});
