import type { PerfilSaude } from '@core/perfil/tipos';
import { perguntasFaltantes } from '../perguntasFaltantes';

const completo: PerfilSaude = {
  userId: 'u', nome: 'A', dataNascimento: '1976-03-10', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'nunca', cigarrosDia: null, anosFumando: null, dataCessacao: null,
  temDiabetes: false, temHipertensao: false, temDoencaRenal: false, temImunossupressao: false, temHiv: false, temDii: false,
  historicoCancerPessoal: [], lesoesPrecursoras: [], doencasGeneticas: [], radioterapiaToracica: false,
  jaTeveAtividadeSexual: true, racaCor: 'parda', menopausa: null, semMedicacoes: false, semAntecedentesFamiliares: true, perfilInicialCompleto: true,
  tipoDiabetes: null, usaInsulina: null, eventoCvPrevio: null, perfilMetaGlicemica: 'adulto', metasGlicemia: null, planoGlicemia: null, agravantesCv: { itens: [], atualizadoEm: null }, atividadeFisicaRegular: null,
};

test('perfil completo → nada falta', () => {
  for (const p of ['mama', 'colo_utero', 'colorretal', 'pulmao', 'prostata'] as const) {
    expect(perguntasFaltantes(p, { ...completo, sexoNascimento: p === 'prostata' ? 'masculino' : 'feminino' }, 0, true)).toEqual([]);
  }
});
test('mama: falta radioterapia torácica e antecedentes', () => {
  expect(perguntasFaltantes('mama', { ...completo, radioterapiaToracica: null }, 0, false)).toEqual(['antecedentes', 'radioterapiaToracica']);
});
test('colo: falta atividade sexual e HIV', () => {
  expect(perguntasFaltantes('colo_utero', { ...completo, jaTeveAtividadeSexual: null, temHiv: null }, 0, true)).toEqual(['jaTeveAtividadeSexual', 'temHiv']);
});
test('pulmão: fumante sem cigarros/dia → pede cigarros e anos; ex sem data → pede data', () => {
  expect(perguntasFaltantes('pulmao', { ...completo, tabagismoStatus: 'atual' }, 0, true)).toEqual(['cigarrosDia', 'anosFumando']);
  expect(perguntasFaltantes('pulmao', { ...completo, tabagismoStatus: 'ex', cigarrosDia: 20, anosFumando: 10 }, 0, true)).toEqual(['dataCessacao']);
  expect(perguntasFaltantes('pulmao', { ...completo, tabagismoStatus: null }, 0, true)).toEqual(['tabagismoStatus']);
});
test('próstata: falta raça/cor e antecedentes; antecedentes registrados dispensam a declaração', () => {
  expect(perguntasFaltantes('prostata', { ...completo, sexoNascimento: 'masculino', racaCor: null, semAntecedentesFamiliares: false }, 0, false)).toEqual(['antecedentes', 'racaCor']);
  expect(perguntasFaltantes('prostata', { ...completo, sexoNascimento: 'masculino', semAntecedentesFamiliares: false }, 2, false)).toEqual([]);
});
test('colorretal: falta DII', () => {
  expect(perguntasFaltantes('colorretal', { ...completo, temDii: null }, 1, false)).toEqual(['temDii']);
});
