import { useCallback, useEffect, useMemo, useState } from 'react';
import { extrairParametros } from '@core/regras/cardio/parametros';
import { avaliarMedidaCasual, deveConvidarMrpa, resumoCasual, validarPlausibilidade } from '@core/regras/cardio/pressao';
import type { AvaliacaoPA, MedidaPA, ParametrosPressao, SintomaPA } from '@core/regras/cardio/tipos';
import { useSessao } from '@core/sessao/SessaoProvider';
import type { ErroNero } from '@core/supabase/erros';
import { traduzirErro } from '@core/supabase/erros';
import * as medidasRepo from './medidas';
import { carregarRegrasCardio } from './regras';

export const diasAtrasISO = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
export const hojeISO = () => new Date().toISOString().slice(0, 10);

export interface EntradaPA {
  medidoEm: string;
  pas: number;
  pad: number;
  fc: number | null;
  contexto: MedidaPA['contexto'];
  observacao?: string;
  sintomas: SintomaPA[];
}

/** Minha Pressão (§1, C-010): medidas casuais dos últimos 90 dias, parâmetros das regras e convite para MRPA. */
export function usePressao() {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [medidas, setMedidas] = useState<MedidaPA[]>([]);
  const [parametros, setParametros] = useState<ParametrosPressao | null>(null);
  const [ultimoConvite, setUltimoConvite] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try {
      const [ms, regras, convite] = await Promise.all([
        medidasRepo.listarPA(userId, { desde: diasAtrasISO(90), sessaoId: null }),
        carregarRegrasCardio('pressao'),
        medidasRepo.ultimoConviteMrpaEm(userId),
      ]);
      setMedidas(ms);
      setParametros(extrairParametros(regras));
      setUltimoConvite(convite);
    } catch (e) {
      setErro(traduzirErro(e));
    } finally {
      setCarregando(false);
    }
  }, [userId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const resumo7 = useMemo(() => resumoCasual(medidas.filter((m) => m.medidoEm >= diasAtrasISO(7))), [medidas]);
  const resumo30 = useMemo(() => resumoCasual(medidas.filter((m) => m.medidoEm >= diasAtrasISO(30))), [medidas]);
  const convidarMrpa = useMemo(() => (parametros ? deveConvidarMrpa(medidas, ultimoConvite, hojeISO(), parametros) : false), [medidas, ultimoConvite, parametros]);

  /** A tela já pediu confirmação se implausível; aqui grava e devolve a avaliação em camadas. */
  const registrar = async (e: EntradaPA): Promise<AvaliacaoPA> => {
    if (!userId || !parametros) throw new Error('Sessão ou regras indisponíveis');
    const implausivel = validarPlausibilidade(e, parametros) !== null;
    await medidasRepo.inserirPACasual(userId, {
      medidoEm: e.medidoEm,
      pas: e.pas,
      pad: e.pad,
      fc: e.fc,
      observacao: e.observacao,
      contexto: { ...e.contexto, ...(e.sintomas.length ? { sintomas: e.sintomas } : {}), ...(implausivel ? { implausivelConfirmada: true } : {}) },
    });
    await recarregar();
    return avaliarMedidaCasual(e, e.sintomas, parametros);
  };

  const dispensarConvite = async () => {
    if (!userId) return;
    await medidasRepo.registrarConviteMrpa(userId);
    await recarregar();
  };

  return { medidas, parametros, resumo7, resumo30, convidarMrpa, carregando, erro, registrar, dispensarConvite, recarregar };
}
