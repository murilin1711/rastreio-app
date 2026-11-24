import type { ItemAnotar } from '@modules/anotar/itensAnotar';

/**
 * Ações do topo do Início (spec de navegação §6.3, D-065): o que a pessoa mais faz, em até cinco
 * botões grandes — quatro numa grade 2×2 e um largo embaixo. A glicemia só entra no lugar dos exames
 * quando o perfil confirma diabetes; sem resposta, fica "Meus exames".
 */
export function acoesInicio(temDiabetes: boolean | null | undefined): { grade: ItemAnotar[]; largo: ItemAnotar } {
  const terceira: ItemAnotar = temDiabetes === true
    ? { chave: 'glicemia', icone: 'eyedrop-outline', rotulo: 'Anotar minha glicemia', rota: '/(app)/coracao/glicemia/registrar' }
    : { chave: 'exames', icone: 'flask-outline', rotulo: 'Meus exames', rota: '/(app)/(tabs)/minha-saude/exames' };
  return {
    grade: [
      { chave: 'pressao', icone: 'pulse-outline', rotulo: 'Anotar minha pressão', rota: '/(app)/coracao/pressao/registrar' },
      { chave: 'remedios', icone: 'medkit-outline', rotulo: 'Meus remédios', rota: '/(app)/(tabs)/minha-saude/medicamentos' },
      terceira,
      { chave: 'medico', icone: 'document-text-outline', rotulo: 'Levar ao médico', rota: '/(app)/(tabs)/minha-saude/relatorios' },
    ],
    largo: { chave: 'consultas', icone: 'calendar-outline', rotulo: 'Minhas consultas', rota: '/(app)/(tabs)/agenda/consultas' },
  };
}
