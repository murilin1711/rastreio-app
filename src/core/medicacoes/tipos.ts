/** Unidade da quantidade tomada em cada horário (D-066). */
export type UnidadeDose = 'comprimido' | 'gota' | 'unidade' | 'ml' | 'jato';

/** Um horário do remédio e quanto tomar nele ('HH:MM'; quantidade na unidade do remédio). */
export interface HorarioDose {
  hora: string;
  quantidade: number;
}

export interface Medicacao {
  id: string;
  nome: string;
  dose: string | null;
  horarios: HorarioDose[];
  /** Unidade das quantidades (comprimido, gota…). */
  unidade: UnidadeDose;
  /** "Dose muda conforme o dia": o lembrete não mostra quantidade. */
  doseVariavel: boolean;
  /** Sem horário fixo: toma quando precisa (não entra na adesão). */
  sePrecisar: boolean;
  /** Instante ISO da última mudança de horários/quantidades (mantido pelo banco). */
  horariosDesde: string | null;
  desde: string | null; // 'AAAA-MM-DD'
  ate: string | null;
  prescritor: string | null;
  ativa: boolean;
  /** Lembrete local nos horários (§21). */
  lembrar: boolean;
  observacao: string | null;
}

/** Uma marca "tomei / não tomei". Sem dataPrevista/horaPrevista é uma tomada avulsa ("se precisar"). */
export interface Tomada {
  id: string;
  medicacaoId: string;
  dataPrevista: string | null; // 'AAAA-MM-DD'
  horaPrevista: string | null; // 'HH:MM'
  quantidadePrevista: number | null;
  tomou: boolean;
  quantidade: number | null;
  marcadoEm: string; // ISO
}
