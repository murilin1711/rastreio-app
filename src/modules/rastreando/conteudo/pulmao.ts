import type { ConteudoPrograma } from './tipos';

export const pulmao: ConteudoPrograma = {
  titulo: 'Câncer de pulmão',
  subtitulo: 'Rastreamento com tomografia de baixa dose',
  icone: 'cloud-outline',
  capa: ['#0F766E', '#2DD4BF'],
  entenda: [
    'O câncer de pulmão é o que mais mata no mundo, e o tabagismo é responsável pela grande maioria dos casos. Descoberto em fase inicial, o tratamento tem muito mais chance de cura.',
    'A tomografia de baixa dose consegue ver nódulos pequenos que o raio-X não mostra. Ela é indicada apenas para quem tem alto risco pela carga de tabagismo. Para os demais, os riscos superam os benefícios.',
    'Os critérios adotados: 50 a 80 anos, ter fumado pelo menos 20 maços-ano (por exemplo, 1 maço por dia durante 20 anos) e ainda fumar ou ter parado há até 15 anos. O exame é anual.',
    'Parar de fumar continua sendo a medida mais eficaz, em qualquer idade.',
  ],
  fatoresEducativos: [
    'Exposição à fumaça de outras pessoas (fumo passivo)',
    'Exposição ocupacional a amianto, sílica, arsênio ou radônio',
    'Doença pulmonar obstrutiva crônica (DPOC)',
    'História familiar de câncer de pulmão',
  ],
  fatoresModificadores: [
    'Carga tabágica de 20 maços-ano ou mais',
    'Fumar atualmente ou ter parado há até 15 anos',
  ],
  sinaisAlerta: [
    { id: 'tosse_persistente', texto: 'Tosse persistente por mais de 3 semanas ou mudança no padrão de uma tosse antiga' },
    { id: 'escarro_sangue', texto: 'Escarro com sangue' },
    { id: 'falta_ar', texto: 'Falta de ar nova ou que piora' },
    { id: 'dor_toracica', texto: 'Dor no peito persistente' },
    { id: 'rouquidao', texto: 'Rouquidão por mais de 3 semanas' },
    { id: 'emagrecimento_pulmao', texto: 'Emagrecimento sem causa aparente' },
  ],
  fonteResumo: 'USPSTF 2021 (SBPT) · ACR Lung-RADS v2022',
};
