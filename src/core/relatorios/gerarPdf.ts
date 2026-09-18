import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ErroNero } from '@core/supabase/erros';

/** Gera o PDF no aparelho (D-007: nada sai do celular aqui). Devolve o URI local. */
export async function gerarPdf(html: string): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });
  return uri;
}

/** Folha de compartilhamento do sistema (WhatsApp, e-mail, Arquivos…). */
export async function compartilharArquivo(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new ErroNero('Este aparelho não permite compartilhar arquivos.', null);
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartilhar relatório' });
}
