export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      antecedentes_familiares: {
        Row: {
          condicao: string
          created_at: string
          grau: string
          id: string
          idade_diagnostico: number | null
          observacao: string | null
          parentesco: string
          user_id: string
        }
        Insert: {
          condicao: string
          created_at?: string
          grau: string
          id?: string
          idade_diagnostico?: number | null
          observacao?: string | null
          parentesco: string
          user_id: string
        }
        Update: {
          condicao?: string
          created_at?: string
          grau?: string
          id?: string
          idade_diagnostico?: number | null
          observacao?: string | null
          parentesco?: string
          user_id?: string
        }
        Relationships: []
      }
      atividades: {
        Row: {
          calorias: number | null
          created_at: string
          distancia_km: number | null
          duracao_min: number
          fc_media: number | null
          id: string
          inicio: string
          intensidade: string
          observacao: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          calorias?: number | null
          created_at?: string
          distancia_km?: number | null
          duracao_min: number
          fc_media?: number | null
          id?: string
          inicio: string
          intensidade: string
          observacao?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          calorias?: number | null
          created_at?: string
          distancia_km?: number | null
          duracao_min?: number
          fc_media?: number | null
          id?: string
          inicio?: string
          intensidade?: string
          observacao?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          alimentacao: number | null
          atividade: number | null
          bem_estar: number | null
          created_at: string
          disposicao: number | null
          energia: number | null
          estresse: number | null
          id: string
          observacao: string | null
          semana: string
          sono: number | null
          user_id: string
        }
        Insert: {
          alimentacao?: number | null
          atividade?: number | null
          bem_estar?: number | null
          created_at?: string
          disposicao?: number | null
          energia?: number | null
          estresse?: number | null
          id?: string
          observacao?: string | null
          semana: string
          sono?: number | null
          user_id: string
        }
        Update: {
          alimentacao?: number | null
          atividade?: number | null
          bem_estar?: number | null
          created_at?: string
          disposicao?: number | null
          energia?: number | null
          estresse?: number | null
          id?: string
          observacao?: string | null
          semana?: string
          sono?: number | null
          user_id?: string
        }
        Relationships: []
      }
      compartilhamentos: {
        Row: {
          caminho: string
          created_at: string
          especialidade: string | null
          expira_em: string
          id: string
          revogado_em: string | null
          tipo_relatorio: string
          user_id: string
        }
        Insert: {
          caminho: string
          created_at?: string
          especialidade?: string | null
          expira_em: string
          id?: string
          revogado_em?: string | null
          tipo_relatorio: string
          user_id: string
        }
        Update: {
          caminho?: string
          created_at?: string
          especialidade?: string | null
          expira_em?: string
          id?: string
          revogado_em?: string | null
          tipo_relatorio?: string
          user_id?: string
        }
        Relationships: []
      }
      conquistas: {
        Row: {
          chave: string
          conquistada_em: string
          user_id: string
        }
        Insert: {
          chave: string
          conquistada_em?: string
          user_id: string
        }
        Update: {
          chave?: string
          conquistada_em?: string
          user_id?: string
        }
        Relationships: []
      }
      consentimentos: {
        Row: {
          aceito_em: string
          tipo: string
          user_id: string
          versao: string
        }
        Insert: {
          aceito_em?: string
          tipo: string
          user_id: string
          versao: string
        }
        Update: {
          aceito_em?: string
          tipo?: string
          user_id?: string
          versao?: string
        }
        Relationships: []
      }
      consultas: {
        Row: {
          created_at: string
          data_hora: string
          especialidade: string
          id: string
          local: string | null
          observacao: string | null
          profissional: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_hora: string
          especialidade: string
          id?: string
          local?: string | null
          observacao?: string | null
          profissional?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_hora?: string
          especialidade?: string
          id?: string
          local?: string | null
          observacao?: string | null
          profissional?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dias_ativos: {
        Row: {
          dia: string
          user_id: string
        }
        Insert: {
          dia: string
          user_id: string
        }
        Update: {
          dia?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos: {
        Row: {
          caminho: string
          created_at: string
          data_documento: string | null
          exame_id: string | null
          id: string
          mime: string
          nome: string
          observacao: string | null
          tamanho: number
          tipo: string
          user_id: string
        }
        Insert: {
          caminho: string
          created_at?: string
          data_documento?: string | null
          exame_id?: string | null
          id?: string
          mime: string
          nome: string
          observacao?: string | null
          tamanho: number
          tipo: string
          user_id: string
        }
        Update: {
          caminho?: string
          created_at?: string
          data_documento?: string | null
          exame_id?: string | null
          id?: string
          mime?: string
          nome?: string
          observacao?: string | null
          tamanho?: number
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_exame_id_fkey"
            columns: ["exame_id"]
            isOneToOne: false
            referencedRelation: "exames"
            referencedColumns: ["id"]
          },
        ]
      }
      exames: {
        Row: {
          abre_pendencia: boolean
          anexos: Json
          categoria: string
          classificacao: string | null
          created_at: string
          data_proxima_acao: string | null
          data_realizacao: string
          id: string
          instituicao: string | null
          laudo_texto: string | null
          modulo: string
          nivel_alerta: string | null
          observacoes: string | null
          programa: string | null
          proxima_acao: string | null
          regra_id: string | null
          regra_versao: string | null
          resolve_exame_id: string | null
          resultado: Json
          solicitante: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          abre_pendencia?: boolean
          anexos?: Json
          categoria: string
          classificacao?: string | null
          created_at?: string
          data_proxima_acao?: string | null
          data_realizacao: string
          id?: string
          instituicao?: string | null
          laudo_texto?: string | null
          modulo: string
          nivel_alerta?: string | null
          observacoes?: string | null
          programa?: string | null
          proxima_acao?: string | null
          regra_id?: string | null
          regra_versao?: string | null
          resolve_exame_id?: string | null
          resultado?: Json
          solicitante?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          abre_pendencia?: boolean
          anexos?: Json
          categoria?: string
          classificacao?: string | null
          created_at?: string
          data_proxima_acao?: string | null
          data_realizacao?: string
          id?: string
          instituicao?: string | null
          laudo_texto?: string | null
          modulo?: string
          nivel_alerta?: string | null
          observacoes?: string | null
          programa?: string | null
          proxima_acao?: string | null
          regra_id?: string | null
          regra_versao?: string | null
          resolve_exame_id?: string | null
          resultado?: Json
          solicitante?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exames_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_clinicas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exames_resolve_exame_id_fkey"
            columns: ["resolve_exame_id"]
            isOneToOne: false
            referencedRelation: "exames"
            referencedColumns: ["id"]
          },
        ]
      }
      lembretes: {
        Row: {
          agendado_para: string
          created_at: string
          id: string
          mensagem: string | null
          origem_id: string | null
          origem_tipo: string
          status: string
          titulo: string
          user_id: string
        }
        Insert: {
          agendado_para: string
          created_at?: string
          id?: string
          mensagem?: string | null
          origem_id?: string | null
          origem_tipo: string
          status?: string
          titulo: string
          user_id: string
        }
        Update: {
          agendado_para?: string
          created_at?: string
          id?: string
          mensagem?: string | null
          origem_id?: string | null
          origem_tipo?: string
          status?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      medicacoes: {
        Row: {
          ate: string | null
          ativa: boolean
          created_at: string
          desde: string | null
          dose: string | null
          horarios: Json
          id: string
          lembrar: boolean
          nome: string
          observacao: string | null
          prescritor: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ate?: string | null
          ativa?: boolean
          created_at?: string
          desde?: string | null
          dose?: string | null
          horarios?: Json
          id?: string
          lembrar?: boolean
          nome: string
          observacao?: string | null
          prescritor?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ate?: string | null
          ativa?: boolean
          created_at?: string
          desde?: string | null
          dose?: string | null
          horarios?: Json
          id?: string
          lembrar?: boolean
          nome?: string
          observacao?: string | null
          prescritor?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      medidas: {
        Row: {
          contexto: Json
          created_at: string
          id: string
          medido_em: string
          observacao: string | null
          sessao_id: string | null
          tipo: string
          user_id: string
          valores: Json
        }
        Insert: {
          contexto?: Json
          created_at?: string
          id?: string
          medido_em: string
          observacao?: string | null
          sessao_id?: string | null
          tipo: string
          user_id: string
          valores: Json
        }
        Update: {
          contexto?: Json
          created_at?: string
          id?: string
          medido_em?: string
          observacao?: string | null
          sessao_id?: string | null
          tipo?: string
          user_id?: string
          valores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "medidas_sessao_id_fkey"
            columns: ["sessao_id"]
            isOneToOne: false
            referencedRelation: "mrpa_sessoes"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ativa: boolean
          created_at: string
          detalhe: string | null
          id: string
          marco_comemorado: number
          origem: string
          tipo: string
          user_id: string
          valor: number
          valor_inicial: number | null
        }
        Insert: {
          ativa?: boolean
          created_at?: string
          detalhe?: string | null
          id?: string
          marco_comemorado?: number
          origem: string
          tipo: string
          user_id: string
          valor: number
          valor_inicial?: number | null
        }
        Update: {
          ativa?: boolean
          created_at?: string
          detalhe?: string | null
          id?: string
          marco_comemorado?: number
          origem?: string
          tipo?: string
          user_id?: string
          valor?: number
          valor_inicial?: number | null
        }
        Relationships: []
      }
      mrpa_sessoes: {
        Row: {
          concluida_em: string | null
          created_at: string
          dias_previstos: number
          fim: string | null
          horarios: Json
          id: string
          inicio: string
          pa_consultorio: Json | null
          resultado: Json | null
          status: string
          user_id: string
        }
        Insert: {
          concluida_em?: string | null
          created_at?: string
          dias_previstos?: number
          fim?: string | null
          horarios?: Json
          id?: string
          inicio: string
          pa_consultorio?: Json | null
          resultado?: Json | null
          status?: string
          user_id: string
        }
        Update: {
          concluida_em?: string | null
          created_at?: string
          dias_previstos?: number
          fim?: string | null
          horarios?: Json
          id?: string
          inicio?: string
          pa_consultorio?: Json | null
          resultado?: Json | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pendencias: {
        Row: {
          aberta_em: string
          descricao: string
          exame_origem_id: string
          exame_resolucao_id: string | null
          id: string
          nivel_alerta: string
          programa: string | null
          resolvida_em: string | null
          status: string
          user_id: string
        }
        Insert: {
          aberta_em?: string
          descricao: string
          exame_origem_id: string
          exame_resolucao_id?: string | null
          id?: string
          nivel_alerta: string
          programa?: string | null
          resolvida_em?: string | null
          status?: string
          user_id: string
        }
        Update: {
          aberta_em?: string
          descricao?: string
          exame_origem_id?: string
          exame_resolucao_id?: string | null
          id?: string
          nivel_alerta?: string
          programa?: string | null
          resolvida_em?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pendencias_exame_origem_id_fkey"
            columns: ["exame_origem_id"]
            isOneToOne: false
            referencedRelation: "exames"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pendencias_exame_resolucao_id_fkey"
            columns: ["exame_resolucao_id"]
            isOneToOne: false
            referencedRelation: "exames"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_saude: {
        Row: {
          agravantes_cv: Json
          agua_meta_comemorada_em: string | null
          altura_cm: number | null
          anos_fumando: number | null
          atividade_fisica_regular: boolean | null
          cigarros_dia: number | null
          created_at: string
          data_cessacao: string | null
          data_nascimento: string | null
          doencas_geneticas: Json
          evento_cv_previo: boolean | null
          histerectomia: boolean | null
          historico_cancer_pessoal: Json
          ja_teve_atividade_sexual: boolean | null
          lembretes_agua: Json
          lesoes_precursoras: Json
          marco_sequencia_comemorado: number
          menopausa: boolean | null
          metas_glicemia: Json | null
          nome: string
          objetivo_peso: string | null
          perfil_inicial_completo: boolean
          perfil_meta_glicemica: string
          peso_maximo_vida_kg: number | null
          plano_glicemia: Json | null
          possui_colo_utero: boolean | null
          preferencias_lembretes: Json
          raca_cor: string | null
          radioterapia_toracica: boolean | null
          sem_antecedentes_familiares: boolean
          sem_medicacoes: boolean
          sexo_nascimento: string | null
          tabagismo_status: string | null
          tem_diabetes: boolean | null
          tem_dii: boolean | null
          tem_doenca_renal: boolean | null
          tem_hipertensao: boolean | null
          tem_hiv: boolean | null
          tem_imunossupressao: boolean | null
          tem_insuficiencia_cardiaca: boolean | null
          tipo_diabetes: string | null
          tipo_usuario: string
          updated_at: string
          usa_insulina: string | null
          user_id: string
        }
        Insert: {
          agravantes_cv?: Json
          agua_meta_comemorada_em?: string | null
          altura_cm?: number | null
          anos_fumando?: number | null
          atividade_fisica_regular?: boolean | null
          cigarros_dia?: number | null
          created_at?: string
          data_cessacao?: string | null
          data_nascimento?: string | null
          doencas_geneticas?: Json
          evento_cv_previo?: boolean | null
          histerectomia?: boolean | null
          historico_cancer_pessoal?: Json
          ja_teve_atividade_sexual?: boolean | null
          lembretes_agua?: Json
          lesoes_precursoras?: Json
          marco_sequencia_comemorado?: number
          menopausa?: boolean | null
          metas_glicemia?: Json | null
          nome: string
          objetivo_peso?: string | null
          perfil_inicial_completo?: boolean
          perfil_meta_glicemica?: string
          peso_maximo_vida_kg?: number | null
          plano_glicemia?: Json | null
          possui_colo_utero?: boolean | null
          preferencias_lembretes?: Json
          raca_cor?: string | null
          radioterapia_toracica?: boolean | null
          sem_antecedentes_familiares?: boolean
          sem_medicacoes?: boolean
          sexo_nascimento?: string | null
          tabagismo_status?: string | null
          tem_diabetes?: boolean | null
          tem_dii?: boolean | null
          tem_doenca_renal?: boolean | null
          tem_hipertensao?: boolean | null
          tem_hiv?: boolean | null
          tem_imunossupressao?: boolean | null
          tem_insuficiencia_cardiaca?: boolean | null
          tipo_diabetes?: string | null
          tipo_usuario?: string
          updated_at?: string
          usa_insulina?: string | null
          user_id: string
        }
        Update: {
          agravantes_cv?: Json
          agua_meta_comemorada_em?: string | null
          altura_cm?: number | null
          anos_fumando?: number | null
          atividade_fisica_regular?: boolean | null
          cigarros_dia?: number | null
          created_at?: string
          data_cessacao?: string | null
          data_nascimento?: string | null
          doencas_geneticas?: Json
          evento_cv_previo?: boolean | null
          histerectomia?: boolean | null
          historico_cancer_pessoal?: Json
          ja_teve_atividade_sexual?: boolean | null
          lembretes_agua?: Json
          lesoes_precursoras?: Json
          marco_sequencia_comemorado?: number
          menopausa?: boolean | null
          metas_glicemia?: Json | null
          nome?: string
          objetivo_peso?: string | null
          perfil_inicial_completo?: boolean
          perfil_meta_glicemica?: string
          peso_maximo_vida_kg?: number | null
          plano_glicemia?: Json | null
          possui_colo_utero?: boolean | null
          preferencias_lembretes?: Json
          raca_cor?: string | null
          radioterapia_toracica?: boolean | null
          sem_antecedentes_familiares?: boolean
          sem_medicacoes?: boolean
          sexo_nascimento?: string | null
          tabagismo_status?: string | null
          tem_diabetes?: boolean | null
          tem_dii?: boolean | null
          tem_doenca_renal?: boolean | null
          tem_hipertensao?: boolean | null
          tem_hiv?: boolean | null
          tem_imunossupressao?: boolean | null
          tem_insuficiencia_cardiaca?: boolean | null
          tipo_diabetes?: string | null
          tipo_usuario?: string
          updated_at?: string
          usa_insulina?: string | null
          user_id?: string
        }
        Relationships: []
      }
      refeicoes: {
        Row: {
          created_at: string
          descricao: string
          documento_id: string | null
          em: string
          fome_antes: number | null
          id: string
          local: string | null
          observacao: string | null
          quantidade: string | null
          saciedade: string | null
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          documento_id?: string | null
          em: string
          fome_antes?: number | null
          id?: string
          local?: string | null
          observacao?: string | null
          quantidade?: string | null
          saciedade?: string | null
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          documento_id?: string | null
          em?: string
          fome_antes?: number | null
          id?: string
          local?: string | null
          observacao?: string | null
          quantidade?: string | null
          saciedade?: string | null
          tipo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refeicoes_documento_id_fkey"
            columns: ["documento_id"]
            isOneToOne: false
            referencedRelation: "documentos"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_clinicas: {
        Row: {
          ano: number
          ativa: boolean
          classificacao: string | null
          condicao: Json
          created_at: string
          exame_tipo: string | null
          fonte: string
          id: string
          intervalo_meses: number | null
          mensagem_paciente: string | null
          mensagem_profissional: string | null
          modulo: string
          nivel_alerta: string | null
          programa: string | null
          proxima_acao: string | null
          revisada_em: string
          versao: string
        }
        Insert: {
          ano: number
          ativa?: boolean
          classificacao?: string | null
          condicao?: Json
          created_at?: string
          exame_tipo?: string | null
          fonte: string
          id?: string
          intervalo_meses?: number | null
          mensagem_paciente?: string | null
          mensagem_profissional?: string | null
          modulo: string
          nivel_alerta?: string | null
          programa?: string | null
          proxima_acao?: string | null
          revisada_em: string
          versao: string
        }
        Update: {
          ano?: number
          ativa?: boolean
          classificacao?: string | null
          condicao?: Json
          created_at?: string
          exame_tipo?: string | null
          fonte?: string
          id?: string
          intervalo_meses?: number | null
          mensagem_paciente?: string | null
          mensagem_profissional?: string | null
          modulo?: string
          nivel_alerta?: string | null
          programa?: string | null
          proxima_acao?: string | null
          revisada_em?: string
          versao?: string
        }
        Relationships: []
      }
      riscos_cv: {
        Row: {
          agravantes_presentes: string[]
          ascvd_10: number
          ascvd_30: number | null
          calculado_em: string
          categoria: string
          created_at: string
          entradas: Json
          id: string
          modelo: string
          user_id: string
          versao_coeficientes: string
        }
        Insert: {
          agravantes_presentes?: string[]
          ascvd_10: number
          ascvd_30?: number | null
          calculado_em?: string
          categoria: string
          created_at?: string
          entradas: Json
          id?: string
          modelo: string
          user_id: string
          versao_coeficientes: string
        }
        Update: {
          agravantes_presentes?: string[]
          ascvd_10?: number
          ascvd_30?: number | null
          calculado_em?: string
          categoria?: string
          created_at?: string
          entradas?: Json
          id?: string
          modelo?: string
          user_id?: string
          versao_coeficientes?: string
        }
        Relationships: []
      }
      sintomas_alarme: {
        Row: {
          id: string
          observacao: string | null
          programa: string
          registrado_em: string
          resolvido_em: string | null
          sintoma: string
          user_id: string
        }
        Insert: {
          id?: string
          observacao?: string | null
          programa: string
          registrado_em?: string
          resolvido_em?: string | null
          sintoma: string
          user_id: string
        }
        Update: {
          id?: string
          observacao?: string | null
          programa?: string
          registrado_em?: string
          resolvido_em?: string | null
          sintoma?: string
          user_id?: string
        }
        Relationships: []
      }
      vinculos_glicemia: {
        Row: {
          atividade_id: string | null
          created_at: string
          glicemia_id: string
          refeicao_id: string | null
        }
        Insert: {
          atividade_id?: string | null
          created_at?: string
          glicemia_id: string
          refeicao_id?: string | null
        }
        Update: {
          atividade_id?: string | null
          created_at?: string
          glicemia_id?: string
          refeicao_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vinculos_glicemia_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_glicemia_glicemia_id_fkey"
            columns: ["glicemia_id"]
            isOneToOne: true
            referencedRelation: "medidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vinculos_glicemia_refeicao_id_fkey"
            columns: ["refeicao_id"]
            isOneToOne: false
            referencedRelation: "refeicoes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      excluir_minha_conta: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

