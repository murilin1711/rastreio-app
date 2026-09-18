import QRCode from 'qrcode';

/** QR em SVG puro (sem módulo nativo), para embutir no HTML do PDF e na tela via SvgXml. */
export async function qrSvg(texto: string, tamanho = 200): Promise<string> {
  const svg = await QRCode.toString(texto, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 });
  return svg.replace('<svg ', `<svg width="${tamanho}" height="${tamanho}" `);
}
