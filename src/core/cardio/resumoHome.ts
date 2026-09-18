import { diaDaSessao, dataDoDia } from '@core/regras/cardio/mrpa';
import { extrairParametros } from '@core/regras/cardio/parametros';
import { avaliarMedidaCasual } from '@core/regras/cardio/pressao';
import type { ResumoCardio } from '@modules/home/montarItensHoje';
import { supabase } from '@core/supabase/client';
import { traduzirErro } from '@core/supabase/erros';
import * as medidasRepo from './medidas';
import { carregarRegrasCardio } from './regras';
import * as sessoesRepo from './sessoesMrpa';
import { avaliarGlicemia, metasPara } from '@core/regras/cardio/glicemia';
import { extrairParametrosGlicemia } from '@core/regras/cardio/parametrosGlicemia';
import type { FontesCheckup } from '@core/regras/cardio/tiposRisco';
import type { PerfilSaude } from '@core/perfil/tipos';
import * as perfilRepo from '@core/perfil/repositorio';
import { ultimoPorTipo } from './examesCardio';
import { listarGlicemia } from './glicemia';
import { avaliarCheckup } from '@core/regras/cardio/checkup';
import { extrairParametrosRisco } from '@core/regras/cardio/parametrosRisco';

const ROTULO_MOMENTO_CURTO: Record<string, string> = { jejum: 'em jejum', antes_cafe: 'antes do café', antes_almoco: 'antes do almoço', antes_jantar: 'antes do jantar', antes_dormir: 'antes de dormir', pos_cafe_2h: '2 h após o café', pos_almoco_2h: '2 h após o almoço', pos_jantar_2h: '2 h após o jantar' };

