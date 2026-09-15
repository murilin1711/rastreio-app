import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import * as repo from './repositorio';
import type { Medicacao } from './tipos';

export function useMedicacoes() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [medicacoes, setMedicacoes] = useState<Medicacao[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    try {
      setMedicacoes(await repo.listarMedicacoes(userId));
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const salvar = async (m: Omit<Medicacao, 'id'> & { id?: string }) => {
    if (!userId) return;
    await repo.salvarMedicacao(userId, m);
    await recarregar();
  };

  const alternarAtiva = async (id: string, ativa: boolean) => {
    await repo.alternarAtiva(id, ativa);
    await recarregar();
  };

  return { medicacoes, ativas: medicacoes.filter((m) => m.ativa), carregando, salvar, alternarAtiva, recarregar };
}
