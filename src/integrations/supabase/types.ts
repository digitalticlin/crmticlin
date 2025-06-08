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
      ai_agent_whatsapp_numbers: {
        Row: {
          ai_agent_id: string
          created_at: string | null
          id: string
          whatsapp_number_id: string
        }
        Insert: {
          ai_agent_id: string
          created_at?: string | null
          id?: string
          whatsapp_number_id: string
        }
        Update: {
          ai_agent_id?: string
          created_at?: string | null
          id?: string
          whatsapp_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_whatsapp_numbers_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agent_whatsapp_numbers_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          active: boolean | null
          company_id: string
          created_at: string | null
          created_by: string
          id: string
          name: string
          profile: string
          prompt: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          company_id: string
          created_at?: string | null
          created_by: string
          id?: string
          name: string
          profile: string
          prompt: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          company_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          name?: string
          profile?: string
          prompt?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_logs: {
        Row: {
          ai_agent_id: string
          created_at: string | null
          id: string
          input: string | null
          lead_id: string
          output: string | null
          processing_time: number | null
          tokens_used: number | null
        }
        Insert: {
          ai_agent_id: string
          created_at?: string | null
          id?: string
          input?: string | null
          lead_id: string
          output?: string | null
          processing_time?: number | null
          tokens_used?: number | null
        }
        Update: {
          ai_agent_id?: string
          created_at?: string | null
          id?: string
          input?: string | null
          lead_id?: string
          output?: string | null
          processing_time?: number | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_sync_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          errors_count: number | null
          execution_duration_ms: number | null
          execution_time: string | null
          id: string
          instances_added: number | null
          instances_found: number | null
          instances_updated: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          errors_count?: number | null
          execution_duration_ms?: number | null
          execution_time?: string | null
          id?: string
          instances_added?: number | null
          instances_found?: number | null
          instances_updated?: number | null
          status: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          errors_count?: number | null
          execution_duration_ms?: number | null
          execution_time?: string | null
          id?: string
          instances_added?: number | null
          instances_found?: number | null
          instances_updated?: number | null
          status?: string
        }
        Relationships: []
      }
      broadcast_lists: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string
          end_time: string | null
          id: string
          name: string
          progress: number | null
          scheduled_date: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["broadcast_status"] | null
          updated_at: string | null
          whatsapp_number_id: string
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by: string
          end_time?: string | null
          id?: string
          name: string
          progress?: number | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"] | null
          updated_at?: string | null
          whatsapp_number_id: string
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string
          end_time?: string | null
          id?: string
          name?: string
          progress?: number | null
          scheduled_date?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"] | null
          updated_at?: string | null
          whatsapp_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_lists_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_lists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_lists_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_messages: {
        Row: {
          broadcast_list_id: string
          content: string
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          updated_at: string | null
          variation_number: number
        }
        Insert: {
          broadcast_list_id: string
          content: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
          variation_number: number
        }
        Update: {
          broadcast_list_id?: string
          content?: string
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
          variation_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_messages_broadcast_list_id_fkey"
            columns: ["broadcast_list_id"]
            isOneToOne: false
            referencedRelation: "broadcast_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_recipients: {
        Row: {
          broadcast_list_id: string
          created_at: string | null
          error: string | null
          id: string
          phone: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          broadcast_list_id: string
          created_at?: string | null
          error?: string | null
          id?: string
          phone: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          broadcast_list_id?: string
          created_at?: string | null
          error?: string | null
          id?: string
          phone?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_recipients_broadcast_list_id_fkey"
            columns: ["broadcast_list_id"]
            isOneToOne: false
            referencedRelation: "broadcast_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          active: boolean | null
          created_at: string | null
          document_id: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          document_id?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      dashboard_configs: {
        Row: {
          company_id: string
          config_data: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          config_data?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          config_data?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          created_at: string | null
          created_by: string | null
          date: string | null
          id: string
          lead_id: string
          note: string | null
          status: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          lead_id: string
          note?: string | null
          status: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          status?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      funnels: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by_user_id: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnels_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_stages: {
        Row: {
          color: string | null
          company_id: string | null
          created_at: string | null
          created_by_user_id: string
          funnel_id: string | null
          id: string
          is_fixed: boolean | null
          is_hidden: boolean | null
          is_lost: boolean | null
          is_won: boolean | null
          order_position: number
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_user_id: string
          funnel_id?: string | null
          id?: string
          is_fixed?: boolean | null
          is_hidden?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          order_position: number
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by_user_id?: string
          funnel_id?: string | null
          id?: string
          is_fixed?: boolean | null
          is_hidden?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          order_position?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kanban_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_contacts: {
        Row: {
          contact_type: string
          contact_value: string
          created_at: string | null
          id: string
          is_primary: boolean | null
          lead_id: string
          updated_at: string | null
        }
        Insert: {
          contact_type: string
          contact_value: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id: string
          updated_at?: string | null
        }
        Update: {
          contact_type?: string
          contact_value?: string
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          lead_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
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
          address: string | null
          city: string | null
          company: string | null
          company_id: string | null
          country: string | null
          created_at: string | null
          created_by_user_id: string | null
          document_id: string | null
          document_type: string | null
          email: string | null
          funnel_id: string | null
          id: string
          kanban_stage_id: string | null
          last_message: string | null
          last_message_time: string | null
          name: string | null
          notes: string | null
          order_position: number | null
          owner_id: string | null
          phone: string
          purchase_value: number | null
          state: string | null
          unread_count: number | null
          updated_at: string | null
          whatsapp_number_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          document_id?: string | null
          document_type?: string | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string | null
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          phone: string
          purchase_value?: number | null
          state?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_id?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          document_id?: string | null
          document_type?: string | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string | null
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          phone?: string
          purchase_value?: number | null
          state?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id?: string
          zip_code?: string | null
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
            foreignKeyName: "leads_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_kanban_stage_id_fkey"
            columns: ["kanban_stage_id"]
            isOneToOne: false
            referencedRelation: "kanban_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          created_by_user_id: string | null
          external_id: string | null
          from_me: boolean
          id: string
          lead_id: string
          media_type: string | null
          media_url: string | null
          status: string | null
          text: string | null
          timestamp: string | null
          whatsapp_number_id: string
        }
        Insert: {
          created_by_user_id?: string | null
          external_id?: string | null
          from_me: boolean
          id?: string
          lead_id: string
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          whatsapp_number_id: string
        }
        Update: {
          created_by_user_id?: string | null
          external_id?: string | null
          from_me?: boolean
          id?: string
          lead_id?: string
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          text?: string | null
          timestamp?: string | null
          whatsapp_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          price: number
          updated_at: string | null
          users_limit: number
          whatsapp_limit: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name: string
          price: number
          updated_at?: string | null
          users_limit: number
          whatsapp_limit: number
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          updated_at?: string | null
          users_limit?: number
          whatsapp_limit?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_document: string | null
          company_id: string | null
          company_name: string | null
          created_at: string | null
          document_id: string | null
          full_name: string | null
          id: string
          must_change_password: boolean | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_document?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          document_id?: string | null
          full_name?: string | null
          id: string
          must_change_password?: boolean | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_document?: string | null
          company_id?: string | null
          company_name?: string | null
          created_at?: string | null
          document_id?: string | null
          full_name?: string | null
          id?: string
          must_change_password?: boolean | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_history: {
        Row: {
          amount_paid: number | null
          company_id: string
          created_at: string | null
          end_date: string | null
          id: string
          payment_method: string | null
          plan_id: string
          start_date: string
        }
        Insert: {
          amount_paid?: number | null
          company_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_method?: string | null
          plan_id: string
          start_date: string
        }
        Update: {
          amount_paid?: number | null
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_method?: string | null
          plan_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          company_id: string
          created_at: string | null
          end_date: string | null
          id: string
          payment_status: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_status?: string
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          end_date?: string | null
          id?: string
          payment_status?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time: unknown | null
          function_name: string
          id: string
          result: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time?: unknown | null
          function_name: string
          id?: string
          result?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time?: unknown | null
          function_name?: string
          id?: string
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          company_id: string
          created_at: string | null
          created_by_user_id: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color: string
          company_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string
          company_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          team_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          team_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          company_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_funnels: {
        Row: {
          created_at: string | null
          funnel_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          funnel_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          funnel_id?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_funnels_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_funnels_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_whatsapp_numbers: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string
          whatsapp_number_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id: string
          whatsapp_number_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string
          whatsapp_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_whatsapp_numbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_whatsapp_numbers_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_connection_logs: {
        Row: {
          created_at: string | null
          details: string | null
          id: string
          whatsapp_number_id: string
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          id?: string
          whatsapp_number_id: string
        }
        Update: {
          created_at?: string | null
          details?: string | null
          id?: string
          whatsapp_number_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_connection_logs_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_instances: {
        Row: {
          client_name: string | null
          company_id: string | null
          connection_status: string | null
          connection_type: string | null
          created_at: string | null
          created_by_user_id: string | null
          date_connected: string | null
          date_disconnected: string | null
          history_imported: boolean | null
          id: string
          instance_id: string | null
          instance_name: string
          number: string | null
          owner_jid: string | null
          phone: string | null
          profile_name: string | null
          profile_pic_url: string | null
          qr_code: string | null
          server_url: string | null
          session_data: Json | null
          updated_at: string | null
          vps_instance_id: string | null
          web_status: string | null
        }
        Insert: {
          client_name?: string | null
          company_id?: string | null
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          date_connected?: string | null
          date_disconnected?: string | null
          history_imported?: boolean | null
          id?: string
          instance_id?: string | null
          instance_name: string
          number?: string | null
          owner_jid?: string | null
          phone?: string | null
          profile_name?: string | null
          profile_pic_url?: string | null
          qr_code?: string | null
          server_url?: string | null
          session_data?: Json | null
          updated_at?: string | null
          vps_instance_id?: string | null
          web_status?: string | null
        }
        Update: {
          client_name?: string | null
          company_id?: string | null
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          date_connected?: string | null
          date_disconnected?: string | null
          history_imported?: boolean | null
          id?: string
          instance_id?: string | null
          instance_name?: string
          number?: string | null
          owner_jid?: string | null
          phone?: string | null
          profile_name?: string | null
          profile_pic_url?: string | null
          qr_code?: string | null
          server_url?: string | null
          session_data?: Json | null
          updated_at?: string | null
          vps_instance_id?: string | null
          web_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_numbers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_company: {
        Args: { company_name: string; company_document_id?: string }
        Returns: string
      }
      get_current_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_orphan_instances_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_unread_count: {
        Args: { lead_uuid: string }
        Returns: undefined
      }
      is_company_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_current_user_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: { lead_uuid: string }
        Returns: undefined
      }
      update_user_company: {
        Args: { company_name: string; company_document_id?: string }
        Returns: boolean
      }
      user_can_access_lead: {
        Args: { lead_uuid: string }
        Returns: boolean
      }
      user_has_whatsapp_number: {
        Args: { whatsapp_number_uuid: string }
        Returns: boolean
      }
      user_owns_resource: {
        Args: { resource_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      broadcast_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "error"
        | "paused"
      user_role: "admin" | "operational" | "manager"
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
    Enums: {
      broadcast_status: [
        "scheduled",
        "in_progress",
        "completed",
        "error",
        "paused",
      ],
      user_role: ["admin", "operational", "manager"],
    },
  },
} as const
