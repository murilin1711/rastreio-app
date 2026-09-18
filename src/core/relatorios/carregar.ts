import { listarGlicemia } from '@core/cardio/glicemia';
import { listarPA } from '@core/cardio/medidas';
import { carregarRegrasCardio } from '@core/cardio/regras';
import { montarFontesCheckup } from '@core/cardio/resumoHome';
import { ultimoRisco } from '@core/cardio/riscoCv';
import { listarSessoes } from '@core/cardio/sessoesMrpa';
import { listarExamesCardio } from '@core/cardio/examesCardio';
import * as documentos from '@core/documentos/repositorio';
import { listarMedicacoes } from '@core/medicacoes/repositorio';
import { listarAntecedentes, obterPerfil } from '@core/perfil/repositorio';
import { montarContexto } from '@core/rastreando/contexto';
import { carregarRegras } from '@core/rastreando/regras';
import { PROGRAMAS } from '@core/rastreando/tipos';
import { avaliarCheckup } from '@core/regras/cardio/checkup';
import { metasPara } from '@core/regras/cardio/glicemia';
import { extrairParametrosGlicemia } from '@core/regras/cardio/parametrosGlicemia';
import { extrairParametrosRisco } from '@core/regras/cardio/parametrosRisco';
import { avaliarElegibilidade } from '@core/regras/elegibilidade';
import { handlers } from '@core/regras/programas';
import type { Programa, ResultadoElegibilidade } from '@core/regras/tipos';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import type { ConsultaResumo, DadosNero, Especialidade, Periodo } from './tipos';

/** Período de medidas: 30/90/180 dias até hoje (§26). */
export function periodoDias(dias: 30 | 90 | 180, hoje = new Date()): Periodo {
  const ate = hoje.toISOString().slice(0, 10);
  const desde = new Date(hoje.getTime() - dias * 86_400_000).toISOString().slice(0, 10);
  return { desde, ate, rotulo: `últimos ${dias} dias` };
}

/** Único ponto que lê o banco para os relatórios: reúne todos os módulos num `DadosNero`. */
export async function carregarDadosNero(userId: string, periodo: Periodo): Promise<DadosNero> {
  const desdeISO = `${periodo.desde}T00:00:00.000Z`;
  const [perfil, antecedentes, medicacoes, medidasPA, sessoes, glicemias, examesCardio, risco, ctx, docs, consultas, regrasGli, regrasRisco] = await Promise.all([
    obterPerfil(userId),
    listarAntecedentes(userId),
    listarMedicacoes(userId),
    listarPA(userId, { desde: desdeISO, sessaoId: null }),
    listarSessoes(userId),
    listarGlicemia(userId, { desde: desdeISO }),
    listarExamesCardio(userId),
    ultimoRisco(userId),
    montarContexto(userId),
    documentos.listar(userId),
    listarConsultasFuturas(userId),
    carregarRegrasCardio('glicemia'),
    carregarRegrasCardio('risco_cv'),
  ]);

  const avaliacoes: Partial<Record<Programa, ResultadoElegibilidade>> = {};
  await Promise.all(PROGRAMAS.map(async (p) => { avaliacoes[p] = avaliarElegibilidade(ctx.perfil, p, await carregarRegras(p), ctx.contextoPor(p), new Date(), handlers); }));

  const metasGlicemia = metasPara({ temDiabetes: perfil.temDiabetes, tipoDiabetes: perfil.tipoDiabetes, usaInsulina: perfil.usaInsulina, perfilMetaGlicemica: perfil.perfilMetaGlicemica, metasGlicemia: perfil.metasGlicemia }, extrairParametrosGlicemia(regrasGli));
  const fontesCheckup = await montarFontesCheckup(userId, perfil);
  const checkup = avaliarCheckup(fontesCheckup, { temDiabetes: perfil.temDiabetes }, periodo.ate, extrairParametrosRisco(regrasRisco));
  const peso = await ultimoPeso(userId);

  return {
    perfil,
    antecedentes,
    medicacoes,
    medidasPA,
    sessoesMrpa: sessoes.filter((s) => s.status === 'concluida' && s.inicio >= periodo.desde),
    glicemias,
    metasGlicemia,
    examesCardio,
    examesRastreamento: ctx.exames,
    pendencias: ctx.pendencias,
    sintomas: ctx.sintomas,
    avaliacoes,
    riscos: risco ? [risco] : [],
    checkup,
    peso,
    documentos: docs.filter((d) => (d.dataDocumento ?? d.criadoEm.slice(0, 10)) >= periodo.desde),
    consultas,
  };
}

async function ultimoPeso(userId: string): Promise<DadosNero['peso']> {
  const { data, error } = await supabase.from('medidas').select('valores, medido_em').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  return data ? { kg: (data.valores as { kg: number }).kg, data: data.medido_em.slice(0, 10) } : null;
}

async function listarConsultasFuturas(userId: string): Promise<ConsultaResumo[]> {
  const { data, error } = await supabase.from('consultas').select('id, especialidade, data_hora, local, profissional').eq('user_id', userId).gte('data_hora', new Date().toISOString()).order('data_hora');
  if (error) throw traduzirErro(error);
  return data.map((c) => ({ id: c.id, especialidade: c.especialidade as Especialidade, dataHora: c.data_hora, local: c.local, profissional: c.profissional }));
}
