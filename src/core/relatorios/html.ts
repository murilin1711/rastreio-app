import { TITULO_COMPLEMENTO, type Bloco, type CartaoNumero, type LinhaAdesao, type PainelRelatorio, type Periodo, type ProgramaPainel, type SecaoRelatorio, type TipoRelatorio } from './tipos';
import { CREDITOS } from '@core/publicacao';
import { LEGENDA_DOSES, ROTULO_DOSE, SIMBOLO_DOSE, contaRemedio, rotuloDoses } from './adesaoRelatorio';
import { fontesDoRelatorio } from './fontes';
import { svgSistolica } from './grafico';

/** Ressalvas literais da especificação — nunca reescrever. */
export const RESSALVA_CARDIO = 'Este relatório organiza suas aferições domiciliares e não substitui a interpretação realizada pelo seu médico.';
export const RESSALVA_ONCOLOGICO = 'As informações apresentadas foram registradas pelo usuário e organizadas pelo NERO para facilitar o acompanhamento com seu profissional de saúde. O relatório não substitui avaliação médica.';

export const RESSALVA_HABITOS = 'Registros de hábitos, alimentação e sono são autorrelatados.';

/** Ressalva curta do rodapé do painel (página 1); as literais acima seguem no fim do relatório. */
export const RESSALVA_CURTA_PAINEL = 'Dados registrados pelo paciente e organizados pelo NERO; não substituem a avaliação médica.';

export function ressalvasPara(tipo: TipoRelatorio): string[] {
  if (tipo === 'cardio') return [RESSALVA_CARDIO];
  if (tipo === 'oncologico') return [RESSALVA_ONCOLOGICO];
  if (tipo === 'bemestar') return [RESSALVA_CARDIO, RESSALVA_ONCOLOGICO, RESSALVA_HABITOS];
  return [RESSALVA_CARDIO, RESSALVA_ONCOLOGICO];
}

