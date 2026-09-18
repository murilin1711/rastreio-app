import { Alert } from 'react-native';
import { comprimirImagem, escolherImagem, escolherPdf, type ArquivoEscolhido } from '@core/documentos/storage';

/** Folha com as três origens (D-008). Resolve null se o usuário cancelar. */
export function escolherArquivo(): Promise<ArquivoEscolhido | null> {
  return new Promise((resolve, reject) => {
    const pegar = async (fn: () => Promise<ArquivoEscolhido | null>) => {
      try {
        const a = await fn();
        resolve(a ? await comprimirImagem(a) : null);
      } catch (e) {
        reject(e);
      }
    };
    Alert.alert('Adicionar documento', 'De onde vem o arquivo?', [
      { text: 'Tirar foto', onPress: () => pegar(() => escolherImagem('camera')) },
      { text: 'Escolher da galeria', onPress: () => pegar(() => escolherImagem('galeria')) },
      { text: 'Arquivo PDF', onPress: () => pegar(escolherPdf) },
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
}
