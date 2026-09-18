/**
 * Pressão arterial casual (AMPA) — C-010.
 * AMPA é triagem (DBHA 2025 §3.7.1): sem cor abaixo de 180/110; só contextualiza com a referência da MRPA (130/80).
 */
import type { AvaliacaoPA, MediaPA, MedidaPA, MotivoExclusao, ParametrosPressao, SintomaPA } from './tipos';

/** Critérios de exclusão de medidas da MRPA (Medidas 2023, Parte 4 §3), usados como pedido de confirmação. */
export function validarPlausibilidade(m: { pas: number; pad: number }, p: ParametrosPressao): MotivoExclusao | null {
  const { implausivel: i } = p;
  const pp = m.pas - m.pad;
  if (m.pad > i.padMax) return 'pad_maior_140';
  if (m.pad < i.padMin) return 'pad_menor_40';
  if (m.pas < i.pasMin) return 'pas_menor_70';
  if (m.pas > i.pasMax) return 'pas_maior_250';
  if (m.pas < m.pad) return 'pas_menor_pad';
  if (pp < i.ppMin) return 'pp_menor_20';
  if (pp > i.ppMax) return 'pp_maior_100';
  return null;
}

/** "≥ X e/ou ≥ Y" — forma usada nas diretrizes para PAS/PAD. */
export function acimaDe(m: { pas: number; pad: number }, ref: { pas: number; pad: number }): boolean {
  return m.pas >= ref.pas || m.pad >= ref.pad;
}

export function avaliarMedidaCasual(m: { pas: number; pad: number }, sintomas: SintomaPA[], p: ParametrosPressao): AvaliacaoPA {
  const acima = acimaDe(m, p.referenciaDomiciliar);
  if (acimaDe(m, p.muitoElevadoSintoma) && sintomas.some((s) => p.muitoElevadoSintoma.sintomas.includes(s))) {
    const r = p.muitoElevadoSintoma.regra;
    return { camada: 'muito_elevado_sintoma', nivel: r.nivelAlerta, mensagem: r.mensagemPaciente, acimaReferenciaDomiciliar: true, regraId: r.id };
  }
  if (acimaDe(m, p.muitoElevado)) {
    const r = p.muitoElevado.regra;
    return { camada: 'muito_elevado', nivel: r.nivelAlerta, mensagem: r.mensagemPaciente, acimaReferenciaDomiciliar: true, regraId: r.id };
  }
  const r = p.referenciaDomiciliar.regra;
  return { camada: 'contexto', nivel: null, mensagem: r.mensagemPaciente, acimaReferenciaDomiciliar: acima, regraId: r.id };
}

const DIA_MS = 86_400_000;
const diasEntre = (a: string, b: string) => Math.floor((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / DIA_MS);

/** Camada 2b (C-010): ≥ N medidas casuais ≥ 130/80 nos últimos 7 dias, no máximo uma vez a cada 30 dias. Nunca alerta — convite. */
export function deveConvidarMrpa(medidas: MedidaPA[], ultimoConviteEm: string | null, hoje: string, p: ParametrosPressao): boolean {
  const c = p.conviteMrpa;
  if (ultimoConviteEm && diasEntre(ultimoConviteEm, hoje) < c.repetirDias) return false;
  const recentes = medidas.filter((m) => {
    if (m.sessaoId || m.contexto.excluida) return false;
    const d = diasEntre(m.medidoEm, hoje);
    return d >= 0 && d <= c.janelaDias;
  });
  return recentes.filter((m) => acimaDe(m, c)).length >= c.minimoMedidas;
}

export function media(medidas: { pas: number; pad: number }[]): MediaPA | null {
  if (!medidas.length) return null;
  const s = medidas.reduce((a, m) => ({ pas: a.pas + m.pas, pad: a.pad + m.pad }), { pas: 0, pad: 0 });
  return { pas: Math.round(s.pas / medidas.length), pad: Math.round(s.pad / medidas.length), n: medidas.length };
}

export function resumoCasual(medidas: MedidaPA[]): { media: MediaPA | null; maior: MedidaPA | null; menor: MedidaPA | null } {
  const validas = medidas.filter((m) => !m.contexto.excluida);
  if (!validas.length) return { media: null, maior: null, menor: null };
  const porPas = [...validas].sort((a, b) => a.pas - b.pas);
  return { media: media(validas), maior: porPas[porPas.length - 1], menor: porPas[0] };
}
