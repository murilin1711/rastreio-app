import { useCallback, useEffect, useMemo, useState } from 'react';
import { checkinPendente, mediasMensais, semanaDoCheckin } from '@core/regras/bemestar/checkin';
import type { Checkin } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import * as repo from './checkins';
import { hojeLocalISO } from './useAtividades';
import { aoResponderCheckin } from './lembretesCheckin';

/** Check-in semanal (§86–§87). */
export function useCheckin() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try { setCheckins(await repo.listarCheckins(userId)); } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const hoje = hojeLocalISO();
  const semanaAlvo = semanaDoCheckin(hoje);
  const atual = useMemo(() => checkins.find((c) => c.semana === semanaAlvo) ?? null, [checkins, semanaAlvo]);
  const pendente = useMemo(() => checkinPendente(checkins, hoje), [checkins, hoje]);
  const meses = useMemo(() => mediasMensais(checkins), [checkins]);

  const salvar = async (c: Omit<Checkin, 'id' | 'semana'>) => { if (!userId) throw new Error('Sessão indisponível'); await repo.salvarCheckin(userId, { ...c, semana: semanaAlvo }); aoResponderCheckin(userId, semanaAlvo).catch(() => {}); await recarregar(); };

  return { checkins, semanaAlvo, atual, pendente, meses, carregando, erro, salvar, recarregar };
}
