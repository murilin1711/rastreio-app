import type { Programa } from '@core/regras/tipos';
import { colo_utero } from './colo_utero';
import { colorretal } from './colorretal';
import { mama } from './mama';
import { prostata } from './prostata';
import { pulmao } from './pulmao';
import type { ConteudoPrograma } from './tipos';

export type { ConteudoPrograma, SinalAlerta } from './tipos';
export const CONTEUDO: Record<Programa, ConteudoPrograma> = { mama, colo_utero, colorretal, pulmao, prostata };
