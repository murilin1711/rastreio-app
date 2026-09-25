import { TITULO_COMPLEMENTO, type Bloco, type Periodo, type SecaoRelatorio, type TipoRelatorio } from './tipos';

/** Ressalvas literais da especificação — nunca reescrever. */
export const RESSALVA_CARDIO = 'Este relatório organiza suas aferições domiciliares e não substitui a interpretação realizada pelo seu médico.';
export const RESSALVA_ONCOLOGICO = 'As informações apresentadas foram registradas pelo usuário e organizadas pelo NERO para facilitar o acompanhamento com seu profissional de saúde. O relatório não substitui avaliação médica.';

export const RESSALVA_HABITOS = 'Registros de hábitos, alimentação e sono são autorrelatados.';

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
@page { size: A4; margin: 18mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1D2E45; font-size: 11pt; line-height: 1.45; margin: 0; }
header { border-bottom: 2px solid #0f2d63; padding-bottom: 8px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
header h1 { font-size: 18pt; margin: 0 0 4px; color: #0f2d63; }
header .marca { font-size: 9pt; letter-spacing: 1px; color: #5B8DB8; font-weight: 700; }
header .meta { font-size: 9.5pt; color: #4A5C7A; }
header .qr { width: 96px; height: 96px; flex: none; }
header .qr svg { width: 96px; height: 96px; }
section { page-break-inside: avoid; break-inside: avoid; margin-bottom: 14px; }
h2 { font-size: 12.5pt; color: #0f2d63; margin: 14px 0 6px; border-left: 4px solid #5B8DB8; padding-left: 8px; }
/* Abre a terceira parte do relatório por especialidade: marca a virada de foco para complemento. */
h2.complemento { font-size: 14pt; border-left: none; padding: 14px 0 0; margin-top: 26px; border-top: 2px solid #DCE2EE; color: #4A5C7A; page-break-before: always; }
p { margin: 4px 0; }
ul { margin: 4px 0; padding-left: 18px; }
table { width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 6px 0; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #DCE2EE; vertical-align: top; }
th { background: #E9EDF5; font-weight: 600; }
tbody tr:nth-child(even) td { background: #F5F7FB; }
.barras { margin: 6px 0; }
.barra { display: flex; align-items: center; gap: 8px; font-size: 9pt; margin: 2px 0; }
.barra .rotulo { width: 70px; color: #4A5C7A; }
.barra .trilho { flex: 1; height: 8px; background: #E9EDF5; border-radius: 4px; overflow: hidden; }
.barra .preenchido { display: block; height: 100%; background: #5B8DB8; }
.barra .valor { width: 60px; text-align: right; }
.chip { display: inline-block; border-radius: 12px; padding: 2px 10px; font-size: 9.5pt; font-weight: 600; }
footer { margin-top: 24px; border-top: 1px solid #DCE2EE; padding-top: 8px; font-size: 8.5pt; color: #4A5C7A; }
footer p { margin: 3px 0; }
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
}

function dataBr(iso: string | null): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}

export function htmlRelatorio(e: EntradaHtml): string {
  const ressalvas = ressalvasPara(e.tipo);
  const dt = new Date(e.geradoEm);
  const geradoEm = `${dataBr(e.geradoEm)} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escapar(e.titulo)}</title><style>${CSS}</style></head><body>
<header><div><div class="marca">NERO</div><h1>${escapar(e.titulo)}</h1><div class="meta">${escapar(e.paciente.nome)}${e.paciente.nascimento ? ` · nascimento ${dataBr(e.paciente.nascimento)}` : ''}<br>Período das medidas: ${escapar(e.periodo.rotulo)} (${dataBr(e.periodo.desde)} a ${dataBr(e.periodo.ate)})<br>Gerado em ${geradoEm}</div></div>${e.qrSvg ? `<div class="qr">${e.qrSvg}</div>` : ''}</header>
${e.secoes.map((s) => `${s.abreComplemento ? `<h2 class="complemento">${escapar(TITULO_COMPLEMENTO)}</h2>` : ''}<section><h2>${escapar(s.titulo)}</h2>${s.blocos.map(bloco).join('')}</section>`).join('\n')}
<footer>${ressalvas.map((r) => `<p>${escapar(r)}</p>`).join('')}<p>Gerado pelo NERO em ${geradoEm} · dados registrados pelo paciente.${e.validadeQr ? ` O código QR dá acesso a este PDF até ${escapar(e.validadeQr)}.` : ''}</p></footer>
</body></html>`;
}
