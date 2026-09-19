import type { PerfilSaude } from '@core/perfil/tipos';
import { paraPerfilRegras } from '../perfilRegras';

const hoje = new Date('2026-09-15T12:00:00Z');
const p: PerfilSaude = {
  userId: 'u', nome: 'A', dataNascimento: '1976-03-10', sexoNascimento: 'feminino', possuiColoUtero: true, histerectomia: false, alturaCm: 165,
  tabagismoStatus: 'ex', cigarrosDia: 20, anosFumando: 25, dataCessacao: '2020-01-01',
  temDiabetes: false, temHipertensao: null, temDoencaRenal: null, temImunossupressao: null, temHiv: true, temDii: null,
  historicoCancerPessoal: [{ tipo: 'Melanoma', ano: 2015 }], lesoesPrecursoras: [], doencasGeneticas: [{ nome: 'BRCA1' }], radioterapiaToracica: false,
  jaTeveAtividadeSexual: true, racaCor: 'parda', menopausa: null, semMedicacoes: false, semAntecedentesFamiliares: false, perfilInicialCompleto: true, marcoSequenciaComemorado: 0, temInsuficienciaCardiaca: null, aguaMetaComemoradaEm: null, lembretesAgua: { ativo: false, inicio: '08:00', fim: '20:00', intervaloMin: 120 },
  tipoDiabetes: null, usaInsulina: null, eventoCvPrevio: null, perfilMetaGlicemica: 'adulto', metasGlicemia: null, planoGlicemia: null, agravantesCv: { itens: [], atualizadoEm: null }, atividadeFisicaRegular: null, preferenciasLembretes: { exame: true, mrpa: true, glicemia: true, medicacao: true, consulta: true, atualizacao: true, agua: false }, pesoMaximoVidaKg: null, objetivoPeso: null,
};

test('converte perfil de domínio em PerfilRegras com derivados', () => {
  const r = paraPerfilRegras(p, [{ id: '1', parentesco: 'mae', grau: 'primeiro', condicao: 'mama', idadeDiagnostico: 48, observacao: null }], 68, hoje);
  expect(r.idade).toBe(50);
  expect(r.tabagismo).toEqual({ status: 'ex', macosAno: 25, anosDesdeCessacao: 6 });
  expect(r.imc).toBe(25);
  expect(r.condicoes.hiv).toBe(true);
  expect(r.historicoCancerPessoal).toEqual(['Melanoma']);
  expect(r.doencasGeneticas).toEqual(['BRCA1']);
  expect(r.racaCor).toBe('parda');
  expect(r.antecedentes[0]).toEqual({ condicao: 'mama', grau: 'primeiro', idadeDiagnostico: 48 });
});

test('sem peso ou altura → imc null; fumante atual → anosDesdeCessacao null', () => {
  const r = paraPerfilRegras({ ...p, tabagismoStatus: 'atual', alturaCm: null }, [], null, hoje);
  expect(r.imc).toBeNull();
  expect(r.tabagismo.anosDesdeCessacao).toBeNull();
});
