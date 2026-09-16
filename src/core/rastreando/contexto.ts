import * as perfilRepo from '@core/perfil/repositorio';
import type { Classificacao, ContextoAvaliacao, ExameEntrada, Programa } from '@core/regras/tipos';
import { paraPerfilRegras } from './perfilRegras';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export interface ExameRegistrado extends ExameEntrada {
  id: string;
  classificacao: Classificacao;
  nivelAlerta: string;
  proximaAcao: string | null;
  dataProximaAcao: string | null;
  mensagem: string | null;
  regraId: string | null;
  regraVersao: string | null;
  resolveExameId: string | null;
  laudoTexto: string | null;
}
export interface PendenciaAberta { id: string; programa: Programa; descricao: string; nivelAlerta: string; exameOrigemId: string; abertaEm: string }
export interface SintomaAberto { id: string; programa: Programa; sintoma: string; registradoEm: string }

/** Lê tudo que o motor precisa do banco para um usuário. Única função do módulo que consulta várias tabelas. */
export async function montarContexto(userId: string) {
  const [perfilSaude, antecedentes, peso, exames, pendencias, sintomas] = await Promise.all([
    perfilRepo.obterPerfil(userId),
    perfilRepo.listarAntecedentes(userId),
    supabase.from('medidas').select('valores').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('exames').select('*').eq('user_id', userId).eq('modulo', 'rastreando').order('data_realizacao', { ascending: false }),
    supabase.from('pendencias').select('*').eq('user_id', userId).eq('status', 'aberta'),
    supabase.from('sintomas_alarme').select('*').eq('user_id', userId).is('resolvido_em', null),
  ]);
  for (const r of [peso, exames, pendencias, sintomas]) if (r.error) throw traduzirErro(r.error);

  const pesoKg = (peso.data?.valores as { kg?: number } | null)?.kg ?? null;

  const listaExames: ExameRegistrado[] = (exames.data ?? []).map((e) => ({
    id: e.id,
    tipo: e.tipo,
    programa: e.programa as Programa,
    dataRealizacao: e.data_realizacao,
    resultado: (e.resultado as Record<string, unknown>) ?? {},
    classificacao: (e.classificacao ?? 'pendente') as Classificacao,
    nivelAlerta: e.nivel_alerta ?? 'cinza',
    proximaAcao: e.proxima_acao,
    dataProximaAcao: e.data_proxima_acao,
    mensagem: e.observacoes,
    regraId: e.regra_id,
    regraVersao: e.regra_versao,
    resolveExameId: e.resolve_exame_id,
    laudoTexto: e.laudo_texto,
  }));
  const listaPend: PendenciaAberta[] = (pendencias.data ?? []).map((p) => ({
    id: p.id, programa: p.programa as Programa, descricao: p.descricao, nivelAlerta: p.nivel_alerta, exameOrigemId: p.exame_origem_id, abertaEm: p.aberta_em,
  }));
  const listaSint: SintomaAberto[] = (sintomas.data ?? []).map((s) => ({ id: s.id, programa: s.programa as Programa, sintoma: s.sintoma, registradoEm: s.registrado_em }));

  // CONITEC: colonoscopia completa e de qualidade, sem alterações relevantes → 10 anos sem FIT.
  const colonoAdequada = listaExames.find(
    (e) =>
      e.tipo === 'colonoscopia' &&
      e.resultado.qualidade_adequada === true &&
      (e.resultado.achado === 'normal' || (e.resultado.polipos as { histopatologico?: string } | undefined)?.histopatologico === 'hiperplasico'),
  );
  const especializados = [...new Set(listaExames.filter((e) => e.classificacao === 'especializado').map((e) => e.programa))];

  const contextoPor = (programa: Programa): ContextoAvaliacao => ({
    sintomasAlarme: listaSint.filter((s) => s.programa === programa).map((s) => s.sintoma),
    pendenciasAbertas: listaPend.map((p) => ({ programa: p.programa, exameOrigemId: p.exameOrigemId })),
    emAcompanhamentoEspecializado: especializados,
    historicoExames: listaExames.map((e) => ({ id: e.id, tipo: e.tipo, programa: e.programa, dataRealizacao: e.dataRealizacao, resultado: e.resultado, classificacao: e.classificacao })),
    colonoscopiaAdequadaEm: colonoAdequada?.dataRealizacao ?? null,
  });

  return {
    perfilSaude,
    antecedentes,
    perfil: paraPerfilRegras(perfilSaude, antecedentes, pesoKg),
    contextoPor,
    exames: listaExames,
    pendencias: listaPend,
    sintomas: listaSint,
  };
}
