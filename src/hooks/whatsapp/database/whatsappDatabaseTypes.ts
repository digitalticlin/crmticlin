
// WhatsApp database types
export type WhatsAppStatus = 'connected' | 'connecting' | 'disconnected';

export interface WhatsAppDatabaseRecord {
  id: string;
  instance_name: string;
  phone: string;
  company_id: string;
  status: WhatsAppStatus;
  qr_code?: string;
  instance_id?: string;
  evolution_instance_name?: string;
  evolution_token?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EvolutionApiResult {
  instance: {
    instanceId: string;
    instanceName: string;
  };
  hash: string;
}
