import type { ProgramaHandlers } from '../tipos';
import { colo } from './colo';
import { colorretal } from './colorretal';
import { mama } from './mama';
import { prostata } from './prostata';
import { pulmao } from './pulmao';

/** Handlers por programa — árvores de decisão do Rastreando (Fase 1). */
export const handlers: ProgramaHandlers = { mama, colo_utero: colo, colorretal, pulmao, prostata };
