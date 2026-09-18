import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { linhaParaDocumento, type ExameParaVinculo } from './mapeamento';
import { apagarArquivo } from './storage';
import type { Documento, TipoDocumento } from './tipos';

const CAMPOS = 'id, exame_id, tipo, nome, caminho, mime, tamanho, data_documento, observacao, created_at';

export interface FiltroDocumentos { tipo?: TipoDocumento; exameId?: string }

export async function listar(userId: string, f: FiltroDocumentos = {}): Promise<Documento[]> {
  let q = supabase.from('documentos').select(CAMPOS).eq('user_id', userId).order('created_at', { ascending: false });
  if (f.tipo) q = q.eq('tipo', f.tipo);
  if (f.exameId) q = q.eq('exame_id', f.exameId);
  const { data, error } = await q;
  if (error) throw traduzirErro(error);
  return data.map(linhaParaDocumento);
}

export async function buscar(userId: string, id: string): Promise<Documento | null> {
  const { data, error } = await supabase.from('documentos').select(CAMPOS).eq('user_id', userId).eq('id', id).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? linhaParaDocumento(data) : null;
}

export async function inserir(userId: string, d: { exameId: string | null; tipo: TipoDocumento; nome: string; caminho: string; mime: string; tamanho: number; dataDocumento: string | null; observacao: string | null }): Promise<string> {
  const { data, error } = await supabase
    .from('documentos')
    .insert({ user_id: userId, exame_id: d.exameId, tipo: d.tipo, nome: d.nome, caminho: d.caminho, mime: d.mime, tamanho: d.tamanho, data_documento: d.dataDocumento, observacao: d.observacao })
    .select('id')
    .single();
  if (error) throw traduzirErro(error);
  return data.id;
}

/** Apaga o arquivo no Storage e depois a linha. Se o arquivo já não existir, segue e remove a linha. */
export async function excluir(userId: string, id: string): Promise<void> {
  const doc = await buscar(userId, id);
  if (!doc) return;
  try { await apagarArquivo(doc.caminho); } catch { /* arquivo ausente: a linha ainda precisa sair */ }
  const { error } = await supabase.from('documentos').delete().eq('user_id', userId).eq('id', id);
  if (error) throw traduzirErro(error);
}

/** Últimos exames de qualquer módulo, para o campo "exame vinculado" do formulário. */
export async function listarExamesParaVinculo(userId: string, limite = 20): Promise<ExameParaVinculo[]> {
  const { data, error } = await supabase.from('exames').select('id, tipo, modulo, programa, data_realizacao').eq('user_id', userId).order('data_realizacao', { ascending: false }).limit(limite);
  if (error) throw traduzirErro(error);
  return data.map((l) => ({ id: l.id, tipo: l.tipo, modulo: l.modulo, programa: l.programa, dataRealizacao: l.data_realizacao }));
}
