/** Textos fixos do check-in semanal (§86–§87). Não é instrumento diagnóstico. */
export const TEXTO_CHECKIN = {
  titulo: 'Como foi sua semana?',
  subtitulo: 'Sete perguntas rápidas, de 0 a 10. Isso cria um histórico do que você sentiu ao lado dos números. O NERO não faz diagnóstico com essas respostas.',
  observacao: 'Existe algo que gostaria de registrar sobre esta semana?',
  salvo: 'Check-in da semana salvo. Você pode ajustar as respostas até a próxima semana.',
  pendenteHome: 'Fazer o check-in da semana',
  pendenteCard: 'Como foi sua semana? Responder leva 1 minuto.',
} as const;

export const PERGUNTAS_CHECKIN = [
  { chave: 'disposicao', pergunta: 'Como esteve sua disposição?' },
  { chave: 'alimentacao', pergunta: 'Como você avalia sua alimentação?' },
  { chave: 'atividade', pergunta: 'Como esteve sua atividade física?' },
  { chave: 'sono', pergunta: 'Como foi seu sono?' },
  { chave: 'estresse', pergunta: 'Como você avalia seu nível de estresse?' },
  { chave: 'energia', pergunta: 'Nível de energia' },
  { chave: 'bemEstar', pergunta: 'Bem-estar geral' },
] as const;
