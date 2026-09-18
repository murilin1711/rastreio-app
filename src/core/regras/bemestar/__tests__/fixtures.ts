import type { RegraParametros } from '../../tipos';

const base = { versao: '2026.3', ano: 2026, intervaloMeses: null, proximaAcao: '', classificacao: 'normal' as const, nivelAlerta: 'cinza' as const };

/** Espelho da semente `supabase/seed.sql` (programa bem_estar). Manter igual. */
export function regrasBemEstarTeste(): RegraParametros[] {
  return [
    { ...base, id: 'b-imc', fonte: 'ABESO 2016 T4', ano: 2016, condicao: { camada: 'faixas', baixo: 18.5, sobrepeso: 25, obesidade_1: 30, obesidade_2: 35, obesidade_3: 40 }, mensagemPaciente: 'O IMC é uma ferramenta…' },
    { ...base, id: 'b-imc-idoso', fonte: 'ABESO 2016 Rec. 1C', ano: 2016, condicao: { camada: 'idoso', idade_min: 60, baixo: 22, alto: 27 }, mensagemPaciente: 'A partir dos 60 anos…' },
    { ...base, id: 'b-cintura', fonte: 'ABESO 2016 T5 · DBHA 2025', ano: 2025, condicao: { camada: 'cintura', h_aumentado: 90, m_aumentado: 80, h_muito: 102, m_muito: 88 }, mensagemPaciente: 'Circunferência abdominal…' },
    { ...base, id: 'b-rca', fonte: 'ABESO 2016 Rec. 1F · ABESO 2026 R5', condicao: { camada: 'rca', limite: 0.5 }, mensagemPaciente: 'Relação cintura/altura…' },
    { ...base, id: 'b-rcq', fonte: 'OMS 2011 A1', ano: 2011, condicao: { camada: 'rcq', h: 0.9, m: 0.85 }, mensagemPaciente: 'Relação cintura/quadril…' },
    { ...base, id: 'b-tecnica', fonte: 'OMS 2011', ano: 2011, condicao: { camada: 'tecnica' }, mensagemPaciente: 'Como medir a cintura…' },
    { ...base, id: 'b-ativ', fonte: 'OMS 2020 · MS 2021', ano: 2021, condicao: { camada: 'meta', moderada_min: 150, moderada_max: 300, vigorosa_min: 75, vigorosa_max: 150, fator_vigorosa: 2, fortalecimento_dias: 2, idoso_idade: 60, equilibrio_dias: 3 }, mensagemPaciente: 'A OMS recomenda… Qualquer atividade é melhor do que nenhuma.' },
    { ...base, id: 'b-sono', fonte: 'AASM/SRS 2015', ano: 2015, condicao: { camada: 'duracao', minimo_min: 420, maximo_incerto_min: 540 }, mensagemPaciente: 'Adultos devem dormir 7 horas ou mais…' },
    { ...base, id: 'b-tend', fonte: 'C-019', condicao: { camada: 'tendencia', minimo_medidas: 3, janela_dias: 14, limiar_pct: 1 }, mensagemPaciente: 'A tendência do peso…' },
    { ...base, id: 'b-pmav', fonte: 'ABESO 2026 R8', condicao: { camada: 'pmav', imc_min: 30, imc_2: 40, imc_max: 50, reduzida_1: 5, controlada_1: 10, reduzida_2: 10, controlada_2: 15 }, mensagemPaciente: 'Peso máximo da vida…' },
    { ...base, id: 'b-perda', fonte: 'C-019', condicao: { camada: 'perda_nao_intencional', pct: 5, meses: 6 }, proximaAcao: 'Conversar com o médico', mensagemPaciente: 'Seu peso caiu mais de 5%…' },
    { ...base, id: 'b-vinculo', fonte: 'C-020', condicao: { camada: 'janela', horas: 3 }, mensagemPaciente: 'Esta glicemia está relacionada…' },
  ];
}
