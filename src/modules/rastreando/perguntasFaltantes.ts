import type { PerfilSaude } from '@core/perfil/tipos';
import type { Programa } from '@core/regras/tipos';

export type CampoFaltante =
  | 'dataNascimento' | 'sexoNascimento' | 'antecedentes' | 'radioterapiaToracica' | 'possuiColoUtero' | 'jaTeveAtividadeSexual'
  | 'temHiv' | 'temImunossupressao' | 'temDii' | 'tabagismoStatus' | 'cigarrosDia' | 'anosFumando' | 'dataCessacao' | 'racaCor';

/**
 * O que ainda falta no perfil para o motor avaliar aquele programa (§29.2: perguntar só o necessário).
 * `antecedentes` conta como respondido se há registros ou se o usuário declarou que não há casos na família.
 */
export function perguntasFaltantes(programa: Programa, p: PerfilSaude, antecedentesQtd: number, semAntecedentes: boolean): CampoFaltante[] {
  const f: CampoFaltante[] = [];
  const antecedentesOk = antecedentesQtd > 0 || semAntecedentes;
  if (!p.dataNascimento) f.push('dataNascimento');
  if (!p.sexoNascimento) f.push('sexoNascimento');

  switch (programa) {
    case 'mama':
      if (!antecedentesOk) f.push('antecedentes');
      if (p.radioterapiaToracica == null) f.push('radioterapiaToracica');
      break;
    case 'colo_utero':
      if (p.possuiColoUtero == null) f.push('possuiColoUtero');
      if (p.jaTeveAtividadeSexual == null) f.push('jaTeveAtividadeSexual');
      if (p.temHiv == null) f.push('temHiv');
      if (p.temImunossupressao == null) f.push('temImunossupressao');
      break;
    case 'colorretal':
      if (!antecedentesOk) f.push('antecedentes');
      if (p.temDii == null) f.push('temDii');
      break;
    case 'pulmao':
      if (!p.tabagismoStatus) f.push('tabagismoStatus');
      else if (p.tabagismoStatus !== 'nunca') {
        if (p.cigarrosDia == null) f.push('cigarrosDia');
        if (p.anosFumando == null) f.push('anosFumando');
        if (p.tabagismoStatus === 'ex' && !p.dataCessacao) f.push('dataCessacao');
      }
      break;
    case 'prostata':
      if (!antecedentesOk) f.push('antecedentes');
      if (!p.racaCor) f.push('racaCor');
      break;
  }
  return f;
}
