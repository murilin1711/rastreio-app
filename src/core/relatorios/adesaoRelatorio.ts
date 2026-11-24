import { resumirAdesao, type DoseClassificada, type ResumoAdesao } from '@core/medicacoes/adesao';
import type { Medicacao } from '@core/medicacoes/tipos';
import { formatarQuantidade } from '@core/medicacoes/unidades';
import { dataLocal, somarDias } from './datas';
import type { Bloco, DadosNero, EstadoDosePainel, LinhaAdesao } from './tipos';

/** Símbolo de cada dose no painel. `◆` para errada (e não o `⚠` do app) porque renderiza igual no PDF e no navegador (Ruling X2). */
export const SIMBOLO_DOSE: Record<EstadoDosePainel, string> = { tomou: '●', nao_tomou: '○', errado: '◆', sem_registro: '–' };
export const LEGENDA_DOSES = '● tomou · ○ não tomou · ◆ errada · – sem registro';

/** Janela de `dias` dias terminando em `hoje` (inclusive). */
export function janelaAdesao(hoje: string, dias: 14 | 28): { desde: string; ate: string } {
  return { desde: somarDias(hoje, -(dias - 1)), ate: hoje };
}

const hojeDe = (d: DadosNero) => dataLocal(new Date(d.geradoEm));
const ativasDe = (d: DadosNero) => d.medicacoes.filter((m) => m.ativa);

function resumoPorId(d: DadosNero, ativas: Medicacao[], desde: string, ate: string): Map<string, ResumoAdesao> {
  return new Map(resumirAdesao(ativas, d.tomadas, desde, ate, new Date(d.geradoEm)).map((r) => [r.medicacaoId, r]));
}

/**
 * Uma linha por remédio ativo (ordem do cadastro) nas últimas 2 semanas até o dia de geração.
 * Remédio sem dose prevista nem uso na janela sai com a linha zerada (Ruling X1).
 */
export function linhasAdesao(d: DadosNero): LinhaAdesao[] {
  const ativas = ativasDe(d);
  const { desde, ate } = janelaAdesao(hojeDe(d), 14);
  const resumos = resumoPorId(d, ativas, desde, ate);
  return ativas.map((m) => {
    const r = resumos.get(m.id);
    const base = { medicacaoId: m.id, nome: m.nome, dose: m.dose, sePrecisar: m.sePrecisar };
    if (!r) return { ...base, doses: [], tomou: 0, previstas: 0, errado: 0, percentual: null, usosSePrecisar: 0 };
    return {
      ...base,
      doses: r.doses.map((x) => x.estado).filter((e): e is EstadoDosePainel => e !== 'pendente'),
      tomou: r.tomou,
      previstas: r.previstas,
      errado: r.errado,
      percentual: r.percentual,
      usosSePrecisar: r.usosSePrecisar,
    };
  });
}

const p2 = (n: number) => String(n).padStart(2, '0');
const diaMes = (dia: string) => `${dia.slice(8, 10)}/${dia.slice(5, 7)}`;
const dataBr = (dia: string) => `${diaMes(dia)}/${dia.slice(0, 4)}`;
/** 'HH:MM' local da marca; com 'DD/MM ' na frente quando foi marcada noutro dia que o da dose. */
const marcadoAs = (iso: string, diaDose: string) => {
  const t = new Date(iso);
  const hora = `${p2(t.getHours())}:${p2(t.getMinutes())}`;
  const dia = dataLocal(t);
  return dia === diaDose ? hora : `${diaMes(dia)} ${hora}`;
};
const rotulo = (m: Medicacao) => (m.dose ? `${m.nome} ${m.dose}` : m.nome);

function celulaSemana(m: Medicacao, r: ResumoAdesao | undefined): string {
  if (m.sePrecisar) {
    const n = r?.usosSePrecisar ?? 0;
    return n === 0 ? '—' : n === 1 ? 'usou 1 vez' : `usou ${n} vezes`;
  }
  return r && r.previstas > 0 ? `${r.tomou} de ${r.previstas}` : '—';
}

function linhaDose(m: Medicacao, x: DoseClassificada): string[] {
  const tomadas = x.tomadas.filter((t) => t.tomou);
  const situacao = [x.estado === 'errado' && 'errada', x.comAtraso && 'com atraso'].filter(Boolean).join(', ');
  return [
    dataBr(x.data),
    m.nome,
    `${x.hora} · ${formatarQuantidade(x.quantidadePrevista, m.unidade)}`,
    tomadas.length ? tomadas.map((t) => marcadoAs(t.marcadoEm, x.data)).join(', ') : '—',
    tomadas.length ? tomadas.map((t) => (t.quantidade != null ? formatarQuantidade(t.quantidade, m.unidade) : '—')).join(' + ') : '—',
    situacao,
  ];
}

/** Detalhe das últimas 4 semanas (seção de remédios): por semana e as doses erradas ou com atraso. */
export function blocosAdesaoDetalhe(d: DadosNero): Bloco[] {
  const ativas = ativasDe(d);
  if (!ativas.length) return [];
  const hoje = hojeDe(d);
  const semanas = [3, 2, 1, 0].map((i) => {
    const ate = somarDias(hoje, -7 * i);
    const desde = somarDias(ate, -6);
    return { desde, resumos: resumoPorId(d, ativas, desde, ate) };
  });
  const { desde, ate } = janelaAdesao(hoje, 28);
  const resumos4 = resumoPorId(d, ativas, desde, ate);
  const doses = ativas
    .flatMap((m) => (resumos4.get(m.id)?.doses ?? []).filter((x) => x.estado === 'errado' || x.comAtraso).map((x) => ({ m, x })))
    .sort((a, b) => `${a.x.data} ${a.x.hora}`.localeCompare(`${b.x.data} ${b.x.hora}`));

  const blocos: Bloco[] = [
    { tipo: 'texto', texto: 'Adesão aos remédios nas últimas 4 semanas, pelo que o paciente marcou no app.' },
    {
      tipo: 'tabela',
      colunas: ['Remédio', ...semanas.map((s) => `Semana de ${diaMes(s.desde)}`)],
      linhas: ativas.map((m) => [rotulo(m), ...semanas.map((s) => celulaSemana(m, s.resumos.get(m.id)))]),
    },
  ];
  if (doses.length) {
    blocos.push({ tipo: 'tabela', colunas: ['Data', 'Remédio', 'Previsto', 'Marcado às', 'Quantidade', 'Situação'], linhas: doses.map(({ m, x }) => linhaDose(m, x)) });
  }
  return blocos;
}
