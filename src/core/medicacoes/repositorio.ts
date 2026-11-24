import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import type { Tables } from '@core/supabase/database.types';
import type { HorarioDose, Medicacao, Tomada, UnidadeDose } from './tipos';
import { UNIDADES } from './unidades';

/** Colunas de `medicacoes` que o app lê (a linha do banco tem também user_id, created_at…). */
type LinhaMedicacao = Pick<
  Tables<'medicacoes'>,
  | 'id' | 'nome' | 'dose' | 'horarios' | 'quantidades' | 'unidade' | 'dose_variavel' | 'se_precisar'
  | 'horarios_desde' | 'desde' | 'ate' | 'prescritor' | 'ativa' | 'lembrar' | 'observacao'
>;

type DadosMedicacao = Omit<Medicacao, 'id' | 'horariosDesde'> & { id?: string };
type NovaTomada = Omit<Tomada, 'id' | 'marcadoEm'>;

/**
 * Linha do banco → modelo do app. `horarios` continua uma lista de textos 'HH:MM' (o build antigo lê assim);
 * a quantidade vem de `quantidades` ({"08:00": 2}) e hora sem entrada vale 1. Remédio sem horário é
 * "se precisar" mesmo com `se_precisar` falso: o build antigo cadastra assim depois da migração (R-T1-b).
 */
export function paraMedicacao(linha: LinhaMedicacao): Medicacao {
  const horas = Array.isArray(linha.horarios)
    ? linha.horarios.filter((h): h is string => typeof h === 'string')
    : [];
  const qtd =
    linha.quantidades && typeof linha.quantidades === 'object' && !Array.isArray(linha.quantidades)
      ? (linha.quantidades as Record<string, unknown>)
      : {};
  const horarios: HorarioDose[] = horas.map((hora) => {
    const q = qtd[hora];
    return { hora, quantidade: typeof q === 'number' && q > 0 ? q : 1 };
  });
  const unidade: UnidadeDose = Object.prototype.hasOwnProperty.call(UNIDADES, linha.unidade) ? (linha.unidade as UnidadeDose) : 'comprimido';
  return {
    id: linha.id,
    nome: linha.nome,
    dose: linha.dose,
    horarios,
    unidade,
    doseVariavel: linha.dose_variavel,
    sePrecisar: linha.se_precisar || horarios.length === 0,
    horariosDesde: linha.horarios_desde,
    desde: linha.desde,
    ate: linha.ate,
    prescritor: linha.prescritor,
    ativa: linha.ativa,
    lembrar: linha.lembrar,
    observacao: linha.observacao,
  };
}

/** Modelo do app → linha a gravar. Sem `horarios_desde`: quem mantém é o gatilho do banco. */
export function paraLinhaMedicacao(userId: string, m: DadosMedicacao) {
  return {
    user_id: userId,
    nome: m.nome,
    dose: m.dose,
    horarios: m.horarios.map((h) => h.hora),
    quantidades: Object.fromEntries(m.horarios.map((h) => [h.hora, h.quantidade])),
    unidade: m.unidade,
    dose_variavel: m.doseVariavel,
    se_precisar: m.sePrecisar,
    desde: m.desde,
    ate: m.ate,
    prescritor: m.prescritor,
    ativa: m.ativa,
    lembrar: m.lembrar,
    observacao: m.observacao,
  };
}

function paraTomada(t: Tables<'tomadas_medicacao'>): Tomada {
  return {
    id: t.id,
    medicacaoId: t.medicacao_id,
    dataPrevista: t.data_prevista,
    horaPrevista: t.hora_prevista,
    quantidadePrevista: t.quantidade_prevista === null ? null : Number(t.quantidade_prevista),
    tomou: t.tomou,
    quantidade: t.quantidade === null ? null : Number(t.quantidade),
    marcadoEm: t.marcado_em,
  };
}

/** 'AAAA-MM-DD' (+ dias) → instante ISO da meia-noite local daquele dia. */
function meiaNoiteLocal(dia: string, maisDias = 0): string {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, m - 1, d + maisDias).toISOString();
}

