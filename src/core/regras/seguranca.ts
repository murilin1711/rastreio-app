import type { BloqueioSeguranca, ContextoAvaliacao, Programa } from './tipos';

export const MENSAGENS_SEGURANCA = {
  sintoma_alarme:
    'Não espere pela data do seu próximo rastreamento. O rastreamento é destinado principalmente a pessoas sem sintomas. Como você informou um sinal de alerta, procure avaliação médica.',
  pendencia_aberta:
    'Existe um resultado anterior que ainda precisa de avaliação. Um novo exame de rotina só será programado depois que essa etapa for concluída.',
  acompanhamento_especializado:
    'Você está em acompanhamento especializado. As datas de seguimento são definidas pelo profissional responsável, não pelo calendário automático.',
} as const;

/**
 * Hierarquia de segurança (§66), nesta ordem obrigatória:
 * 1. sintoma de alarme → 2. pendência aberta → 3. acompanhamento especializado.
 * Só quando nenhuma condição está presente o rastreamento habitual é calculado.
 */
export function aplicarHierarquiaSeguranca(programa: Programa, contexto: ContextoAvaliacao): BloqueioSeguranca | null {
  if (contexto.sintomasAlarme.length > 0) {
    return { motivo: 'sintoma_alarme', nivelAlerta: 'vermelho', mensagemPaciente: MENSAGENS_SEGURANCA.sintoma_alarme };
  }
  if (contexto.pendenciasAbertas.some((p) => p.programa === programa)) {
    return { motivo: 'pendencia_aberta', nivelAlerta: 'laranja', mensagemPaciente: MENSAGENS_SEGURANCA.pendencia_aberta };
  }
  if (contexto.emAcompanhamentoEspecializado.includes(programa)) {
    return { motivo: 'acompanhamento_especializado', nivelAlerta: 'cinza', mensagemPaciente: MENSAGENS_SEGURANCA.acompanhamento_especializado };
  }
  return null;
}
