import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import * as repo from './consultas';
import type { Consulta } from './tipos';

export function useConsultas() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try { setConsultas(await repo.listarConsultas(userId)); } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const salvar = async (c: Parameters<typeof repo.salvarConsulta>[1]) => { if (!userId) throw new Error('Sessão indisponível'); const s = await repo.salvarConsulta(userId, c); await recarregar(); return s; };
  const excluir = async (id: string) => { if (!userId) throw new Error('Sessão indisponível'); await repo.excluirConsulta(userId, id); await recarregar(); };

  const agora = Date.now();
  const futuras = consultas.filter((c) => Date.parse(c.dataHora) >= agora).sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  const passadas = consultas.filter((c) => Date.parse(c.dataHora) < agora);
  return { consultas, futuras, passadas, proxima: futuras[0] ?? null, carregando, erro, salvar, excluir, recarregar };
}
