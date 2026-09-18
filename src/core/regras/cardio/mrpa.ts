/**
 * MRPA — protocolo da Diretriz de Medidas da PA 2023, Parte 4 (C-011).
 * 3 medidas manhã + 3 noite, 4–6 dias; validade 14/15/18 com manhã e noite em todos os dias; anormal ≥ 130 e/ou ≥ 80.
 */
import { acimaDe, media, validarPlausibilidade } from './pressao';
import type { MedidaPA, MotivoExclusao, ParametrosPressao, RelatorioMrpa, SessaoMrpa } from './tipos';

const DIA_MS = 86_400_000;

export function dataDoDia(sessao: SessaoMrpa, dia: number): string {
  return new Date(Date.parse(sessao.inicio) + (dia - 1) * DIA_MS).toISOString().slice(0, 10);
}

/** 1 no dia de início; 0 antes dele; segue contando após o último dia (a tela limita). */
export function diaDaSessao(sessao: SessaoMrpa, hoje: string): number {
  const d = Math.floor((Date.parse(hoje.slice(0, 10)) - Date.parse(sessao.inicio)) / DIA_MS) + 1;
  return d < 1 ? 0 : d;
}

export function podeConcluir(sessao: SessaoMrpa, hoje: string): boolean {
  return diaDaSessao(sessao, hoje) >= sessao.diasPrevistos;
}

export function classificarMedidaSessao(m: { pas: number; pad: number }, p: ParametrosPressao): { excluida: boolean; motivo: MotivoExclusao | null } {
  const motivo = validarPlausibilidade(m, p);
  return { excluida: motivo !== null, motivo };
}

export function montarRelatorio(sessao: SessaoMrpa, medidas: MedidaPA[], p: ParametrosPressao): RelatorioMrpa {
  const daSessao = medidas.filter((m) => m.sessaoId === sessao.id);
  const validas = daSessao.filter((m) => !m.contexto.excluida && validarPlausibilidade(m, p) === null);
  const excluidas = daSessao.length - validas.length;
  const dias = Array.from({ length: sessao.diasPrevistos }, (_, i) => i + 1);

  const porDia = dias.map((dia) => {
    const data = dataDoDia(sessao, dia);
    const doDia = validas.filter((m) => m.medidoEm.slice(0, 10) === data);
    const manha = doDia.filter((m) => m.contexto.periodo === 'manha');
    const noite = doDia.filter((m) => m.contexto.periodo === 'noite');
    return { dia, data, manha: media(manha), noite: media(noite), total: media(doDia) };
  });
  const diasComRegistro = porDia.filter((d) => d.total).length;

  let motivoInvalidez: RelatorioMrpa['motivoInvalidez'] = null;
  if (!validas.length) motivoInvalidez = 'sem_medidas';
  else if (validas.length < (p.validade.minimos[String(sessao.diasPrevistos)] ?? Infinity)) motivoInvalidez = 'poucas_medidas';
  else if (porDia.some((d) => !d.manha || !d.noite)) motivoInvalidez = 'dia_sem_periodo';
  const valido = motivoInvalidez === null;

  const total = media(validas);
  const acima = valido && total ? acimaDe(total, p.mrpaAcima) : null;
  const diferencaConsultorio = sessao.paConsultorio && total
    ? { pas: sessao.paConsultorio.pas - total.pas, pad: sessao.paConsultorio.pad - total.pad }
    : null;

  return {
    medidasValidas: validas.length,
    medidasExcluidas: excluidas,
    diasComRegistro,
    medias: {
      total,
      manha: media(validas.filter((m) => m.contexto.periodo === 'manha')),
      noite: media(validas.filter((m) => m.contexto.periodo === 'noite')),
      porDia,
    },
    valido,
    motivoInvalidez,
    acimaReferencia: acima,
    diferencaConsultorio,
    regraId: !valido ? p.validade.regra.id : acima ? p.mrpaAcima.regra.id : p.validade.regra.id,
  };
}
