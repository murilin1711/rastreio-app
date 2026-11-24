import { abaDe, comVolta } from '@core/navegacao/voltarPara';

type Href = string | { pathname: string; params?: Record<string, unknown> };

/**
 * Como abrir um item da folha Anotar (spec §6.2).
 * Rota de módulo empilha sobre a folha: o `router.back()` de quem salva volta para a folha.
 * Rota de aba fecha a folha antes e leva `voltarPara`: ao salvar, a pessoa volta para onde estava
 * antes de tocar no ＋ (D-054).
 */
export function abrirDaFolha(rota: string, origem: string): { fecharAntes: boolean; href: Href } {
  if (abaDe(rota) === null) return { fecharAntes: false, href: rota };
  return { fecharAntes: true, href: comVolta(rota, origem) };
}
