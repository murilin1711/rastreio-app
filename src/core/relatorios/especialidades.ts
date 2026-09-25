import type { ChaveSecao, Especialidade } from './tipos';

/**
 * Cada especialidade tem dois nomes: o `comum`, que é como o paciente chama o médico dele, e o
 * `rotulo` técnico, que aparece menor embaixo (D-025). Onde o termo técnico já é a palavra que a
 * pessoa usa — ginecologista, urologista, oncologista — não há tradução e `comum` é o próprio nome.
 */
export const ESPECIALIDADES: { id: Especialidade; rotulo: string; comum: string }[] = [
  { id: 'cardiologia', rotulo: 'Cardiologia', comum: 'Médico do coração' },
  { id: 'endocrinologia', rotulo: 'Endocrinologia', comum: 'Médico dos hormônios e do diabetes' },
  { id: 'clinica_medica', rotulo: 'Clínica médica', comum: 'Clínico geral' },
  { id: 'ginecologia', rotulo: 'Ginecologia', comum: 'Ginecologista' },
  { id: 'mastologia', rotulo: 'Mastologia', comum: 'Médico da mama' },
  { id: 'urologia', rotulo: 'Urologia', comum: 'Urologista' },
  { id: 'gastro_coloprocto', rotulo: 'Gastroenterologia / coloproctologia', comum: 'Médico do estômago e do intestino' },
  { id: 'pneumologia', rotulo: 'Pneumologia', comum: 'Médico do pulmão' },
  { id: 'oncologia', rotulo: 'Oncologia', comum: 'Oncologista' },
  { id: 'outra', rotulo: 'Outra especialidade', comum: 'Outro médico' },
];

/** Nome em linguagem de paciente; vazio quando é igual ao técnico (não repetir na tela). */
export function nomeComum(id: Especialidade): string {
  return ESPECIALIDADES.find((e) => e.id === id)?.comum ?? id;
}
export function temTraducao(id: Especialidade): boolean {
  const e = ESPECIALIDADES.find((x) => x.id === id);
  return !!e && e.comum !== e.rotulo;
}

export function rotuloEspecialidade(id: Especialidade): string {
  return ESPECIALIDADES.find((e) => e.id === id)?.rotulo ?? id;
}

/** Bloco sempre presente em qualquer consulta (D-009): perfil, medicamentos ativos, documentos do período. */
export const SEMPRE_PRESENTE: ChaveSecao[] = ['perfil', 'medicamentos', 'documentos'];

/**
 * Ordem das seções priorizadas por especialidade (D-009, revista em D-025). 'outra' = relatório geral.
 *
 * Ordem dentro de cada lista: medidas → laboratório → fatores de risco → exames → cálculo de risco →
 * check-up → pendências. As entradas do PREVENT (IMC, tabagismo, função renal, HbA1c) vêm antes da
 * seção do PREVENT, para o médico ler o resultado depois de ver de onde ele saiu.
 *
 * O que não está aqui não some do documento: entra na parte final, "Outras informações do meu
 * histórico" (ver `montarConsulta`). Esta lista decide o que vem **na frente**, não o que existe.
 */
export const PRIORIDADES: Record<Especialidade, ChaveSecao[]> = {
  cardiologia: ['mrpa', 'pa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'corpo', 'tabagismo', 'exames_cardio', 'prevent', 'agravantes', 'checkup', 'pendencias'],
  endocrinologia: ['glicemia', 'hba1c', 'lipidios', 'tsh', 'renal', 'corpo', 'alimentacao', 'atividade', 'tabagismo', 'pa', 'prevent', 'pendencias'],
  clinica_medica: ['checkup', 'pa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'corpo', 'tabagismo', 'rastreamentos_status', 'prevent', 'atividade', 'hist_familiar', 'pendencias', 'sintomas'],
  ginecologia: ['colo', 'mama', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas'],
  mastologia: ['mama', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas'],
  urologia: ['prostata', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas'],
  gastro_coloprocto: ['colorretal', 'hist_familiar', 'tabagismo', 'pendencias', 'sintomas'],
  pneumologia: ['tabagismo', 'pulmao', 'pendencias', 'sintomas'],
  oncologia: ['rastreamentos_status', 'mama', 'colo', 'colorretal', 'pulmao', 'prostata', 'sintomas', 'hist_familiar', 'tabagismo', 'pendencias'],
  outra: [],
};

/** Ordem do relatório cardiovascular (§26, §61). */
export const SECOES_CARDIO: ChaveSecao[] = ['perfil', 'medicamentos', 'pa', 'mrpa', 'glicemia', 'hba1c', 'lipidios', 'renal', 'exames_cardio', 'prevent', 'agravantes', 'checkup', 'documentos'];

/** Ordem do relatório de rastreamento oncológico (§40, §61). */
export const SECOES_ONCOLOGICO: ChaveSecao[] = ['perfil', 'hist_familiar', 'tabagismo', 'rastreamentos_status', 'mama', 'colo', 'colorretal', 'pulmao', 'prostata', 'sintomas', 'documentos'];

/** Relatório de Saúde & Hábitos (§88). */
export const SECOES_BEMESTAR: ChaveSecao[] = ['perfil', 'corpo', 'alimentacao', 'agua', 'atividade', 'sono', 'checkins', 'documentos'];

/**
 * Relatório geral = união, sem repetir (§61). É o documento que promete tudo, então **toda** chave de
 * `ChaveSecao` precisa estar aqui — `agua` tinha ficado de fora até 23/09/2026. Há um teste que trava
 * essa regressão e quebra sozinho quando uma seção nova nascer fora desta lista.
 */
export const SECOES_GERAL: ChaveSecao[] = Array.from(new Set<ChaveSecao>([...SECOES_CARDIO, ...SECOES_ONCOLOGICO, 'corpo', 'alimentacao', 'agua', 'atividade', 'sono', 'checkins', 'consultas']));
