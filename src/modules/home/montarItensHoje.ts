import type { PerfilSaude } from '@core/perfil/tipos';
import type { NivelAlertaUI } from '@ui/theme';

export interface ItemHoje {
  id: string;
  nivel: NivelAlertaUI;
  titulo: string;
  descricao: string;
  rota: string;
  /** Declaração negativa que resolve a pendência sem cadastrar nada (grava no perfil). */
  acaoSecundaria?: { rotulo: string; campo: 'semMedicacoes' | 'semAntecedentesFamiliares' };
}

const PESO: Record<NivelAlertaUI, number> = { vermelho: 0, laranja: 1, amarelo: 2, cinza: 3, verde: 4 };

const ESSENCIAIS: (keyof PerfilSaude)[] = ['dataNascimento', 'sexoNascimento', 'alturaCm', 'tabagismoStatus', 'temDiabetes', 'temHipertensao'];

export interface RastreandoResumo {
  pendencias: { programa: string; descricao: string; nivelAlerta: string }[];
  sintomas: { programa: string }[];
  avaliacoes: Partial<Record<string, { status: string; proximaData: string | null }>>;
}

interface Entrada {
  perfil: PerfilSaude | null;
  antecedentesQtd: number;
  medicacoesAtivasQtd: number;
  rastreando?: RastreandoResumo;
}

const NOME_PROGRAMA: Record<string, string> = { mama: 'mama', colo_utero: 'colo do útero', colorretal: 'intestino', pulmao: 'pulmão', prostata: 'próstata' };
const NIVEL: Record<string, NivelAlertaUI> = { verde: 'verde', amarelo: 'amarelo', laranja: 'laranja', vermelho: 'vermelho', cinza: 'cinza' };

/**
 * Bloco "Hoje" da Home (§56): o que precisa de atenção, do mais grave ao mais leve.
 * Fase 0: só completude do perfil. A Fase 1 acrescenta pendências e exames do Rastreando.
 */
export function montarItensHoje({ perfil, antecedentesQtd, medicacoesAtivasQtd, rastreando }: Entrada): ItemHoje[] {
  if (!perfil) return [];
  const itens: ItemHoje[] = [];

  // Rastreando (§56): hierarquia de segurança na ordem — sintoma > pendência > atrasado > próximo.
  if (rastreando) {
    for (const programa of [...new Set(rastreando.sintomas.map((s) => s.programa))]) {
      itens.push({ id: `sintoma_${programa}`, nivel: 'vermelho', titulo: `Procurar avaliação: sinal de alerta (${NOME_PROGRAMA[programa] ?? programa})`, descricao: 'Não espere pela data do rastreamento.', rota: `/(app)/rastreando/${programa}/sinais` });
    }
    for (const p of rastreando.pendencias) {
      itens.push({ id: `pendencia_${p.programa}`, nivel: NIVEL[p.nivelAlerta] ?? 'laranja', titulo: `Concluir pendência: ${p.descricao.toLowerCase()}`, descricao: `Rastreamento de ${NOME_PROGRAMA[p.programa] ?? p.programa}.`, rota: '/(app)/rastreando/pendencias' });
    }
    for (const [programa, av] of Object.entries(rastreando.avaliacoes)) {
      if (!av) continue;
      if (av.status === 'exame_atrasado') itens.push({ id: `atrasado_${programa}`, nivel: 'laranja', titulo: `Agendar exame atrasado (${NOME_PROGRAMA[programa] ?? programa})`, descricao: 'A data prevista já passou.', rota: `/(app)/rastreando/${programa}` });
      else if (av.status === 'exame_proximo') itens.push({ id: `proximo_${programa}`, nivel: 'amarelo', titulo: `Agendar exame de ${NOME_PROGRAMA[programa] ?? programa}`, descricao: `Previsto para ${av.proximaData ? `${av.proximaData.slice(8, 10)}/${av.proximaData.slice(5, 7)}/${av.proximaData.slice(0, 4)}` : 'breve'}.`, rota: `/(app)/rastreando/${programa}` });
    }
  }

  const faltando = ESSENCIAIS.filter((k) => perfil[k] == null);
  if (faltando.length) {
    itens.push({
      id: 'perfil_incompleto',
      nivel: 'amarelo',
      titulo: 'Completar meu perfil de saúde',
      descricao: faltando.length === 1 ? 'Falta 1 informação essencial.' : `Faltam ${faltando.length} informações essenciais.`,
      rota: '/(app)/minha-saude/perfil',
    });
  }
  if (antecedentesQtd === 0 && !perfil.semAntecedentesFamiliares) {
    itens.push({
      id: 'antecedentes',
      nivel: 'cinza',
      titulo: 'Registrar antecedentes familiares',
      descricao: 'Casos de câncer ou infarto precoce na família ajudam a definir seus rastreamentos.',
      rota: '/(app)/minha-saude/antecedentes',
      acaoSecundaria: { rotulo: 'Não há casos na família', campo: 'semAntecedentesFamiliares' },
    });
  }
  if (medicacoesAtivasQtd === 0 && !perfil.semMedicacoes) {
    itens.push({
      id: 'medicacoes',
      nivel: 'cinza',
      titulo: 'Cadastrar meus medicamentos',
      descricao: 'Entram nos relatórios para o seu médico.',
      rota: '/(app)/minha-saude/medicamentos',
      acaoSecundaria: { rotulo: 'Não uso medicamentos', campo: 'semMedicacoes' },
    });
  }
  if (!itens.length) {
    itens.push({
      id: 'tudo_em_dia',
      nivel: 'verde',
      titulo: 'Nada pendente',
      descricao: rastreando ? 'Perfil completo e rastreamentos em ordem.' : 'Seu perfil está completo.',
      rota: '/(app)/minha-saude',
    });
  }
  return itens.sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
}
