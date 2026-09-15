import { classificarExame } from '@core/regras/classificar';
import { handlers } from '@core/regras/programas';
import type { ExameEntrada, Programa, ResultadoClassificacao } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';
import { montarContexto } from './contexto';
import { agendarLembretes } from './lembretes';
import { carregarRegras } from './regras';
import { ROTULO_EXAME, type TipoExameRastreamento } from './tipos';

export interface EntradaExame {
  programa: Programa;
  tipo: TipoExameRastreamento;
  dataRealizacao: string;
  resultado: Record<string, unknown>;
  laudoTexto?: string;
  instituicao?: string;
  solicitante?: string;
  /** Exame anterior cuja pendência este exame investiga (§51). */
  resolveExameId?: string | null;
}

export interface SaidaExame {
  exameId: string;
  resultado: ResultadoClassificacao;
  lembretesOk: boolean;
}

/** Fluxo §42: contexto → regras → classificação → gravação → pendência → lembretes. */
export async function registrarExame(userId: string, entrada: EntradaExame): Promise<SaidaExame> {
  const { perfil, contextoPor } = await montarContexto(userId);
  const regras = await carregarRegras(entrada.programa);
  const exame: ExameEntrada = { tipo: entrada.tipo, programa: entrada.programa, dataRealizacao: entrada.dataRealizacao, resultado: entrada.resultado };

  const contexto = contextoPor(entrada.programa);
  // O exame que resolve uma pendência não pode ser bloqueado por ela.
  if (entrada.resolveExameId) {
    contexto.pendenciasAbertas = contexto.pendenciasAbertas.filter((p) => p.exameOrigemId !== entrada.resolveExameId);
  }
  const resultado = classificarExame(exame, perfil, contexto, regras, handlers);

  const { data, error } = await supabase
    .from('exames')
    .insert({
      user_id: userId,
      tipo: entrada.tipo,
      categoria: 'rastreamento',
      modulo: 'rastreando',
      programa: entrada.programa,
      data_realizacao: entrada.dataRealizacao,
      resultado: entrada.resultado as Json,
      laudo_texto: entrada.laudoTexto ?? null,
      instituicao: entrada.instituicao ?? null,
      solicitante: entrada.solicitante ?? null,
      observacoes: resultado.mensagemPaciente,
      classificacao: resultado.classificacao,
      nivel_alerta: resultado.nivelAlerta,
      proxima_acao: resultado.proximaAcao,
      data_proxima_acao: resultado.dataProximaAcao,
      abre_pendencia: resultado.abrePendencia,
      regra_id: resultado.regraId,
      regra_versao: resultado.regraVersao,
      resolve_exame_id: entrada.resolveExameId ?? null,
    })
    .select('id')
    .single();
  if (error) throw traduzirErro(error);
  const exameId = data.id;

  if (resultado.abrePendencia) {
    const { error: e2 } = await supabase.from('pendencias').insert({
      user_id: userId,
      exame_origem_id: exameId,
      programa: entrada.programa,
      descricao: resultado.proximaAcao,
      nivel_alerta: resultado.nivelAlerta,
    });
    if (e2) throw traduzirErro(e2);
  }

  let lembretesOk = true;
  if (resultado.dataProximaAcao) {
    try {
      await agendarLembretes(userId, exameId, entrada.programa, resultado.dataProximaAcao, ROTULO_EXAME[entrada.tipo].toLowerCase());
    } catch (e) {
      lembretesOk = false;
      if (__DEV__) console.warn('[NERO] lembretes não agendados:', e);
    }
  }
  return { exameId, resultado, lembretesOk };
}
