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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ai_agents: {
        Row: {
          agent_function: string | null
          agent_objective: string | null
          client_objections: Json | null
          communication_style: string | null
          communication_style_examples: Json | null
          company_info: string | null
          created_at: string
          created_by_user_id: string
          flow: Json | null
          funnel_configuration: Json | null
          funnel_id: string | null
          id: string
          messages_count: number
          name: string
          products_services: string | null
          prohibitions: Json | null
          rules_guidelines: Json | null
          status: string
          type: string
          updated_at: string
          whatsapp_number_id: string | null
        }
        Insert: {
          agent_function?: string | null
          agent_objective?: string | null
          client_objections?: Json | null
          communication_style?: string | null
          communication_style_examples?: Json | null
          company_info?: string | null
          created_at?: string
          created_by_user_id: string
          flow?: Json | null
          funnel_configuration?: Json | null
          funnel_id?: string | null
          id?: string
          messages_count?: number
          name: string
          products_services?: string | null
          prohibitions?: Json | null
          rules_guidelines?: Json | null
          status?: string
          type: string
          updated_at?: string
          whatsapp_number_id?: string | null
        }
        Update: {
          agent_function?: string | null
          agent_objective?: string | null
          client_objections?: Json | null
          communication_style?: string | null
          communication_style_examples?: Json | null
          company_info?: string | null
          created_at?: string
          created_by_user_id?: string
          flow?: Json | null
          funnel_configuration?: Json | null
          funnel_id?: string | null
          id?: string
          messages_count?: number
          name?: string
          products_services?: string | null
          prohibitions?: Json | null
          rules_guidelines?: Json | null
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
      broadcast_campaigns: {
        Row: {
          business_hours_only: boolean | null
          created_at: string | null
          created_by_user_id: string
          failed_count: number | null
          id: string
          media_type: string | null
          media_url: string | null
          message_text: string
          name: string
          rate_limit_per_minute: number | null
          schedule_type: string | null
          scheduled_at: string | null
          sent_count: number | null
          status: string | null
          target_config: Json | null
          target_type: string
          timezone: string | null
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          created_at?: string | null
          created_by_user_id: string
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_text: string
          name: string
          rate_limit_per_minute?: number | null
          schedule_type?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_config?: Json | null
          target_type: string
          timezone?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          created_at?: string | null
          created_by_user_id?: string
          failed_count?: number | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          message_text?: string
          name?: string
          rate_limit_per_minute?: number | null
          schedule_type?: string | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_config?: Json | null
          target_type?: string
          timezone?: string | null
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      broadcast_history: {
        Row: {
          campaign_id: string
          created_at: string | null
          error_message: string | null
          external_message_id: string | null
          id: string
          lead_id: string | null
          phone: string
          queue_id: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          phone: string
          queue_id?: string | null
          sent_at?: string | null
          status: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          error_message?: string | null
          external_message_id?: string | null
          id?: string
          lead_id?: string | null
          phone?: string
          queue_id?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_history_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_history_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "broadcast_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_queue: {
        Row: {
          campaign_id: string
          contact_name: string | null
          created_at: string | null
          external_message_id: string | null
          id: string
          last_error: string | null
          lead_id: string | null
          max_retries: number | null
          media_type: string | null
          media_url: string | null
          message_text: string
          phone: string
          priority: number | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          whatsapp_instance_id: string
        }
        Insert: {
          campaign_id: string
          contact_name?: string | null
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string | null
          max_retries?: number | null
          media_type?: string | null
          media_url?: string | null
          message_text: string
          phone: string
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp_instance_id: string
        }
        Update: {
          campaign_id?: string
          contact_name?: string | null
          created_at?: string | null
          external_message_id?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string | null
          max_retries?: number | null
          media_type?: string | null
          media_url?: string | null
          message_text?: string
          phone?: string
          priority?: number | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          whatsapp_instance_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_queue_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_queue_whatsapp_instance_id_fkey"
            columns: ["whatsapp_instance_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_rate_limits: {
        Row: {
          created_at: string | null
          current_date_value: string | null
          current_minute: string | null
          id: string
          messages_sent_current_minute: number | null
          total_messages_today: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_date_value?: string | null
          current_minute?: string | null
          id?: string
          messages_sent_current_minute?: number | null
          total_messages_today?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_date_value?: string | null
          current_minute?: string | null
          id?: string
          messages_sent_current_minute?: number | null
          total_messages_today?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dashboard_configs: {
        Row: {
          created_by_user_id: string
          layout_config: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_by_user_id: string
          layout_config: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_by_user_id?: string
          layout_config?: Json
          updated_at?: string
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "funnels_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      kanban_stages: {
        Row: {
          ai_enabled: boolean
          ai_notify_enabled: boolean | null
          ai_stage_description: string | null
          color: string | null
          created_at: string | null
          created_by_user_id: string
          funnel_id: string
          id: string
          is_fixed: boolean | null
          is_lost: boolean | null
          is_won: boolean | null
          notify_phone: string | null
          order_position: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_enabled?: boolean
          ai_notify_enabled?: boolean | null
          ai_stage_description?: string | null
          color?: string | null
          created_at?: string | null
          created_by_user_id: string
          funnel_id: string
          id?: string
          is_fixed?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          notify_phone?: string | null
          order_position?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_enabled?: boolean
          ai_notify_enabled?: boolean | null
          ai_stage_description?: string | null
          color?: string | null
          created_at?: string | null
          created_by_user_id?: string
          funnel_id?: string
          id?: string
          is_fixed?: boolean | null
          is_lost?: boolean | null
          is_won?: boolean | null
          notify_phone?: string | null
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
          city: string | null
          company: string | null
          company_address: string | null
          company_cidade: string | null
          company_cnpj: string | null
          company_estado: string | null
          company_segment: string | null
          conversation_status: string | null
          country: string | null
          created_at: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name: string | null
          document_id: string | null
          email: string | null
          funnel_id: string | null
          has_company: boolean | null
          id: string
          import_source: string | null
          kanban_stage_id: string | null
          last_message: string | null
          last_message_time: string | null
          name: string
          neighborhood: string | null
          notes: string | null
          order_position: number | null
          owner_id: string | null
          owner_id_backup: string | null
          phone: string
          profile_pic_media_cache_id: string | null
          profile_pic_url: string | null
          purchase_value: number | null
          state: string | null
          unread_count: number | null
          updated_at: string | null
          whatsapp_number_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_address?: string | null
          company_cidade?: string | null
          company_cnpj?: string | null
          company_estado?: string | null
          company_segment?: string | null
          conversation_status?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id: string
          deleted_whatsapp_instance_name?: string | null
          document_id?: string | null
          email?: string | null
          funnel_id?: string | null
          has_company?: boolean | null
          id?: string
          import_source?: string | null
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name: string
          neighborhood?: string | null
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          owner_id_backup?: string | null
          phone: string
          profile_pic_media_cache_id?: string | null
          profile_pic_url?: string | null
          purchase_value?: number | null
          state?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company?: string | null
          company_address?: string | null
          company_cidade?: string | null
          company_cnpj?: string | null
          company_estado?: string | null
          company_segment?: string | null
          conversation_status?: string | null
          country?: string | null
          created_at?: string | null
          created_by_user_id?: string
          deleted_whatsapp_instance_name?: string | null
          document_id?: string | null
          email?: string | null
          funnel_id?: string | null
          has_company?: boolean | null
          id?: string
          import_source?: string | null
          kanban_stage_id?: string | null
          last_message?: string | null
          last_message_time?: string | null
          name?: string
          neighborhood?: string | null
          notes?: string | null
          order_position?: number | null
          owner_id?: string | null
          owner_id_backup?: string | null
          phone?: string
          profile_pic_media_cache_id?: string | null
          profile_pic_url?: string | null
          purchase_value?: number | null
          state?: string | null
          unread_count?: number | null
          updated_at?: string | null
          whatsapp_number_id?: string | null
          zip_code?: string | null
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
            foreignKeyName: "leads_profile_pic_media_cache_id_fkey"
            columns: ["profile_pic_media_cache_id"]
            isOneToOne: false
            referencedRelation: "media_cache"
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
          ai_description: string | null
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
          ai_description?: string | null
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
          ai_description?: string | null
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
      performance_metrics: {
        Row: {
          created_at: string | null
          id: number
          metric_name: string
          metric_value: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          metric_name: string
          metric_value?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          metric_name?: string
          metric_value?: number | null
        }
        Relationships: []
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
          avatar_url: string | null
          created_at: string | null
          created_by_user_id: string | null
          department: string | null
          document_id: string | null
          email: string | null
          full_name: string
          id: string
          invite_expires_at: string | null
          invite_sent_at: string | null
          invite_status: string | null
          invite_token: string | null
          is_active: boolean | null
          last_login_at: string | null
          linked_auth_user_id: string | null
          phone: string | null
          position: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          temp_password: string | null
          updated_at: string | null
          username: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          department?: string | null
          document_id?: string | null
          email?: string | null
          full_name: string
          id: string
          invite_expires_at?: string | null
          invite_sent_at?: string | null
          invite_status?: string | null
          invite_token?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          linked_auth_user_id?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          temp_password?: string | null
          updated_at?: string | null
          username?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by_user_id?: string | null
          department?: string | null
          document_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          invite_expires_at?: string | null
          invite_sent_at?: string | null
          invite_status?: string | null
          invite_token?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          linked_auth_user_id?: string | null
          phone?: string | null
          position?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          temp_password?: string | null
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
      [_ in never]: never
    }
    Functions: {
      _preserve_name: {
        Args: { existing: string; incoming: string }
        Returns: string
      }
      accept_team_invite_safely: {
        Args:
          | { p_auth_user_id: string; p_invite_token: string }
          | { p_auth_user_id: string; p_invite_token: string }
        Returns: Json
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      check_rate_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_orphan_references: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      convert_media_to_base64_manual: {
        Args: { cache_entry_id: string }
        Returns: boolean
      }
      create_broadcast_queue: {
        Args: { p_campaign_id: string; p_user_id: string }
        Returns: number
      }
      debug_context_full: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      diagnose_permissions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      disable_cron_jobs: {
        Args: { job_ids: number[] }
        Returns: string[]
      }
      emergency_disable_cron: {
        Args: { p_jobid: number }
        Returns: string
      }
      fix_all_leads_ownership: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      fix_existing_leads_owner_id: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      format_brazilian_phone: {
        Args: { input_phone: string }
        Returns: Json
      }
      get_funnel_owner: {
        Args: { funnel_id_param: string }
        Returns: string
      }
      get_instance_owner: {
        Args: { p_admin_user_id: string; p_instance_id: string }
        Returns: string
      }
      get_instance_owner_with_fallback: {
        Args: { p_admin_user_id: string; p_instance_id: string }
        Returns: string
      }
      get_profile_pic_queue_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          newest_message: string
          oldest_message: string
          queue_name: string
          queue_size: number
        }[]
      }
      get_user_broadcast_campaigns: {
        Args: { p_user_id: string }
        Returns: {
          business_hours_only: boolean
          created_at: string
          failed_count: number
          id: string
          media_type: string
          media_url: string
          message_text: string
          name: string
          rate_limit_per_minute: number
          schedule_type: string
          scheduled_at: string
          sent_count: number
          status: string
          target_config: Json
          target_type: string
          timezone: string
          total_recipients: number
          updated_at: string
        }[]
      }
      get_whatsapp_owner: {
        Args: { whatsapp_id_param: string }
        Returns: string
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
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
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
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
      increment_rate_limit: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      increment_unread_count: {
        Args: { p_lead_id: string }
        Returns: undefined
      }
      insert_lead_direct: {
        Args: { p_name: string; p_phone: string; p_user_id: string }
        Returns: Json
      }
      insert_message_bypass_rls: {
        Args: {
          p_created_by_user_id: string
          p_from_me: boolean
          p_lead_id: string
          p_media_type?: string
          p_media_url?: string
          p_status: string
          p_text: string
          p_timestamp: string
          p_whatsapp_number_id: string
        }
        Returns: string
      }
      insert_message_optimized: {
        Args: {
          p_external_message_id?: string
          p_from_me: boolean
          p_instance_id: string
          p_lead_id: string
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_user_id: string
        }
        Returns: Json
      }
      insert_message_safe: {
        Args: {
          p_external_message_id?: string
          p_from_me: boolean
          p_instance_id: string
          p_lead_id: string
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_user_id: string
        }
        Returns: Json
      }
      pgmq_delete: {
        Args: { p_msg_id: number; p_queue_name: string }
        Returns: undefined
      }
      pgmq_read: {
        Args: { p_qty?: number; p_queue_name: string; p_vt?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
          read_ct: number
          vt_at: string
        }[]
      }
      pgmq_send: {
        Args: { msg: Json; queue_name: string }
        Returns: number
      }
      process_media_queue_worker: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      process_profile_pic_download_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_count: number
          processed_count: number
          queue_size: number
        }[]
      }
      process_profile_pic_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_count: number
          processed_count: number
          queue_size: number
        }[]
      }
      read_media_queue: {
        Args: { p_qty?: number }
        Returns: {
          enqueued_at: string
          message: Json
          msg_id: number
        }[]
      }
      reassign_funnel_leads: {
        Args: { p_funnel_id: string; p_new_owner_id?: string }
        Returns: Json
      }
      reassign_whatsapp_leads: {
        Args: { p_new_owner_id?: string; p_whatsapp_id: string }
        Returns: Json
      }
      remove_user_completely: {
        Args: { user_email: string }
        Returns: Json
      }
      save_message_simple: {
        Args: {
          from_me_param: boolean
          instance_id_param: string
          lead_id_param: string
          text_param: string
          user_id_param: string
        }
        Returns: string
      }
      save_sent_message: {
        Args: {
          p_instance_id: string
          p_message: string
          p_message_id?: string
          p_phone: string
          p_user_id: string
        }
        Returns: string
      }
      save_sent_message_only: {
        Args: {
          p_contact_name?: string
          p_external_message_id?: string
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_phone: string
          p_vps_instance_id: string
        }
        Returns: Json
      }
      save_whatsapp_message_ai_agent: {
        Args: {
          p_contact_name?: string
          p_external_message_id?: string
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_phone: string
          p_vps_instance_id: string
        }
        Returns: Json
      }
      save_whatsapp_message_complete: {
        Args:
          | {
              p_contact_name: string
              p_external_message_id: string
              p_formatted_phone: string
              p_from_me: boolean
              p_instance_id: string
              p_media_type: string
              p_media_url: string
              p_message_text: string
              p_user_id: string
            }
          | {
              p_contact_name?: string
              p_external_message_id?: string
              p_from_me: boolean
              p_media_type?: string
              p_media_url?: string
              p_message_text: string
              p_phone: string
              p_vps_instance_id: string
            }
        Returns: Json
      }
      save_whatsapp_message_complete_v2: {
        Args: {
          p_contact_name?: string
          p_external_message_id?: string
          p_from_me: boolean
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_phone: string
          p_vps_instance_id: string
        }
        Returns: Json
      }
      save_whatsapp_message_service_role: {
        Args: {
          p_contact_name?: string
          p_external_message_id?: string
          p_from_me: boolean
          p_media_type?: string
          p_media_url?: string
          p_message_text: string
          p_phone: string
          p_profile_pic_url?: string
          p_vps_instance_id: string
        }
        Returns: Json
      }
      save_whatsapp_message_simple: {
        Args: {
          p_external_message_id?: string
          p_from_me: boolean
          p_message_text: string
          p_phone: string
          p_vps_instance_id: string
        }
        Returns: Json
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      sync_lead_ownership: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_fallback: number
          funnel_assignments: number
          leads_synced: number
          total_leads: number
          whatsapp_assignments: number
        }[]
      }
      sync_whatsapp_instances: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_leads_access: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_leads_exists: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_media_queue_fixed: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      test_media_system: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      test_owner_assignment: {
        Args: Record<PropertyKey, never>
        Returns: {
          details: string
          result: string
          test_case: string
        }[]
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      unaccent: {
        Args: { "": string }
        Returns: string
      }
      unaccent_init: {
        Args: { "": unknown }
        Returns: unknown
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
          p_contact_name: string
          p_contact_phone: string
          p_media_url?: string
          p_message_content: string
          p_message_type: string
          p_whatsapp_number_id: string
        }
        Returns: Json
      }
      webhook_insert_message_debug: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      webhook_insert_message_radical: {
        Args: {
          p_contact_name: string
          p_contact_phone: string
          p_media_url?: string
          p_message_content: string
          p_message_type: string
          p_whatsapp_number_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      media_type: "text" | "image" | "video" | "audio" | "document"
      message_status: "sent" | "delivered" | "read" | "failed" | "received"
      user_role: "admin" | "operational"
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
      user_role: ["admin", "operational"],
    },
  },
} as const
