import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { agendarLembretesMedicacao, cancelarLembretes } from '@core/cardio/lembretesCardio';
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

  /** §21: lembrete local nos horários quando `lembrar` e ativa; caso contrário cancela os pendentes. */
  const ajustarLembretes = async (m: Medicacao) => {
    if (!userId) return;
    if (m.ativa && m.lembrar && m.horarios.length) await agendarLembretesMedicacao(userId, m);
    else await cancelarLembretes(userId, `medicacao:${m.id}:`);
  };

  const salvar = async (m: Omit<Medicacao, 'id'> & { id?: string }) => {
    if (!userId) return;
    await repo.salvarMedicacao(userId, m);
    const lista = await repo.listarMedicacoes(userId);
    setMedicacoes(lista);
    const salva = m.id ? lista.find((x) => x.id === m.id) : lista.find((x) => x.nome === m.nome && x.ativa);
    if (salva) await ajustarLembretes(salva).catch(() => {});
  };

  const alternarAtiva = async (id: string, ativa: boolean) => {
    await repo.alternarAtiva(id, ativa);
    const lista = await repo.listarMedicacoes(userId!);
    setMedicacoes(lista);
    const m = lista.find((x) => x.id === id);
    if (m) await ajustarLembretes(m).catch(() => {});
  };

  return { medicacoes, ativas: medicacoes.filter((m) => m.ativa), carregando, salvar, alternarAtiva, recarregar };
}
