/**
 * Título e texto de cada notificação (D-044). Decididos um a um com o Murilo em 25/09/2026 — a
 * tabela está em `docs/nero/notificacoes.md`, e texto novo entra lá antes de entrar aqui.
 *
 * O padrão: o título diz o que fazer, no tom de conversa, e termina com um emoji do tipo; o texto
 * traz só o detalhe. Sem "NERO:" (o ícone já diz) e sem nome de módulo ("Coração & Metabolismo" não
 * diz à pessoa o que fazer).
 */
export interface TextoNotificacao {
  titulo: string;
  emoji: string;
  corpo: string;
}

/** O que vai no título da notificação: a frase e o emoji no fim. */
export const tituloCompleto = (t: TextoNotificacao) => `${t.titulo} ${t.emoji}`;

/** O que fica gravado em `lembretes.mensagem` para a lista dentro do app, que não usa emoji. */
export const mensagemDaLista = (t: TextoNotificacao) => `${t.titulo} · ${t.corpo}`;

const maiuscula = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/** 1800 → "1,8 L"; 2000 → "2 L". Uma casa, vírgula, sem ",0". */
export function litros(ml: number): string {
  const l = Math.round(ml / 100) / 10;
  return `${String(l).replace('.', ',')} L`;
}

export function textoRemedio(nome: string, dose: string | null): TextoNotificacao {
  const d = dose?.trim();
  return { titulo: 'Hora de tomar seu remédio', emoji: '💊', corpo: d ? `${nome} ${d}` : nome };
}

/** `metaMl` nulo: a pessoa não definiu meta e não há peso para sugerir uma. */
export function textoAgua(metaMl: number | null): TextoNotificacao {
  return { titulo: 'Hora de beber água', emoji: '💧', corpo: metaMl && metaMl > 0 ? `Sua meta de hoje: ${litros(metaMl)}.` : 'Um copo agora já ajuda.' };
}

/** `momento` é o rótulo do plano ("2 h após o almoço", "em jejum"). */
export function textoGlicemia(momento: string): TextoNotificacao {
  return { titulo: 'Hora de medir a glicemia', emoji: '🩸', corpo: maiuscula(momento) };
}

export function textoMrpa(dia: number, total: number, periodo: 'manha' | 'noite'): TextoNotificacao {
  return { titulo: 'Hora de medir a pressão', emoji: '🩺', corpo: `Dia ${dia} de ${total} · ${periodo === 'manha' ? 'manhã' : 'noite'}` };
}

/** O toque abre "Levar ao médico": a promessa do texto depende disso (`rotaDoLembrete`). */
export function textoConsultaVespera(especialidade: string, hora: string): TextoNotificacao {
  return { titulo: 'Sua consulta é amanhã', emoji: '📅', corpo: `${especialidade} às ${hora}. Toque para preparar o relatório.` };
}

export function textoConsultaDia(especialidade: string, hora: string, local: string | null): TextoNotificacao {
  const l = local?.trim();
  return { titulo: 'Sua consulta é hoje', emoji: '📅', corpo: `${especialidade} às ${hora}${l ? ` · ${l}` : ''}` };
}

/**
 * Exames: o título diz "exame" e o nome vai embaixo. Resolve o gênero ("seu mamografia" saía da frase
 * montada com o nome) e o tamanho (o FIT não cabe numa linha).
 */
export function textoExameAntes(exame: string, dias: number): TextoNotificacao {
  return { titulo: 'Seu exame está chegando', emoji: '🔎', corpo: `${exame} · daqui a ${dias} dias` };
}

export function textoExameDia(exame: string): TextoNotificacao {
  return { titulo: 'Hoje é a data do seu exame', emoji: '🔎', corpo: exame };
}

export function textoExameDepois(exame: string): TextoNotificacao {
  return { titulo: 'Já fez seu exame?', emoji: '🔎', corpo: `${exame} · registre o resultado para seguir em dia` };
}
