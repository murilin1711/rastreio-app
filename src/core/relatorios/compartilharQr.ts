import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { gerarPdf } from './gerarPdf';
import { caminhoJson, linkDaPagina, type ConteudoQr } from './linkQr';
import { qrSvg } from './qr';
import type { Especialidade, TipoRelatorio } from './tipos';

export const VALIDADE_QR_SEGUNDOS = 7 * 24 * 3600;

export interface Compartilhamento { id: string; tipo: TipoRelatorio; especialidade: Especialidade | null; caminho: string; url: string | null; expiraEm: string; criadoEm: string }

const TIPO_BANCO: Record<TipoRelatorio, string> = { cardio: 'cardiovascular', oncologico: 'oncologico', geral: 'geral', consulta: 'consulta', bemestar: 'bemestar' };
const TIPO_DOMINIO: Record<string, TipoRelatorio> = { cardiovascular: 'cardio', oncologico: 'oncologico', geral: 'geral', consulta: 'consulta', bemestar: 'bemestar' };

async function subirPdf(caminho: string, uriLocal: string): Promise<void> {
  const blob = await (await fetch(uriLocal)).blob();
  const buf = await new Response(blob).arrayBuffer();
  const { error } = await supabase.storage.from('relatorios').upload(caminho, buf, { contentType: 'application/pdf', upsert: false });
  if (error) throw traduzirErro(error);
}

async function subirJson(caminho: string, conteudo: object, upsert: boolean): Promise<void> {
  const { error } = await supabase.storage.from('relatorios').upload(caminho, JSON.stringify(conteudo), { contentType: 'application/json', upsert });
  if (error) throw traduzirErro(error);
}

async function assinar(caminho: string): Promise<string> {
  const { data, error } = await supabase.storage.from('relatorios').createSignedUrl(caminho, VALIDADE_QR_SEGUNDOS);
  if (error) throw traduzirErro(error);
  return data.signedUrl;
}

export interface ConteudoCompartilhamento {
  titulo: string;
  geradoEm: string;
  /** HTML da página do celular: `htmlRelatorio` com o painel e `tela: true`. */
  htmlWeb: string;
  /** HTML do PDF (sem `tela`), com o QR do link da página e a validade. */
  htmlPdf: (qrSvg: string, validade: string) => string;
}

/**
 * Compartilhamento por QR (D-007, D-067). O QR abre a página `/r/` (link com caminho e token depois do `#`), que lê
 * um JSON ao lado do PDF no bucket privado `relatorios`:
 * (1) sobe o JSON provisório → (2) URL assinada de 7 dias do JSON → link da página → (3) PDF com o QR desse link →
 * (4) URL assinada do PDF → (5) JSON final com o HTML da página e a URL do PDF (a assinatura é do caminho, não do
 * conteúdo, então o link continua valendo) → (6) registro em `compartilhamentos` (caminho = PDF).
 */
export async function criarCompartilhamento(userId: string, tipo: TipoRelatorio, especialidade: Especialidade | null, conteudo: ConteudoCompartilhamento): Promise<Compartilhamento & { url: string; qrSvg: string }> {
  const uuid = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const caminho = `${userId}/${uuid}.pdf`;
  const json = caminhoJson(caminho);
  // Antes de assinar: a validade mostrada (PDF, tela, registro) nunca passa da validade real das URLs.
  const expiraEm = new Date(Date.now() + VALIDADE_QR_SEGUNDOS * 1000).toISOString();
  await subirJson(json, { versao: 1, preparando: true }, false);
  try {
    const link = linkDaPagina(await assinar(json), json);
    await subirPdf(caminho, await gerarPdf(conteudo.htmlPdf(await qrSvg(link, 96), dataBr(expiraEm))));
    const pdfUrl = await assinar(caminho);
    const final: ConteudoQr = { versao: 1, titulo: conteudo.titulo, geradoEm: conteudo.geradoEm, expiraEm, html: conteudo.htmlWeb, pdfUrl };
    await subirJson(json, final, true);
    const svgTela = await qrSvg(link, 240);
    const { data, error } = await supabase.from('compartilhamentos').insert({ user_id: userId, tipo_relatorio: TIPO_BANCO[tipo], especialidade, caminho, expira_em: expiraEm }).select('id, created_at').single();
    if (error) throw traduzirErro(error);
    return { id: data.id, tipo, especialidade, caminho, url: link, qrSvg: svgTela, expiraEm, criadoEm: data.created_at };
  } catch (e) {
    // Dado de saúde não fica órfão no bucket sem registro nem prazo: apaga o que subiu e devolve o erro original.
    await Promise.resolve().then(() => supabase.storage.from('relatorios').remove([caminho, json])).catch(() => undefined);
    throw e;
  }
}

/** Encerra: apaga o PDF e o JSON (as URLs assinadas passam a devolver 404; a página mostra "Este relatório não está mais disponível") e marca `revogado_em`. */
export async function revogar(userId: string, id: string): Promise<void> {
  const { data, error } = await supabase.from('compartilhamentos').select('caminho').eq('user_id', userId).eq('id', id).maybeSingle();
  if (error) throw traduzirErro(error);
  if (!data) return;
  const { error: erroStorage } = await supabase.storage.from('relatorios').remove([data.caminho, caminhoJson(data.caminho)]);
  if (erroStorage) throw traduzirErro(erroStorage);
  const { error: erroUpd } = await supabase.from('compartilhamentos').update({ revogado_em: new Date().toISOString() }).eq('user_id', userId).eq('id', id);
  if (erroUpd) throw traduzirErro(erroUpd);
}

export async function listarAtivos(userId: string): Promise<Compartilhamento[]> {
  const { data, error } = await supabase.from('compartilhamentos').select('id, tipo_relatorio, especialidade, caminho, expira_em, created_at').eq('user_id', userId).is('revogado_em', null).gt('expira_em', new Date().toISOString()).order('created_at', { ascending: false });
  if (error) throw traduzirErro(error);
  return data.map((c) => ({ id: c.id, tipo: TIPO_DOMINIO[c.tipo_relatorio] ?? 'geral', especialidade: c.especialidade as Especialidade | null, caminho: c.caminho, url: null, expiraEm: c.expira_em, criadoEm: c.created_at }));
}

/** Limpeza (melhor esforço): PDFs e JSONs vencidos saem do Storage (o registro fica como histórico). */
export async function limparExpirados(userId: string): Promise<number> {
  const { data, error } = await supabase.from('compartilhamentos').select('id, caminho').eq('user_id', userId).is('revogado_em', null).lte('expira_em', new Date().toISOString());
  if (error) throw traduzirErro(error);
  if (!data.length) return 0;
  const { error: erroStorage } = await supabase.storage.from('relatorios').remove(data.flatMap((c) => [c.caminho, caminhoJson(c.caminho)]));
  // Sem apagar os arquivos, não marca como revogado: a próxima abertura da tela tenta de novo.
  if (erroStorage) return 0;
  await supabase.from('compartilhamentos').update({ revogado_em: new Date().toISOString() }).in('id', data.map((c) => c.id));
  return data.length;
}

function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${a}`;
}
