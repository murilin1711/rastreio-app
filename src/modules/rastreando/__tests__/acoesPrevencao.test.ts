/** Ações do módulo "Exames de prevenção" (spec de navegação §6.5, D-065): molde único, cada uma leva a uma tela que existe. */
import { existsSync } from 'fs';
import { join } from 'path';
import { comVolta } from '@core/navegacao/voltarPara';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { ACOES_PREVENCAO } = require('../acoes');

const RAIZ = join(__dirname, '../../../../app');
const existe = (rota: string) => ['.tsx', '/index.tsx'].some((fim) => existsSync(join(RAIZ, rota.split('?')[0].replace(/^\//, '') + fim)));

it('as duas ações na ordem da spec', () => {
  expect(ACOES_PREVENCAO.map((a: { titulo: string }) => a.titulo)).toEqual([
    'Ver meus lembretes',
    'Levar ao médico (relatório de prevenção)',
  ]);
});

it('ícones e rotas da tabela', () => {
  expect(ACOES_PREVENCAO).toEqual([
    { chave: 'lembretes', icone: 'notifications-outline', titulo: 'Ver meus lembretes', rota: '/(app)/rastreando/lembretes' },
    { chave: 'relatorio', icone: 'document-text-outline', titulo: 'Levar ao médico (relatório de prevenção)', rota: '/(app)/(tabs)/minha-saude/relatorios/previa?tipo=oncologico&dias=180' },
  ]);
});

it('o relatório abre a prévia com tipo, dias e a volta ao módulo', () => {
  expect(comVolta(ACOES_PREVENCAO[1].rota, '/rastreando')).toEqual({
    pathname: '/(app)/(tabs)/minha-saude/relatorios/previa',
    params: { tipo: 'oncologico', dias: '180', voltarPara: '/rastreando' },
  });
});

it('os lembretes ficam no módulo (sem voltarPara)', () => {
  expect(comVolta(ACOES_PREVENCAO[0].rota, '/rastreando')).toBe('/(app)/rastreando/lembretes');
});

const ROTAS: string[] = ACOES_PREVENCAO.map((a: { rota: string }) => a.rota);

it.each(ROTAS)('%s leva a uma tela que existe', (rota) => {
  expect(existe(rota)).toBe(true);
});
