/** Textos fixos de Meu Sono (§80). A referência de duração vem de regras_clinicas (C-018). */
export const TEXTO_SONO = {
  subtitulo: 'Anote a que horas dormiu e acordou. O NERO calcula o tempo de sono e a média dos últimos 7 dias, sem avaliar insônia ou apneia.',
  semRegistros: 'Nenhuma noite registrada ainda. Registre a de ontem para começar.',
  abaixo: 'Sua média dos últimos 7 dias ficou abaixo das 7 horas que a AASM recomenda para adultos. Se isso for frequente, vale conversar com seu médico.',
} as const;
export const ROTULO_QUALIDADE: Record<1 | 2 | 3 | 4 | 5, string> = { 1: 'Muito ruim', 2: 'Ruim', 3: 'Regular', 4: 'Bom', 5: 'Muito bom' };
export const ROTULO_CONTEXTO_SONO = { acordouNoite: 'Acordou durante a noite', cochilou: 'Cochilou durante o dia', dificuldadeAdormecer: 'Dificuldade para adormecer', acordouDescansado: 'Acordou descansado' } as const;
