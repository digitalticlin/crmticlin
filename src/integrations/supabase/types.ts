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
          communication_style: string
          company_info: string | null
          created_at: string
          created_by_user_id: string
          id: string
          objectives: Json
          product_service_info: string | null
          prohibitions: string | null
          updated_at: string
        }
        Insert: {
          agent_function: string
          agent_id: string
          communication_style: string
          company_info?: string | null
          created_at?: string
          created_by_user_id: string
          id?: string
          objectives?: Json
          product_service_info?: string | null
          prohibitions?: string | null
          updated_at?: string
        }
        Update: {
          agent_function?: string
          agent_id?: string
          communication_style?: string
          company_info?: string | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          objectives?: Json
          product_service_info?: string | null
          prohibitions?: string | null
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
          file_name: string | null
          file_size: number | null
          hash: string | null
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          message_id: string | null
          original_url: string
          updated_at: string | null
        }
        Insert: {
          base64_data?: string | null
          cached_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          hash?: string | null
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          message_id?: string | null
          original_url: string
          updated_at?: string | null
        }
        Update: {
          base64_data?: string | null
          cached_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          file_name?: string | null
          file_size?: number | null
          hash?: string | null
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          message_id?: string | null
          original_url?: string
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
      messages: {
        Row: {
          content_hash: string | null
          created_at: string | null
          created_by_user_id: string
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
      cleanup_orphan_references: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      insert_whatsapp_message_safe: {
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
      process_whatsapp_message: {
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
      sync_whatsapp_instances: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      user_has_whatsapp_number: {
        Args: { number_id: string }
        Returns: boolean
      }
    }
    Enums: {
      media_type: "text" | "image" | "video" | "audio" | "document"
      message_status: "sent" | "delivered" | "read" | "failed" | "received"
      user_role: "admin" | "operational" | "manager"
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
      media_type: ["text", "image", "video", "audio", "document"],
      message_status: ["sent", "delivered", "read", "failed", "received"],
      user_role: ["admin", "operational", "manager"],
    },
  },
} as const
