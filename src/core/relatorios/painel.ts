import type { ExameCardio } from '@core/cardio/mapeamento';
import { fmtNum } from '@core/cardio/formato';
import { calcularIdade } from '@core/perfil/calculos';
import { PROGRAMAS, ROTULO_PROGRAMA } from '@core/rastreando/tipos';
import { resumoGlicemia } from '@core/regras/cardio/glicemia';
import { avaliarMedidaCasual } from '@core/regras/cardio/pressao';
import { DIAS_ADESAO_PAINEL, linhasAdesao } from './adesaoRelatorio';
import { diaDe } from './datas';
import { PRIORIDADES, SECOES_BEMESTAR, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO, SEMPRE_PRESENTE } from './especialidades';
import { ROTULO_CATEGORIA_RISCO, ROTULO_STATUS, condicoesInformadas, dataBr, num, textoTabagismo } from './montar';
import type { Programa } from '@core/regras/tipos';
import type { CabecalhoPainel, CartaoNumero, ChaveSecao, DadosNero, Especialidade, EstadoDosePainel, LinhaAdesao, PainelRelatorio, Periodo, PontoPressao, ProgramaPainel, TipoCartao, TipoRelatorio } from './tipos';

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

/** `d.sintomas` são os sintomas de alarme abertos (não resolvidos): entram todos, sem filtro de período (§66). */
function itemSintomas(d: DadosNero): string[] {
  return d.sintomas.map((s) => `Sintoma de alerta registrado em ${dataBr(s.registradoEm)}: ${s.sintoma} (${ROTULO_PROGRAMA[s.programa]})`);
}

/** Última sessão (por início) com protocolo válido e média acima da referência — o que a regra de MRPA já marcou. */
function itemMrpa(d: DadosNero): string[] {
  const ultima = d.sessoesMrpa.filter((s) => s.resultado).sort((a, b) => b.inicio.localeCompare(a.inicio))[0];
  const r = ultima?.resultado;
  const t = r?.medias.total;
  if (!r || !r.valido || r.acimaReferencia !== true || !t) return [];
  const ref = d.parametrosPressao?.referenciaDomiciliar ?? { pas: 130, pad: 80 };
  return [`Média da MRPA acima da referência domiciliar (${ref.pas}/${ref.pad} mmHg): ${Math.round(t.pas)}/${Math.round(t.pad)} mmHg`];
}

