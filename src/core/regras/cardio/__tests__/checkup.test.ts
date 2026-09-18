import { avaliarCheckup } from '../checkup';
import { extrairParametrosRisco } from '../parametrosRisco';
import { regrasRiscoTeste } from './fixturesRisco';

const p = extrairParametrosRisco(regrasRiscoTeste());
const hoje = '2026-09-17';
const dias = (n: number) => new Date(Date.parse(hoje) - n * 86_400_000).toISOString().slice(0, 10);

test('0/8 quando nada registrado (glicemia conta como faltando só com diabetes)', () => {
  const r = avaliarCheckup({ pa: { data: null, ehMrpa: false, nCasual7d: 0 }, peso: null, tabagismoAtualizadoEm: null, glicemiaOuHba1c: null, lipidios: null, renal: null, atividadeFisica: null, risco: null }, { temDiabetes: true }, hoje, p);
  expect(r.total).toBe(8);
  expect(r.atualizados).toBe(0);
  expect(r.itens.find((i) => i.chave === 'lipidios')?.frase).toBe('Falta atualizar seu perfil lipídico.');
});

test('8/8 com tudo recente', () => {
  const r = avaliarCheckup({ pa: { data: dias(1), ehMrpa: false, nCasual7d: 3 }, peso: dias(3), tabagismoAtualizadoEm: dias(10), glicemiaOuHba1c: dias(30), lipidios: dias(200), renal: dias(200), atividadeFisica: dias(1), risco: dias(100) }, { temDiabetes: true }, hoje, p);
  expect(r.atualizados).toBe(8);
});

test('sem diabetes: glicemia/HbA1c não se aplica e conta como atualizado', () => {
  const r = avaliarCheckup({ pa: { data: null, ehMrpa: false, nCasual7d: 0 }, peso: null, tabagismoAtualizadoEm: null, glicemiaOuHba1c: null, lipidios: null, renal: null, atividadeFisica: null, risco: null }, { temDiabetes: false }, hoje, p);
  const g = r.itens.find((i) => i.chave === 'glicemia_hba1c')!;
  expect(g).toMatchObject({ atualizado: true, naoSeAplica: true });
  expect(r.atualizados).toBe(1);
});
