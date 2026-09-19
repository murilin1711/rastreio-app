/**
 * Lembretes de água (C-021, parte D2): janela do dia mais intervalo, como o usuário configurou.
 *
 * O intervalo mínimo é de 1 hora de propósito. Notificação de água de 15 em 15 minutos vira ruído,
 * a pessoa desliga tudo — e junto vão os lembretes de medicação e de exame, que importam de verdade.
 */
export interface ConfigLembretesAgua {
  ativo: boolean;
  /** 'HH:MM' */
  inicio: string;
  /** 'HH:MM' */
  fim: string;
  intervaloMin: number;
}

/** Começa desligado: diferente dos outros tipos, água exige a pessoa escolher janela e intervalo. */
export const CONFIG_AGUA_PADRAO: ConfigLembretesAgua = { ativo: false, inicio: '08:00', fim: '20:00', intervaloMin: 120 };

export const INTERVALO_MIN_MINUTOS = 60;

const emMinutos = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const paraHhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Horários da janela, do início até o fim, de `intervaloMin` em `intervaloMin`. */
export function horariosAgua(inicio: string, fim: string, intervaloMin: number): string[] {
  const [i, f] = [emMinutos(inicio), emMinutos(fim)];
  if (f < i || intervaloMin <= 0) return [];
  const horarios: string[] = [];
  for (let m = i; m <= f; m += intervaloMin) horarios.push(paraHhmm(m));
  return horarios;
}

/** Mensagem de erro para mostrar à pessoa, ou `null` se a configuração está boa. */
export function validarConfigAgua(c: ConfigLembretesAgua): string | null {
  if (c.intervaloMin < INTERVALO_MIN_MINUTOS) return 'O intervalo mínimo entre lembretes é de 1 hora.';
  if (emMinutos(c.fim) < emMinutos(c.inicio)) return 'O horário final precisa vir depois do inicial.';
  return null;
}
