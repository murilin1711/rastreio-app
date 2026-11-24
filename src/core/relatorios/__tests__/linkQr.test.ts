/** Link do QR (D-067): página /r/ com o caminho e o token da URL assinada do JSON depois do `#`. */
import { caminhoJson, linkDaPagina, partesValidas } from '../linkQr';

const UID = '00000000-0000-0000-0000-00000000003a';
test('link da página leva caminho e token no fragmento', () =>
  expect(linkDaPagina(`https://abc.supabase.co/storage/v1/object/sign/relatorios/${UID}/mabc-1x2y.json?token=eyJ.a.b`))
    .toBe(`https://nerosaude.com.br/r/#c=${UID}/mabc-1x2y.json&t=eyJ.a.b`));
test('recusa URL de outro bucket', () => expect(() => linkDaPagina('https://abc.supabase.co/storage/v1/object/sign/laudos/x.json?token=t')).toThrow());
test('recusa URL sem token', () => expect(() => linkDaPagina(`https://abc.supabase.co/storage/v1/object/sign/relatorios/${UID}/x.json`)).toThrow());
test('caminhoJson', () => expect(caminhoJson(`${UID}/x.pdf`)).toBe(`${UID}/x.json`));
const base = 'https://abc.supabase.co/storage/v1/object/sign/relatorios/';
test.each([
  ['caminho com ../', `${base}${UID}/../outro/x.json?token=t`],
  ['barra extra no caminho', `${base}${UID}/a/x.json?token=t`],
  ['caractere inválido no nome', `${base}${UID}/x%2F.json?token=t`],
  ['nome em maiúsculas', `${base}${UID}/X.json?token=t`],
  ['não é .json', `${base}${UID}/x.pdf?token=t`],
  ['usuário que não é UUID', `${base}u/x.json?token=t`],
  ['token com &', `${base}${UID}/x.json?token=a&b=c`],
  ['token com caractere inválido', `${base}${UID}/x.json?token=a%20b`],
  ['token vazio', `${base}${UID}/x.json?token=`],
])('recusa %s', (_n, url) => expect(() => linkDaPagina(url)).toThrow());
test('confere o caminho esperado', () => {
  expect(linkDaPagina(`${base}${UID}/x.json?token=t`, `${UID}/x.json`)).toBe(`https://nerosaude.com.br/r/#c=${UID}/x.json&t=t`);
  expect(() => linkDaPagina(`${base}${UID}/x.json?token=t`, `${UID}/y.json`)).toThrow();
});
test('partesValidas (a mesma regra da página /r/)', () => {
  expect(partesValidas(`${UID}/mabc-1x2y.json`, 'eyJ.a_b-c')).toBe(true);
  expect(partesValidas(`${UID}/../x.json`, 't')).toBe(false);
  expect(partesValidas(`${UID}/x.json`, 'a&b')).toBe(false);
  expect(partesValidas(`${UID}/x.json`, 'a/b')).toBe(false);
});
