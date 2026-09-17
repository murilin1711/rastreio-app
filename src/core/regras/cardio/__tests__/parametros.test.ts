import { extrairParametros } from '../parametros';
import { regrasPressaoTeste } from './fixtures';

test('extrai as sete camadas da semente', () => {
  const p = extrairParametros(regrasPressaoTeste());
  expect(p.muitoElevado).toMatchObject({ pas: 180, pad: 110 });
  expect(p.validade.minimos).toEqual({ '4': 14, '5': 15, '6': 18 });
  expect(p.conviteMrpa.minimoMedidas).toBe(3);
  expect(p.muitoElevadoSintoma.sintomas).toHaveLength(6);
});

test('lança erro claro quando falta uma camada', () => {
  const semValidade = regrasPressaoTeste().filter((r) => r.condicao.camada !== 'validade');
  expect(() => extrairParametros(semValidade)).toThrow('validade');
});
