import type { MomentoGlicemia, SintomaGlicemia } from '@core/regras/cardio/tiposGlicemia';

/** Textos do Minha Glicemia (§5–§8). Fonte: Diretriz da SBD ed. 2026; linguagem do §25. Revisão clínica: docs/nero/revisao/ (Fase 2b). */
export const MOMENTOS: { valor: MomentoGlicemia; rotulo: string }[] = [
  { valor: 'jejum', rotulo: 'Em jejum' },
  { valor: 'antes_cafe', rotulo: 'Antes do café' },
  { valor: 'pos_cafe_1h', rotulo: '1 h após o café' },
  { valor: 'pos_cafe_2h', rotulo: '2 h após o café' },
  { valor: 'antes_almoco', rotulo: 'Antes do almoço' },
  { valor: 'pos_almoco_1h', rotulo: '1 h após o almoço' },
  { valor: 'pos_almoco_2h', rotulo: '2 h após o almoço' },
  { valor: 'antes_jantar', rotulo: 'Antes do jantar' },
  { valor: 'pos_jantar_1h', rotulo: '1 h após o jantar' },
  { valor: 'pos_jantar_2h', rotulo: '2 h após o jantar' },
  { valor: 'antes_dormir', rotulo: 'Antes de dormir' },
  { valor: 'madrugada', rotulo: 'Madrugada' },
  { valor: 'antes_exercicio', rotulo: 'Antes do exercício' },
  { valor: 'depois_exercicio', rotulo: 'Depois do exercício' },
  { valor: 'sintomas_hipoglicemia', rotulo: 'Com sintomas de hipoglicemia' },
  { valor: 'aleatoria', rotulo: 'Medida aleatória' },
  { valor: 'outro', rotulo: 'Outro' },
];
export const rotuloMomento = (m: MomentoGlicemia) => MOMENTOS.find((x) => x.valor === m)?.rotulo ?? m;

export const SINTOMAS_GLICEMIA: { valor: SintomaGlicemia; rotulo: string }[] = [
  { valor: 'tremor', rotulo: 'Tremor' },
  { valor: 'sudorese', rotulo: 'Suor frio' },
  { valor: 'tontura', rotulo: 'Tontura' },
  { valor: 'fraqueza', rotulo: 'Fraqueza' },
  { valor: 'confusao', rotulo: 'Confusão mental' },
  { valor: 'precisou_de_ajuda', rotulo: 'Precisei da ajuda de outra pessoa' },
  { valor: 'sede_intensa', rotulo: 'Sede intensa' },
  { valor: 'nausea', rotulo: 'Náusea' },
  { valor: 'vomito', rotulo: 'Vômito' },
  { valor: 'dor_abdominal', rotulo: 'Dor na barriga' },
  { valor: 'respiracao_rapida', rotulo: 'Respiração rápida' },
  { valor: 'sonolencia', rotulo: 'Sonolência' },
];

export const entendaMetas = 'As metas ajudam a organizar seus registros e a conversa com seu médico. Elas não mudam seu tratamento: quem ajusta remédio ou insulina é o profissional que acompanha você.';
export const semDiabetesRodape = 'Você não tem diabetes no seu perfil, por isso não há metas aqui. Glicemia medida no dedo não faz diagnóstico; se algum valor chamar atenção, o app sugere conversar com seu médico sobre um exame de laboratório.';
export const ressalvaRelatorioGlicemia = 'Este relatório organiza seus registros de glicemia e não substitui a interpretação realizada pelo seu médico.';
export const ROTULO_PERFIL_META = { adulto: 'adulto / idoso saudável', idoso_comprometido: 'idoso com saúde comprometida', idoso_muito_comprometido: 'idoso muito comprometido' } as const;
