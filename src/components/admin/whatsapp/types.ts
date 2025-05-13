
export interface WhatsAppInstance {
  id: string;
  name: string;
  phone: string;
  instanceName: string;
  company: string;
  companyId: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  lastActivity: string;
  messages: number;
}

export interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  details?: string;
}
