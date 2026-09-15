import type { PerfilRegras, ProgramaHandler } from '../tipos';
import { casaCondicao, temHistoricoPessoal } from './util';

const FONTE = 'INCA 2025 — Diretrizes Brasileiras para o Rastreamento do Câncer do Colo do Útero, 3. ed. (Portaria SAES/SECTICS 13/2025)';

export function imunossuprimida(p: PerfilRegras): boolean {
  return p.condicoes.hiv === true || p.condicoes.imunossupressao === true;
}

/** Rastreamento do câncer do colo do útero — decisões C-002 e C-003. */
export const colo: ProgramaHandler = {
  // Rec. 34/36: sem colo do útero ou sem história de atividade sexual → fora do rastreamento.
  // A exceção (histerectomia por lesão/câncer, Rec. 35) é tratada em fatoresModificadores.
  aplicavel: (p) => p.possuiColoUtero === true && p.jaTeveAtividadeSexual !== false,

  // Rec. 1: início aos 25. Rec. 12/13: encerra quando o último teste após os 60 for negativo; o limite de 64
  // é o do programa histórico. Rec. 37/38: HIV/imunossupressão inicia com a atividade sexual e não encerra.
  faixaEtaria: (p) => (imunossuprimida(p) ? { min: 0, max: null } : { min: 25, max: 64 }),

  mensagemNaoElegivel: () =>
    'O rastreamento do colo do útero começa aos 25 anos para quem já teve atividade sexual. Mantenha seu perfil atualizado para o NERO avisar quando chegar o momento.',

  fatoresModificadores(p) {
    if (temHistoricoPessoal(p, 'NIC 2', 'NIC2', 'NIC 3', 'NIC3', 'NIC II', 'NIC III', 'AIS', 'adenocarcinoma in situ')) {
      return `Você já tratou uma lesão de alto grau do colo do útero (NIC 2, NIC 3 ou AIS). A diretriz recomenda manter o rastreamento por até 25 anos após o tratamento, mesmo depois dos 60 anos. Converse com seu ginecologista. (${FONTE}, Rec. 14)`;
    }
    if (p.histerectomia && temHistoricoPessoal(p, 'colo', 'cervical', 'NIC')) {
      return `Histerectomia por lesão precursora ou câncer do colo do útero: a diretriz recomenda coleta vaginal por pelo menos 25 anos ou indefinidamente. Converse com seu ginecologista. (${FONTE}, Rec. 35)`;
    }
    return null;
  },

  selecionarRegra(exame, regras, perfil) {
    const extras = { imunossuprimida: imunossuprimida(perfil) };
    if (exame.tipo === 'dna_hpv' && exame.resultado.hpv === 'outros_oncogenicos') {
      // Rec. 40: em imunossupressão, qualquer HPV positivo vai à colposcopia, independentemente da citologia.
      if (extras.imunossuprimida) {
        return regras.find((r) => casaCondicao(r, { ...exame, resultado: { hpv: 'outros_oncogenicos' } }, extras)) ?? null;
      }
      // §45.3: sem citologia reflexa não há conduta → null (classificarExame devolve "pendente").
      if (exame.resultado.citologia_reflexa == null) return null;
    }
    return regras.find((r) => casaCondicao(r, exame, extras)) ?? null;
  },
};
