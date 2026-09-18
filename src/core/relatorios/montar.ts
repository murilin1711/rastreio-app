import { resumoResultadoExame } from '@core/cardio/formato';
import type { ExameCardio } from '@core/cardio/mapeamento';
import { rotuloExame } from '@core/cardio/tiposExames';
import { ROTULO_TIPO_DOCUMENTO } from '@core/documentos/tipos';
import { calcularIdade, calcularIMC, calcularMacosAno } from '@core/perfil/calculos';
import { CLASSIFICACAO, resumoResultado } from '@core/rastreando/formato';
import { ROTULO_EXAME, ROTULO_PROGRAMA, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { LISTA_AGRAVANTES } from '@core/regras/cardio/agravantes';
import { resumoGlicemia } from '@core/regras/cardio/glicemia';
import type { Programa } from '@core/regras/tipos';
import { PRIORIDADES, SECOES_CARDIO, SECOES_GERAL, SECOES_ONCOLOGICO, SEMPRE_PRESENTE, rotuloEspecialidade } from './especialidades';
import { SEM_REGISTROS, type Bloco, type ChaveSecao, type DadosNero, type Especialidade, type Periodo, type SecaoRelatorio } from './tipos';

// ——— utilitários ———
export function dataBr(iso: string | null | undefined): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
export function dataHoraBr(iso: string): string {
  const dt = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(dt.getDate())}/${p(dt.getMonth() + 1)}/${dt.getFullYear()} ${p(dt.getHours())}:${p(dt.getMinutes())}`;
}
const num = (n: number | null | undefined, casas = 0) => (n == null ? '—' : n.toFixed(casas).replace('.', ','));
const texto = (t: string): Bloco => ({ tipo: 'texto', texto: t });
const vazio = (): Bloco[] => [texto(SEM_REGISTROS)];
const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const ultimoPorTipo = (exames: ExameCardio[], tipos: string[]) => tipos.map((t) => exames.filter((e) => e.tipo === t).sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao))[0]).filter(Boolean) as ExameCardio[];
const historicoDe = (exames: ExameCardio[], tipo: string, n = 5) => exames.filter((e) => e.tipo === tipo).sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao)).slice(0, n);

const SIM_NAO = (v: boolean | null) => (v == null ? 'não informado' : v ? 'sim' : 'não');
const ROTULO_TABAGISMO = { nunca: 'nunca fumou', ex: 'ex-fumante', atual: 'fumante atual' } as const;
const ROTULO_PARENTESCO: Record<string, string> = { mae: 'mãe', pai: 'pai', irma_o: 'irmã/irmão', filha_o: 'filha/filho', avo_a: 'avó/avô', tia_o: 'tia/tio', outro: 'outro' };
const ROTULO_CONDICAO: Record<string, string> = { mama: 'câncer de mama', ovario: 'câncer de ovário', colorretal: 'câncer colorretal', prostata: 'câncer de próstata', pulmao: 'câncer de pulmão', colo_utero: 'câncer do colo do útero', dcv_prematura: 'doença cardiovascular precoce', outro: 'outra condição' };
const ROTULO_MOMENTO: Record<string, string> = { jejum: 'jejum', antes_cafe: 'antes do café', pos_cafe_1h: '1 h após café', pos_cafe_2h: '2 h após café', antes_almoco: 'antes do almoço', pos_almoco_1h: '1 h após almoço', pos_almoco_2h: '2 h após almoço', antes_jantar: 'antes do jantar', pos_jantar_1h: '1 h após jantar', pos_jantar_2h: '2 h após jantar', antes_dormir: 'antes de dormir', madrugada: 'madrugada', antes_exercicio: 'antes do exercício', depois_exercicio: 'depois do exercício', sintomas_hipoglicemia: 'com sintomas', aleatoria: 'aleatória', outro: 'outro' };
const ROTULO_STATUS: Record<string, string> = { indicado: 'Indicado', proximo_de_iniciar: 'Próximo de iniciar', nao_indicado_no_momento: 'Não indicado no momento', avaliacao_individualizada: 'Avaliação individualizada', acompanhamento_medico: 'Acompanhamento médico', em_dia: 'Em dia', exame_proximo: 'Exame próximo', exame_atrasado: 'Exame atrasado' };
const ROTULO_CATEGORIA_RISCO = { baixo: 'baixo', intermediario: 'intermediário', alto: 'alto' } as const;

// ——— seções ———
type Construtor = (d: DadosNero, periodo: Periodo) => SecaoRelatorio;

function laboratorio(d: DadosNero, chave: ChaveSecao, titulo: string, tipos: string[]): SecaoRelatorio {
  const ultimos = ultimoPorTipo(d.examesCardio, tipos);
  if (!ultimos.length) return { chave, titulo, blocos: vazio() };
  const linhas = ultimos.map((e) => {
    const r = e.resultado;
    const ref = r.referenciaMin != null || r.referenciaMax != null ? `${r.referenciaMin != null ? num(r.referenciaMin, 1) : '—'} a ${r.referenciaMax != null ? num(r.referenciaMax, 1) : '—'}` : '—';
    const hist = historicoDe(d.examesCardio, e.tipo).slice(1).map((h) => `${resumoResultadoExame(h)} (${dataBr(h.dataRealizacao)})`).join('; ');
    return [rotuloExame(e.tipo), resumoResultadoExame(e), dataBr(e.dataRealizacao), ref, hist || '—'];
  });
  return { chave, titulo, blocos: [{ tipo: 'tabela', colunas: ['Exame', 'Último resultado', 'Data', 'Referência do laboratório', 'Anteriores'], linhas }] };
}

function programa(d: DadosNero, chave: ChaveSecao, p: Programa, titulo: string): SecaoRelatorio {
  const blocos: Bloco[] = [];
  const av = d.avaliacoes[p];
  if (av) blocos.push(texto(`Situação: ${ROTULO_STATUS[av.status] ?? av.status}. ${av.mensagem}${av.proximaData ? ` Próxima data: ${dataBr(av.proximaData)}.` : ''}`));
  const exames = d.examesRastreamento.filter((e) => e.programa === p).sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));
  if (exames.length) {
    blocos.push({ tipo: 'tabela', colunas: ['Exame', 'Data', 'Resultado', 'Classificação', 'Próxima recomendação'], linhas: exames.map((e) => [ROTULO_EXAME[e.tipo as TipoExameRastreamento] ?? e.tipo, dataBr(e.dataRealizacao), resumoResultado(e), CLASSIFICACAO[e.classificacao] ?? e.classificacao, e.proximaAcao ? `${e.proximaAcao}${e.dataProximaAcao ? ` (${dataBr(e.dataProximaAcao)})` : ''}` : '—']) });
  }
  for (const pe of d.pendencias.filter((x) => x.programa === p)) blocos.push({ tipo: 'chip', nivel: (pe.nivelAlerta as 'amarelo') || 'amarelo', texto: `Pendência aberta desde ${dataBr(pe.abertaEm)}: ${pe.descricao}` });
  return { chave, titulo, blocos: blocos.length ? blocos : vazio() };
}

const CONSTRUTORES: Record<ChaveSecao, Construtor> = {
  perfil: (d) => {
    const p = d.perfil;
    const idade = p.dataNascimento ? `${calcularIdade(p.dataNascimento)} anos` : 'idade não informada';
    const condicoes = [p.temHipertensao && 'hipertensão', p.temDiabetes && `diabetes${p.tipoDiabetes ? ` (${p.tipoDiabetes.toUpperCase()})` : ''}`, p.temDoencaRenal && 'doença renal', p.temDii && 'doença inflamatória intestinal', p.temHiv && 'HIV', p.temImunossupressao && 'imunossupressão', p.eventoCvPrevio && 'evento cardiovascular prévio'].filter(Boolean) as string[];
    const itens = [
      `${p.nome || 'Paciente'} · ${idade} · sexo ao nascer: ${p.sexoNascimento ?? 'não informado'}`,
      `Condições informadas: ${condicoes.length ? condicoes.join(', ') : 'nenhuma'}`,
      `Tabagismo: ${p.tabagismoStatus ? ROTULO_TABAGISMO[p.tabagismoStatus] : 'não informado'}${p.tabagismoStatus && p.tabagismoStatus !== 'nunca' && calcularMacosAno(p.cigarrosDia, p.anosFumando) != null ? ` · ${num(calcularMacosAno(p.cigarrosDia, p.anosFumando), 1)} maços-ano` : ''}`,
    ];
    if (p.historicoCancerPessoal.length) itens.push(`Câncer prévio: ${p.historicoCancerPessoal.map((c) => `${c.tipo}${c.ano ? ` (${c.ano})` : ''}`).join(', ')}`);
    if (p.doencasGeneticas.length) itens.push(`Síndromes/mutações: ${p.doencasGeneticas.map((g) => g.nome).join(', ')}`);
    return { chave: 'perfil', titulo: 'Dados gerais', blocos: [{ tipo: 'lista', itens }] };
  },
  medicamentos: (d) => {
    const ativas = d.medicacoes.filter((m) => m.ativa);
    if (!ativas.length) return { chave: 'medicamentos', titulo: 'Medicamentos em uso', blocos: [texto(d.perfil.semMedicacoes ? 'O paciente declarou não usar medicamentos.' : 'Nenhum medicamento cadastrado.')] };
    return { chave: 'medicamentos', titulo: 'Medicamentos em uso', blocos: [{ tipo: 'tabela', colunas: ['Medicamento', 'Dose', 'Horários', 'Desde', 'Prescritor'], linhas: ativas.map((m) => [m.nome, m.dose ?? '—', m.horarios.join(', ') || '—', dataBr(m.desde), m.prescritor ?? '—']) }] };
  },
  documentos: (d) => ({ chave: 'documentos', titulo: 'Documentos anexados no período', blocos: d.documentos.length ? [{ tipo: 'lista', itens: d.documentos.map((x) => `${x.nome} · ${ROTULO_TIPO_DOCUMENTO[x.tipo]} · ${dataBr(x.dataDocumento ?? x.criadoEm)}`) }] : vazio() }),
  pa: (d) => {
    const ms = d.medidasPA.filter((m) => !m.sessaoId).sort((a, b) => a.medidoEm.localeCompare(b.medidoEm));
    if (!ms.length) return { chave: 'pa', titulo: 'Pressão arterial — medidas avulsas', blocos: vazio() };
    const mPas = media(ms.map((m) => m.pas))!; const mPad = media(ms.map((m) => m.pad))!;
    return { chave: 'pa', titulo: 'Pressão arterial — medidas avulsas', blocos: [
      texto(`${ms.length} medidas no período · média ${num(mPas)}/${num(mPad)} mmHg. Medidas avulsas são triagem e não definem diagnóstico; a referência domiciliar é a da MRPA.`),
      { tipo: 'barras', itens: ms.slice(-14).map((m) => ({ rotulo: dataBr(m.medidoEm), valor: m.pas, max: 200, texto: `${m.pas}/${m.pad}` })) },
      { tipo: 'tabela', colunas: ['Data e hora', 'PAS', 'PAD', 'FC', 'Sintomas'], linhas: ms.map((m) => [dataHoraBr(m.medidoEm), String(m.pas), String(m.pad), m.fc != null ? String(m.fc) : '—', m.contexto.sintomas?.length ? m.contexto.sintomas.join(', ') : '—']) },
    ] };
  },
  mrpa: (d) => {
    const ss = d.sessoesMrpa.filter((s) => s.resultado);
    if (!ss.length) return { chave: 'mrpa', titulo: 'MRPA — monitorização residencial', blocos: vazio() };
    const blocos: Bloco[] = [];
    for (const s of ss) {
      const r = s.resultado!;
      const t = r.medias.total;
      blocos.push(texto(`Sessão iniciada em ${dataBr(s.inicio)} (${s.diasPrevistos} dias) · ${r.medidasValidas} medidas válidas, ${r.medidasExcluidas} excluídas · ${r.valido ? 'protocolo válido' : 'protocolo incompleto'}${s.paConsultorio ? ` · PA de consultório informada ${s.paConsultorio.pas}/${s.paConsultorio.pad}` : ''}`));
      if (t) blocos.push({ tipo: 'tabela', colunas: ['', 'Média', 'Medidas'], linhas: [['Geral', `${num(t.pas)}/${num(t.pad)} mmHg`, String(t.n)], ['Manhã', r.medias.manha ? `${num(r.medias.manha.pas)}/${num(r.medias.manha.pad)} mmHg` : '—', String(r.medias.manha?.n ?? 0)], ['Noite', r.medias.noite ? `${num(r.medias.noite.pas)}/${num(r.medias.noite.pad)} mmHg` : '—', String(r.medias.noite?.n ?? 0)]] });
      if (r.medias.porDia.length) blocos.push({ tipo: 'barras', itens: r.medias.porDia.filter((x) => x.total).map((x) => ({ rotulo: `Dia ${x.dia}`, valor: x.total!.pas, max: 200, texto: `${num(x.total!.pas)}/${num(x.total!.pad)}` })) });
      if (r.valido && r.acimaReferencia != null) blocos.push({ tipo: 'chip', nivel: r.acimaReferencia ? 'amarelo' : 'verde', texto: r.acimaReferencia ? 'Média acima da referência domiciliar (130/80 mmHg)' : 'Média dentro da referência domiciliar (130/80 mmHg)' });
    }
    return { chave: 'mrpa', titulo: 'MRPA — monitorização residencial', blocos };
  },
  glicemia: (d) => {
    if (!d.glicemias.length) return { chave: 'glicemia', titulo: 'Glicemia capilar', blocos: vazio() };
    const r = resumoGlicemia(d.glicemias, d.metasGlicemia);
    const m = d.metasGlicemia;
    const blocos: Bloco[] = [
      { tipo: 'lista', itens: [
        `${r.n} medidas no período · média geral ${num(r.media)} mg/dL`,
        `Jejum: média ${num(r.mediaJejum)} · pré-refeição: ${num(r.mediaPre)} · 2 h pós-refeição: ${num(r.mediaPos2h)} mg/dL`,
        `Menor valor: ${r.menor ? `${r.menor.mgdl} mg/dL (${dataHoraBr(r.menor.medidoEm)})` : '—'} · maior: ${r.maior ? `${r.maior.mgdl} mg/dL (${dataHoraBr(r.maior.medidoEm)})` : '—'}`,
        m ? `Metas em uso (${m.origem === 'diretriz' ? 'SBD 2026 pelo perfil' : 'definidas pelo médico'}): jejum ${m.jejumMin}–${m.jejumMax}${m.posMax ? ` · pós-prandial até ${m.posMax}` : ''} · ao deitar ${m.deitarMin}–${m.deitarMax} mg/dL · ${r.abaixoDaMeta} abaixo e ${r.acimaDaMeta} acima da meta` : 'Sem metas definidas no perfil',
        `Episódios registrados: ${r.episodiosBaixos} baixos · ${r.episodiosAltos} altos`,
      ] },
      { tipo: 'tabela', colunas: ['Data e hora', 'mg/dL', 'Momento', 'Sintomas'], linhas: [...d.glicemias].sort((a, b) => a.medidoEm.localeCompare(b.medidoEm)).map((g) => [dataHoraBr(g.medidoEm), String(g.mgdl), ROTULO_MOMENTO[g.momento] ?? g.momento, g.contexto.sintomas?.filter((s) => s !== 'nenhum').join(', ') || '—']) },
    ];
    return { chave: 'glicemia', titulo: 'Glicemia capilar', blocos };
  },
  hba1c: (d) => laboratorio(d, 'hba1c', 'Hemoglobina glicada e glicemia plasmática', ['hba1c', 'glicemia_plasmatica']),
  lipidios: (d) => laboratorio(d, 'lipidios', 'Perfil lipídico', ['colesterol_total', 'ldl', 'hdl', 'nao_hdl', 'triglicerideos', 'lpa']),
  renal: (d) => laboratorio(d, 'renal', 'Função renal', ['creatinina', 'tfg', 'rac_urinaria', 'ureia', 'potassio']),
  tsh: (d) => laboratorio(d, 'tsh', 'Tireoide', ['tsh']),
  peso: (d) => {
    if (!d.peso) return { chave: 'peso', titulo: 'Peso e IMC', blocos: vazio() };
    const imc = d.perfil.alturaCm ? calcularIMC(d.peso.kg, d.perfil.alturaCm) : null;
    return { chave: 'peso', titulo: 'Peso e IMC', blocos: [texto(`Peso ${num(d.peso.kg, 1)} kg em ${dataBr(d.peso.data)}${d.perfil.alturaCm ? ` · altura ${d.perfil.alturaCm} cm · IMC ${num(imc, 1)} kg/m²` : ' · altura não informada'}`)] };
  },
  exames_cardio: (d) => {
    const ex = d.examesCardio.filter((e) => e.categoria === 'cardiologico').sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao));
    if (!ex.length) return { chave: 'exames_cardio', titulo: 'Exames cardiológicos', blocos: vazio() };
    return { chave: 'exames_cardio', titulo: 'Exames cardiológicos', blocos: [{ tipo: 'tabela', colunas: ['Exame', 'Data', 'Resultado / conclusão', 'Onde'], linhas: ex.map((e) => [rotuloExame(e.tipo), dataBr(e.dataRealizacao), resumoResultadoExame(e), e.instituicao ?? '—']) }] };
  },
  prevent: (d) => {
    const r = d.riscos[0];
    if (!r) return { chave: 'prevent', titulo: 'Risco cardiovascular (PREVENT)', blocos: vazio() };
    return { chave: 'prevent', titulo: 'Risco cardiovascular (PREVENT)', blocos: [
      texto(`Calculado em ${dataBr(r.calculadoEm)} · modelo ${r.modelo} · risco em 10 anos ${num(r.ascvd10, 1)}% (categoria ${ROTULO_CATEGORIA_RISCO[r.categoria]})${r.ascvd30 != null ? ` · 30 anos ${num(r.ascvd30, 1)}%` : ''}`),
      { tipo: 'tabela', colunas: ['Dado usado', 'Valor', 'Data', 'Origem'], linhas: r.entradas.map((e) => [e.rotulo, e.valor == null ? '—' : typeof e.valor === 'boolean' ? (e.valor ? 'sim' : 'não') : `${e.valor}${e.unidade ? ` ${e.unidade}` : ''}`, dataBr(e.data), e.origem ?? '—']) },
    ] };
  },
  agravantes: (d) => {
    const itens = d.perfil.agravantesCv.itens.map((id) => LISTA_AGRAVANTES.find((a) => a.id === id)?.rotulo ?? id);
    return { chave: 'agravantes', titulo: 'Fatores agravantes de risco (Dislipidemias 2025)', blocos: itens.length ? [{ tipo: 'lista', itens }] : [texto(d.perfil.agravantesCv.atualizadoEm ? 'Nenhum agravante informado.' : 'Agravantes ainda não revisados no app.')] };
  },
  checkup: (d) => {
    if (!d.checkup) return { chave: 'checkup', titulo: 'Check-up cardiometabólico', blocos: vazio() };
    return { chave: 'checkup', titulo: 'Check-up cardiometabólico', blocos: [texto(`${d.checkup.atualizados} de ${d.checkup.total} itens atualizados`), { tipo: 'lista', itens: d.checkup.itens.map((i) => `${i.rotulo}: ${i.naoSeAplica ? 'não se aplica' : i.atualizado ? 'atualizado' : 'pendente'} — ${i.frase}`) }] };
  },
  rastreamentos_status: (d) => {
    const linhas = (Object.keys(d.avaliacoes) as Programa[]).map((p) => { const a = d.avaliacoes[p]!; return [ROTULO_PROGRAMA[p], ROTULO_STATUS[a.status] ?? a.status, a.proximaData ? dataBr(a.proximaData) : '—', a.mensagem]; });
    return { chave: 'rastreamentos_status', titulo: 'Rastreamentos aplicáveis', blocos: linhas.length ? [{ tipo: 'tabela', colunas: ['Programa', 'Situação', 'Próxima data', 'Orientação'], linhas }] : vazio() };
  },
  mama: (d) => programa(d, 'mama', 'mama', 'Mama'),
  colo: (d) => programa(d, 'colo', 'colo_utero', 'Colo do útero'),
  colorretal: (d) => programa(d, 'colorretal', 'colorretal', 'Intestino (colorretal)'),
  pulmao: (d) => programa(d, 'pulmao', 'pulmao', 'Pulmão'),
  prostata: (d) => programa(d, 'prostata', 'prostata', 'Próstata'),
  pendencias: (d) => ({ chave: 'pendencias', titulo: 'Pendências abertas', blocos: d.pendencias.length ? d.pendencias.map((p) => ({ tipo: 'chip' as const, nivel: (p.nivelAlerta as 'amarelo') || 'amarelo', texto: `${ROTULO_PROGRAMA[p.programa]} · desde ${dataBr(p.abertaEm)}: ${p.descricao}` })) : [texto('Nenhuma pendência aberta.')] }),
  sintomas: (d) => ({ chave: 'sintomas', titulo: 'Sintomas de alerta registrados', blocos: d.sintomas.length ? [{ tipo: 'lista', itens: d.sintomas.map((s) => `${ROTULO_PROGRAMA[s.programa]} · ${s.sintoma} (${dataBr(s.registradoEm)})`) }] : [texto('Nenhum sintoma de alerta registrado.')] }),
  hist_familiar: (d) => ({ chave: 'hist_familiar', titulo: 'História familiar', blocos: d.antecedentes.length ? [{ tipo: 'lista', itens: d.antecedentes.map((a) => `${ROTULO_PARENTESCO[a.parentesco] ?? a.parentesco} (${a.grau === 'primeiro' ? '1º grau' : a.grau === 'segundo' ? '2º grau' : 'outro'}): ${ROTULO_CONDICAO[a.condicao] ?? a.condicao}${a.idadeDiagnostico ? ` aos ${a.idadeDiagnostico} anos` : ''}`) }] : [texto(d.perfil.semAntecedentesFamiliares ? 'O paciente declarou não ter antecedentes familiares relevantes.' : 'Nenhum antecedente cadastrado.')] }),
  tabagismo: (d) => {
    const p = d.perfil;
    if (!p.tabagismoStatus) return { chave: 'tabagismo', titulo: 'Tabagismo', blocos: [texto('Não informado.')] };
    const ma = calcularMacosAno(p.cigarrosDia, p.anosFumando);
    return { chave: 'tabagismo', titulo: 'Tabagismo', blocos: [{ tipo: 'lista', itens: [ROTULO_TABAGISMO[p.tabagismoStatus], ...(p.tabagismoStatus !== 'nunca' ? [`${p.cigarrosDia ?? '—'} cigarros/dia por ${p.anosFumando ?? '—'} anos${ma != null ? ` · ${num(ma, 1)} maços-ano` : ''}`] : []), ...(p.tabagismoStatus === 'ex' ? [`Parou em ${dataBr(p.dataCessacao)}`] : [])] }] };
  },
  consultas: (d) => ({ chave: 'consultas', titulo: 'Consultas marcadas', blocos: d.consultas.length ? [{ tipo: 'lista', itens: d.consultas.map((c) => `${rotuloEspecialidade(c.especialidade)} · ${dataHoraBr(c.dataHora)}${c.local ? ` · ${c.local}` : ''}${c.profissional ? ` · ${c.profissional}` : ''}`) }] : [texto('Nenhuma consulta marcada.')] }),
};

function montarPor(chaves: ChaveSecao[], d: DadosNero, periodo: Periodo): SecaoRelatorio[] {
  const secoes = chaves.map((c) => CONSTRUTORES[c](d, periodo));
  // Pendência aberta nunca é omitida, em nenhum tipo de relatório (§66).
  if (d.pendencias.length && !chaves.includes('pendencias')) secoes.push(CONSTRUTORES.pendencias(d, periodo));
  return secoes;
}

export interface OpcoesMontagem { apenas?: ChaveSecao[] }

export function montarCardio(d: DadosNero, periodo: Periodo, o: OpcoesMontagem = {}): SecaoRelatorio[] {
  return montarPor(o.apenas ? ['perfil', 'medicamentos', ...o.apenas] : SECOES_CARDIO, d, periodo);
}
export function montarOncologico(d: DadosNero, periodo: Periodo): SecaoRelatorio[] {
  return montarPor(SECOES_ONCOLOGICO, d, periodo);
}
export function montarGeral(d: DadosNero, periodo: Periodo): SecaoRelatorio[] {
  return montarPor(SECOES_GERAL, d, periodo);
}
/** D-009: bloco sempre presente primeiro, depois as prioridades da especialidade. 'outra' = relatório geral. */
export function montarConsulta(d: DadosNero, especialidade: Especialidade, periodo: Periodo): SecaoRelatorio[] {
  if (especialidade === 'outra') return montarGeral(d, periodo);
  return montarPor([...SEMPRE_PRESENTE, ...PRIORIDADES[especialidade]], d, periodo);
}

export function tituloRelatorio(tipo: 'cardio' | 'oncologico' | 'geral' | 'consulta', especialidade?: Especialidade): string {
  switch (tipo) {
    case 'cardio': return 'Relatório cardiovascular e metabólico';
    case 'oncologico': return 'Relatório de rastreamento oncológico';
    case 'geral': return 'Relatório geral de acompanhamento';
    case 'consulta': return `Preparação para consulta — ${especialidade ? rotuloEspecialidade(especialidade) : ''}`.trim();
  }
}
