import type { MarcoSequencia } from '@core/regras/bemestar/sequencia';

/**
 * Textos dos marcos de sequência (D-016, parte C). Falam de dias e de constância, nunca do que foi
 * registrado: dizer "você registrou seu exame" transformaria rastreamento em conquista. O incentivo
 * explica o que a constância traz, sem prometer resultado de saúde e sem cobrar o dia seguinte.
 */
export const TEXTO_SEQUENCIA: Record<MarcoSequencia, { titulo: string; incentivo: string }> = {
  3: {
    titulo: 'Três dias seguidos registrando.',
    incentivo: 'O começo é a parte mais difícil. Continue no seu ritmo: alguns dias já bastam para o NERO começar a mostrar padrões.',
  },
  7: {
    titulo: 'Uma semana inteira de registros.',
    incentivo: 'Sete dias é a janela que o app usa para resumir seu sono e sua atividade. A partir de agora esses números passam a significar alguma coisa.',
  },
  30: {
    titulo: 'Trinta dias seguidos.',
    incentivo: 'Um mês de registros é material de verdade para levar à consulta: dá para ver tendências, e não só medidas soltas.',
  },
  100: {
    titulo: 'Cem dias seguidos.',
    incentivo: 'Cem dias de acompanhamento contínuo. Se um dia a sequência parar, seus registros continuam todos aí — o que você construiu não se perde.',
  },
};