export function escapar(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const COR_CHIP: Record<string, { bg: string; fg: string }> = { verde: { bg: '#dcfce7', fg: '#15803d' }, amarelo: { bg: '#fef3c7', fg: '#b45309' }, laranja: { bg: '#ffedd5', fg: '#c2410c' }, vermelho: { bg: '#fee2e2', fg: '#b91c1c' }, cinza: { bg: '#f3f4f6', fg: '#4b5563' } };

function bloco(b: Bloco): string {
  switch (b.tipo) {
    case 'texto': return `<p>${escapar(b.texto)}</p>`;
    case 'lista': return `<ul>${b.itens.map((i) => `<li>${escapar(i)}</li>`).join('')}</ul>`;
    case 'tabela': return `<table><thead><tr>${b.colunas.map((c) => `<th>${escapar(c)}</th>`).join('')}</tr></thead><tbody>${b.linhas.map((l) => `<tr>${l.map((c) => `<td>${escapar(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
    case 'barras': return `<div class="barras">${b.itens.map((i) => { const pct = Math.max(2, Math.min(100, Math.round((i.valor / i.max) * 100))); return `<div class="barra"><span class="rotulo">${escapar(i.rotulo)}</span><span class="trilho"><span class="preenchido" style="width:${pct}%"></span></span><span class="valor">${escapar(i.texto)}</span></div>`; }).join('')}</div>`;
    case 'chip': { const c = COR_CHIP[b.nivel] ?? COR_CHIP.cinza; return `<p class="chip" style="background:${c.bg};color:${c.fg}">${escapar(b.texto)}</p>`; }
  }
}

const CSS = `
@page { size: A4; margin: 12mm 13mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1D2E45; font-size: 9.5pt; line-height: 1.3; margin: 0; }
header { border-bottom: 2px solid #0f2d63; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
header h1 { font-size: 18pt; margin: 0 0 4px; color: #0f2d63; }
header .marca { font-size: 9pt; letter-spacing: 1px; color: #5B8DB8; font-weight: 700; }
header .meta { font-size: 9.5pt; color: #4A5C7A; }
header .qr { width: 96px; height: 96px; flex: none; }
header .qr svg { width: 96px; height: 96px; }
/* Seções longas podem quebrar entre linhas (menos página em branco); o título nunca fica sozinho no fim da página. */
section { margin-bottom: 8px; }
h2, h3 { break-after: avoid; page-break-after: avoid; }
tr, li { break-inside: avoid; page-break-inside: avoid; }
h2 { font-size: 11pt; color: #0f2d63; margin: 8px 0 3px; border-left: 4px solid #5B8DB8; padding-left: 8px; }
/* Abre a terceira parte do relatório por especialidade: marca a virada de foco para complemento. */
h2.complemento { font-size: 14pt; border-left: none; padding: 14px 0 0; margin-top: 26px; border-top: 2px solid #DCE2EE; color: #4A5C7A; page-break-before: always; }
p { margin: 3px 0; }
ul { margin: 3px 0; padding-left: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 3px 0; }
th, td { text-align: left; padding: 1px 6px; border-bottom: 1px solid #DCE2EE; vertical-align: top; }
th { background: #E9EDF5; font-weight: 600; }
tbody tr:nth-child(even) td { background: #F5F7FB; }
.barras { margin: 6px 0; }
.barra { display: flex; align-items: center; gap: 8px; font-size: 9pt; margin: 2px 0; }
.barra .rotulo { width: 70px; color: #4A5C7A; }
.barra .trilho { flex: 1; height: 8px; background: #E9EDF5; border-radius: 4px; overflow: hidden; }
.barra .preenchido { display: block; height: 100%; background: #5B8DB8; }
.barra .valor { width: 60px; text-align: right; }
.chip { display: inline-block; border-radius: 12px; padding: 2px 10px; font-size: 9.5pt; font-weight: 600; }
.fontes { page-break-inside: auto; break-inside: auto; font-size: 7.5pt; line-height: 1.25; }
.fontes ol { margin: 4px 0; padding-left: 18px; columns: 2; column-gap: 18px; }
.fontes li { break-inside: avoid; page-break-inside: avoid; }
.fontes a { color: #0f2d63; word-break: break-all; }
footer { margin-top: 12px; border-top: 1px solid #DCE2EE; padding-top: 8px; font-size: 8.5pt; color: #4A5C7A; }
footer p { margin: 3px 0; }
/* Página 1: painel (D-067). Sem cor de bom ou ruim: só a caixa de atenção tem destaque. */
.painel { break-inside: auto; page-break-inside: auto; break-after: page; page-break-after: always; margin-bottom: 0; }
.painel header { margin-bottom: 8px; }
.painel .paciente { font-size: 13pt; margin: 0 0 2px; }
.painel h3 { font-size: 10.5pt; color: #0f2d63; margin: 0 0 4px; }
.atencao { border: 1.5px solid ${COR_CHIP.vermelho.fg}; background: ${COR_CHIP.vermelho.bg}; border-radius: 6px; padding: 5px 10px; margin-bottom: 8px; }
.atencao h2 { border-left: none; padding-left: 0; margin: 0 0 2px; font-size: 11pt; color: ${COR_CHIP.vermelho.fg}; }
.atencao ul { margin: 0; font-size: 9.5pt; }
.cartoes { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.cartao { border: 1px solid #DCE2EE; border-radius: 6px; padding: 4px 10px; break-inside: avoid; page-break-inside: avoid; }
.cartao .titulo { font-size: 8.5pt; color: #4A5C7A; }
.cartao .valor { font-size: 14pt; font-weight: 700; color: #0f2d63; line-height: 1.15; }
.cartao .unidade { font-size: 9pt; font-weight: 400; color: #4A5C7A; }
.cartao .tendencia { font-size: 12pt; margin-left: 4px; }
.cartao .det { font-size: 8.5pt; color: #4A5C7A; }
.grafico, .remedios, .prevencao { margin-bottom: 8px; break-inside: avoid; page-break-inside: avoid; }
.grafico svg { display: block; width: 100%; height: auto; }
.legenda { font-size: 8pt; color: #4A5C7A; }
.remedio { display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 8px; font-size: 9.5pt; padding: 2px 0; border-bottom: 1px solid #E9EDF5; }
.remedio .nome { flex: 0 0 150px; }
/* Bolinhas sem ponto de quebra: cada uma é um item, e a linha quebra em vez de transbordar (3x/dia ou mais no celular). */
.remedio .doses { flex: 1; display: flex; flex-wrap: wrap; min-width: 0; gap: 0 1px; color: #0f2d63; }
.remedio .conta { white-space: nowrap; }
.prevencao p, .prevencao ul { font-size: 9.5pt; }
.painel-rodape { font-size: 8.5pt; color: #4A5C7A; border-top: 1px solid #DCE2EE; padding-top: 6px; }
/* Só na página do QR (html.tela): o PDF não depende do media type do expo-print. */
html.tela body { max-width: 820px; margin: 0 auto; padding: 24px; }
html.tela .painel { border-bottom: 2px solid #DCE2EE; padding-bottom: 8px; margin-bottom: 16px; }
@media screen and (max-width: 640px) { .cartoes { grid-template-columns: 1fr; } .fontes ol { columns: 1; } header { flex-direction: column; } body { padding: 16px; } .remedio .nome { flex-basis: 100%; } th, td { padding: 1px 3px; overflow-wrap: anywhere; } }
`;

export interface EntradaHtml {
  tipo: TipoRelatorio;
  titulo: string;
  paciente: { nome: string; nascimento: string | null };
  periodo: Periodo;
  secoes: SecaoRelatorio[];
  geradoEm: string; // ISO
  qrSvg?: string;
  validadeQr?: string;
  /** Página 1 (D-067). Com ele, o cabeçalho vira o do painel e o detalhe começa na página 2. */
  painel?: PainelRelatorio | null;
  /** Página do QR no navegador: liga os estilos só de tela (`html.tela`). O PDF nunca passa. */
  tela?: boolean;
}

function dataBr(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

/** Referências com o link escrito por extenso: o PDF também é impresso, e no papel o link não abre. */
function blocoFontes(secoes: SecaoRelatorio[]): string {
  const fontes = fontesDoRelatorio(secoes);
  if (!fontes.length) return '';
  return `<section class="fontes"><h2>Fontes</h2><ol>${fontes.map((f) => `<li>${escapar(f.titulo.replace(/\.$/, ''))}. ${escapar(f.emissor)}, ${f.ano}. <a href="${escapar(f.url)}">${escapar(f.url)}</a></li>`).join('')}</ol></section>`;
}

/** Seta da tendência e o rótulo dela (a seta nunca sozinha): também na prévia do app. */
export const SETA_TENDENCIA: Record<NonNullable<CartaoNumero['tendencia']>, { seta: string; rotulo: string }> = {
  subiu: { seta: '↑', rotulo: 'subiu em relação à medida anterior' },
  desceu: { seta: '↓', rotulo: 'desceu em relação à medida anterior' },
};

function cartao(c: CartaoNumero): string {
  const t = c.tendencia ? SETA_TENDENCIA[c.tendencia] : null;
  const det = [c.data, c.detalhe].filter(Boolean).map((x) => escapar(x!)).join(' · ');
  return `<div class="cartao"><div class="titulo">${escapar(c.titulo)}</div><div class="valor">${escapar(c.valor)}${c.unidade ? ` <span class="unidade">${escapar(c.unidade)}</span>` : ''}${t ? `<span class="tendencia" title="${t.rotulo}" aria-label="${t.rotulo}">${t.seta}</span>` : ''}</div>${det ? `<div class="det">${det}</div>` : ''}</div>`;
}

function linhaRemedio(l: LinhaAdesao): string {
  const nome = l.dose ? `${l.nome} ${l.dose}` : l.nome;
  const doses = l.doses.map((e) => `<span class="dose" title="${ROTULO_DOSE[e]}">${SIMBOLO_DOSE[e]}</span>`).join('');
  const contagem = rotuloDoses(l.doses);
  const rotulo = contagem ? ` aria-label="${contagem}"` : '';
  return `<div class="remedio"><span class="nome">${escapar(nome)}</span><span class="doses"${rotulo}>${doses}</span><span class="conta">${escapar(contaRemedio(l))}</span></div>`;
}

function blocoPrevencao(itens: ProgramaPainel[], detalhada: boolean): string {
  if (!detalhada) return `<p>${itens.map((p) => `${escapar(p.rotulo)}: ${escapar(p.situacao)}`).join(' · ')}</p>`;
  return `<ul>${itens.map((p) => `<li><strong>${escapar(p.rotulo)}</strong>: ${escapar(p.situacao)}${p.proximaData ? ` · próxima data: ${dataBr(p.proximaData)}` : ''}${p.mensagem ? `. ${escapar(p.mensagem)}` : ''}</li>`).join('')}</ul>`;
}

function htmlPainel(e: EntradaHtml, p: PainelRelatorio, geradoEm: string): string {
  const c = p.cabecalho;
  const sexo = c.sexo ? `Sexo ao nascer: ${escapar(c.sexo)} · ` : '';
  const cab = `<header><div><div class="marca">NERO</div><h1>${escapar(e.titulo)}</h1><p class="paciente"><strong>${escapar(c.nome)}</strong>${c.idade != null ? `, ${c.idade} anos` : ''}</p><div class="meta">${sexo}Condições informadas: ${c.condicoes.length ? escapar(c.condicoes.join(', ')) : 'nenhuma'}<br>Tabagismo: ${escapar(c.tabagismo)}<br>Período das medidas: ${escapar(e.periodo.rotulo)} (${dataBr(e.periodo.desde)} a ${dataBr(e.periodo.ate)})<br>Gerado em ${geradoEm}</div></div>${e.qrSvg ? `<div class="qr">${e.qrSvg}</div>` : ''}</header>`;
  const atencao = p.atencao.length ? `<div class="atencao"><h2>Para atenção nesta consulta</h2><ul>${p.atencao.map((i) => `<li>${escapar(i)}</li>`).join('')}</ul></div>` : '';
  const cartoes = p.cartoes.length ? `<div class="cartoes">${p.cartoes.map(cartao).join('')}</div>` : '';
  // O SVG é gerado por nós, só com números e datas: entra cru.
  const svg = p.seriePressao ? svgSistolica(p.seriePressao, { largura: 640, altura: 120, referencia: p.referenciaSistolica }) : '';
  const grafico = svg ? `<div class="grafico"><h3>Pressão sistólica no período</h3>${svg}<p class="legenda">Linha tracejada: referência domiciliar de ${p.referenciaSistolica} mmHg.</p></div>` : '';
  const remedios = p.adesao?.length ? `<div class="remedios"><h3>Remédios: últimas 2 semanas</h3>${p.adesao.map(linhaRemedio).join('')}<p class="legenda">${escapar(LEGENDA_DOSES)}</p></div>` : '';
  const prevencao = p.prevencao?.length ? `<div class="prevencao"><h3>Prevenção</h3>${blocoPrevencao(p.prevencao, p.prevencaoDetalhada)}</div>` : '';
  return `<section class="painel">${cab}${atencao}${cartoes}${grafico}${remedios}${prevencao}<p class="painel-rodape">Detalhes nas páginas seguintes. ${escapar(RESSALVA_CURTA_PAINEL)}</p></section>`;
}

export function htmlRelatorio(e: EntradaHtml): string {
  const ressalvas = ressalvasPara(e.tipo);
  const dt = new Date(e.geradoEm);
  const geradoEm = `${dataBr(e.geradoEm)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const topo = e.painel
    ? htmlPainel(e, e.painel, geradoEm)
    : `<header><div><div class="marca">NERO</div><h1>${escapar(e.titulo)}</h1><div class="meta">${escapar(e.paciente.nome)}${e.paciente.nascimento ? ` · nascimento ${dataBr(e.paciente.nascimento)}` : ''}<br>Período das medidas: ${escapar(e.periodo.rotulo)} (${dataBr(e.periodo.desde)} a ${dataBr(e.periodo.ate)})<br>Gerado em ${geradoEm}</div></div>${e.qrSvg ? `<div class="qr">${e.qrSvg}</div>` : ''}</header>`;
  return `<!DOCTYPE html><html lang="pt-BR"${e.tela ? ' class="tela"' : ''}><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapar(e.titulo)}</title><style>${CSS}</style></head><body>
${topo}
${e.secoes.map((s) => `${s.abreComplemento ? `<h2 class="complemento">${escapar(TITULO_COMPLEMENTO)}</h2>` : ''}<section><h2>${escapar(s.titulo)}</h2>${s.blocos.map(bloco).join('')}</section>`).join('\n')}
${blocoFontes(e.secoes)}
<footer>${ressalvas.map((r) => `<p>${escapar(r)}</p>`).join('')}<p>Gerado pelo NERO em ${geradoEm} · dados registrados pelo paciente.${e.validadeQr ? ` O código QR dá acesso a este relatório até ${escapar(e.validadeQr)}.` : ''}</p><p>${escapar(CREDITOS)}.</p></footer>
</body></html>`;
}
