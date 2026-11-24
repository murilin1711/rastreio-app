import { ROTULO_PROGRAMA } from '@core/rastreando/tipos';
import { resumoGlicemia } from '@core/regras/cardio/glicemia';
import { avaliarMedidaCasual } from '@core/regras/cardio/pressao';
import { PRIORIDADES, SECOES_BEMESTAR, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO, SEMPRE_PRESENTE } from './especialidades';
import { dataBr } from './montar';
import type { ChaveSecao, DadosNero, Especialidade, EstadoDosePainel, LinhaAdesao, Periodo, TipoRelatorio } from './tipos';

/** Opções do painel (página 1, D-067). Sem selos de cor (Ruling S0). `apenas` = mesmo filtro do relatório cardio. */
export interface OpcoesPainel { tipo: TipoRelatorio; especialidade?: Especialidade; apenas?: ChaveSecao[]; periodo: Periodo }

/** "Para atenção nesta consulta" mostra no máximo este número de itens. */
export const LIMITE_ATENCAO = 5;

/** As mesmas seções que o relatório do tipo monta na frente (ver `montar*` em montar.ts). */
export function escopoDoRelatorio(o: Pick<OpcoesPainel, 'tipo' | 'especialidade' | 'apenas'>): ChaveSecao[] {
  switch (o.tipo) {
    case 'geral': return SECOES_GERAL;
    case 'cardio': return o.apenas ? ['perfil', 'medicamentos', ...o.apenas] : SECOES_CARDIO;
    case 'oncologico': return SECOES_ONCOLOGICO;
    case 'bemestar': return SECOES_BEMESTAR;
    case 'consulta': return !o.especialidade || o.especialidade === 'outra' ? SECOES_GERAL : [...SEMPRE_PRESENTE, ...PRIORIDADES[o.especialidade]];
  }
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const juntar = (partes: string[]) => (partes.length > 1 ? `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}` : partes[0]);

function itemPendencias(d: DadosNero): string[] {
  return d.pendencias.map((p) => `${ROTULO_PROGRAMA[p.programa]}: ${p.descricao} (aberta em ${dataBr(p.abertaEm)})`);
}

function itemSintomas(d: DadosNero, periodo: Periodo): string[] {
  return d.sintomas
    .filter((s) => s.registradoEm.slice(0, 10) >= periodo.desde)
    .map((s) => `Sintoma de alerta registrado em ${dataBr(s.registradoEm)}: ${s.sintoma} (${ROTULO_PROGRAMA[s.programa]})`);
}

/** Última sessão (por início) com protocolo válido e média acima da referência — o que a regra de MRPA já marcou. */
function itemMrpa(d: DadosNero): string[] {
  const ultima = d.sessoesMrpa.filter((s) => s.resultado).sort((a, b) => b.inicio.localeCompare(a.inicio))[0];
  const r = ultima?.resultado;
  const t = r?.medias.total;
  if (!r || !r.valido || r.acimaReferencia !== true || !t) return [];
  return [`Média da MRPA acima da referência domiciliar (130/80 mmHg): ${Math.round(t.pas)}/${Math.round(t.pad)} mmHg`];
}

/** Medidas avulsas que a C-010 já marca como muito elevadas (fora da camada de contexto). */
function itemPressaoAvulsa(d: DadosNero): string[] {
  const p = d.parametrosPressao;
  if (!p) return [];
  const marcadas = d.medidasPA
    .filter((m) => !m.sessaoId && !m.contexto.excluida)
    .filter((m) => avaliarMedidaCasual(m, m.contexto.sintomas ?? [], p).camada !== 'contexto');
  if (!marcadas.length) return [];
  const maior = [...marcadas].sort((a, b) => b.pas - a.pas || b.pad - a.pad)[0];
  return [`${plural(marcadas.length, 'medida avulsa', 'medidas avulsas')} a partir de ${p.muitoElevado.pas}/${p.muitoElevado.pad} mmHg no período (maior: ${maior.pas}/${maior.pad} em ${dataBr(maior.medidoEm)})`];
}

/** Contagem pelas metas já em uso (SBD pelo perfil ou do médico). */
function itemGlicemia(d: DadosNero): string[] {
  if (!d.metasGlicemia || !d.glicemias.length) return [];
  const r = resumoGlicemia(d.glicemias, d.metasGlicemia);
  const n = r.abaixoDaMeta + r.acimaDaMeta;
  if (n === 0) return [];
  return [`${plural(n, 'glicemia', 'glicemias')} fora da meta no período (${r.abaixoDaMeta} abaixo, ${r.acimaDaMeta} acima)`];
}

/**
 * Só fatos das últimas 2 semanas (Ruling S0): doses não tomadas, sem registro e erradas. Sem limite de
 * percentual. A primeira parte leva o substantivo ("2 doses não tomadas"); as seguintes não ("e 1 sem registro").
 */
function itemRemedio(l: LinhaAdesao): string | null {
  if (l.sePrecisar) return null;
  const conta = (e: EstadoDosePainel) => l.doses.filter((x) => x === e).length;
  const fatos = [
    { n: conta('nao_tomou'), primeiro: ['dose não tomada', 'doses não tomadas'], depois: 'não tomada' },
    { n: conta('sem_registro'), primeiro: ['dose sem registro', 'doses sem registro'], depois: 'sem registro' },
    { n: conta('errado'), primeiro: ['dose errada', 'doses erradas'], depois: 'com dose errada' },
  ].filter((f) => f.n > 0);
  if (!fatos.length) return null;
  const partes = fatos.map((f, i) => (i === 0 ? plural(f.n, f.primeiro[0], f.primeiro[1]) : `${f.n} ${f.depois}`));
  return `${l.nome}: ${juntar(partes)} em 14 dias`;
}

/**
 * Itens de "Para atenção nesta consulta", na ordem da spec, cortados em `LIMITE_ATENCAO`.
 * Pendência aberta entra em todo tipo de relatório (§66); o resto só se a seção estiver no escopo.
 * Nenhuma regra nova: cada item repete o que uma regra existente já marcou.
 */
export function itensAtencao(d: DadosNero, escopo: ChaveSecao[], periodo: Periodo, adesao: LinhaAdesao[]): string[] {
  const tem = (c: ChaveSecao) => escopo.includes(c);
  const itens = [
    ...itemPendencias(d),
    ...(tem('sintomas') ? itemSintomas(d, periodo) : []),
    ...(tem('mrpa') ? itemMrpa(d) : []),
    ...(tem('pa') ? itemPressaoAvulsa(d) : []),
    ...(tem('glicemia') ? itemGlicemia(d) : []),
    ...(tem('medicamentos') ? adesao.map(itemRemedio).filter((x): x is string => x !== null) : []),
  ];
  return itens.slice(0, LIMITE_ATENCAO);
}
