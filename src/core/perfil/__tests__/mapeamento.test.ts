import { paraBanco, paraDominio } from '../mapeamento';

const row = {
  user_id: 'u1', nome: 'Ana', data_nascimento: '1980-05-02', sexo_nascimento: 'feminino', possui_colo_utero: true, histerectomia: false,
  altura_cm: 165, tabagismo_status: 'ex', cigarros_dia: 10, anos_fumando: 12, data_cessacao: '2020-01-01',
  tem_diabetes: false, tem_hipertensao: null, tem_doenca_renal: null, tem_imunossupressao: null, tem_hiv: null, tem_dii: null,
  historico_cancer_pessoal: [], lesoes_precursoras: [], doencas_geneticas: [{ nome: 'BRCA1' }], radioterapia_toracica: null,
  tipo_usuario: 'paciente', ja_teve_atividade_sexual: null, raca_cor: null, menopausa: null, sem_medicacoes: false, sem_antecedentes_familiares: false, perfil_inicial_completo: true, created_at: '', updated_at: '',
};

test('paraDominio converte snake_case → camelCase', () => {
  const p = paraDominio(row);
  expect(p.userId).toBe('u1');
  expect(p.dataNascimento).toBe('1980-05-02');
  expect(p.tabagismoStatus).toBe('ex');
  expect(p.doencasGeneticas).toEqual([{ nome: 'BRCA1' }]);
  expect(p.perfilInicialCompleto).toBe(true);
});

test('paraBanco converte só os campos presentes', () => {
  expect(paraBanco({ alturaCm: 170, temDiabetes: true })).toEqual({ altura_cm: 170, tem_diabetes: true });
});

test('paraBanco ignora undefined mas preserva null (limpar campo)', () => {
  expect(paraBanco({ dataCessacao: null, cigarrosDia: undefined })).toEqual({ data_cessacao: null });
});

test('ida e volta preserva os dados', () => {
  const p = paraDominio(row);
  const { userId, ...resto } = p;
  const volta = paraDominio({ ...row, ...paraBanco(resto) });
  expect(volta).toEqual(p);
});
