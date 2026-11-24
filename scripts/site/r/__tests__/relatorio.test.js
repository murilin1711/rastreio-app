import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RE_CAMINHO_QR, RE_TOKEN_QR } from '../../../../src/core/relatorios/linkQr';
import { RE_CAMINHO, RE_TOKEN, estadoDaResposta, htmlDoIframe, lerHash, urlDoJson } from '../relatorio';
const UID = '00000000-0000-0000-0000-00000000003a';
const SB = 'https://abc.supabase.co';
const PDF = `${SB}/storage/v1/object/sign/relatorios/${UID}/x.pdf?token=t`;
test('lê o link gerado pelo app (mesmo literal de linkQr.test.ts)', () =>
  expect(lerHash(`#c=${UID}/mabc-1x2y.json&t=eyJ.a.b`)).toEqual({ caminho: `${UID}/mabc-1x2y.json`, token: 'eyJ.a.b' }));
test.each([['#c=../x.json&t=a'], [`#c=${UID}/x.pdf&t=a`], [`#c=${UID}/x.json`], ['#c=https://mal.com/x.json&t=a'], [''], [`#c=${UID}/x.json&t=a b`],
  [`#c=${UID}/x.json&t=a&h=https://mal.com`], [`#t=a&c=${UID}/x.json`], [`#c=${UID}/x.json&t=a%2Fb`], [undefined]])('recusa %s', (h) => expect(lerHash(h)).toBeNull());
test('regras do link: as mesmas de src/core/relatorios/linkQr.ts (fonte única)', () => {
  expect(RE_CAMINHO.source).toBe(RE_CAMINHO_QR.source);
  expect(RE_CAMINHO.flags).toBe(RE_CAMINHO_QR.flags);
  expect(RE_TOKEN.source).toBe(RE_TOKEN_QR.source);
  expect(RE_TOKEN.flags).toBe(RE_TOKEN_QR.flags);
});
test('busca só no Supabase do projeto', () => expect(urlDoJson(SB, { caminho: `${UID}/x.json`, token: 't' })).toBe(`${SB}/storage/v1/object/sign/relatorios/${UID}/x.json?token=t`));
test('revogado (404) ou vencido (400): indisponível', () => { expect(estadoDaResposta(404, null, SB)).toBe('indisponivel'); expect(estadoDaResposta(400, { error: 'InvalidJWT' }, SB)).toBe('indisponivel'); });
test('JSON ainda preparando ou com pdfUrl de fora: indisponível', () => {
  expect(estadoDaResposta(200, { versao: 1, preparando: true }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: 'https://mal.com/x.pdf' }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: PDF }, SB)).toBe('ok');
});
test('pdfUrl só no formato estrito e, com o caminho do JSON, do mesmo relatório', () => {
  const base = `${SB}/storage/v1/object/sign/relatorios/`;
  for (const pdfUrl of [`${base}../x.pdf?token=t`, `${base}${UID}/x.pdf?token=t&download=https://mal.com`, `${base}${UID}/x.json?token=t`,
    `${SB}.mal.com/storage/v1/object/sign/relatorios/${UID}/x.pdf?token=t`, `${base}${UID}/x.pdf`, 42])
    expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: PDF }, SB, `${UID}/x.json`)).toBe('ok');
  expect(estadoDaResposta(200, { versao: 1, html: '<p/>', pdfUrl: PDF }, SB, `${UID}/outro.json`)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 2, html: '<p/>', pdfUrl: PDF }, SB)).toBe('indisponivel');
  expect(estadoDaResposta(200, { versao: 1, html: 7, pdfUrl: PDF }, SB)).toBe('indisponivel');
});
test('links do relatório abrem em aba nova', () => {
  expect(htmlDoIframe('<html><head><title>x</title></head></html>')).toBe('<html><head><base target="_blank"><title>x</title></head></html>');
  expect(htmlDoIframe('<p>sem head</p>')).toBe('<base target="_blank"><p>sem head</p>');
});
test('página sem rastros: noindex, sem scripts de fora, sem armazenamento, iframe sem scripts', () => {
  const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
  const js = readFileSync(join(__dirname, '..', 'relatorio.js'), 'utf8');
  expect(html).toContain('<meta name="robots" content="noindex, nofollow">');
  expect(html).toContain('<meta name="referrer" content="no-referrer">');
  expect(html).toContain("default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src __SUPABASE_URL__; img-src data:; base-uri 'none'; form-action 'none'");
  expect(html).not.toMatch(/<script[^>]+src="https?:/);
  expect(html.match(/<script\b[^>]*>/g)).toEqual(['<script type="module" src="relatorio.js" data-supabase="__SUPABASE_URL__">']);
  expect(js).not.toMatch(/localStorage|sessionStorage|indexedDB|document\.cookie/);
  expect(js).toContain('sandbox');
  expect(js).not.toContain('allow-scripts');
  expect(js).toContain('replaceState');
  expect(js).toContain('Este relatório não está mais disponível.');
});
test('gerar-site recusa gerar /r/ com o Supabase local', () => {
  for (const url of ['http://127.0.0.1:54321', 'http://localhost:54321', 'https://abc.supabase.co.mal.com']) {
    const r = spawnSync(process.execPath, [join(__dirname, '..', '..', '..', 'gerar-site.mjs')], { env: { ...process.env, EXPO_PUBLIC_SUPABASE_URL: url }, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('EXPO_PUBLIC_SUPABASE_URL');
  }
});
