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

  /**
   * Muda a tela na hora e grava depois; se a gravação falhar, devolve os campos ao que eram e repassa
   * o erro (D-040). Esperar o servidor para atualizar fazia a pendência sumir e voltar ao desfazer
   * na Home — no 4G, um piscar bem visível. A reversão toca só os campos desta chamada, para não
   * apagar outra gravação que tenha acontecido no meio.
   */
  const salvar = async (dados: Partial<Omit<PerfilSaude, 'userId'>>) => {
    if (!userId) return;
    // Lidos aqui, e não dentro do setPerfil: o React roda a função do setState quando quer (D-039).
    const anteriores: Partial<PerfilSaude> = perfil
      ? Object.fromEntries(Object.keys(dados).map((k) => [k, perfil[k as keyof PerfilSaude]]))
      : {};
    setPerfil((p) => (p ? { ...p, ...dados } : p));
    try {
      await repo.salvarPerfil(userId, dados);
    } catch (e) {
      setPerfil((p) => (p ? { ...p, ...anteriores } : p));
      throw e;
    }
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
