import type { PerfilSaude } from '@core/perfil/tipos';
import type { NivelAlertaUI } from '@ui/theme';

export interface ItemHoje {
  id: string;
  nivel: NivelAlertaUI;
  titulo: string;
  descricao: string;
  rota: string;
  /** Declaração negativa que resolve a pendência sem cadastrar nada (grava no perfil). */
  acaoSecundaria?: { rotulo: string; campo: 'semMedicacoes' | 'semAntecedentesFamiliares' };
}

const PESO: Record<NivelAlertaUI, number> = { vermelho: 0, laranja: 1, amarelo: 2, cinza: 3, verde: 4 };

const ESSENCIAIS: (keyof PerfilSaude)[] = ['dataNascimento', 'sexoNascimento', 'alturaCm', 'tabagismoStatus', 'temDiabetes', 'temHipertensao'];

export interface RastreandoResumo {
  pendencias: { programa: string; descricao: string; nivelAlerta: string }[];
  sintomas: { programa: string }[];
  avaliacoes: Partial<Record<string, { status: string; proximaData: string | null }>>;
}

/** Resumo do Coração & Metabolismo para a Home (Fase 2a). Montado em `src/core/cardio/resumoHome.ts`. */
export interface ResumoCardio {
  ultimaPA: { pas: number; pad: number; medidoEm: string; nivel: 'laranja' | 'vermelho' | null } | null;
  mrpaAtiva: { id: string; dia: number; diasPrevistos: number; faltaHoje: ('manha' | 'noite')[] } | null;
  mrpaAcimaSemLeitura: { id: string; concluidaEm: string } | null;
  /** Fase 2b */
  glicemia?: { mgdl: number; medidoEm: string; nivel: 'laranja' | 'vermelho' | null } | null;
  planoVencidoHoje?: { momento: string; rotulo: string; hora: string } | null;
  checkup?: { atualizados: number; total: number; faltante: string | null } | null;
}

interface Entrada {
  perfil: PerfilSaude | null;
  antecedentesQtd: number;
  medicacoesAtivasQtd: number;
  rastreando?: RastreandoResumo;
  cardio?: ResumoCardio;
}

const NOME_PROGRAMA: Record<string, string> = { mama: 'mama', colo_utero: 'colo do útero', colorretal: 'intestino', pulmao: 'pulmão', prostata: 'próstata' };
const NIVEL: Record<string, NivelAlertaUI> = { verde: 'verde', amarelo: 'amarelo', laranja: 'laranja', vermelho: 'vermelho', cinza: 'cinza' };

/**
 * Bloco "Hoje" da Home (§56): o que precisa de atenção, do mais grave ao mais leve.
 * Fase 0: só completude do perfil. A Fase 1 acrescenta pendências e exames do Rastreando.
 */
