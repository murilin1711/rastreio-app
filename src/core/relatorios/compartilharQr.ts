import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { gerarPdf } from './gerarPdf';
import { qrSvg } from './qr';
import type { Especialidade, TipoRelatorio } from './tipos';

export const VALIDADE_QR_SEGUNDOS = 7 * 24 * 3600;

export interface Compartilhamento { id: string; tipo: TipoRelatorio; especialidade: Especialidade | null; caminho: string; url: string | null; expiraEm: string; criadoEm: string }

const TIPO_BANCO: Record<TipoRelatorio, string> = { cardio: 'cardiovascular', oncologico: 'oncologico', geral: 'geral', consulta: 'consulta', bemestar: 'bemestar' };
const TIPO_DOMINIO: Record<string, TipoRelatorio> = { cardiovascular: 'cardio', oncologico: 'oncologico', geral: 'geral', consulta: 'consulta', bemestar: 'bemestar' };

async function subirPdf(caminho: string, uriLocal: string, upsert: boolean): Promise<void> {
  const blob = await (await fetch(uriLocal)).blob();
  const buf = await new Response(blob).arrayBuffer();
  const { error } = await supabase.storage.from('relatorios').upload(caminho, buf, { contentType: 'application/pdf', upsert });
  if (error) throw traduzirErro(error);
}

/**
 * Compartilhamento por QR (D-007), em duas passagens: sobe o PDF sem QR → URL assinada de 7 dias → regenera o PDF
 * com o QR dessa URL e sobrescreve o mesmo objeto (a assinatura é do caminho, não do conteúdo).
 */
export async function criarCompartilhamento(userId: string, tipo: TipoRelatorio, especialidade: Especialidade | null, htmlSemQr: string, htmlComQr: (qrSvg: string, validade: string) => string): Promise<Compartilhamento & { url: string; qrSvg: string }> {
  const uuid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const caminho = `${userId}/${uuid}.pdf`;
  await subirPdf(caminho, await gerarPdf(htmlSemQr), false);
  const { data: assinado, error: erroUrl } = await supabase.storage.from('relatorios').createSignedUrl(caminho, VALIDADE_QR_SEGUNDOS);
  if (erroUrl) throw traduzirErro(erroUrl);
  const expiraEm = new Date(Date.now() + VALIDADE_QR_SEGUNDOS * 1000).toISOString();
  const svg = await qrSvg(assinado.signedUrl, 96);
  await subirPdf(caminho, await gerarPdf(htmlComQr(svg, dataBr(expiraEm))), true);
  const { data, error } = await supabase.from('compartilhamentos').insert({ user_id: userId, tipo_relatorio: TIPO_BANCO[tipo], especialidade, caminho, expira_em: expiraEm }).select('id, created_at').single();
  if (error) throw traduzirErro(error);
  return { id: data.id, tipo, especialidade, caminho, url: assinado.signedUrl, qrSvg: await qrSvg(assinado.signedUrl, 240), expiraEm, criadoEm: data.created_at };
}

/** Encerra: apaga o PDF (a URL assinada passa a devolver 404) e marca `revogado_em`. */
export async function revogar(userId: string, id: string): Promise<void> {
  const { data, error } = await supabase.from('compartilhamentos').select('caminho').eq('user_id', userId).eq('id', id).maybeSingle();
  if (error) throw traduzirErro(error);
  if (!data) return;
  const { error: erroStorage } = await supabase.storage.from('relatorios').remove([data.caminho]);
  if (erroStorage) throw traduzirErro(erroStorage);
  const { error: erroUpd } = await supabase.from('compartilhamentos').update({ revogado_em: new Date().toISOString() }).eq('user_id', userId).eq('id', id);
  if (erroUpd) throw traduzirErro(erroUpd);
}

export async function listarAtivos(userId: string): Promise<Compartilhamento[]> {
  const { data, error } = await supabase.from('compartilhamentos').select('id, tipo_relatorio, especialidade, caminho, expira_em, created_at').eq('user_id', userId).is('revogado_em', null).gt('expira_em', new Date().toISOString()).order('created_at', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map((c) => ({ id: c.id, tipo: TIPO_DOMINIO[c.tipo_relatorio] ?? 'geral', especialidade: c.especialidade as Especialidade | null, caminho: c.caminho, url: null, expiraEm: c.expira_em, criadoEm: c.created_at }));
}

/** Limpeza: PDFs vencidos saem do Storage (o registro fica como histórico). */
export async function limparExpirados(userId: string): Promise<number> {
  const { data, error } = await supabase.from('compartilhamentos').select('id, caminho').eq('user_id', userId).is('revogado_em', null).lte('expira_em', new Date().toISOString());
  if (error) throw traduzirErro(error);
  if (!data.length) return 0;
  await supabase.storage.from('relatorios').remove(data.map((c) => c.caminho));
  await supabase.from('compartilhamentos').update({ revogado_em: new Date().toISOString() }).in('id', data.map((c) => c.id));
  return data.length;
}

function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
