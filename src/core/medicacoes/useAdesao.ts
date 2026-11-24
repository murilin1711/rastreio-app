import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { resumirAdesao, type ResumoAdesao } from './adesao';
import * as repo from './repositorio';

/**
 * Resumo de adesão de `desde` a `ate` ('AAAA-MM-DD', inclusive), por remédio (check-in semanal, spec §6.6).
 * Remédio interrompido sem data de fim não entra (não há como saber até quando valiam as doses).
 * Falha na carga não rejeita: vira `erro` e a tela mostra "Tentar de novo", não um quadro vazio.
 */
export function useAdesao(desde: string, ate: string): {
  resumos: ResumoAdesao[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
} {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [resumos, setResumos] = useState<ResumoAdesao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [medicacoes, tomadas] = await Promise.all([repo.listarMedicacoes(userId), repo.listarTomadas(userId, desde, ate)]);
      const validas = medicacoes.filter((m) => m.ativa || m.ate !== null);
      setResumos(resumirAdesao(validas, tomadas, desde, ate, new Date()));
    } catch (e) {
      setResumos([]);
      setErro(traduzirErro(e).mensagemUsuario);
    } finally {
      setCarregando(false);
    }
  }, [userId, desde, ate]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { resumos, carregando, erro, recarregar };
}
