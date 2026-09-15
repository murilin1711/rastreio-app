import type { ProgramaHandlers } from '../tipos';
import { colo } from './colo';
import { colorretal } from './colorretal';
import { mama } from './mama';
import { pulmao } from './pulmao';

/** Handlers por programa. Próstata entra após a decisão C-008 (40 vs 45 anos). */
export const handlers: ProgramaHandlers = { mama, colo_utero: colo, colorretal, pulmao };
