import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@ui/theme';

/**
 * Altura da barra de abas flutuante do iOS 26. A barra do `NativeTabs` fica sobre o conteúdo e o
 * sistema não desconta esse espaço do scroll, então as telas das quatro abas somam o espaço de
 * `useEspacoAbas` ao `paddingBottom` (D-027). O círculo "Anotar" também fica sobre a rolagem nas
 * mesmas quatro telas, logo acima da barra, e o fim da rolagem precisa deixar lugar para ele.
 */
export const ALTURA_BARRA = 58;
export const TAMANHO_BOTAO_ANOTAR = 64;
export const FOLGA_BOTAO_ANOTAR = Spacing.md;
const FOLGA = Spacing.xxl;

/** Espaço no fim da rolagem de uma tela de aba: barra + círculo "Anotar" + folga + área segura do aparelho. */
export function useEspacoAbas(): number {
  return ALTURA_BARRA + FOLGA_BOTAO_ANOTAR + TAMANHO_BOTAO_ANOTAR + FOLGA + useSafeAreaInsets().bottom;
}
