import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import { carregarDadosNero, periodoDias } from './carregar';
import { htmlRelatorio } from './html';
import { montarCardio, montarConsulta, montarGeral, montarOncologico, tituloRelatorio } from './montar';
import type { ChaveSecao, DadosNero, Especialidade, SecaoRelatorio, TipoRelatorio } from './tipos';

export interface ParametrosRelatorio { tipo: TipoRelatorio; dias: 30 | 90 | 180; especialidade?: Especialidade; apenas?: ChaveSecao[] }

/** Carrega os dados uma vez e monta seções + HTML (com ou sem QR) para a prévia, o PDF e o compartilhamento. */
export function useRelatorio(p: ParametrosRelatorio) {
  const { sessao } = useSessao();
  const userId = sessao?.user.id;
  const [dados, setDados] = useState<DadosNero | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<ErroNero | null>(null);
  const periodo = useMemo(() => periodoDias(p.dias), [p.dias]);
  const apenasChave = p.apenas?.join(',');

  const recarregar = useCallback(async () => {
    if (!userId) return;
    setCarregando(true);
    setErro(null);
    try { setDados(await carregarDadosNero(userId, periodo)); } catch (e) { setErro(traduzirErro(e)); } finally { setCarregando(false); }
  }, [userId, periodo]);
  useEffect(() => { recarregar(); }, [recarregar]);

  const secoes: SecaoRelatorio[] = useMemo(() => {
    if (!dados) return [];
    switch (p.tipo) {
      case 'cardio': return montarCardio(dados, periodo, { apenas: apenasChave ? (apenasChave.split(',') as ChaveSecao[]) : undefined });
      case 'oncologico': return montarOncologico(dados, periodo);
      case 'geral': return montarGeral(dados, periodo);
      case 'consulta': return montarConsulta(dados, p.especialidade ?? 'outra', periodo);
    }
  }, [dados, p.tipo, p.especialidade, apenasChave, periodo]);

  const titulo = tituloRelatorio(p.tipo, p.especialidade);
  const html = useCallback((qrSvg?: string, validadeQr?: string) => {
    if (!dados) return '';
    return htmlRelatorio({ tipo: p.tipo, titulo, paciente: { nome: dados.perfil.nome, nascimento: dados.perfil.dataNascimento }, periodo, secoes, geradoEm: new Date().toISOString(), qrSvg, validadeQr });
  }, [dados, p.tipo, titulo, periodo, secoes]);

  return { dados, secoes, titulo, periodo, html, carregando, erro, recarregar };
}
