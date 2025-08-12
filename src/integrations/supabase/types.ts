export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_agent_prompts: {
        Row: {
          agent_function: string
          agent_id: string
          agent_objective: string | null
          communication_style: string
          communication_style_examples: Json | null
          company_info: string | null
          products_services: string | null
          products_services_examples: Json | null
          rules_guidelines: string | null
          rules_guidelines_examples: Json | null
          prohibitions: string | null
          prohibitions_examples: Json | null
          client_objections: string | null
          client_objections_examples: Json | null
          phrase_tips: string | null
          phrase_tips_examples: Json | null
          flow: Json | null
          created_at: string
          created_by_user_id: string
          id: string
          updated_at: string
        }
        Insert: {
          agent_function: string
          agent_id: string
          agent_objective?: string | null
          communication_style: string
          communication_style_examples?: Json | null
          company_info?: string | null
          products_services?: string | null
          products_services_examples?: Json | null
          rules_guidelines?: string | null
          rules_guidelines_examples?: Json | null
          prohibitions?: string | null
          prohibitions_examples?: Json | null
          client_objections?: string | null
          client_objections_examples?: Json | null
          phrase_tips?: string | null
          phrase_tips_examples?: Json | null
          flow?: Json | null
          created_at?: string
          created_by_user_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          agent_function?: string
          agent_id?: string
          agent_objective?: string | null
          communication_style?: string
          communication_style_examples?: Json | null
          company_info?: string | null
          products_services?: string | null
          products_services_examples?: Json | null
          rules_guidelines?: string | null
          rules_guidelines_examples?: Json | null
          prohibitions?: string | null
          prohibitions_examples?: Json | null
          client_objections?: string | null
          client_objections_examples?: Json | null
          phrase_tips?: string | null
          phrase_tips_examples?: Json | null
          flow?: Json | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_prompts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          created_at: string
          created_by_user_id: string
          funnel_id: string | null
          id: string
          messages_count: number
          name: string
          status: string
          type: string
          updated_at: string
          whatsapp_number_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          funnel_id?: string | null
          id?: string
          messages_count?: number
          name: string
          status?: string
          type: string
          updated_at?: string
          whatsapp_number_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          funnel_id?: string | null
          id?: string
          messages_count?: number
          name?: string
          status?: string
          type?: string
          updated_at?: string
          whatsapp_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_agents_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
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
      deals: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          date: string | null
          id: string
          lead_id: string
          note: string | null
          status: string
          value: number | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          date?: string | null
          id?: string
          lead_id: string
          note?: string | null
          status: string
          value?: number | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          date?: string | null
          id?: string
          lead_id?: string
          note?: string | null
          status?: string
          value?: number | null
        }
        Relationships: [
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
          created_at: string | null
          created_by_user_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      kanban_stages: {
        Row: {
          ai_enabled: boolean
          color: string | null
          created_at: string | null
          created_by_user_id: string
          funnel_id: string
          id: string
          is_fixed: boolean | null
          is_lost: boolean | null
          is_won: boolean | null
          order_position: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean
          color?: string | null
          created_at?: string | null
          created_by_user_id: string
          funnel_id: string
          id?: string
          is_fixed?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          order_position?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string
          funnel_id?: string
          id?: string
          is_fixed?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          order_position?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kanban_stages_funnel_id_fkey"
            columns: ["funnel_id"]
            isOneToOne: false
            referencedRelation: "funnels"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tags: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
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
          company: string | null
          created_at: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name: string | null
          document_id: string | null
          email: string | null
          funnel_id: string | null
          id: string
          import_source: string | null
          kanban_stage_id: string | null
          last_message: string | null
          last_message_time: string | null
          name: string
          notes: string | null
          order_position: number | null
          owner_id: string | null
          phone: string
          purchase_value: number | null
          unread_count: number | null
          updated_at: string | null
          whatsapp_number_id: string | null
        }
        Insert: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name?: string | null
          document_id?: string | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          import_source?: string | null
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name: string
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          phone: string
          purchase_value?: number | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id?: string | null
        }
        Update: {
          address?: string | null
          company?: string | null
          created_at?: string | null
          created_by_user_id?: string
          deleted_whatsapp_instance_name?: string | null
          document_id?: string | null
          email?: string | null
          funnel_id?: string | null
          id?: string
          import_source?: string | null
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          phone?: string
          purchase_value?: number | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_whatsapp_number_id"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
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
            foreignKeyName: "leads_whatsapp_number_id_fkey"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      media_cache: {
        Row: {
          base64_data: string | null
          cached_url: string | null
          created_at: string | null
          expires_at: string | null
          external_message_id: string | null
          file_name: string | null
          file_size: number | null
          hash: string | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          message_id: string | null
          original_url: string
          processing_status: string | null
          updated_at: string | null
        }
        Insert: {
          base64_data?: string | null
          cached_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_message_id?: string | null
          file_name?: string | null
          file_size?: number | null
          hash?: string | null
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          message_id?: string | null
          original_url: string
          processing_status?: string | null
          updated_at?: string | null
        }
        Update: {
          base64_data?: string | null
          cached_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          external_message_id?: string | null
          file_name?: string | null
          file_size?: number | null
          hash?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          message_id?: string | null
          original_url?: string
          processing_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_cache_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: true
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_usage_tracking: {
        Row: {
          created_at: string
          id: string
          messages_received_count: number
          messages_sent_count: number
          period_end: string
          period_start: string
          plan_limit: number
          plan_subscription_id: string | null
          status: string
          total_messages_count: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          messages_received_count?: number
          messages_sent_count?: number
          period_end: string
          period_start: string
          plan_limit: number
          plan_subscription_id?: string | null
          status?: string
          total_messages_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          messages_received_count?: number
          messages_sent_count?: number
          period_end?: string
          period_start?: string
          plan_limit?: number
          plan_subscription_id?: string | null
          status?: string
          total_messages_count?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_usage_tracking_plan_subscription_id_fkey"
            columns: ["plan_subscription_id"]
            isOneToOne: false
            referencedRelation: "plan_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content_hash: string | null
          created_at: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name: string | null
          external_message_id: string | null
          from_me: boolean | null
          id: string
          import_source: string | null
          lead_id: string | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          text: string | null
          timestamp: string | null
          whatsapp_number_id: string | null
        }
        Insert: {
          content_hash?: string | null
          created_at?: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name?: string | null
          external_message_id?: string | null
          from_me?: boolean | null
          id?: string
          import_source?: string | null
          lead_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          text?: string | null
          timestamp?: string | null
          whatsapp_number_id?: string | null
        }
        Update: {
          content_hash?: string | null
          created_at?: string | null
          created_by_user_id?: string
          deleted_whatsapp_instance_name?: string | null
          external_message_id?: string | null
          from_me?: boolean | null
          id?: string
          import_source?: string | null
          lead_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          text?: string | null
          timestamp?: string | null
          whatsapp_number_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_messages_lead_id"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_messages_whatsapp_number_id"
            columns: ["whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
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
      plan_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          document_id: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          document_id?: string | null
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          document_id?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      storage_deletion_queue: {
        Row: {
          deleted_at: string
          file_path: string
          id: number
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          deleted_at?: string
          file_path: string
          id?: never
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          deleted_at?: string
          file_path?: string
          id?: never
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time: string | null
          function_name: string
          id: string
          result: Json | null
          status: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time?: string | null
          function_name: string
          id?: string
          result?: Json | null
          status: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time?: string | null
          function_name?: string
          id?: string
          result?: Json | null
          status?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          created_by_user_id: string
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by_user_id: string
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      usage_alerts: {
        Row: {
          acknowledged: boolean
          alert_type: string
          created_at: string
          current_usage: number
          id: string
          percentage_used: number
          plan_limit: number
          sent_at: string
          user_id: string | null
        }
        Insert: {
          acknowledged?: boolean
          alert_type: string
          created_at?: string
          current_usage: number
          id?: string
          percentage_used: number
          plan_limit: number
          sent_at?: string
          user_id?: string | null
        }
        Update: {
          acknowledged?: boolean
          alert_type?: string
          created_at?: string
          current_usage?: number
          id?: string
          percentage_used?: number
          plan_limit?: number
          sent_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_funnels: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          funnel_id: string
          id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          funnel_id: string
          id?: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
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
          created_by_user_id: string
          id: string
          profile_id: string
          whatsapp_number_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          id?: string
          profile_id: string
          whatsapp_number_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
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
      whatsapp_instances: {
        Row: {
          connection_status: string | null
          connection_type: string | null
          created_at: string | null
          created_by_user_id: string
          date_connected: string | null
          date_disconnected: string | null
          id: string
          instance_name: string
          n8n_webhook_url: string | null
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
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by_user_id: string
          date_connected?: string | null
          date_disconnected?: string | null
          id?: string
          instance_name: string
          n8n_webhook_url?: string | null
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
          connection_status?: string | null
          connection_type?: string | null
          created_at?: string | null
          created_by_user_id?: string
          date_connected?: string | null
          date_disconnected?: string | null
          id?: string
          instance_name?: string
          n8n_webhook_url?: string | null
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
        Relationships: []
      }
    }
    Views: {
      media_conversion_stats: {
        Row: {
          avg_base64_chars: number | null
          avg_size_mb: number | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          total_entries: number | null
          with_base64: number | null
          without_base64: number | null
        }
        Relationships: []
      }
      media_processing_status: {
        Row: {
          avg_size_kb: number | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          newest_entry: string | null
          oldest_entry: string | null
          pending_base64: number | null
          total: number | null
          with_base64: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      cleanup_orphan_references: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      convert_media_to_base64_manual: {
        Args: { cache_entry_id: string }
        Returns: boolean
      }
      debug_context_full: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      diagnose_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { uri: string }
          | { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { uri: string } | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { uri: string; content: string; content_type: string }
          | { uri: string; data: Json }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { uri: string; content: string; content_type: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      increment_unread_count: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      insert_lead_direct: {
        Args: { p_phone: string; p_name: string; p_user_id: string }
        Returns: Json
      }
      insert_message_bypass_rls: {
        Args: {
          p_lead_id: string
          p_whatsapp_number_id: string
          p_text: string
          p_from_me: boolean
          p_timestamp: string
          p_status: string
          p_created_by_user_id: string
          p_media_type?: string
          p_media_url?: string
        }
        Returns: string
      }
      insert_message_optimized: {
        Args: {
          p_lead_id: string
          p_instance_id: string
          p_message_text: string
          p_from_me: boolean
          p_user_id: string
          p_media_type?: string
          p_media_url?: string
          p_external_message_id?: string
        }
        Returns: Json
      }
      insert_message_safe: {
        Args: {
          p_lead_id: string
          p_instance_id: string
          p_message_text: string
          p_from_me: boolean
          p_user_id: string
          p_media_type?: string
          p_media_url?: string
          p_external_message_id?: string
        }
        Returns: Json
      }
      save_message_simple: {
        Args: {
          lead_id_param: string
          instance_id_param: string
          text_param: string
          from_me_param: boolean
          user_id_param: string
        }
        Returns: string
      }
      save_sent_message: {
        Args: {
          p_instance_id: string
          p_phone: string
          p_message: string
          p_user_id: string
          p_message_id?: string
        }
        Returns: string
      }
      save_sent_message_only: {
        Args: {
          p_vps_instance_id: string
          p_phone: string
          p_message_text: string
          p_external_message_id?: string
          p_contact_name?: string
          p_media_type?: string
          p_media_url?: string
        }
        Returns: Json
      }
      save_whatsapp_message_service_role: {
        Args: {
          p_vps_instance_id: string
          p_phone: string
          p_message_text: string
          p_from_me: boolean
          p_media_type?: string
          p_media_url?: string
          p_external_message_id?: string
          p_contact_name?: string
        }
        Returns: Json
      }
      save_whatsapp_message_simple: {
        Args: {
          p_vps_instance_id: string
          p_phone: string
          p_message_text: string
          p_from_me: boolean
          p_external_message_id?: string
        }
        Returns: Json
      }
      sync_whatsapp_instances: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_leads_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_leads_exists: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_media_system: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      user_has_whatsapp_number: {
        Args: { number_id: string }
        Returns: boolean
      }
      webhook_insert_message: {
        Args: {
          p_whatsapp_number_id: string
          p_contact_phone: string
          p_contact_name: string
          p_message_content: string
          p_message_type: string
          p_media_url?: string
        }
        Returns: Json
      }
      webhook_insert_message_debug: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      webhook_insert_message_radical: {
        Args: {
          p_whatsapp_number_id: string
          p_contact_phone: string
          p_contact_name: string
          p_message_content: string
          p_message_type: string
          p_media_url?: string
        }
        Returns: Json
      }
    }
    Enums: {
      media_type: "text" | "image" | "video" | "audio" | "document"
      message_status: "sent" | "delivered" | "read" | "failed" | "received"
      user_role: "admin" | "operational" | "manager"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      media_type: ["text", "image", "video", "audio", "document"],
      message_status: ["sent", "delivered", "read", "failed", "received"],
      user_role: ["admin", "operational", "manager"],
    },
  },
} as const
