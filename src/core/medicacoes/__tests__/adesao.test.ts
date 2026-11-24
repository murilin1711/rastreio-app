import { classificarDoses, MS_TOLERANCIA_ATRASO, podeMarcar, resumirAdesao } from '../adesao';
import type { Medicacao, Tomada } from '../tipos';

// Datas locais, sem 'Z'.
const m: Medicacao = {
  id: 'm1',
  nome: 'Losartana',
  dose: '50 mg',
  horarios: [{ hora: '08:00', quantidade: 1 }, { hora: '20:00', quantidade: 1 }],
  unidade: 'comprimido',
  doseVariavel: false,
  sePrecisar: false,
  horariosDesde: new Date(2026, 10, 16).toISOString(),
  desde: null,
  ate: null,
  prescritor: null,
  ativa: true,
  lembrar: true,
  observacao: null,
};
const agora = new Date('2026-11-23T09:00:00');

const t = (data: string, hora: string, extra: Partial<Tomada> = {}): Tomada => ({
  id: `${data}${hora}${Math.random()}`,
  medicacaoId: 'm1',
  dataPrevista: data,
  horaPrevista: hora,
  quantidadePrevista: 1,
  tomou: true,
  quantidade: 1,
  marcadoEm: new Date(`${data}T${hora}:00`).toISOString(),
  ...extra,
});
const um = (ts: Tomada[], data = '2026-11-20', hora = '08:00', mm: Medicacao = m) =>
  classificarDoses(mm, ts, data, data, agora).find((d) => d.hora === hora)!;

describe('classificarDoses', () => {
  it('tomou a quantidade do cadastro → tomou', () => expect(um([t('2026-11-20', '08:00')]).estado).toBe('tomou'));

  it('mais de 2 h depois → com atraso; 2 h em ponto → no horário', () => {
    expect(MS_TOLERANCIA_ATRASO).toBe(2 * 3_600_000);
    expect(um([t('2026-11-20', '08:00', { marcadoEm: new Date('2026-11-20T10:01:00').toISOString() })]).comAtraso).toBe(true);
    expect(um([t('2026-11-20', '08:00', { marcadoEm: new Date('2026-11-20T10:00:00').toISOString() })]).comAtraso).toBe(false);
  });

  it('quantidade diferente → errado; com dose variável → tomou', () => {
    expect(um([t('2026-11-20', '08:00', { quantidade: 2 })]).estado).toBe('errado');
    expect(um([t('2026-11-20', '08:00', { quantidade: 2 })], '2026-11-20', '08:00', { ...m, doseVariavel: true }).estado).toBe('tomou');
  });

  it('duas tomadas na mesma dose → errado, mesmo com dose variável', () => {
    const duas = [t('2026-11-20', '08:00'), t('2026-11-20', '08:00')];
    expect(um(duas).estado).toBe('errado');
    expect(um(duas, '2026-11-20', '08:00', { ...m, doseVariavel: true }).estado).toBe('errado');
    expect(um(duas).tomadas).toHaveLength(2);
  });

  it('"Não tomei" → nao_tomou', () =>
    expect(um([t('2026-11-20', '08:00', { tomou: false, quantidade: null })]).estado).toBe('nao_tomou'));

  it('sem marca: até o fim do dia seguinte é pendente, depois sem registro', () => {
    expect(um([], '2026-11-21').estado).toBe('sem_registro');
    expect(um([], '2026-11-22').estado).toBe('pendente');
    expect(classificarDoses(m, [], '2026-11-22', '2026-11-22', new Date('2026-11-24T00:00:00'))[0].estado).toBe('sem_registro');
  });

  it('mudança de cadastro não reescreve o passado', () => {
    const mudou = { ...m, horarios: [{ hora: '08:00', quantidade: 2 }], horariosDesde: new Date('2026-11-20T12:00:00').toISOString() };
    const doses = classificarDoses(mudou, [t('2026-11-18', '20:00')], '2026-11-18', '2026-11-21', agora);
    // antes de horarios_desde só contam as tomadas, com a cópia do previsto; nada de "sem registro" calculado pelo cadastro novo
    expect(doses.map((d) => `${d.data} ${d.hora} ${d.estado}`)).toEqual(['2026-11-18 20:00 tomou', '2026-11-21 08:00 sem_registro']);
    expect(doses[1].quantidadePrevista).toBe(2);
  });

  it('fora de desde/ate do remédio não conta; "se precisar" não tem dose prevista', () => {
    expect(classificarDoses({ ...m, desde: '2026-11-21' }, [], '2026-11-20', '2026-11-21', agora).map((d) => d.data)).toEqual(['2026-11-21', '2026-11-21']);
    expect(classificarDoses({ ...m, ate: '2026-11-20' }, [], '2026-11-20', '2026-11-21', agora).map((d) => d.data)).toEqual(['2026-11-20', '2026-11-20']);
    expect(classificarDoses({ ...m, sePrecisar: true, horarios: [] }, [], '2026-11-16', '2026-11-22', agora)).toEqual([]);
  });

  it('ignora tomadas de outro remédio e tomadas avulsas', () => {
    const doses = classificarDoses(m, [t('2026-11-20', '08:00', { medicacaoId: 'outro' }), t('2026-11-20', '08:00', { dataPrevista: null, horaPrevista: null })], '2026-11-20', '2026-11-20', agora);
    expect(doses.map((d) => d.estado)).toEqual(['sem_registro', 'sem_registro']);
  });
});

