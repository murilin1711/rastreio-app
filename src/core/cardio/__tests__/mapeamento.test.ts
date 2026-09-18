import { contextoGlicemiaParaBanco, contextoParaBanco, linhaParaExame, linhaParaGlicemia, linhaParaMedidaPA, linhaParaSessao } from '../mapeamento';

test('mapeia linha de `medidas` para MedidaPA', () => {
  const m = linhaParaMedidaPA({ id: 'x', medido_em: '2026-09-17T11:00:00+00:00', valores: { pas: 128, pad: 78, fc: 68 }, contexto: { braco: 'esquerdo', periodo: 'manha', ordem: 2 }, sessao_id: 's1' });
  expect(m).toEqual({ id: 'x', medidoEm: '2026-09-17T11:00:00+00:00', pas: 128, pad: 78, fc: 68, sessaoId: 's1', contexto: { braco: 'esquerdo', periodo: 'manha', ordem: 2 } });
});

test('fc ausente vira null', () => {
  expect(linhaParaMedidaPA({ id: 'x', medido_em: 't', valores: { pas: 120, pad: 80 }, contexto: {}, sessao_id: null }).fc).toBeNull();
});

test('contexto do banco em snake_case vira camelCase e volta', () => {
  const m = linhaParaMedidaPA({ id: 'x', medido_em: 't', valores: { pas: 100, pad: 85 }, contexto: { periodo: 'noite', ordem: 1, excluida: true, motivo_exclusao: 'pp_menor_20', momento_medicacao: 'antes', implausivel_confirmada: true }, sessao_id: 's1' });
  expect(m.contexto).toEqual({ periodo: 'noite', ordem: 1, excluida: true, motivoExclusao: 'pp_menor_20', momentoMedicacao: 'antes', implausivelConfirmada: true });
  expect(contextoParaBanco(m.contexto)).toEqual({ periodo: 'noite', ordem: 1, excluida: true, motivo_exclusao: 'pp_menor_20', momento_medicacao: 'antes', implausivel_confirmada: true });
});

test('mapeia linha de `mrpa_sessoes` com PA de consultório e horários padrão', () => {
  const s = linhaParaSessao({ id: 's', inicio: '2026-09-10', dias_previstos: 6, status: 'em_andamento', horarios: null, pa_consultorio: { pas: 140, pad: 90, medido_em: '2026-09-09' }, resultado: null, concluida_em: null });
  expect(s).toMatchObject({ diasPrevistos: 6, horarios: { manha: '08:00', noite: '20:00' }, paConsultorio: { pas: 140, pad: 90, medidoEm: '2026-09-09' }, resultado: null });
});

test('glicemia: momento fica no contexto do banco e volta para o domínio', () => {
  const g = linhaParaGlicemia({ id: 'g', medido_em: 't', valores: { mgdl: 103 }, contexto: { momento: 'jejum', refeicao: 'habitual', atividade_fisica: true, sintomas: ['tremor'] }, sessao_id: null });
  expect(g).toEqual({ id: 'g', medidoEm: 't', mgdl: 103, momento: 'jejum', contexto: { refeicao: 'habitual', atividadeFisica: true, sintomas: ['tremor'] } });
  expect(contextoGlicemiaParaBanco('jejum', g.contexto)).toEqual({ momento: 'jejum', refeicao: 'habitual', atividade_fisica: true, sintomas: ['tremor'] });
});

test('exame cardio', () => {
  const e = linhaParaExame({ id: 'e', tipo: 'ldl', categoria: 'laboratorial', data_realizacao: '2026-09-13', resultado: { valor: 87, unidade: 'mg/dL' }, instituicao: null, solicitante: null, observacoes: null, laudo_texto: null });
  expect(e).toMatchObject({ tipo: 'ldl', categoria: 'laboratorial', dataRealizacao: '2026-09-13', resultado: { valor: 87 } });
});