/** Medidas avulsas que a C-010 já marca como muito elevadas (fora da camada de contexto). A C-010 é "PAS e/ou PAD". */
function itemPressaoAvulsa(d: DadosNero): string[] {
  const p = d.parametrosPressao;
  if (!p) return [];
  const marcadas = avulsasValidas(d)
    .filter((m) => avaliarMedidaCasual(m, m.contexto.sintomas ?? [], p).camada !== 'contexto');
  if (!marcadas.length) return [];
  const maior = [...marcadas].sort((a, b) => b.pas - a.pas || b.pad - a.pad)[0];
  return [`${plural(marcadas.length, 'medida avulsa', 'medidas avulsas')} com PAS ≥ ${p.muitoElevado.pas} e/ou PAD ≥ ${p.muitoElevado.pad} mmHg no período (maior: ${maior.pas}/${maior.pad} em ${dataBr(maior.medidoEm)})`];
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
 * percentual. Só dispara com não tomada ou errada; "sem registro" sozinho não entra (R3-T4-a), mas vai na
 * frase quando ela existe. A primeira parte leva o substantivo ("2 doses não tomadas"); as seguintes não.
 */
function itemRemedio(l: LinhaAdesao): string | null {
  if (l.sePrecisar) return null;
  const conta = (e: EstadoDosePainel) => l.doses.filter((x) => x === e).length;
  if (conta('nao_tomou') === 0 && conta('errado') === 0) return null;
  const fatos = [
    { n: conta('nao_tomou'), primeiro: ['dose não tomada', 'doses não tomadas'], depois: 'não tomada' },
    { n: conta('sem_registro'), primeiro: ['dose sem registro', 'doses sem registro'], depois: 'sem registro' },
    { n: conta('errado'), primeiro: ['dose errada', 'doses erradas'], depois: 'com dose errada' },
  ].filter((f) => f.n > 0);
  if (!fatos.length) return null;
  const partes = fatos.map((f, i) => (i === 0 ? plural(f.n, f.primeiro[0], f.primeiro[1]) : `${f.n} ${f.depois}`));
  return `${l.nome}: ${juntar(partes)} em ${DIAS_ADESAO_PAINEL} dias`;
}

/**
 * Itens de "Para atenção nesta consulta", cortados em `LIMITE_ATENCAO`. Primeiro a hierarquia de segurança
 * (§66, `regras/seguranca.ts`), em todo tipo de relatório: sintoma de alarme aberto, depois pendência aberta.
 * O resto só se a seção estiver no escopo. `periodo` fica na assinatura para os itens que dependam dele.
 * Nenhuma regra nova: cada item repete o que uma regra existente já marcou.
 */
export function itensAtencao(d: DadosNero, escopo: ChaveSecao[], periodo: Periodo, adesao: LinhaAdesao[]): string[] {
  const tem = (c: ChaveSecao) => escopo.includes(c);
  const itens = [
    ...itemSintomas(d),
    ...itemPendencias(d),
    ...(tem('mrpa') ? itemMrpa(d) : []),
    ...(tem('pa') ? itemPressaoAvulsa(d) : []),
    ...(tem('glicemia') ? itemGlicemia(d) : []),
    ...(tem('medicamentos') ? adesao.map(itemRemedio).filter((x): x is string => x !== null) : []),
  ];
  return itens.slice(0, LIMITE_ATENCAO);
}

// ——— cartões, série da sistólica, prevenção e montagem do painel (Task 5) ———

/** Cartões candidatos por tipo, nesta ordem (spec §6.1, tabela de blocos). */
const CARTOES_POR_TIPO: Record<TipoRelatorio, TipoCartao[]> = {
  geral: ['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso', 'cintura'],
  // Sem peso: SECOES_CARDIO não tem `peso` nem `corpo`, e o número do cartão tem de estar no detalhe (R3-T5-b).
  cardio: ['pressao', 'hba1c', 'ldl', 'risco', 'glicemia'],
  oncologico: [],
  bemestar: ['peso', 'cintura'],
  consulta: ['pressao', 'hba1c', 'ldl', 'risco', 'glicemia', 'peso', 'cintura'],
};

/** Seções do relatório que sustentam cada cartão; com `filtrar`, o cartão só entra se alguma estiver no escopo. */
const SECOES_DO_CARTAO: Record<TipoCartao, ChaveSecao[]> = {
  pressao: ['mrpa', 'pa'], hba1c: ['hba1c'], ldl: ['lipidios'], risco: ['prevent'], glicemia: ['glicemia'], peso: ['corpo'], cintura: ['corpo'],
};

/** Seções de rastreamento: com alguma delas no escopo, o painel traz a prevenção. */
const SECOES_PREVENCAO: ChaveSecao[] = ['rastreamentos_status', 'mama', 'colo', 'colorretal', 'pulmao', 'prostata'];

/** Seção de cada programa (a mesma dos construtores de montar.ts). `rastreamentos_status` no escopo traz todos. */
const SECAO_DO_PROGRAMA: Record<Programa, ChaveSecao> = { mama: 'mama', colo_utero: 'colo', colorretal: 'colorretal', pulmao: 'pulmao', prostata: 'prostata' };

/** Medidas avulsas que contam: fora de sessão MRPA e não excluídas (mesmo filtro da seção `pa` e de "Para atenção"). */
export const avulsasValidas = (d: DadosNero) => d.medidasPA.filter((m) => !m.sessaoId && !m.contexto.excluida);

const tendencia = (atual: number, anterior: number | null | undefined): CartaoNumero['tendencia'] =>
  anterior == null || atual === anterior ? null : atual > anterior ? 'subiu' : 'desceu';

function cartaoPressao(d: DadosNero): CartaoNumero | null {
  const sessoes = d.sessoesMrpa.filter((s) => s.resultado?.medias.total).sort((a, b) => b.inicio.localeCompare(a.inicio));
  if (sessoes.length) {
    const r = sessoes[0].resultado!;
    const t = r.medias.total!;
    return {
      tipo: 'pressao', titulo: 'Pressão arterial (MRPA)', valor: `${num(t.pas)}/${num(t.pad)}`, unidade: 'mmHg', data: dataBr(sessoes[0].inicio),
      detalhe: `${r.medidasValidas} medidas válidas${r.valido ? '' : ' · protocolo incompleto'}`, tendencia: tendencia(Math.round(t.pas), sessoes[1] ? Math.round(sessoes[1].resultado!.medias.total!.pas) : null),
    };
  }
  // Mesmas medidas e mesma média da seção "Pressão arterial: medidas avulsas" do detalhe.
  const ms = avulsasValidas(d).sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
  if (!ms.length) return null;
  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return {
    tipo: 'pressao', titulo: 'Pressão arterial (média das medidas avulsas)', valor: `${num(media(ms.map((m) => m.pas)))}/${num(media(ms.map((m) => m.pad)))}`, unidade: 'mmHg',
    data: dataBr(diaDe(ms[ms.length - 1].medidoEm)), detalhe: `${ms.length} ${ms.length === 1 ? 'medida' : 'medidas'}`, tendencia: null,
  };
}

function cartaoExame(d: DadosNero, tipo: 'hba1c' | 'ldl', titulo: string): CartaoNumero | null {
  const exames = d.examesCardio.filter((e): e is ExameCardio & { resultado: { valor: number } } => e.tipo === tipo && e.resultado.valor != null)
    .sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));
  if (!exames.length) return null;
  const r = exames[0].resultado;
  const temRef = r.referenciaMin != null || r.referenciaMax != null;
  return {
    tipo, titulo, valor: fmtNum(r.valor), unidade: r.unidade ?? '', data: dataBr(exames[0].dataRealizacao),
    detalhe: temRef ? `referência do laboratório: ${r.referenciaMin != null ? num(r.referenciaMin, 1) : '—'} a ${r.referenciaMax != null ? num(r.referenciaMax, 1) : '—'}` : null,
    tendencia: tendencia(r.valor, exames[1]?.resultado.valor),
  };
}

