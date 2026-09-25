import type { LembreteCentral } from './central';
import type { TipoLembrete } from './origem';

/**
 * Agenda (pedido do Murilo, 25/09): o que se repete todo dia — remédio, glicemia, água e, enquanto
 * dura, a MRPA — aparece como um card de rotina no topo; a agenda fica só com o que é pontual.
 */
export interface ItemRotina {
  chave: string;
  tipo: TipoLembrete;
  nome: string;
  /** "08:00 e 20:00" ou, em intervalo regular, "das 08:00 às 20:00, a cada 2 h". */
  horarios: string;
  /** Só na MRPA: último dia da sessão, "02/10". */
  ate?: string;
  rota: string;
  silenciado: boolean;
}

const TIPOS_ROTINA: TipoLembrete[] = ['medicacao', 'glicemia', 'mrpa', 'agua'];
const ORDEM: Record<string, number> = { medicacao: 0, glicemia: 1, mrpa: 2, agua: 3 };

const hhmm = (iso: string) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
const minutos = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };

function juntar(hs: string[]): string {
  if (hs.length <= 1) return hs[0] ?? '';
  return `${hs.slice(0, -1).join(', ')} e ${hs[hs.length - 1]}`;
}

function duracao(min: number): string {
  const h = Math.floor(min / 60), m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  return h ? `${h} h` : `${m} min`;
}

/** A partir de três horários igualmente espaçados, resume em intervalo (é o caso da água). */
function descreverHorarios(hs: string[]): string {
  if (hs.length >= 3) {
    const passos = hs.slice(1).map((h, i) => minutos(h) - minutos(hs[i]));
    if (passos.every((p) => p === passos[0])) return `das ${hs[0]} às ${hs[hs.length - 1]}, a cada ${duracao(passos[0])}`;
  }
  return juntar(hs);
}

function chaveDoGrupo(l: LembreteCentral): string {
  const partes = l.chave.split(':');
  if (l.tipo === 'medicacao' || l.tipo === 'mrpa') return `${partes[0]}:${partes[1]}`;
  return l.tipo; // glicemia e água: uma linha só para o plano inteiro
}

function nomeDo(tipo: TipoLembrete, texto: string): string {
  if (tipo === 'glicemia') return 'Medir a glicemia';
  if (tipo === 'agua') return 'Beber água';
  if (tipo === 'mrpa') return 'Medir a pressão (MRPA)';
  return texto.split(' · ').slice(1).join(' · ') || 'Remédio';
}

export function separarRotina<T extends LembreteCentral>(itens: T[]): { rotina: ItemRotina[]; pontuais: T[] } {
  const grupos = new Map<string, T[]>();
  const pontuais: T[] = [];
  for (const l of itens) {
    if (!TIPOS_ROTINA.includes(l.tipo)) { pontuais.push(l); continue; }
    const k = chaveDoGrupo(l);
    if (!grupos.has(k)) grupos.set(k, []);
    grupos.get(k)!.push(l);
  }
  const rotina = Array.from(grupos, ([chave, ls]): ItemRotina => {
    const primeiro = ls[0];
    const horas = Array.from(new Set(ls.map((l) => hhmm(l.quando)))).sort();
    const ultimo = ls.reduce((a, b) => (a.quando > b.quando ? a : b)).quando;
    const d = new Date(ultimo);
    return {
      chave,
      tipo: primeiro.tipo,
      nome: nomeDo(primeiro.tipo, primeiro.texto),
      horarios: descreverHorarios(horas),
      ate: primeiro.tipo === 'mrpa' ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}` : undefined,
      rota: primeiro.rota,
      silenciado: ls.every((l) => l.silenciado),
    };
  });
  rotina.sort((a, b) => ORDEM[a.tipo] - ORDEM[b.tipo] || a.nome.localeCompare(b.nome));
  return { rotina, pontuais };
}
