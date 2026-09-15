import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import * as repo from './repositorio';
import type { AntecedenteFamiliar, PerfilSaude } from './tipos';

export function usePerfil() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [perfil, setPerfil] = useState<PerfilSaude | null>(null);
  const [antecedentes, setAntecedentes] = useState<AntecedenteFamiliar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [p, a] = await Promise.all([repo.obterPerfil(userId), repo.listarAntecedentes(userId)]);
      setPerfil(p);
      setAntecedentes(a);
    } catch (e) {
      setErro(e as ErroNero);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const salvar = async (dados: Partial<Omit<PerfilSaude, 'userId'>>) => {
    if (!userId) return;
    await repo.salvarPerfil(userId, dados);
    setPerfil((p) => (p ? { ...p, ...dados } : p));
  };

  const salvarAntecedente = async (a: Omit<AntecedenteFamiliar, 'id'> & { id?: string }) => {
    if (!userId) return;
    await repo.salvarAntecedente(userId, a);
    setAntecedentes(await repo.listarAntecedentes(userId));
  };

  const excluirAntecedente = async (id: string) => {
    await repo.excluirAntecedente(id);
    setAntecedentes((l) => l.filter((x) => x.id !== id));
  };

  return { perfil, antecedentes, carregando, erro, recarregar, salvar, salvarAntecedente, excluirAntecedente };
}
