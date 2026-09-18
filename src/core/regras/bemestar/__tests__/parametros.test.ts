import { extrairParametrosBemEstar } from '../parametros';
import { regrasBemEstarTeste } from './fixtures';

test('extrai todas as camadas com os números da semente', () => {
  const p = extrairParametrosBemEstar(regrasBemEstarTeste());
  expect(p.imc).toMatchObject({ baixo: 18.5, sobrepeso: 25, obesidade1: 30, obesidade2: 35, obesidade3: 40 });
  expect(p.imcIdoso).toMatchObject({ idadeMin: 60, baixo: 22, alto: 27 });
  expect(p.cintura).toMatchObject({ hAumentado: 90, mAumentado: 80, hMuito: 102, mMuito: 88 });
  expect(p.rca.limite).toBe(0.5);
  expect(p.rcq).toMatchObject({ h: 0.9, m: 0.85 });
  expect(p.tecnica.regra.id).toBe('b-tecnica');
  expect(p.atividade).toMatchObject({ moderadaMin: 150, moderadaMax: 300, vigorosaMin: 75, vigorosaMax: 150, fatorVigorosa: 2, fortalecimentoDias: 2, idosoIdade: 60, equilibrioDias: 3 });
  expect(p.sono).toMatchObject({ minimoMin: 420, maximoIncertoMin: 540 });
  expect(p.tendencia).toMatchObject({ minimoMedidas: 3, janelaDias: 14, limiarPct: 1 });
  expect(p.pmav).toMatchObject({ imcMin: 30, imc2: 40, imcMax: 50, reduzida1: 5, controlada1: 10, reduzida2: 10, controlada2: 15 });
  expect(p.perdaNaoIntencional).toMatchObject({ pct: 5, meses: 6 });
  expect(p.vinculo.horas).toBe(3);
});
test('falta de camada lança erro claro', () => {
  expect(() => extrairParametrosBemEstar(regrasBemEstarTeste().filter((r) => r.condicao.camada !== 'rca'))).toThrow('regras_clinicas: falta a camada "rca" do programa bem_estar');
});
