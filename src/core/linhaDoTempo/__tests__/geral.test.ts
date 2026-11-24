/**
 * Revisão da Tarefa 5: o Histórico abria todo exame cardio em `/(app)/coracao/exames`, que agora redireciona
 * com a volta fixa no módulo Coração. O item de exame aponta direto para a tela do exame, e a seta volta ao Histórico.
 */
import { existsSync } from 'fs';
import { join } from 'path';
import { comVolta } from '@core/navegacao/voltarPara';

jest.mock('@core/cardio/linhaDoTempo', () => ({
  montarLinhaDoTempo: async () => [{ ano: 2026, itens: [
    { data: '2026-10-05', tipo: 'exame', titulo: 'Hemoglobina glicada', valor: '6,1 %', id: 'e1' },
    { data: '2026-09-05', tipo: 'exame', titulo: 'Colesterol LDL', valor: '110 mg/dL' },
    { data: '2026-08-01', tipo: 'pa', titulo: 'PA média de ago', valor: '128/82 (10 medidas)' },
  ] }],
}));
jest.mock('@core/rastreando/contexto', () => ({ montarContexto: async () => ({ exames: [] }) }));
jest.mock('@core/medicacoes/repositorio', () => ({ listarMedicacoes: async () => [] }));
jest.mock('@core/lembretes/consultas', () => ({ listarConsultas: async () => [] }));
jest.mock('@core/documentos/repositorio', () => ({ listar: async () => [] }));
jest.mock('@core/bemestar/medidasCorporais', () => ({ listarCorporais: async () => [] }));
jest.mock('@core/bemestar/sono', () => ({ listarSono: async () => [] }));
jest.mock('@core/bemestar/atividades', () => ({ listarAtividades: async () => [] }));
jest.mock('@core/bemestar/checkins', () => ({ listarCheckins: async () => [] }));

const { montarLinhaDoTempoGeral } = require('../geral');

const RAIZ = join(__dirname, '../../../../app');

async function rotaDe(titulo: string): Promise<string> {
  const anos = await montarLinhaDoTempoGeral('u1');
  const item = anos.flatMap((a: { itens: { titulo: string; rota?: string }[] }) => a.itens).find((i: { titulo: string }) => i.titulo === titulo);
  return item.rota;
}

it('exame cardio com id abre a tela do exame, e a seta volta ao Histórico', async () => {
  const rota = await rotaDe('Hemoglobina glicada');
  expect(rota).toBe('/(app)/coracao/exames/e1');
  expect(existsSync(join(RAIZ, '(app)/coracao/exames/[id].tsx'))).toBe(true);
  // Tela de módulo: empilha por cima do Histórico, sem `voltarPara`; voltar desempilha para o Histórico.
  expect(comVolta(rota, '/historico')).toBe('/(app)/coracao/exames/e1');
});

it('exame cardio sem id abre a lista única de Minha Saúde, com volta ao Histórico', async () => {
  const rota = await rotaDe('Colesterol LDL');
  expect(rota).toBe('/(app)/(tabs)/minha-saude/exames');
  expect(comVolta(rota, '/historico')).toEqual({ pathname: '/(app)/(tabs)/minha-saude/exames', params: { voltarPara: '/historico' } });
});

it('nenhum item passa pelo redirecionamento antigo, que fixa a volta no módulo', async () => {
  const anos = await montarLinhaDoTempoGeral('u1');
  const rotas = anos.flatMap((a: { itens: { rota?: string }[] }) => a.itens.map((i) => i.rota));
  expect(rotas).not.toContain('/(app)/coracao/exames');
  expect(await rotaDe('PA média de ago')).toBe('/(app)/coracao');
});
