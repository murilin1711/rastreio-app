import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { classificarDoses, type DoseClassificada } from './adesao';
import * as repo from './repositorio';

/** 'AAAA-MM-DD' do dia local. */
function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Todas as doses de hoje dos remédios ativos com horário (com ou sem lembrete), classificadas e
 * ordenadas por hora. Quem quer só as que já chegaram filtra (a Home faz isso em `montarItensHoje`).
 * Falha na carga não rejeita: vira `erro` (e `recarregar` também resolve).
 */
export function useDosesHoje(): { doses: DoseClassificada[]; carregando: boolean; erro: string | null; recarregar: () => Promise<void> } {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [doses, setDoses] = useState<DoseClassificada[]>([]);
  const [carregando, setCarregando] = useState(true);
  /** Mensagem pronta quando a carga falhou: a tela mostra o erro e "Tentar de novo", não uma lista vazia. */
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const agora = new Date();
      const hoje = diaLocal(agora);
      const [medicacoes, tomadas] = await Promise.all([repo.listarMedicacoes(userId), repo.listarTomadas(userId, hoje, hoje)]);
      const todas = medicacoes
        .filter((m) => m.ativa)
        .flatMap((m) => classificarDoses(m, tomadas, hoje, hoje, agora))
        .sort((a, b) => a.hora.localeCompare(b.hora));
      setDoses(todas);
    } catch (e) {
      setErro(traduzirErro(e).mensagemUsuario);
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { doses, carregando, erro, recarregar };
}
