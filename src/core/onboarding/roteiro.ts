import type { NeroClipe } from '@ui/components/NeroAnimado';

export type PassoOnboarding = 'oi' | 'nome' | 'prazer' | 'pressao' | 'relatorio' | 'lembrete' | 'final';

/** Palavra da fala que faz um cartão aparecer na demonstração (tela 5 e 6). */
export interface Marco { palavra: string; cartao: string }

export interface Fala {
  texto: string;
  /** Ao terminar, encolhe e fica cinza, e a próxima fala entra embaixo (telas 1 e 5). */
  encolher?: boolean;
  /** Entra no lugar da fala anterior, em vez de embaixo dela. */
  substituir?: boolean;
  marcos?: Marco[];
}

export interface Passo {
  id: PassoOnboarding;
  clipe: NeroClipe;
  /** Clipe tocado uma vez ao entrar, antes de `clipe` (final: comemora e volta ao repouso, de olhos abertos). */
  entrada?: NeroClipe;
  /** 1: conversa, Nero grande no meio. 2: demonstração, Nero médio embaixo do conteúdo. */
  padrao: 1 | 2;
  /** Só o Nero na tela antes da primeira fala (tela 1). */
  atrasoInicialMs?: number;
  /** Pausa do clipe entre um ciclo e outro (tela 2: pensando, para, pensa de novo). */
  pausaClipeMs?: number;
  falas: Fala[];
  botao: string;
}

/**
 * Onboarding em que o Nero fala (D-063). Roteiro do Murilo, ajustado em 26/09 depois de ver no simulador.
 * Mudar uma fala é mudar esta lista. `{, nome}` vira ", Maria" ou some (`falaComNome`).
 */
export const ROTEIRO: Passo[] = [
  {
    id: 'oi', clipe: 'acenar', padrao: 1, atrasoInicialMs: 1000, botao: 'Oi, Nero!',
    falas: [{ texto: 'Oi, eu sou o Nero!', encolher: true }, { texto: 'Vou te ajudar a organizar a sua saúde.' }],
  },
  { id: 'nome', clipe: 'pensando', padrao: 1, pausaClipeMs: 3000, botao: 'Continuar', falas: [{ texto: 'E você, como se chama?' }] },
  { id: 'prazer', clipe: 'acenar', padrao: 1, botao: 'Vamos lá', falas: [{ texto: 'Prazer{, nome}! Vou te mostrar o que eu faço por você.' }] },
  { id: 'pressao', clipe: 'repouso', padrao: 2, botao: 'Próximo', falas: [{ texto: 'Anote sua pressão e sua glicemia. Eu organizo tudo pra você.' }] },
  {
    id: 'relatorio', clipe: 'repouso', padrao: 2, botao: 'Próximo',
    falas: [
      { texto: 'Eu junto todas as suas informações num relatório.', encolher: true },
      { texto: 'Seu histórico, seus exames e suas medicações.', marcos: [{ palavra: 'histórico', cartao: 'historico' }, { palavra: 'exames', cartao: 'exames' }, { palavra: 'medicações', cartao: 'medicacoes' }] },
      { texto: 'Na consulta, é só mostrar pro seu médico.', substituir: true },
    ],
  },
  {
    id: 'lembrete', clipe: 'repouso', padrao: 2, botao: 'Próximo',
    falas: [
      { texto: 'Eu te lembro do remédio na hora certa.', marcos: [{ palavra: 'certa', cartao: 'remedio' }] },
      { texto: 'Eu lembro da sua consulta.', substituir: true, marcos: [{ palavra: 'consulta', cartao: 'consulta' }] },
      { texto: 'Eu lembro de marcar seu exame e de tomar água.', substituir: true, marcos: [{ palavra: 'exame', cartao: 'exame' }, { palavra: 'água', cartao: 'agua' }] },
    ],
  },
  { id: 'final', clipe: 'repouso', entrada: 'comemorar', padrao: 1, botao: 'Criar minha conta', falas: [{ texto: 'Pronto{, nome}! Agora é só criar sua conta.' }] },
];

/** Tela 6, depois das notificações: o Nero pergunta antes do aviso do sistema. */
export const PERGUNTA_AVISOS = 'Posso te avisar?';

export function falaComNome(texto: string, nome: string | null): string {
  const n = nome?.trim();
  return texto.replace('{, nome}', n ? `, ${n}` : '');
}

const normalizar = (p: string) => p.toLocaleLowerCase('pt-BR').replace(/[.,!?;:]/g, '');

/** Posição da palavra do marco na fala (a fala é dividida por espaços, como na animação). */
export function indiceDoMarco(texto: string, palavra: string): number {
  return texto.split(' ').findIndex((p) => normalizar(p) === normalizar(palavra));
}
