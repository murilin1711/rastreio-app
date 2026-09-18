import type { SintomaPA } from '@core/regras/cardio/tipos';

/**
 * Textos do Minha Pressão. Fonte: Diretrizes de Medidas da PA 2023, Quadro 19 (instruções ao paciente),
 * em linguagem do §25. Revisão clínica: docs/nero/revisao/ (Fase 2a).
 */
export const preparoMedida = [
  'Fique em um lugar tranquilo e confortável.',
  'Não fume, não tome café e não faça exercício nos 30 minutos antes.',
  'Sente-se e relaxe por 3 a 5 minutos, com a bexiga vazia.',
  'Costas apoiadas, pernas descruzadas, pés no chão.',
  'Braço apoiado na mesa, na altura do coração, sem roupa apertando.',
  'Não converse durante a medida.',
  'Use sempre o mesmo braço.',
];

export const entendaReferencia =
  'Uma medida isolada não confirma nem afasta hipertensão. Em casa, as diretrizes usam 130/80 como referência para a MRPA, um protocolo de vários dias. Se suas medidas ficarem acima disso com frequência, o caminho é confirmar com uma MRPA e conversar com seu médico.';

export const SINTOMAS_PA: { valor: SintomaPA; rotulo: string }[] = [
  { valor: 'dor_toracica', rotulo: 'Dor ou aperto no peito' },
  { valor: 'dispneia_importante', rotulo: 'Falta de ar importante' },
  { valor: 'deficit_neurologico', rotulo: 'Fraqueza ou formigamento de um lado do corpo, dificuldade para falar' },
  { valor: 'alteracao_visual', rotulo: 'Alteração importante da visão' },
  { valor: 'confusao', rotulo: 'Confusão mental' },
  { valor: 'sincope', rotulo: 'Desmaio' },
];

export const ROTULO_MOTIVO_EXCLUSAO: Record<import('@core/regras/cardio/tipos').MotivoExclusao, string> = {
  pad_maior_140: 'diastólica acima de 140',
  pad_menor_40: 'diastólica abaixo de 40',
  pas_menor_70: 'sistólica abaixo de 70',
  pas_maior_250: 'sistólica acima de 250',
  pas_menor_pad: 'sistólica menor que a diastólica',
  pp_menor_20: 'diferença entre sistólica e diastólica menor que 20',
  pp_maior_100: 'diferença entre sistólica e diastólica maior que 100',
};
