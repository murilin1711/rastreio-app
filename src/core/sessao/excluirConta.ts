import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { sairDoAparelho } from './sair';

const BUCKETS = ['laudos', 'relatorios'] as const;

/** Lista recursivamente e apaga os arquivos do usuário em um bucket (a API do Storage é a única que remove o arquivo físico). */
async function esvaziarBucket(bucket: (typeof BUCKETS)[number], userId: string): Promise<void> {
  const { data, error } = await supabase.storage.from(bucket).list(userId, { limit: 1000 });
  if (error) throw traduzirErro(error);
  const caminhos = (data ?? []).map((o) => `${userId}/${o.name}`);
  if (caminhos.length === 0) return;
  const { error: erroRemover } = await supabase.storage.from(bucket).remove(caminhos);
  if (erroRemover) throw traduzirErro(erroRemover);
}

/**
 * D-013: exclusão irreversível da conta. Remove os arquivos dos buckets, chama `excluir_minha_conta()`
 * (apaga `auth.users`; as tabelas caem por cascata) e encerra a sessão local, apagando os avisos do aparelho.
 */
export async function excluirConta(userId: string): Promise<void> {
  for (const bucket of BUCKETS) await esvaziarBucket(bucket, userId);
  const { error } = await supabase.rpc('excluir_minha_conta');
  if (error) throw traduzirErro(error);
  await sairDoAparelho({ scope: 'local' }).catch(() => undefined);
}
