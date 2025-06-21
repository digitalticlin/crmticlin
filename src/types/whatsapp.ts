
export type WhatsAppConnectionStatus = 
  | "disconnected" 
  | "connecting" 
  | "connected" 
  | "error" 
  | "qr_ready" 
  | "authenticating";

export interface WhatsAppWebResult {
  success: boolean;
  instanceId?: string;
  qrCode?: string;
  sessionData?: any;
  error?: string;
}

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  phone?: string;
  created_by_user_id: string;
  connection_status: WhatsAppConnectionStatus;
  connection_type: string;
  server_url?: string;
  vps_instance_id?: string;
  web_status?: string;
  qr_code?: string;
  session_data?: any;
  profile_name?: string;
  profile_pic_url?: string;
  date_connected?: string;
  date_disconnected?: string;
  created_at: string;
  updated_at: string;
  n8n_webhook_url?: string;
}

export interface WhatsAppMessage {
  id: string;
  text?: string;
  from_me: boolean;
  timestamp: string;
  status: "sent" | "delivered" | "read" | "failed";
  media_type?: "text" | "image" | "video" | "audio" | "document";
  media_url?: string;
  whatsapp_number_id: string;
  lead_id?: string;
  created_by_user_id: string;
  created_at: string;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  profile_pic_url?: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  whatsapp_number_id: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}
