/** Ações do módulo "Pressão, coração e diabetes" (spec de navegação §6.5, D-065): molde único, cada uma leva a uma tela que existe. */
import { existsSync } from 'fs';
import { join } from 'path';
import { existe } from '../../../testes/rotas';

jest.mock('@expo/vector-icons', () => ({ Ionicons: Object.assign(() => null, { glyphMap: {} }) }));
const { acoesCoracao } = require('../acoes');

const RAIZ = join(__dirname, '../../../../app');

it('sem MRPA, as sete ações na ordem da spec', () => {
  expect(acoesCoracao({ mrpa: null }).map((a: { titulo: string }) => a.titulo)).toEqual([
    'Minha pressão',
    'Medir a pressão por alguns dias (MRPA)',
    'Minha glicemia',
    'Ver meus exames',
    'Calcular o risco do meu coração',
    'Como está minha prevenção?',
    'Quando procurar o pronto-socorro',
  ]);
});

it('ícones, subtítulos e rotas da tabela', () => {
  expect(acoesCoracao({ mrpa: null, subtituloPrevencao: 'Informações atualizadas: 2/5' })).toEqual([
    { chave: 'pressao', icone: 'pulse-outline', titulo: 'Minha pressão', subtitulo: 'anotar e ver como está', rota: '/(app)/coracao/pressao' },
    { chave: 'mrpa', icone: 'calendar-outline', titulo: 'Medir a pressão por alguns dias (MRPA)', subtitulo: 'quando o médico pedir', rota: '/(app)/coracao/mrpa/iniciar' },
    { chave: 'glicemia', icone: 'eyedrop-outline', titulo: 'Minha glicemia', subtitulo: 'anotar, plano e relatório', rota: '/(app)/coracao/glicemia' },
    { chave: 'exames', icone: 'flask-outline', titulo: 'Ver meus exames', subtitulo: 'todos os exames num lugar só', rota: '/(app)/(tabs)/minha-saude/exames' },
    { chave: 'risco', icone: 'heart-outline', titulo: 'Calcular o risco do meu coração', rota: '/(app)/coracao/risco' },
    { chave: 'prevencao', icone: 'checkmark-circle-outline', titulo: 'Como está minha prevenção?', subtitulo: 'Informações atualizadas: 2/5', rota: '/(app)/coracao/checkup' },
    { chave: 'sinais', icone: 'alert-circle-outline', titulo: 'Quando procurar o pronto-socorro', rota: '/(app)/coracao/sinais' },
  ]);
});

it('com MRPA em andamento, "Continuar o MRPA — dia 3 de 6" abre a sessão', () => {
  expect(acoesCoracao({ mrpa: { id: 's1', dia: 3, diasPrevistos: 6 } })[1]).toMatchObject({
    chave: 'mrpa', titulo: 'Continuar o MRPA — dia 3 de 6', subtitulo: 'quando o médico pedir', rota: '/(app)/coracao/mrpa/s1',
  });
});

it.each([[0, 'dia 1 de 6'], [9, 'dia 6 de 6']])('dia %i fora do intervalo vira "%s"', (dia, txt) => {
  expect(acoesCoracao({ mrpa: { id: 's1', dia, diasPrevistos: 6 } })[1].titulo).toBe(`Continuar o MRPA — ${txt}`);
});

it('não tem mais a linha do tempo', () => {
  const rotas = acoesCoracao({ mrpa: null }).map((a: { rota: string }) => a.rota);
  expect(rotas).not.toContain('/(app)/coracao/linha-do-tempo');
});

const ROTAS: string[] = acoesCoracao({ mrpa: null }).map((a: { rota: string }) => a.rota);

it.each(ROTAS)('%s leva a uma tela que existe', (rota) => {
  expect(existe(rota)).toBe(true);
});

it('a sessão do MRPA abre na tela [sessao]', () => {
  expect(existsSync(join(RAIZ, '(app)/coracao/mrpa/[sessao].tsx'))).toBe(true);
});
