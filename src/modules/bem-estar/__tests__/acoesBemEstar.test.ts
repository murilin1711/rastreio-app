/** Ações do módulo "Hábitos e bem-estar" (spec de navegação §6.5, D-065): molde único, cada uma leva a uma tela que existe. */
import { existe } from '../../../testes/rotas';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { ACOES_BEM_ESTAR } = require('../acoes');

it('as sete ações na ordem da spec', () => {
  expect(ACOES_BEM_ESTAR.map((a: { titulo: string }) => a.titulo)).toEqual([
    'Meu peso e medidas',
    'Meu sono',
    'Minhas atividades',
    'Minha água',
    'Minha alimentação',
    'Minhas metas',
    'Check-in da semana',
  ]);
});

it('ícones, subtítulos e rotas da tabela', () => {
  expect(ACOES_BEM_ESTAR).toEqual([
    { chave: 'corpo', icone: 'body-outline', titulo: 'Meu peso e medidas', subtitulo: 'anotar, composição corporal e "Entenda"', rota: '/(app)/bem-estar/corpo' },
    { chave: 'sono', icone: 'moon-outline', titulo: 'Meu sono', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/sono' },
    { chave: 'atividade', icone: 'walk-outline', titulo: 'Minhas atividades', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/atividade' },
    { chave: 'agua', icone: 'water-outline', titulo: 'Minha água', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/agua' },
    { chave: 'alimentacao', icone: 'restaurant-outline', titulo: 'Minha alimentação', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/alimentacao' },
    { chave: 'metas', icone: 'flag-outline', titulo: 'Minhas metas', rota: '/(app)/bem-estar/metas' },
    { chave: 'checkin', icone: 'chatbubble-ellipses-outline', titulo: 'Check-in da semana', rota: '/(app)/bem-estar/checkin' },
  ]);
});

it('o relatório saiu daqui (vive em "Levar ao médico")', () => {
  expect(ACOES_BEM_ESTAR.some((a: { rota: string }) => a.rota.includes('relatorios/previa'))).toBe(false);
});

const ROTAS: string[] = ACOES_BEM_ESTAR.map((a: { rota: string }) => a.rota);

it.each(ROTAS)('%s leva a uma tela que existe', (rota) => {
  expect(existe(rota)).toBe(true);
});
