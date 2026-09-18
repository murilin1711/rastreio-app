/** Lista fechada de exames do módulo cardio (spec §4.4; §9, §11). Interpretação de laboratório é do médico. */
export type TipoLab = 'hemograma' | 'glicemia_plasmatica' | 'hba1c' | 'colesterol_total' | 'ldl' | 'hdl' | 'triglicerideos' | 'nao_hdl' | 'creatinina' | 'tfg' | 'ureia' | 'sodio' | 'potassio' | 'magnesio' | 'rac_urinaria' | 'tsh' | 'vitamina_b12' | 'vitamina_d' | 'tgo' | 'tgp' | 'fosfatase_alcalina' | 'gama_gt' | 'lpa' | 'pcr_us' | 'outro_laboratorial';
export type TipoCardio = 'ecg' | 'ecocardiograma' | 'teste_ergometrico' | 'holter' | 'mapa' | 'mrpa_externa' | 'cac' | 'angiotc_coronarias' | 'doppler_carotidas' | 'rm_cardiaca' | 'cintilografia' | 'cateterismo' | 'outro_cardiologico';
export type TipoExameCardio = TipoLab | TipoCardio;
export type ChavePreventExame = 'colesterolTotal' | 'hdl' | 'creatinina' | 'tfg' | 'hba1c' | 'rac';

export const TIPOS_LAB: { tipo: TipoLab; rotulo: string; unidade: string; chavePrevent?: ChavePreventExame }[] = [
  { tipo: 'glicemia_plasmatica', rotulo: 'Glicemia de jejum (laboratório)', unidade: 'mg/dL' },
  { tipo: 'hba1c', rotulo: 'Hemoglobina glicada (HbA1c)', unidade: '%', chavePrevent: 'hba1c' },
  { tipo: 'colesterol_total', rotulo: 'Colesterol total', unidade: 'mg/dL', chavePrevent: 'colesterolTotal' },
  { tipo: 'ldl', rotulo: 'LDL-colesterol', unidade: 'mg/dL' },
  { tipo: 'hdl', rotulo: 'HDL-colesterol', unidade: 'mg/dL', chavePrevent: 'hdl' },
  { tipo: 'triglicerideos', rotulo: 'Triglicerídeos', unidade: 'mg/dL' },
  { tipo: 'nao_hdl', rotulo: 'Colesterol não-HDL', unidade: 'mg/dL' },
  { tipo: 'creatinina', rotulo: 'Creatinina', unidade: 'mg/dL', chavePrevent: 'creatinina' },
  { tipo: 'tfg', rotulo: 'Taxa de filtração glomerular (TFG)', unidade: 'mL/min/1,73 m²', chavePrevent: 'tfg' },
  { tipo: 'rac_urinaria', rotulo: 'Albumina/creatinina urinária', unidade: 'mg/g', chavePrevent: 'rac' },
  { tipo: 'ureia', rotulo: 'Ureia', unidade: 'mg/dL' },
  { tipo: 'sodio', rotulo: 'Sódio', unidade: 'mEq/L' },
  { tipo: 'potassio', rotulo: 'Potássio', unidade: 'mEq/L' },
  { tipo: 'magnesio', rotulo: 'Magnésio', unidade: 'mg/dL' },
  { tipo: 'tsh', rotulo: 'TSH', unidade: 'mUI/L' },
  { tipo: 'vitamina_b12', rotulo: 'Vitamina B12', unidade: 'pg/mL' },
  { tipo: 'vitamina_d', rotulo: 'Vitamina D (25-OH)', unidade: 'ng/mL' },
  { tipo: 'tgo', rotulo: 'TGO (AST)', unidade: 'U/L' },
  { tipo: 'tgp', rotulo: 'TGP (ALT)', unidade: 'U/L' },
  { tipo: 'fosfatase_alcalina', rotulo: 'Fosfatase alcalina', unidade: 'U/L' },
  { tipo: 'gama_gt', rotulo: 'Gama GT', unidade: 'U/L' },
  { tipo: 'lpa', rotulo: 'Lipoproteína(a)', unidade: 'mg/dL' },
  { tipo: 'pcr_us', rotulo: 'Proteína C-reativa ultrassensível', unidade: 'mg/L' },
  { tipo: 'hemograma', rotulo: 'Hemograma (resumo)', unidade: '' },
  { tipo: 'outro_laboratorial', rotulo: 'Outro exame de laboratório', unidade: '' },
];

export const TIPOS_CARDIO: { tipo: TipoCardio; rotulo: string }[] = [
  { tipo: 'ecg', rotulo: 'Eletrocardiograma' },
  { tipo: 'ecocardiograma', rotulo: 'Ecocardiograma' },
  { tipo: 'teste_ergometrico', rotulo: 'Teste ergométrico' },
  { tipo: 'holter', rotulo: 'Holter' },
  { tipo: 'mapa', rotulo: 'MAPA' },
  { tipo: 'mrpa_externa', rotulo: 'MRPA (feita fora do app)' },
  { tipo: 'cac', rotulo: 'Escore de cálcio coronariano' },
  { tipo: 'angiotc_coronarias', rotulo: 'Angiotomografia de coronárias' },
  { tipo: 'doppler_carotidas', rotulo: 'Doppler de carótidas' },
  { tipo: 'rm_cardiaca', rotulo: 'Ressonância cardíaca' },
  { tipo: 'cintilografia', rotulo: 'Cintilografia miocárdica' },
  { tipo: 'cateterismo', rotulo: 'Cateterismo' },
  { tipo: 'outro_cardiologico', rotulo: 'Outro exame cardiológico' },
];

export const TIPOS_LAB_IDS = TIPOS_LAB.map((t) => t.tipo);
export const TIPOS_CARDIO_IDS = TIPOS_CARDIO.map((t) => t.tipo);

export function rotuloExame(tipo: string): string {
  return TIPOS_LAB.find((t) => t.tipo === tipo)?.rotulo ?? TIPOS_CARDIO.find((t) => t.tipo === tipo)?.rotulo ?? tipo;
}
export function unidadePadrao(tipo: string): string {
  return TIPOS_LAB.find((t) => t.tipo === tipo)?.unidade ?? '';
}
export function categoriaDe(tipo: string): 'laboratorial' | 'cardiologico' {
  return (TIPOS_CARDIO_IDS as string[]).includes(tipo) ? 'cardiologico' : 'laboratorial';
}
