
// Security fix: Remove hardcoded credentials and use environment variables
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.163.57:3001',
  // authToken will be retrieved from Edge Function secrets
  
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
  
  httpDirect: {
    enabled: true,
    port: 3001,
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

  connection: {
    mode: 'http_direct',
    host: '31.97.163.57',
    port: 3001,
    timeout: 15000
  },

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

// Security fix: Remove hardcoded token - will be handled by Edge Functions
export const getRequestHeaders = (): Record<string, string> => {
  return {
    'Content-Type': 'application/json',
    'User-Agent': 'Supabase-WhatsApp-Client/3.0-Secured',
    'Accept': 'application/json'
  };
};

export const formatInstanceEndpoint = (endpoint: string, instanceId: string): string => {
  return endpoint.replace('{instanceId}', instanceId);
};
