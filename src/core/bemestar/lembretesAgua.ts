import { agendar, cancelarLembretes } from '@core/cardio/lembretesCardio';
import { notificacoesPermitidas } from '@core/lembretes/permissao';
import { obterPerfil, salvarPerfil } from '@core/perfil/repositorio';
import { type ConfigLembretesAgua, horariosAgua } from '@core/regras/bemestar/lembretesAgua';

/** Mesmo esquema do plano de glicemia: cancela os pendentes e reagenda 7 dias à frente. */
export async function agendarLembretesAgua(userId: string, config: ConfigLembretesAgua, temRestricao: boolean): Promise<void> {
  await cancelarLembretes(userId, 'agua:');
  // Quem tem restrição hídrica não é lembrado de beber: seria incoerente com a meta, que o app
  // também não calcula nesses casos (C-021).
  if (!config.ativo || temRestricao) return;
  const horarios = horariosAgua(config.inicio, config.fim, config.intervaloMin);
  if (horarios.length === 0) return;
  const temPermissao = await notificacoesPermitidas(userId, 'agua');
  const hoje = new Date();
  for (let d = 0; d < 7; d++) {
    for (const h of horarios) {
      const [hh, mm] = h.split(':').map(Number);
      const quando = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + d, hh, mm, 0);
      await agendar(userId, 'medida', null, `agua:${h}`, 'Hora de beber água.', quando, temPermissao);
    }
  }
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