export async function listarMedicacoes(userId: string): Promise<Medicacao[]> {
  const { data, error } = await supabase
    .from('medicacoes')
    .select('*')
    .eq('user_id', userId)
    .order('ativa', { ascending: false })
    .order('nome');
  if (error) throw traduzirErro(error);
  return data.map(paraMedicacao);
}

export async function salvarMedicacao(userId: string, m: DadosMedicacao): Promise<void> {
  const linha = paraLinhaMedicacao(userId, m);
  const { error } = m.id
    ? await supabase.from('medicacoes').update(linha).eq('id', m.id)
    : await supabase.from('medicacoes').insert(linha);
  if (error) throw traduzirErro(error);
}

/** Interromper preenche `ate` com hoje; reativar limpa. */
export async function alternarAtiva(id: string, ativa: boolean): Promise<void> {
  const { error } = await supabase
    .from('medicacoes')
    .update({ ativa, ate: ativa ? null : new Date().toISOString().slice(0, 10) })
    .eq('id', id);
  if (error) throw traduzirErro(error);
}

/**
 * Tomadas de `desde` a `ate` ('AAAA-MM-DD', inclusive): as de dose prevista nesses dias e as avulsas
 * ("se precisar") marcadas nesses dias, no fuso local. Ordenadas por `marcadoEm`.
 */
export async function listarTomadas(userId: string, desde: string, ate: string): Promise<Tomada[]> {
  const [previstas, avulsas] = await Promise.all([
    paginar(() =>
      supabase
        .from('tomadas_medicacao')
        .select('*')
        .eq('user_id', userId)
        .gte('data_prevista', desde)
        .lte('data_prevista', ate),
    ),
    paginar(() =>
      supabase
        .from('tomadas_medicacao')
        .select('*')
        .eq('user_id', userId)
        .is('data_prevista', null)
        .gte('marcado_em', meiaNoiteLocal(desde))
        .lt('marcado_em', meiaNoiteLocal(ate, 1)),
    ),
  ]);
  return [...previstas, ...avulsas]
    .map(paraTomada)
    .sort((x, y) => Date.parse(x.marcadoEm) - Date.parse(y.marcadoEm));
}

/** Tamanho da página: o PostgREST corta cada resposta em `max_rows` (1000, supabase/config.toml). */
const PAGINA = 1000;

/** Busca todas as páginas (ordem estável por marcado_em, id) até vir uma página incompleta. */
async function paginar(
  consulta: () => {
    order: (coluna: string) => {
      order: (coluna: string) => {
        range: (de: number, ate: number) => PromiseLike<{ data: Tables<'tomadas_medicacao'>[] | null; error: unknown }>;
      };
    };
  },
): Promise<Tables<'tomadas_medicacao'>[]> {
  const linhas: Tables<'tomadas_medicacao'>[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await consulta().order('marcado_em').order('id').range(de, de + PAGINA - 1);
    if (error) throw traduzirErro(error);
    linhas.push(...(data ?? []));
    if (!data || data.length < PAGINA) return linhas;
  }
}

/** Grava uma marca; `marcado_em` é a hora do banco (agora). */
export async function registrarTomada(userId: string, t: NovaTomada): Promise<void> {
  const { error } = await supabase.from('tomadas_medicacao').insert({
    user_id: userId,
    medicacao_id: t.medicacaoId,
    data_prevista: t.dataPrevista,
    hora_prevista: t.horaPrevista,
    quantidade_prevista: t.quantidadePrevista,
    tomou: t.tomou,
    quantidade: t.quantidade,
  });
  if (error) throw traduzirErro(error);
}

/** "Corrigir": apaga as marcas daquela dose e grava a nova. */
export async function substituirTomadas(
  userId: string,
  dose: { medicacaoId: string; dataPrevista: string; horaPrevista: string },
  nova: NovaTomada,
): Promise<void> {
  const { error } = await supabase
    .from('tomadas_medicacao')
    .delete()
    .eq('user_id', userId)
    .eq('medicacao_id', dose.medicacaoId)
    .eq('data_prevista', dose.dataPrevista)
    .eq('hora_prevista', dose.horaPrevista);
  if (error) throw traduzirErro(error);
  await registrarTomada(userId, nova);
}
