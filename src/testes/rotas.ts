/** Auxiliar compartilhado: confere se uma rota do expo-router tem tela em `app/` — rota errada só apareceria no aparelho. */
import { existsSync } from 'fs';
import { join } from 'path';

const RAIZ = join(__dirname, '../../app');

/** A rota (com ou sem `?query`) corresponde a `app/<rota>.tsx` ou `app/<rota>/index.tsx`. */
export function existe(rota: string): boolean {
  const caminho = rota.split('?')[0].replace(/^\//, '');
  return ['.tsx', '/index.tsx'].some((fim) => existsSync(join(RAIZ, caminho + fim)));
}
