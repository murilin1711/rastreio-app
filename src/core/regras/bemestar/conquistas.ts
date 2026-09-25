/**
 * Conquistas pontuais de comportamento (D-016, parte B): "primeiras vezes" dentro de
 * Saúde & Bem-estar e do cadastro. Nada aqui depende de resultado clínico — o app não
 * comemora exame, pendência de rastreamento nem classificação de pressão.
 */
export type ChaveConquista = 'perfil_completo' | 'primeira_atividade' | 'primeira_noite_sono' | 'primeiro_checkin';

/** Contadores que decidem cada conquista. Vêm de contagens no banco, não da lista dos últimos 30 dias. */
export interface EstadoConquistas {
  /** Cadastro obrigatório da entrada no app (`perfil_inicial_completo`). Todo usuário tem: sozinho não é conquista. */
  cadastroInicial: boolean;
  /** Medicações informadas ou marcadas como "não uso". */
  medicacoesResolvidas: boolean;
  /** Antecedentes familiares informados ou marcados como "não tenho". */
  antecedentesResolvidos: boolean;
  totalAtividades: number;
  totalSono: number;
  totalCheckins: number;
}

/** Catálogo, na ordem em que as conquistas são mostradas quando saem várias juntas. */
const CATALOGO: { chave: ChaveConquista; alcancada: (e: EstadoConquistas) => boolean }[] = [
  { chave: 'perfil_completo', alcancada: (e) => e.cadastroInicial && e.medicacoesResolvidas && e.antecedentesResolvidos },
  { chave: 'primeira_atividade', alcancada: (e) => e.totalAtividades >= 1 },
  { chave: 'primeira_noite_sono', alcancada: (e) => e.totalSono >= 1 },
  { chave: 'primeiro_checkin', alcancada: (e) => e.totalCheckins >= 1 },
];

export const CHAVES_CONQUISTA: ChaveConquista[] = CATALOGO.map((c) => c.chave);

/** As de Saúde & Bem-estar. "Perfil completo" sai onde o perfil é completado (Minha Saúde e Home), não aqui. */
export const CONQUISTAS_BEM_ESTAR: ChaveConquista[] = ['primeira_atividade', 'primeira_noite_sono', 'primeiro_checkin'];
export const CONQUISTA_PERFIL: ChaveConquista[] = ['perfil_completo'];

/** As conquistas alcançadas que ainda não estão em `jaObtidas`. */
export function conquistasNovas(estado: EstadoConquistas, jaObtidas: string[]): ChaveConquista[] {
  return CATALOGO.filter((c) => c.alcancada(estado) && !jaObtidas.includes(c.chave)).map((c) => c.chave);
}
