import type { PerfilSaude } from '@core/perfil/tipos';
import { montarItensHoje } from '../montarItensHoje';

const completo: PerfilSaude = {
  userId: 'u', nome: 'Ana', dataNascimento: '1980-01-01', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'nunca', cigarrosDia: null, anosFumando: null, dataCessacao: null,
  temDiabetes: false, temHipertensao: false, temDoencaRenal: false, temImunossupressao: false, temHiv: false, temDii: false,
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false, jaTeveAtividadeSexual: null, racaCor: null, menopausa: null, semMedicacoes: false, semAntecedentesFamiliares: false, perfilInicialCompleto: true,
  tipoDiabetes: null, usaInsulina: null, eventoCvPrevio: null, perfilMetaGlicemica: 'adulto', metasGlicemia: null, planoGlicemia: null, agravantesCv: { itens: [], atualizadoEm: null }, atividadeFisicaRegular: null,
};

test('perfil com campo essencial nulo → "Completar meu perfil" (amarelo)', () => {
  const itens = montarItensHoje({ perfil: { ...completo, tabagismoStatus: null }, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens.find((i) => i.id === 'perfil_incompleto')?.nivel).toBe('amarelo');
});

test('sem antecedentes → sugestão (cinza)', () => {
  expect(montarItensHoje({ perfil: completo, antecedentesQtd: 0, medicacoesAtivasQtd: 1 }).find((i) => i.id === 'antecedentes')?.nivel).toBe('cinza');
});

test('sem medicações → sugestão (cinza)', () => {
  expect(montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 0 }).map((i) => i.id)).toContain('medicacoes');
});

test('tudo preenchido → um único item positivo', () => {
  const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 });
  expect(itens).toHaveLength(1);
  expect(itens[0]).toMatchObject({ id: 'tudo_em_dia', nivel: 'verde' });
});

test('ordena por gravidade: amarelo antes de cinza', () => {
  const itens = montarItensHoje({ perfil: { ...completo, alturaCm: null }, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens[0].nivel).toBe('amarelo');
  expect(itens).toHaveLength(3);
});

test('perfil nulo (ainda carregando) → não sugere nada além de perfil', () => {
  const itens = montarItensHoje({ perfil: null, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens).toHaveLength(0);
});

test('declarou que não usa medicamentos → pendência de medicamentos não aparece', () => {
  const itens = montarItensHoje({ perfil: { ...completo, semMedicacoes: true }, antecedentesQtd: 1, medicacoesAtivasQtd: 0 });
  expect(itens.map((i) => i.id)).not.toContain('medicacoes');
});

test('declarou que não há casos na família → pendência de antecedentes não aparece', () => {
  const itens = montarItensHoje({ perfil: { ...completo, semAntecedentesFamiliares: true }, antecedentesQtd: 0, medicacoesAtivasQtd: 1 });
  expect(itens.map((i) => i.id)).not.toContain('antecedentes');
});

test('pendências de antecedentes e medicamentos oferecem ação secundária de declaração negativa', () => {
  const itens = montarItensHoje({ perfil: completo, antecedentesQtd: 0, medicacoesAtivasQtd: 0 });
  expect(itens.find((i) => i.id === 'medicacoes')?.acaoSecundaria).toEqual({ rotulo: 'Não uso medicamentos', campo: 'semMedicacoes' });
  expect(itens.find((i) => i.id === 'antecedentes')?.acaoSecundaria).toEqual({ rotulo: 'Não há casos na família', campo: 'semAntecedentesFamiliares' });
});

describe('itens do Rastreando na Home (§56, §66)', () => {
  const base = { perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 };
  test('sintoma de alarme → vermelho, no topo', () => {
    const itens = montarItensHoje({ ...base, rastreando: { sintomas: [{ programa: 'mama' }], pendencias: [{ programa: 'colorretal', descricao: 'Colonoscopia', nivelAlerta: 'laranja' }], avaliacoes: {} } });
    expect(itens[0]).toMatchObject({ id: 'sintoma_mama', nivel: 'vermelho' });
  });
  test('pendência → nível da pendência com verbo de ação', () => {
    const itens = montarItensHoje({ ...base, rastreando: { sintomas: [], pendencias: [{ programa: 'colorretal', descricao: 'Colonoscopia', nivelAlerta: 'laranja' }], avaliacoes: {} } });
    expect(itens.find((i) => i.id === 'pendencia_colorretal')).toMatchObject({ nivel: 'laranja', titulo: 'Concluir pendência: colonoscopia' });
  });
  test('exame atrasado → laranja; exame próximo → amarelo com data', () => {
    const itens = montarItensHoje({ ...base, rastreando: { sintomas: [], pendencias: [], avaliacoes: { mama: { status: 'exame_atrasado', proximaData: '2026-01-01' }, colo_utero: { status: 'exame_proximo', proximaData: '2026-10-05' } } } });
    expect(itens.find((i) => i.id === 'atrasado_mama')?.nivel).toBe('laranja');
    expect(itens.find((i) => i.id === 'proximo_colo_utero')?.descricao).toContain('05/10/2026');
  });
  test('tudo em dia com rastreando → item verde único', () => {
    const itens = montarItensHoje({ ...base, rastreando: { sintomas: [], pendencias: [], avaliacoes: { mama: { status: 'em_dia', proximaData: '2027-01-01' } } } });
    expect(itens).toHaveLength(1);
    expect(itens[0].nivel).toBe('verde');
  });
});

describe('itens do Coração & Metabolismo (Fase 2a)', () => {
  const base = { perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 };
  const vazio = { ultimaPA: null, mrpaAtiva: null, mrpaAcimaSemLeitura: null };

  test('PA muito elevada nas últimas 24 h vira item laranja/vermelho', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, ultimaPA: { pas: 185, pad: 95, medidoEm: new Date().toISOString(), nivel: 'laranja' } } });
    expect(itens[0]).toMatchObject({ id: 'pa_elevada', nivel: 'laranja', rota: '/(app)/coracao/pressao' });
  });
  test('PA muito elevada de 2 dias atrás não vira item', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, ultimaPA: { pas: 185, pad: 95, medidoEm: new Date(Date.now() - 2 * 86_400_000).toISOString(), nivel: 'laranja' } } });
    expect(itens.some((i) => i.id === 'pa_elevada')).toBe(false);
  });
  test('MRPA em andamento com período faltando hoje vira item amarelo com o dia', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, mrpaAtiva: { id: 's1', dia: 3, diasPrevistos: 6, faltaHoje: ['noite'] } } });
    expect(itens[0]).toMatchObject({ id: 'mrpa_hoje', nivel: 'amarelo', titulo: 'Fazer as medidas da noite — MRPA, dia 3 de 6', rota: '/(app)/coracao/mrpa/s1' });
  });
  test('MRPA concluída acima da referência vira item amarelo para levar ao médico', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, mrpaAcimaSemLeitura: { id: 's2', concluidaEm: '2026-09-12T10:00:00Z' } } });
    expect(itens.find((i) => i.id === 'mrpa_levar')).toMatchObject({ nivel: 'amarelo', rota: '/(app)/coracao/mrpa/relatorio?sessao=s2' });
  });
  test('sem cardio nada muda', () => {
    expect(montarItensHoje(base).some((i) => i.id.startsWith('pa_') || i.id.startsWith('mrpa_'))).toBe(false);
  });
});

