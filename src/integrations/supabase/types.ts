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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      artist_mercadopago_credentials: {
        Row: {
          access_token: string | null
          artist_id: string
          created_at: string | null
          id: string
          refresh_token: string | null
          seller_id: string | null
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          artist_id: string
          created_at?: string | null
          id?: string
          refresh_token?: string | null
          seller_id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          artist_id?: string
          created_at?: string | null
          id?: string
          refresh_token?: string | null
          seller_id?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_pix_info: {
        Row: {
          artist_id: string
          created_at: string | null
          id: string
          pix_chave: string | null
          pix_tipo_chave: string | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          id?: string
          pix_chave?: string | null
          pix_tipo_chave?: string | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          id?: string
          pix_chave?: string | null
          pix_tipo_chave?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      artist_subscriptions: {
        Row: {
          artista_id: string
          created_at: string
          ends_at: string | null
          id: string
          payment_id: string | null
          starts_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          valor: number
        }
        Insert: {
          artista_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          payment_id?: string | null
          starts_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          valor?: number
        }
        Update: {
          artista_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          payment_id?: string | null
          starts_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "artist_subscriptions_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gorjetas: {
        Row: {
          artista_id: string
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          payment_id: string | null
          pedido_mensagem: string | null
          pedido_musica: string | null
          qr_code: string | null
          qr_code_base64: string | null
          session_id: string | null
          status_pagamento: string | null
          taxa_plataforma: number
          valor: number
          valor_liquido_artista: number
        }
        Insert: {
          artista_id: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          pedido_mensagem?: string | null
          pedido_musica?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          session_id?: string | null
          status_pagamento?: string | null
          taxa_plataforma: number
          valor: number
          valor_liquido_artista: number
        }
        Update: {
          artista_id?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          payment_id?: string | null
          pedido_mensagem?: string | null
          pedido_musica?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          session_id?: string | null
          status_pagamento?: string | null
          taxa_plataforma?: number
          valor?: number
          valor_liquido_artista?: number
        }
        Relationships: [
          {
            foreignKeyName: "gorjetas_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjetas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          conteudo: string
          created_at: string | null
          destinatario_id: string
          id: string
          lida: boolean | null
          remetente_id: string
        }
        Insert: {
          conteudo: string
          created_at?: string | null
          destinatario_id: string
          id?: string
          lida?: boolean | null
          remetente_id: string
        }
        Update: {
          conteudo?: string
          created_at?: string | null
          destinatario_id?: string
          id?: string
          lida?: boolean | null
          remetente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_destinatario_id_fkey"
            columns: ["destinatario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_remetente_id_fkey"
            columns: ["remetente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      musicas_repertorio: {
        Row: {
          artista_id: string
          artista_original: string | null
          created_at: string
          id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          artista_id: string
          artista_original?: string | null
          created_at?: string
          id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          artista_id?: string
          artista_original?: string | null
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicas_repertorio_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          lida: boolean
          link: string | null
          mensagem: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem: string
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          artista_id: string
          cliente_id: string | null
          cliente_nome: string | null
          created_at: string | null
          id: string
          mensagem: string | null
          musica: string
          session_id: string | null
          status: string | null
          valor: number | null
        }
        Insert: {
          artista_id: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string | null
          musica: string
          session_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Update: {
          artista_id?: string
          cliente_id?: string | null
          cliente_nome?: string | null
          created_at?: string | null
          id?: string
          mensagem?: string | null
          musica?: string
          session_id?: string | null
          status?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_artista_id_fkey"
            columns: ["artista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo_ao_vivo: boolean | null
          bio: string | null
          cidade: string | null
          created_at: string | null
          estilo_musical: Database["public"]["Enums"]["music_style"] | null
          foto_capa_url: string | null
          foto_url: string | null
          id: string
          instagram: string | null
          link_pix: string | null
          nome: string
          pix_qr_code_url: string | null
          plano: Database["public"]["Enums"]["subscription_plan"]
          spotify: string | null
          status_destaque: boolean | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at: string | null
          youtube: string | null
        }
        Insert: {
          ativo_ao_vivo?: boolean | null
          bio?: string | null
          cidade?: string | null
          created_at?: string | null
          estilo_musical?: Database["public"]["Enums"]["music_style"] | null
          foto_capa_url?: string | null
          foto_url?: string | null
          id: string
          instagram?: string | null
          link_pix?: string | null
          nome: string
          pix_qr_code_url?: string | null
          plano?: Database["public"]["Enums"]["subscription_plan"]
          spotify?: string | null
          status_destaque?: boolean | null
          tipo: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          youtube?: string | null
        }
        Update: {
          ativo_ao_vivo?: boolean | null
          bio?: string | null
          cidade?: string | null
          created_at?: string | null
          estilo_musical?: Database["public"]["Enums"]["music_style"] | null
          foto_capa_url?: string | null
          foto_url?: string | null
          id?: string
          instagram?: string | null
          link_pix?: string | null
          nome?: string
          pix_qr_code_url?: string | null
          plano?: Database["public"]["Enums"]["subscription_plan"]
          spotify?: string | null
          status_destaque?: boolean | null
          tipo?: Database["public"]["Enums"]["user_type"]
          updated_at?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_full_profile: { Args: { profile_id: string }; Returns: boolean }
      can_view_sensitive_profile_data: {
        Args: { profile_id: string }
        Returns: boolean
      }
      criar_notificacao: {
        Args: {
          p_data?: Json
          p_link?: string
          p_mensagem: string
          p_tipo: string
          p_titulo: string
          p_usuario_id: string
        }
        Returns: string
      }
      get_artist_mercadopago_seller_id: {
        Args: { p_artist_id: string }
        Returns: string
      }
      get_artist_pix_info: {
        Args: { p_artist_id: string }
        Returns: {
          pix_chave: string
          pix_tipo_chave: string
        }[]
      }
      get_artist_platform_fee: { Args: { artist_id: string }; Returns: number }
      has_mercadopago_linked: { Args: { artist_id: string }; Returns: boolean }
      is_artist_pro: { Args: { artist_id: string }; Returns: boolean }
      is_client: { Args: { user_id: string }; Returns: boolean }
    }
    Enums: {
      music_style:
        | "rock"
        | "pop"
        | "jazz"
        | "blues"
        | "samba"
        | "mpb"
        | "sertanejo"
        | "eletronica"
        | "rap"
        | "funk"
        | "outros"
      subscription_plan: "free" | "pro"
      user_type: "artista" | "cliente"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      music_style: [
        "rock",
        "pop",
        "jazz",
        "blues",
        "samba",
        "mpb",
        "sertanejo",
        "eletronica",
        "rap",
        "funk",
        "outros",
      ],
      subscription_plan: ["free", "pro"],
      user_type: ["artista", "cliente"],
    },
  },
} as const
