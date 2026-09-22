import type { ChaveSecao, Especialidade } from './tipos';

export const ESPECIALIDADES: { id: Especialidade; rotulo: string }[] = [
  { id: 'cardiologia', rotulo: 'Cardiologia' },
  { id: 'endocrinologia', rotulo: 'Endocrinologia' },
  { id: 'clinica_medica', rotulo: 'Clínica médica' },
  { id: 'ginecologia', rotulo: 'Ginecologia' },
  { id: 'mastologia', rotulo: 'Mastologia' },
  { id: 'urologia', rotulo: 'Urologia' },
  { id: 'gastro_coloprocto', rotulo: 'Gastroenterologia / coloproctologia' },
  { id: 'pneumologia', rotulo: 'Pneumologia' },
  { id: 'oncologia', rotulo: 'Oncologia' },
  { id: 'outra', rotulo: 'Outra especialidade' },
];

export function rotuloEspecialidade(id: Especialidade): string {
  return ESPECIALIDADES.find((e) => e.id === id)?.rotulo ?? id;
}

/** Bloco sempre presente em qualquer consulta (D-009): perfil, medicamentos ativos, documentos do período. */
export const SEMPRE_PRESENTE: ChaveSecao[] = ['perfil', 'medicamentos', 'documentos'];

/** Ordem das seções priorizadas por especialidade (D-009). 'outra' = relatório geral. */
export const PRIORIDADES: Record<Especialidade, ChaveSecao[]> = {
  cardiologia: ['mrpa', 'pa', 'glicemia', 'lipidios', 'renal', 'exames_cardio', 'prevent', 'agravantes'],
  endocrinologia: ['glicemia', 'hba1c', 'lipidios', 'tsh', 'corpo', 'atividade', 'pa', 'prevent'],
  clinica_medica: ['checkup', 'pa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'rastreamentos_status', 'prevent', 'corpo', 'atividade'],
  ginecologia: ['colo', 'mama', 'hist_familiar'],
  mastologia: ['mama', 'hist_familiar'],
  urologia: ['prostata', 'hist_familiar'],
  gastro_coloprocto: ['colorretal', 'hist_familiar'],
  pneumologia: ['tabagismo', 'pulmao'],
  oncologia: ['rastreamentos_status', 'mama', 'colo', 'colorretal', 'pulmao', 'prostata', 'sintomas', 'hist_familiar'],
  outra: [],
};

/** Ordem do relatório cardiovascular (§26, §61). */
export const SECOES_CARDIO: ChaveSecao[] = ['perfil', 'medicamentos', 'pa', 'mrpa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'exames_cardio', 'prevent', 'agravantes', 'checkup', 'documentos'];

/** Ordem do relatório de rastreamento oncológico (§40, §61). */
export const SECOES_ONCOLOGICO: ChaveSecao[] = ['perfil', 'hist_familiar', 'tabagismo', 'rastreamentos_status', 'mama', 'colo', 'colorretal', 'pulmao', 'prostata', 'sintomas', 'documentos'];

/** Relatório de Saúde & Hábitos (§88). */
export const SECOES_BEMESTAR: ChaveSecao[] = ['perfil', 'corpo', 'alimentacao', 'agua', 'atividade', 'sono', 'checkins', 'documentos'];

/** Relatório geral = união, sem repetir (§61). */
export const SECOES_GERAL: ChaveSecao[] = Array.from(new Set<ChaveSecao>([...SECOES_CARDIO, ...SECOES_ONCOLOGICO, 'corpo', 'alimentacao', 'atividade', 'sono', 'checkins', 'consultas']));
