export interface Medicacao {
  id: string;
  nome: string;
  dose: string | null;
  horarios: string[]; // 'HH:MM'
  desde: string | null; // 'AAAA-MM-DD'
  ate: string | null;
  prescritor: string | null;
  ativa: boolean;
  observacao: string | null;
}
