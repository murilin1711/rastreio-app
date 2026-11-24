/** Link do QR (D-067): página /r/ com o caminho e o token da URL assinada do JSON depois do `#`. */
import { caminhoJson, linkDaPagina } from '../linkQr';

const UID = '00000000-0000-0000-0000-00000000003a';
test('link da página leva caminho e token no fragmento', () =>
  expect(linkDaPagina(`https://abc.supabase.co/storage/v1/object/sign/relatorios/${UID}/mabc-1x2y.json?token=eyJ.a.b`))
    .toBe(`https://nerosaude.com.br/r/#c=${UID}/mabc-1x2y.json&t=eyJ.a.b`));
test('recusa URL de outro bucket', () => expect(() => linkDaPagina('https://abc.supabase.co/storage/v1/object/sign/laudos/x.json?token=t')).toThrow());
test('recusa URL sem token', () => expect(() => linkDaPagina(`https://abc.supabase.co/storage/v1/object/sign/relatorios/${UID}/x.json`)).toThrow());
test('caminhoJson', () => expect(caminhoJson(`${UID}/x.pdf`)).toBe(`${UID}/x.json`));
