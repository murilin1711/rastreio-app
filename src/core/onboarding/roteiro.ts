import type { NeroClipe } from '@ui/components/NeroAnimado';

export type PassoOnboarding = 'oi' | 'nome' | 'prazer' | 'pressao' | 'relatorio' | 'lembrete' | 'final';

export interface Passo {
  id: PassoOnboarding;
  clipe: NeroClipe;
  /** Grande nas telas de conversa; pequeno no canto nas de demonstração. */
  nero: 'grande' | 'pequeno';
  linhaPequena?: string;
  fala: string;
  botao: string;
}

/**
 * Onboarding em que o Nero fala (D-063). Roteiro aprovado pelo Murilo em 26/09/2026, tela por tela;
 * mudar uma fala é mudar esta lista. `{, nome}` vira ", Maria" ou some (`falaComNome`).
 */
export const ROTEIRO: Passo[] = [
  { id: 'oi', clipe: 'acenar', nero: 'grande', linhaPequena: 'Oi, eu sou o Nero!', fala: 'Vou te ajudar a organizar a sua saúde.', botao: 'Oi, Nero!' },
  { id: 'nome', clipe: 'pensando', nero: 'grande', fala: 'E você, como se chama?', botao: 'Continuar' },
  { id: 'prazer', clipe: 'acenar', nero: 'grande', fala: 'Prazer{, nome}! Vou te mostrar o que eu faço por você.', botao: 'Vamos lá' },
  { id: 'pressao', clipe: 'repouso', nero: 'pequeno', fala: 'Anote sua pressão e sua glicemia. Eu organizo tudo pra você.', botao: 'Próximo' },
  { id: 'relatorio', clipe: 'repouso', nero: 'pequeno', fala: 'Eu junto todas as suas informações num relatório. Na consulta, é só mostrar pro seu médico.', botao: 'Próximo' },
  { id: 'lembrete', clipe: 'repouso', nero: 'pequeno', fala: 'Eu te lembro do remédio na hora certa.', botao: 'Próximo' },
  { id: 'final', clipe: 'comemorar', nero: 'grande', fala: 'Pronto{, nome}! Agora é só criar sua conta.', botao: 'Criar minha conta' },
];

/** Tela 6, depois da demonstração do lembrete: o Nero pergunta antes do aviso do sistema. */
export const PERGUNTA_AVISOS = 'Posso te avisar?';

export function falaComNome(texto: string, nome: string | null): string {
  const n = nome?.trim();
  return texto.replace('{, nome}', n ? `, ${n}` : '');
}
