
export type WhatsAppConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'ready' 
  | 'open'
  | 'close'
  | 'error'
  | 'waiting_qr'
  | 'database_only'
  | 'vps_error'
  | 'qr_ready';

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

export interface ServiceResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface InstanceResponse {
  success: boolean;
  error?: string;
  instance?: WhatsAppWebInstance;
}

export interface MessageSendResponse {
  success: boolean;
  error?: string;
  messageId?: string;
  timestamp?: string;
  leadId?: string;
}

export interface SyncResponse {
  success: boolean;
  error?: string;
  data?: {
    summary: {
      updated: number;
      preserved: number;
      adopted: number;
      errors: number;
    };
    instances: WhatsAppWebInstance[];
  };
}

export interface ServerHealthResponse {
  success: boolean;
  error?: string;
  data?: {
    status: string;
    server?: string;
    version?: string;
    port?: number;
    dockerRunning?: boolean;
    pm2Running?: boolean;
    latency?: number;
    uptime?: number;
    permanent_mode?: boolean;
    permanentMode?: boolean;
    active_instances?: number;
    activeInstances?: number;
    timestamp?: string;
  };
}

export interface QRCodeResponse {
  success: boolean;
  error?: string;
  qrCode?: string;
  waiting?: boolean;
}
