/** Textos fixos de Meu Corpo (§70–§73, §82–§84). Mensagens com parâmetro clínico vêm de regras_clinicas. */
export const TEXTO_CORPO = {
  subtitulo: 'Peso, medidas e composição corporal ao longo do tempo. O NERO mostra a evolução; a interpretação é sua e do seu médico.',
  composicaoAviso: 'Resultados de composição corporal podem variar de acordo com equipamento, hidratação e método utilizado. Comparações são mais úteis quando realizadas utilizando o mesmo método.',
  tendenciaSemDados: 'Registre pelo menos 3 medidas de peso ao longo de 2 semanas para o NERO calcular a tendência.',
  evolucaoIntro: 'A evolução compara o peso atual com a primeira medida do período escolhido.',
  objetivoIntro: 'O NERO não define meta de peso por você. Escolha como quer acompanhar:',
  pmavIntro: 'Opcional: o maior peso que você já teve na vida. A ABESO usa esse número para acompanhar a resposta ao tratamento da obesidade.',
  compararIntro: 'A ideia não é dizer se a mudança é boa ou ruim; é mostrar a evolução dos dados registrados.',
} as const;

export const ROTULO_OBJETIVO = { reducao: 'Redução de peso', manutencao: 'Manutenção', aumento: 'Aumento de peso', sem_meta: 'Sem meta de peso' } as const;
export const ROTULO_METODO = { balanca: 'Balança convencional', bioimpedancia: 'Bioimpedância', dexa: 'DEXA', profissional: 'Avaliação profissional', outro: 'Outro' } as const;
export const ROTULO_FAIXA_CINTURA = { referencia: 'Dentro da referência', aumentado: 'Aumentada', muito_aumentado: 'Muito aumentada' } as const;
export const ROTULO_TENDENCIA = { estavel: 'Estável', aumento: 'Tendência de aumento', reducao: 'Tendência de redução' } as const;
export const ROTULO_PMAV = { nenhuma: 'Abaixo dos marcos da diretriz', reduzida: 'Faixa de obesidade reduzida', controlada: 'Faixa de obesidade controlada' } as const;

/**
 * Frases dos marcos de meta (D-016). Tom calmo do §66: reconhecem o esforço da pessoa,
 * sem prometer resultado clínico nem sugerir que ela deva continuar reduzindo (§82).
 */
export const TEXTO_MARCO = {
  peso: {
    50: { titulo: 'Você percorreu metade do caminho até a meta de peso que definiu.', incentivo: 'Continue registrando seu peso: é o acompanhamento ao longo do tempo que mostra o caminho, não uma medida isolada.' },
    100: { titulo: 'Você chegou à meta de peso que definiu.', incentivo: 'Manter é tão importante quanto chegar. Continue acompanhando e converse com seu médico sobre qual é o próximo passo para você.' },
  },
  cintura: {
    50: { titulo: 'Você percorreu metade do caminho até a meta de circunferência que definiu.', incentivo: 'Continue medindo sempre do mesmo jeito: a comparação só vale quando a técnica é a mesma.' },
    100: { titulo: 'Você chegou à meta de circunferência que definiu.', incentivo: 'Manter é tão importante quanto chegar. Continue acompanhando e leve esse resultado para a sua próxima consulta.' },
  },
} as const;
