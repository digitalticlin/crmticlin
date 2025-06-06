
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002',
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
    connection: 10000,
    qrCode: 30000,
    message: 15000
  },
  sync: {
    interval: 180000, // 3 minutos
    debounceDelay: 1000, // 1 segundo
    healthCheckInterval: 30000 // 30 segundos
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