function cartaoRisco(d: DadosNero): CartaoNumero | null {
  const r = d.riscos[0];
  if (!r) return null;
  return { tipo: 'risco', titulo: 'Risco cardiovascular em 10 anos (PREVENT)', valor: num(r.ascvd10, 1), unidade: '%', data: dataBr(r.calculadoEm), detalhe: `categoria ${ROTULO_CATEGORIA_RISCO[r.categoria]}`, tendencia: null };
}

function cartaoGlicemia(d: DadosNero): CartaoNumero | null {
  if (!d.glicemias.length) return null;
  const r = resumoGlicemia(d.glicemias, d.metasGlicemia);
  const ultima = [...d.glicemias].sort((a, b) => b.medidoEm.localeCompare(a.medidoEm))[0];
  return { tipo: 'glicemia', titulo: 'Glicemia capilar', valor: num(r.media), unidade: 'mg/dL', data: dataBr(diaDe(ultima.medidoEm)), detalhe: `${r.n} ${r.n === 1 ? 'medida' : 'medidas'} no período`, tendencia: null };
}

/**
 * Medidas corporais com a mesma fonte e as mesmas condições da seção `corpo` do detalhe: sem bem-estar ou sem
 * parâmetros a seção sai vazia, e então não há cartão (R3-T5-b).
 */
function medidasCorporais(d: DadosNero, tipo: 'peso' | 'cintura', campo: 'kg' | 'cm') {
  const be = d.bemEstar;
  if (!be || !be.parametros) return [];
  return be.corporais.filter((m) => m.tipo === tipo && m.valores[campo] != null).sort((a, b) => b.medidoEm.localeCompare(a.medidoEm));
}

function cartaoPeso(d: DadosNero): CartaoNumero | null {
  const pesos = medidasCorporais(d, 'peso', 'kg');
  const ultimo = pesos[0];
  if (!ultimo) return null;
  const kg = ultimo.valores.kg!;
  const altura = d.bemEstar!.alturaCm;
  return {
    tipo: 'peso', titulo: 'Peso e IMC', valor: num(kg, 1), unidade: 'kg', data: dataBr(diaDe(ultimo.medidoEm)),
    detalhe: altura ? `IMC ${num(kg / (altura / 100) ** 2, 1)}` : null, tendencia: tendencia(kg, pesos[1]?.valores.kg),
  };
}

function cartaoCintura(d: DadosNero): CartaoNumero | null {
  const c = medidasCorporais(d, 'cintura', 'cm')[0];
  if (!c) return null;
  return { tipo: 'cintura', titulo: 'Circunferência abdominal', valor: num(c.valores.cm, 0), unidade: 'cm', data: dataBr(diaDe(c.medidoEm)), detalhe: null, tendencia: null };
}

const CONSTRUTOR_CARTAO: Record<TipoCartao, (d: DadosNero) => CartaoNumero | null> = {
  pressao: cartaoPressao,
  hba1c: (d) => cartaoExame(d, 'hba1c', 'Hemoglobina glicada (HbA1c)'),
  ldl: (d) => cartaoExame(d, 'ldl', 'Colesterol LDL'),
  risco: cartaoRisco, glicemia: cartaoGlicemia, peso: cartaoPeso, cintura: cartaoCintura,
};

