import { Platform } from 'react-native';
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

/**
 * Só no iOS a barra flutua sobre o conteúdo. No Android a barra do Material fica abaixo do conteúdo, que
 * já termina em cima dela (e ela mesma cuida da área segura): somar barra e área segura de novo deixava o
 * círculo "Anotar" a quase um terço da tela (relato do Murilo no teste interno do 1.1.0, 24/11/2026).
 */
export const barraSobreConteudo = (): boolean => Platform.OS === 'ios';

/** Distância do círculo "Anotar" até o fim da área do conteúdo. */
export function distanciaBotaoAnotar(areaSeguraBaixo: number): number {
  return barraSobreConteudo() ? ALTURA_BARRA + FOLGA_BOTAO_ANOTAR + areaSeguraBaixo : FOLGA_BOTAO_ANOTAR;
}

/** Espaço no fim da rolagem de uma tela de aba: tudo o que fica abaixo do topo do círculo "Anotar", mais uma folga. */
export function useEspacoAbas(): number {
  return distanciaBotaoAnotar(useSafeAreaInsets().bottom) + TAMANHO_BOTAO_ANOTAR + FOLGA;
}
