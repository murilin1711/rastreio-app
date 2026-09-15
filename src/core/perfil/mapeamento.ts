import type { Database } from '@core/supabase/database.types';
import type { PerfilSaude } from './tipos';

type Row = Database['public']['Tables']['perfil_saude']['Row'];
type Update = Database['public']['Tables']['perfil_saude']['Update'];
type CampoDominio = Exclude<keyof PerfilSaude, 'userId'>;

const colunas: Record<CampoDominio, keyof Update> = {
  nome: 'nome',
  dataNascimento: 'data_nascimento',
  sexoNascimento: 'sexo_nascimento',
  possuiColoUtero: 'possui_colo_utero',
  histerectomia: 'histerectomia',
  alturaCm: 'altura_cm',
  tabagismoStatus: 'tabagismo_status',
  cigarrosDia: 'cigarros_dia',
  anosFumando: 'anos_fumando',
  dataCessacao: 'data_cessacao',
  temDiabetes: 'tem_diabetes',
  temHipertensao: 'tem_hipertensao',
  temDoencaRenal: 'tem_doenca_renal',
  temImunossupressao: 'tem_imunossupressao',
  temHiv: 'tem_hiv',
  temDii: 'tem_dii',
  historicoCancerPessoal: 'historico_cancer_pessoal',
  lesoesPrecursoras: 'lesoes_precursoras',
  doencasGeneticas: 'doencas_geneticas',
  radioterapiaToracica: 'radioterapia_toracica',
  semMedicacoes: 'sem_medicacoes',
  semAntecedentesFamiliares: 'sem_antecedentes_familiares',
  perfilInicialCompleto: 'perfil_inicial_completo',
};

export function paraDominio(r: Row): PerfilSaude {
  return {
    userId: r.user_id,
    nome: r.nome,
    dataNascimento: r.data_nascimento,
    sexoNascimento: r.sexo_nascimento as PerfilSaude['sexoNascimento'],
    possuiColoUtero: r.possui_colo_utero,
    histerectomia: r.histerectomia,
    alturaCm: r.altura_cm,
    tabagismoStatus: r.tabagismo_status as PerfilSaude['tabagismoStatus'],
    cigarrosDia: r.cigarros_dia,
    anosFumando: r.anos_fumando,
    dataCessacao: r.data_cessacao,
    temDiabetes: r.tem_diabetes,
    temHipertensao: r.tem_hipertensao,
    temDoencaRenal: r.tem_doenca_renal,
    temImunossupressao: r.tem_imunossupressao,
    temHiv: r.tem_hiv,
    temDii: r.tem_dii,
    historicoCancerPessoal: (r.historico_cancer_pessoal as PerfilSaude['historicoCancerPessoal']) ?? [],
    lesoesPrecursoras: (r.lesoes_precursoras as PerfilSaude['lesoesPrecursoras']) ?? [],
    doencasGeneticas: (r.doencas_geneticas as PerfilSaude['doencasGeneticas']) ?? [],
    radioterapiaToracica: r.radioterapia_toracica,
    semMedicacoes: r.sem_medicacoes,
    semAntecedentesFamiliares: r.sem_antecedentes_familiares,
    perfilInicialCompleto: r.perfil_inicial_completo,
  };
}

/** Converte só os campos presentes (undefined é ignorado; null é enviado para limpar). */
export function paraBanco(p: Partial<Omit<PerfilSaude, 'userId'>>): Update {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) {
    const col = colunas[k as CampoDominio];
    if (col && v !== undefined) out[col] = v;
  }
  return out as Update;
}
