import { useCallback, useEffect, useMemo, useState } from 'react';
import { classificarMedidaSessao, diaDaSessao, montarRelatorio, podeConcluir } from '@core/regras/cardio/mrpa';
import { extrairParametros } from '@core/regras/cardio/parametros';
import type { MedidaPA, ParametrosPressao, PeriodoMrpa, RelatorioMrpa, SessaoMrpa } from '@core/regras/cardio/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { traduzirErro } from '@core/supabase/erros';
import { agendarLembretesMrpa, cancelarLembretes } from './lembretesCardio';
import type { SessaoComResultado } from './mapeamento';
import * as medidasRepo from './medidas';
import { carregarRegrasCardio } from './regras';
import * as sessoesRepo from './sessoesMrpa';
import { hojeISO } from './usePressao';

export interface TrioEntrada { pas: number; pad: number; fc: number | null; medidoEm: string }

/** MRPA (§2–§3, C-011): sessão ativa (ou a indicada por id), suas medidas e o relatório parcial/final. */
export function useMrpa(sessaoId?: string) {
  const { sessao: auth } = useSessao();
  const userId = auth?.user.id;
  const [sessao, setSessao] = useState<SessaoComResultado | null>(null);
  const [medidas, setMedidas] = useState<MedidaPA[]>([]);
  const [parametros, setParametros] = useState<ParametrosPressao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const regras = await carregarRegrasCardio('pressao');
      setParametros(extrairParametros(regras));
      const s = sessaoId ? await sessoesRepo.buscarSessao(userId, sessaoId) : await sessoesRepo.sessaoAtiva(userId).then((a) => (a ? { ...a, resultado: null, concluidaEm: null } : null));
      setSessao(s);
      setMedidas(s ? await medidasRepo.listarPA(userId, { sessaoId: s.id }) : []);
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }, [userId, sessaoId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const hoje = hojeISO();
  const dia = sessao ? diaDaSessao(sessao, hoje) : 0;
  const concluivel = sessao ? podeConcluir(sessao, hoje) : false;
  const relatorioParcial = useMemo<RelatorioMrpa | null>(() => (sessao && parametros ? montarRelatorio(sessao, medidas, parametros) : null), [sessao, medidas, parametros]);

  const iniciar = async (e: { inicio: string; diasPrevistos: 4 | 5 | 6; horarios: SessaoMrpa['horarios']; paConsultorio: SessaoMrpa['paConsultorio'] }): Promise<SessaoMrpa> => {
    if (!userId) throw new Error('Sessão indisponível');
    const s = await sessoesRepo.iniciarSessao(userId, e);
    await agendarLembretesMrpa(userId, s);
    await recarregar();
    return s;
  };

  const registrarTrio = async (periodo: PeriodoMrpa, trio: TrioEntrada[]): Promise<void> => {
    if (!userId || !sessao || !parametros) throw new Error('Sessão indisponível');
    await medidasRepo.inserirLoteMrpa(userId, sessao.id, periodo, trio.map((m) => ({ ...m, ...classificarMedidaSessao(m, parametros) })));
    await recarregar();
  };

  const concluir = async (): Promise<RelatorioMrpa> => {
    if (!userId || !sessao || !parametros) throw new Error('Sessão indisponível');
    const r = await sessoesRepo.concluirSessao(userId, sessao, medidas, parametros);
    await cancelarLembretes(userId, `mrpa:${sessao.id}:`);
    await recarregar();
    return r;
  };

  const cancelar = async (): Promise<void> => {
    if (!userId || !sessao) return;
    await sessoesRepo.cancelarSessao(userId, sessao.id);
    await cancelarLembretes(userId, `mrpa:${sessao.id}:`);
    await recarregar();
  };

  return { sessao, medidas, parametros, dia, podeConcluir: concluivel, relatorioParcial, carregando, erro, iniciar, registrarTrio, concluir, cancelar, recarregar };
}
