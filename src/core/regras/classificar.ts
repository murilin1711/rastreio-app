import { somarMeses } from './elegibilidade';
import { handlers as handlersPadrao } from './programas';
import { aplicarHierarquiaSeguranca } from './seguranca';
import type { Classificacao, ContextoAvaliacao, ExameEntrada, PerfilRegras, ProgramaHandlers, RegraParametros, ResultadoClassificacao } from './tipos';

/** Classificações que deixam uma pendência aberta até o usuário registrar a próxima etapa (§50). */
const ABRE_PENDENCIA: ReadonlySet<Classificacao> = new Set(['complementar', 'investigacao', 'especializado', 'pendente']);
/** Só estas classificações geram data automática de próximo exame (§31.1, §31.2). */
const CALCULA_DATA: ReadonlySet<Classificacao> = new Set(['normal', 'controle']);

const MSG_PENDENTE =
  'Seu rastreamento ainda não foi concluído. É necessário complementar este exame ou registrar o resultado final para que o NERO consiga atualizar seu acompanhamento. Busque atendimento médico.';

/** Casamento genérico: toda chave da condição (exceto faixa etária) deve ser igual no resultado do exame. */
export function regraCasa(regra: RegraParametros, exame: ExameEntrada): boolean {
  const chaves = Object.keys(regra.condicao).filter((k) => !k.startsWith('idade_'));
  return chaves.length > 0 && chaves.every((k) => regra.condicao[k] === exame.resultado[k]);
}

/**
 * Fluxo do §42: segurança → seleção da regra → classificação → próxima ação.
 * Nunca escreve diagnóstico; devolve classificação, alerta e a regra (com versão) que fundamentou.
 */
export function classificarExame(
  exame: ExameEntrada,
  perfil: PerfilRegras,
  contexto: ContextoAvaliacao,
  regras: RegraParametros[],
  handlers: ProgramaHandlers = handlersPadrao,
): ResultadoClassificacao {
  const bloqueio = aplicarHierarquiaSeguranca(exame.programa, contexto);
  if (bloqueio) {
    return {
      classificacao: 'pendente',
      nivelAlerta: bloqueio.nivelAlerta,
      proximaAcao: 'Procure avaliação médica',
      dataProximaAcao: null,
      abrePendencia: true,
      mensagemPaciente: bloqueio.mensagemPaciente,
      regraId: null,
      regraVersao: null,
      motivoSeguranca: bloqueio.motivo,
    };
  }

  const handler = handlers[exame.programa];
  const regra = handler
    ? handler.selecionarRegra(exame, regras, perfil, contexto)
    : (regras.find((r) => regraCasa(r, exame)) ?? null);

  if (!regra) {
    return {
      classificacao: 'pendente',
      nivelAlerta: 'cinza',
      proximaAcao: 'Registrar o resultado final ou procurar avaliação médica',
      dataProximaAcao: null,
      abrePendencia: true,
      mensagemPaciente: MSG_PENDENTE,
      regraId: null,
      regraVersao: null,
    };
  }

  const calculaData = CALCULA_DATA.has(regra.classificacao) && regra.intervaloMeses != null;
  return {
    classificacao: regra.classificacao,
    nivelAlerta: regra.nivelAlerta,
    proximaAcao: regra.proximaAcao,
    dataProximaAcao: calculaData ? somarMeses(exame.dataRealizacao, regra.intervaloMeses as number) : null,
    abrePendencia: ABRE_PENDENCIA.has(regra.classificacao),
    mensagemPaciente: regra.mensagemPaciente,
    regraId: regra.id,
    regraVersao: regra.versao,
  };
}
