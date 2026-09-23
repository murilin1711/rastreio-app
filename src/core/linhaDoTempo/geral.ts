import { listarAtividades } from '@core/bemestar/atividades';
import { listarCheckins } from '@core/bemestar/checkins';
import { listarCorporais } from '@core/bemestar/medidasCorporais';
import { listarSono } from '@core/bemestar/sono';
import { montarLinhaDoTempo } from '@core/cardio/linhaDoTempo';
import * as documentos from '@core/documentos/repositorio';
import { ROTULO_TIPO_DOCUMENTO } from '@core/documentos/tipos';
import { listarConsultas } from '@core/lembretes/consultas';
import { listarMedicacoes } from '@core/medicacoes/repositorio';
import { montarContexto } from '@core/rastreando/contexto';
import { resumoResultado } from '@core/rastreando/formato';
import { ROTULO_EXAME, ROTULO_PROGRAMA, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { semanaDe } from '@core/regras/bemestar/atividade';
import { formatarHm } from '@core/regras/bemestar/sono';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { agruparPorAno, itensBemEstar, type AnoGeral, type ItemGeral } from './agrupar';

/** Linha do tempo geral (§60): cardio (já agregada) + exames do Rastreando + medicações + consultas passadas + documentos avulsos. */
export async function montarLinhaDoTempoGeral(userId: string): Promise<AnoGeral[]> {
  const [cardio, ctx, medicacoes, consultas, docs, corporais, sonos, atividades, checkins] = await Promise.all([montarLinhaDoTempo(userId), montarContexto(userId), listarMedicacoes(userId), listarConsultas(userId), documentos.listar(userId), listarCorporais(userId), listarSono(userId), listarAtividades(userId), listarCheckins(userId)]);
  const itens: ItemGeral[] = [];
  for (const a of cardio) for (const i of a.itens) itens.push({ data: i.data, modulo: 'cardio', titulo: i.titulo, valor: i.valor, rota: i.tipo === 'exame' ? '/(app)/coracao/exames' : '/(app)/coracao' });
  for (const e of ctx.exames) itens.push({ data: e.dataRealizacao, modulo: 'rastreando', titulo: `${ROTULO_EXAME[e.tipo as TipoExameRastreamento] ?? e.tipo} — ${ROTULO_PROGRAMA[e.programa]}`, valor: resumoResultado(e), nivel: e.nivelAlerta as ItemGeral['nivel'], rota: `/(app)/rastreando/${e.programa}/exames` });
  for (const m of medicacoes) {
    if (m.desde) itens.push({ data: m.desde, modulo: 'medicacao', titulo: `Início: ${m.nome}`, valor: m.dose ?? '', rota: '/(app)/(tabs)/minha-saude/medicamentos' });
    if (!m.ativa && m.ate) itens.push({ data: m.ate, modulo: 'medicacao', titulo: `Fim: ${m.nome}`, valor: m.dose ?? '', rota: '/(app)/(tabs)/minha-saude/medicamentos' });
  }
  const agora = Date.now();
  for (const c of consultas) if (Date.parse(c.dataHora) < agora) itens.push({ data: c.dataHora.slice(0, 10), modulo: 'consulta', titulo: `Consulta de ${rotuloEspecialidade(c.especialidade).toLowerCase()}`, valor: [c.local, c.profissional].filter(Boolean).join(' · '), rota: '/(app)/(tabs)/agenda/consultas' });
  for (const d of docs) if (!d.exameId) itens.push({ data: (d.dataDocumento ?? d.criadoEm).slice(0, 10), modulo: 'documento', titulo: d.nome, valor: ROTULO_TIPO_DOCUMENTO[d.tipo], rota: `/(app)/(tabs)/minha-saude/documentos/${d.id}` });
  // A linha do tempo cardio já traz o peso (tipo 'peso'); aqui entram cintura/composição, sono, atividade e check-ins.
  itens.push(...itensBemEstar({ corporais: corporais.filter((m) => m.tipo !== 'peso'), sonos, atividades, checkins, semanaDe, formatarHm }));
  return agruparPorAno(itens);
}
