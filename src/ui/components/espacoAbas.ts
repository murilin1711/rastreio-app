import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing } from '@ui/theme';

/**
 * Altura da barra de abas flutuante do iOS 26 mais a folga até o último elemento. A barra do
 * `NativeTabs` fica sobre o conteúdo e o sistema não desconta esse espaço do scroll, então as telas
 * das quatro abas somam isto ao `paddingBottom` para o último card não ficar embaixo dela (D-027).
 */
const ALTURA_BARRA = 58;
const FOLGA = Spacing.xxl;

/** Espaço no fim da rolagem de uma tela de aba: barra + folga + área segura do aparelho. */
export function useEspacoAbas(): number {
  return ALTURA_BARRA + FOLGA + useSafeAreaInsets().bottom;
}
