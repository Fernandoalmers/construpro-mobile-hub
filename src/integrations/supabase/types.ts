export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      professional_reviews: {
        Row: {
          cliente_id: string | null
          comentario: string
          data: string
          id: string
          nome_cliente: string
          nota: number
          profissional_id: string | null
          projeto_id: string | null
          servico_realizado: string
        }
        Insert: {
          cliente_id?: string | null
          comentario: string
          data: string
          id?: string
          nome_cliente: string
          nota: number
          profissional_id?: string | null
          projeto_id?: string | null
          servico_realizado: string
        }
        Update: {
          cliente_id?: string | null
          comentario?: string
          data?: string
          id?: string
          nome_cliente?: string
          nota?: number
          profissional_id?: string | null
          projeto_id?: string | null
          servico_realizado?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_reviews_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_reviews_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "professional_reviews_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          area_atuacao: string
          avaliacao: number | null
          cidade: string
          especialidade: string
          especialidades: string[] | null
          estado: string
          foto_perfil: string | null
          id: string
          nome: string
          portfolio: string[] | null
          profile_id: string | null
          servicos_realizados: number | null
          sobre: string
          telefone: string
        }
        Insert: {
          area_atuacao: string
          avaliacao?: number | null
          cidade: string
          especialidade: string
          especialidades?: string[] | null
          estado: string
          foto_perfil?: string | null
          id?: string
          nome: string
          portfolio?: string[] | null
          profile_id?: string | null
          servicos_realizados?: number | null
          sobre: string
          telefone: string
        }
        Update: {
          area_atuacao?: string
          avaliacao?: number | null
          cidade?: string
          especialidade?: string
          especialidades?: string[] | null
          estado?: string
          foto_perfil?: string | null
          id?: string
          nome?: string
          portfolio?: string[] | null
          profile_id?: string | null
          servicos_realizados?: number | null
          sobre?: string
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          codigo: string | null
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          is_admin: boolean | null
          nome: string | null
          papel: string | null
          saldo_pontos: number | null
          status: string | null
          telefone: string | null
          tipo_perfil: string | null
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          codigo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          is_admin?: boolean | null
          nome?: string | null
          papel?: string | null
          saldo_pontos?: number | null
          status?: string | null
          telefone?: string | null
          tipo_perfil?: string | null
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          codigo?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_admin?: boolean | null
          nome?: string | null
          papel?: string | null
          saldo_pontos?: number | null
          status?: string | null
          telefone?: string | null
          tipo_perfil?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          data_upload: string
          descricao: string | null
          id: string
          project_id: string | null
          url: string
        }
        Insert: {
          data_upload: string
          descricao?: string | null
          id?: string
          project_id?: string | null
          url: string
        }
        Update: {
          data_upload?: string
          descricao?: string | null
          id?: string
          project_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_steps: {
        Row: {
          comentario: string | null
          concluido: boolean
          data_conclusao: string | null
          descricao: string
          id: string
          ordem: number
          project_id: string | null
          titulo: string
        }
        Insert: {
          comentario?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          descricao: string
          id?: string
          ordem: number
          project_id?: string | null
          titulo: string
        }
        Update: {
          comentario?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          descricao?: string
          id?: string
          ordem?: number
          project_id?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_steps_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          avaliado: boolean
          categoria: string | null
          cliente_id: string | null
          comentarios_finais: string | null
          comentarios_iniciais: string | null
          concluido: boolean
          data_conclusao: string | null
          data_estimada: string
          data_inicio: string
          data_termino: string | null
          descricao: string
          duracao_estimada: number | null
          endereco: string
          especialidade_contraparte: string | null
          foto_contraparte: string | null
          id: string
          nome_contraparte: string
          profissional_id: string | null
          status: string
          titulo: string
          valor: string
        }
        Insert: {
          avaliado?: boolean
          categoria?: string | null
          cliente_id?: string | null
          comentarios_finais?: string | null
          comentarios_iniciais?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          data_estimada: string
          data_inicio: string
          data_termino?: string | null
          descricao: string
          duracao_estimada?: number | null
          endereco: string
          especialidade_contraparte?: string | null
          foto_contraparte?: string | null
          id?: string
          nome_contraparte: string
          profissional_id?: string | null
          status: string
          titulo: string
          valor: string
        }
        Update: {
          avaliado?: boolean
          categoria?: string | null
          cliente_id?: string | null
          comentarios_finais?: string | null
          comentarios_iniciais?: string | null
          concluido?: boolean
          data_conclusao?: string | null
          data_estimada?: string
          data_inicio?: string
          data_termino?: string | null
          descricao?: string
          duracao_estimada?: number | null
          endereco?: string
          especialidade_contraparte?: string | null
          foto_contraparte?: string | null
          id?: string
          nome_contraparte?: string
          profissional_id?: string | null
          status?: string
          titulo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          data_criacao: string | null
          especialidade_profissional: string
          foto_profissional: string | null
          id: string
          mensagem: string
          nome_profissional: string
          prazo: string
          profissional_id: string | null
          service_request_id: string | null
          status: string
          valor: string
        }
        Insert: {
          data_criacao?: string | null
          especialidade_profissional: string
          foto_profissional?: string | null
          id?: string
          mensagem: string
          nome_profissional: string
          prazo: string
          profissional_id?: string | null
          service_request_id?: string | null
          status?: string
          valor: string
        }
        Update: {
          data_criacao?: string | null
          especialidade_profissional?: string
          foto_profissional?: string | null
          id?: string
          mensagem?: string
          nome_profissional?: string
          prazo?: string
          profissional_id?: string | null
          service_request_id?: string | null
          status?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposals_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          categoria: string
          cliente_id: string | null
          contato_cliente: string
          data: string | null
          data_criacao: string | null
          descricao: string
          detalhes_cliente: string | null
          endereco: string
          horario: string | null
          id: string
          informacoes_adicionais: string | null
          localizacao: string | null
          nome_cliente: string
          orcamento: string | null
          requisitos: string[] | null
          status: string
          titulo: string
        }
        Insert: {
          categoria: string
          cliente_id?: string | null
          contato_cliente: string
          data?: string | null
          data_criacao?: string | null
          descricao: string
          detalhes_cliente?: string | null
          endereco: string
          horario?: string | null
          id?: string
          informacoes_adicionais?: string | null
          localizacao?: string | null
          nome_cliente: string
          orcamento?: string | null
          requisitos?: string[] | null
          status?: string
          titulo: string
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          contato_cliente?: string
          data?: string | null
          data_criacao?: string | null
          descricao?: string
          detalhes_cliente?: string | null
          endereco?: string
          horario?: string | null
          id?: string
          informacoes_adicionais?: string | null
          localizacao?: string | null
          nome_cliente?: string
          orcamento?: string | null
          requisitos?: string[] | null
          status?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          action: string
          entity_type: string
          entity_id: string
          details?: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
