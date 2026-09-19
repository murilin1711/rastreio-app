import { type ChaveConquista, type EstadoConquistas } from '@core/regras/bemestar/conquistas';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';

export async function listarConquistas(userId: string): Promise<ChaveConquista[]> {
  const { data, error } = await supabase.from('conquistas').select('chave').eq('user_id', userId);
  if (error) throw traduzirErro(error);
  return data.map((l) => l.chave as ChaveConquista);
}

/**
 * Contagens que decidem as conquistas. Usa `count` sem trazer as linhas, e não a lista dos últimos
 * 30 dias do `useHabitos`: quem tem uma atividade antiga não aparece nessa janela e ganharia de novo
 * uma "primeira vez" que não é a primeira.
 */
export async function contarParaConquistas(
  userId: string,
  perfil: { cadastroInicial: boolean; semMedicacoes: boolean; semAntecedentes: boolean },
): Promise<EstadoConquistas> {
  const contar = async (tabela: 'atividades' | 'checkins') => {
    const { count, error } = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) throw traduzirErro(error);
    return count ?? 0;
  };
  // O sono não tem tabela própria: mora em `medidas` com tipo 'sono'.
  const contarSono = async () => {
    const { count, error } = await supabase.from('medidas').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('tipo', 'sono');
    if (error) throw traduzirErro(error);
    return count ?? 0;
  };
  // Medicações e antecedentes ficam em tabelas próprias: "resolvido" é ter pelo menos um registro
  // OU ter marcado no perfil que não tem nenhum.
  const temLinha = async (tabela: 'medicacoes' | 'antecedentes_familiares') => {
    const { count, error } = await supabase.from(tabela).select('*', { count: 'exact', head: true }).eq('user_id', userId);
    if (error) throw traduzirErro(error);
    return (count ?? 0) > 0;
  };
  const [totalAtividades, totalSono, totalCheckins, temMedicacoes, temAntecedentes] = await Promise.all([
    contar('atividades'), contarSono(), contar('checkins'), temLinha('medicacoes'), temLinha('antecedentes_familiares'),
  ]);
  return {
    cadastroInicial: perfil.cadastroInicial,
    medicacoesResolvidas: temMedicacoes || perfil.semMedicacoes,
    antecedentesResolvidos: temAntecedentes || perfil.semAntecedentes,
    totalAtividades, totalSono, totalCheckins,
  };
}

export async function gravarConquistas(userId: string, chaves: ChaveConquista[]): Promise<void> {
  if (chaves.length === 0) return;
  const { error } = await supabase.from('conquistas').upsert(chaves.map((chave) => ({ user_id: userId, chave })), { onConflict: 'user_id,chave', ignoreDuplicates: true });
  if (error) throw traduzirErro(error);
}