describe('itens do Coração & Metabolismo (Fase 2b)', () => {
  const base = { perfil: completo, antecedentesQtd: 1, medicacoesAtivasQtd: 1 };
  const vazio = { ultimaPA: null, mrpaAtiva: null, mrpaAcimaSemLeitura: null };

  test('glicemia laranja/vermelha nas últimas 24 h vira item', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, glicemia: { mgdl: 48, medidoEm: new Date().toISOString(), nivel: 'laranja' } } });
    expect(itens[0]).toMatchObject({ id: 'glicemia_alerta', nivel: 'laranja', rota: '/(app)/coracao/glicemia' });
  });
  test('horário do plano vencido sem medida vira item amarelo', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, planoVencidoHoje: { momento: 'antes_almoco', rotulo: 'antes do almoço', hora: '12:00' } } });
    expect(itens[0]).toMatchObject({ id: 'glicemia_plano', nivel: 'amarelo', titulo: 'Medir glicemia — antes do almoço', rota: '/(app)/coracao/glicemia/registrar' });
  });
  test('check-up com item faltante vira item cinza com a frase', () => {
    const itens = montarItensHoje({ ...base, cardio: { ...vazio, checkup: { atualizados: 5, total: 8, faltante: 'Falta atualizar seu perfil lipídico.' } } });
    expect(itens.find((i) => i.id === 'checkup')).toMatchObject({ nivel: 'cinza', titulo: 'Atualizar minha prevenção: 5 de 8 em dia', descricao: 'Falta atualizar seu perfil lipídico.', rota: '/(app)/coracao/checkup' });
  });
  test('check-up completo não vira item', () => {
    expect(montarItensHoje({ ...base, cardio: { ...vazio, checkup: { atualizados: 8, total: 8, faltante: null } } }).some((i) => i.id === 'checkup')).toBe(false);
  });
});
