import type { AcaoModulo } from '@ui/index';

/**
 * Ações do módulo "Exames de prevenção" no molde único (spec de navegação §6.5, D-065).
 * O relatório abre a prévia em Minha Saúde; `useAbrir` leva `voltarPara` e os parâmetros da query.
 */
export const ACOES_PREVENCAO: AcaoModulo[] = [
  { chave: 'lembretes', icone: 'notifications-outline', titulo: 'Ver meus lembretes', rota: '/(app)/rastreando/lembretes' },
  { chave: 'relatorio', icone: 'document-text-outline', titulo: 'Levar ao médico (relatório de prevenção)', rota: '/(app)/(tabs)/minha-saude/relatorios/previa?tipo=oncologico&dias=180' },
];
