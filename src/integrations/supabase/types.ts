export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      access_events: {
        Row: {
          client_id: string | null
          created_at: string
          destination_url_snapshot: string | null
          device_type: string | null
          id: string
          plate_id: string
          source: string
          user_agent: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          destination_url_snapshot?: string | null
          device_type?: string | null
          id?: string
          plate_id: string
          source: string
          user_agent?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          destination_url_snapshot?: string | null
          device_type?: string | null
          id?: string
          plate_id?: string
          source?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_events_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          created_at: string
          descricao: string | null
          id: string
          lead_id: string | null
          tipo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          descricao?: string | null
          id?: string
          lead_id?: string | null
          tipo?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          cidade: string | null
          cnpj: string | null
          created_at: string
          data_inicio: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          google_business_url: string | null
          google_review_url: string | null
          id: string
          instagram: string | null
          lead_id: string | null
          nome_empresa: string
          observacoes: string | null
          owner_id: string | null
          plano: string | null
          responsavel: string | null
          reviews_at_start: number | null
          reviews_current: number | null
          reviews_last_updated_at: string | null
          site: string | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
          whatsapp: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          google_business_url?: string | null
          google_review_url?: string | null
          id?: string
          instagram?: string | null
          lead_id?: string | null
          nome_empresa: string
          observacoes?: string | null
          owner_id?: string | null
          plano?: string | null
          responsavel?: string | null
          reviews_at_start?: number | null
          reviews_current?: number | null
          reviews_last_updated_at?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          data_inicio?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          google_business_url?: string | null
          google_review_url?: string | null
          id?: string
          instagram?: string | null
          lead_id?: string | null
          nome_empresa?: string
          observacoes?: string | null
          owner_id?: string | null
          plano?: string | null
          responsavel?: string | null
          reviews_at_start?: number | null
          reviews_current?: number | null
          reviews_last_updated_at?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          bairro: string | null
          categoria: string | null
          cep: string | null
          cidade: string | null
          cnpj: string | null
          created_at: string
          created_by: string | null
          email: string | null
          endereco: string | null
          estado: string | null
          google_url: string | null
          id: string
          instagram: string | null
          nome_empresa: string
          nome_fantasia: string | null
          observacoes: string | null
          origem: string | null
          owner_id: string | null
          responsavel: string | null
          segmento: string | null
          site: string | null
          status: string
          telefone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          bairro?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          google_url?: string | null
          id?: string
          instagram?: string | null
          nome_empresa: string
          nome_fantasia?: string | null
          observacoes?: string | null
          origem?: string | null
          owner_id?: string | null
          responsavel?: string | null
          segmento?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          bairro?: string | null
          categoria?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          endereco?: string | null
          estado?: string | null
          google_url?: string | null
          id?: string
          instagram?: string | null
          nome_empresa?: string
          nome_fantasia?: string | null
          observacoes?: string | null
          origem?: string | null
          owner_id?: string | null
          responsavel?: string | null
          segmento?: string | null
          site?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      destination_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          plate_id: string
          url_anterior: string | null
          url_nova: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          plate_id: string
          url_anterior?: string | null
          url_nova?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          plate_id?: string
          url_anterior?: string | null
          url_nova?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "destination_history_plate_id_fkey"
            columns: ["plate_id"]
            isOneToOne: false
            referencedRelation: "plates"
            referencedColumns: ["id"]
          },
        ]
      }
      followups: {
        Row: {
          concluido_at: string | null
          created_at: string
          data: string
          hora: string | null
          id: string
          lead_id: string | null
          observacao: string | null
          owner_id: string | null
          prioridade: string
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          concluido_at?: string | null
          created_at?: string
          data?: string
          hora?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          owner_id?: string | null
          prioridade?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          concluido_at?: string | null
          created_at?: string
          data?: string
          hora?: string | null
          id?: string
          lead_id?: string | null
          observacao?: string | null
          owner_id?: string | null
          prioridade?: string
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          alvo: number
          created_at: string
          data_fim: string
          data_inicio: string
          id: string
          metrica: string
          owner_id: string | null
          periodo: string
          updated_at: string
        }
        Insert: {
          alvo?: number
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          metrica: string
          owner_id?: string | null
          periodo?: string
          updated_at?: string
        }
        Update: {
          alvo?: number
          created_at?: string
          data_fim?: string
          data_inicio?: string
          id?: string
          metrica?: string
          owner_id?: string | null
          periodo?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          cidade: string | null
          company_id: string | null
          created_at: string
          email: string | null
          endereco: string | null
          estado: string | null
          id: string
          nome_empresa: string
          observacoes: string | null
          owner_id: string | null
          posicao: number
          proxima_acao: string | null
          proxima_acao_at: string | null
          responsavel: string | null
          segmento: string | null
          stage_changed_at: string
          stage_id: string | null
          telefone: string | null
          titulo: string | null
          ultimo_contato_at: string | null
          updated_at: string
          valor_estimado: number | null
          whatsapp: string | null
        }
        Insert: {
          cidade?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_empresa: string
          observacoes?: string | null
          owner_id?: string | null
          posicao?: number
          proxima_acao?: string | null
          proxima_acao_at?: string | null
          responsavel?: string | null
          segmento?: string | null
          stage_changed_at?: string
          stage_id?: string | null
          telefone?: string | null
          titulo?: string | null
          ultimo_contato_at?: string | null
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Update: {
          cidade?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string | null
          id?: string
          nome_empresa?: string
          observacoes?: string | null
          owner_id?: string | null
          posicao?: number
          proxima_acao?: string | null
          proxima_acao_at?: string | null
          responsavel?: string | null
          segmento?: string | null
          stage_changed_at?: string
          stage_id?: string | null
          telefone?: string | null
          titulo?: string | null
          ultimo_contato_at?: string | null
          updated_at?: string
          valor_estimado?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          created_by: string | null
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          categoria?: string
          conteudo: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          arquivada: boolean
          cor: string | null
          created_at: string
          id: string
          nome: string
          posicao: number
          tipo: string
          updated_at: string
        }
        Insert: {
          arquivada?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
          posicao?: number
          tipo?: string
          updated_at?: string
        }
        Update: {
          arquivada?: boolean
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
          posicao?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      plate_types: {
        Row: {
          created_at: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      plates: {
        Row: {
          client_id: string | null
          codigo_interno: string | null
          created_at: string
          created_by: string | null
          data_ativacao: string | null
          data_venda: string | null
          destination_url: string | null
          id: string
          nome: string
          observacoes: string | null
          plate_type_id: string | null
          public_id: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          codigo_interno?: string | null
          created_at?: string
          created_by?: string | null
          data_ativacao?: string | null
          data_venda?: string | null
          destination_url?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          plate_type_id?: string | null
          public_id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          codigo_interno?: string | null
          created_at?: string
          created_by?: string | null
          data_ativacao?: string | null
          data_venda?: string | null
          destination_url?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          plate_type_id?: string | null
          public_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plates_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plates_plate_type_id_fkey"
            columns: ["plate_type_id"]
            isOneToOne: false
            referencedRelation: "plate_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          nome: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nome?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          dados: Json | null
          id: string
          periodo_fim: string
          periodo_inicio: string
          share_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          dados?: Json | null
          id?: string
          periodo_fim: string
          periodo_inicio: string
          share_id?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          dados?: Json | null
          id?: string
          periodo_fim?: string
          periodo_inicio?: string
          share_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      review_snapshots: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          fonte: string
          id: string
          rating: number | null
          total_reviews: number
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          fonte?: string
          id?: string
          rating?: number | null
          total_reviews: number
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          fonte?: string
          id?: string
          rating?: number | null
          total_reviews?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          client_id: string | null
          created_at: string
          data_venda: string
          id: string
          lead_id: string | null
          observacoes: string | null
          plano: string | null
          updated_at: string
          valor: number
          vendedor_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          data_venda?: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          plano?: string | null
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          data_venda?: string
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          plano?: string | null
          updated_at?: string
          valor?: number
          vendedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_public_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      owns_client: { Args: { _client_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "cliente"
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
  public: {
    Enums: {
      app_role: ["admin", "vendedor", "cliente"],
    },
  },
} as const