describe('classificarDoses — bordas (R-T3-a)', () => {
  it('"Não tomei" seguido de "Tomei de novo" na mesma dose → tomou', () => {
    const d = um([
      t('2026-11-20', '08:00', { tomou: false, quantidade: null }),
      t('2026-11-20', '08:00', { marcadoEm: new Date('2026-11-20T08:30:00').toISOString() }),
    ]);
    expect(d.estado).toBe('tomou');
    expect(d.tomadas).toHaveLength(2);
  });

  it('com atraso se soma a errado', () => {
    const d = um([t('2026-11-20', '08:00', { quantidade: 2, marcadoEm: new Date('2026-11-20T11:00:00').toISOString() })]);
    expect(d).toMatchObject({ estado: 'errado', comAtraso: true });
  });

  it('dose no instante exato de horariosDesde conta', () => {
    const mm = { ...m, horariosDesde: new Date('2026-11-20T08:00:00').toISOString() };
    expect(classificarDoses(mm, [], '2026-11-20', '2026-11-20', agora).map((d) => d.hora)).toEqual(['08:00', '20:00']);
    const depois = { ...m, horariosDesde: new Date('2026-11-20T08:00:01').toISOString() };
    expect(classificarDoses(depois, [], '2026-11-20', '2026-11-20', agora).map((d) => d.hora)).toEqual(['20:00']);
  });

  it('"se precisar" ainda mostra as doses marcadas de quando tinha horário', () => {
    const virou = { ...m, sePrecisar: true, horarios: [] };
    const doses = classificarDoses(virou, [t('2026-11-18', '08:00'), t('2026-11-18', '15:00', { dataPrevista: null, horaPrevista: null })], '2026-11-16', '2026-11-22', agora);
    expect(doses.map((d) => `${d.data} ${d.hora} ${d.estado}`)).toEqual(['2026-11-18 08:00 tomou']);
  });
});

describe('podeMarcar', () => {
  it('hoje e ontem sim; anteontem e amanhã não', () => {
    expect(podeMarcar('2026-11-23', agora)).toBe(true);
    expect(podeMarcar('2026-11-22', agora)).toBe(true);
    expect(podeMarcar('2026-11-21', agora)).toBe(false);
    expect(podeMarcar('2026-11-24', agora)).toBe(false);
  });
});

