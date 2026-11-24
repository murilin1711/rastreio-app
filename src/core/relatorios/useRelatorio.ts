import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSessao } from '@core/sessao/SessaoProvider';
import { traduzirErro, type ErroNero } from '@core/supabase/erros';
import { carregarDadosNero, periodoDias } from './carregar';
import { htmlRelatorio } from './html';
import { montarPainel } from './painel';
import { montarBemEstar, montarCardio, montarConsulta, montarGeral, montarOncologico, tituloRelatorio } from './montar';
import type { ChaveSecao, DadosNero, Especialidade, PainelRelatorio, SecaoRelatorio, TipoRelatorio } from './tipos';

export interface ParametrosRelatorio { tipo: TipoRelatorio; dias: 30 | 90 | 180; especialidade?: Especialidade; apenas?: ChaveSecao[] }

/**
 * Carrega os dados uma vez e monta painel (página 1, D-067) + seções + HTML (com ou sem QR) para a prévia, o PDF
 * e o compartilhamento. Todo PDF gerado no app sai daqui com o painel; nunca com a opção `tela` (só `htmlTela`, a página do QR).
 */
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
      case 'bemestar': return montarBemEstar(dados, periodo);
    }
  }, [dados, p.tipo, p.especialidade, apenasChave, periodo]);

  const painel: PainelRelatorio | null = useMemo(() => {
    if (!dados) return null;
    return montarPainel(dados, { tipo: p.tipo, especialidade: p.especialidade, apenas: apenasChave ? (apenasChave.split(',') as ChaveSecao[]) : undefined, periodo });
  }, [dados, p.tipo, p.especialidade, apenasChave, periodo]);

  /** Data de geração dos dados (`carregarDadosNero`): a mesma do painel, da adesão e do rodapé do PDF. */
  const geradoEm = dados?.geradoEm ?? '';
  const titulo = tituloRelatorio(p.tipo, p.especialidade);
  const html = useCallback((qrSvg?: string, validadeQr?: string) => {
    if (!dados) return '';
    return htmlRelatorio({ tipo: p.tipo, titulo, paciente: { nome: dados.perfil.nome, nascimento: dados.perfil.dataNascimento }, periodo, secoes, painel, geradoEm: dados.geradoEm, qrSvg, validadeQr });
  }, [dados, p.tipo, titulo, periodo, secoes, painel]);
  /** HTML da página do QR no celular do médico (`/r/`): o mesmo relatório, com o painel e os estilos de tela, sem QR. */
  const htmlTela = useCallback(() => {
    if (!dados) return '';
    return htmlRelatorio({ tipo: p.tipo, titulo, paciente: { nome: dados.perfil.nome, nascimento: dados.perfil.dataNascimento }, periodo, secoes, painel, geradoEm: dados.geradoEm, tela: true });
  }, [dados, p.tipo, titulo, periodo, secoes, painel]);

  return { dados, painel, geradoEm, secoes, titulo, periodo, html, htmlTela, carregando, erro, recarregar };
}
