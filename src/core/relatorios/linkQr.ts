/**
 * Link do QR (D-067): o código abre a página `/r/` do site, que busca o JSON do relatório no Storage e mostra o
 * relatório inteiro com o botão "Baixar PDF". O caminho e o token da URL assinada do JSON vão DEPOIS do `#`: o
 * fragmento não é enviado a servidor nenhum (nem ao do site), só o navegador do médico o lê.
 *
 * O token leva só a URL do JSON; o JSON leva a URL assinada do PDF (`pdfUrl`) e o HTML pronto. As duas valem
 * 7 dias, e revogar apaga os dois arquivos.
 */
export const ENDERECO_PAGINA_QR = 'https://nerosaude.com.br/r/';

/** O que vai no JSON ao lado do PDF, no bucket `relatorios`. Nada além do relatório gerado. */
export interface ConteudoQr { versao: 1; titulo: string; geradoEm: string; expiraEm: string; html: string; pdfUrl: string }

/** `u/x.pdf` → `u/x.json` (mesmo nome, ao lado do PDF). */
export function caminhoJson(caminhoPdf: string): string {
  return caminhoPdf.replace(/\.pdf$/, '.json');
}

const URL_ASSINADA = /\/storage\/v1\/object\/sign\/relatorios\/([^?#]+)\?(?:[^#]*&)?token=([^&#]+)/;

/** Link da página a partir da URL assinada do JSON. Lança se a URL não for uma assinatura do bucket `relatorios`. */
export function linkDaPagina(urlAssinadaJson: string): string {
  const m = URL_ASSINADA.exec(urlAssinadaJson);
  if (!m) throw new Error('URL assinada do relatório inválida.');
  return `${ENDERECO_PAGINA_QR}#c=${m[1]}&t=${m[2]}`;
}
