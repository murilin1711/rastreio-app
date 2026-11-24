import { useCallback, useEffect, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro } from '@core/supabase/erros';
import { classificarDoses, podeMarcar, type DoseClassificada } from './adesao';
import * as repo from './repositorio';

/** 'AAAA-MM-DD' do dia local. */
function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function ontemDe(d: Date): string {
  return diaLocal(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1));
}

/**
 * Todas as doses de hoje dos remédios ativos com horário (com ou sem lembrete), classificadas e
 * ordenadas por hora. Quem quer só as que já chegaram filtra (a Home faz isso em `montarItensHoje`).
 * Falha na carga não rejeita: vira `erro` (e `recarregar` também resolve).
 *
 * `incluirOntem` (lista "Tomei remédio"): busca também ontem e devolve em `dosesOntem` as doses de ontem
 * ainda sem marca — podem ser marcadas até o fim de hoje (spec §6.4). Sem a opção, `dosesOntem` é vazia.
 */
export function useDosesHoje(opcoes: { incluirOntem?: boolean } = {}): {
  doses: DoseClassificada[];
  dosesOntem: DoseClassificada[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
} {
  const incluirOntem = !!opcoes.incluirOntem;
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [doses, setDoses] = useState<DoseClassificada[]>([]);
  const [dosesOntem, setDosesOntem] = useState<DoseClassificada[]>([]);
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
      const desde = incluirOntem ? ontemDe(agora) : hoje;
      const [medicacoes, tomadas] = await Promise.all([repo.listarMedicacoes(userId), repo.listarTomadas(userId, desde, hoje)]);
      const todas = medicacoes
        .filter((m) => m.ativa)
        .flatMap((m) => classificarDoses(m, tomadas, desde, hoje, agora))
        .sort((a, b) => a.hora.localeCompare(b.hora));
      setDoses(todas.filter((d) => d.data === hoje));
      setDosesOntem(todas.filter((d) => d.data !== hoje && d.estado === 'pendente' && podeMarcar(d.data, agora)));
    } catch (e) {
      setErro(traduzirErro(e).mensagemUsuario);
    } finally {
      setCarregando(false);
    }
  }, [userId, incluirOntem]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return { doses, dosesOntem, carregando, erro, recarregar };
}
