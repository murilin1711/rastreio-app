import type { ProgramaHandlers } from '../tipos';
import { colo } from './colo';
import { colorretal } from './colorretal';
import { mama } from './mama';

/** Handlers por programa. Pulmão e próstata entram na Task 6 da Fase 1. */
export const handlers: ProgramaHandlers = { mama, colo_utero: colo, colorretal };
