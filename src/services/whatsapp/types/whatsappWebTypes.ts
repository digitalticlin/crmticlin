
// WhatsApp Web.js Service Types
export interface WhatsAppWebInstance {
  id: string;
  instance_name: string;
  connection_type: 'web';
  server_url: string;
  vps_instance_id: string;
  web_status: string;
  connection_status: string;
  qr_code?: string;
  phone?: string;
  profile_name?: string;
  company_id: string;
}

export interface ServiceResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface InstanceResponse extends ServiceResponse {
  instance?: WhatsAppWebInstance;
}

export interface QRCodeResponse extends ServiceResponse {
  qrCode?: string;
}

export interface ServerHealthResponse extends ServiceResponse {
  status?: string;
  uptime?: string;
  activeInstances?: number;
  timestamp?: string;
}

// CORREÇÃO: Interface para resposta de envio de mensagem
export interface MessageSendResponse extends ServiceResponse {
  messageId?: string;
  timestamp?: string;
  leadId?: string;
}

// CORREÇÃO: Interface para resposta de sincronização
export interface SyncResponse extends ServiceResponse {
  data?: {
    summary?: {
      updated: number;
      preserved: number;
      adopted: number;
      errors: number;
    };
    instances?: any[];
  };
}

// VPS Server Communication Types
export interface VPSCreateInstanceRequest {
  instanceId: string;
  sessionName: string;
  webhookUrl?: string;
}

export interface VPSDeleteInstanceRequest {
  instanceId: string;
}

export interface VPSInstanceStatusRequest {
  instanceId: string;
}