export function montarItensHoje({ perfil, antecedentesQtd, medicacoesAtivasQtd, rastreando, cardio }: Entrada): ItemHoje[] {
  if (!perfil) return [];
  const itens: ItemHoje[] = [];

  // Rastreando (§56): hierarquia de segurança na ordem — sintoma > pendência > atrasado > próximo.
  if (rastreando) {
    for (const programa of [...new Set(rastreando.sintomas.map((s) => s.programa))]) {
      itens.push({ id: `sintoma_${programa}`, nivel: 'vermelho', titulo: `Procurar avaliação: sinal de alerta (${NOME_PROGRAMA[programa] ?? programa})`, descricao: 'Não espere pela data do rastreamento.', rota: `/(app)/rastreando/${programa}/sinais` });
    }
    for (const p of rastreando.pendencias) {
      itens.push({ id: `pendencia_${p.programa}`, nivel: NIVEL[p.nivelAlerta] ?? 'laranja', titulo: `Concluir pendência: ${p.descricao.toLowerCase()}`, descricao: `Rastreamento de ${NOME_PROGRAMA[p.programa] ?? p.programa}.`, rota: '/(app)/rastreando/pendencias' });
    }
    for (const [programa, av] of Object.entries(rastreando.avaliacoes)) {
      if (!av) continue;
      if (av.status === 'exame_atrasado') itens.push({ id: `atrasado_${programa}`, nivel: 'laranja', titulo: `Agendar exame atrasado (${NOME_PROGRAMA[programa] ?? programa})`, descricao: 'A data prevista já passou.', rota: `/(app)/rastreando/${programa}` });
      else if (av.status === 'exame_proximo') itens.push({ id: `proximo_${programa}`, nivel: 'amarelo', titulo: `Agendar exame de ${NOME_PROGRAMA[programa] ?? programa}`, descricao: `Previsto para ${av.proximaData ? `${av.proximaData.slice(8, 10)}/${av.proximaData.slice(5, 7)}/${av.proximaData.slice(0, 4)}` : 'breve'}.`, rota: `/(app)/rastreando/${programa}` });
    }
  }

  // Coração & Metabolismo (C-010/C-011): PA muito elevada nas últimas 24 h > MRPA do dia > relatório a levar ao médico.
  if (cardio) {
    const { ultimaPA, mrpaAtiva, mrpaAcimaSemLeitura } = cardio;
    if (ultimaPA?.nivel && Date.now() - Date.parse(ultimaPA.medidoEm) < 86_400_000) {
      itens.push({
        id: 'pa_elevada',
        nivel: ultimaPA.nivel,
        titulo: ultimaPA.nivel === 'vermelho' ? 'Procurar atendimento: pressão muito elevada com sintomas' : 'Repetir a medida: pressão muito elevada',
        descricao: `Última medida ${ultimaPA.pas}/${ultimaPA.pad}. Descanse 5 minutos e meça de novo.`,
        rota: '/(app)/coracao/pressao',
      });
    }
    if (mrpaAtiva && mrpaAtiva.faltaHoje.length && mrpaAtiva.dia >= 1 && mrpaAtiva.dia <= mrpaAtiva.diasPrevistos) {
      const periodo = mrpaAtiva.faltaHoje.includes('manha') ? 'manhã' : 'noite';
      itens.push({ id: 'mrpa_hoje', nivel: 'amarelo', titulo: `Fazer as medidas da ${periodo} — MRPA, dia ${mrpaAtiva.dia} de ${mrpaAtiva.diasPrevistos}`, descricao: '3 medidas com 1 minuto de intervalo.', rota: `/(app)/coracao/mrpa/${mrpaAtiva.id}` });
    }
    const { glicemia, planoVencidoHoje, checkup } = cardio;
    if (glicemia?.nivel && Date.now() - Date.parse(glicemia.medidoEm) < 86_400_000) {
      itens.push({ id: 'glicemia_alerta', nivel: glicemia.nivel, titulo: glicemia.nivel === 'vermelho' ? 'Procurar atendimento: glicemia com sinais de alarme' : glicemia.mgdl < 70 ? 'Rever orientação: glicemia muito baixa' : 'Repetir a medida: glicemia muito alta', descricao: `Última medida ${glicemia.mgdl} mg/dL. Siga a orientação do seu médico.`, rota: '/(app)/coracao/glicemia' });
    }
    if (planoVencidoHoje) {
      itens.push({ id: 'glicemia_plano', nivel: 'amarelo', titulo: `Medir glicemia — ${planoVencidoHoje.rotulo}`, descricao: `Horário do seu plano: ${planoVencidoHoje.hora}.`, rota: '/(app)/coracao/glicemia/registrar' });
    }
    if (checkup && checkup.faltante && checkup.atualizados < checkup.total) {
      itens.push({ id: 'checkup', nivel: 'cinza', titulo: `Atualizar minha prevenção: ${checkup.atualizados} de ${checkup.total} em dia`, descricao: checkup.faltante, rota: '/(app)/coracao/checkup' });
    }
    if (mrpaAcimaSemLeitura) {
      itens.push({ id: 'mrpa_levar', nivel: 'amarelo', titulo: 'Levar o relatório da MRPA ao médico', descricao: 'Suas medidas ficaram acima da referência. Converse com seu profissional de saúde.', rota: `/(app)/coracao/mrpa/relatorio?sessao=${mrpaAcimaSemLeitura.id}` });
    }
  }

  const faltando = ESSENCIAIS.filter((k) => perfil[k] == null);
  if (faltando.length) {
    itens.push({
      id: 'perfil_incompleto',
      nivel: 'amarelo',
      titulo: 'Completar meu perfil de saúde',
      descricao: faltando.length === 1 ? 'Falta 1 informação essencial.' : `Faltam ${faltando.length} informações essenciais.`,
      rota: '/(app)/minha-saude/perfil',
    });
  }
  if (antecedentesQtd === 0 && !perfil.semAntecedentesFamiliares) {
    itens.push({
      id: 'antecedentes',
      nivel: 'cinza',
      titulo: 'Registrar antecedentes familiares',
      descricao: 'Casos de câncer ou infarto precoce na família ajudam a definir seus rastreamentos.',
      rota: '/(app)/minha-saude/antecedentes',
      acaoSecundaria: { rotulo: 'Não há casos na família', campo: 'semAntecedentesFamiliares' },
    });
  }
  if (medicacoesAtivasQtd === 0 && !perfil.semMedicacoes) {
    itens.push({
      id: 'medicacoes',
      nivel: 'cinza',
      titulo: 'Cadastrar meus medicamentos',
      descricao: 'Entram nos relatórios para o seu médico.',
      rota: '/(app)/minha-saude/medicamentos',
      acaoSecundaria: { rotulo: 'Não uso medicamentos', campo: 'semMedicacoes' },
    });
  }
  if (!itens.length) {
    itens.push({
      id: 'tudo_em_dia',
      nivel: 'verde',
      titulo: 'Nada pendente',
      descricao: rastreando && cardio ? 'Perfil completo, rastreamentos e pressão em ordem.' : rastreando ? 'Perfil completo e rastreamentos em ordem.' : 'Seu perfil está completo.',
      rota: '/(app)/minha-saude',
    });
  }
  return itens.sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
}
