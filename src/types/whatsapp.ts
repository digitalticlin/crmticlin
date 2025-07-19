
export type WhatsAppConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'ready' 
  | 'open'
  | 'close'
  | 'error';

export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  vps_instance_id?: string;
  connection_status: WhatsAppConnectionStatus;
  web_status?: string;
  phone?: string;
  profile_name?: string;
  profile_pic_url?: string;
  qr_code?: string;
  session_data?: any;
  date_connected?: string;
  date_disconnected?: string;
  server_url?: string;
  n8n_webhook_url?: string;
  connection_type: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}
