/** Rotas antigas não quebram (spec §7, D-065): nenhuma tela de `app/` some; a que deixou de ser entrada continua existindo ou redireciona. */
import { readFileSync } from 'fs';
import { join } from 'path';
import { existe } from '../../../testes/rotas';

it.each([
  '/(app)/coracao', '/(app)/coracao/exames', '/(app)/coracao/linha-do-tempo', '/(app)/coracao/sinais',
  '/(app)/rastreando', '/(app)/rastreando/pendencias', '/(app)/rastreando/lembretes',
  '/(app)/bem-estar', '/(app)/bem-estar/checkin',
  '/(app)/(tabs)/historico', '/(app)/(tabs)/minha-saude/relatorios', '/(app)/(tabs)/minha-saude/medicamentos', '/(app)/(tabs)/agenda/consultas',
])('%s continua existindo', (r) => expect(existe(r)).toBe(true));

it('toda rota fixa citada por montarItensHoje existe', () => {
  const fonte = readFileSync(join(__dirname, '../../../modules/home/montarItensHoje.ts'), 'utf8');
  const rotas = [...fonte.matchAll(/'(\/\(app\)[^'`$?]*)'/g)].map((m) => m[1]);
  expect(rotas.length).toBeGreaterThan(5);
  expect(rotas.filter((r) => !existe(r))).toEqual([]);
});
