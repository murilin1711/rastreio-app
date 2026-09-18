import type { Documento, TipoDocumento } from './tipos';

export type LinhaDocumento = { id: string; exame_id: string | null; tipo: string; nome: string; caminho: string; mime: string; tamanho: number; data_documento: string | null; observacao: string | null; created_at: string };

export function linhaParaDocumento(l: LinhaDocumento): Documento {
  return { id: l.id, exameId: l.exame_id, tipo: l.tipo as TipoDocumento, nome: l.nome, caminho: l.caminho, mime: l.mime, tamanho: l.tamanho, dataDocumento: l.data_documento, observacao: l.observacao, criadoEm: l.created_at };
}

const EXT_POR_MIME: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/heic': 'heic', 'application/pdf': 'pdf' };

export function extensaoDe(mime: string, nomeOriginal?: string): string {
  if (EXT_POR_MIME[mime]) return EXT_POR_MIME[mime];
  const m = nomeOriginal?.match(/\.([a-z0-9]{2,5})$/i);
  return m ? m[1].toLowerCase() : 'bin';
}

/** Caminho no bucket: a primeira pasta é o id do usuário (exigido pelas políticas de Storage). */
export function caminhoNoBucket(userId: string, uuid: string, mime: string, nomeOriginal?: string): string {
  return `${userId}/${uuid}.${extensaoDe(mime, nomeOriginal)}`;
}

export function ehImagem(mime: string): boolean {
  return mime.startsWith('image/');
}

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

/** Exame de qualquer módulo, reduzido ao necessário para vincular um documento. */
export interface ExameParaVinculo { id: string; tipo: string; modulo: string; programa: string | null; dataRealizacao: string }

/** Rótulo legível para o Select de vínculo: usa os dicionários do Rastreando e do Cardio, senão o tipo cru. */
export function rotuloExameParaVinculo(e: ExameParaVinculo, rotulos: { rastreando: Record<string, string>; cardio: (tipo: string) => string }): string {
  const nome = e.modulo === 'rastreando' ? (rotulos.rastreando[e.tipo] ?? e.tipo) : rotulos.cardio(e.tipo);
  const [a, m, d] = e.dataRealizacao.split('-');
  return `${nome} — ${d}/${m}/${a}`;
}
