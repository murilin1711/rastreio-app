import { media } from '@core/regras/cardio/pressao';
import type { AgravanteCV, EntradaPrevent, FontesPrevent } from '@core/regras/cardio/tiposRisco';
import * as perfilRepo from '@core/perfil/repositorio';
import { calcularIdade } from '@core/perfil/calculos';
import { supabase } from '@core/supabase/client';
import type { Json } from '@core/supabase/database.types';
import { traduzirErro } from '@core/supabase/erros';
import { ultimoPorTipo } from './examesCardio';
import * as medidasRepo from './medidas';
import * as sessoesRepo from './sessoesMrpa';

const diasAtrasISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

export interface RiscoSalvo {
  id: string;
  calculadoEm: string;
  modelo: string;
  ascvd10: number;
  ascvd30: number | null;
  categoria: 'baixo' | 'intermediario' | 'alto';
  entradas: EntradaPrevent[];
  agravantesPresentes: AgravanteCV[];
  versaoCoeficientes: string;
}

/** Reúne do banco tudo que o PREVENT pode usar (§14). Anti-hipertensivo/estatina são confirmados na tela. */
export async function montarFontesPrevent(userId: string, paCasualDias: number): Promise<FontesPrevent> {
  const [perfil, exames, peso, mrpas, casuais] = await Promise.all([
    perfilRepo.obterPerfil(userId),
    ultimoPorTipo(userId, ['colesterol_total', 'hdl', 'creatinina', 'tfg', 'hba1c', 'rac_urinaria']),
    supabase.from('medidas').select('valores, medido_em').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle(),
    sessoesRepo.listarSessoes(userId),
    medidasRepo.listarPA(userId, { desde: diasAtrasISO(paCasualDias), sessaoId: null }),
  ]);
  if (peso.error) throw traduzirErro(peso.error);
  const ex = (tipo: string) => {
    const e = exames[tipo];
    return e?.resultado.valor != null ? { valor: e.resultado.valor, data: e.dataRealizacao, origem: 'exame' as const } : null;
  };
  const mrpaValida = mrpas.find((s) => s.status === 'concluida' && s.resultado?.valido && s.resultado.medias.total);
  const casuaisValidas = casuais.filter((m) => !m.contexto.excluida);
  const md = media(casuaisValidas);
  return {
    idade: perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null,
    sexo: perfil?.sexoNascimento ?? null,
    colesterolTotal: ex('colesterol_total'),
    hdl: ex('hdl'),
    paMrpa: mrpaValida?.concluidaEm ? { valor: mrpaValida.resultado!.medias.total!.pas, data: mrpaValida.concluidaEm.slice(0, 10), origem: 'medida' } : null,
    paCasual: md ? { media: md.pas, n: md.n, dataMaisRecente: casuaisValidas[0].medidoEm.slice(0, 10) } : null,
    antiHipertensivo: null,
    estatina: null,
    diabetes: perfil?.temDiabetes ?? null,
    tabagismoAtual: perfil?.tabagismoStatus ? perfil.tabagismoStatus === 'atual' : null,
    peso: peso.data ? { valor: (peso.data.valores as { kg: number }).kg, data: peso.data.medido_em.slice(0, 10), origem: 'medida' } : null,
    alturaCm: perfil?.alturaCm ?? null,
    tfg: ex('tfg'),
    creatinina: ex('creatinina'),
    hba1c: ex('hba1c'),
    rac: ex('rac_urinaria'),
  };
}

export async function salvarRisco(userId: string, r: Omit<RiscoSalvo, 'id' | 'calculadoEm'>): Promise<RiscoSalvo> {
  const { data, error } = await supabase
    .from('riscos_cv')
    .insert({ user_id: userId, modelo: r.modelo, entradas: r.entradas as unknown as Json, ascvd_10: r.ascvd10, ascvd_30: r.ascvd30, categoria: r.categoria, agravantes_presentes: r.agravantesPresentes, versao_coeficientes: r.versaoCoeficientes })
    .select('id, calculado_em')
    .single();
  if (error) throw traduzirErro(error);
  return { ...r, id: data.id, calculadoEm: data.calculado_em };
}

export async function ultimoRisco(userId: string): Promise<RiscoSalvo | null> {
  const { data, error } = await supabase.from('riscos_cv').select('*').eq('user_id', userId).order('calculado_em', { ascending: false }).limit(1).maybeSingle();
  if (error) throw traduzirErro(error);
  if (!data) return null;
  return { id: data.id, calculadoEm: data.calculado_em, modelo: data.modelo, ascvd10: Number(data.ascvd_10), ascvd30: data.ascvd_30 == null ? null : Number(data.ascvd_30), categoria: data.categoria as RiscoSalvo['categoria'], entradas: (data.entradas as unknown as EntradaPrevent[]) ?? [], agravantesPresentes: (data.agravantes_presentes as AgravanteCV[]) ?? [], versaoCoeficientes: data.versao_coeficientes };
}
