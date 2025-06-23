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
          funnel_id: string
          id: string
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
          funnel_id: string
          id?: string
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
          funnel_id?: string
          id?: string
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
      messages: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          from_me: boolean | null
          id: string
          lead_id: string | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          status: Database["public"]["Enums"]["message_status"] | null
          text: string | null
          timestamp: string | null
          whatsapp_number_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          from_me?: boolean | null
          id?: string
          lead_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
          text?: string | null
          timestamp?: string | null
          whatsapp_number_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          from_me?: boolean | null
          id?: string
          lead_id?: string | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          status?: Database["public"]["Enums"]["message_status"] | null
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
      sync_whatsapp_instances: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      media_type: "text" | "image" | "video" | "audio" | "document"
      message_status: "sent" | "delivered" | "read" | "failed"
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
      media_type: ["text", "image", "video", "audio", "document"],
      message_status: ["sent", "delivered", "read", "failed"],
      user_role: ["admin", "operational", "manager"],
    },
  },
} as const
