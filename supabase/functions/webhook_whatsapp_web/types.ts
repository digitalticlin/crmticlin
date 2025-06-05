
// Types for the webhook WhatsApp Web function
export interface WebhookData {
  instanceName: string;
  data: any;
  event: string;
}

export interface WhatsAppInstance {
  id: string;
  company_id: string;
  companies?: {
    id: string;
    name: string;
  };
  instance_name: string;
  vps_instance_id: string;
  connection_type: string;
}

export interface MessageData {
  messages?: Array<{
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
    };
  }>;
}

export interface ConnectionData {
  connection?: {
    state?: string;
  };
  lastDisconnect?: any;
}

export interface QRData {
  qr?: string;
}
