// Envia a ficha da loja (docs/nero/publicacao/ficha-da-loja.md) e as imagens ao Google Play.
// Uso: node scripts/play-ficha.mjs
import { readFileSync, existsSync } from 'node:fs';
import { token, api } from './play-api.mjs';

const LINGUA = 'pt-BR';
const md = readFileSync(new URL('../docs/nero/publicacao/ficha-da-loja.md', import.meta.url), 'utf8');
const secao = (titulo) => md.split(`## ${titulo}\n`)[1].split('\n## ')[0].trim();
const ficha = { language: LINGUA, title: secao('Nome (30)'), shortDescription: secao('Descrição curta (80)'), fullDescription: secao('Descrição completa (4000)') };

const IMAGENS = [
  ['icon', ['assets/images/loja/icone-play-512.png']],
  ['featureGraphic', ['assets/images/loja/destaque-play-1024x500.png']],
  ['phoneScreenshots', [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `assets/images/loja/captura-${n}.png`)],
];

const tk = await token();
const { id } = await api(tk, 'POST', '/edits', {});
try {
  await api(tk, 'PATCH', `/edits/${id}/details`, { defaultLanguage: LINGUA, contactEmail: 'contato@nerosaude.com.br', contactWebsite: 'https://nerosaude.com.br' });
  await api(tk, 'PUT', `/edits/${id}/listings/${LINGUA}`, ficha);
  console.log(`ficha: título ${ficha.title.length}, curta ${ficha.shortDescription.length}, completa ${ficha.fullDescription.length} caracteres`);
  for (const [tipo, arquivos] of IMAGENS) {
    const existentes = arquivos.filter((a) => existsSync(a));
    if (!existentes.length) { console.log(`${tipo}: nenhum arquivo, pulado`); continue; }
    await api(tk, 'DELETE', `/edits/${id}/listings/${LINGUA}/${tipo}`);
    for (const a of existentes) await api(tk, 'POST', `/edits/${id}/listings/${LINGUA}/${tipo}`, readFileSync(a), { upload: true, tipo: 'image/png' });
    console.log(`${tipo}: ${existentes.length} enviado(s)`);
  }
  await api(tk, 'POST', `/edits/${id}:commit`);
  console.log('edição confirmada');
} catch (e) {
  await api(tk, 'DELETE', `/edits/${id}`).catch(() => {});
  throw e;
}
