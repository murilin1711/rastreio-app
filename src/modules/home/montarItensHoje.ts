import type { PerfilSaude } from '@core/perfil/tipos';
import type { NivelAlertaUI } from '@ui/theme';

export interface ItemHoje {
  id: string;
  nivel: NivelAlertaUI;
  titulo: string;
  descricao: string;
  rota: string;
}

const PESO: Record<NivelAlertaUI, number> = { vermelho: 0, laranja: 1, amarelo: 2, cinza: 3, verde: 4 };

const ESSENCIAIS: (keyof PerfilSaude)[] = ['dataNascimento', 'sexoNascimento', 'alturaCm', 'tabagismoStatus', 'temDiabetes', 'temHipertensao'];

interface Entrada {
  perfil: PerfilSaude | null;
  antecedentesQtd: number;
  medicacoesAtivasQtd: number;
}

/**
 * Bloco "Hoje" da Home (§56): o que precisa de atenção, do mais grave ao mais leve.
 * Fase 0: só completude do perfil. A Fase 1 acrescenta pendências e exames do Rastreando.
 */
export function montarItensHoje({ perfil, antecedentesQtd, medicacoesAtivasQtd }: Entrada): ItemHoje[] {
  if (!perfil) return [];
  const itens: ItemHoje[] = [];

  const faltando = ESSENCIAIS.filter((k) => perfil[k] == null);
  if (faltando.length) {
    itens.push({
      id: 'perfil_incompleto',
      nivel: 'amarelo',
      titulo: 'Complete seu perfil de saúde',
      descricao: faltando.length === 1 ? 'Falta 1 informação essencial.' : `Faltam ${faltando.length} informações essenciais.`,
      rota: '/(app)/minha-saude/perfil',
    });
  }
  if (antecedentesQtd === 0) {
    itens.push({
      id: 'antecedentes',
      nivel: 'cinza',
      titulo: 'Registre seus antecedentes familiares',
      descricao: 'Eles ajudam a definir quando começar cada rastreamento.',
      rota: '/(app)/minha-saude/antecedentes',
    });
  }
  if (medicacoesAtivasQtd === 0) {
    itens.push({
      id: 'medicacoes',
      nivel: 'cinza',
      titulo: 'Cadastre seus medicamentos',
      descricao: 'Se não usa nenhum, pode ignorar este item.',
      rota: '/(app)/minha-saude/medicamentos',
    });
  }
  if (!itens.length) {
    itens.push({
      id: 'tudo_em_dia',
      nivel: 'verde',
      titulo: 'Seu perfil está completo',
      descricao: 'Nada pendente por hoje.',
      rota: '/(app)/minha-saude',
    });
  }
  return itens.sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
}
