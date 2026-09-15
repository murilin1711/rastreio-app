import type { Programa, RegraParametros } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

const cache = new Map<Programa, { em: number; regras: RegraParametros[] }>();
const TTL_MS = 10 * 60 * 1000;

/** Carrega as regras ativas de um programa da tabela `regras_clinicas` (§65), com cache de 10 minutos. */
export async function carregarRegras(programa: Programa): Promise<RegraParametros[]> {
  const c = cache.get(programa);
  if (c && Date.now() - c.em < TTL_MS) return c.regras;
  const { data, error } = await supabase
    .from('regras_clinicas')
    .select('*')
    .eq('modulo', 'rastreando')
    .eq('programa', programa)
    .eq('ativa', true);
  if (error) throw traduzirErro(error);
  const regras: RegraParametros[] = data.map((r) => ({
    id: r.id,
    versao: r.versao,
    fonte: r.fonte,
    ano: r.ano,
    condicao: (r.condicao as Record<string, unknown>) ?? {},
    classificacao: r.classificacao as RegraParametros['classificacao'],
    nivelAlerta: r.nivel_alerta as RegraParametros['nivelAlerta'],
    proximaAcao: r.proxima_acao ?? '',
    intervaloMeses: r.intervalo_meses,
    mensagemPaciente: r.mensagem_paciente ?? '',
  }));
  cache.set(programa, { em: Date.now(), regras });
  return regras;
}

export function limparCacheRegras(): void {
  cache.clear();
}
