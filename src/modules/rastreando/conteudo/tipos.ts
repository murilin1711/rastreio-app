export interface SinalAlerta {
  id: string;
  texto: string;
}

export interface ConteudoPrograma {
  titulo: string;
  subtitulo: string;
  /** Ícone Ionicons e gradiente de capa do card. */
  icone: string;
  capa: [string, string];
  /** 3–5 parágrafos curtos (§29.1). */
  entenda: string[];
  /** §29.3 — aumentam o risco, mas não mudam o protocolo. */
  fatoresEducativos: string[];
  /** §29.3 — mudam idade de início, exame, periodicidade ou exigem especialista. */
  fatoresModificadores: string[];
  /** §29.4 / §52 — `id` é o valor gravado em `sintomas_alarme.sintoma`. */
  sinaisAlerta: SinalAlerta[];
  fonteResumo: string;
  /** Texto opcional sobre a recomendação do SUS quando difere da adotada. */
  noSus?: string;
}
