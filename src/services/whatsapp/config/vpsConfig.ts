
// VPS Configuration - CORREÇÃO FINAL: Apenas porta 3002 (3001 REMOVIDA COMPLETAMENTE)
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3002', // CORREÇÃO: URL base fixa com porta 3002
  authToken: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  
  endpoints: {
    health: '/health',
    status: '/status', // CORREÇÃO: Endpoint que vamos adicionar na VPS
    instances: '/instances',
    qrCode: '/instance/{instanceId}/qr',
    sendMessage: '/send', // CORREÇÃO: Endpoint que vamos adicionar na VPS
    createInstance: '/instance/create',
    deleteInstance: '/instance/{instanceId}',
    instanceStatus: '/instance/{instanceId}/status', // CORREÇÃO: Endpoint que vamos adicionar
    webhookGlobal: '/webhook/global',
    webhookStatus: '/webhook/global/status',
    webhookInstance: '/instance/{instanceId}/webhook'
  },
  
  // CORREÇÃO FINAL: HTTP direto apenas porta 3002
  httpDirect: {
    enabled: true,
    port: 3002, // FIXO: apenas 3002
    timeout: 15000,
    maxRetries: 3
  },
  
  timeouts: {
    connection: 15000,    // 15 seconds para HTTP direto
    message: 30000,       // 30 seconds  
    qrCode: 25000,        // 25 seconds
    health: 10000,        // 10 seconds
    discovery: 20000      // 20 seconds para descoberta
  },
  
  sync: {
    interval: 180000,           // 3 minutes
    healthCheckInterval: 120000, // 2 minutes
    debounceDelay: 1000,        // 1 second
    maxRetries: 3,
    backoffMultiplier: 2
  },

  // CORREÇÃO FINAL: HTTP Mode apenas porta 3002
  connection: {
    mode: 'http_direct',
    host: '31.97.24.222',
    port: 3002, // FIXO
    timeout: 15000
  },

  // CONFIGURAÇÃO: Webhook automático
  webhook: {
    enabled: true,
    url: 'https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web',
    events: ['qr.update', 'messages.upsert', 'connection.update'],
    automatic: true
  }
};

export const getEndpointUrl = (endpoint: string): string => {
  return `${VPS_CONFIG.baseUrl}${endpoint}`;
};

export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${VPS_CONFIG.authToken}`,
    'X-API-Token': VPS_CONFIG.authToken,
    'User-Agent': 'Supabase-WhatsApp-Client/3.0-Final-Correction',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
