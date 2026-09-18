import { montarLinhaDoTempo } from '@core/cardio/linhaDoTempo';
import * as documentos from '@core/documentos/repositorio';
import { ROTULO_TIPO_DOCUMENTO } from '@core/documentos/tipos';
import { listarConsultas } from '@core/lembretes/consultas';
import { listarMedicacoes } from '@core/medicacoes/repositorio';
import { montarContexto } from '@core/rastreando/contexto';
import { resumoResultado } from '@core/rastreando/formato';
import { ROTULO_EXAME, ROTULO_PROGRAMA, type TipoExameRastreamento } from '@core/rastreando/tipos';
import { rotuloEspecialidade } from '@core/relatorios/especialidades';
import { agruparPorAno, type AnoGeral, type ItemGeral } from './agrupar';

/** Linha do tempo geral (§60): cardio (já agregada) + exames do Rastreando + medicações + consultas passadas + documentos avulsos. */
export async function montarLinhaDoTempoGeral(userId: string): Promise<AnoGeral[]> {
  const [cardio, ctx, medicacoes, consultas, docs] = await Promise.all([montarLinhaDoTempo(userId), montarContexto(userId), listarMedicacoes(userId), listarConsultas(userId), documentos.listar(userId)]);
  const itens: ItemGeral[] = [];
  for (const a of cardio) for (const i of a.itens) itens.push({ data: i.data, modulo: 'cardio', titulo: i.titulo, valor: i.valor, rota: i.tipo === 'exame' ? '/(app)/coracao/exames' : '/(app)/coracao' });
  for (const e of ctx.exames) itens.push({ data: e.dataRealizacao, modulo: 'rastreando', titulo: `${ROTULO_EXAME[e.tipo as TipoExameRastreamento] ?? e.tipo} — ${ROTULO_PROGRAMA[e.programa]}`, valor: resumoResultado(e), nivel: e.nivelAlerta as ItemGeral['nivel'], rota: `/(app)/rastreando/${e.programa}/exames` });
  for (const m of medicacoes) {
    if (m.desde) itens.push({ data: m.desde, modulo: 'medicacao', titulo: `Início: ${m.nome}`, valor: m.dose ?? '', rota: '/(app)/minha-saude/medicamentos' });
    if (!m.ativa && m.ate) itens.push({ data: m.ate, modulo: 'medicacao', titulo: `Fim: ${m.nome}`, valor: m.dose ?? '', rota: '/(app)/minha-saude/medicamentos' });
  }
  const agora = Date.now();
  for (const c of consultas) if (Date.parse(c.dataHora) < agora) itens.push({ data: c.dataHora.slice(0, 10), modulo: 'consulta', titulo: `Consulta de ${rotuloEspecialidade(c.especialidade).toLowerCase()}`, valor: [c.local, c.profissional].filter(Boolean).join(' · '), rota: '/(app)/minha-saude/lembretes/consultas' });
  for (const d of docs) if (!d.exameId) itens.push({ data: (d.dataDocumento ?? d.criadoEm).slice(0, 10), modulo: 'documento', titulo: d.nome, valor: ROTULO_TIPO_DOCUMENTO[d.tipo], rota: `/(app)/minha-saude/documentos/${d.id}` });
  return agruparPorAno(itens);
}
