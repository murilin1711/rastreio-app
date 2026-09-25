import { aplicarHierarquiaSeguranca } from './seguranca';
import type { ContextoAvaliacao, PerfilRegras, Programa, ProgramaHandlers, RegraParametros, ResultadoElegibilidade } from './tipos';

/** Soma meses a uma data ISO preservando o dia (usa UTC para não sofrer com fuso). */
export function somarMeses(iso: string, meses: number): string {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1 + meses, d)).toISOString().slice(0, 10);
}

function diasAte(alvoIso: string, hoje: Date): number {
  const [a, m, d] = alvoIso.split('-').map(Number);
  const alvo = Date.UTC(a, m - 1, d);
  const ref = Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate());
  return Math.round((alvo - ref) / 86_400_000);
}

/** Aplicabilidade anatômica/por sexo padrão; handlers da Fase 1 podem refinar. */
export function aplicavelAoPerfil(programa: Programa, perfil: PerfilRegras): boolean {
  switch (programa) {
    case 'colo_utero': return perfil.possuiColoUtero === true;
    case 'prostata':   return perfil.sexoNascimento === 'masculino';
    case 'mama':       return perfil.sexoNascimento === 'feminino';
    default:           return true;
  }
}

const ANOS_ANTES_PARA_AVISAR = 2;
const DIAS_PARA_EXAME_PROXIMO = 60;

const MSG = {
  naoAplicavel: 'Este rastreamento não é aplicável ao seu perfil atual.',
  jovem: 'Você ainda não está na faixa etária habitual de rastreamento. Mantenha seus dados atualizados para que o NERO possa avisá-lo quando chegar o momento adequado.',
  proximo: 'Você está próximo da faixa etária de rastreamento. O NERO avisará quando chegar o momento.',
  acima: 'Você está acima da faixa etária habitual de rastreamento. A continuidade deve ser decidida com seu médico.',
  semRegra: 'Ainda não há protocolo cadastrado para este rastreamento. Converse com seu médico.',
  emDia: 'Seu rastreamento está em dia.',
  proximoExame: 'Seu próximo exame está previsto para os próximos 60 dias.',
  atrasado: 'A data prevista do seu exame já passou. Procure agendar.',
} as const;

export function avaliarElegibilidade(
  perfil: PerfilRegras,
  programa: Programa,
  regras: RegraParametros[],
  contexto: ContextoAvaliacao,
  hoje: Date = new Date(),
  handlers: ProgramaHandlers = {},
): ResultadoElegibilidade {
  const base: Omit<ResultadoElegibilidade, 'status' | 'mensagem'> = { programa, regraId: null, regraVersao: null, proximaData: null };
  const handler = handlers[programa];

  const aplicavel = handler ? handler.aplicavel(perfil) : aplicavelAoPerfil(programa, perfil);
  if (!aplicavel) return { ...base, status: 'nao_indicado_no_momento', mensagem: MSG.naoAplicavel, naoAplicavel: true };

  const bloqueio = aplicarHierarquiaSeguranca(programa, contexto);
  if (bloqueio) return { ...base, status: 'acompanhamento_medico', mensagem: bloqueio.mensagemPaciente };

  const modificador = handler?.fatoresModificadores(perfil) ?? null;
  if (modificador) return { ...base, status: 'avaliacao_individualizada', mensagem: modificador };

  const regra = regras.find((r) => typeof r.condicao.idade_min === 'number') ?? null;
  const ref = regra ? { ...base, regraId: regra.id, regraVersao: regra.versao } : base;

  // Faixa etária: o handler tem prioridade (critérios do perfil); senão vem da regra de elegibilidade.
  const faixa = handler?.faixaEtaria
    ? handler.faixaEtaria(perfil)
    : regra
      ? { min: regra.condicao.idade_min as number, max: typeof regra.condicao.idade_max === 'number' ? regra.condicao.idade_max : null }
      : undefined;

  if (faixa === undefined) return { ...base, status: 'avaliacao_individualizada', mensagem: MSG.semRegra };
  if (faixa === null) return { ...ref, status: 'nao_indicado_no_momento', mensagem: handler?.mensagemNaoElegivel?.(perfil) ?? MSG.jovem };

  const min = faixa.min;
  const max = faixa.max ?? Infinity;

  if (perfil.idade > max) return { ...ref, status: 'acompanhamento_medico', mensagem: MSG.acima };
  if (perfil.idade < min) {
    return perfil.idade >= min - ANOS_ANTES_PARA_AVISAR
      ? { ...ref, status: 'proximo_de_iniciar', mensagem: MSG.proximo }
      : { ...ref, status: 'nao_indicado_no_momento', mensagem: MSG.jovem };
  }

  // CONITEC (texto da Rec. 8): colonoscopia completa e de qualidade → repetir só em 10 anos, sem FIT nesse intervalo.
  if (programa === 'colorretal' && contexto.colonoscopiaAdequadaEm) {
    const proximaData = somarMeses(contexto.colonoscopiaAdequadaEm, 120);
    const dias = diasAte(proximaData, hoje);
    if (dias < 0) return { ...ref, status: 'exame_atrasado', mensagem: MSG.atrasado, proximaData };
    if (dias <= DIAS_PARA_EXAME_PROXIMO) return { ...ref, status: 'exame_proximo', mensagem: MSG.proximoExame, proximaData };
    return { ...ref, status: 'em_dia', mensagem: 'Colonoscopia recente e adequada: não é necessário FIT até a próxima colonoscopia.', proximaData };
  }

  const ultimoValido = contexto.historicoExames
    .filter((e) => e.programa === programa && (e.classificacao === 'normal' || e.classificacao === 'controle'))
    .sort((a, b) => b.dataRealizacao.localeCompare(a.dataRealizacao))[0];

  if (!ultimoValido || regra?.intervaloMeses == null) return { ...ref, status: 'indicado', mensagem: regra?.mensagemPaciente ?? 'Rastreamento indicado para o seu perfil. Converse com seu médico.' };

  const proximaData = somarMeses(ultimoValido.dataRealizacao, regra.intervaloMeses);
  const dias = diasAte(proximaData, hoje);
  if (dias < 0) return { ...ref, status: 'exame_atrasado', mensagem: MSG.atrasado, proximaData };
  if (dias <= DIAS_PARA_EXAME_PROXIMO) return { ...ref, status: 'exame_proximo', mensagem: MSG.proximoExame, proximaData };
  return { ...ref, status: 'em_dia', mensagem: MSG.emDia, proximaData };
}