/** Fontes do check-up (§24) a partir do banco. */
export async function montarFontesCheckup(userId: string, perfil: PerfilSaude): Promise<FontesCheckup> {
  const desde7 = new Date(Date.now() - 7 * DIA_MS).toISOString();
  const [casuais, sessoes, exames, gli, peso, risco] = await Promise.all([
    medidasRepo.listarPA(userId, { sessaoId: null, desde: desde7 }),
    sessoesRepo.listarSessoes(userId),
    ultimoPorTipo(userId, ['colesterol_total', 'hdl', 'ldl', 'creatinina', 'tfg', 'hba1c']),
    listarGlicemia(userId, { limite: 1 }),
    supabase.from('medidas').select('medido_em').eq('user_id', userId).eq('tipo', 'peso').order('medido_em', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('riscos_cv').select('calculado_em').eq('user_id', userId).order('calculado_em', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const mrpa = sessoes.find((s) => s.status === 'concluida' && s.resultado?.valido);
  const lip = [exames.colesterol_total, exames.hdl, exames.ldl].filter(Boolean).map((e) => e!.dataRealizacao).sort().pop() ?? null;
  const renal = [exames.creatinina, exames.tfg].filter(Boolean).map((e) => e!.dataRealizacao).sort().pop() ?? null;
  const gliData = [exames.hba1c?.dataRealizacao ?? null, gli[0]?.medidoEm.slice(0, 10) ?? null].filter(Boolean).sort().pop() ?? null;
  return {
    pa: mrpa?.concluidaEm ? { data: mrpa.concluidaEm.slice(0, 10), ehMrpa: true, nCasual7d: casuais.length } : { data: casuais[0]?.medidoEm.slice(0, 10) ?? null, ehMrpa: false, nCasual7d: casuais.filter((m) => !m.contexto.excluida).length },
    peso: peso.data?.medido_em.slice(0, 10) ?? null,
    // Tabagismo é confirmado com um toque a cada cálculo de risco (C-014); no check-up conta como atualizado se está preenchido.
    tabagismoAtualizadoEm: perfil.tabagismoStatus ? new Date().toISOString().slice(0, 10) : null,
    glicemiaOuHba1c: gliData,
    lipidios: lip,
    renal,
    atividadeFisica: null,
    risco: risco.data?.calculado_em.slice(0, 10) ?? null,
  };
}


const DIA_MS = 86_400_000;

/** Marca o relatório de uma sessão como lido (some da Home). Evento de sistema em `lembretes`, já lido. */
export async function marcarRelatorioLido(userId: string, sessaoId: string): Promise<void> {
  const { data } = await supabase.from('lembretes').select('id').eq('user_id', userId).eq('titulo', `mrpa_lida:${sessaoId}`).limit(1).maybeSingle();
  if (data) return;
  const { error } = await supabase.from('lembretes').insert({ user_id: userId, origem_tipo: 'sistema', origem_id: sessaoId, agendado_para: new Date().toISOString(), titulo: `mrpa_lida:${sessaoId}`, mensagem: 'Relatório da MRPA aberto', status: 'lido' });
  if (error) throw traduzirErro(error);
}

/** Dados do módulo cardio para `montarItensHoje` (Fase 2a). */
export async function montarResumoCardio(userId: string, hoje = new Date().toISOString().slice(0, 10)): Promise<ResumoCardio> {
  const [regras, ultimas, ativa, sessoes] = await Promise.all([
    carregarRegrasCardio('pressao'),
    medidasRepo.listarPA(userId, { sessaoId: null, limite: 1 }),
    sessoesRepo.sessaoAtiva(userId),
    sessoesRepo.listarSessoes(userId),
  ]);
  const p = extrairParametros(regras);

  const u = ultimas[0];
  const ultimaPA = u
    ? (() => {
        const av = avaliarMedidaCasual(u, u.contexto.sintomas ?? [], p);
        return { pas: u.pas, pad: u.pad, medidoEm: u.medidoEm, nivel: av.nivel === 'laranja' || av.nivel === 'vermelho' ? av.nivel : null };
      })()
    : null;

  let mrpaAtiva: ResumoCardio['mrpaAtiva'] = null;
  if (ativa) {
    const dia = diaDaSessao(ativa, hoje);
    const doDia = dia >= 1 && dia <= ativa.diasPrevistos ? await medidasRepo.listarPA(userId, { sessaoId: ativa.id, desde: `${dataDoDia(ativa, dia)}T00:00:00` }) : [];
    const conta = (periodo: 'manha' | 'noite') => doDia.filter((m) => m.medidoEm.slice(0, 10) === dataDoDia(ativa, dia) && m.contexto.periodo === periodo).length;
    const faltaHoje = (['manha', 'noite'] as const).filter((per) => conta(per) < 3);
    mrpaAtiva = { id: ativa.id, dia, diasPrevistos: ativa.diasPrevistos, faltaHoje };
  }

  let mrpaAcimaSemLeitura: ResumoCardio['mrpaAcimaSemLeitura'] = null;
  const recente = sessoes.find((s) => s.status === 'concluida' && s.resultado?.valido && s.resultado.acimaReferencia && s.concluidaEm && Date.now() - Date.parse(s.concluidaEm) < 30 * DIA_MS);
  if (recente?.concluidaEm) {
    const { data } = await supabase.from('lembretes').select('id').eq('user_id', userId).eq('titulo', `mrpa_lida:${recente.id}`).limit(1).maybeSingle();
    if (!data) mrpaAcimaSemLeitura = { id: recente.id, concluidaEm: recente.concluidaEm };
  }

  // Fase 2b: glicemia, plano do dia e check-up
  let glicemia: ResumoCardio['glicemia'] = null;
  let planoVencidoHoje: ResumoCardio['planoVencidoHoje'] = null;
  let checkup: ResumoCardio['checkup'] = null;
  try {
    const perfil = await perfilRepo.obterPerfil(userId);
    if (perfil) {
      const [regrasG, regrasR, gli] = await Promise.all([carregarRegrasCardio('glicemia'), carregarRegrasCardio('risco_cv'), listarGlicemia(userId, { desde: `${hoje}T00:00:00`, limite: 50 })]);
      const pg = extrairParametrosGlicemia(regrasG);
      const perfilGli = { temDiabetes: perfil.temDiabetes, tipoDiabetes: perfil.tipoDiabetes, usaInsulina: perfil.usaInsulina, perfilMetaGlicemica: perfil.perfilMetaGlicemica, metasGlicemia: perfil.metasGlicemia };
      const ultimaG = (await listarGlicemia(userId, { limite: 1 }))[0];
      if (ultimaG) {
        const av = avaliarGlicemia({ mgdl: ultimaG.mgdl, momento: ultimaG.momento, sintomas: ultimaG.contexto.sintomas }, perfilGli, metasPara(perfilGli, pg), pg);
        glicemia = { mgdl: ultimaG.mgdl, medidoEm: ultimaG.medidoEm, nivel: av.nivel === 'laranja' || av.nivel === 'vermelho' ? av.nivel : null };
      }
      const agora = new Date();
      const horaAgora = `${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;
      const vencido = (perfil.planoGlicemia?.horarios ?? []).find((h) => h.hora <= horaAgora && !gli.some((g) => g.momento === h.momento));
      if (vencido) planoVencidoHoje = { momento: vencido.momento, rotulo: ROTULO_MOMENTO_CURTO[vencido.momento] ?? vencido.momento, hora: vencido.hora };
      const ck = avaliarCheckup(await montarFontesCheckup(userId, perfil), { temDiabetes: perfil.temDiabetes }, hoje, extrairParametrosRisco(regrasR));
      checkup = { atualizados: ck.atualizados, total: ck.total, faltante: ck.itens.find((i) => !i.atualizado)?.frase ?? null };
    }
  } catch {
    // a Home segue sem o bloco 2b
  }

  return { ultimaPA, mrpaAtiva, mrpaAcimaSemLeitura, glicemia, planoVencidoHoje, checkup };
}
