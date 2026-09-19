import type { ChaveConquista } from '@core/regras/bemestar/conquistas';

/**
 * Textos das conquistas (D-016, parte B). Cada uma tem o que aconteceu e um incentivo para continuar.
 * Tom calmo do §66: o incentivo explica por que vale a pena seguir registrando, sem prometer
 * resultado de saúde nem dar ordem. A frase da atividade usa a formulação da OMS já adotada em C-017.
 */
export const TEXTO_CONQUISTA: Record<ChaveConquista, { titulo: string; incentivo: string }> = {
  perfil_completo: {
    titulo: 'Seu perfil de saúde está completo.',
    incentivo: 'Você informou seus dados, suas medicações e seus antecedentes familiares. Continue mantendo tudo em dia: é a partir daí que o NERO monta seus rastreamentos e que seu médico consegue avaliar melhor o seu caso.',
  },
  primeira_atividade: {
    titulo: 'Seu primeiro registro de atividade física está guardado.',
    incentivo: 'Continue registrando: qualquer atividade é melhor do que nenhuma, e com alguns registros o resumo da semana começa a mostrar a sua constância.',
  },
  primeira_noite_sono: {
    titulo: 'Sua primeira noite de sono está registrada.',
    incentivo: 'Continue registrando: o sono só faz sentido em conjunto — é a média de sete dias que mostra como você tem dormido.',
  },
  primeiro_checkin: {
    titulo: 'Seu primeiro check-in está guardado.',
    incentivo: 'O check-in se repete uma vez por mês. Respondendo sempre, você passa a ver como sua energia, seu estresse e seu bem-estar mudam ao longo do tempo.',
  },
};
