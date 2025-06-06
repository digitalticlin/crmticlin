
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001', // CORREÇÃO: Porta correta 3001
  authToken: 'default-token',
  endpoints: {
    health: '/health',
    instances: '/instances',
    createInstance: '/instance/create',
    deleteInstance: '/instance/delete',
    sendMessage: '/send',
    getQR: '/instance/{instanceId}/qr',
    getStatus: '/instance/{instanceId}/status',
    configureWebhook: '/instance/{instanceId}/webhook',
    restart: '/instance/restart'
  },
  webhook: {
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['messages.upsert', 'qr.update', 'connection.update']
  },
  timeouts: {
    connection: 15000,
    qrCode: 45000,
    message: 20000
  },
  sync: {
    interval: 120000,
    debounceDelay: 800,
    healthCheckInterval: 20000
  }
} as const;

export type VPSConfig = typeof VPS_CONFIG;

// Funções utilitárias para construir URLs e headers
export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`
  };
};
