import { FONTES_POR_TEMA, REFERENCIAS, type IdReferencia, type Referencia, type TemaFonte } from '@core/referencias/catalogo';
import type { ChaveSecao, SecaoRelatorio } from './tipos';

/** Seções sem entrada aqui só repetem o que o paciente registrou: não têm parâmetro clínico a citar. */
const TEMAS_DA_SECAO: Partial<Record<ChaveSecao, TemaFonte[]>> = {
  pa: ['pressao'],
  mrpa: ['mrpa'],
  glicemia: ['glicemia'],
  hba1c: ['glicemia'],
  lipidios: ['examesCardio'],
  renal: ['examesCardio'],
  tsh: ['examesCardio'],
  exames_cardio: ['examesCardio'],
  prevent: ['risco'],
  agravantes: ['risco'],
  checkup: ['checkup'],
  peso: ['corpo'],
  corpo: ['corpo'],
  rastreamentos_status: ['mama', 'colo_utero', 'colorretal', 'pulmao', 'prostata'],
  mama: ['mama'],
  colo: ['colo_utero'],
  colorretal: ['colorretal'],
  pulmao: ['pulmao'],
  prostata: ['prostata'],
  agua: ['agua'],
  atividade: ['atividade'],
  sono: ['sono'],
};

/** Fontes das seções presentes no relatório, sem repetir (diretriz 1.4.1: vale também para o PDF). */
export function fontesDoRelatorio(secoes: SecaoRelatorio[]): (Referencia & { id: IdReferencia })[] {
  const ids = new Set<IdReferencia>();
  for (const s of secoes) for (const tema of TEMAS_DA_SECAO[s.chave] ?? []) FONTES_POR_TEMA[tema].forEach((id) => ids.add(id));
  return [...ids].map((id) => ({ id, ...REFERENCIAS[id] }));
}