describe('resumirAdesao', () => {
  const dias = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'];
  const metformina: Medicacao = { ...m, id: 'm2', nome: 'Metformina', dose: '850 mg', horarios: [{ hora: '08:00', quantidade: 1 }] };
  const dipirona: Medicacao = { ...m, id: 'm3', nome: 'Dipirona', dose: null, horarios: [], sePrecisar: true, unidade: 'gota' };
  const parado: Medicacao = { ...m, id: 'm4', nome: 'Antigo', horarios: [{ hora: '08:00', quantidade: 1 }], ate: '2026-11-01' };

  const tomadas: Tomada[] = [];
  for (const d of dias) {
    for (const h of ['08:00', '20:00']) {
      if (d === '2026-11-22' && h === '20:00') continue; // sem marca
      if (d === '2026-11-19' && h === '20:00') tomadas.push(t(d, h, { tomou: false, quantidade: null }));
      else if (d === '2026-11-17' && h === '08:00') tomadas.push(t(d, h, { marcadoEm: new Date('2026-11-17T11:30:00').toISOString() }));
      else tomadas.push(t(d, h));
    }
    tomadas.push(t(d, '08:00', { medicacaoId: 'm2' }));
  }
  for (const d of ['2026-11-16', '2026-11-18', '2026-11-21']) {
    tomadas.push(t(d, '15:00', { medicacaoId: 'm3', dataPrevista: null, horaPrevista: null, quantidadePrevista: null, quantidade: 20 }));
  }

  const meds = [m, metformina, dipirona, parado];

  it('conta tomou, não tomou, errado, sem registro, com atraso e percentual', () => {
    const r = resumirAdesao(meds, tomadas, '2026-11-16', '2026-11-22', new Date('2026-11-24T09:00:00'));
    const por = (id: string) => r.find((x) => x.medicacaoId === id)!;
    expect(por('m1')).toMatchObject({ nome: 'Losartana', dose: '50 mg', unidade: 'comprimido', previstas: 14, tomou: 12, naoTomou: 1, errado: 0, semRegistro: 1, comAtraso: 1, percentual: 86, sePrecisar: false, usosSePrecisar: 0 });
    expect(por('m1').doses).toHaveLength(14);
    expect(por('m2')).toMatchObject({ previstas: 7, tomou: 7, percentual: 100 });
    expect(por('m3')).toMatchObject({ sePrecisar: true, previstas: 0, usosSePrecisar: 3, percentual: null, doses: [] });
    // remédio sem dose nem uso no período não aparece no resumo
    expect(r.map((x) => x.medicacaoId)).toEqual(['m1', 'm2', 'm3']);
  });

  it('pendentes não entram em previstas', () => {
    // agora = 22/11 21:00: as doses de 21/11 e 22/11 ainda estão no prazo
    const semMarca = tomadas.filter((x) => !(x.medicacaoId === 'm2' && (x.dataPrevista === '2026-11-21' || x.dataPrevista === '2026-11-22')));
    const r = resumirAdesao([metformina], semMarca, '2026-11-16', '2026-11-22', new Date('2026-11-22T21:00:00'));
    expect(r[0]).toMatchObject({ previstas: 5, tomou: 5, semRegistro: 0, percentual: 100 });
    expect(r[0].doses.filter((d) => d.estado === 'pendente')).toHaveLength(2);
  });

  it('usosSePrecisar só conta avulsas marcadas dentro da janela (dia local)', () => {
    const fora = [
      ...tomadas,
      t('2026-11-15', '23:30', { medicacaoId: 'm3', dataPrevista: null, horaPrevista: null, quantidadePrevista: null }),
      t('2026-11-23', '00:10', { medicacaoId: 'm3', dataPrevista: null, horaPrevista: null, quantidadePrevista: null }),
    ];
    const agora24 = new Date('2026-11-24T09:00:00');
    expect(resumirAdesao([dipirona], fora, '2026-11-16', '2026-11-22', agora24)[0].usosSePrecisar).toBe(3);
    expect(resumirAdesao([dipirona], fora, '2026-11-16', '2026-11-17', agora24)[0].usosSePrecisar).toBe(1);
    expect(resumirAdesao([dipirona], fora, '2026-11-19', '2026-11-20', agora24)).toEqual([]);
  });

  it('avulsa de remédio com horário fixo não conta nem gera linha sozinha', () => {
    const avulsa = t('2026-11-18', '15:00', { dataPrevista: null, horaPrevista: null });
    const agora24 = new Date('2026-11-24T09:00:00');
    expect(resumirAdesao([{ ...m, ate: '2026-11-01' }], [avulsa], '2026-11-16', '2026-11-22', agora24)).toEqual([]);
    expect(resumirAdesao([m], [avulsa], '2026-11-16', '2026-11-22', agora24)[0].usosSePrecisar).toBe(0);
  });

  it('só pendentes → percentual null', () => {
    const r = resumirAdesao([metformina], [], '2026-11-22', '2026-11-22', new Date('2026-11-22T21:00:00'));
    expect(r[0]).toMatchObject({ previstas: 0, percentual: null });
  });
});
