import { extrairParametros } from '../parametros';
import { dataDoDia, diaDaSessao, montarRelatorio, podeConcluir } from '../mrpa';
import type { MedidaPA, SessaoMrpa } from '../tipos';
import { regrasPressaoTeste } from './fixtures';

const p = extrairParametros(regrasPressaoTeste());
const sessao = (dias: 4 | 5 | 6 = 6, extra: Partial<SessaoMrpa> = {}): SessaoMrpa =>
  ({ id: 's1', inicio: '2026-09-10', diasPrevistos: dias, status: 'em_andamento', horarios: { manha: '08:00', noite: '20:00' }, paConsultorio: null, ...extra });

let seq = 0;
const med = (dia: number, periodo: 'manha' | 'noite', ordem: 1 | 2 | 3, pas: number, pad: number): MedidaPA => ({
  id: `m${++seq}`, medidoEm: `${dataDoDia(sessao(), dia)}T${periodo === 'manha' ? '08' : '20'}:0${ordem}:00.000Z`,
  pas, pad, fc: 70, sessaoId: 's1', contexto: { periodo, ordem },
});
/** Sessão completa: `dias` × (3 manhã + 3 noite). Noite = manhã − 4/−3. */
const completa = (dias: number, pas = 125, pad = 78) =>
  Array.from({ length: dias }, (_, i) => i + 1).flatMap((d) => ([1, 2, 3] as const).flatMap((o) => [med(d, 'manha', o, pas, pad), med(d, 'noite', o, pas - 4, pad - 3)]));

describe('dia e conclusão', () => {
  test('dia 1 no início, dia 6 no último; 0 antes; continua contando depois', () => {
    expect(diaDaSessao(sessao(), '2026-09-10')).toBe(1);
    expect(diaDaSessao(sessao(), '2026-09-15')).toBe(6);
    expect(diaDaSessao(sessao(), '2026-09-09')).toBe(0);
    expect(diaDaSessao(sessao(), '2026-09-20')).toBe(11);
    expect(dataDoDia(sessao(), 3)).toBe('2026-09-12');
  });
  test('só pode concluir a partir do último dia previsto', () => {
    expect(podeConcluir(sessao(), '2026-09-14')).toBe(false);
    expect(podeConcluir(sessao(), '2026-09-15')).toBe(true);
    expect(podeConcluir(sessao(4), '2026-09-13')).toBe(true);
  });
});

describe('relatório e validade (Medidas 2023, Parte 4 §5)', () => {
  test('6 dias completos → válida, 36 medidas, médias por período, dentro da referência', () => {
    const r = montarRelatorio(sessao(), completa(6), p);
    expect(r.valido).toBe(true);
    expect(r.medidasValidas).toBe(36);
    expect(r.medias.total).toEqual({ pas: 123, pad: 77, n: 36 });
    expect(r.medias.manha).toEqual({ pas: 125, pad: 78, n: 18 });
    expect(r.medias.noite).toEqual({ pas: 121, pad: 75, n: 18 });
    expect(r.medias.porDia).toHaveLength(6);
    expect(r.diasComRegistro).toBe(6);
    expect(r.acimaReferencia).toBe(false);
    expect(r.regraId).toBe('r-validade');
  });
  test('média ≥ 130 e/ou ≥ 80 → acima da referência (regra mrpa_acima)', () => {
    const r = montarRelatorio(sessao(), completa(6, 134, 76), p);
    expect(r.acimaReferencia).toBe(true);
    expect(r.regraId).toBe('r-mrpa-acima');
  });
  test('4 dias com 13 medidas → inválida por poucas medidas', () => {
    const ms = completa(4).slice(0, 13);
    const r = montarRelatorio(sessao(4), ms, p);
    expect(r).toMatchObject({ valido: false, motivoInvalidez: 'poucas_medidas', acimaReferencia: null });
  });
  test('6 dias com ≥ 18 medidas, mas um dia sem noite → inválida', () => {
    const ms = completa(6).filter((m) => !(m.contexto.periodo === 'noite' && m.medidoEm.startsWith(dataDoDia(sessao(), 2))));
    expect(ms.length).toBeGreaterThanOrEqual(18);
    expect(montarRelatorio(sessao(), ms, p)).toMatchObject({ valido: false, motivoInvalidez: 'dia_sem_periodo' });
  });
  test('medida implausível (PP < 20) é excluída do cálculo mas contada', () => {
    const ms = [...completa(6), med(1, 'manha', 3, 100, 85)];
    const r = montarRelatorio(sessao(), ms, p);
    expect(r.medidasExcluidas).toBe(1);
    expect(r.medidasValidas).toBe(36);
    expect(r.valido).toBe(true);
  });
  test('medida marcada excluida no contexto também não entra', () => {
    const ms = [...completa(6), { ...med(1, 'manha', 3, 200, 100), contexto: { periodo: 'manha' as const, ordem: 3 as const, excluida: true } }];
    expect(montarRelatorio(sessao(), ms, p).medidasExcluidas).toBe(1);
  });
  test('sem medidas → inválida', () => {
    expect(montarRelatorio(sessao(), [], p).motivoInvalidez).toBe('sem_medidas');
  });
  test('diferença consultório × MRPA quando informada', () => {
    const r = montarRelatorio(sessao(6, { paConsultorio: { pas: 140, pad: 90, medidoEm: '2026-09-09' } }), completa(6), p);
    expect(r.diferencaConsultorio).toEqual({ pas: 17, pad: 13 });
  });
});
