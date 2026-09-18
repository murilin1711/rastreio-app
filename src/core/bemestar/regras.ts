import type { RegraParametros } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

let cache: { em: number; regras: RegraParametros[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

/** Regras ativas do programa bem_estar (§65), com cache de 10 minutos — mesmo padrão de `cardio/regras.ts`. */
export async function carregarRegrasBemEstar(): Promise<RegraParametros[]> {
  if (cache && Date.now() - cache.em < TTL_MS) return cache.regras;
  const { data, error } = await supabase.from('regras_clinicas').select('*').eq('modulo', 'bem_estar').eq('programa', 'bem_estar').eq('ativa', true);
  if (error) throw traduzirErro(error);
  const regras: RegraParametros[] = data.map((r) => ({
    id: r.id, versao: r.versao, fonte: r.fonte, ano: r.ano,
    condicao: (r.condicao as Record<string, unknown>) ?? {},
    classificacao: r.classificacao as RegraParametros['classificacao'],
    nivelAlerta: r.nivel_alerta as RegraParametros['nivelAlerta'],
    proximaAcao: r.proxima_acao ?? '', intervaloMeses: r.intervalo_meses, mensagemPaciente: r.mensagem_paciente ?? '',
  }));
  cache = { em: Date.now(), regras };
  return regras;
}
export function limparCacheRegrasBemEstar(): void { cache = null; }
