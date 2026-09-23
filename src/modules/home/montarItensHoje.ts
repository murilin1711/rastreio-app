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

/** Próxima consulta marcada (D-010). `agora` permite testar. */
export interface ConsultasResumo { proxima: { id: string; especialidade: string; rotuloEspecialidade: string; dataHora: string } | null }

/** Saúde & Bem-estar (Fase 4a): movimento da semana e perda de peso não intencional (C-019). */
export interface BemEstarResumo { movimentoMin: number; metaMin: number; perdaNaoIntencional: { pct: number; desde: string } | null; checkinPendente?: boolean }

interface Entrada {
  perfil: PerfilSaude | null;
  antecedentesQtd: number;
  medicacoesAtivasQtd: number;
  rastreando?: RastreandoResumo;
  cardio?: ResumoCardio;
  consultas?: ConsultasResumo;
  bemEstar?: BemEstarResumo;
  agora?: Date;
}

const mesmoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const horaDe = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const NOME_PROGRAMA: Record<string, string> = { mama: 'mama', colo_utero: 'colo do útero', colorretal: 'intestino', pulmao: 'pulmão', prostata: 'próstata' };
const NIVEL: Record<string, NivelAlertaUI> = { verde: 'verde', amarelo: 'amarelo', laranja: 'laranja', vermelho: 'vermelho', cinza: 'cinza' };

/**
 * Bloco "Hoje" da Home (§56): o que precisa de atenção, do mais grave ao mais leve.
 * Fase 0: só completude do perfil. A Fase 1 acrescenta pendências e exames do Rastreando.
 */
export function montarItensHoje({ perfil, antecedentesQtd, medicacoesAtivasQtd, rastreando, cardio, consultas, bemEstar, agora = new Date() }: Entrada): ItemHoje[] {
  if (!perfil) return [];
  const itens: ItemHoje[] = [];

  // Consulta marcada (D-010): hoje ou amanhã → preparar o relatório.
  if (consultas?.proxima) {
    const c = consultas.proxima;
    const dt = new Date(c.dataHora);
    const amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
    const rota = `/(app)/(tabs)/minha-saude/consulta?especialidade=${c.especialidade}&consultaId=${c.id}`;
    if (mesmoDia(dt, agora)) itens.push({ id: 'consulta_hoje', nivel: 'amarelo', titulo: `Hoje: consulta de ${c.rotuloEspecialidade.toLowerCase()} às ${horaDe(dt)} — preparar`, descricao: 'Abra o relatório para levar ao médico.', rota });
    else if (mesmoDia(dt, amanha)) itens.push({ id: 'consulta_amanha', nivel: 'amarelo', titulo: `Amanhã: consulta de ${c.rotuloEspecialidade.toLowerCase()} às ${horaDe(dt)}`, descricao: 'Quer preparar o relatório?', rota });
  }

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

  // Saúde & Bem-estar: perda de peso sem meta de redução (cinza, C-019); movimento só aos domingos, para não virar cobrança diária.
  if (bemEstar) {
    if (bemEstar.perdaNaoIntencional) {
      itens.push({ id: 'perda_peso', nivel: 'cinza', titulo: `Conversar com o médico: seu peso caiu ${String(bemEstar.perdaNaoIntencional.pct).replace('.', ',')} % sem meta de redução`, descricao: 'Perda de peso sem intenção merece uma avaliação.', rota: '/(app)/bem-estar/corpo' });
    }
    if (bemEstar.checkinPendente) {
      itens.push({ id: 'checkin_semana', nivel: 'cinza', titulo: 'Fazer o check-in da semana', descricao: 'Sete perguntas rápidas sobre como foi sua semana.', rota: '/(app)/bem-estar/checkin' });
    }
    if (agora.getDay() === 0 && bemEstar.movimentoMin < bemEstar.metaMin) {
      itens.push({ id: 'atividade_semana', nivel: 'cinza', titulo: `Movimentar-se: ${bemEstar.movimentoMin} de ${bemEstar.metaMin} minutos esta semana`, descricao: 'Qualquer atividade é melhor do que nenhuma.', rota: '/(app)/bem-estar/atividade' });
    }
  }

  const faltando = ESSENCIAIS.filter((k) => perfil[k] == null);
  if (faltando.length) {
    itens.push({
      id: 'perfil_incompleto',
      nivel: 'amarelo',
      titulo: 'Completar meu perfil de saúde',
      descricao: faltando.length === 1 ? 'Falta 1 informação essencial.' : `Faltam ${faltando.length} informações essenciais.`,
      rota: '/(app)/(tabs)/minha-saude/perfil',
    });
  }
  if (antecedentesQtd === 0 && !perfil.semAntecedentesFamiliares) {
    itens.push({
      id: 'antecedentes',
      nivel: 'cinza',
      titulo: 'Registrar antecedentes familiares',
      descricao: 'Casos de câncer ou infarto precoce na família ajudam a definir seus rastreamentos.',
      rota: '/(app)/(tabs)/minha-saude/antecedentes',
      acaoSecundaria: { rotulo: 'Não há casos na família', campo: 'semAntecedentesFamiliares' },
    });
  }
  if (medicacoesAtivasQtd === 0 && !perfil.semMedicacoes) {
    itens.push({
      id: 'medicacoes',
      nivel: 'cinza',
      titulo: 'Cadastrar meus medicamentos',
      descricao: 'Entram nos relatórios para o seu médico.',
      rota: '/(app)/(tabs)/minha-saude/medicamentos',
      acaoSecundaria: { rotulo: 'Não uso medicamentos', campo: 'semMedicacoes' },
    });
  }
  if (!itens.length) {
    itens.push({
      id: 'tudo_em_dia',
      nivel: 'verde',
      titulo: 'Nada pendente',
      descricao: rastreando && cardio ? 'Perfil completo, rastreamentos e pressão em ordem.' : rastreando ? 'Perfil completo e rastreamentos em ordem.' : 'Seu perfil está completo.',
      rota: '/(app)/(tabs)/minha-saude',
    });
  }
  return itens.sort((a, b) => PESO[a.nivel] - PESO[b.nivel]);
}
