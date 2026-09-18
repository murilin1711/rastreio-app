import { useCallback, useEffect, useMemo, useState } from 'react';
import { calcularIdade } from '@core/perfil/calculos';
import { usePerfil } from '@core/perfil/usePerfil';
import { resumo30d, resumoSemana, semanaDe } from '@core/regras/bemestar/atividade';
import { extrairParametrosBemEstar } from '@core/regras/bemestar/parametros';
import type { Atividade, ParametrosBemEstar } from '@core/regras/bemestar/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import * as repo from './atividades';
import { carregarRegrasBemEstar } from './regras';
import { useMetas } from './useMetas';

export const hojeLocalISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/** Minhas Atividades (§77–§79): últimos 90 dias + resumo da semana e de 30 dias. */
export function useAtividades() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil } = usePerfil();
  const metas = useMetas();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [parametros, setParametros] = useState<ParametrosBemEstar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregarLista = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [as, regras] = await Promise.all([repo.listarAtividades(userId, { desde: new Date(Date.now() - 90 * 86_400_000).toISOString() }), carregarRegrasBemEstar()]);
      setAtividades(as); setParametros(extrairParametrosBemEstar(regras));
    } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregarLista(); }, [recarregarLista]);
  const recarregar = useCallback(async () => { await Promise.all([recarregarLista(), metas.recarregar()]); }, [recarregarLista, metas.recarregar]);

  const idade = perfil?.dataNascimento ? calcularIdade(perfil.dataNascimento) : null;
  const metaMin = metas.porTipo('atividade_min');
  const semana = useMemo(() => (parametros ? resumoSemana(atividades, semanaDe(hojeLocalISO()), parametros, idade, metaMin) : null), [atividades, parametros, idade, metaMin]);
  const trintaDias = useMemo(() => resumo30d(atividades, hojeLocalISO()), [atividades]);

  const inserir = async (a: Omit<Atividade, 'id'>) => { if (!userId) throw new Error('Sessão indisponível'); await repo.inserirAtividade(userId, a); await recarregarLista(); };
  const excluir = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.excluirAtividade(userId, id); await recarregarLista(); };

  return { atividades, semana, trintaDias, parametros, metas, carregando, erro, inserir, excluir, recarregar };
}
