import { textoSegundoLembrete, type TextoNotificacao } from '@core/lembretes/textos';
import { rotaTomar } from './horarios';
import type { Medicacao, Tomada } from './tipos';

/**
 * Segundo lembrete (spec §6.2): um aviso avulso 30 min depois do horário, só se a dose ainda não foi
 * marcada, para as doses de hoje e amanhã. Não grava linha em `lembretes` (não aparece na Agenda):
 * é cancelado pelo identificador da notificação, `medicacao2:<remédio>:<data>:<hora>`.
 */
export const MIN_SEGUNDO_LEMBRETE = 30;
/** No máximo 40 avulsos; passou disso, a janela encolhe para só hoje. */
export const TETO_SEGUNDOS_LEMBRETES = 40;
/** O iOS guarda no máximo 64 agendados por app e descarta o excedente sem erro (D-048). */
export const LIMITE_AVISOS_IOS = 64;
/** Folga para avisos agendados por outro caminho enquanto a sincronização roda. */
const FOLGA = 4;
export const PREFIXO_SEGUNDO = 'medicacao2:';

export const idSegundoLembrete = (medicacaoId: string, data: string, hora: string): string => `${PREFIXO_SEGUNDO}${medicacaoId}:${data}:${hora}`;

/** Quantos segundos lembretes cabem, dado quantos outros avisos já estão agendados no celular. */
export function vagasSegundos(outrosAgendados: number): number {
  return Math.max(0, Math.min(TETO_SEGUNDOS_LEMBRETES, LIMITE_AVISOS_IOS - outrosAgendados - FOLGA));
}

export interface SegundoLembrete {
  identificador: string;
  medicacaoId: string;
  /** Dia da dose ('AAAA-MM-DD'), não do toque: a dose das 23:45 toca às 00:15 do dia seguinte. */
  data: string;
  hora: string;
  quando: Date;
  texto: TextoNotificacao;
  rota: string;
}

/** 'AAAA-MM-DD' do dia local. */
function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Hoje e amanhã, no fuso local. */
export function janelaSegundos(agora: Date): [string, string] {
  return [diaLocal(agora), diaLocal(new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1))];
}

/**
 * Os segundos lembretes da janela, ordenados pelo instante em que tocam. Se não cabem nas `vagas`,
 * fica só com as doses de hoje; se ainda não couberem, com as mais próximas.
 */
export function planejarSegundosLembretes(medicacoes: Medicacao[], tomadas: Tomada[], agora: Date, vagas: number): SegundoLembrete[] {
  const dias = janelaSegundos(agora);
  const marcadas = new Set(tomadas.filter((t) => t.dataPrevista && t.horaPrevista).map((t) => `${t.medicacaoId}|${t.dataPrevista}|${t.horaPrevista}`));
  const candidatos: SegundoLembrete[] = [];
  for (const m of medicacoes) {
    if (!m.ativa || !m.lembrar || m.sePrecisar) continue;
    for (const data of dias) {
      if ((m.desde && data < m.desde) || (m.ate && data > m.ate)) continue;
      const [a, me, d] = data.split('-').map(Number);
      for (const { hora } of m.horarios) {
        const [h, mi] = hora.split(':').map(Number);
        const quando = new Date(a, me - 1, d, h, mi + MIN_SEGUNDO_LEMBRETE);
        if (quando.getTime() <= agora.getTime() || marcadas.has(`${m.id}|${data}|${hora}`)) continue;
        candidatos.push({ identificador: idSegundoLembrete(m.id, data, hora), medicacaoId: m.id, data, hora, quando, texto: textoSegundoLembrete(m.nome, hora), rota: rotaTomar(m.id, hora, data) });
      }
    }
  }
  candidatos.sort((x, y) => x.quando.getTime() - y.quando.getTime());
  if (candidatos.length <= vagas) return candidatos;
  return candidatos.filter((s) => s.data === dias[0]).slice(0, Math.max(0, vagas));
}
