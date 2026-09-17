import type { RegraParametros } from '../../tipos';

const base = { versao: '2026.2', ano: 2025, intervaloMeses: null, proximaAcao: '' };

/** Espelho da semente `supabase/seed.sql` (bloco Fase 2, programa pressao). Manter igual. */
export function regrasPressaoTeste(): RegraParametros[] {
  return [
    { ...base, id: 'r-implausivel', ano: 2023, fonte: 'Medidas 2023 P4 §3', condicao: { camada: 'implausivel', pad_max: 140, pad_min: 40, pas_min: 70, pas_max: 250, pp_min: 20, pp_max: 100 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Confira os valores digitados.' },
    { ...base, id: 'r-ref', fonte: 'DBHA 2025 Q3.4', condicao: { camada: 'referencia_domiciliar', pas: 130, pad: 80 }, classificacao: 'normal', nivelAlerta: 'verde', mensagemPaciente: 'Em casa, as diretrizes usam 130/80 como referência para a MRPA.' },
    { ...base, id: 'r-convite', fonte: 'C-010', condicao: { camada: 'convite_mrpa', minimo_medidas: 3, janela_dias: 7, repetir_dias: 30, pas: 130, pad: 80 }, classificacao: 'controle', nivelAlerta: 'verde', mensagemPaciente: 'Quer iniciar uma MRPA?' },
    { ...base, id: 'r-alto', fonte: 'DBHA 2025 11.1', condicao: { camada: 'muito_elevado', pas: 180, pad: 110 }, classificacao: 'investigacao', nivelAlerta: 'laranja', mensagemPaciente: 'Descanse 5 minutos e meça de novo.' },
    { ...base, id: 'r-alto-sint', fonte: 'DBHA 2025 11', condicao: { camada: 'muito_elevado_sintoma', pas: 180, pad: 110, sintomas: ['dor_toracica', 'dispneia_importante', 'deficit_neurologico', 'alteracao_visual', 'confusao', 'sincope'] }, classificacao: 'especializado', nivelAlerta: 'vermelho', mensagemPaciente: 'Procure um serviço de emergência agora.' },
    { ...base, id: 'r-mrpa-acima', fonte: 'DBHA 2025 Q3.4', condicao: { camada: 'mrpa_acima', pas: 130, pad: 80 }, classificacao: 'controle', nivelAlerta: 'amarelo', mensagemPaciente: 'Suas medidas recentes estão acima do esperado.' },
    { ...base, id: 'r-validade', ano: 2023, fonte: 'Medidas 2023 P4 §5', condicao: { camada: 'validade', minimos: { '4': 14, '5': 15, '6': 18 }, medidas_por_periodo: 3, intervalo_min: 1, dias_min: 4, dias_max: 6, dias_padrao: 6 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Não atingiu o mínimo para interpretação.' },
  ];
}
