import { agendarDiario, cancelarLembretes } from '@core/cardio/lembretesCardio';
import { notificacoesPermitidas } from '@core/lembretes/permissao';
import { obterPerfil, salvarPerfil } from '@core/perfil/repositorio';
import { type ConfigLembretesAgua, horariosAgua } from '@core/regras/bemestar/lembretesAgua';
import { metaSugeridaMl } from '@core/regras/bemestar/agua';
import { textoAgua } from '@core/lembretes/textos';
import { ultimoPorTipoCorporal } from './medidasCorporais';
import { listarMetas } from './metas';

/** A mesma meta que a tela Minha Água mostra: a definida pela pessoa, senão a sugerida pelo peso. */
async function metaAguaAtual(userId: string, temRestricao: boolean): Promise<number | null> {
  const [metas, ultimos] = await Promise.all([listarMetas(userId).catch(() => []), ultimoPorTipoCorporal(userId).catch(() => null)]);
  const definida = metas.find((m) => m.tipo === 'agua_ml')?.valor ?? null;
  return definida ?? metaSugeridaMl(ultimos?.peso?.valores.kg ?? null, temRestricao);
}

/** Mesmo esquema do plano de glicemia: cancela os pendentes e agenda um aviso diário por horário (D-048). */
export async function agendarLembretesAgua(userId: string, config: ConfigLembretesAgua, temRestricao: boolean): Promise<void> {
  await cancelarLembretes(userId, 'agua:');
  // Quem tem restrição hídrica não é lembrado de beber: seria incoerente com a meta, que o app
  // também não calcula nesses casos (C-021).
  if (!config.ativo || temRestricao) return;
  const horarios = horariosAgua(config.inicio, config.fim, config.intervaloMin);
  if (horarios.length === 0) return;
  const temPermissao = await notificacoesPermitidas(userId, 'agua');
  const texto = textoAgua(await metaAguaAtual(userId, temRestricao));
  for (const h of horarios) await agendarDiario(userId, 'medida', null, `agua:${h}`, texto, h, temPermissao);
}

/** Grava a configuração no perfil e reaplica o agendamento. */
export async function salvarLembretesAgua(userId: string, config: ConfigLembretesAgua): Promise<void> {
  const perfil = await obterPerfil(userId);
  const temRestricao = perfil.temDoencaRenal === true || perfil.temInsuficienciaCardiaca === true;
  await salvarPerfil(userId, {
    lembretesAgua: config,
    preferenciasLembretes: { ...perfil.preferenciasLembretes, agua: config.ativo && !temRestricao },
  });
  await agendarLembretesAgua(userId, config, temRestricao);
}

/**
 * Refaz os avisos de água com a meta de agora (D-044). O texto traz a meta ("Sua meta de hoje: 2 L"),
 * e os avisos são agendados 7 dias à frente: sem isto, quem muda a meta ou registra um peso novo
 * seguiria vendo o número antigo a semana toda. Sem avisos de água ligados, não faz nada.
 */
export async function reagendarAgua(userId: string): Promise<void> {
  const perfil = await obterPerfil(userId);
  if (!perfil.lembretesAgua?.ativo) return;
  const temRestricao = perfil.temDoencaRenal === true || perfil.temInsuficienciaCardiaca === true;
  await agendarLembretesAgua(userId, perfil.lembretesAgua, temRestricao);
}
