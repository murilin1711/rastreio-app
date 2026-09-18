import { useCallback, useEffect, useMemo, useState } from 'react';
import { resumoAlimentacaoSemana } from '@core/regras/bemestar/alimentacao';
import { semanaDe } from '@core/regras/bemestar/atividade';
import type { Refeicao } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import * as repo from './refeicoes';
import { hojeLocalISO } from './useAtividades';

const diaLocal = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Minha Alimentação (§74–§76): últimos 90 dias, resumo da semana e últimos 7 dias agrupados. */
export function useAlimentacao() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try { setRefeicoes(await repo.listarRefeicoes(userId, { desde: new Date(Date.now() - 90 * 86_400_000).toISOString() })); } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const semana = useMemo(() => resumoAlimentacaoSemana(refeicoes, semanaDe(hojeLocalISO())), [refeicoes]);
  const ultimos7 = useMemo(() => {
    const desde = new Date(Date.now() - 6 * 86_400_000);
    const limite = `${desde.getFullYear()}-${String(desde.getMonth() + 1).padStart(2, '0')}-${String(desde.getDate()).padStart(2, '0')}`;
    const grupos = new Map<string, Refeicao[]>();
    for (const r of refeicoes) { const d = diaLocal(r.em); if (d < limite) continue; grupos.set(d, [...(grupos.get(d) ?? []), r]); }
    return [...grupos.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([dia, itens]) => ({ dia, itens: itens.sort((a, b) => a.em.localeCompare(b.em)) }));
  }, [refeicoes]);

  const inserir = async (r: Omit<Refeicao, 'id'>) => { if (!userId) throw new Error('Sessão indisponível'); await repo.inserirRefeicao(userId, r); await recarregar(); };
  const excluir = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.excluirRefeicao(userId, id); await recarregar(); };

  return { refeicoes, semana, ultimos7, carregando, erro, inserir, excluir, recarregar };
}
