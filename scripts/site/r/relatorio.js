/**
 * Página do QR (nerosaude.com.br/r/, D-067). O QR do relatório leva `#c=<caminho do JSON>&t=<token>`: o fragmento não
 * vai a servidor nenhum. Esta página lê o fragmento, apaga-o da barra de endereço, busca o JSON assinado SÓ no
 * Supabase do projeto (o endereço vem do build, nunca do link) e mostra o HTML pronto num iframe isolado, sem
 * permissão de rodar código. Nada é guardado no navegador.
 *
 * Sem dependências: scripts/gerar-site.mjs copia este arquivo para site/r/ e põe o endereço do Supabase do projeto
 * no index.html (atributo data-supabase da tag <script>).
 */

/** As mesmas regras de src/core/relatorios/linkQr.ts (RE_CAMINHO_QR, RE_TOKEN_QR); um teste confere que coincidem. */
export const RE_CAMINHO = /^[0-9a-f-]{36}\/[a-z0-9-]+\.json$/;
export const RE_TOKEN = /^[A-Za-z0-9._-]+$/;

const PREFIXO_ASSINADO = '/storage/v1/object/sign/relatorios/';

/** '#c=<uuid>/<arquivo>.json&t=<jwt>' → { caminho, token }; qualquer outra forma → null. */
export function lerHash(hash) {
  if (typeof hash !== 'string') return null;
  const m = /^#c=([^&]*)&t=([^&]*)$/.exec(hash);
  if (!m || !RE_CAMINHO.test(m[1]) || !RE_TOKEN.test(m[2])) return null;
  return { caminho: m[1], token: m[2] };
}

/** URL assinada do JSON, sempre no host do projeto. `caminho` e `token` já passaram pelas regras estritas. */
export function urlDoJson(supabaseUrl, { caminho, token }) {
  return `${supabaseUrl}${PREFIXO_ASSINADO}${caminho}?token=${token}`;
}

/** O PDF tem de ser uma URL assinada do mesmo bucket e host, no formato estrito (e do mesmo relatório, se informado). */
function pdfValido(pdfUrl, supabaseUrl, caminhoJson) {
  if (typeof pdfUrl !== 'string') return false;
  const prefixo = `${supabaseUrl}${PREFIXO_ASSINADO}`;
  if (!pdfUrl.startsWith(prefixo)) return false;
  const m = /^([^?#]+)\?token=([^&#]*)$/.exec(pdfUrl.slice(prefixo.length));
  if (!m || !RE_TOKEN.test(m[2])) return false;
  const caminhoPdf = m[1];
  if (!RE_CAMINHO.test(caminhoPdf.replace(/\.pdf$/, '.json')) || !caminhoPdf.endsWith('.pdf')) return false;
  return caminhoJson === undefined || caminhoPdf === caminhoJson.replace(/\.json$/, '.pdf');
}

/** 'ok' só com o relatório final e o PDF no Supabase do projeto; revogado, vencido, provisório ou estranho → 'indisponivel'. */
export function estadoDaResposta(status, corpo, supabaseUrl, caminhoJson) {
  if (status !== 200 || !corpo || typeof corpo !== 'object') return 'indisponivel';
  if (corpo.versao !== 1 || typeof corpo.html !== 'string') return 'indisponivel';
  return pdfValido(corpo.pdfUrl, supabaseUrl, caminhoJson) ? 'ok' : 'indisponivel';
}

/** Links do relatório (fontes) abrem em aba nova, fora do iframe. */
export function htmlDoIframe(html) {
  const base = '<base target="_blank">';
  return html.includes('<head>') ? html.replace('<head>', `<head>${base}`) : `${base}${html}`;
}

const TEXTOS = {
  carregando: 'Abrindo o relatório…',
  indisponivel: 'Este relatório não está mais disponível.',
  explicacao: 'O link vale por 7 dias e pode ser encerrado pelo paciente a qualquer momento.',
};

function mostrarIndisponivel(doc) {
  const aviso = doc.getElementById('aviso');
  aviso.textContent = '';
  const titulo = doc.createElement('p');
  titulo.className = 'aviso-titulo';
  titulo.textContent = TEXTOS.indisponivel;
  const texto = doc.createElement('p');
  texto.textContent = TEXTOS.explicacao;
  aviso.append(titulo, texto);
  aviso.hidden = false;
  doc.getElementById('relatorio').hidden = true;
}

function mostrarRelatorio(doc, win, corpo) {
  doc.getElementById('aviso').hidden = true;
  if (typeof corpo.titulo === 'string' && corpo.titulo) doc.title = corpo.titulo;

  const baixar = doc.getElementById('baixar');
  baixar.href = corpo.pdfUrl;
  baixar.hidden = false;

  const iframe = doc.createElement('iframe');
  // Sem permissão de rodar código: o iframe só exibe. allow-same-origin deixa esta página medir a altura.
  iframe.setAttribute('sandbox', 'allow-same-origin allow-popups allow-popups-to-escape-sandbox');
  iframe.setAttribute('title', 'Relatório');
  iframe.setAttribute('referrerpolicy', 'no-referrer');
  const ajustar = () => {
    const d = iframe.contentDocument;
    if (!d || !d.documentElement) return;
    iframe.style.height = '0px';
    iframe.style.height = `${d.documentElement.scrollHeight}px`;
  };
  iframe.addEventListener('load', ajustar);
  win.addEventListener('resize', ajustar);
  iframe.srcdoc = htmlDoIframe(corpo.html);
  const area = doc.getElementById('relatorio');
  area.append(iframe);
  area.hidden = false;
}

/** Liga a página: lê e apaga o fragmento, busca o JSON e mostra o relatório ou o aviso. */
export async function iniciar(doc, win, supabaseUrl) {
  const partes = lerHash(win.location.hash);
  // O fragmento sai da barra de endereço e desta entrada do histórico da aba. O navegador pode ter guardado o link
  // inteiro no histórico global e no autocompletar: a proteção real é o prazo de 7 dias e o encerramento pelo app.
  if (win.location.hash) win.history.replaceState(null, '', win.location.pathname + win.location.search);
  if (!partes) { mostrarIndisponivel(doc); return; }

  doc.getElementById('aviso').textContent = TEXTOS.carregando;
  let status = 0;
  let corpo = null;
  try {
    const resposta = await win.fetch(urlDoJson(supabaseUrl, partes), { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' });
    status = resposta.status;
    if (resposta.ok) corpo = await resposta.json();
  } catch {
    status = 0;
  }
  if (estadoDaResposta(status, corpo, supabaseUrl, partes.caminho) === 'ok') mostrarRelatorio(doc, win, corpo);
  else mostrarIndisponivel(doc);
}

const tag = typeof document !== 'undefined' && document.querySelector('script[data-supabase]');
if (tag) iniciar(document, window, tag.dataset.supabase);
