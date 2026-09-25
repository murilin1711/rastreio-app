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
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO_SITE = 'https://github.com/murilin1711/nerosaude-site.git';

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
<footer>NERO · Goiânia/GO · <a href="mailto:nerosaude@gmail.com">nerosaude@gmail.com</a></footer>
</main>
</body>
</html>
`;

const md = readFileSync(join(RAIZ, 'docs/nero/publicacao/politica-de-privacidade.md'), 'utf8');
if (md.includes('[[')) {
  console.error('A política ainda tem campos entre [[ ]]. Preencha antes de gerar o site.');
  process.exit(1);
}

mkdirSync(join(RAIZ, 'site/privacidade'), { recursive: true });
writeFileSync(
  join(RAIZ, 'site/privacidade/index.html'),
  pagina('Política de Privacidade — NERO', 'Como o aplicativo NERO trata os seus dados de saúde.', paraHtml(md)),
);
writeFileSync(
  join(RAIZ, 'site/index.html'),
  '<!doctype html><html lang="pt-BR"><meta charset="utf-8">' +
  '<meta http-equiv="refresh" content="0; url=/privacidade">' +
  '<title>NERO</title><p><a href="/privacidade">Política de Privacidade do NERO</a></p></html>\n',
);
console.log('site/ gerado a partir da política.');

if (!process.argv.includes('--publicar')) process.exit(0);

// Publicação: clone raso, troca os arquivos, commita se algo mudou.
const tmp = mkdtempSync(join(tmpdir(), 'nerosaude-site-'));
try {
  execFileSync('git', ['clone', '--depth', '1', REPO_SITE, tmp], { stdio: 'inherit' });
  cpSync(join(RAIZ, 'site/index.html'), join(tmp, 'index.html'));
  cpSync(join(RAIZ, 'site/privacidade'), join(tmp, 'privacidade'), { recursive: true });
  const mudou = execFileSync('git', ['status', '--porcelain'], { cwd: tmp }).toString().trim();
  if (!mudou) { console.log('Nada mudou desde a última publicação.'); process.exit(0); }
  execFileSync('git', ['add', '-A'], { cwd: tmp });
  execFileSync('git', ['commit', '-m', 'Atualiza a política de privacidade\n\nGerado por scripts/gerar-site.mjs a partir do Markdown do aplicativo.'], { cwd: tmp, stdio: 'inherit' });
  execFileSync('git', ['push'], { cwd: tmp, stdio: 'inherit' });
  console.log('Publicado. A Hostinger republica sozinha em alguns instantes.');
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
