import type { RegraParametros } from '../../tipos';

const base = { versao: '2026.2', ano: 2025, intervaloMeses: null, proximaAcao: '', classificacao: 'normal' as const, nivelAlerta: 'verde' as const };

/** Espelho da semente `supabase/seed.sql` (programa risco_cv). Manter igual. */
export function regrasRiscoTeste(): RegraParametros[] {
  return [
    { ...base, id: 'r-cat', fonte: 'Dislipidemias 2025 T4.1', condicao: { camada: 'categorias', baixo_max: 5, alto_min: 20 }, mensagemPaciente: 'Categoria pelo escore.' },
    { ...base, id: 'r-eleg', fonte: 'Dislipidemias 2025 §4.2', condicao: { camada: 'elegibilidade', idade_min: 30, idade_max: 79 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Escore não desenvolvido para sua situação.' },
    { ...base, id: 'r-cac', fonte: 'Dislipidemias 2025 T4.4', condicao: { camada: 'cac', alto: 100, percentil_alto: 75, muito_alto: 300 }, classificacao: 'controle', nivelAlerta: 'amarelo', mensagemPaciente: 'Estratificador de risco.' },
    { ...base, id: 'r-recente', fonte: 'C-014', condicao: { camada: 'dado_recente', pa_mrpa_dias: 30, pa_casual_dias: 7, pa_casual_min: 3, peso_dias: 30, peso_perguntar_dias: 90, lipidios_meses: 12, renal_meses: 12, hba1c_meses: 6, rac_meses: 12, risco_meses: 12 }, classificacao: 'pendente', nivelAlerta: 'cinza', mensagemPaciente: 'Dados com mais de um ano.' },
  ];
}
