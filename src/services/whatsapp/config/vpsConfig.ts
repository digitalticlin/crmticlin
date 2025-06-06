
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001', // CORREÇÃO: Alterado de 3002 para 3001
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
    connection: 15000, // Aumentado de 10s para 15s
    qrCode: 45000, // Aumentado de 30s para 45s
    message: 20000 // Aumentado de 15s para 20s
  },
  sync: {
    interval: 120000, // Reduzido de 180s para 120s (2 minutos)
    debounceDelay: 800, // Reduzido de 1000ms para 800ms
    healthCheckInterval: 20000 // Reduzido de 30s para 20s
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