/**
 * Cartões dos números principais: valor, unidade, data, detalhe e tendência (↑ ↓), sem selo de cor (Ruling S0).
 * `filtrar` (consulta e cardio com `apenas`) mantém só os cartões cujas seções estão no escopo. Cartão sem dado não entra.
 */
export function cartoesDoPainel(d: DadosNero, tipo: TipoRelatorio, escopo: ChaveSecao[], filtrar: boolean): CartaoNumero[] {
  return CARTOES_POR_TIPO[tipo]
    .filter((c) => !filtrar || SECOES_DO_CARTAO[c].some((s) => escopo.includes(s)))
    .map((c) => CONSTRUTOR_CARTAO[c](d))
    .filter((c): c is CartaoNumero => c !== null);
}

/**
 * Sistólica do período: medidas avulsas válidas + média de cada dia das sessões MRPA, por data crescente, a partir
 * de `periodo.desde` (dia de MRPA antiga não estica o eixo). Sem cor por ponto (C-010).
 */
export function seriePressao(d: DadosNero, periodo: Periodo): PontoPressao[] {
  const avulsas = avulsasValidas(d).map((m) => ({ data: diaDe(m.medidoEm), pas: m.pas }));
  const dias = d.sessoesMrpa.flatMap((s) => (s.resultado?.medias.porDia ?? []).filter((x) => x.total).map((x) => ({ data: x.data, pas: x.total!.pas })));
  return [...avulsas, ...dias].filter((x) => x.data >= periodo.desde).sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Um item por programa avaliado e aplicável, com o mesmo texto de situação do app (sem cor, Ruling S0). Só os
 * programas do escopo: `rastreamentos_status` traz todos; senão, os que têm a seção (ex.: mastologia → mama).
 */
export function prevencaoDoPainel(d: DadosNero, escopo: ChaveSecao[]): ProgramaPainel[] {
  const todos = escopo.includes('rastreamentos_status');
  return PROGRAMAS.flatMap((programa) => {
    const av = d.avaliacoes[programa];
    if (!av || av.naoAplicavel || (!todos && !escopo.includes(SECAO_DO_PROGRAMA[programa]))) return [];
    return [{ programa, rotulo: ROTULO_PROGRAMA[programa], situacao: ROTULO_STATUS[av.status] ?? av.status, proximaData: av.proximaData ?? null, mensagem: av.mensagem }];
  });
}

function cabecalhoDoPainel(d: DadosNero): CabecalhoPainel {
  const p = d.perfil;
  return {
    nome: p.nome || 'Paciente',
    idade: p.dataNascimento ? calcularIdade(p.dataNascimento, new Date(d.geradoEm)) : null,
    sexo: p.sexoNascimento ?? null,
    condicoes: condicoesInformadas(p),
    tabagismo: textoTabagismo(p),
  };
}

/** Página 1 (painel, D-067): blocos conforme o tipo (spec §6.1); o filtro `apenas` do cardio vale também aqui. */
export function montarPainel(d: DadosNero, o: OpcoesPainel): PainelRelatorio {
  const escopo = escopoDoRelatorio(o);
  const comMedidas = o.tipo === 'geral' || o.tipo === 'cardio' || o.tipo === 'consulta';
  const adesao = comMedidas ? linhasAdesao(d) : null;
  const filtrar = o.tipo === 'consulta' || (o.tipo === 'cardio' && !!o.apenas);
  const serie = comMedidas && (escopo.includes('pa') || escopo.includes('mrpa')) ? seriePressao(d, o.periodo) : [];
  const comPrevencao = o.tipo === 'geral' || o.tipo === 'oncologico' || (o.tipo === 'consulta' && SECOES_PREVENCAO.some((s) => escopo.includes(s)));
  return {
    cabecalho: cabecalhoDoPainel(d),
    atencao: itensAtencao(d, escopo, o.periodo, adesao ?? []),
    cartoes: cartoesDoPainel(d, o.tipo, escopo, filtrar),
    seriePressao: serie.length >= 2 ? serie : null,
    referenciaSistolica: d.parametrosPressao?.referenciaDomiciliar.pas ?? 130,
    adesao,
    prevencao: comPrevencao ? prevencaoDoPainel(d, escopo) : null,
    prevencaoDetalhada: o.tipo === 'oncologico',
  };
}
