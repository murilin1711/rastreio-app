import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePerfil } from '@core/perfil/usePerfil';
import { avaliarGlicemia, metasPara, resumoGlicemia } from '@core/regras/cardio/glicemia';
import { extrairParametrosGlicemia } from '@core/regras/cardio/parametrosGlicemia';
import type { AvaliacaoGlicemia, MedidaGlicemia, Metas, ParametrosGlicemia, PerfilGlicemia } from '@core/regras/cardio/tiposGlicemia';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { traduzirErro } from '@core/supabase/erros';
import * as repo from './glicemia';
import { carregarRegrasCardio } from './regras';
import { diasAtrasISO } from './usePressao';

export interface EntradaGlicemia { medidoEm: string; mgdl: number; momento: MedidaGlicemia['momento']; contexto: MedidaGlicemia['contexto']; observacao?: string }

/** Minha Glicemia (§5–§8, C-012): medidas dos últimos 90 dias, metas pelo perfil/médico, avaliação em camadas. */
export function useGlicemia() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const { perfil, recarregar: recarregarPerfil } = usePerfil();
  const [medidas, setMedidas] = useState<MedidaGlicemia[]>([]);
  const [parametros, setParametros] = useState<ParametrosGlicemia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [ms, regras] = await Promise.all([repo.listarGlicemia(userId, { desde: diasAtrasISO(90) }), carregarRegrasCardio('glicemia')]);
      setMedidas(ms);
      setParametros(extrairParametrosGlicemia(regras));
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }, [userId]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const perfilGli: PerfilGlicemia | null = perfil
    ? { temDiabetes: perfil.temDiabetes, tipoDiabetes: perfil.tipoDiabetes, usaInsulina: perfil.usaInsulina, perfilMetaGlicemica: perfil.perfilMetaGlicemica, metasGlicemia: perfil.metasGlicemia }
    : null;
  const metas: Metas | null = useMemo(() => (perfilGli && parametros ? metasPara(perfilGli, parametros) : null), [perfilGli, parametros]);
  const resumo7 = useMemo(() => resumoGlicemia(medidas.filter((m) => m.medidoEm >= diasAtrasISO(7)), metas), [medidas, metas]);

  const avaliar = (m: { mgdl: number; momento: MedidaGlicemia['momento']; sintomas?: MedidaGlicemia['contexto']['sintomas'] }): AvaliacaoGlicemia | null =>
    perfilGli && parametros ? avaliarGlicemia(m, perfilGli, metas, parametros) : null;

  /** Devolve o id da medida (para o vínculo com refeição/atividade, C-020) e a avaliação pelas regras. */
  const registrar = async (e: EntradaGlicemia): Promise<{ id: string; avaliacao: AvaliacaoGlicemia }> => {
    if (!userId || !parametros || !perfilGli) throw new Error('Sessão ou regras indisponíveis');
    const id = await repo.inserirGlicemia(userId, e);
    await recarregar();
    return { id, avaliacao: avaliarGlicemia({ mgdl: e.mgdl, momento: e.momento, sintomas: e.contexto.sintomas }, perfilGli, metas, parametros) };
  };

  return { medidas, parametros, perfil, perfilGli, metas, resumo7, carregando, erro, avaliar, registrar, recarregar: async () => { await Promise.all([recarregar(), recarregarPerfil()]); } };
}
