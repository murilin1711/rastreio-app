import { habitos7d } from '../habitos';
import { extrairParametrosBemEstar } from '../parametros';
import type { Atividade, MedidaCorporal, Sono } from '../tipos';
import { regrasBemEstarTeste } from './fixtures';

const p = extrairParametrosBemEstar(regrasBemEstarTeste());
const peso = (id: string, dia: string, kg: number): MedidaCorporal => ({ id, tipo: 'peso', medidoEm: `${dia}T08:00:00`, valores: { kg } });
const at = (id: string, inicio: string, duracaoMin: number, intensidade: Atividade['intensidade']): Atividade => ({ id, inicio, tipo: 'caminhada', duracaoMin, intensidade, distanciaKm: null, fcMedia: null, calorias: null, observacao: null });
const sono = (id: string, dormiu: string, acordou: string, minutos: number): Sono => ({ id, dormiuEm: dormiu, acordouEm: acordou, minutos, qualidade: null, contexto: {} });

test('meus hábitos: movimento da semana, sono, peso com variação e cintura com dias', () => {
  const h = habitos7d({
    hoje: '2026-09-18', p, meta: null,
    atividades: [at('1', '2026-09-15T07:00:00', 40, 'moderada'), at('2', '2026-09-17T07:00:00', 25, 'vigorosa'), at('3', '2026-09-10T07:00:00', 60, 'moderada')],
    sonos: [sono('1', '2026-09-16T23:00:00', '2026-09-17T06:00:00', 420), sono('2', '2026-09-17T23:00:00', '2026-09-18T06:30:00', 450)],
    pesos: [peso('a', '2026-09-18', 82.4), peso('b', '2026-09-14', 82.9), peso('c', '2026-09-12', 82.5), peso('d', '2026-08-01', 84)],
    cinturas: [{ id: 'c', tipo: 'cintura', medidoEm: '2026-08-17T08:00:00', valores: { cm: 78 } }],
  });
  expect(h).toMatchObject({ movimentoMin: 90, metaMin: 150, sonoMediaMin: 435, refeicoes: 0, pesoKg: 82.4, pesoVariacaoKg: -0.3, cinturaCm: 78, cinturaHaDias: 32, checkinPendente: false });
});
test('sem dados → nulos e zeros', () => {
  expect(habitos7d({ hoje: '2026-09-18', p, meta: null, atividades: [], sonos: [], pesos: [], cinturas: [] })).toEqual({ movimentoMin: 0, metaMin: 150, sonoMediaMin: null, refeicoes: 0, pesoKg: null, pesoVariacaoKg: null, cinturaCm: null, cinturaHaDias: null, checkinPendente: false });
});
