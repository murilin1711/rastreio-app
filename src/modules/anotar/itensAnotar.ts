import type { Ionicons } from '@expo/vector-icons';

/**
 * Itens da folha "Anotar" (spec de navegação §6.2), na ordem em que aparecem.
 * "Tomei remédio" (plano do remédio) é o terceiro: abre a lista das doses de hoje.
 */
export interface ItemAnotar {
  chave: string;
  icone: keyof typeof Ionicons.glyphMap;
  rotulo: string;
  rota: string;
}

export const ITENS_ANOTAR: ItemAnotar[] = [
  { chave: 'pressao', icone: 'pulse-outline', rotulo: 'Pressão', rota: '/(app)/coracao/pressao/registrar' },
  { chave: 'glicemia', icone: 'eyedrop-outline', rotulo: 'Glicemia', rota: '/(app)/coracao/glicemia/registrar' },
  { chave: 'remedio', icone: 'medkit-outline', rotulo: 'Tomei remédio', rota: '/(app)/remedios/hoje' },
  { chave: 'peso', icone: 'body-outline', rotulo: 'Peso e medidas', rota: '/(app)/bem-estar/corpo/registrar' },
  { chave: 'sono', icone: 'moon-outline', rotulo: 'Sono', rota: '/(app)/bem-estar/sono/registrar' },
  { chave: 'atividade', icone: 'walk-outline', rotulo: 'Atividade', rota: '/(app)/bem-estar/atividade/registrar' },
  { chave: 'agua', icone: 'water-outline', rotulo: 'Água', rota: '/(app)/bem-estar/agua' },
  { chave: 'refeicao', icone: 'restaurant-outline', rotulo: 'Refeição', rota: '/(app)/bem-estar/alimentacao/registrar' },
  { chave: 'exame', icone: 'flask-outline', rotulo: 'Resultado de exame', rota: '/(app)/coracao/exames/registrar' },
  { chave: 'documento', icone: 'camera-outline', rotulo: 'Foto de documento', rota: '/(app)/(tabs)/minha-saude/documentos/novo' },
];
