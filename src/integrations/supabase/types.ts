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
      audit_logs: {
        Row: {
          acao: string
          alvo_id: string | null
          alvo_tipo: string | null
          created_at: string
          detalhes: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          acao: string
          alvo_id?: string | null
          alvo_tipo?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          acao?: string
          alvo_id?: string | null
          alvo_tipo?: string | null
          created_at?: string
          detalhes?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          cor: string | null
          created_at: string | null
          descricao: string | null
          icone: string
          id: string
          is_active: boolean | null
          meta_valor: number | null
          nome: string
          pontos_necessarios: number | null
          tipo: string
        }
        Insert: {
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone: string
          id?: string
          is_active?: boolean | null
          meta_valor?: number | null
          nome: string
          pontos_necessarios?: number | null
          tipo: string
        }
        Update: {
          cor?: string | null
          created_at?: string | null
          descricao?: string | null
          icone?: string
          id?: string
          is_active?: boolean | null
          meta_valor?: number | null
          nome?: string
          pontos_necessarios?: number | null
          tipo?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          cidade: string | null
          created_at: string | null
          disponibilidade: string | null
          email: string | null
          experiencia: string | null
          id: string
          nome: string
          observacoes: string | null
          organization_id: string | null
          status: string | null
          telefone: string
        }
        Insert: {
          cidade?: string | null
          created_at?: string | null
          disponibilidade?: string | null
          email?: string | null
          experiencia?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          organization_id?: string | null
          status?: string | null
          telefone: string
        }
        Update: {
          cidade?: string | null
          created_at?: string | null
          disponibilidade?: string | null
          email?: string | null
          experiencia?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          organization_id?: string | null
          status?: string | null
          telefone?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      course_role_permissions: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          role_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          role_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_role_permissions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          autor_id: string
          conteudo_url: string | null
          created_at: string
          data_live: string | null
          descricao: string
          duracao_minutos: number | null
          id: string
          status: Database["public"]["Enums"]["course_status"]
          tipo: Database["public"]["Enums"]["course_type"]
          titulo: string
          updated_at: string
        }
        Insert: {
          autor_id: string
          conteudo_url?: string | null
          created_at?: string
          data_live?: string | null
          descricao: string
          duracao_minutos?: number | null
          id?: string
          status?: Database["public"]["Enums"]["course_status"]
          tipo: Database["public"]["Enums"]["course_type"]
          titulo: string
          updated_at?: string
        }
        Update: {
          autor_id?: string
          conteudo_url?: string | null
          created_at?: string
          data_live?: string | null
          descricao?: string
          duracao_minutos?: number | null
          id?: string
          status?: Database["public"]["Enums"]["course_status"]
          tipo?: Database["public"]["Enums"]["course_type"]
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          categoria: string
          created_at: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          diretor_id: string | null
          id: string
          is_recurring: boolean | null
          meta_valor: number
          pontos_recompensa: number | null
          premio_descricao: string | null
          recurrence_period: string | null
          status: string | null
          tipo: string
          titulo: string
          unidade: string | null
          updated_at: string | null
          user_id: string | null
          valor_atual: number | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          diretor_id?: string | null
          id?: string
          is_recurring?: boolean | null
          meta_valor: number
          pontos_recompensa?: number | null
          premio_descricao?: string | null
          recurrence_period?: string | null
          status?: string | null
          tipo: string
          titulo: string
          unidade?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_atual?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          diretor_id?: string | null
          id?: string
          is_recurring?: boolean | null
          meta_valor?: number
          pontos_recompensa?: number | null
          premio_descricao?: string | null
          recurrence_period?: string | null
          status?: string | null
          tipo?: string
          titulo?: string
          unidade?: string | null
          updated_at?: string | null
          user_id?: string | null
          valor_atual?: number | null
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          created_at: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tags_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          id: string
          nome: string
          origem: string | null
          responsavel_id: string | null
          status: Database["public"]["Enums"]["lead_status"]
          telefone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          origem?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          origem?: string | null
          responsavel_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          autor_id: string | null
          conteudo: string | null
          created_at: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          lead_id: string
          media_url: string | null
          tipo: Database["public"]["Enums"]["message_type"]
        }
        Insert: {
          autor_id?: string | null
          conteudo?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          lead_id: string
          media_url?: string | null
          tipo?: Database["public"]["Enums"]["message_type"]
        }
        Update: {
          autor_id?: string | null
          conteudo?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          lead_id?: string
          media_url?: string | null
          tipo?: Database["public"]["Enums"]["message_type"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          codigo: string
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
        }
        Insert: {
          codigo: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
        }
        Update: {
          codigo?: string
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          autor_id: string
          created_at: string
          id: string
          lead_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          created_at?: string
          id?: string
          lead_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          unique_link: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          unique_link: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          unique_link?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          categoria: string
          created_at: string | null
          id: string
          motivo: string
          pontos: number
          referencia_id: string | null
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          id?: string
          motivo: string
          pontos: number
          referencia_id?: string | null
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          id?: string
          motivo?: string
          pontos?: number
          referencia_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          diretor_id: string | null
          email: string
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          diretor_id?: string | null
          email: string
          id: string
          nome: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          diretor_id?: string | null
          email?: string
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_diretor_id_fkey"
            columns: ["diretor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string | null
          id: string
          observacoes: string | null
          pontos_gastos: number
          reward_id: string
          status: string | null
          user_id: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          pontos_gastos: number
          reward_id: string
          status?: string | null
          user_id: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string | null
          id?: string
          observacoes?: string | null
          pontos_gastos?: number
          reward_id?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string | null
          custo_pontos: number
          descricao: string | null
          id: string
          imagem_url: string | null
          is_active: boolean | null
          quantidade_disponivel: number | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          custo_pontos: number
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          is_active?: boolean | null
          quantidade_disponivel?: number | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          custo_pontos?: number
          descricao?: string | null
          id?: string
          imagem_url?: string | null
          is_active?: boolean | null
          quantidade_disponivel?: number | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      role_module_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_id: string
          role_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id: string
          role_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_module_permissions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_module_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          descricao: string | null
          id: string
          is_system: boolean | null
          nome: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system?: boolean | null
          nome: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string | null
          id?: string
          is_system?: boolean | null
          nome?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scheduled_visits: {
        Row: {
          created_at: string
          data_visita: string
          especialista_id: string
          id: string
          lead_id: string
          observacoes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_visita: string
          especialista_id: string
          id?: string
          lead_id: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_visita?: string
          especialista_id?: string
          id?: string
          lead_id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_visits_especialista_id_fkey"
            columns: ["especialista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_visits_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          chave: string
          descricao: string | null
          updated_at: string
          valor: Json
        }
        Insert: {
          chave: string
          descricao?: string | null
          updated_at?: string
          valor: Json
        }
        Update: {
          chave?: string
          descricao?: string | null
          updated_at?: string
          valor?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          cor: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cor?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cor?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      trail_levels: {
        Row: {
          created_at: string | null
          descricao: string
          icone: string
          id: string
          is_active: boolean | null
          nivel: number
          ordem: number
          recompensa_diamantes: number | null
          recompensa_xp: number | null
          requisito_quantidade: number | null
          requisito_tipo: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          icone: string
          id?: string
          is_active?: boolean | null
          nivel: number
          ordem: number
          recompensa_diamantes?: number | null
          recompensa_xp?: number | null
          requisito_quantidade?: number | null
          requisito_tipo?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          icone?: string
          id?: string
          is_active?: boolean | null
          nivel?: number
          ordem?: number
          recompensa_diamantes?: number | null
          recompensa_xp?: number | null
          requisito_quantidade?: number | null
          requisito_tipo?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          conquistado_em: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          conquistado_em?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          conquistado_em?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_points: {
        Row: {
          created_at: string | null
          current_level: number
          id: string
          points_to_next_level: number
          total_points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_level?: number
          id?: string
          points_to_next_level?: number
          total_points?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_level?: number
          id?: string
          points_to_next_level?: number
          total_points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_progression: {
        Row: {
          created_at: string | null
          current_checkpoint: string
          diamantes: number
          id: string
          leads_cadastrados: number
          nivel_atual: number
          ofensiva_dias: number
          ultima_atividade: string | null
          updated_at: string | null
          user_id: string
          vendas_totais: number
          vidas: number
          visitas_completadas: number
        }
        Insert: {
          created_at?: string | null
          current_checkpoint?: string
          diamantes?: number
          id?: string
          leads_cadastrados?: number
          nivel_atual?: number
          ofensiva_dias?: number
          ultima_atividade?: string | null
          updated_at?: string | null
          user_id: string
          vendas_totais?: number
          vidas?: number
          visitas_completadas?: number
        }
        Update: {
          created_at?: string | null
          current_checkpoint?: string
          diamantes?: number
          id?: string
          leads_cadastrados?: number
          nivel_atual?: number
          ofensiva_dias?: number
          ultima_atividade?: string | null
          updated_at?: string | null
          user_id?: string
          vendas_totais?: number
          vidas?: number
          visitas_completadas?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trail_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          level_id: string
          progresso_atual: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level_id: string
          progresso_atual?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          level_id?: string
          progresso_atual?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trail_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "trail_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          quantidade: number
          valor_unitario: number
          visit_report_id: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          quantidade: number
          valor_unitario: number
          visit_report_id: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          quantidade?: number
          valor_unitario?: number
          visit_report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_items_visit_report_id_fkey"
            columns: ["visit_report_id"]
            isOneToOne: false
            referencedRelation: "visit_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_reports: {
        Row: {
          created_at: string
          data_visita: string
          especialista_id: string
          forma_pagamento: string | null
          id: string
          km_percorrido: number | null
          lead_id: string
          observacoes: string | null
          updated_at: string
          valor_total: number | null
          venda_realizada: boolean
        }
        Insert: {
          created_at?: string
          data_visita: string
          especialista_id: string
          forma_pagamento?: string | null
          id?: string
          km_percorrido?: number | null
          lead_id: string
          observacoes?: string | null
          updated_at?: string
          valor_total?: number | null
          venda_realizada?: boolean
        }
        Update: {
          created_at?: string
          data_visita?: string
          especialista_id?: string
          forma_pagamento?: string | null
          id?: string
          km_percorrido?: number | null
          lead_id?: string
          observacoes?: string | null
          updated_at?: string
          valor_total?: number | null
          venda_realizada?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "visit_reports_especialista_id_fkey"
            columns: ["especialista_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_reports_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connections: {
        Row: {
          api_key: string
          created_at: string | null
          evolution_api_url: string
          id: string
          instance_name: string
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          evolution_api_url: string
          id?: string
          instance_name: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          evolution_api_url?: string
          id?: string
          instance_name?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_points_to_user: {
        Args: {
          p_categoria: string
          p_motivo: string
          p_points: number
          p_referencia_id?: string
          p_user_id: string
        }
        Returns: undefined
      }
      can_view_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_lead: {
        Args: { _responsavel_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      can_view_visit: {
        Args: { _especialista_id: string; _viewer_id: string }
        Returns: boolean
      }
      check_and_grant_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      generate_unique_link: { Args: never; Returns: string }
      get_team_ids: { Args: { _diretor_id: string }; Returns: string[] }
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_module_permission: {
        Args: { _module_code: string; _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_user_points: { Args: never; Returns: undefined }
      is_in_director_team: {
        Args: { _target_user_id: string; _user_id: string }
        Returns: boolean
      }
      update_user_streak: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "diretor" | "gerente"
      course_status: "rascunho" | "publicado" | "arquivado"
      course_type: "ebook" | "aula" | "live" | "teleaula"
      lead_status: "novo" | "em_atendimento" | "fechado" | "perdido"
      message_direction: "in" | "out"
      message_type: "text" | "image" | "document" | "audio" | "video"
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
      app_role: ["admin", "diretor", "gerente"],
      course_status: ["rascunho", "publicado", "arquivado"],
      course_type: ["ebook", "aula", "live", "teleaula"],
      lead_status: ["novo", "em_atendimento", "fechado", "perdido"],
      message_direction: ["in", "out"],
      message_type: ["text", "image", "document", "audio", "video"],
    },
  },
} as const
