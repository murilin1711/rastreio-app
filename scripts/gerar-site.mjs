#!/usr/bin/env node
/**
 * Gera o site público a partir dos documentos deste repositório.
 *
 * Por que existe: a política de privacidade vale juridicamente, e ter duas versões dela (o Markdown
 * aqui e um HTML editado à mão lá) é pedir para divergirem. A fonte é sempre o Markdown; o HTML é
 * derivado, em `site/`, e de lá vai para o repositório `nerosaude-site`, que a Hostinger publica.
 *
 *   node scripts/gerar-site.mjs            gera em site/
 *   node scripts/gerar-site.mjs --publicar  gera e envia para o repositório do site
 *
 * A página do QR (`/r/`, fonte em scripts/site/r/) recebe o endereço do Supabase do projeto no build: ela só lê
 * relatórios desse host. Sem o endereço remoto (ou com o Supabase local), nada é gerado.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_SITE = 'https://github.com/murilin1711/nerosaude-site.git';

/** EXPO_PUBLIC_SUPABASE_URL do ambiente, ou de `.env.local`, ou de `.env` (o mesmo endereço que o app usa). */
function lerSupabaseUrl() {
  if (process.env.EXPO_PUBLIC_SUPABASE_URL) return process.env.EXPO_PUBLIC_SUPABASE_URL.trim();
  for (const arquivo of ['.env.local', '.env']) {
    const caminho = join(RAIZ, arquivo);
    if (!existsSync(caminho)) continue;
    const linha = readFileSync(caminho, 'utf8').split('\n').find((l) => l.startsWith('EXPO_PUBLIC_SUPABASE_URL='));
    if (linha) return linha.slice('EXPO_PUBLIC_SUPABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

// Antes de escrever qualquer arquivo: a página /r/ só pode sair com o Supabase remoto do projeto.
const SUPABASE_URL = lerSupabaseUrl();
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/.test(SUPABASE_URL)) {
  console.error(
    `EXPO_PUBLIC_SUPABASE_URL ausente ou fora do formato https://<projeto>.supabase.co (lido: "${SUPABASE_URL}").\n` +
    'A página do QR (/r/) não pode ser gerada com o Supabase local nem com outro host.',
  );
  process.exit(1);
}

const escapar = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Markdown restrito ao que a política usa: títulos, listas, negrito, código e links. */
function paraHtml(md) {
  const inline = (t) =>
    escapar(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
      .replace(/(?<!["'>])(https?:\/\/[^\s<),]+)/g, '<a href="$1">$1</a>');

  const saida = [];
  let lista = false;
  // Linhas iniciadas por '>' são nota interna para a equipe, não vão para a página.
  for (const bruta of md.split('\n').filter((l) => !l.startsWith('>'))) {
    const l = bruta.trimEnd();
    if (!l.trim()) { if (lista) { saida.push('</ul>'); lista = false; } continue; }
    if (l.startsWith('### ')) { saida.push(`<h3>${inline(l.slice(4))}</h3>`); continue; }
    if (l.startsWith('## '))  { saida.push(`<h2>${inline(l.slice(3))}</h2>`); continue; }
    if (l.startsWith('# '))   { saida.push(`<h1>${inline(l.slice(2))}</h1>`); continue; }
    if (l.trim() === '---')   { saida.push('<hr>'); continue; }
    if (l.startsWith('- ')) {
      if (!lista) { saida.push('<ul>'); lista = true; }
      saida.push(`<li>${inline(l.slice(2))}</li>`);
      continue;
    }
    if (lista) { saida.push('</ul>'); lista = false; }
    saida.push(`<p>${inline(l)}</p>`);
  }
  if (lista) saida.push('</ul>');
  return saida.join('\n');
}

const pagina = (titulo, descricao, corpo) => `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapar(titulo)}</title>
<meta name="description" content="${escapar(descricao)}">
<style>
  :root { --marinho:#0f2d63; --grafite:#4A5C7A; --borda:#DCE2EE; --fundo:#F5F7FB; }
  * { box-sizing:border-box }
  body { margin:0; background:var(--fundo); color:#1D2E45;
         font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
  main { max-width:720px; margin:0 auto; padding:40px 22px 80px; }
  h1 { font-size:28px; line-height:1.25; color:var(--marinho); margin:0 0 6px }
  h2 { font-size:19px; color:var(--marinho); margin:34px 0 10px; padding-top:18px; border-top:1px solid var(--borda) }
  h3 { font-size:15px; color:var(--grafite); margin:24px 0 8px; text-transform:uppercase; letter-spacing:.6px }
  p, li { color:#25324a }
  ul { padding-left:20px } li { margin:5px 0 }
  a { color:#1a5fb4 }
  code { background:#E9EDF5; padding:1px 5px; border-radius:4px; font-size:14px }
  hr { border:none; border-top:1px solid var(--borda); margin:34px 0 }
  footer { margin-top:44px; padding-top:18px; border-top:1px solid var(--borda); color:var(--grafite); font-size:14px }
  @media (prefers-color-scheme: dark) {
    :root { --fundo:#10141f; --borda:#2a3346; }
    body { color:#dfe6f2 } p, li { color:#c8d3e6 }
    h1, h2 { color:#9fc6ff } code { background:#1d2434 } a { color:#7fb4ff }
  }
</style>
</head>
<body>
<main>
${corpo}
<footer>NERO · Goiânia/GO · <a href="mailto:nerosaudeapp@gmail.com">nerosaudeapp@gmail.com</a></footer>
</main>
</body>
</html>
`;

/** Cada documento vira `site/<pasta>/index.html`, para a URL funcionar sem `.html`. */
const PAGINAS = [
  { fonte: 'politica-de-privacidade.md', pasta: 'privacidade', titulo: 'Política de Privacidade — NERO', descricao: 'Como o aplicativo NERO trata os seus dados de saúde.' },
  { fonte: 'termos-de-uso.md', pasta: 'termos', titulo: 'Termos de Uso — NERO', descricao: 'As regras de uso do aplicativo NERO.' },
];

for (const p of PAGINAS) {
  const md = readFileSync(join(RAIZ, 'docs/nero/publicacao', p.fonte), 'utf8');
  if (md.includes('[[')) {
    console.error(`${p.fonte} ainda tem campos entre [[ ]]. Preencha antes de gerar o site.`);
    process.exit(1);
  }
  mkdirSync(join(RAIZ, 'site', p.pasta), { recursive: true });
  writeFileSync(join(RAIZ, 'site', p.pasta, 'index.html'), pagina(p.titulo, p.descricao, paraHtml(md)));
}
writeFileSync(
  join(RAIZ, 'site/index.html'),
  '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
  '<meta http-equiv="refresh" content="0; url=/privacidade">' +
  '<title>NERO</title><p><a href="/privacidade">Política de Privacidade do NERO</a> · <a href="/termos">Termos de Uso</a></p></html>\n',
);

// Página do QR: copia as fontes trocando o marcador pelo endereço do projeto.
mkdirSync(join(RAIZ, 'site/r'), { recursive: true });
for (const arquivo of ['index.html', 'relatorio.js']) {
  const conteudo = readFileSync(join(RAIZ, 'scripts/site/r', arquivo), 'utf8').replaceAll('__SUPABASE_URL__', SUPABASE_URL);
  if (conteudo.includes('__SUPABASE_URL__')) {
    console.error(`site/r/${arquivo} ainda tem __SUPABASE_URL__.`);
    process.exit(1);
  }
  writeFileSync(join(RAIZ, 'site/r', arquivo), conteudo);
}
console.log('site/ gerado a partir da política, dos termos e da página do QR.');

if (!process.argv.includes('--publicar')) process.exit(0);

// Publicação: clone raso, troca os arquivos, commita se algo mudou.
const tmp = mkdtempSync(join(tmpdir(), 'nerosaude-site-'));
try {
  execFileSync('git', ['clone', '--depth', '1', REPO_SITE, tmp], { stdio: 'inherit' });
  cpSync(join(RAIZ, 'site/index.html'), join(tmp, 'index.html'));
  for (const p of PAGINAS) cpSync(join(RAIZ, 'site', p.pasta), join(tmp, p.pasta), { recursive: true });
  cpSync(join(RAIZ, 'site/r'), join(tmp, 'r'), { recursive: true });
  const mudou = execFileSync('git', ['status', '--porcelain'], { cwd: tmp }).toString().trim();
  if (!mudou) { console.log('Nada mudou desde a última publicação.'); process.exit(0); }
  execFileSync('git', ['add', '-A'], { cwd: tmp });
  execFileSync('git', ['commit', '-m', 'Atualiza o site (política, termos e página do QR)\n\nGerado por scripts/gerar-site.mjs a partir do Markdown do aplicativo.'], { cwd: tmp, stdio: 'inherit' });
  execFileSync('git', ['push'], { cwd: tmp, stdio: 'inherit' });
  console.log('Publicado. A Hostinger republica sozinha em alguns instantes.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
