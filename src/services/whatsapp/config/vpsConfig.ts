
// VPS Configuration - CORREÇÃO FINAL: VPS correta unificada
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001', // CORREÇÃO: VPS correta unificada
  authToken: 'bJyn3eUPFTRFNCxxLNd8KH5bI4Zg7bpUk7ADO6kXf49026a1', // Token correto
  
  endpoints: {
    health: '/health',
    status: '/status',
    instances: '/instances',
    qrCode: '/instance/{instanceId}/qr',
    sendMessage: '/send',
    createInstance: '/instance/create',
    deleteInstance: '/instance/{instanceId}',
    instanceStatus: '/instance/{instanceId}/status',
    webhookGlobal: '/webhook/global',
    webhookStatus: '/webhook/global/status',
    webhookInstance: '/instance/{instanceId}/webhook'
  },
  
  // CORREÇÃO FINAL: HTTP direto apenas porta 3001
  httpDirect: {
    enabled: true,
    port: 3001, // CORREÇÃO: porta correta
    timeout: 15000,
    maxRetries: 3
  },
  
  timeouts: {
    connection: 15000,
    message: 30000,
    qrCode: 25000,
    health: 10000,
    discovery: 20000
  },
  
  sync: {
    interval: 180000,
    healthCheckInterval: 120000,
    debounceDelay: 1000,
    maxRetries: 3,
    backoffMultiplier: 2
  },

  // CORREÇÃO FINAL: HTTP Mode apenas porta 3001
  connection: {
    mode: 'http_direct',
    host: '31.97.163.57', // CORREÇÃO: IP correto
    port: 3001, // CORREÇÃO: porta correta
    timeout: 15000
  },

  // CONFIGURAÇÃO: Webhook automático
  webhook: {
    enabled: true,
    url: 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web',
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
