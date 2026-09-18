import type { RegraParametros } from '../../tipos';

const base = { versao: '2026.2', ano: 2026, intervaloMeses: null, proximaAcao: '' };

/** Espelho da semente `supabase/seed.sql` (programa glicemia). Manter igual. */
export function regrasGlicemiaTeste(): RegraParametros[] {
  return [
    { ...base, id: 'g-meta-adulto', fonte: 'SBD 2026 Metas R6/T1', condicao: { camada: 'metas', perfil: 'adulto', jejum: [80, 130], pos: 180, deitar: [90, 150] }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Metas para adultos.' },
    { ...base, id: 'g-meta-idoso-c', fonte: 'SBD 2026 T1', condicao: { camada: 'metas', perfil: 'idoso_comprometido', jejum: [90, 150], pos: 180, deitar: [100, 180] }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Metas idoso comprometido.' },
    { ...base, id: 'g-meta-idoso-mc', fonte: 'SBD 2026 T1', condicao: { camada: 'metas', perfil: 'idoso_muito_comprometido', jejum: [100, 180], pos: null, deitar: [110, 200] }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Metas idoso muito comprometido.' },
    { ...base, id: 'g-hipo1', fonte: 'SBD 2026 nível 1', condicao: { camada: 'hipo_n1', min: 54, max: 69 }, classificacao: 'controle', nivelAlerta: 'amarelo', mensagemPaciente: 'Abaixo de 70: siga a orientação do seu médico.' },
    { ...base, id: 'g-hipo2', fonte: 'SBD 2026 nível 2', condicao: { camada: 'hipo_n2', max: 53 }, classificacao: 'investigacao', nivelAlerta: 'laranja', mensagemPaciente: 'Muito baixa: intervenção imediata.' },
    { ...base, id: 'g-hipo3', fonte: 'SBD 2026 nível 3', condicao: { camada: 'hipo_n3', sintomas: ['confusao', 'precisou_de_ajuda'] }, classificacao: 'especializado', nivelAlerta: 'vermelho', mensagemPaciente: 'Emergência.' },
    { ...base, id: 'g-hiper', fonte: 'SBD 2026 dias de doença T1', condicao: { camada: 'hiper', min: 251 }, classificacao: 'investigacao', nivelAlerta: 'laranja', mensagemPaciente: 'Muito alta: repita.' },
    { ...base, id: 'g-hiper-s', fonte: 'SBD 2026 CAD', condicao: { camada: 'hiper_sintoma', min: 251, sintomas: ['nausea', 'vomito', 'dor_abdominal', 'respiracao_rapida', 'sonolencia'] }, classificacao: 'especializado', nivelAlerta: 'vermelho', mensagemPaciente: 'Emergência.' },
    { ...base, id: 'g-sem-dm', fonte: 'SBD 2026 Diagnóstico', condicao: { camada: 'sem_diabetes', jejum_normal_max: 99, jejum_pre_max: 125, jejum_dm: 126, casual_dm: 200 }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Capilar não faz diagnóstico; converse com seu médico.' },
  ];
}
