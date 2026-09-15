import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import { paraBanco, paraDominio } from './mapeamento';
import type { AntecedenteFamiliar, PerfilSaude } from './tipos';

export async function obterPerfil(userId: string): Promise<PerfilSaude> {
  const { data, error } = await supabase.from('perfil_saude').select('*').eq('user_id', userId).single();
  if (error) throw traduzirErro(error);
  return paraDominio(data);
}

export async function salvarPerfil(userId: string, dados: Partial<Omit<PerfilSaude, 'userId'>>): Promise<void> {
  const { error } = await supabase.from('perfil_saude').update(paraBanco(dados)).eq('user_id', userId);
  if (error) throw traduzirErro(error);
}

export async function listarAntecedentes(userId: string): Promise<AntecedenteFamiliar[]> {
  const { data, error } = await supabase
    .from('antecedentes_familiares')
    .select('*')
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw traduzirErro(error);
  return data.map((a) => ({
    id: a.id,
    parentesco: a.parentesco as AntecedenteFamiliar['parentesco'],
    grau: a.grau as AntecedenteFamiliar['grau'],
    condicao: a.condicao as AntecedenteFamiliar['condicao'],
    idadeDiagnostico: a.idade_diagnostico,
    observacao: a.observacao,
  }));
}

export async function salvarAntecedente(userId: string, a: Omit<AntecedenteFamiliar, 'id'> & { id?: string }): Promise<void> {
  const linha = {
    user_id: userId,
    parentesco: a.parentesco,
    grau: a.grau,
    condicao: a.condicao,
    idade_diagnostico: a.idadeDiagnostico,
    observacao: a.observacao,
  };
  const { error } = a.id
    ? await supabase.from('antecedentes_familiares').update(linha).eq('id', a.id)
    : await supabase.from('antecedentes_familiares').insert(linha);
  if (error) throw traduzirErro(error);
}

export async function excluirAntecedente(id: string): Promise<void> {
  const { error } = await supabase.from('antecedentes_familiares').delete().eq('id', id);
  if (error) throw traduzirErro(error);
}
