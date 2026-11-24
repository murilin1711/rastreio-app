import type { AcaoModulo } from '@ui/index';

/**
 * Ações do módulo "Hábitos e bem-estar" no molde único (spec de navegação §6.5, D-065).
 * O "Relatório de Saúde & Hábitos" saiu daqui: vive em "Levar ao médico".
 */
export const ACOES_BEM_ESTAR: AcaoModulo[] = [
  { chave: 'corpo', icone: 'body-outline', titulo: 'Meu peso e medidas', subtitulo: 'anotar, composição corporal e "Entenda"', rota: '/(app)/bem-estar/corpo' },
  { chave: 'sono', icone: 'moon-outline', titulo: 'Meu sono', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/sono' },
  { chave: 'atividade', icone: 'walk-outline', titulo: 'Minhas atividades', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/atividade' },
  { chave: 'agua', icone: 'water-outline', titulo: 'Minha água', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/agua' },
  { chave: 'alimentacao', icone: 'restaurant-outline', titulo: 'Minha alimentação', subtitulo: 'anotar e ver como está', rota: '/(app)/bem-estar/alimentacao' },
  { chave: 'metas', icone: 'flag-outline', titulo: 'Minhas metas', rota: '/(app)/bem-estar/metas' },
  { chave: 'checkin', icone: 'chatbubble-ellipses-outline', titulo: 'Check-in da semana', rota: '/(app)/bem-estar/checkin' },
];
