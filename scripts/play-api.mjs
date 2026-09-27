// Cliente mínimo da Google Play Android Developer API, sem dependências.
// A chave da conta de serviço fica em credenciais/google-play.json (fora do Git).
import { readFileSync } from 'node:fs';
import { createSign } from 'node:crypto';
import { pathToFileURL } from 'node:url';

export const PACOTE = 'br.com.nerosaude.app';
const BASE = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACOTE}`;
const UPLOAD = `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PACOTE}`;

const b64url = (b) => Buffer.from(b).toString('base64url');

export async function token() {
  const chave = JSON.parse(readFileSync(new URL('../credenciais/google-play.json', import.meta.url)));
  const agora = Math.floor(Date.now() / 1000);
  const cab = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const corpo = b64url(JSON.stringify({
    iss: chave.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token', iat: agora, exp: agora + 3600,
  }));
  const assinatura = createSign('RSA-SHA256').update(`${cab}.${corpo}`).sign(chave.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${cab}.${corpo}.${assinatura}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(`token: ${JSON.stringify(j)}`);
  return j.access_token;
}

export async function api(tk, metodo, caminho, corpo, { upload = false, tipo = 'application/json' } = {}) {
  const r = await fetch(`${upload ? UPLOAD : BASE}${caminho}`, {
    method: metodo,
    headers: { authorization: `Bearer ${tk}`, ...(corpo !== undefined ? { 'content-type': tipo } : {}) },
    body: corpo === undefined ? undefined : (tipo === 'application/json' ? JSON.stringify(corpo) : corpo),
  });
  const texto = await r.text();
  if (!r.ok) throw new Error(`${metodo} ${caminho} → ${r.status}: ${texto}`);
  return texto ? JSON.parse(texto) : null;
}

// Uso direto: node scripts/play-api.mjs  → testa o acesso abrindo e descartando uma edição.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const tk = await token();
  const edicao = await api(tk, 'POST', '/edits', {});
  const detalhes = await api(tk, 'GET', `/edits/${edicao.id}/details`);
  console.log('acesso ok:', JSON.stringify(detalhes));
  await api(tk, 'DELETE', `/edits/${edicao.id}`);
}
