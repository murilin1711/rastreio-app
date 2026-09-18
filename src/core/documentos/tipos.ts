/** Meus Documentos (§59, D-008): laudos, receitas, atestados e imagens, com ou sem exame vinculado. */
export type TipoDocumento = 'laudo' | 'receita' | 'atestado' | 'imagem' | 'outro';

export interface Documento {
  id: string;
  exameId: string | null;
  tipo: TipoDocumento;
  nome: string;
  caminho: string; // <user_id>/<uuid>.<ext> no bucket 'laudos'
  mime: string;
  tamanho: number;
  dataDocumento: string | null; // 'AAAA-MM-DD'
  observacao: string | null;
  criadoEm: string;
}

export const ROTULO_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  laudo: 'Laudo de exame',
  receita: 'Receita',
  atestado: 'Atestado ou relatório médico',
  imagem: 'Imagem de exame',
  outro: 'Outro documento',
};

export const LIMITE_BYTES = 10 * 1024 * 1024;
