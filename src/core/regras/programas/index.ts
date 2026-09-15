import type { ProgramaHandlers } from '../tipos';
import { colo } from './colo';
import { mama } from './mama';

/** Handlers por programa. Colorretal, pulmão e próstata entram nas Tasks 5–6 da Fase 1. */
export const handlers: ProgramaHandlers = { mama, colo_utero: colo };
