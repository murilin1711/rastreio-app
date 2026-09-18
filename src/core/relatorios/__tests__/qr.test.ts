import { qrSvg } from '../qr';

test('qrSvg devolve SVG com o tamanho pedido para uma URL assinada longa', async () => {
  const url = 'https://ycljqpwpeoonqisqdrws.supabase.co/storage/v1/object/sign/relatorios/u/x.pdf?token=' + 'a'.repeat(140);
  const svg = await qrSvg(url, 200);
  expect(svg.startsWith('<svg width="200" height="200"')).toBe(true);
  expect(svg).toContain('<path');
});
