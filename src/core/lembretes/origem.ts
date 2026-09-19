import type { PreferenciasLembretes } from '@core/perfil/tipos';

/** Tipos da central (D-010) — um interruptor por tipo em `perfil_saude.preferencias_lembretes`. */
export type TipoLembrete = keyof PreferenciasLembretes; // 'exame' | 'mrpa' | 'glicemia' | 'medicacao' | 'consulta' | 'atualizacao'

export const ROTULO_TIPO_LEMBRETE: Record<TipoLembrete, string> = {
  exame: 'Exames de rastreamento',
  mrpa: 'MRPA (medidas em casa)',
  glicemia: 'Plano de glicemia',
  medicacao: 'Medicamentos',
  consulta: 'Consultas',
  atualizacao: 'Atualização de dados clínicos',
  agua: 'Água',
};

export const DESCRICAO_TIPO_LEMBRETE: Record<TipoLembrete, string> = {
  exame: 'Avisos 60, 30 e 7 dias antes, no dia e 7 dias depois da data prevista.',
  mrpa: 'Horários de manhã e noite durante a sessão.',
  glicemia: 'Horários do plano de monitorização.',
  medicacao: 'Horários dos medicamentos com lembrete ligado.',
  consulta: 'Um dia antes e no dia da consulta.',
  atualizacao: 'Quando algum dado do check-up ficar antigo.',
  agua: 'Avisos para beber água na janela e no intervalo que você escolher, em Minha Água.',
};

/** Como cada módulo grava o título em `lembretes` — a origem é derivada daqui, sem coluna nova. */
export const PREFIXO_DO_TIPO: Record<TipoLembrete, string> = { exame: '', mrpa: 'mrpa:', glicemia: 'glicemia:', medicacao: 'medicacao:', consulta: 'consulta:', atualizacao: 'atualizacao:', agua: 'agua:' };

export interface OrigemLembrete { tipo: TipoLembrete; rotulo: string; rota: string }

const ROTA_PROGRAMA = (programa: string) => `/(app)/rastreando/${programa}`;

/** Deriva tipo, rótulo e rota de destino a partir de `origem_tipo` + título. Testado em `__tests__/origem.test.ts`. */
export function origemDe(l: { origemTipo: string; titulo: string; origemId: string | null }): OrigemLembrete {
  const t = l.titulo;
  if (t.startsWith('mrpa:')) return { tipo: 'mrpa', rotulo: 'MRPA', rota: l.origemId ? `/(app)/coracao/mrpa/${l.origemId}` : '/(app)/coracao/pressao' };
  if (t.startsWith('glicemia:')) return { tipo: 'glicemia', rotulo: 'Glicemia', rota: '/(app)/coracao/glicemia/registrar' };
  if (t.startsWith('medicacao:')) return { tipo: 'medicacao', rotulo: 'Medicamento', rota: '/(app)/minha-saude/medicamentos' };
  if (t.startsWith('consulta:') || l.origemTipo === 'consulta') return { tipo: 'consulta', rotulo: 'Consulta', rota: '/(app)/minha-saude/lembretes/consultas' };
  if (t.startsWith('agua:')) return { tipo: 'agua', rotulo: 'Água', rota: '/(app)/bem-estar/agua' };
  if (t.startsWith('atualizacao:')) return { tipo: 'atualizacao', rotulo: 'Atualização', rota: '/(app)/coracao/checkup' };
  if (l.origemTipo === 'exame') { const programa = t.split(':')[0]; return { tipo: 'exame', rotulo: 'Rastreamento', rota: programa ? ROTA_PROGRAMA(programa) : '/(app)/rastreando' }; }
  return { tipo: 'atualizacao', rotulo: 'NERO', rota: '/(app)/minha-saude/lembretes' };
}

/** Texto para a pessoa: sem o `notif:<id>` interno e sem a marca ` silenciado`. */
export function textoLimpo(mensagem: string | null): string {
  return (mensagem ?? '').replace(/\s*notif:[\w-]+/g, '').replace(/\s*silenciado$/, '').trim();
}
export function estaSilenciado(mensagem: string | null): boolean {
  return /\ssilenciado$/.test(mensagem ?? '');
}

export function tiposParaCancelar(antes: PreferenciasLembretes, depois: PreferenciasLembretes): TipoLembrete[] {
  return (Object.keys(depois) as TipoLembrete[]).filter((t) => antes[t] && !depois[t]);
}
export function tiposParaReligar(antes: PreferenciasLembretes, depois: PreferenciasLembretes): TipoLembrete[] {
  return (Object.keys(depois) as TipoLembrete[]).filter((t) => !antes[t] && depois[t]);
}

/** Agrupa por dia (AAAA-MM-DD local) mantendo a ordem cronológica. */
export function agruparPorDia<T extends { quando: string }>(itens: T[]): { dia: string; itens: T[] }[] {
  const grupos = new Map<string, T[]>();
  for (const i of [...itens].sort((a, b) => a.quando.localeCompare(b.quando))) {
    const d = new Date(i.quando);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(i);
  }
  return Array.from(grupos, ([dia, itens]) => ({ dia, itens }));
}
