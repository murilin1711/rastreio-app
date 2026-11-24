import type { Medicacao, Tomada, UnidadeDose } from './tipos';

/** Estado de cada dose prevista (spec §6.5). */
export type EstadoDose = 'tomou' | 'nao_tomou' | 'errado' | 'sem_registro' | 'pendente';

export interface DoseClassificada {
  medicacaoId: string;
  data: string; // 'AAAA-MM-DD'
  hora: string; // 'HH:MM'
  quantidadePrevista: number;
  estado: EstadoDose;
  /** Tomou mais de 2 h depois do horário: só informação, não é erro. */
  comAtraso: boolean;
  tomadas: Tomada[];
}

export interface ResumoAdesao {
  medicacaoId: string;
  nome: string;
  dose: string | null;
  unidade: UnidadeDose;
  sePrecisar: boolean;
  /** Doses já fechadas: tomou + não tomou + errado + sem registro (pendentes ficam fora). */
  previstas: number;
  tomou: number;
  naoTomou: number;
  errado: number;
  semRegistro: number;
  comAtraso: number;
  /** Inteiro 0–100; null para "se precisar" ou sem dose prevista. */
  percentual: number | null;
  /** Tomadas avulsas (sem data prevista) no período. */
  usosSePrecisar: number;
  doses: DoseClassificada[];
}

/** Tolerância antes de marcar "com atraso": 2 h depois do horário previsto. */
export const MS_TOLERANCIA_ATRASO = 2 * 3_600_000;

/** 'AAAA-MM-DD' do dia local de um instante. */
function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Instante local de um dia ('AAAA-MM-DD') e hora ('HH:MM'); `dias` desloca a data. */
function instanteLocal(data: string, hora = '00:00', dias = 0): Date {
  const [a, me, d] = data.split('-').map(Number);
  const [h, mi] = hora.split(':').map(Number);
  return new Date(a, me - 1, d + dias, h, mi);
}

function somarDias(data: string, dias: number): string {
  return diaLocal(instanteLocal(data, '00:00', dias));
}

/** A dose pode ser marcada (ou corrigida) até o fim do dia seguinte: hoje e ontem. */
export function podeMarcar(data: string, agora: Date): boolean {
  const hoje = diaLocal(agora);
  return data === hoje || data === somarDias(hoje, -1);
}

/**
 * Classifica cada dose prevista do remédio entre `desde` e `ate` (inclusive).
 * - "Se precisar" não tem dose prevista.
 * - Só conta dentro de desde/ate do remédio e, pelo cadastro, a partir de `horariosDesde`
 *   (antes disso só as doses que têm marca, com a quantidade copiada na tomada).
 */
export function classificarDoses(m: Medicacao, tomadas: Tomada[], desde: string, ate: string, agora: Date): DoseClassificada[] {
  if (m.sePrecisar) return [];
  const inicio = m.desde && m.desde > desde ? m.desde : desde;
  const fim = m.ate && m.ate < ate ? m.ate : ate;
  if (inicio > fim) return [];

  const inicioCadastro = m.horariosDesde ? new Date(m.horariosDesde) : instanteLocal(inicio);
  const daJanela = tomadas.filter(
    (x) => x.medicacaoId === m.id && x.dataPrevista !== null && x.horaPrevista !== null && x.dataPrevista >= inicio && x.dataPrevista <= fim,
  );

  const chave = (data: string, hora: string) => `${data} ${hora}`;
  const slots = new Map<string, { data: string; hora: string }>();
  for (let dia = inicio; dia <= fim; dia = somarDias(dia, 1)) {
    for (const h of m.horarios) {
      if (instanteLocal(dia, h.hora) >= inicioCadastro) slots.set(chave(dia, h.hora), { data: dia, hora: h.hora });
    }
  }
  for (const x of daJanela) slots.set(chave(x.dataPrevista!, x.horaPrevista!), { data: x.dataPrevista!, hora: x.horaPrevista! });

  return [...slots.values()]
    .sort((a, b) => chave(a.data, a.hora).localeCompare(chave(b.data, b.hora)))
    .map(({ data, hora }) => {
      const doSlot = daJanela
        .filter((x) => x.dataPrevista === data && x.horaPrevista === hora)
        .sort((a, b) => Date.parse(a.marcadoEm) - Date.parse(b.marcadoEm));
      const quantidadePrevista =
        doSlot[0]?.quantidadePrevista ?? m.horarios.find((h) => h.hora === hora)?.quantidade ?? 1;
      const sim = doSlot.filter((x) => x.tomou);
      const instante = instanteLocal(data, hora);
      let estado: EstadoDose;
      if (sim.length >= 2) estado = 'errado';
      else if (sim.length === 1) estado = !m.doseVariavel && sim[0].quantidade !== quantidadePrevista ? 'errado' : 'tomou';
      else if (doSlot.length) estado = 'nao_tomou';
      else estado = agora < instanteLocal(data, '00:00', 2) ? 'pendente' : 'sem_registro';
      const comAtraso = sim.length > 0 && Date.parse(sim[0].marcadoEm) - instante.getTime() > MS_TOLERANCIA_ATRASO;
      return { medicacaoId: m.id, data, hora, quantidadePrevista, estado, comAtraso, tomadas: doSlot };
    });
}

/**
 * Resumo por remédio no período. Entra quem tem dose no período ou uso "se precisar".
 * `tomadas` já vêm do período (listarTomadas), inclusive as avulsas.
 */
export function resumirAdesao(medicacoes: Medicacao[], tomadas: Tomada[], desde: string, ate: string, agora: Date): ResumoAdesao[] {
  const resumos: ResumoAdesao[] = [];
  for (const m of medicacoes) {
    const doses = classificarDoses(m, tomadas, desde, ate, agora);
    const usosSePrecisar = tomadas.filter((x) => x.medicacaoId === m.id && x.tomou && x.dataPrevista === null).length;
    if (!doses.length && !usosSePrecisar) continue;
    const contar = (e: EstadoDose) => doses.filter((d) => d.estado === e).length;
    const tomou = contar('tomou');
    const naoTomou = contar('nao_tomou');
    const errado = contar('errado');
    const semRegistro = contar('sem_registro');
    const previstas = tomou + naoTomou + errado + semRegistro;
    resumos.push({
      medicacaoId: m.id,
      nome: m.nome,
      dose: m.dose,
      unidade: m.unidade,
      sePrecisar: m.sePrecisar,
      previstas,
      tomou,
      naoTomou,
      errado,
      semRegistro,
      comAtraso: doses.filter((d) => d.comAtraso).length,
      percentual: m.sePrecisar || previstas === 0 ? null : Math.round((tomou / previstas) * 100),
      usosSePrecisar,
      doses,
    });
  }
  return resumos;
}
